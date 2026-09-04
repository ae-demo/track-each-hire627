import { useEffect, useState, useCallback } from "react";
import { DropdownMenu } from "@astryxdesign/core/DropdownMenu";
import { Badge } from "@astryxdesign/core/Badge";
import { listNotifications, markNotificationRead, type Notification } from "../api";

function describe(n: Notification): string {
  const when = new Date(n.createdAt).toLocaleString();
  const kind = n.type === "escalation" ? "Escalation" : "Reminder";
  return `${kind} — task ${n.taskId} overdue (${when})${n.read ? "" : " • unread"}`;
}

/**
 * A lightweight bell menu, reachable from every role's chrome, surfacing
 * in-app reminder/escalation notifications (REQ-008 through REQ-010). No
 * dedicated screen is drawn in wireframes.dsl for this, so a DropdownMenu
 * off the navbar/sidebar is the whole of its UI.
 */
export function NotificationsMenu() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const refresh = useCallback(() => {
    listNotifications()
      .then(setNotifications)
      .catch(() => setNotifications([]));
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const items =
    notifications.length === 0
      ? [{ label: "No notifications", isDisabled: true }]
      : notifications.map((n) => ({
          label: describe(n),
          onClick: async () => {
            if (n.read) return;
            await markNotificationRead(n.id);
            refresh();
          },
        }));

  return (
    <DropdownMenu
      button={{
        label: "Notifications",
        variant: "ghost",
        endContent: unreadCount > 0 ? <Badge label={String(unreadCount)} variant="error" /> : undefined,
      }}
      items={items}
      menuWidth={320}
    />
  );
}
