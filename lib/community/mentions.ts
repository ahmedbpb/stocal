/** Alphanumeric handle derived from display name for @mentions. */
export function getMentionHandle(fullName: string | null): string {
  if (!fullName?.trim()) return "member";
  const slug = fullName.trim().replace(/\s+/g, "");
  return slug.replace(/[^a-zA-Z0-9]/g, "") || "member";
}

const MENTION_REGEX = /@(\w+)/g;

export function extractMentionHandles(content: string): string[] {
  const handles = new Set<string>();
  for (const match of content.matchAll(MENTION_REGEX)) {
    if (match[1]) handles.add(match[1].toLowerCase());
  }
  return Array.from(handles);
}

export function parseMentionSegments(content: string): Array<
  | { type: "text"; value: string }
  | { type: "mention"; handle: string }
> {
  const segments: Array<
    | { type: "text"; value: string }
    | { type: "mention"; handle: string }
  > = [];
  let lastIndex = 0;

  for (const match of content.matchAll(MENTION_REGEX)) {
    const index = match.index ?? 0;
    if (index > lastIndex) {
      segments.push({ type: "text", value: content.slice(lastIndex, index) });
    }
    segments.push({ type: "mention", handle: match[1] });
    lastIndex = index + match[0].length;
  }

  if (lastIndex < content.length) {
    segments.push({ type: "text", value: content.slice(lastIndex) });
  }

  return segments.length > 0 ? segments : [{ type: "text", value: content }];
}

export type MentionProfile = {
  id: string;
  fullName: string | null;
};

export function buildMentionProfileMap(
  profiles: MentionProfile[],
): Map<string, MentionProfile> {
  const map = new Map<string, MentionProfile>();
  for (const profile of profiles) {
    map.set(getMentionHandle(profile.fullName).toLowerCase(), profile);
  }
  return map;
}
