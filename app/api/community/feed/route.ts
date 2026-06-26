import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getFeedPosts } from "@/lib/community/queries";
import type { FeedTab } from "@/lib/community/types";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const tab = (searchParams.get("tab") ?? "feed") as FeedTab;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const validTabs: FeedTab[] = ["feed", "following", "my-posts"];
  const safeTab = validTabs.includes(tab) ? tab : "feed";

  if ((safeTab === "following" || safeTab === "my-posts") && !user) {
    return NextResponse.json({ posts: [] });
  }

  const posts = await getFeedPosts(safeTab, user?.id ?? null);
  return NextResponse.json({ posts });
}
