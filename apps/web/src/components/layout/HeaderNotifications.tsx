"use client";

import { useRef, useState, useEffect } from "react";
import { Bell } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useNotifications } from "@/hooks/useNotifications";

export function HeaderNotifications() {
  const { notifications } = useNotifications();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={notifRef}>
      <button 
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative w-10 h-10 flex items-center justify-center rounded-full bg-card shadow-sm border border-line-soft text-ink-muted hover:text-violet-600 hover:border-violet-200 transition-colors"
      >
        <Bell className="w-[18px] h-[18px]" />
        {notifications.length > 0 && (
          <span className="absolute top-2 right-2 w-2 h-2 bg-coral-accent rounded-full border-2 border-white" />
        )}
      </button>

      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 top-full mt-2 w-80 bg-card border border-line-soft rounded-xl shadow-xl z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-line-soft">
              <h4 className="text-sm font-semibold text-ink">Notificaciones</h4>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-ink-muted">
                  Sin alertas por ahora. ¡Todo bien! 🎉
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className="p-3 hover:bg-surface transition-colors border-b border-line-soft last:border-b-0">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">{notif.icon}</div>
                      <div>
                        <p className="text-sm font-medium text-ink">{notif.title}</p>
                        <p className="text-xs text-ink-muted mt-0.5">{notif.message}</p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
