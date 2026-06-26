import type { SupabaseClient } from "@supabase/supabase-js";
import type { NotificationType } from "@/lib/community/types";
import { extractMentionHandles, getMentionHandle } from "@/lib/community/mentions";

type CreateNotificationInput = {
  userId: string;
  actorId: string;
  type: NotificationType;
  entityType: "post" | "comment" | "user";
  entityId: string;
  message: string;
};

export async function createNotification(
  supabase: SupabaseClient,
  input: CreateNotificationInput,
): Promise<void> {
  if (input.userId === input.actorId) return;

  const { error } = await supabase.from("notifications").insert({
    user_id: input.userId,
    actor_id: input.actorId,
    type: input.type,
    entity_type: input.entityType,
    entity_id: input.entityId,
    message: input.message,
    is_read: false,
  });

  if (error) {
    console.error("createNotification:", error.message);
  }
}

export async function resolveMentionedUserIds(
  supabase: SupabaseClient,
  content: string,
): Promise<string[]> {
  const handles = extractMentionHandles(content);
  if (handles.length === 0) return [];

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name");

  if (!profiles) return [];

  const ids = new Set<string>();

  for (const profile of profiles) {
    const handle = getMentionHandle(profile.full_name).toLowerCase();
    if (handles.includes(handle)) {
      ids.add(profile.id);
    }
  }

  return Array.from(ids);
}
