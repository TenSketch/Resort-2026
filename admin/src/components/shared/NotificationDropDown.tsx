import { Bell } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const dummyNotifications = [
  { id: 1, title: "New Reservation", message: "Booking for Jungle Star.", time: "2m ago", read: false },
  { id: 2, title: "System Alert", message: "Server restarted successfully.", time: "1h ago", read: true },
];

const NotificationDropdown = () => {
  const [notifications, setNotifications] = useState(dummyNotifications);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="relative h-8 w-8 sm:h-9 sm:w-9 p-0">
          <Bell className="h-4 w-4 sm:h-5 sm:w-5" />
          {notifications.some((n) => !n.read) && (
            <span className="absolute -top-0.5 -right-0.5 sm:top-0.5 sm:right-0.5 bg-red-500 text-white text-[10px] sm:text-xs w-3.5 h-3.5 sm:w-4 sm:h-4 flex items-center justify-center rounded-full">
              {notifications.filter((n) => !n.read).length}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72 sm:w-80 max-h-96 overflow-y-auto">
        <DropdownMenuLabel>Notifications</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No new notifications</div>
        ) : (
          notifications.map((n) => (
            <DropdownMenuItem key={n.id} className={`${n.read ? "opacity-70" : "font-medium"}`}>
              <div className="flex flex-col items-start w-full">
                <div className="flex justify-between w-full">
                  <span>{n.title}</span>
                  <span className="text-xs text-gray-400">{n.time}</span>
                </div>
                <p className="text-sm text-gray-600">{n.message}</p>
              </div>
            </DropdownMenuItem>
          ))
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="text-center text-blue-600 cursor-pointer"
          onClick={() => setNotifications([])}
        >
          Clear All
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default NotificationDropdown;
