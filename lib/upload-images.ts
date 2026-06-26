import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "product-images";

export async function uploadProductImages(
  supabase: SupabaseClient,
  files: File[],
  userId: string,
  productId: string,
): Promise<string[]> {
  const urls: string[] = [];

  for (const file of files) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const filePath = `${userId}/${productId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(filePath, file, {
        upsert: false,
        contentType: file.type || undefined,
      });

    if (error) throw error;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);
    urls.push(data.publicUrl);
  }

  return urls;
}
