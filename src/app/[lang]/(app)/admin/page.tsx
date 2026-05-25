import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, isAdmin } from "@/lib/admin";
import AdminTable, { FilterBar, type AdminRow } from "./AdminTable";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export const metadata: Metadata = {
  title: "Admin | Cromea Studio",
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{ status?: string; email?: string }>;
}

const KNOWN_STATUSES = new Set(["completed", "processing", "generating", "failed"]);
const PAGE_SIZE = 100;

export default async function AdminPage({ searchParams }: PageProps) {
  try {
    // ── Gate ──
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user || !isAdmin(user.email)) {
      notFound();
    }

    const { status: statusFilter = "", email: emailFilter = "" } = await searchParams;
    const admin = createAdminClient();

    // ── Query dossier ──
    let query = admin
      .from("dossiers")
      .select(
        "id, user_id, status, classified_season, classification_result, user_notes, original_photo_path, generated_dossier_path, created_at, error_message"
      )
      .order("created_at", { ascending: false })
      .limit(PAGE_SIZE);

    if (statusFilter && KNOWN_STATUSES.has(statusFilter)) {
      query = query.eq("status", statusFilter);
    }

    const { data: dossiers, error: dossiersError } = await query;
    if (dossiersError) throw new Error(`Query dossiers: ${dossiersError.message}`);

    // ── Mapping user_id → email via auth.admin.listUsers ──
    // Why: auth.users non è esposto via REST, ma admin.listUsers sì. Per uno
    // scope da migliaia di utenti questo non è ideale (paginazione 1000/pagina);
    // per il Livello 1 va bene.
    const userIds = new Set((dossiers ?? []).map((d) => d.user_id));
    const userEmailById = new Map<string, string>();

    // Paginazione esplicita su 5 pagine (= 5000 utenti) per non bucare il timeout
    for (let page = 1; page <= 5; page++) {
      const { data: usersPage, error: usersError } = await admin.auth.admin.listUsers({
        page,
        perPage: 1000,
      });
      if (usersError) break;
      for (const u of usersPage.users) {
        if (u.email && userIds.has(u.id)) {
          userEmailById.set(u.id, u.email);
        }
      }
      if (!usersPage.users.length || usersPage.users.length < 1000) break;
    }

    // ── Filtro email ──
    let filtered = dossiers ?? [];
    if (emailFilter) {
      const needle = emailFilter.toLowerCase();
      filtered = filtered.filter((d) => {
        const email = userEmailById.get(d.user_id);
        return email?.toLowerCase().includes(needle);
      });
    }

    // ── Signed URLs (best effort) ──
    // eslint-disable-next-line react-hooks/purity
    const now = Date.now();
    const rows: AdminRow[] = await Promise.all(
      filtered.map(async (d) => {
        let photoUrl: string | null = null;
        let dossierUrl: string | null = null;
        if (d.original_photo_path) {
          const { data } = await admin.storage
            .from("photos")
            .createSignedUrl(d.original_photo_path, 3600);
          photoUrl = data?.signedUrl ?? null;
        }
        if (d.generated_dossier_path) {
          const { data } = await admin.storage
            .from("dossiers")
            .createSignedUrl(d.generated_dossier_path, 3600);
          dossierUrl = data?.signedUrl ?? null;
        }
        return {
          id: d.id,
          user_id: d.user_id,
          user_email: userEmailById.get(d.user_id) ?? null,
          status: d.status,
          classified_season: d.classified_season ?? null,
          classification_result: (d.classification_result as { confidence?: number } | null) ?? null,
          user_notes: d.user_notes ?? null,
          original_photo_path: d.original_photo_path ?? null,
          generated_dossier_path: d.generated_dossier_path ?? null,
          photo_url: photoUrl,
          dossier_url: dossierUrl,
          created_at: d.created_at,
          age_minutes: Math.floor((now - new Date(d.created_at).getTime()) / 60000),
          error_message: d.error_message ?? null,
        };
      })
    );

    // ── Metriche aggregate (su TUTTI i dossier, non filtrati) ──
    const dayAgo = new Date(now - 24 * 60 * 60 * 1000).toISOString();
    const weekAgo = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      totalUsersRes,
      totalDossiersRes,
      last24hRes,
      last7dRes,
      completedRes,
      failedRes,
      stuckRes,
    ] = await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1 }),
      admin.from("dossiers").select("id", { count: "exact", head: true }),
      admin.from("dossiers").select("id", { count: "exact", head: true }).gte("created_at", dayAgo),
      admin.from("dossiers").select("id", { count: "exact", head: true }).gte("created_at", weekAgo),
      admin.from("dossiers").select("id", { count: "exact", head: true }).eq("status", "completed"),
      admin
        .from("dossiers")
        .select("id", { count: "exact", head: true })
        .eq("status", "failed")
        .gte("created_at", dayAgo),
      admin
        .from("dossiers")
        .select("id", { count: "exact", head: true })
        .in("status", ["processing", "generating"])
        .lt("created_at", new Date(now - 5 * 60 * 1000).toISOString()),
    ]);

    // Why: il tipo discriminato di listUsers ha `total` solo nel ramo "con utenti".
    // Narrowing safe con check di esistenza.
    const totalUsers =
      totalUsersRes.data && "total" in totalUsersRes.data ? totalUsersRes.data.total : 0;
    const totalDossiers = totalDossiersRes.count ?? 0;
    const last24h = last24hRes.count ?? 0;
    const last7d = last7dRes.count ?? 0;
    const completed = completedRes.count ?? 0;
    const failed24h = failedRes.count ?? 0;
    const stuck = stuckRes.count ?? 0;
    const successRate = totalDossiers > 0 ? Math.round((completed / totalDossiers) * 100) : 0;

    return (
      <div className="min-h-screen bg-gray-50 px-4 py-6 sm:px-8">
        <div className="mx-auto max-w-7xl space-y-6">
          {/* Header */}
          <div className="flex items-end justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Admin</h1>
              <p className="text-sm text-gray-500">
                Loggato come {user.email}. Vista globale di tutti gli utenti.
              </p>
            </div>
            <div className="text-xs text-gray-500">
              Mostra ultimi {PAGE_SIZE} dossier · ordinati per data desc
            </div>
          </div>

          {/* Stats */}
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
            <StatCard label="Utenti" value={totalUsers} />
            <StatCard label="Dossier totali" value={totalDossiers} />
            <StatCard label="Ultime 24h" value={last24h} />
            <StatCard label="Ultimi 7 giorni" value={last7d} />
            <StatCard label="Success rate" value={`${successRate}%`} />
            <StatCard
              label="Falliti 24h"
              value={failed24h}
              highlight={failed24h > 0 ? "warn" : undefined}
            />
            <StatCard
              label="Stuck >5min"
              value={stuck}
              highlight={stuck > 0 ? "alert" : undefined}
            />
          </div>

          {/* Filters */}
          <FilterBar status={statusFilter} email={emailFilter} total={rows.length} />

          {/* Table */}
          <AdminTable rows={rows} />
        </div>
      </div>
    );
  } catch (err) {
    const errorDetails = err instanceof Error ? { message: err.message, stack: err.stack } : { message: String(err) };
    console.error("[AdminPage Error]", err);
    return (
      <div className="min-h-screen bg-red-50 p-8 font-sans flex items-center justify-center">
        <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-white p-6 shadow-sm w-full">
          <h1 className="text-xl font-bold text-red-600">Errore Server Caricamento Admin (500)</h1>
          <p className="mt-2 text-sm text-gray-700">
            Si è verificato un errore nel server durante la generazione della pagina di amministrazione.
          </p>
          <div className="mt-4 rounded-lg bg-gray-900 p-4 font-mono text-xs text-red-400 overflow-auto max-h-96">
            <p className="font-bold text-red-300">Message: {errorDetails.message}</p>
            {errorDetails.stack && (
              <pre className="mt-2 text-gray-300 whitespace-pre-wrap">{errorDetails.stack}</pre>
            )}
          </div>
          <div className="mt-4">
            <a 
              href="" 
              className="inline-block rounded bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Ricarica Pagina
            </a>
          </div>
        </div>
      </div>
    );
  }
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number | string;
  highlight?: "warn" | "alert";
}) {
  const ring =
    highlight === "alert"
      ? "ring-2 ring-red-300 bg-red-50"
      : highlight === "warn"
        ? "ring-1 ring-amber-300 bg-amber-50"
        : "ring-1 ring-gray-200 bg-white";
  return (
    <div className={`rounded-lg p-3 ${ring}`}>
      <div className="text-[11px] font-medium uppercase tracking-wide text-gray-500">{label}</div>
      <div className="mt-1 text-xl font-semibold text-gray-900">{value}</div>
    </div>
  );
}
