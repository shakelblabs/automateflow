"use client";

import type { ReactNode } from "react";

import { AppSidebar } from "@/components/shell/app-sidebar";
import { GlobalTopBar } from "@/components/shell/global-top-bar";

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  return (
    <div className="flex h-screen bg-white">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <GlobalTopBar />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
