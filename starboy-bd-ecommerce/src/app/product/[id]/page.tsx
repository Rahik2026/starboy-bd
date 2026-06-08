// Server Component with ISR. The product, related items and initial reviews are
// fetched once on the server and cached (revalidate every 30 min), shared across
// visitors. Interactive features (cart, wishlist, chat, posting reviews) remain
// fully client-side inside ProductClient.
import { notFound } from "next/navigation";
import ProductClient from "./ProductClient";
import {
  getProductBySlug,
  getAllProducts,
  REVALIDATE,
} from "@/lib/serverData";
import type { Product, Review } from "@/types";

export const revalidate = 1800; // 30 minutes

const PROJECT_ID = "dg-hub-841e8";
const API_KEY = "AIzaSyCUIN5oRpr47c4JjK-8e_efta_Weh60Akc";

// Initial reviews via REST (cached). Live updates still happen client-side.
async function getInitialReviews(productId: string): Promise<Review[]> {
  try {
    const body = {
      structuredQuery: {
        from: [{ collectionId: "reviews" }],
        where: {
          fieldFilter: {
            field: { fieldPath: "productId" },
            op: "EQUAL",
            value: { stringValue: productId },
          },
        },
        limit: 20,
      },
    };
    const res = await fetch(
      `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        next: { revalidate: REVALIDATE.product },
      }
    );
    if (!res.ok) return [];
    const rows = await res.json();
    // runQuery returns an array of { document } objects.
    return (rows || [])
      .filter((r: any) => r.document)
      .map((r: any) => decodeReview(r.document));
  } catch {
    return [];
  }
}

function decodeReview(doc: any): any {
  const id = doc.name?.split("/").pop();
  const f = doc.fields || {};
  const val = (v: any): any => {
    if (!v) return null;
    if ("stringValue" in v) return v.stringValue;
    if ("integerValue" in v) return Number(v.integerValue);
    if ("doubleValue" in v) return v.doubleValue;
    if ("booleanValue" in v) return v.booleanValue;
    if ("timestampValue" in v) return v.timestampValue;
    if ("arrayValue" in v) return (v.arrayValue.values || []).map(val);
    if ("mapValue" in v) {
      const o: any = {};
      for (const [k, vv] of Object.entries(v.mapValue.fields || {})) o[k] = val(vv);
      return o;
    }
    return null;
  };
  const out: any = { id };
  for (const [k, v] of Object.entries(f)) out[k] = val(v);
  return out;
}

export default async function ProductPage({
  params,
}: {
  params: { id: string };
}) {
  const slug = params.id;
  const product = (await getProductBySlug(slug)) as Product | null;

  if (!product) {
    notFound();
  }

  const [all, initialReviews] = await Promise.all([
    getAllProducts(),
    getInitialReviews(product.id),
  ]);

  const initialRelated = (all as Product[])
    .filter((x) => x.slug !== slug && x.id !== product.id)
    .slice(0, 4);

  return (
    <ProductClient
      initialProduct={product}
      initialRelated={initialRelated}
      initialReviews={initialReviews}
      slug={slug}
    />
  );
}
