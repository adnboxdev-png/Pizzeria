# Control de Sucursal · Pizzería

App web para controlar una sucursal de pizzería con 4 roles: **Administrador**, **Cocina**, **Supervisor** y **Mesero**.

Stack: **Next.js 14 (TypeScript) + React + Supabase (Postgres, Auth, Realtime)**, lista para desplegar en **Vercel**.

## 1. Crear el proyecto en Supabase

1. Ve a https://supabase.com y crea un proyecto nuevo.
2. Entra a **SQL Editor** → **New query**, pega todo el contenido de [`supabase/schema.sql`](./supabase/schema.sql) y ejecútalo. Esto crea:
   - Tablas: `profiles`, `products`, `orders`, `order_items`.
   - Row Level Security por rol.
   - Realtime habilitado en `orders`, `order_items`, `products`.
   - 4 productos de ejemplo (pizza, alitas, papas, refresco).
3. Ve a **Project Settings → API** y copia:
   - `Project URL`
   - `anon public` key
   - `service_role` key (¡nunca la expongas al cliente!)

## 2. Crear a tu primer usuario administrador

Como la tabla `profiles` requiere que el usuario ya exista en Supabase Auth, crea el primer admin manualmente **una sola vez**:

1. En Supabase: **Authentication → Users → Add user** (correo + contraseña, marca "Auto confirm").
2. Copia el UUID del usuario recién creado.
3. En **SQL Editor**, ejecuta:
   ```sql
   insert into public.profiles (id, full_name, role)
   values ('PEGA-AQUI-EL-UUID', 'Nombre del Administrador', 'admin');
   ```
4. Ya puedes iniciar sesión con ese correo/contraseña en `/login` y llegarás al panel de administrador.

Desde ahí, el propio administrador puede crear a los demás usuarios (cocina, supervisor, meseros) desde **Panel de Administrador → Usuarios → + Agregar usuario** — no necesitas repetir el paso manual para ellos.

## 3. Variables de entorno

Copia `.env.example` a `.env.local` y complétalo:

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

> `SUPABASE_SERVICE_ROLE_KEY` **no lleva el prefijo `NEXT_PUBLIC_`** a propósito: solo se usa dentro de la API route `src/app/api/admin/create-user/route.ts` (código de servidor), nunca llega al navegador.

## 4. Correr en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000 — te redirige a `/login`.

## 5. Desplegar en Vercel

1. Sube este proyecto a un repo de GitHub/GitLab.
2. En https://vercel.com → **Add New Project** → importa el repo.
3. En **Environment Variables**, agrega las 3 variables del paso 3 (también `SUPABASE_SERVICE_ROLE_KEY`).
4. Deploy. Vercel detecta Next.js automáticamente.

## Cómo funciona cada rol

### Administrador (`/admin`)
- **Ventas**: gráficos de histórico de ventas por día y productos más vendidos, con totales y ticket promedio (filtrable por 7/14/30/90 días).
- **Productos**: agrega productos con nombre, categoría, imagen, tamaños con precio y sabores con costo extra. Al "desactivar" un producto **no se borra de la base de datos** (evita romper el histórico de ventas ligado a él); solo deja de aparecer para los meseros.
- **Usuarios**: crea cocineros, supervisores y meseros (o más administradores) y puede desactivarlos/reactivarlos en cualquier momento.

### Cocina (`/cocina`)
- Ve **una orden a la vez**, la más antigua pendiente (tipo fila/cola FIFO).
- Al abrir la orden, pasa automáticamente a "en preparación".
- Botón **"Marcar como concluida"** → la orden pasa a estado "lista" y automáticamente aparece la siguiente orden en la cola.
- Se actualiza en tiempo real (Supabase Realtime) cuando un mesero manda una orden nueva.

### Supervisor (`/supervisor`)
- Ve todas las órdenes activas (pendiente / en preparación / lista) con su mesero asignado y en qué parte del proceso van.
- Ve el estado del equipo (cocineros y meseros, activos/inactivos, cuántas órdenes tiene abiertas cada mesero).

### Mesero (`/mesero`)
- Catálogo con botones grandes por producto (imagen + precio), agrupados por categoría (pizzas, alitas, papas, bebidas, etc).
- Al tocar un producto: elige tamaño (con precio incluido), sabor (con costo extra si aplica), cantidad y notas.
- El carrito se arma del lado derecho; al enviar, la orden llega a cocina y queda visible para supervisor/admin.
- Puede ver sus órdenes recientes y marcar como "entregada" cuando cocina la marcó como "lista".

## Estructura del proyecto

```
supabase/schema.sql        Esquema completo de base de datos + RLS
src/lib/supabaseClient.ts  Cliente Supabase para el navegador
src/lib/supabaseAdmin.ts   Cliente Supabase con service role (solo servidor)
src/context/AuthContext.tsx Sesión + perfil + rol del usuario actual
src/components/RoleGuard.tsx Protege cada ruta según el rol permitido
src/app/login               Login
src/app/admin                Panel de administrador
src/app/cocina                Panel de cocina
src/app/supervisor            Panel de supervisor
src/app/mesero                 Panel de mesero
src/app/api/admin/create-user  API (Node) para que el admin cree usuarios
```

## Notas de diseño

- Los productos **nunca se eliminan** de la base de datos, solo se marcan `active = false`, para no romper el histórico de ventas que los referencia.
- Todo el control de acceso por rol está reforzado tanto en el cliente (`RoleGuard`) como en la base de datos (Row Level Security), así que aunque alguien manipule el front, Supabase seguirá bloqueando lo que no le corresponde a su rol.
- Las órdenes y productos se actualizan **en tiempo real** entre cocina/supervisor/mesero usando Supabase Realtime — no hace falta recargar la página.
