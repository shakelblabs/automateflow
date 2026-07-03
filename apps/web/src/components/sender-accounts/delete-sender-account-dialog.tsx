"use client";

import { useEffect } from "react";
import { AlertTriangle, X } from "lucide-react";

import { AppButton } from "@/components/app-button";

interface DeleteSenderAccountDialogProps {
  open: boolean;
  email: string;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteSenderAccountDialog({
  open,
  email,
  onClose,
  onConfirm,
}: DeleteSenderAccountDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/40 p-4 pt-[12vh]"
      data-testid="delete-sender-overlay"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label="Delete sender account"
        data-testid="delete-sender-dialog"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-md rounded-xl border border-slate-200 bg-white shadow-xl"
      >
        <div className="flex items-start justify-between border-b border-slate-200 p-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-100 text-red-700">
              <AlertTriangle className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-slate-900">
                Delete sender account?
              </h2>
              <p className="text-xs text-slate-500">
                This removes {email} from your mock account list.
              </p>
            </div>
          </div>
          <AppButton
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </AppButton>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-slate-200 p-4">
          <AppButton variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </AppButton>
          <AppButton
            variant="primary"
            size="sm"
            onClick={onConfirm}
            data-testid="delete-sender-confirm"
            className="bg-red-600 hover:bg-red-700"
          >
            Delete account
          </AppButton>
        </div>
      </div>
    </div>
  );
}
