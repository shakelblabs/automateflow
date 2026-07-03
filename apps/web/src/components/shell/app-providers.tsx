import type { ReactNode } from "react";

import { CampaignCanvasProvider } from "@/components/shell/campaign-canvas-provider";
import { SenderAccountsProvider } from "@/components/shell/sender-accounts-provider";
import { TemplateLibraryProvider } from "@/components/shell/template-library-provider";
import { AppShell } from "@/components/shell/app-shell";

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <CampaignCanvasProvider>
      <SenderAccountsProvider>
        <TemplateLibraryProvider>
          <AppShell>{children}</AppShell>
        </TemplateLibraryProvider>
      </SenderAccountsProvider>
    </CampaignCanvasProvider>
  );
}
