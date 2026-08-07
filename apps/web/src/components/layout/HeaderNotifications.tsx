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
        className="relative p-2 text-slate-400 hover:text-emerald-400 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {notifications.length > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-coral-accent rounded-full border-2 border-obsidian" />
        )}
      </button>

      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="absolute right-0 top-full mt-2 w-80 bg-obsidian border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-3 border-b border-white/5">
              <h4 className="text-sm font-semibold text-white">Notificaciones</h4>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-500">
                  Sin alertas por ahora. ¡Todo bien! 🎉
                </div>
              ) : (
                notifications.map((notif) => (
                  <div key={notif.id} className="p-3 hover:bg-white/5 transition-colors border-b border-white/5 last:border-b-0">
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">{notif.icon}</div>
                      <div>
                        <p className="text-sm font-medium text-slate-200">{notif.title}</p>
                        <p className="text-xs text-slate-500 mt-0.5">{notif.message}</p>
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
