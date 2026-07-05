"use client";

import type { CartLine } from "@/types/cart";
import { lineSubtotal } from "@/types/cart";

export function Cart({
  tableNumber,
  onTableNumberChange,
  lines,
  onRemove,
  onSubmit,
  submitting
}: {
  tableNumber: string;
  onTableNumberChange: (v: string) => void;
  lines: CartLine[];
  onRemove: (key: string) => void;
  onSubmit: () => void;
  submitting: boolean;
}) {
  const total = lines.reduce((sum, l) => sum + lineSubtotal(l), 0);

  return (
    <div className="bg-white rounded-2xl border border-carbon/10 p-5 sticky top-20">
      <h2 className="font-display text-lg text-carbon mb-3">Orden actual</h2>

      <div className="mb-4">
        <label className="block text-sm text-humo mb-1">Mesa</label>
        <input
          value={tableNumber}
          onChange={(e) => onTableNumberChange(e.target.value)}
          placeholder="Ej. 5"
          className="w-full rounded-lg border border-carbon/15 px-3 py-2"
        />
      </div>

      {lines.length === 0 ? (
        <p className="text-sm text-humo/70 py-6 text-center">Aún no has agregado productos.</p>
      ) : (
        <ul className="divide-y divide-carbon/10 mb-4 max-h-[45vh] overflow-y-auto">
          {lines.map((l) => (
            <li key={l.key} className="py-2.5 flex justify-between items-start gap-2">
              <div>
                <p className="text-sm font-medium text-carbon">
                  {l.quantity}× {l.product_name}
                  {l.size_name ? ` (${l.size_name})` : ""}
                </p>
                {l.flavor_name && <p className="text-xs text-humo">{l.flavor_name}</p>}
                {l.notes && <p className="text-xs text-tomateOsc">{l.notes}</p>}
              </div>
              <div className="text-right shrink-0">
                <p className="text-sm text-carbon">${lineSubtotal(l).toFixed(2)}</p>
                <button onClick={() => onRemove(l.key)} className="text-xs text-humo hover:text-tomate">
                  quitar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <div className="flex justify-between items-center border-t border-carbon/10 pt-3 mb-4">
        <span className="text-sm text-humo">Total</span>
        <span className="font-display text-xl text-tomate">${total.toFixed(2)}</span>
      </div>

      <button
        onClick={onSubmit}
        disabled={submitting || lines.length === 0 || !tableNumber.trim()}
        className="w-full bg-albahaca hover:opacity-90 transition-opacity text-white rounded-xl py-3 font-medium disabled:opacity-50"
      >
        {submitting ? "Enviando…" : "Enviar orden a cocina"}
      </button>
    </div>
  );
}
