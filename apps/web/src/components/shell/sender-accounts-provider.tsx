"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import {
  MOCK_SENDER_ACCOUNTS,
  createSenderAccount,
  type SenderAccount,
} from "@/lib/sender-accounts";

interface SenderAccountsContextValue {
  accounts: SenderAccount[];
  addAccount: (email: string, dailyCap: number) => SenderAccount;
  updateAccount: (
    id: string,
    updates: Pick<SenderAccount, "email" | "dailyCap">,
  ) => void;
  deleteAccount: (id: string) => void;
}

const SenderAccountsContext = createContext<SenderAccountsContextValue | null>(
  null,
);

export function SenderAccountsProvider({ children }: { children: ReactNode }) {
  const [accounts, setAccounts] =
    useState<SenderAccount[]>(MOCK_SENDER_ACCOUNTS);

  const addAccount = useCallback((email: string, dailyCap: number) => {
    const account = createSenderAccount(email, dailyCap);
    setAccounts((current) => [...current, account]);
    return account;
  }, []);

  const updateAccount = useCallback(
    (id: string, updates: Pick<SenderAccount, "email" | "dailyCap">) => {
      setAccounts((current) =>
        current.map((account) =>
          account.id === id ? { ...account, ...updates } : account,
        ),
      );
    },
    [],
  );

  const deleteAccount = useCallback((id: string) => {
    setAccounts((current) => current.filter((account) => account.id !== id));
  }, []);

  const value = useMemo(
    () => ({
      accounts,
      addAccount,
      updateAccount,
      deleteAccount,
    }),
    [accounts, addAccount, updateAccount, deleteAccount],
  );

  return (
    <SenderAccountsContext.Provider value={value}>
      {children}
    </SenderAccountsContext.Provider>
  );
}

export function useSenderAccounts() {
  const context = useContext(SenderAccountsContext);
  if (!context) {
    throw new Error(
      "useSenderAccounts must be used within SenderAccountsProvider",
    );
  }
  return context;
}
