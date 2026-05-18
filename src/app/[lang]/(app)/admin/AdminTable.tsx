"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { adminForceDeleteDossier, adminMarkFailed } from "./actions";

export interface AdminRow {
  id: number;
  user_id: string;
  user_email: string | null;
  status: string;
  classified_season: string | null;
  classification_result: { confidence?: number } | null;
  user_notes: string | null;
  original_photo_path: string | null;
  generated_dossier_path: string | null;
  photo_url: string | null;
  dossier_url: string | null;
  created_at: string;
  age_minutes: number;
}

interface Props {
  rows: AdminRow[];
}

const STATUS_STYLES: Record<string, string> = {
  completed: "bg-green-100 text-green-800 border-green-200",
  processing: "bg-amber-100 text-amber-800 border-amber-200",
  generating: "bg-blue-100 text-blue-800 border-blue-200",
  failed: "bg-red-100 text-red-800 border-red-200",
};

export default function AdminTable({ rows }: Props) {
  const [busyId, setBusyId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-8 text-center text-sm text-gray-500">
        Nessun dossier corrisponde ai filtri.
      </div>
    );
  }

  const handleDelete = (id: number) => {
    if (!confirm(`Eliminare definitivamente il dossier #${id}? Operazione irreversibile.`)) return;
    setBusyId(id);
    startTransition(async () => {
      const res = await adminForceDeleteDossier(id);
      setBusyId(null);
      if (!res.success) alert(`Errore: ${res.error}`);
    });
  };

  const handleMarkFailed = (id: number) => {
    setBusyId(id);
    startTransition(async () => {
      const res = await adminMarkFailed(id);
      setBusyId(null);
      if (!res.success) alert(`Errore: ${res.error}`);
    });
  };

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-gray-700">ID</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Creato</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Email</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Status</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Stagione</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Note</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">File</th>
            <th className="px-3 py-2 text-left font-medium text-gray-700">Azioni</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((r) => {
            const isStuck =
              (r.status === "processing" || r.status === "generating") && r.age_minutes > 5;
            return (
              <tr key={r.id} className={isStuck ? "bg-red-50/50" : "hover:bg-gray-50"}>
                <td className="px-3 py-2 font-mono text-xs text-gray-600">#{r.id}</td>
                <td className="px-3 py-2 whitespace-nowrap text-xs text-gray-600">
                  {new Date(r.created_at).toLocaleString("it-IT", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "2-digit",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                  <div className="text-[10px] text-gray-400">{r.age_minutes}min fa</div>
                </td>
                <td className="px-3 py-2 text-xs text-gray-700">{r.user_email ?? "—"}</td>
                <td className="px-3 py-2">
                  <span
                    className={`inline-flex rounded-full border px-2 py-0.5 text-[11px] font-medium ${STATUS_STYLES[r.status] ?? "bg-gray-100 text-gray-700 border-gray-200"}`}
                  >
                    {r.status}
                    {isStuck && " ⚠"}
                  </span>
                </td>
                <td className="px-3 py-2 text-xs text-gray-700">
                  {r.classified_season ?? "—"}
                  {r.classification_result?.confidence != null && (
                    <div className="text-[10px] text-gray-400">
                      conf {(r.classification_result.confidence * 100).toFixed(0)}%
                    </div>
                  )}
                </td>
                <td
                  className="px-3 py-2 max-w-[180px] truncate text-xs text-gray-600"
                  title={r.user_notes ?? ""}
                >
                  {r.user_notes ?? "—"}
                </td>
                <td className="px-3 py-2 text-xs">
                  <div className="flex flex-col gap-0.5">
                    {r.photo_url ? (
                      <a
                        href={r.photo_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        foto
                      </a>
                    ) : (
                      <span className="text-gray-300">foto –</span>
                    )}
                    {r.dossier_url ? (
                      <a
                        href={r.dossier_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        dossier
                      </a>
                    ) : (
                      <span className="text-gray-300">dossier –</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-2">
                  <div className="flex gap-1">
                    {isStuck && (
                      <button
                        type="button"
                        onClick={() => handleMarkFailed(r.id)}
                        disabled={busyId === r.id}
                        className="rounded border border-amber-300 bg-amber-50 px-2 py-1 text-[11px] font-medium text-amber-800 hover:bg-amber-100 disabled:opacity-50"
                        title="Marca come fallito"
                      >
                        fail
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDelete(r.id)}
                      disabled={busyId === r.id}
                      className="rounded border border-red-300 bg-red-50 px-2 py-1 text-[11px] font-medium text-red-800 hover:bg-red-100 disabled:opacity-50"
                    >
                      elimina
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Barra filtri standalone — usa form GET per sync con URL. */
export function FilterBar({
  status,
  email,
  total,
}: {
  status: string;
  email: string;
  total: number;
}) {
  return (
    <form
      method="get"
      className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4"
    >
      <div className="flex flex-col">
        <label htmlFor="status" className="mb-1 text-xs font-medium text-gray-600">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={status}
          className="rounded border border-gray-300 bg-white px-2 py-1.5 text-sm"
        >
          <option value="">Tutti</option>
          <option value="completed">completed</option>
          <option value="processing">processing</option>
          <option value="generating">generating</option>
          <option value="failed">failed</option>
        </select>
      </div>
      <div className="flex flex-col flex-1 min-w-[200px]">
        <label htmlFor="email" className="mb-1 text-xs font-medium text-gray-600">
          Email contiene
        </label>
        <input
          id="email"
          name="email"
          type="text"
          defaultValue={email}
          placeholder="parte di email…"
          className="rounded border border-gray-300 px-2 py-1.5 text-sm"
        />
      </div>
      <button
        type="submit"
        className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700"
      >
        Filtra
      </button>
      <a
        href="?"
        className="rounded border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
      >
        Reset
      </a>
      <span className="ml-auto text-sm text-gray-500">
        {total} risultati
      </span>
    </form>
  );
}
