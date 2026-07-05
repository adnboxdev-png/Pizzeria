"use client";

import type { Product } from "@/types/database";

const CATEGORY_LABEL: Record<string, string> = {
  pizza: "Pizzas",
  alitas: "Alitas",
  papas: "Papas",
  bebida: "Bebidas",
  postre: "Postres",
  otro: "Otros"
};

export function ProductGrid({ products, onSelect }: { products: Product[]; onSelect: (p: Product) => void }) {
  const byCategory = new Map<string, Product[]>();
  for (const p of products) {
    if (!byCategory.has(p.category)) byCategory.set(p.category, []);
    byCategory.get(p.category)!.push(p);
  }

  return (
    <div className="space-y-6">
      {Array.from(byCategory.entries()).map(([category, list]) => (
        <div key={category}>
          <h3 className="font-display text-lg text-carbon mb-3">{CATEGORY_LABEL[category] ?? category}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {list.map((p) => {
              const priceLabel =
                p.sizes.length > 0
                  ? `desde $${Math.min(...p.sizes.map((s) => s.price))}`
                  : `$${p.base_price}`;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelect(p)}
                  className="bg-white rounded-xl border border-carbon/10 overflow-hidden text-left hover:border-tomate/50 hover:shadow-md transition-all active:scale-[0.98]"
                >
                  <div className="aspect-square bg-carbon/5 flex items-center justify-center overflow-hidden">
                    {p.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">🍕</span>
                    )}
                  </div>
                  <div className="p-2.5">
                    <p className="font-medium text-carbon text-sm leading-tight">{p.name}</p>
                    <p className="text-xs text-tomate mt-0.5">{priceLabel}</p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
