import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  where,
  orderBy as firestoreOrderBy,
  limit as firestoreLimit,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

type Filter = {
  field: string;
  op: "eq" | "neq";
  value: any;
};

type Order = {
  field: string;
  ascending: boolean;
};

type FirebaseResult<T = any> = {
  data: T | null;
  error: { message: string } | null;
};

// Firestore rejects `undefined` field values. Recursively strip them from any
// write payload so optional fields (e.g. offerPrice) that are left blank don't
// crash setDoc/updateDoc. Nested objects/arrays are cleaned too.
function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((v) => stripUndefined(v)) as unknown as T;
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    const out: any = {};
    for (const [k, v] of Object.entries(value as Record<string, any>)) {
      if (v === undefined) continue; // drop undefined fields entirely
      out[k] = stripUndefined(v);
    }
    return out;
  }
  return value;
}

function normalizeDateValue(value: any) {
  if (value?.toDate && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return value;
}

function normalizeDoc<T = any>(snap: any): T {
  const raw = snap.data() || {};
  const normalized = Object.fromEntries(
    Object.entries(raw).map(([key, value]) => [key, normalizeDateValue(value)])
  );
  return { id: snap.id, ...normalized } as T;
}

function compareValues(a: any, b: any) {
  if (a === b) return 0;
  if (a === undefined || a === null) return -1;
  if (b === undefined || b === null) return 1;
  return a > b ? 1 : -1;
}

class FirebaseDataQuery {
  private action: "select" | "insert" | "update" | "upsert" | "delete" = "select";
  private payload: any;
  private filters: Filter[] = [];
  private orders: Order[] = [];
  private maxRows?: number;
  private singleRow = false;
  private selectText = "*";
  private conflictFields: string[] = [];

  constructor(private collectionName: string) {}

  select(fields = "*") {
    this.action = "select";
    this.selectText = fields;
    return this;
  }

  insert(payload: any) {
    this.action = "insert";
    this.payload = payload;
    return this;
  }

  update(payload: any) {
    this.action = "update";
    this.payload = payload;
    return this;
  }

  upsert(payload: any, options?: { onConflict?: string }) {
    this.action = "upsert";
    this.payload = payload;
    this.conflictFields = options?.onConflict
      ? options.onConflict.split(",").map((field) => field.trim()).filter(Boolean)
      : [];
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  eq(field: string, value: any) {
    this.filters.push({ field, op: "eq", value });
    return this;
  }

  neq(field: string, value: any) {
    this.filters.push({ field, op: "neq", value });
    return this;
  }

  order(field: string, options?: { ascending?: boolean }) {
    this.orders.push({ field, ascending: options?.ascending !== false });
    return this;
  }

  limit(count: number) {
    this.maxRows = count;
    return this;
  }

  single() {
    this.singleRow = true;
    return this;
  }

  then<TResult1 = FirebaseResult, TResult2 = never>(
    onfulfilled?: ((value: FirebaseResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.execute().then(onfulfilled, onrejected);
  }

  // Allow `.catch()` / `.finally()` directly on a query, so callers can do
  // `firebaseData.from(...).insert(...).catch(() => {})` (fire-and-forget).
  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | null
  ): Promise<FirebaseResult | TResult> {
    return this.execute().catch(onrejected);
  }

  finally(onfinally?: (() => void) | null): Promise<FirebaseResult> {
    return this.execute().finally(onfinally);
  }

  private async execute(): Promise<FirebaseResult> {
    if (!db) {
      return {
        data: this.singleRow ? null : [],
        error: { message: "Firebase Firestore is not initialized" },
      };
    }
    try {
      if (this.action === "insert") return await this.executeInsert();
      if (this.action === "update") return await this.executeUpdate();
      if (this.action === "upsert") return await this.executeUpsert();
      if (this.action === "delete") return await this.executeDelete();
      return await this.executeSelect();
    } catch (error: any) {
      return {
        data: this.singleRow ? null : [],
        error: { message: error?.message || "Firestore request failed" },
      };
    }
  }

  // Attach a joined product document when select includes product:products(*).
  private async attachJoins(rows: any[]): Promise<any[]> {
    if (!db || !this.selectText.includes("product:products(*)")) return rows;
    const database = db;
    return Promise.all(
      rows.map(async (row) => {
        if (!row.productId) return row;
        const productSnap = await getDoc(doc(database, "products", row.productId));
        return {
          ...row,
          product: productSnap.exists() ? normalizeDoc(productSnap) : null,
        };
      })
    );
  }

  // OPTIMIZED: minimise Firestore document reads.
  //  1. A lookup by document id is a single getDoc (1 read).
  //  2. Equality filters use a server-side where()/orderBy()/limit() query so
  //     only matching docs are billed — even when no order() is supplied.
  //  3. Queries with a limit but an unsupported filter (e.g. neq) fetch only a
  //     small bounded window instead of the entire collection.
  private async readRows(): Promise<any[]> {
    if (!db) return [];
    const database = db;

    // ---- Fast path: single document fetched directly by its id. ----
    if (
      this.filters.length === 1 &&
      this.filters[0].field === "id" &&
      this.filters[0].op === "eq"
    ) {
      const snap = await getDoc(doc(database, this.collectionName, this.filters[0].value));
      if (!snap.exists()) return [];
      const row: any = normalizeDoc(snap);
      if (row.schemaOnly === true) return [];
      return this.attachJoins([row]);
    }

    const hasOnlyEqFilters = this.filters.every((f) => f.op === "eq");
    const hasAtMostTwoOrders = this.orders.length <= 2;

    // ---- Server-side query path: all filters are equality (order optional). ----
    if (hasOnlyEqFilters && hasAtMostTwoOrders) {
      try {
        const colRef = collection(database, this.collectionName);
        const constraints: any[] = [];

        for (const filter of this.filters) {
          constraints.push(where(filter.field, "==", filter.value));
        }
        for (const order of this.orders) {
          constraints.push(firestoreOrderBy(order.field, order.ascending ? "asc" : "desc"));
        }
        if (typeof this.maxRows === "number") {
          // +1 so schemaOnly rows that get filtered out don't shrink the result.
          constraints.push(firestoreLimit(this.maxRows + 1));
        }

        const q = constraints.length ? query(colRef, ...constraints) : colRef;
        const snap = await getDocs(q);
        let rows = snap.docs
          .map((item) => normalizeDoc(item))
          .filter((row: any) => row.schemaOnly !== true);
        if (typeof this.maxRows === "number") rows = rows.slice(0, this.maxRows);
        return this.attachJoins(rows);
      } catch (e) {
        console.warn("Server query failed, falling back to client-side:", e);
      }
    }

    // ---- Bounded fallback: query has a limit but an unsupported filter. ----
    // Fetch only a small window (limit + buffer) rather than the whole collection.
    if (typeof this.maxRows === "number") {
      try {
        const colRef = collection(database, this.collectionName);
        const constraints: any[] = [];
        // Equality filters can still be pushed to the server.
        for (const filter of this.filters) {
          if (filter.op === "eq") constraints.push(where(filter.field, "==", filter.value));
        }
        for (const order of this.orders) {
          constraints.push(firestoreOrderBy(order.field, order.ascending ? "asc" : "desc"));
        }
        // Buffer covers rows removed by neq / schemaOnly filtering below.
        constraints.push(firestoreLimit(this.maxRows + 8));

        const snap = await getDocs(query(colRef, ...constraints));
        let rows = snap.docs
          .map((item) => normalizeDoc(item))
          .filter((row: any) => row.schemaOnly !== true);
        for (const filter of this.filters) {
          if (filter.op === "neq") rows = rows.filter((row) => row[filter.field] !== filter.value);
        }
        rows = rows.slice(0, this.maxRows);
        return this.attachJoins(rows);
      } catch (e) {
        console.warn("Bounded query failed, falling back to full scan:", e);
      }
    }

    // ---- Last resort: download all and filter client-side. ----
    const snap = await getDocs(collection(database, this.collectionName));
    let rows = snap.docs
      .map((item) => normalizeDoc(item))
      .filter((row: any) => row.schemaOnly !== true);

    for (const filter of this.filters) {
      rows = rows.filter((row) => {
        if (filter.op === "eq") return row[filter.field] === filter.value;
        if (filter.op === "neq") return row[filter.field] !== filter.value;
        return true;
      });
    }
    for (const order of this.orders) {
      rows.sort((a, b) => {
        const result = compareValues(a[order.field], b[order.field]);
        return order.ascending ? result : -result;
      });
    }
    if (typeof this.maxRows === "number") rows = rows.slice(0, this.maxRows);
    return this.attachJoins(rows);
  }

  private cacheKey(): string {
    return JSON.stringify({
      c: this.collectionName,
      s: this.selectText,
      f: this.filters,
      o: this.orders,
      m: this.maxRows,
      one: this.singleRow,
    });
  }

  private async executeSelect(): Promise<FirebaseResult> {
    // Volatile collections (live chat, orders) must always be fresh.
    const VOLATILE = new Set(["chat_messages", "orders", "page_views"]);
    const cacheable = !VOLATILE.has(this.collectionName);

    if (cacheable) {
      const key = this.cacheKey();
      const cached = SELECT_CACHE.get(key);
      if (cached && Date.now() - cached.at < SELECT_CACHE_TTL) {
        return cached.value;
      }
    }
    const rows = await this.readRows();
    const result: FirebaseResult = {
      data: this.singleRow ? rows[0] || null : rows,
      error: null,
    };
    if (cacheable) SELECT_CACHE.set(this.cacheKey(), { at: Date.now(), value: result });
    return result;
  }

  private async executeInsert(): Promise<FirebaseResult> {
    if (!db) throw new Error("Firebase Firestore is not initialized");
    clearSelectCache();
    const items = Array.isArray(this.payload) ? this.payload : [this.payload];
    const inserted: any[] = [];
    for (const item of items) {
      const cleanItem = { ...item };
      const explicitId = cleanItem.id;
      delete cleanItem.id;
      const createdAtPayload = stripUndefined({
        ...cleanItem,
        createdAt: cleanItem.createdAt || new Date().toISOString(),
      });
      if (explicitId) {
        await setDoc(doc(db, this.collectionName, explicitId), createdAtPayload, { merge: true });
        inserted.push({ id: explicitId, ...createdAtPayload });
      } else {
        const ref = await addDoc(collection(db, this.collectionName), createdAtPayload);
        inserted.push({ id: ref.id, ...createdAtPayload });
      }
    }
    return { data: Array.isArray(this.payload) ? inserted : inserted[0], error: null };
  }

  private async executeUpdate(): Promise<FirebaseResult> {
    if (!db) throw new Error("Firebase Firestore is not initialized");
    clearSelectCache();
    const database = db;

    // Fast path: update a single document by id with no extra read.
    if (
      this.filters.length === 1 &&
      this.filters[0].field === "id" &&
      this.filters[0].op === "eq"
    ) {
      const id = this.filters[0].value;
      const payload = stripUndefined({ ...this.payload, updatedAt: new Date().toISOString() });
      await updateDoc(doc(database, this.collectionName, id), payload);
      return { data: [{ id, ...payload }], error: null };
    }

    const rows = await this.readRows();
    for (const row of rows) {
      await updateDoc(doc(database, this.collectionName, row.id), stripUndefined({
        ...this.payload,
        updatedAt: new Date().toISOString(),
      }));
    }
    return { data: rows.map((row) => ({ ...row, ...this.payload })), error: null };
  }

  private async executeUpsert(): Promise<FirebaseResult> {
    if (!db) throw new Error("Firebase Firestore is not initialized");
    clearSelectCache();
    const items = Array.isArray(this.payload) ? this.payload : [this.payload];
    const saved: any[] = [];
    for (const item of items) {
      const filters = this.conflictFields.map((field) => ({
        field,
        op: "eq" as const,
        value: item[field],
      }));
      const finder = new FirebaseDataQuery(this.collectionName);
      finder.filters = filters;
      const existing = await finder.readRows();
      const match = existing[0];
      if (match) {
        await setDoc(
          doc(db, this.collectionName, match.id),
          stripUndefined({ ...item, updatedAt: new Date().toISOString() }),
          { merge: true }
        );
        saved.push({ ...match, ...item });
      } else {
        const cleanItem = { ...item };
        const explicitId = cleanItem.id;
        delete cleanItem.id;
        const createdAtPayload = stripUndefined({
          ...cleanItem,
          createdAt: cleanItem.createdAt || new Date().toISOString(),
        });
        if (explicitId) {
          await setDoc(doc(db, this.collectionName, explicitId), createdAtPayload, { merge: true });
          saved.push({ id: explicitId, ...createdAtPayload });
        } else {
          const ref = await addDoc(collection(db, this.collectionName), createdAtPayload);
          saved.push({ id: ref.id, ...createdAtPayload });
        }
      }
    }
    return { data: Array.isArray(this.payload) ? saved : saved[0], error: null };
  }

  private async executeDelete(): Promise<FirebaseResult> {
    if (!db) throw new Error("Firebase Firestore is not initialized");
    clearSelectCache();
    const rows = await this.readRows();
    for (const row of rows) {
      await deleteDoc(doc(db, this.collectionName, row.id));
    }
    return { data: rows, error: null };
  }
}

/**
 * Short-lived in-memory SELECT cache.
 *
 * Many components independently read the same reference collections
 * (e.g. `settings`, `categories`) on the same page load. Caching SELECT
 * results for a few seconds collapses those duplicate reads into a single
 * Firestore round-trip, which directly lowers daily read quota usage.
 * Any write (insert/update/upsert/delete) clears the cache so data stays fresh.
 */
const SELECT_CACHE = new Map<string, { at: number; value: FirebaseResult }>();
const SELECT_CACHE_TTL = 15000; // 15s — long enough to dedupe a page load.

function clearSelectCache() {
  SELECT_CACHE.clear();
}

export const firebaseData = {
  from(collectionName: string) {
    return new FirebaseDataQuery(collectionName);
  },
};
