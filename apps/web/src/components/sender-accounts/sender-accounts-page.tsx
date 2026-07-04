"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";

import { useSenderAccounts } from "@/components/shell/sender-accounts-provider";
import { DeleteSenderAccountDialog } from "@/components/sender-accounts/delete-sender-account-dialog";
import { PoolVisualization } from "@/components/sender-accounts/pool-visualization";
import {
  SenderAccountDialog,
  type SenderAccountFormValues,
} from "@/components/sender-accounts/sender-account-dialog";
import { SenderAccountList } from "@/components/sender-accounts/sender-account-list";
import { SenderAccountsHeader } from "@/components/sender-accounts/sender-accounts-header";
import type { SenderAccount } from "@/lib/sender-accounts";

export function SenderAccountsPage() {
  const { accounts, addAccount, updateAccount, deleteAccount } =
    useSenderAccounts();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [selectedAccount, setSelectedAccount] = useState<SenderAccount | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);

  const openAdd = useCallback(() => {
    setDialogMode("add");
    setSelectedAccount(null);
    setDialogOpen(true);
  }, []);

  const openEdit = useCallback((account: SenderAccount) => {
    setDialogMode("edit");
    setSelectedAccount(account);
    setDialogOpen(true);
  }, []);

  const handleSave = useCallback(
    (values: SenderAccountFormValues) => {
      if (dialogMode === "add") {
        addAccount(values.email.trim(), values.dailyCap);
        toast.success("Sender account added", {
          description: `${values.email.trim()} is ready (mock/local).`,
        });
      } else if (selectedAccount) {
        updateAccount(selectedAccount.id, {
          email: values.email.trim(),
          dailyCap: values.dailyCap,
        });
        toast.success("Sender account updated", {
          description: `Changes saved for ${values.email.trim()}.`,
        });
      }
      setDialogOpen(false);
    },
    [dialogMode, selectedAccount, addAccount, updateAccount],
  );

  const handleDeleteRequest = useCallback(() => {
    setDeleteOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(() => {
    if (!selectedAccount) return;
    const email = selectedAccount.email;
    deleteAccount(selectedAccount.id);
    setDeleteOpen(false);
    setDialogOpen(false);
    setSelectedAccount(null);
    toast.success("Sender account deleted", {
      description: `${email} removed from your account list.`,
    });
  }, [selectedAccount, deleteAccount]);

  return (
    <div className="flex h-full flex-col bg-gradient-to-br from-slate-50 via-white to-slate-100/50">
      <SenderAccountsHeader onAdd={openAdd} accounts={accounts} />

      <div className="min-h-0 flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <SenderAccountList accounts={accounts} onSelect={openEdit} />
          </div>
          <div className="lg:col-span-1">
            <PoolVisualization accounts={accounts} />
          </div>
        </div>
      </div>

      <SenderAccountDialog
        open={dialogOpen}
        mode={dialogMode}
        account={selectedAccount}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
        onDelete={dialogMode === "edit" ? handleDeleteRequest : undefined}
      />

      <DeleteSenderAccountDialog
        open={deleteOpen}
        email={selectedAccount?.email ?? ""}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
