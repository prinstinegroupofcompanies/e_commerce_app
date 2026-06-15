"use client";

import { useState } from "react";

/**
 * @param {{
 *   descriptionHtml: string;
 *   reviews: { id: string; rating: number; title?: string | null; body?: string | null; createdAt: string; customerName: string }[];
 * }} props
 */
export function ProductDetailTabs({ descriptionHtml, reviews }) {
  const [tab, setTab] = useState("desc");

  return (
    <div className="mt-10 border-t pt-8">
      <div className="flex gap-2 border-b">
        <button
          type="button"
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors duration-200 ${
            tab === "desc" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("desc")}
        >
          Description
        </button>
        <button
          type="button"
          className={`border-b-2 px-3 py-2 text-sm font-medium transition-colors duration-200 ${
            tab === "reviews" ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
          onClick={() => setTab("reviews")}
        >
          Reviews ({reviews.length})
        </button>
      </div>
      {tab === "desc" ? (
        <div
          className="prose prose-sm mt-6 max-w-none text-muted-foreground motion-safe:animate-fade-in"
          dangerouslySetInnerHTML={{
            __html: descriptionHtml || "<p></p>",
          }}
        />
      ) : (
        <ul className="mt-6 space-y-4 motion-safe:animate-fade-in">
          {reviews.length === 0 ? (
            <li className="text-sm text-muted-foreground">No reviews yet.</li>
          ) : (
            reviews.map((r) => (
              <li key={r.id} className="rounded-lg border p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-medium">{r.customerName}</span>
                  <span className="text-sm text-amber-600">{r.rating} / 5</span>
                </div>
                {r.title ? <p className="mt-2 font-medium">{r.title}</p> : null}
                {r.body ? <p className="mt-1 text-sm text-muted-foreground">{r.body}</p> : null}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
