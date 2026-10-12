import Link from 'next/link';
import './foundation.css';

export const metadata = {
  title: 'Bazaara UI Foundation | Workspace',
  description: 'Preview 16 Bazaara interfaces without altering connected applications.',
  robots: { index: false, follow: false },
};

const modules = [
  ['Search', 'search', 'Web discovery', 'http://localhost:3020'],
  ['Maps / BMap', 'maps', 'Places and directions', 'http://localhost:3038'],
  ['Places', 'places', 'Saved-place discovery', 'http://localhost:3038'],
  ['News', 'news', 'Coverage and topics', 'http://localhost:3040'],
  ['Translate', 'translate', 'Language tools', 'http://localhost:3039'],
  ['Lens / BazLens', 'lens', 'Image preview and camera', 'http://localhost:3041'],
  ['Drive / Local files', 'drive', 'File preview; not ride-hailing Drive', 'http://localhost:3022'],
  ['Flights', 'flights', 'Flight planning', ''],
  ['Hotels', 'hotels', 'Accommodation planning', ''],
  ['Booking', 'booking', 'Reservation notes only', ''],
  ['Travel', 'travel', 'Itinerary notes', ''],
  ['Transit', 'transit', 'Transport planning', ''],
  ['Weather', 'weather', 'Saved cities and forecast handoff', ''],
  ['Browser', 'browser', 'Local tab and bookmark preview', ''],
  ['Voice', 'voice', 'Browser speech recognition', ''],
  ['Auto', 'auto', 'Parked dashboard concept', ''],
] as const;

export default function Foundation() {
  return <main className="ui26-shell">
    <nav className="ui26-nav" aria-label="Breadcrumb"><Link href="/">Workspace</Link><span aria-hidden="true">/</span><strong>UI Foundation</strong></nav>
    <header className="ui26-hero"><div className="ui26-kicker">BAZAARA · ECOSYSTEM UI · 2026</div><h1>One visual foundation.<br/><em>16 connected concepts.</em></h1><p>The uploaded HTML and CSS interface kit is available here as an isolated, responsive preview. Open a preview to explore local interactions, or follow an existing application link to use its separate service.</p><div className="ui26-actions"><a href="/bazaara-ui/index.html">Open the full preview ↗</a><Link href="/">Back to Workspace</Link></div></header>
    <section className="ui26-note" aria-label="Preview limitations"><strong>Preview, not production:</strong> This foundation has no cloud authentication, verified bookings, live maps, AI search, weather feed, payments, or ride-hailing functions. Browser-local data stays on this device; do not enter confidential information.</section>
    <section className="ui26-section"><div className="ui26-sectionhead"><h2>Explore each interface</h2><p>Existing Bazaara services are preserved.</p></div><div className="ui26-grid">{modules.map(([title,id,description,live],i)=><article className="ui26-card" key={id}><span className={`ui26-icon ui26-color-${i%7}`} aria-hidden="true">{title.charAt(0)}</span><h3>{title}</h3><p>{description}</p><div className="ui26-card-actions"><a href={`/bazaara-ui/${id}.html`}>UI preview ↗</a>{live&&<a href={live} className="ui26-live">Local app ↗</a>}</div></article>)}</div></section>
    <footer className="ui26-foot">BAZAARA Workspace · UI foundation preview · 2026</footer>
  </main>;
}
