"use client";

import { useState } from "react";
import { ApiError } from "@bazaara/api-client";
import { buildBazIdSignInUrl } from "@bazaara/bazid-client";
import { BAZID_BASE, foodApi } from "../lib/food-api";

export function FoodFavoriteButton({ kind, id, initialSaved = false, compact = false }: { kind: "restaurant" | "item"; id: string; initialSaved?: boolean; compact?: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function toggle() {
    if (busy) return;
    setBusy(true); setError("");
    const next = !saved;
    try {
      const path = kind === "restaurant" ? `/v1/food/restaurants/${encodeURIComponent(id)}/favorite` : `/v1/food/menu-items/${encodeURIComponent(id)}/favorite`;
      await foodApi.request(path, { method: "PUT", body: { saved: next } });
      setSaved(next);
    } catch (cause) {
      if (cause instanceof ApiError && cause.status === 401) {
        window.location.href = buildBazIdSignInUrl({ bazIdBaseUrl: BAZID_BASE, returnTo: window.location.href });
        return;
      }
      setError(cause instanceof Error ? cause.message : "Could not update favourites");
    } finally { setBusy(false); }
  }

  return <span className={compact ? "food-favourite-wrap compact" : "food-favourite-wrap"}>
    <button type="button" className={saved ? "food-favourite saved" : "food-favourite"} onClick={() => void toggle()} disabled={busy} aria-pressed={saved} aria-label={saved ? "Remove from favourites" : "Save to favourites"}>{saved ? "♥" : "♡"}{compact ? null : <span>{saved ? "Saved" : "Save"}</span>}</button>
    {error ? <small role="alert" className="food-inline-error">{error}</small> : null}
  </span>;
}
