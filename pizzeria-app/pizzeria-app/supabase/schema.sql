-- =========================================================
-- ESQUEMA: Control de Sucursal - Pizzería
-- Ejecutar en Supabase: SQL Editor > New query > pegar todo
-- =========================================================

-- Extensión necesaria para uuid
create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------
-- 1. ROLES Y PERFILES DE USUARIO
-- ---------------------------------------------------------
-- Los 4 usuarios de la app viven en auth.users (Supabase Auth).
-- Esta tabla guarda el rol y si el usuario está activo o no.
create type public.user_role as enum ('admin', 'cocina', 'supervisor', 'mesero');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.user_role not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- 2. PRODUCTOS (soft delete con "active", nunca se borran)
-- ---------------------------------------------------------
create table public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  category text not null, -- pizza, alitas, papas, bebida, etc
  image_url text,
  base_price numeric(10,2) not null default 0,
  -- tamaños: [{ "name": "Chica", "price": 89 }, { "name": "Grande", "price": 149 }]
  sizes jsonb not null default '[]'::jsonb,
  -- sabores/extras con costo adicional: [{ "name": "BBQ", "extra_price": 15 }]
  flavors jsonb not null default '[]'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references public.profiles(id)
);

-- ---------------------------------------------------------
-- 3. ÓRDENES
-- ---------------------------------------------------------
create type public.order_status as enum (
  'pendiente',      -- recién creada por el mesero
  'en_preparacion', -- cocina la tomó
  'lista',          -- cocina la concluyó
  'entregada',      -- mesero la entregó (cierra la venta)
  'cancelada'
);

create table public.orders (
  id uuid primary key default uuid_generate_v4(),
  table_number text not null,
  waiter_id uuid not null references public.profiles(id),
  status public.order_status not null default 'pendiente',
  notes text,
  total numeric(10,2) not null default 0,
  created_at timestamptz not null default now(),
  started_at timestamptz,   -- cuando cocina la toma
  ready_at timestamptz,     -- cuando cocina la concluye
  delivered_at timestamptz  -- cuando el mesero la entrega
);

create table public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id),
  product_name text not null,   -- se guarda copia por si el producto se desactiva
  size_name text,
  size_price numeric(10,2) not null default 0,
  flavor_name text,
  flavor_extra numeric(10,2) not null default 0,
  quantity int not null default 1,
  subtotal numeric(10,2) not null default 0,
  notes text
);

-- Índices para que cocina/supervisor consulten rápido por orden de llegada
create index idx_orders_status_created on public.orders (status, created_at);
create index idx_order_items_order on public.order_items (order_id);
create index idx_products_active on public.products (active);

-- ---------------------------------------------------------
-- 4. FUNCIONES DE APOYO
-- ---------------------------------------------------------
-- Devuelve el rol del usuario autenticado actual
create or replace function public.current_role()
returns public.user_role
language sql stable
as $$
  select role from public.profiles where id = auth.uid();
$$;

-- Recalcula el total de una orden a partir de sus items
create or replace function public.recalc_order_total()
returns trigger
language plpgsql
as $$
begin
  update public.orders
  set total = (
    select coalesce(sum(subtotal), 0) from public.order_items where order_id = coalesce(new.order_id, old.order_id)
  )
  where id = coalesce(new.order_id, old.order_id);
  return null;
end;
$$;

create trigger trg_recalc_total_ins
after insert or update or delete on public.order_items
for each row execute function public.recalc_order_total();

-- ---------------------------------------------------------
-- 5. ROW LEVEL SECURITY
-- ---------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

-- PROFILES: cualquier usuario autenticado puede leer perfiles (para ver nombres
-- de meseros/cocineros en supervisor/admin). Solo admin puede insertar/editar/desactivar.
create policy "profiles_select_all_authenticated"
on public.profiles for select
to authenticated
using (true);

create policy "profiles_admin_write"
on public.profiles for all
to authenticated
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

