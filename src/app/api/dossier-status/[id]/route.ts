import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * GET /api/dossier-status/[id]
 *
 * Why: il client polling ha bisogno di sapere se il dossier è pronto.
 * La Server Action usa waitUntil() quindi ritorna "success" prima che
 * la pipeline AI completi. Questo endpoint espone solo lo status
 * (processing/generating/completed/failed) — nessun dato sensibile.
 */
export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const dossierId = parseInt(id, 10);

  if (isNaN(dossierId)) {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ status: "unauthorized" }, { status: 401 });
  }

  const { data: dossier } = await supabase
    .from("dossiers")
    .select("status, error_message")
    .eq("id", dossierId)
    .eq("user_id", user.id)
    .single();

  if (!dossier) {
    return NextResponse.json({ status: "not_found" }, { status: 404 });
  }

  return NextResponse.json(
    { status: dossier.status, error_message: dossier.error_message },
    {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
      }
    }
  );
}
