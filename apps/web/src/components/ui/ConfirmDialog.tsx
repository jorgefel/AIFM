"use client";

import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, X } from "lucide-react";
import { Button } from "./Button";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmLabel?: string;
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "¿Estás seguro?",
  message = "Esta acción no se puede deshacer.",
  confirmLabel = "Eliminar",
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[90]"
          />

          {/* Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-0 flex items-center justify-center z-[95] p-4"
          >
            <div className="w-full max-w-sm card-surface p-6 relative">
              <button
                onClick={onClose}
                className="absolute top-4 right-4 text-ink-muted hover:text-ink transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-14 h-14 bg-red-50 rounded-full flex items-center justify-center mb-4 border border-red-100">
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>

                <h3 className="text-lg font-bold text-ink mb-1">{title}</h3>
                <p className="text-sm text-ink-muted mb-6 max-w-xs">{message}</p>

                <div className="flex gap-3 w-full">
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={onConfirm}
                    isLoading={isLoading}
                    className="flex-1"
                  >
                    {confirmLabel}
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
