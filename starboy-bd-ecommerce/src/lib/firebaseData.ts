"use client";

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
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

  private async readRows(): Promise<any[]> {
    if (!db) return [];

    const snap = await getDocs(collection(db, this.collectionName));
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

    if (typeof this.maxRows === "number") {
      rows = rows.slice(0, this.maxRows);
    }

    if (this.selectText.includes("product:products(*)")) {
      rows = await Promise.all(
        rows.map(async (row) => {
          if (!row.productId || !db) return row;
          const productSnap = await getDoc(doc(db, "products", row.productId));
          return {
            ...row,
            product: productSnap.exists() ? normalizeDoc(productSnap) : null,
          };
        })
      );
    }

    return rows;
  }

  private async executeSelect(): Promise<FirebaseResult> {
    const rows = await this.readRows();
    return {
      data: this.singleRow ? rows[0] || null : rows,
      error: null,
    };
  }

  private async executeInsert(): Promise<FirebaseResult> {
    if (!db) throw new Error("Firebase Firestore is not initialized");

    const items = Array.isArray(this.payload) ? this.payload : [this.payload];
    const inserted: any[] = [];

    for (const item of items) {
      const cleanItem = { ...item };
      const explicitId = cleanItem.id;
      delete cleanItem.id;

      const createdAtPayload = {
        ...cleanItem,
        createdAt: cleanItem.createdAt || new Date().toISOString(),
      };

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

    const rows = await this.readRows();

    for (const row of rows) {
      await updateDoc(doc(db, this.collectionName, row.id), {
        ...this.payload,
        updatedAt: new Date().toISOString(),
      });
    }

    return { data: rows.map((row) => ({ ...row, ...this.payload })), error: null };
  }

  private async executeUpsert(): Promise<FirebaseResult> {
    if (!db) throw new Error("Firebase Firestore is not initialized");

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
          { ...item, updatedAt: new Date().toISOString() },
          { merge: true }
        );
        saved.push({ ...match, ...item });
      } else {
        const cleanItem = { ...item };
        const explicitId = cleanItem.id;
        delete cleanItem.id;

        const createdAtPayload = {
          ...cleanItem,
          createdAt: cleanItem.createdAt || new Date().toISOString(),
        };

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

    const rows = await this.readRows();

    for (const row of rows) {
      await deleteDoc(doc(db, this.collectionName, row.id));
    }

    return { data: rows, error: null };
  }
}

export const firebaseData = {
  from(collectionName: string) {
    return new FirebaseDataQuery(collectionName);
  },
};
