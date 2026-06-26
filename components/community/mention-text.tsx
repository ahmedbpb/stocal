"use client";

import Link from "next/link";
import { buildMentionProfileMap, parseMentionSegments } from "@/lib/community/mentions";
import type { MentionProfile } from "@/lib/community/mentions";

export function MentionText({
  content,
  profiles = [],
}: {
  content: string;
  profiles?: MentionProfile[];
}) {
  const mentionMap = buildMentionProfileMap(profiles);
  const segments = parseMentionSegments(content);

  return (
    <span className="whitespace-pre-wrap">
      {segments.map((segment, index) => {
        if (segment.type === "text") {
          return <span key={index}>{segment.value}</span>;
        }

        const profile = mentionMap.get(segment.handle.toLowerCase());
        if (profile) {
          return (
            <Link
              key={index}
              href={`/profile/${profile.id}`}
              className="font-medium text-cyan-400 hover:underline"
            >
              @{segment.handle}
            </Link>
          );
        }

        return (
          <span key={index} className="font-medium text-cyan-400">
            @{segment.handle}
          </span>
        );
      })}
    </span>
  );
}
