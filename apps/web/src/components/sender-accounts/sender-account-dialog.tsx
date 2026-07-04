"use client";

import { useEffect, useState } from "react";
import { Mail, X } from "lucide-react";

import { AppButton } from "@/components/app-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { SenderAccount } from "@/lib/sender-accounts";

const OAUTH_TOOLTIP = "Coming soon — OAuth connection";
const TEST_CONNECTION_TOOLTIP = "Coming soon";

export interface SenderAccountFormValues {
  email: string;
  smtpHost: string;
  smtpPort: string;
  smtpUsername: string;
  smtpPassword: string;
  imapHost: string;
  imapPort: string;
  imapUsername: string;
  imapPassword: string;
  dailyCap: number;
}

interface SenderAccountDialogProps {
  open: boolean;
  mode: "add" | "edit";
  account: SenderAccount | null;
  onClose: () => void;
  onSave: (values: SenderAccountFormValues) => void;
  onDelete?: () => void;
}

const DEFAULT_DAILY_CAP = 50;

function emptyForm(): SenderAccountFormValues {
  return {
    email: "",
    smtpHost: "",
    smtpPort: "587",
    smtpUsername: "",
    smtpPassword: "",
    imapHost: "",
    imapPort: "993",
    imapUsername: "",
    imapPassword: "",
    dailyCap: DEFAULT_DAILY_CAP,
  };
}

