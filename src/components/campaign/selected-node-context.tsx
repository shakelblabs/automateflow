"use client";

import { createContext, useContext } from "react";

const SelectedNodeContext = createContext<string | null>(null);

export function SelectedNodeProvider({
  selectedNodeId,
  children,
}: {
  selectedNodeId: string | null;
  children: React.ReactNode;
}) {
  return (
    <SelectedNodeContext.Provider value={selectedNodeId}>
      {children}
    </SelectedNodeContext.Provider>
  );
}

export function useSelectedNodeId() {
  return useContext(SelectedNodeContext);
}
