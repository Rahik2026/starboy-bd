// Server Component with ISR. The product catalog + categories are fetched once
// on the server and cached (revalidate hourly), shared across all visitors,
// then handed to the interactive client UI. No per-visitor catalog reads.
import { Suspense } from "react";
import ShopClient from "@/app/ShopClient";
import { getAllProducts, getCategories } from "@/lib/serverData";

export const revalidate = 3600;

export default async function ShopPage() {
  const [products, categories] = await Promise.all([
    getAllProducts(),
    getCategories(),
  ]);

  return (
    <Suspense fallback={<div className="min-h-screen bg-surface flex items-center justify-center"><div className="w-8 h-8 border-2 border-brand-700 border-t-transparent rounded-full animate-spin" /></div>}>
      <ShopClient initialProducts={products as any} initialCategories={categories as any} />
    </Suspense>
  );
}
