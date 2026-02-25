import { Bell, Check, Trash2, CheckCircle2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { notificationService } from "@/services/notificationService";
import type { Notification } from "@/services/notificationService";

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const fetchNotifications = async () => {
    const data = await notificationService.fetchNotifications();
    setNotifications(data);
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000); // 1-minute refresh
    return () => clearInterval(interval);
  }, []);

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.read) {
      await notificationService.markAsRead(notification._id);
      // Optimistic upate
      setNotifications((prev) =>
        prev.map((n) =>
          n._id === notification._id ? { ...n, read: true } : n,
        ),
      );
    }

    if (notification.link) {
      setIsOpen(false);
      navigate(notification.link);
    }
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = async () => {
    await notificationService.clearAll();
    setNotifications([]);
  };

  const handleClearSingle = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation(); // prevent triggering the click handler
    await notificationService.clearNotification(id);
    setNotifications((prev) => prev.filter((n) => n._id !== id));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative flex items-center min-h-[44px] h-11 sm:h-9 px-2"
        >
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 sm:top-0.5 sm:right-0.5 min-w-[16px] h-4 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1 leading-none">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="end"
        className="w-80 sm:w-96 max-h-[80vh] flex flex-col p-0"
      >
        <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-white sticky top-0 z-10">
          <DropdownMenuLabel className="p-0 font-semibold text-slate-800">
            Notifications
          </DropdownMenuLabel>
          <div className="flex gap-2">
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                onClick={handleMarkAllAsRead}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                Mark all read
              </Button>
            )}
            {notifications.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-xs text-slate-500 hover:text-red-600 hover:bg-red-50"
                onClick={handleClearAll}
              >
                <Trash2 className="w-3.5 h-3.5 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center text-center text-slate-500">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                <Bell className="w-6 h-6 text-slate-400" />
              </div>
              <p className="text-sm font-medium">You're all caught up!</p>
              <p className="text-xs text-slate-400 mt-1">
                Check back later for new notifications
              </p>
            </div>
          ) : (
            <div className="py-1">
              {notifications.map((n) => (
                <div
                  key={n._id}
                  className={`
                    relative group px-4 py-3 cursor-pointer border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors
                    ${n.read ? "opacity-75" : "bg-blue-50/40"}
                  `}
                  onClick={() => handleNotificationClick(n)}
                >
                  {/* Unread dot */}
                  {!n.read && (
                    <div className="absolute left-1.5 top-4 w-1.5 h-1.5 rounded-full bg-blue-600" />
                  )}

                  <div className="flex flex-col items-start w-full pl-2 pr-6">
                    <div className="flex justify-between w-full items-start mb-1">
                      <span
                        className={`text-sm ${n.read ? "font-medium text-slate-700" : "font-semibold text-slate-900"}`}
                      >
                        {n.title}
                      </span>
                      <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2 mt-0.5">
                        {formatDistanceToNow(new Date(n.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    <p
                      className={`text-xs ${n.read ? "text-slate-500" : "text-slate-600"}`}
                    >
                      {n.message}
                    </p>
                  </div>

                  {/* Clear single button (appears on hover) */}
                  <div
                    className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-md hover:bg-slate-200 text-slate-400 hover:text-slate-600"
                    onClick={(e) => handleClearSingle(e, n._id)}
                    title="Clear notification"
                  >
                    <Check className="w-4 h-4" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
