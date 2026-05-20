import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET/POST /api/dossier-status/[id]
 *
 * Why: il client polling ha bisogno di sapere se il dossier è pronto.
 * Supporta POST per aggirare il caching aggressivo di CDNs/Next.js.
 * Supporta "latest" come ID per recuperare l'ultimo dossier dell'utente come fallback di emergenza.
 */
export const dynamic = "force-dynamic";

async function handleRequest(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  let dossier;
  if (id === "latest") {
    const { data } = await supabase
      .from("dossiers")
      .select("id, status, error_message")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    dossier = data;
  } else {
    const dossierId = parseInt(id, 10);
    if (isNaN(dossierId)) {
      return NextResponse.json({ status: "not_found" }, { status: 404 });
    }

    const { data } = await supabase
      .from("dossiers")
      .select("id, status, error_message")
      .eq("id", dossierId)
      .eq("user_id", user.id)
      .single();
    dossier = data;
  }

  if (!dossier) {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }

  return NextResponse.json(
    {
      id: dossier.id,
      status: dossier.status,
      error_message: dossier.error_message,
    },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      },
    }
  );
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return handleRequest(request, context);
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  return handleRequest(request, context);
}
