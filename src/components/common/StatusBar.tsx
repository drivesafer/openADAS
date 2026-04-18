import { useEffect, useState } from "react";
import { NotificationService } from "@/services/NotificationService";

export function StatusBar() {
  const [message, setMessage] = useState(NotificationService.lastStatus);

  useEffect(() => {
    return NotificationService.onStatus(setMessage);
  }, []);

  if (!message) return null;

  return (
    <div className="text-xs text-amber-400">{message}</div>
  );
}
