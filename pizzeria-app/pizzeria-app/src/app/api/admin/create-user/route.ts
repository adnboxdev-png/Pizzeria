import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ error: "No autorizado." }, { status: 401 });
    }

    // Verifica que quien llama es un admin activo
    const { data: callerData, error: callerError } = await supabaseAdmin.auth.getUser(token);
    if (callerError || !callerData.user) {
      return NextResponse.json({ error: "Sesión inválida." }, { status: 401 });
    }
    const { data: callerProfile } = await supabaseAdmin
      .from("profiles")
      .select("role, active")
      .eq("id", callerData.user.id)
      .single();

    if (!callerProfile || callerProfile.role !== "admin" || !callerProfile.active) {
      return NextResponse.json({ error: "Solo un administrador puede crear usuarios." }, { status: 403 });
    }

    const body = await req.json();
    const { email, password, full_name, role } = body as {
      email: string;
      password: string;
      full_name: string;
      role: "admin" | "cocina" | "supervisor" | "mesero";
    };

    if (!email || !password || !full_name || !role) {
      return NextResponse.json({ error: "Faltan campos requeridos." }, { status: 400 });
    }

    const { data: created, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    });

    if (createError || !created.user) {
      return NextResponse.json({ error: createError?.message ?? "No se pudo crear el usuario." }, { status: 400 });
    }

    const { error: profileError } = await supabaseAdmin.from("profiles").insert({
      id: created.user.id,
      full_name,
      role,
      active: true
    } as never);

    if (profileError) {
      // rollback: si falla el perfil, elimina el usuario de auth para no dejar huérfanos
      await supabaseAdmin.auth.admin.deleteUser(created.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    return NextResponse.json({ ok: true, user_id: created.user.id });
  } catch (err) {
    return NextResponse.json({ error: "Error interno del servidor." }, { status: 500 });
  }
}
