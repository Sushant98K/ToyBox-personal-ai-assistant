import React from "react";
import {
  GmailIcon,
  SlackIcon,
  WhatsAppIcon,
  TelegramIcon,
  OutlookIcon,
} from "@/components/icons";
import { Calendar, CheckCircle2 } from "lucide-react";
import { supportedIntegrations } from "@/config";

export function IntegrationMarquee() {
  const getIcon = (id: string) => {
    switch (id) {
      case "gmail":
        return <GmailIcon size={26} />;
      case "slack":
        return <SlackIcon size={26} />;
      case "whatsapp":
        return <WhatsAppIcon size={26} />;
      case "telegram":
        return <TelegramIcon size={26} />;
      case "outlook":
        return <OutlookIcon size={26} />;
      case "gcal":
        return (
          <div className="w-full h-full bg-[#4285F4] flex items-center justify-center text-white">
            <Calendar className="w-3.5 h-3.5" />
          </div>
        );
      case "notion":
        return (
          <div className="w-full h-full bg-[#141414] flex items-center justify-center text-white font-bold text-xs">
            N
          </div>
        );
      default:
        return null;
    }
  };

  // Duplicate for seamless infinite marquee loop
  const marqueeItems = [...supportedIntegrations, ...supportedIntegrations];

  return (
    <section id="integrations" className="py-16 md:py-24 border-y border-[#f0f0f0] bg-white overflow-hidden">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mb-12 text-center">
        <h2 className="text-3xl sm:text-4xl md:text-[44px] font-[650] text-[#141414] leading-[1.13] tracking-tight">
          Connect every inbox and messenger in 60 seconds.
        </h2>
        <p className="mt-4 text-lg text-[#707070] font-[300] leading-[1.38] max-w-2xl mx-auto">
          Toybox establishes read-and-synthesize connections through official APIs and certified OAuth 2.0. No credential sharing, zero unencrypted storage.
        </p>
      </div>

      {/* Marquee Track */}
      <div className="relative w-full overflow-hidden">
        {/* Soft Edge Masking */}
        <div className="absolute left-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
        <div className="absolute right-0 top-0 bottom-0 w-16 sm:w-28 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />

        <div className="animate-marquee flex items-center gap-4 py-2">
          {marqueeItems.map((item, index) => (
            <div
              key={`${item.id}-${index}`}
              className="flex items-center gap-4 bg-[#f3f3f3] hover:bg-[#e0e0e0]/70 border border-[#e0e0e0]/50 rounded-[20px] px-5 py-3.5 shrink-0 transition-all select-none"
            >
              {/* iOS-style 30% Squircle Icon */}
              <div
                className="w-12 h-12 flex items-center justify-center bg-white overflow-hidden shrink-0"
                style={{ borderRadius: "30%" }}
              >
                {getIcon(item.id)}
              </div>

              {/* Text Info */}
              <div className="text-left">
                <div className="flex items-center gap-2">
                  <span className="font-[650] text-[16px] text-[#141414] tracking-tight">
                    {item.name}
                  </span>
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                </div>
                <div className="text-xs text-[#707070] font-[450] mt-0.5">
                  {item.role}
                </div>
                <div className="text-[10px] text-[#adadad] font-[450]">
                  {item.status}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust & Spec Metric Strip */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div className="p-4 rounded-[16px] bg-[#f3f3f3]">
          <div className="text-2xl sm:text-3xl font-[650] text-[#141414]">
            5 Inboxes
          </div>
          <div className="text-xs text-[#707070] font-[450] mt-1">
            Simultaneously unified
          </div>
        </div>
        <div className="p-4 rounded-[16px] bg-[#f3f3f3]">
          <div className="text-2xl sm:text-3xl font-[650] text-[#141414]">
            15 Sec
          </div>
          <div className="text-xs text-[#707070] font-[450] mt-1">
            Real-time sync latency
          </div>
        </div>
        <div className="p-4 rounded-[16px] bg-[#f3f3f3]">
          <div className="text-2xl sm:text-3xl font-[650] text-[#141414]">
            100% Local
          </div>
          <div className="text-xs text-[#707070] font-[450] mt-1">
            Client token encryption
          </div>
        </div>
        <div className="p-4 rounded-[16px] bg-[#f3f3f3]">
          <div className="text-2xl sm:text-3xl font-[650] text-[#141414]">
            2.4 hrs
          </div>
          <div className="text-xs text-[#707070] font-[450] mt-1">
            Saved per executive daily
          </div>
        </div>
      </div>
    </section>
  );
}
