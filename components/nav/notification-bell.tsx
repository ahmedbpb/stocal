"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
} from "@/app/community/actions";
import { ProfileAvatar } from "@/components/profile/profile-avatar";
import { formatRelativeTime } from "@/lib/community/format-time";
import type { CommunityNotification } from "@/lib/community/types";
import { createClient } from "@/lib/supabase/client";

export function NotificationBell({ userId }: { userId: string }) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const instanceId = useId();

  const refresh = useCallback(async () => {
    const result = await fetchNotifications();
    setNotifications(result.notifications);
    setUnreadCount(result.notifications.filter((n) => !n.isRead).length);
  }, []);

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    const supabase = createClient();

    const channel = supabase
      .channel(`notifications-${userId}-${instanceId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          refreshRef.current();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, instanceId]);

  useEffect(() => {
    if (!open) return;

    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function handleOpen() {
    const next = !open;
    setOpen(next);
    if (!next) return;

    setLoading(true);
    const result = await fetchNotifications();
    const items = result.notifications;
    setNotifications(items);
    const unreadIds = items.filter((n) => !n.isRead).map((n) => n.id);
    if (unreadIds.length > 0) {
      await markNotificationsRead(unreadIds);
      setNotifications(items.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } else {
      setUnreadCount(0);
    }
    setLoading(false);
  }

  async function handleMarkAllRead() {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ""}`}
        className="relative inline-flex min-h-11 min-w-11 items-center justify-center text-lg text-white/70 hover:text-white"
      >
        🔔
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 border border-white/10 bg-black shadow-2xl sm:w-96">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <p className="text-sm font-medium text-white">Notifications</p>
            {notifications.some((n) => !n.isRead) && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-xs text-white/50 hover:text-white"
              >
                Mark all as read
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {loading ? (
              <p className="px-4 py-8 text-center text-sm text-white/40">Loading…</p>
            ) : notifications.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-white/40">
                You&apos;re all caught up
              </p>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`flex gap-3 border-b border-white/5 px-4 py-3 ${
                    !notification.isRead ? "bg-white/5" : ""
                  }`}
                >
                  <ProfileAvatar
                    name={notification.actor.fullName}
                    avatarUrl={notification.actor.avatarUrl}
                    size="sm"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm text-white/80">{notification.message}</p>
                    <p className="mt-1 text-xs text-white/40">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