-- PRODUCTS: todos los autenticados pueden ver productos activos.
-- Solo admin puede crear/editar/desactivar (update, no delete).
create policy "products_select_active_or_admin"
on public.products for select
to authenticated
using (active = true or public.current_role() = 'admin');

create policy "products_admin_insert"
on public.products for insert
to authenticated
with check (public.current_role() = 'admin');

create policy "products_admin_update"
on public.products for update
to authenticated
using (public.current_role() = 'admin')
with check (public.current_role() = 'admin');

-- Nadie puede hacer delete real (ni siquiera admin) -> se maneja desde la app con "active=false"
-- (no se crea policy de delete, por lo tanto queda bloqueado)

-- ORDERS: mesero crea sus órdenes y ve las suyas; cocina ve todas para atenderlas;
-- supervisor y admin ven todas.
create policy "orders_select_by_role"
on public.orders for select
to authenticated
using (
  public.current_role() in ('admin', 'supervisor', 'cocina')
  or (public.current_role() = 'mesero' and waiter_id = auth.uid())
);

create policy "orders_insert_mesero"
on public.orders for insert
to authenticated
with check (public.current_role() = 'mesero' and waiter_id = auth.uid());

create policy "orders_update_cocina_or_mesero_or_admin"
on public.orders for update
to authenticated
using (
  public.current_role() in ('admin', 'cocina', 'supervisor')
  or (public.current_role() = 'mesero' and waiter_id = auth.uid())
)
with check (true);

-- ORDER_ITEMS: heredan visibilidad de la orden relacionada
create policy "order_items_select"
on public.order_items for select
to authenticated
using (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and (
        public.current_role() in ('admin', 'supervisor', 'cocina')
        or (public.current_role() = 'mesero' and o.waiter_id = auth.uid())
      )
  )
);

create policy "order_items_insert_mesero"
on public.order_items for insert
to authenticated
with check (
  exists (
    select 1 from public.orders o
    where o.id = order_items.order_id
      and public.current_role() = 'mesero'
      and o.waiter_id = auth.uid()
  )
);

-- ---------------------------------------------------------
-- 6. REALTIME
-- ---------------------------------------------------------
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.order_items;
alter publication supabase_realtime add table public.products;

-- ---------------------------------------------------------
-- 7. DATOS DE EJEMPLO (opcional, comenta si no lo quieres)
-- ---------------------------------------------------------
-- Crea primero tus 4 usuarios desde Supabase Auth (Authentication > Users > Add user)
-- y luego inserta su perfil aquí usando el UUID que Supabase generó, ej:
--
-- insert into public.profiles (id, full_name, role) values
--   ('UUID-DEL-ADMIN', 'Administrador', 'admin'),
--   ('UUID-DEL-COCINERO', 'Cocinero 1', 'cocina'),
--   ('UUID-DEL-SUPERVISOR', 'Supervisor', 'supervisor'),
--   ('UUID-DEL-MESERO', 'Mesero 1', 'mesero');

insert into public.products (name, category, base_price, sizes, flavors, image_url) values
  ('Pizza', 'pizza', 0, '[{"name":"Chica","price":99},{"name":"Mediana","price":139},{"name":"Grande","price":179}]', '[{"name":"Pepperoni","extra_price":0},{"name":"Hawaiana","extra_price":10},{"name":"Especial","extra_price":20}]', null),
  ('Alitas', 'alitas', 0, '[{"name":"8 pzas","price":99},{"name":"12 pzas","price":139},{"name":"20 pzas","price":210}]', '[{"name":"BBQ","extra_price":0},{"name":"Búfalo","extra_price":0},{"name":"Mango Habanero","extra_price":10}]', null),
  ('Papas Gajo', 'papas', 59, '[]', '[{"name":"Natural","extra_price":0},{"name":"Con queso","extra_price":15}]', null),
  ('Refresco', 'bebida', 25, '[{"name":"Chico","price":20},{"name":"Grande","price":30}]', '[]', null);
