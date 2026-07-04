export interface CartLine {
  key: string;
  product_id: string;
  product_name: string;
  size_name: string | null;
  size_price: number;
  flavor_name: string | null;
  flavor_extra: number;
  quantity: number;
  notes: string | null;
}

export function lineSubtotal(line: CartLine): number {
  return (line.size_price + line.flavor_extra) * line.quantity;
}
