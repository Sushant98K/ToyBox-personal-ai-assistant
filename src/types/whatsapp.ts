export interface WhatsAppSessionState {
  userId: string;
  phoneNumber?: string;
  cleanPhone?: string;
  status: "disconnected" | "connecting" | "awaiting_code" | "connected" | "error";
  pairingCode?: string;
  codeGeneratedAt?: string;
  lastConnectedAt?: string;
  errorMessage?: string;
  syncMessages?: boolean;
}

export interface WhatsAppMessage {
  id: string;
  from: string;
  senderName: string;
  chatJid: string;
  text: string;
  timestamp: string;
  isGroup: boolean;
  fromMe: boolean;
  unread: boolean;
}
