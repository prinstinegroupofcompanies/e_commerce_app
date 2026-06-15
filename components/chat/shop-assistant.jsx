"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { MessageCircle, X, Send, Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChatMessageBody } from "@/components/chat/chat-message-body";
import { getVisitorKey, trackInteraction } from "@/lib/analytics/track-client";
import { useVisitorKey } from "@/hooks/use-visitor-key";
import { SITE_NAME } from "@/lib/brand";
import { cn } from "@/lib/utils";

const SESSION_KEY = "shoplib_chat_session";

/**
 * @typedef {{ role: "user" | "assistant"; content: string }} ChatMsg
 * @typedef {{ id: string; name: string; slug: string; price: number; thumbnail?: string | null }} RecProduct
 */

export function ShopAssistant() {
  const visitorKey = useVisitorKey();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState(/** @type {ChatMsg[]} */ ([]));
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionId, setSessionId] = useState(/** @type {string | null} */ (null));
  const [recommendations, setRecommendations] = useState(/** @type {RecProduct[]} */ ([]));
  const [welcomeLoaded, setWelcomeLoaded] = useState(false);
  const listRef = useRef(/** @type {HTMLDivElement | null} */ (null));

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = sessionStorage.getItem(SESSION_KEY);
    if (saved) setSessionId(saved);
  }, []);

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    });
  }, []);

  const loadWelcome = useCallback(async () => {
    const vk = visitorKey || getVisitorKey();
    if (!vk || welcomeLoaded) return;
    try {
      const res = await fetch("/api/chat/welcome", {
        headers: { "X-Visitor-Key": vk },
        credentials: "same-origin",
      });
      const json = await res.json();
      if (json.success) {
        setMessages([{ role: "assistant", content: json.data.greeting }]);
        if (json.data.recommendations?.length) {
          setRecommendations(json.data.recommendations);
        }
        setWelcomeLoaded(true);
      }
    } catch {
      setMessages([
        {
          role: "assistant",
          content: `Hi! I'm your ${SITE_NAME} shopping assistant. I can help track orders, recommend products, and guide you around the store.`,
        },
      ]);
      setWelcomeLoaded(true);
    }
  }, [visitorKey, welcomeLoaded]);

  useEffect(() => {
    if (open && !welcomeLoaded) loadWelcome();
  }, [open, welcomeLoaded, loadWelcome]);

  useEffect(() => {
    if (open) scrollToBottom();
  }, [messages, open, scrollToBottom]);

  async function sendMessage(text) {
    const trimmed = text.trim();
    if (!trimmed || loading) return;
    const vk = visitorKey || getVisitorKey();
    if (!vk) return;

    setMessages((m) => [...m, { role: "user", content: trimmed }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Visitor-Key": vk,
        },
        credentials: "same-origin",
        body: JSON.stringify({
          message: trimmed,
          sessionId: sessionId || undefined,
          visitorKey: vk,
        }),
      });
      const json = await res.json();
      if (!json.success) {
        setMessages((m) => [
          ...m,
          { role: "assistant", content: json.error || "Something went wrong. Please try again." },
        ]);
        return;
      }
      if (json.data.sessionId) {
        setSessionId(json.data.sessionId);
        sessionStorage.setItem(SESSION_KEY, json.data.sessionId);
      }
      setMessages((m) => [...m, { role: "assistant", content: json.data.content }]);
      if (json.data.recommendations?.length) {
        setRecommendations(json.data.recommendations);
      }
    } catch {
      setMessages((m) => [
        ...m,
        { role: "assistant", content: "I couldn't reach the server. Check your connection and try again." },
      ]);
    } finally {
      setLoading(false);
    }
  }

  const quickPrompts = [
    "Recommend products for me",
    "How do I track my order?",
    "How does checkout work?",
    "Show popular products",
  ];

  return (
    <>
      <button
        type="button"
        onClick={() => {
          setOpen(true);
          trackInteraction({ eventType: "chat_open", path: typeof window !== "undefined" ? window.location.pathname : "/" });
        }}
        className={cn(
          "fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition duration-300",
          "bg-primary text-primary-foreground hover:scale-105 hover:shadow-xl",
          open && "scale-0 opacity-0 pointer-events-none"
        )}
        aria-label="Open shop assistant"
      >
        <MessageCircle className="h-6 w-6" />
      </button>

      <div
        className={cn(
          "fixed bottom-6 right-6 z-50 flex w-[min(100vw-1.5rem,24rem)] flex-col overflow-hidden rounded-2xl border border-border/80 bg-card shadow-2xl ring-1 ring-black/5 transition duration-300 sm:w-96",
          open ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-4 opacity-0"
        )}
        role="dialog"
        aria-label="Shop assistant chat"
      >
        <header className="flex items-center justify-between gap-2 border-b bg-gradient-to-r from-primary to-primary/90 px-4 py-3 text-primary-foreground">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <div>
              <p className="text-sm font-semibold">{SITE_NAME} Assistant</p>
              <p className="text-xs text-primary-foreground/80">Orders · picks · app guide</p>
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-primary-foreground hover:bg-white/15"
            onClick={() => setOpen(false)}
            aria-label="Close chat"
          >
            <X className="h-4 w-4" />
          </Button>
        </header>

        <div ref={listRef} className="flex max-h-[min(50vh,22rem)] flex-1 flex-col gap-3 overflow-y-auto p-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={cn(
                "max-w-[92%] rounded-2xl px-3 py-2",
                msg.role === "user"
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "mr-auto bg-muted text-foreground"
              )}
            >
              {msg.role === "user" ? (
                <p className="text-sm">{msg.content}</p>
              ) : (
                <ChatMessageBody text={msg.content} />
              )}
            </div>
          ))}
          {loading && (
            <div className="mr-auto flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span className="text-xs">Thinking…</span>
            </div>
          )}
        </div>

        {recommendations.length > 0 && (
          <div className="border-t bg-muted/30 px-3 py-2">
            <p className="mb-2 text-xs font-medium text-muted-foreground">Picked for you</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {recommendations.slice(0, 4).map((p) => (
                <Link
                  key={p.id}
                  href={`/products/${p.slug}`}
                  className="flex w-28 shrink-0 flex-col overflow-hidden rounded-lg border bg-card text-xs shadow-sm transition hover:border-primary/40"
                  onClick={() => setOpen(false)}
                >
                  <div className="relative aspect-square bg-muted">
                    <Image
                      src={p.thumbnail || "/placeholder-product.svg"}
                      alt={p.name}
                      fill
                      className="object-cover"
                      sizes="112px"
                    />
                  </div>
                  <span className="line-clamp-2 px-2 py-1 font-medium">{p.name}</span>
                  <span className="px-2 pb-2 text-primary">${p.price.toFixed(2)}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {!messages.some((m) => m.role === "user") && (
          <div className="flex flex-wrap gap-1.5 border-t px-3 py-2">
            {quickPrompts.map((q) => (
              <button
                key={q}
                type="button"
                className="rounded-full border border-primary/20 bg-background px-2.5 py-1 text-xs text-foreground transition hover:bg-primary/5"
                onClick={() => sendMessage(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        <form
          className="flex gap-2 border-t p-3"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage(input);
          }}
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about orders, products, help…"
            className="h-10 flex-1 text-sm"
            disabled={loading}
            maxLength={2000}
          />
          <Button type="submit" size="icon" disabled={loading || !input.trim()} aria-label="Send">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </>
  );
}