export function SenderAccountDialog({
  open,
  mode,
  account,
  onClose,
  onSave,
  onDelete,
}: SenderAccountDialogProps) {
  const [form, setForm] = useState<SenderAccountFormValues>(emptyForm());
  const [sameAsSmtp, setSameAsSmtp] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (mode === "edit" && account) {
      setForm({
        email: account.email,
        smtpHost: "",
        smtpPort: "587",
        smtpUsername: "",
        smtpPassword: "",
        imapHost: "",
        imapPort: "993",
        imapUsername: "",
        imapPassword: "",
        dailyCap: account.dailyCap,
      });
    } else {
      setForm(emptyForm());
    }
    setSameAsSmtp(true);
    setError(null);
  }, [open, mode, account]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const update = (patch: Partial<SenderAccountFormValues>) => {
    setForm((current) => {
      const next = { ...current, ...patch };
      if (sameAsSmtp && ("smtpUsername" in patch || "smtpPassword" in patch)) {
        next.imapUsername = next.smtpUsername;
        next.imapPassword = next.smtpPassword;
      }
      return next;
    });
  };

  const submit = () => {
    const email = form.email.trim();
    if (!email) {
      setError("Email address is required.");
      return;
    }
    if (mode === "add") {
      if (!form.smtpHost.trim() || !form.smtpPort.trim()) {
        setError("SMTP host and port are required.");
        return;
      }
      if (!form.smtpUsername.trim() || !form.smtpPassword.trim()) {
        setError("SMTP username and password are required.");
        return;
      }
      if (!sameAsSmtp && (!form.imapHost.trim() || !form.imapPort.trim())) {
        setError("IMAP host and port are required.");
        return;
      }
    }
    setError(null);
    // MOCK — credentials captured in local state only, never transmitted.
    onSave(form);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-slate-900/20 backdrop-blur-sm p-4 pt-[8vh] transition-all duration-300"
      data-testid="sender-account-overlay"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-label={mode === "add" ? "Add sender account" : "Edit sender account"}
        data-testid="sender-account-dialog"
        onClick={(event) => event.stopPropagation()}
        className="max-h-[85vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-slate-200/80 bg-white/95 backdrop-blur-xl shadow-2xl animate-in fade-in zoom-in-95 duration-300"
      >
        <div className="sticky top-0 flex items-start justify-between border-b border-slate-200/80 bg-white/90 backdrop-blur-md p-5 z-10">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-100 to-teal-50 text-emerald-600 shadow-sm ring-1 ring-emerald-500/10">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight text-slate-900">
                {mode === "add" ? "Add Sender Account" : "Edit Sender Account"}
              </h2>
              <p className="text-xs font-medium text-slate-500">
                Configure outbound email credentials (mock/local only).
              </p>
            </div>
          </div>
          <AppButton
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close"
            data-testid="sender-account-close"
            className="hover:bg-slate-100/80 rounded-full"
          >
            <X className="h-4 w-4" />
          </AppButton>
        </div>

        <div className="p-5">
          <Tabs defaultValue="manual">
            <TabsList className="mb-5 w-full bg-slate-100/50 p-1 rounded-lg">
              <TabsTrigger value="oauth" className="flex-1 rounded-md" disabled>
                OAuth
              </TabsTrigger>
              <TabsTrigger value="manual" className="flex-1 rounded-md">
                Manual (SMTP/IMAP)
              </TabsTrigger>
            </TabsList>

            <TabsContent value="oauth" className="space-y-3">
              <AppButton
                variant="secondary"
                size="sm"
                disabled
                title={OAUTH_TOOLTIP}
                data-testid="oauth-google"
                className="w-full bg-slate-50 text-slate-400 border-dashed"
              >
                Connect with Google
              </AppButton>
              <AppButton
                variant="secondary"
                size="sm"
                disabled
                title={OAUTH_TOOLTIP}
                data-testid="oauth-outlook"
                className="w-full bg-slate-50 text-slate-400 border-dashed"
              >
                Connect with Outlook
              </AppButton>
            </TabsContent>

            <TabsContent value="manual" className="space-y-5">
              <div className="flex gap-2">
                <AppButton
                  variant="secondary"
                  size="sm"
                  disabled
                  title={OAUTH_TOOLTIP}
                  data-testid="oauth-google-inline"
                  className="flex-1 bg-slate-50 text-slate-400 border-dashed"
                >
                  Connect with Google
                </AppButton>
                <AppButton
                  variant="secondary"
                  size="sm"
                  disabled
                  title={OAUTH_TOOLTIP}
                  data-testid="oauth-outlook-inline"
                  className="flex-1 bg-slate-50 text-slate-400 border-dashed"
                >
                  Connect with Outlook
                </AppButton>
              </div>

              <div>
                <Label htmlFor="sender-email" className="text-xs font-semibold text-slate-700">
                  Email address
                </Label>
                <Input
                  id="sender-email"
                  data-testid="sender-email-input"
                  value={form.email}
                  onChange={(event) => update({ email: event.target.value })}
                  placeholder="you@company.com"
                  className="mt-1.5 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500 transition-all bg-white"
                />
              </div>

              <fieldset className="space-y-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 shadow-sm">
                <legend className="px-2 text-xs font-semibold tracking-wide text-slate-600 bg-slate-50/50">
                  SMTP Details
                </legend>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="smtp-host" className="text-xs font-medium text-slate-700">
                      Host
                    </Label>
                    <Input
                      id="smtp-host"
                      data-testid="smtp-host-input"
                      value={form.smtpHost}
                      onChange={(event) => update({ smtpHost: event.target.value })}
                      placeholder="smtp.example.com"
                      className="mt-1.5 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500 transition-all bg-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="smtp-port" className="text-xs font-medium text-slate-700">
                      Port
                    </Label>
                    <Input
                      id="smtp-port"
                      data-testid="smtp-port-input"
                      value={form.smtpPort}
                      onChange={(event) => update({ smtpPort: event.target.value })}
                      className="mt-1.5 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500 transition-all bg-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="smtp-user" className="text-xs font-medium text-slate-700">
                    Username
                  </Label>
                  <Input
                    id="smtp-user"
                    data-testid="smtp-username-input"
                    value={form.smtpUsername}
                    onChange={(event) =>
                      update({ smtpUsername: event.target.value })
                    }
                    className="mt-1.5 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500 transition-all bg-white"
                  />
                </div>
                <div>
                  <Label htmlFor="smtp-pass" className="text-xs font-medium text-slate-700">
                    Password
                  </Label>
                  <Input
                    id="smtp-pass"
                    type="password"
                    data-testid="smtp-password-input"
                    value={form.smtpPassword}
                    onChange={(event) =>
                      update({ smtpPassword: event.target.value })
                    }
                    className="mt-1.5 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500 transition-all bg-white"
                  />
                </div>
              </fieldset>

              <fieldset className="space-y-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 shadow-sm">
                <legend className="px-2 text-xs font-semibold tracking-wide text-slate-600 bg-slate-50/50">
                  IMAP Details
                </legend>
                <label className="flex items-center gap-2 text-xs font-medium text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={sameAsSmtp}
                    onChange={(event) => setSameAsSmtp(event.target.checked)}
                    data-testid="same-as-smtp-checkbox"
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  Same as SMTP credentials
                </label>
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-2">
                    <Label htmlFor="imap-host" className="text-xs font-medium text-slate-700">
                      Host
                    </Label>
                    <Input
                      id="imap-host"
                      data-testid="imap-host-input"
                      value={form.imapHost}
                      onChange={(event) => update({ imapHost: event.target.value })}
                      placeholder="imap.example.com"
                      disabled={sameAsSmtp}
                      className="mt-1.5 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500 transition-all bg-white disabled:bg-slate-50/50 disabled:opacity-75"
                    />
                  </div>
                  <div>
                    <Label htmlFor="imap-port" className="text-xs font-medium text-slate-700">
                      Port
                    </Label>
                    <Input
                      id="imap-port"
                      data-testid="imap-port-input"
                      value={form.imapPort}
                      onChange={(event) => update({ imapPort: event.target.value })}
                      disabled={sameAsSmtp}
                      className="mt-1.5 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500 transition-all bg-white disabled:bg-slate-50/50 disabled:opacity-75"
                    />
                  </div>
                </div>
              </fieldset>

              <div>
                <Label htmlFor="daily-cap" className="text-xs font-semibold text-slate-700">
                  Daily cap
                </Label>
                <Input
                  id="daily-cap"
                  type="number"
                  min={1}
                  data-testid="daily-cap-input"
                  value={form.dailyCap}
                  onChange={(event) =>
                    update({ dailyCap: Number(event.target.value) || DEFAULT_DAILY_CAP })
                  }
                  className="mt-1.5 shadow-sm focus-visible:ring-2 focus-visible:ring-emerald-500/40 focus-visible:border-emerald-500 transition-all bg-white"
                />
              </div>

              {error ? (
                <p className="text-xs font-medium text-red-600 bg-red-50 p-2 rounded-md" data-testid="sender-form-error">
                  {error}
                </p>
              ) : null}
            </TabsContent>
          </Tabs>
        </div>

        <div className="sticky bottom-0 flex items-center justify-between gap-2 border-t border-slate-200/80 bg-slate-50/90 backdrop-blur-md p-5 z-10 rounded-b-2xl">
          <div className="flex items-center gap-2">
            <AppButton
              variant="secondary"
              size="sm"
              disabled
              title={TEST_CONNECTION_TOOLTIP}
              data-testid="test-connection"
              className="bg-white text-slate-400 border border-slate-200/60"
            >
              Test Connection
            </AppButton>
            {mode === "edit" && onDelete && (
              <AppButton
                variant="ghost"
                size="sm"
                onClick={onDelete}
                data-testid="sender-account-delete"
                className="text-red-600 hover:text-red-700 hover:bg-red-50 font-medium"
              >
                Delete
              </AppButton>
            )}
          </div>
          <div className="flex items-center gap-2">
            <AppButton variant="ghost" size="sm" onClick={onClose} className="font-medium">
              Cancel
            </AppButton>
            <AppButton
              variant="primary"
              size="sm"
              onClick={submit}
              data-testid="sender-account-save"
              className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white shadow-lg shadow-emerald-500/20 hover:-translate-y-0.5 transition-all border-0 font-medium"
            >
              {mode === "add" ? "Add account" : "Save changes"}
            </AppButton>
          </div>
        </div>
      </div>
    </div>
  );
}
