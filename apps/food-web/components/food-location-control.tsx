"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { BazaaraAddressContract } from "@bazaara/contracts";
import { foodApi } from "../lib/food-api";
import {
  readFoodDiscoveryLocation,
  saveFoodDiscoveryLocation,
  subscribeFoodDiscoveryLocation,
  type FoodDiscoveryLocation,
} from "./food-location";

function addressLabel(address: BazaaraAddressContract) {
  const detail = [address.street, address.city, address.region].filter(Boolean).join(", ");
  return {
    label: address.label?.trim() || address.city || "Saved address",
    detail,
  };
}

function locationFromAddress(address: BazaaraAddressContract): FoodDiscoveryLocation | null {
  if (address.latitude == null || address.longitude == null) return null;
  const label = addressLabel(address);
  return {
    latitude: address.latitude,
    longitude: address.longitude,
    label: label.label,
    detail: label.detail,
    source: "saved",
    updatedAt: new Date().toISOString(),
  };
}

export function FoodLocationControl() {
  const [location, setLocation] = useState<FoodDiscoveryLocation | null>(null);
  const [addresses, setAddresses] = useState<BazaaraAddressContract[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [addressBusy, setAddressBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const cached = readFoodDiscoveryLocation();
    setLocation(cached);
    const unsubscribe = subscribeFoodDiscoveryLocation(setLocation);

    void (async () => {
      try {
        setAddressBusy(true);
        const result = await foodApi.get<{ addresses: BazaaraAddressContract[] }>("/v1/addresses", { cache: "no-store" });
        setAddresses(result.addresses);
        if (!cached) {
          const saved = result.addresses.map(locationFromAddress).find(Boolean);
          if (saved) saveFoodDiscoveryLocation(saved);
        }
      } catch {
        setAddresses([]);
      } finally {
        setAddressBusy(false);
      }
    })();

    return unsubscribe;
  }, []);

  const shortDetail = useMemo(() => {
    if (!location?.detail) return "Choose where your order should arrive";
    return location.detail.length > 48 ? `${location.detail.slice(0, 45)}…` : location.detail;
  }, [location]);

  function useDeviceLocation() {
    setError("");
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setError("Location is unavailable in this browser.");
      return;
    }
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const next: FoodDiscoveryLocation = {
          latitude: Number(position.coords.latitude.toFixed(7)),
          longitude: Number(position.coords.longitude.toFixed(7)),
          label: "Current location",
          detail: `Live device pin · ~${Math.max(1, Math.round(position.coords.accuracy))} m accuracy`,
          source: "device",
          updatedAt: new Date().toISOString(),
        };
        saveFoodDiscoveryLocation(next);
        setLocation(next);
        setSheetOpen(false);
        setBusy(false);
      },
      (cause) => {
        setError(cause.code === 1 ? "Allow location to show restaurants that can deliver to you." : cause.message || "Could not get your location.");
        setBusy(false);
      },
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 12_000 },
    );
  }

  function chooseAddress(address: BazaaraAddressContract) {
    const next = locationFromAddress(address);
    if (!next) {
      setError("This saved address needs a map pin before it can drive nearby discovery.");
      return;
    }
    saveFoodDiscoveryLocation(next);
    setLocation(next);
    setError("");
    setSheetOpen(false);
  }

  return (
    <div className="food-location-control">
      <button type="button" className="food-location-chip food-location-chip-v6" onClick={() => setSheetOpen(true)} title={location?.detail || undefined}>
        <span className="food-location-pin" aria-hidden="true">⌖</span>
        <span className="food-location-copy">
          <small>DELIVER TO</small>
          <b>{location?.label || "Set delivery location"}</b>
          <em>{shortDetail}</em>
        </span>
        <span aria-hidden="true" className="food-location-chevron">⌄</span>
      </button>

      {sheetOpen ? <div className="food-location-overlay" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setSheetOpen(false); }}>
        <section className="food-location-sheet" role="dialog" aria-modal="true" aria-label="Choose delivery location">
          <div className="food-location-map-preview">
            <div className="food-location-map-grid" aria-hidden="true" />
            <div className="food-location-map-pin" aria-hidden="true">⌖</div>
            <div className="food-location-map-label">{location?.label || "Your next delivery point"}</div>
            <div className="food-map-watermark"><b>BAZAARA</b><span>MAPS · PREVIEW</span></div>
            <button type="button" className="food-location-close" onClick={() => setSheetOpen(false)} aria-label="Close">×</button>
          </div>

          <div className="food-location-sheet-body">
            <div className="food-location-sheet-head">
              <span>SMART DELIVERY AREA</span>
              <h2>Where should we deliver?</h2>
              <p>Your selected pin controls restaurant availability, distance and delivery context.</p>
            </div>

            <button type="button" className="food-location-current" disabled={busy} onClick={useDeviceLocation}>
              <i aria-hidden="true">↗</i>
              <span><b>{busy ? "Finding your location…" : "Use current location"}</b><small>Recommended · high-accuracy device pin</small></span>
              <strong>Use</strong>
            </button>

            <div className="food-location-saved">
              <div className="food-location-saved-head"><b>Saved places</b><small>{addressBusy ? "Loading…" : `${addresses.length} saved`}</small></div>
              {addresses.length ? addresses.map((address) => {
                const label = addressLabel(address);
                const usable = address.latitude != null && address.longitude != null;
                return <button type="button" key={address.id} className={`food-location-saved-row ${location?.source === "saved" && location.label === label.label ? "active" : ""}`} onClick={() => chooseAddress(address)}>
                  <i aria-hidden="true">{address.label?.toLowerCase().includes("home") ? "⌂" : "◇"}</i>
                  <span><b>{label.label}</b><small>{label.detail || "Saved Bazaara address"}</small></span>
                  <em>{usable ? "›" : "Add pin"}</em>
                </button>;
              }) : <div className="food-location-empty">No pinned saved address yet. Use your current location now; you can save a full address at checkout.</div>}
            </div>

            {error ? <p className="food-location-sheet-error" role="status">{error}</p> : null}
            <div className="food-location-sheet-actions"><button type="button" className="food-location-add" onClick={useDeviceLocation}>＋ Add a new delivery point</button><Link className="food-location-full-map" href="/location" onClick={()=>setSheetOpen(false)}>Open full Bazaara map →</Link></div>
          </div>
        </section>
      </div> : null}
    </div>
  );
}
