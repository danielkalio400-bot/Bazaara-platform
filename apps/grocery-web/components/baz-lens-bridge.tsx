"use client";

import { useRef, useState } from "react";

const selectors = [
  "[data-baz-lens-trigger]",
  '[aria-label*="Baz Lens" i]',
  '[aria-label*="visual" i]',
  '[aria-label*="camera" i]',
  'button[title*="lens" i]',
];

export function BazLensBridge() {
  const frame = useRef<HTMLIFrameElement>(null);
  const [message, setMessage] = useState("Opening Baz Lens…");

  function activate() {
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    for (const selector of selectors) {
      const target = doc.querySelector<HTMLElement>(selector);
      if (target) {
        target.click();
        setMessage("");
        return;
      }
    }
    setMessage("Baz Lens is available from the camera icon in the Grocery search bar.");
  }

  return <main style={{ minHeight: "100vh", background: "#0F172A", color: "#F8FAFC" }}>
    {message ? <div style={{ position: "fixed", zIndex: 2, left: "50%", top: 16, transform: "translateX(-50%)", padding: "10px 14px", borderRadius: 999, background: "#182234", border: "1px solid rgba(203,213,225,.2)", font: "700 13px Inter,system-ui" }}>{message}</div> : null}
    <iframe ref={frame} title="Grocery Baz Lens" src="/" onLoad={() => window.setTimeout(activate, 500)} style={{ width: "100%", height: "100vh", border: 0, display: "block", background: "#0F172A" }} allow="camera; microphone" />
  </main>;
}
