"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Check, Copy } from "lucide-react";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  return (
    <div className={`prose prose-invert max-w-none text-xs sm:text-sm leading-relaxed ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-lg sm:text-xl font-[652] text-white tracking-tight mt-3 mb-2 border-b border-[#1F2937] pb-1">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base sm:text-lg font-[652] text-white tracking-tight mt-3 mb-1.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm sm:text-base font-[600] text-[#E5E7EB] mt-2 mb-1">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-xs sm:text-sm font-[600] text-[#D1D5DB] mt-2 mb-1">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="my-1.5 text-[#E5E7EB] leading-relaxed font-[300]">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-2 space-y-1 text-[#E5E7EB]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1 text-[#E5E7EB]">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="pl-1 text-[#E5E7EB] leading-normal font-[300]">
              {children}
            </li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-[#0066FF] pl-3.5 my-2.5 py-0.5 text-[#9CA3AF] italic bg-[#161B22]/40 rounded-r-lg">
              {children}
            </blockquote>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#38BDF8] hover:text-[#60A5FA] underline underline-offset-2 transition-colors font-[500]"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-[652] text-white">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-[#E5E7EB]">{children}</em>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3 rounded-xl border border-[#30363D] bg-[#0D1117]">
              <table className="w-full border-collapse text-left text-xs">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[#161B22] text-[#9CA3AF] font-[600] border-b border-[#30363D] uppercase tracking-wider text-[10px]">
              {children}
            </thead>
          ),
          th: ({ children }) => (
            <th className="px-3.5 py-2.5 font-[600] text-[#D1D5DB]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3.5 py-2 border-t border-[#1F2937] text-[#E5E7EB]">
              {children}
            </td>
          ),
          code: ({ className: codeClassName, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(codeClassName || "");
            const isInline = !match && !String(children).includes("\n");

            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-md bg-[#161B22] border border-[#30363D] text-[#38BDF8] font-mono text-[11px]"
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <CodeBlock language={match?.[1] || "text"}>
                {String(children).replace(/\n$/, "")}
              </CodeBlock>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

function CodeBlock({
  language,
  children,
}: {
  language: string;
  children: string;
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(children);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  return (
    <div className="relative my-3 rounded-xl border border-[#30363D] bg-[#0D1117] overflow-hidden group">
      <div className="flex items-center justify-between px-3.5 py-1.5 bg-[#161B22] border-b border-[#30363D] text-[11px] text-[#9CA3AF] font-mono">
        <span className="uppercase">{language}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[10px] text-[#9CA3AF] hover:text-white px-2 py-0.5 rounded bg-[#0D1117] border border-[#30363D] hover:border-[#4B5563] transition-all cursor-pointer"
          title="Copy code"
        >
          {copied ? (
            <>
              <Check className="w-3 h-3 text-emerald-400" />
              <span className="text-emerald-400">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </>
          )}
        </button>
      </div>
      <pre className="p-3.5 overflow-x-auto text-[11px] sm:text-xs font-mono text-[#E5E7EB] leading-relaxed">
        <code>{children}</code>
      </pre>
    </div>
  );
}
