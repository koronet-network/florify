"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, getUser } from "@/lib/api";
import Navbar from "@/components/Navbar";
import NotificationPanel from "@/components/NotificationPanel";

interface Alert {
  canonicalName: string;
  yourPrice: number;
  marketAverage: number;
  lowestMarketPrice: number;
  percentAbove: number;
  difference: number;
  isRead: boolean;
}

function sortAlerts(alerts: Alert[]) {
  return [...alerts].sort((a, b) => {
    if (a.isRead === b.isRead) {
      return b.percentAbove - a.percentAbove;
    }
    return a.isRead ? 1 : -1;
  });
}

export default function NotificationsPage() {
  const router = useRouter();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const unreadCount = alerts.filter((alert) => !alert.isRead).length;

  useEffect(() => {
    const user = getUser();
    if (!user || user.role !== "vendor") {
      router.replace("/");
      return;
    }
    api
      .getNotifications(user.userId)
      .then((data) => setAlerts(sortAlerts(data)))
      .finally(() => setLoading(false));
  }, [router]);

  async function handleMarkRead(canonicalName: string) {
    try {
      await api.markNotificationRead(canonicalName);
      setAlerts((prev) =>
        sortAlerts(
          prev.map((alert) =>
            alert.canonicalName === canonicalName
              ? { ...alert, isRead: true }
              : alert
          )
        )
      );
      window.dispatchEvent(new Event("florify-notifications-updated"));
    } catch (err) {
      console.error("Failed to mark notification as read:", err);
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.markAllNotificationsRead();
      setAlerts((prev) => sortAlerts(prev.map((alert) => ({ ...alert, isRead: true }))));
      window.dispatchEvent(new Event("florify-notifications-updated"));
    } catch (err) {
      console.error("Failed to mark all notifications as read:", err);
    }
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Price Alerts</h1>
          <p className="text-sm text-gray-500">
            Notifications when competitors undercut your prices
          </p>
        </div>

        {!loading && unreadCount > 0 && (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-5 py-3">
            <p className="text-sm font-semibold text-red-700">
              {unreadCount} unread alert
              {unreadCount !== 1 ? "s" : ""} priced above market rates
            </p>
          </div>
        )}

        <NotificationPanel
          alerts={alerts}
          loading={loading}
          onMarkRead={handleMarkRead}
          onMarkAllRead={handleMarkAllRead}
        />
      </div>
    </div>
  );
}
