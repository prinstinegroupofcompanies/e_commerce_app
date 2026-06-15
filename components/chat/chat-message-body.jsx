"use client";

import Link from "next/link";

/**
 * Lightweight markdown: **bold**, [text](/path), newlines.
 * @param {{ text: string }} props
 */
export function ChatMessageBody({ text }) {
  const lines = text.split("\n");

  return (
    <div className="space-y-1.5 text-sm leading-relaxed">
      {lines.map((line, i) => (
        <p key={i} className="whitespace-pre-wrap">
          {parseInline(line)}
        </p>
      ))}
    </div>
  );
}

/**
 * @param {string} line
 */
function parseInline(line) {
  const parts = [];
  const re = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g;
  let last = 0;
  let m;
  while ((m = re.exec(line)) !== null) {
    if (m.index > last) parts.push(line.slice(last, m.index));
    const token = m[0];
    if (token.startsWith("**")) {
      parts.push(
        <strong key={m.index} className="font-semibold">
          {token.slice(2, -2)}
        </strong>
      );
    } else {
      const linkMatch = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      if (linkMatch) {
        const [, label, href] = linkMatch;
        const internal = href.startsWith("/");
        parts.push(
          internal ? (
            <Link key={m.index} href={href} className="font-medium text-primary underline-offset-2 hover:underline">
              {label}
            </Link>
          ) : (
            <a key={m.index} href={href} className="font-medium text-primary underline-offset-2 hover:underline" target="_blank" rel="noopener noreferrer">
              {label}
            </a>
          )
        );
      }
    }
    last = m.index + token.length;
  }
  if (last < line.length) parts.push(line.slice(last));
  return parts.length ? parts : line;
}
