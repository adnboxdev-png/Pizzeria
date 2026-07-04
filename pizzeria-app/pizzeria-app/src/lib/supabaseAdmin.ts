import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

// ¡NUNCA importar este archivo desde código de cliente ("use client")!
// Solo se usa dentro de src/app/api/** (Node.js runtime en Vercel).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});
