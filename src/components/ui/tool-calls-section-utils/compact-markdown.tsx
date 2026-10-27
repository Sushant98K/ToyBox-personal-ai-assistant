"use client";

import React from "react";

export function CompactMarkdown({ content }: { content: unknown }) {
  if (content === null || content === undefined) {
    return (
      <span className="text-[11px] text-zinc-400 dark:text-zinc-500 italic">
        Empty
      </span>
    );
  }

  if (typeof content === "object") {
    return (
      <pre className="text-[11px] font-mono leading-relaxed bg-zinc-200/50 dark:bg-black/40 text-zinc-800 dark:text-zinc-200 p-2.5 rounded-lg overflow-x-auto max-w-full border border-zinc-300/40 dark:border-zinc-800">
        {JSON.stringify(content, null, 2)}
      </pre>
    );
  }

  return (
    <div className="text-[11px] leading-relaxed text-zinc-700 dark:text-zinc-300 whitespace-pre-wrap break-words">
      {String(content)}
    </div>
  );
}
