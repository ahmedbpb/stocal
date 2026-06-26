import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requireAuth(nextPath = "/profile") {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }

  return user;
}
