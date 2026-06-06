"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, Check } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function NotificationBell() {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["notifications"],
    queryFn: async () => {
      const res = await fetch("/api/notifications");
      if (!res.ok) throw new Error("Failed to fetch notifications");
      return res.json();
    },
    refetchInterval: 30000, // Polling every 30s
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/notifications/${id}/read`, { method: "PATCH" });
      if (!res.ok) throw new Error("Failed to mark as read");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/notifications`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "markAllRead" }),
      });
      if (!res.ok) throw new Error("Failed to mark all as read");
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const notifications = data?.data || [];
  const unreadCount = notifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="relative inline-flex shrink-0 items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 hover:bg-slate-100 hover:text-slate-900 h-9 w-9">
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white ring-2 ring-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 p-0 border border-slate-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="p-0 font-bold text-slate-900 text-sm">Notifications</div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-blue-600 h-auto p-0 hover:bg-transparent hover:text-blue-700"
              onClick={(e) => {
                e.preventDefault();
                markAllReadMutation.mutate();
              }}
              disabled={markAllReadMutation.isPending}
            >
              Mark all read
            </Button>
          )}
        </div>
        <div className="max-h-[400px] overflow-y-auto overflow-x-hidden p-1">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-sm text-slate-500">
              No new notifications
            </div>
          ) : (
            notifications.slice(0, 10).map((n: any) => (
              <DropdownMenuItem
                key={n.id}
                className={cn(
                  "flex flex-col items-start gap-1 p-3 cursor-pointer outline-none transition-colors",
                  !n.isRead ? "bg-blue-50/50 hover:bg-blue-50" : "hover:bg-slate-50"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  markReadMutation.mutate(n.id);
                  if (n.link) window.location.href = n.link;
                }}
              >
                <div className="flex items-start justify-between w-full">
                  <span className="font-semibold text-slate-900 text-sm leading-tight">{n.title}</span>
                  {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-600 mt-1 flex-shrink-0" />}
                </div>
                <span className="text-sm text-slate-600 line-clamp-2 leading-snug">{n.message}</span>
                <span className="text-[10px] font-medium text-slate-400 mt-1 uppercase tracking-wider">
                  {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                </span>
              </DropdownMenuItem>
            ))
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
