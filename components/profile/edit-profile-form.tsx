"use client";

import { FormEvent, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { updateProfile } from "@/app/profile/actions";
import { getProfileInitials } from "@/lib/profile/display";
import { MAX_BIO_LENGTH, type ProfileData } from "@/lib/profile/types";

type Toast = { message: string; type: "success" | "error" };

function ToastNotification({ toast }: { toast: Toast }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 rounded-xl border px-5 py-3.5 shadow-2xl backdrop-blur-md ${
        toast.type === "success"
          ? "border-emerald-500/30 bg-emerald-500/15 text-emerald-200"
          : "border-red-500/30 bg-red-500/15 text-red-200"
      }`}
    >
      <p className="text-sm font-medium">{toast.message}</p>
    </div>
  );
}

export function EditProfileForm({ profile }: { profile: ProfileData }) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(profile.fullName ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const displayAvatarUrl = previewUrl ?? profile.avatarUrl;
  const displayName = fullName.trim() || profile.fullName;

  function handleAvatarChange(file: File | null) {
    if (!file) return;
    setAvatarFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) setPreviewUrl(e.target.result as string);
    };
    reader.readAsDataURL(file);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData();
    formData.set("full_name", fullName);
    formData.set("bio", bio);
    if (avatarFile) formData.set("avatar", avatarFile);

    const result = await updateProfile(formData);
    setSubmitting(false);

    if (result.error) {
      setError(result.error);
      return;
    }

    setToast({ message: "Profile updated successfully.", type: "success" });
    setTimeout(() => router.push("/profile"), 900);
  }

  return (
    <>
      {toast && <ToastNotification toast={toast} />}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
          <div className="relative">
            <div className="relative h-28 w-28 overflow-hidden rounded-full border border-white/10 bg-white/10">
              {displayAvatarUrl ? (
                <Image
                  src={displayAvatarUrl}
                  alt={displayName ?? "Avatar preview"}
                  fill
                  className="object-cover"
                  sizes="112px"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-gradient-to-br from-violet-500/30 to-fuchsia-500/30 text-3xl font-semibold text-white">
                  {getProfileInitials(displayName)}
                </span>
              )}
            </div>
          </div>

          <div className="text-center sm:text-left">
            <p className="text-sm font-medium text-white">Profile photo</p>
            <p className="mt-1 text-xs text-white/40">
              JPEG, PNG, WebP, or GIF. Max 5 MB.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={(e) => handleAvatarChange(e.target.files?.[0] ?? null)}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2 text-sm font-medium text-white/70 transition-colors hover:bg-white/[0.08] hover:text-white"
            >
              {profile.avatarUrl || previewUrl ? "Replace image" : "Upload image"}
            </button>
          </div>
        </div>

        <div>
          <label htmlFor="full_name" className="text-sm font-medium text-white/80">
            Full name <span className="text-red-400">*</span>
          </label>
          <input
            id="full_name"
            name="full_name"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="mt-2 w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
            placeholder="Your name"
          />
        </div>

        <div>
          <div className="flex items-center justify-between">
            <label htmlFor="bio" className="text-sm font-medium text-white/80">
              Bio
            </label>
            <span className="text-xs text-white/30">
              {bio.length}/{MAX_BIO_LENGTH}
            </span>
          </div>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            maxLength={MAX_BIO_LENGTH}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="mt-2 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none focus:border-white/30"
            placeholder="Tell others a bit about yourself…"
          />
        </div>

        {error && (
          <p className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        )}

        <div className="flex flex-wrap gap-3">
          <button
            type="submit"
            disabled={submitting || !fullName.trim()}
            className="rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 px-6 py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </>
  );
}
