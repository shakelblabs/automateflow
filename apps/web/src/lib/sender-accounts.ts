/** MOCK — replace with real data once Sender Accounts backend exists. */

export type SenderConnectionType = "smtp" | "oauth";

export interface SenderAccount {
  id: string;
  email: string;
  connectionType: SenderConnectionType;
  dailyCap: number;
  mockUsageToday: number;
}

export interface PoolPreviewRow {
  accountId: string;
  email: string;
  assignedToday: number;
  roomLeft: number;
}

export const MOCK_SENDER_ACCOUNTS: SenderAccount[] = [
  {
    id: "sender-1",
    email: "alex@outboundlabs.io",
    connectionType: "smtp",
    dailyCap: 50,
    mockUsageToday: 32,
  },
  {
    id: "sender-2",
    email: "team@growthmail.co",
    connectionType: "smtp",
    dailyCap: 50,
    mockUsageToday: 18,
  },
];

export function createSenderAccount(
  email: string,
  dailyCap: number,
): SenderAccount {
  return {
    id: `sender-${crypto.randomUUID()}`,
    email,
    connectionType: "smtp",
    dailyCap,
    mockUsageToday: 0,
  };
}

export function computePoolPreview(accounts: SenderAccount[]): PoolPreviewRow[] {
  return accounts.map((account) => ({
    accountId: account.id,
    email: account.email,
    assignedToday: account.mockUsageToday,
    roomLeft: Math.max(0, account.dailyCap - account.mockUsageToday),
  }));
}
