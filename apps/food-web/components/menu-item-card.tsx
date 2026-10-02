"use client";

import { useMemo, useState } from "react";
import type { FoodMenuItemContract } from "@bazaara/contracts";
import { foodApi, money, type FoodCartResponse } from "../lib/food-api";
import { FoodFavoriteButton } from "./food-favorite-button";

export function MenuItemCard({ item, restaurantSlug }: { item: FoodMenuItemContract; restaurantSlug: string }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selected, setSelected] = useState<Record<string, string[]>>({});
  const [instructions, setInstructions] = useState("");
  const selectedOptions = useMemo(() => item.modifierGroups.flatMap((group) => selected[group.id] ?? []), [item.modifierGroups, selected]);
  const addOnMinor = useMemo(() => item.modifierGroups.flatMap((group) => group.options).filter((option) => selectedOptions.includes(option.id)).reduce((sum, option) => sum + option.priceDeltaMinor, 0), [item.modifierGroups, selectedOptions]);

  function toggle(groupId: string, optionId: string, maxSelect: number) {
    setSelected((current) => {
      const values = current[groupId] ?? [];
      if (values.includes(optionId)) return { ...current, [groupId]: values.filter((value) => value !== optionId) };
      if (maxSelect === 1) return { ...current, [groupId]: [optionId] };
      if (values.length >= maxSelect) return current;
      return { ...current, [groupId]: [...values, optionId] };
    });
  }

  async function add() {
    setBusy(true); setError("");
    try {
      await foodApi.post<FoodCartResponse>(`/v1/food/restaurants/${encodeURIComponent(restaurantSlug)}/cart/items`, {
        menuItemId: item.id,
        quantity,
        optionIds: selectedOptions,
        specialInstructions: instructions || undefined,
      });
      setOpen(false); setQuantity(1); setSelected({}); setInstructions("");
      window.dispatchEvent(new CustomEvent("bazaara:food-cart-updated", { detail: { restaurantSlug } }));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add this item");
    } finally { setBusy(false); }
  }

  return (
    <>
      <article className={`menu-item-card ${!item.available ? "is-unavailable" : ""}`}>
        <div className="menu-item-copy">
          <h3>{item.name}</h3>
          <p>{item.description}</p>
          {item.dietaryTags.length ? <div className="food-tags">{item.dietaryTags.map((tag) => <span key={tag}>{tag}</span>)}</div> : null}
          <div className="menu-price-row"><strong>{money(item.priceMinor, item.currency)}</strong><FoodFavoriteButton kind="item" id={item.id} compact /></div>
        </div>
        <div className="menu-item-media">
          {item.imageUrl ? <img src={item.imageUrl} alt="" /> : <div className="menu-item-placeholder" />}
          <button type="button" onClick={() => setOpen(true)} disabled={!item.available}>{item.available ? "+" : "Sold out"}</button>
        </div>
      </article>

      {open ? (
        <div className="food-modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setOpen(false); }}>
          <section className="food-modal" role="dialog" aria-modal="true" aria-label={`Customize ${item.name}`}>
            <button className="food-modal-close" type="button" onClick={() => setOpen(false)} aria-label="Close">×</button>
            {item.imageUrl ? <img className="food-modal-hero" src={item.imageUrl} alt="" /> : null}
            <div className="food-modal-content">
              <h2>{item.name}</h2><p>{item.description}</p><strong>{money(item.priceMinor, item.currency)}</strong>
              {item.modifierGroups.map((group) => (
                <fieldset key={group.id} className="modifier-group">
                  <legend>{group.name}<small>{group.required ? `Required · choose ${group.minSelect || 1}${group.maxSelect > 1 ? `–${group.maxSelect}` : ""}` : `Optional · up to ${group.maxSelect}`}</small></legend>
                  {group.options.map((option) => {
                    const checked = (selected[group.id] ?? []).includes(option.id);
                    return <label key={option.id} className="modifier-option"><input type={group.maxSelect === 1 ? "radio" : "checkbox"} name={group.id} checked={checked} onChange={() => toggle(group.id, option.id, group.maxSelect)} /><span>{option.name}</span><em>{option.priceDeltaMinor ? `+${money(option.priceDeltaMinor)}` : "Included"}</em></label>;
                  })}
                </fieldset>
              ))}
              <label className="food-note-label">Special instructions<textarea value={instructions} onChange={(event) => setInstructions(event.target.value)} maxLength={300} placeholder="Allergies, preparation notes…" /></label>
              {error ? <p className="food-error" role="alert">{error}</p> : null}
              <div className="food-modal-footer">
                <div className="food-qty"><button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))}>−</button><span>{quantity}</span><button type="button" onClick={() => setQuantity((value) => Math.min(25, value + 1))}>+</button></div>
                <button className="food-primary" type="button" onClick={add} disabled={busy}>{busy ? "Adding…" : `Add · ${money((item.priceMinor + addOnMinor) * quantity, item.currency)}`}</button>
              </div>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
