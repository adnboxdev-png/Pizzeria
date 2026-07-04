export type UserRole = "admin" | "cocina" | "supervisor" | "mesero";

export type OrderStatus =
  | "pendiente"
  | "en_preparacion"
  | "lista"
  | "entregada"
  | "cancelada";

export interface ProductSize {
  name: string;
  price: number;
}

export interface ProductFlavor {
  name: string;
  extra_price: number;
}

export interface Profile {
  id: string;
  full_name: string;
  role: UserRole;
  active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  image_url: string | null;
  base_price: number;
  sizes: ProductSize[];
  flavors: ProductFlavor[];
  active: boolean;
  created_at: string;
  created_by: string | null;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  product_name: string;
  size_name: string | null;
  size_price: number;
  flavor_name: string | null;
  flavor_extra: number;
  quantity: number;
  subtotal: number;
  notes: string | null;
}

export interface Order {
  id: string;
  table_number: string;
  waiter_id: string;
  status: OrderStatus;
  notes: string | null;
  total: number;
  created_at: string;
  started_at: string | null;
  ready_at: string | null;
  delivered_at: string | null;
  order_items?: OrderItem[];
  profiles?: Profile;
}

// Tipo mínimo requerido por supabase-js genérico. Puedes ampliarlo
// con `supabase gen types typescript` cuando quieras tipado 100% estricto.
export interface Database {
  public: {
    Tables: {
      profiles: { Row: Profile; Insert: Partial<Profile>; Update: Partial<Profile> };
      products: { Row: Product; Insert: Partial<Product>; Update: Partial<Product> };
      orders: { Row: Order; Insert: Partial<Order>; Update: Partial<Order> };
      order_items: { Row: OrderItem; Insert: Partial<OrderItem>; Update: Partial<OrderItem> };
    };
  };
}
