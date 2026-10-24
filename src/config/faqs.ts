import { FaqItem } from "@/types";

export const faqItems: FaqItem[] = [
  {
    question: "How does ToyBox.ai connect to WhatsApp and Telegram without my password?",
    answer:
      "ToyBox.ai connects to WhatsApp via the official WhatsApp Business / Web Multi-Device protocol and Telegram via MTProto bridge sessions. We never ask for your passwords or SMS verification codes directly. You authenticate through a QR scan or OAuth token directly verified on your own device.",
  },
  {
    question: "Is my personal and company communication private?",
    answer:
      "Absolutely. We operate under a strict zero-retention data architecture. Your messages are parsed in ephemeral volatile memory (RAM) and immediately discarded once the structured brief or reminder is delivered. We do not maintain a permanent database of your conversations, and we never train public or private AI models on your inputs.",
  },
  {
    question: "Can I customize the frequency and timing of summaries?",
    answer:
      "Yes. You have total granular control. You can configure morning briefings (e.g., 7:30 AM), midday check-ins (1:00 PM), or end-of-day wrap-ups (6:00 PM). You can also request an on-demand summary at any time directly through our web app or Telegram bot.",
  },
  {
    question: "How does ToyBox.ai distinguish between spam and VIP emergencies?",
    answer:
      "ToyBox.ai combines semantic understanding with your communication graph. Key contacts (such as your co-founders, board members, key enterprise clients, or family members) are marked with VIP rules. While promotional newsletters and active group chatter are batched for later, VIP urgent requests trigger instant notifications.",
  },
  {
    question: "Does ToyBox.ai send replies autonomously without my knowledge?",
    answer:
      "Never. ToyBox.ai prepares suggested drafts with full context, but will only send messages after you explicitly review and tap 'Approve'. You retain complete editorial control at all times.",
  },
  {
    question: "What happens if I decide to cancel my subscription?",
    answer:
      "You can cancel with one click directly from your dashboard settings. Upon cancellation, your OAuth connection tokens and preferences are permanently wiped from our cryptographic vault within 24 hours.",
  },
];
