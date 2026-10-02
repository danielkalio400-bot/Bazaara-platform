"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { BusinessHeaderStandalone } from "../../components/BusinessHeaderStandalone";
import { businessRequest, useBusinessOrganizations } from "../../lib/business";

type Restaurant = { id: string; organizationId: string; name: string; slug?: string };
type RestaurantContact = {
  id: string; restaurantId: string; name: string; role: string; phone: string | null; whatsappPhone: string | null; email: string | null;
  preferredChannel: string; isPrimary: boolean; isEmergency: boolean; active: boolean; createdAt: string; updatedAt: string;
};
type ContactPayload = { name: string; role: string; phone: string | null; whatsappPhone: string | null; email: string | null; preferredChannel: string; isPrimary: boolean; isEmergency: boolean; active: boolean };
type ContactResult = { contact: RestaurantContact; actionState: "COMPLETED" | "ALREADY_DONE" };
type ContactList = { restaurant: { id: string; name: string; slug: string; organizationId: string; organizationContact: { phone: string | null; email: string | null } }; contacts: RestaurantContact[] };

const blank = { name: "", role: "BRANCH_MANAGER", phone: "", whatsappPhone: "", email: "", preferredChannel: "PHONE", isPrimary: false, isEmergency: false };

export default function RestaurantContactsPage() {
  const business = useBusinessOrganizations();
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [restaurantId, setRestaurantId] = useState("");
  const [data, setData] = useState<ContactList | null>(null);
  const [form, setForm] = useState(blank);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const loadRestaurants = useCallback(async () => {
    if (!business.organizationId) return;
    try {
      const result = await businessRequest<{ restaurants: Restaurant[] }>("/v1/business/food/restaurants");
      const scoped = result.restaurants.filter((item) => item.organizationId === business.organizationId);
      setRestaurants(scoped);
      setRestaurantId((current) => current && scoped.some((item) => item.id === current) ? current : scoped[0]?.id ?? "");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load restaurants"); }
  }, [business.organizationId]);

  const loadContacts = useCallback(async () => {
    if (!business.organizationId || !restaurantId) { setData(null); return; }
    try {
      const result = await businessRequest<ContactList>(`/v1/business/organizations/${business.organizationId}/food/restaurants/${restaurantId}/contacts`);
      setData(result); setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load restaurant contacts"); }
  }, [business.organizationId, restaurantId]);

  useEffect(() => { void loadRestaurants(); }, [loadRestaurants]);
  useEffect(() => { void loadContacts(); }, [loadContacts]);

  const activeContacts = useMemo(() => data?.contacts.filter((item) => item.active) ?? [], [data]);

  async function create(event: FormEvent) {
    event.preventDefault();
    if (!business.organizationId || !restaurantId) return;
    setBusy("create"); setError("");
    try {
      const payload: ContactPayload = {
        name: form.name.trim(), role: form.role.trim(), phone: form.phone.trim() || null, whatsappPhone: form.whatsappPhone.trim() || null,
        email: form.email.trim() || null, preferredChannel: form.preferredChannel, isPrimary: form.isPrimary, isEmergency: form.isEmergency, active: true,
      };
      const result = await businessRequest<ContactResult>(`/v1/business/organizations/${business.organizationId}/food/restaurants/${restaurantId}/contacts`, "POST", payload);
      setNotice(result.actionState === "ALREADY_DONE" ? "That contact is already saved. Nothing was duplicated." : "Restaurant contact saved and is now available to Bazaara Support.");
      setForm(blank); await loadContacts();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save restaurant contact"); }
    finally { setBusy(""); }
  }

  async function patch(contact: RestaurantContact, input: Partial<ContactPayload>, action: string, alreadyDone: boolean) {
    if (!business.organizationId || alreadyDone) { if (alreadyDone) setNotice(`${action} is already applied.`); return; }
    setBusy(`${contact.id}:${action}`); setError("");
    try {
      const result = await businessRequest<ContactResult>(`/v1/business/organizations/${business.organizationId}/food/restaurants/${restaurantId}/contacts/${contact.id}`, "PATCH", input);
      setNotice(result.actionState === "ALREADY_DONE" ? `${action} was already applied on the server.` : `${action} completed.`);
      await loadContacts();
    } catch (cause) { setError(cause instanceof Error ? cause.message : `Could not ${action.toLowerCase()}`); }
    finally { setBusy(""); }
  }

  return (
    <div className="business-control-shell business-contact-center-v8">
      <BusinessHeaderStandalone active="food" />
      <main className="business-control-main">
        <section className="business-page-heading business-page-heading-v3 business-contact-hero">
          <div><span className="business-kicker">FOOD · RESTAURANT CONTACTS</span><h1>Keep support contacts current.</h1><p>Branch, owner, kitchen, finance and emergency contacts are shared securely with Operations when a Food support case needs direct restaurant contact.</p></div>
          <div className="business-page-heading-actions"><a className="business-secondary-button" href="/food">Back to Food</a><a className="business-primary-button" href="/support">Open support</a></div>
        </section>

        {error ? <div className="business-alert">{error}</div> : null}{notice ? <div className="business-notice">{notice}</div> : null}

        <section className="business-panel business-contact-selector"><div className="business-section-heading"><div><span className="business-kicker">RESTAURANT</span><h2>Contact directory</h2></div><span>{activeContacts.length} active contacts</span></div><select value={restaurantId} onChange={(e) => setRestaurantId(e.target.value)}>{restaurants.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select>{data?.restaurant.organizationContact.phone || data?.restaurant.organizationContact.email ? <p>Organization fallback: {data.restaurant.organizationContact.phone ?? "no phone"} · {data.restaurant.organizationContact.email ?? "no email"}</p> : <p>No organization fallback contact is configured. Add at least one restaurant contact below.</p>}</section>

        <div className="business-contact-layout">
          <section className="business-panel"><div className="business-section-heading"><div><span className="business-kicker">DIRECTORY</span><h2>Restaurant contacts</h2></div></div><div className="business-contact-list">{data?.contacts.map((contact) => <article key={contact.id} className={!contact.active ? "inactive" : ""}><header><div><strong>{contact.name}</strong><span>{contact.role.replaceAll("_", " ")}</span></div><div className="business-contact-badges">{contact.isPrimary ? <b>PRIMARY</b> : null}{contact.isEmergency ? <b>EMERGENCY</b> : null}{!contact.active ? <b>INACTIVE</b> : null}</div></header><dl><div><dt>Phone</dt><dd>{contact.phone ?? "—"}</dd></div><div><dt>WhatsApp</dt><dd>{contact.whatsappPhone ?? "—"}</dd></div><div><dt>Email</dt><dd>{contact.email ?? "—"}</dd></div><div><dt>Preferred</dt><dd>{contact.preferredChannel}</dd></div></dl><footer><button className={contact.isPrimary ? "smart-done" : ""} disabled={busy.startsWith(`${contact.id}:`) || contact.isPrimary} onClick={() => void patch(contact, { isPrimary: true }, "Primary contact", contact.isPrimary)}>{contact.isPrimary ? "✓ Primary" : "Make primary"}</button><button className={contact.isEmergency ? "smart-done" : ""} disabled={busy.startsWith(`${contact.id}:`) || contact.isEmergency} onClick={() => void patch(contact, { isEmergency: true }, "Emergency contact", contact.isEmergency)}>{contact.isEmergency ? "✓ Emergency" : "Mark emergency"}</button><button disabled={busy.startsWith(`${contact.id}:`)} onClick={() => void patch(contact, { active: !contact.active }, contact.active ? "Contact deactivation" : "Contact activation", false)}>{busy.startsWith(`${contact.id}:`) ? "Saving…" : contact.active ? "Deactivate" : "Activate"}</button></footer></article>)}{!data?.contacts.length ? <div className="business-empty">No restaurant contacts yet. Add the first operational contact.</div> : null}</div></section>

          <section className="business-panel"><div className="business-section-heading"><div><span className="business-kicker">ADD CONTACT</span><h2>New support contact</h2></div></div><form className="business-contact-form" onSubmit={create}><label>Name<input required minLength={2} value={form.name} onChange={(e) => setForm((current) => ({ ...current, name: e.target.value }))} placeholder="Branch manager name" /></label><label>Role<input required value={form.role} onChange={(e) => setForm((current) => ({ ...current, role: e.target.value }))} placeholder="BRANCH_MANAGER" /></label><label>Phone<input value={form.phone} onChange={(e) => setForm((current) => ({ ...current, phone: e.target.value }))} placeholder="+234..." /></label><label>WhatsApp<input value={form.whatsappPhone} onChange={(e) => setForm((current) => ({ ...current, whatsappPhone: e.target.value }))} placeholder="+234..." /></label><label>Email<input type="email" value={form.email} onChange={(e) => setForm((current) => ({ ...current, email: e.target.value }))} placeholder="manager@restaurant.com" /></label><label>Preferred channel<select value={form.preferredChannel} onChange={(e) => setForm((current) => ({ ...current, preferredChannel: e.target.value }))}><option>PHONE</option><option>WHATSAPP</option><option>SMS</option><option>EMAIL</option><option>IN_APP</option></select></label><label className="business-contact-check"><input type="checkbox" checked={form.isPrimary} onChange={(e) => setForm((current) => ({ ...current, isPrimary: e.target.checked }))} /> Primary contact</label><label className="business-contact-check"><input type="checkbox" checked={form.isEmergency} onChange={(e) => setForm((current) => ({ ...current, isEmergency: e.target.checked }))} /> Emergency contact</label><button className="business-primary-button" type="submit" disabled={busy === "create" || !restaurantId || !form.name.trim() || (!form.phone.trim() && !form.whatsappPhone.trim() && !form.email.trim())}>{busy === "create" ? "Saving…" : "Save contact"}</button></form></section>
        </div>
      </main>
    </div>
  );
}
