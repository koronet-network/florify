"use client";

interface Alert {
  canonicalName: string;
  yourPrice: number;
  marketAverage: number;
  lowestMarketPrice: number;
  percentAbove: number;
  difference: number;
  isRead: boolean;
}

interface NotificationPanelProps {
  alerts: Alert[];
  loading: boolean;
  onMarkRead?: (canonicalName: string) => void;
  onMarkAllRead?: () => void;
}

export default function NotificationPanel({
  alerts,
  loading,
  onMarkRead,
  onMarkAllRead,
}: NotificationPanelProps) {
  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-accent-500 border-t-transparent" />
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-green-300 bg-green-50 py-12 text-center">
        <svg className="mx-auto mb-3 h-12 w-12 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm font-medium text-green-700">No undercut alerts. Your prices are competitive!</p>
      </div>
    );
  }

  const unreadCount = alerts.filter((alert) => !alert.isRead).length;

  return (
    <div className="space-y-4">
      {unreadCount > 0 && onMarkAllRead && (
        <div className="flex justify-end">
          <button
            onClick={onMarkAllRead}
            className="rounded-lg bg-accent-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-accent-700"
          >
            Mark all as read
          </button>
        </div>
      )}

      {alerts.map((alert, i) => (
        <div
          key={`${alert.canonicalName}-${alert.lowestMarketPrice}-${i}`}
          className={`rounded-xl border p-5 ${
            alert.isRead
              ? "border-gray-200 bg-gray-50/80 opacity-80"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          <div className="flex items-start gap-3">
            <svg
              className={`mt-0.5 h-5 w-5 shrink-0 ${
                alert.isRead ? "text-gray-400" : "text-amber-500"
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div className="flex-1">
              <div className="mb-2 flex items-center justify-between gap-3">
                <h3 className={`text-sm font-bold ${alert.isRead ? "text-gray-700" : "text-amber-900"}`}>
                  {alert.canonicalName}
                </h3>
                <div className="flex items-center gap-2">
                  {!alert.isRead && onMarkRead && (
                    <button
                      onClick={() => onMarkRead(alert.canonicalName)}
                      className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-50"
                    >
                      Mark as read
                    </button>
                  )}
                  {alert.isRead ? (
                    <span className="rounded-full bg-gray-200 px-2.5 py-1 text-xs font-bold text-gray-600">
                      Read
                    </span>
                  ) : (
                    <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                      +{alert.percentAbove.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              <p className={`mt-1 text-sm ${alert.isRead ? "text-gray-600" : "text-amber-800"}`}>
                Your price is{" "}
                <span className={`font-bold ${alert.isRead ? "text-gray-700" : "text-red-600"}`}>
                  ${alert.difference.toFixed(2)} ({alert.percentAbove.toFixed(1)}%)
                </span>{" "}
                higher than the best available market price.
              </p>
              <div className="mt-3 flex gap-4 text-xs">
                <div className={`rounded-lg px-3 py-1.5 ${alert.isRead ? "bg-gray-100" : "bg-white"}`}>
                  <span className="text-gray-500">Your price:</span>{" "}
                  <span className="font-bold text-gray-900">${alert.yourPrice.toFixed(2)}</span>
                </div>
                <div className={`rounded-lg px-3 py-1.5 ${alert.isRead ? "bg-gray-100" : "bg-white"}`}>
                  <span className="text-gray-500">Best market price:</span>{" "}
                  <span className={`font-bold ${alert.isRead ? "text-gray-900" : "text-red-600"}`}>
                    ${alert.lowestMarketPrice.toFixed(2)}
                  </span>
                </div>
                <div className={`rounded-lg px-3 py-1.5 ${alert.isRead ? "bg-gray-100" : "bg-white"}`}>
                  <span className="text-gray-500">Market avg:</span>{" "}
                  <span className="font-bold text-gray-900">${alert.marketAverage.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
