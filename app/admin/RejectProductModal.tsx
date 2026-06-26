"use client";

import { useEffect, useState } from "react";

export function RejectProductModal({
  productTitle,
  open,
  loading,
  onClose,
  onConfirm,
}: {
  productTitle: string;
  open: boolean;
  loading: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState("");

  useEffect(() => {
    if (open) {
      setReason("");
    }
  }, [open, productTitle]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = reason.trim();
    if (!trimmed) return;
    onConfirm(trimmed);
  }

  function handleClose() {
    setReason("");
    onClose();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={handleClose}
      />
      <form
        onSubmit={handleSubmit}
        className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold text-white">Reject product</h3>
        <p className="mt-1 text-sm text-white/50">
          Provide a reason for rejecting &ldquo;{productTitle}&rdquo;
        </p>

        <textarea
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          rows={4}
          required
          placeholder="Rejection reason (required)"
          className="mt-4 w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
        />

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={loading}
            className="rounded-lg px-4 py-2 text-sm text-white/60 transition-colors hover:text-white disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || !reason.trim()}
            className="rounded-lg bg-red-500/20 px-4 py-2 text-sm font-semibold text-red-300 ring-1 ring-red-500/30 transition-colors hover:bg-red-500/30 disabled:opacity-50"
          >
            {loading ? "Rejecting…" : "Reject"}
          </button>
        </div>
      </form>
    </div>
  );
}
