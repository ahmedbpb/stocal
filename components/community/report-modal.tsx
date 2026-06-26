"use client";

import { useEffect, useState } from "react";
import { REPORT_REASONS, type ReportReason } from "@/lib/community/types";

export function ReportModal({
  open,
  targetLabel,
  loading,
  successMessage,
  onClose,
  onSubmit,
}: {
  open: boolean;
  targetLabel: string;
  loading: boolean;
  successMessage?: string | null;
  onClose: () => void;
  onSubmit: (reason: ReportReason, details: string) => void;
}) {
  const [reason, setReason] = useState<ReportReason>(REPORT_REASONS[0]);
  const [details, setDetails] = useState("");

  useEffect(() => {
    if (open) {
      setReason(REPORT_REASONS[0]);
      setDetails("");
    }
  }, [open, targetLabel]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(reason, details);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold text-white">Report content</h3>
        <p className="mt-1 text-sm text-white/50">Reporting: {targetLabel}</p>

        {successMessage ? (
          <p className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
            {successMessage}
          </p>
        ) : (
          <>
        <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-white/50">
          Reason
        </label>
        <select
          value={reason}
          onChange={(e) => setReason(e.target.value as ReportReason)}
          className="mt-1.5 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none focus:border-white/30"
        >
          {REPORT_REASONS.map((option) => (
            <option key={option} value={option} className="bg-[#1a1a1a]">
              {option}
            </option>
          ))}
        </select>

        <label className="mt-4 block text-xs font-medium uppercase tracking-wider text-white/50">
          Details (optional)
        </label>
        <textarea
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          rows={3}
          placeholder="Add more context…"
          className="mt-1.5 w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
        />

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm text-white/60 hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 ring-1 ring-red-500/30 hover:bg-red-500/30 disabled:opacity-50"
          >
            {loading ? "Submitting…" : "Submit report"}
          </button>
        </div>
          </>
        )}
      </form>
    </div>
  );
}
