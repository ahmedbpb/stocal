"use client";

import { FormEvent, useState } from "react";
import Image from "next/image";
import { createPost } from "@/app/community/actions";
import { MAX_POST_LENGTH } from "@/lib/community/types";

export function NewPostModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [content, setContent] = useState("");
  const [image, setImage] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  function handleImageChange(file: File | null) {
    if (!file) return;
    setImage(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setPreview(e.target.result as string);
    };
    reader.readAsDataURL(file);
  }

  function handleClose() {
    setContent("");
    setImage(null);
    setPreview(null);
    setError(null);
    setSuccess(null);
    onClose();
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData();
    formData.set("content", content);
    if (image) formData.set("image", image);

    const result = await createPost(formData);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setSuccess(result.success ?? "Post submitted.");
    setTimeout(handleClose, 2000);
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
        className="relative z-10 w-full max-w-lg rounded-2xl border border-white/10 bg-[#121212] p-6 shadow-2xl"
      >
        <h3 className="text-lg font-semibold text-white">New post</h3>
        <p className="mt-1 text-sm text-white/50">
          Share with the Stocal community
        </p>

        {error && (
          <p className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            {error}
          </p>
        )}
        {success && (
          <p className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
            {success}
          </p>
        )}

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={5}
          maxLength={MAX_POST_LENGTH}
          required
          placeholder="What's on your mind?"
          className="mt-4 w-full resize-y rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
        />
        <p className="mt-1 text-right text-xs text-white/40">
          {content.length}/{MAX_POST_LENGTH}
        </p>

        <input
          type="file"
          accept="image/*"
          onChange={(e) => handleImageChange(e.target.files?.[0] ?? null)}
          className="mt-3 block w-full text-sm text-white/60 file:mr-4 file:rounded-lg file:border-0 file:bg-white/10 file:px-4 file:py-2 file:text-sm file:text-white"
        />
        {preview && (
          <div className="relative mt-3 h-40 w-full overflow-hidden rounded-xl border border-white/10">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover"
              unoptimized
            />
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-lg px-4 py-2 text-sm text-white/60 hover:text-white"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || !content.trim()}
            className="rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit"}
          </button>
        </div>
      </form>
    </div>
  );
}
