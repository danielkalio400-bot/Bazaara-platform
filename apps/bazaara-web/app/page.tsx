import type { CSSProperties } from 'react';

type LiveApp = { name: string; port: number; group: SpectrumKey; href: string };
type SpectrumKey = 'internet' | 'communication' | 'productivity' | 'storage' | 'intelligence' | 'collaboration' | 'infrastructure';

const spectrum: { key: SpectrumKey; label: string; color: string; purpose: string }[] = [
  { key: 'internet', label: 'Internet', color: '#00B7C7', purpose: 'Search and discovery' },
  { key: 'communication', label: 'Communication', color: '#6D5EF7', purpose: 'People and conversations' },
  { key: 'productivity', label: 'Productivity', color: '#15B86A', purpose: 'Create and organize' },
  { key: 'storage', label: 'Storage & Security', color: '#2E6BFF', purpose: 'Files, privacy and trust' },
  { key: 'intelligence', label: 'Creative & Intelligence', color: '#FF6B00', purpose: 'AI and creative work' },
  { key: 'collaboration', label: 'Collaboration', color: '#A855F7', purpose: 'Teams and workflows' },
  { key: 'infrastructure', label: 'Platform & Infrastructure', color: '#F2B72B', purpose: 'Build and operate' },
];

const e3Live: LiveApp[] = [
  { name: 'Search', port: 3020, group: 'internet', href: 'http://localhost:3020' },
  { name: 'Workspace', port: 3021, group: 'collaboration', href: 'http://localhost:3021' },
  { name: 'Box', port: 3022, group: 'storage', href: 'http://localhost:3022' },
  { name: 'Docs', port: 3023, group: 'productivity', href: 'http://localhost:3023' },
  { name: 'Sheets', port: 3024, group: 'productivity', href: 'http://localhost:3024' },
  { name: 'Slides', port: 3025, group: 'productivity', href: 'http://localhost:3025' },
  { name: 'Forms', port: 3026, group: 'productivity', href: 'http://localhost:3026' },
  { name: 'Notes', port: 3027, group: 'productivity', href: 'http://localhost:3027' },
  { name: 'Calendar', port: 3028, group: 'communication', href: 'http://localhost:3028' },
  { name: 'Contacts', port: 3029, group: 'communication', href: 'http://localhost:3029' },
  { name: 'Photos', port: 3030, group: 'storage', href: 'http://localhost:3030' },
  { name: 'Vault', port: 3031, group: 'storage', href: 'http://localhost:3031' },
  { name: 'Spaces', port: 3032, group: 'collaboration', href: 'http://localhost:3032' },
  { name: 'Boards', port: 3033, group: 'collaboration', href: 'http://localhost:3033' },
  { name: 'Projects', port: 3034, group: 'collaboration', href: 'http://localhost:3034' },
  { name: 'Flow', port: 3035, group: 'collaboration', href: 'http://localhost:3035' },
];

const ecosystemOne = ['Shopping', 'Food', 'Grocery', 'Drive', 'Logistics', 'Wallet', 'Business', 'Pharmacy', 'Bazasport'];
const ecosystemTwo = ['BChat', 'ZimZam', 'BTune', 'Bicord', 'BazCut', 'BSend', 'Ɓiflix'];
const ecosystemThree = ['Search', 'Workspace', 'Box', 'Docs', 'Sheets', 'Slides', 'Forms', 'Notes', 'Calendar', 'Contacts', 'Photos', 'Vault', 'Spaces', 'Boards', 'Projects', 'Flow'];

function Mark() {
  return <span className="bazaara-mark" aria-hidden="true"><i/><i/><i/></span>;
}

function ProductPills({ names }: { names: string[] }) {
  return <div className="product-pills">{names.map(name => <span key={name}>{name}</span>)}</div>;
}

export default function Home() {
  return <main className="platform-shell">
    <header className="platform-header">
      <a className="platform-brand" href="/" aria-label="BAZAARA platform home">
        <Mark/>
        <span className="brand-copy"><strong>BAZAARA</strong><small>ONE PLATFORM</small></span>
      </a>
      <nav className="header-actions" aria-label="Platform shortcuts">
        <a className="quiet-link" href="http://localhost:3021">Workspace</a>
        <a className="bazid-button" href="http://localhost:3004/bazid/sign-in">BazID</a>
      </nav>
    </header>

    <section className="hero">
      <div className="hero-copy">
        <span className="hero-kicker">BAZAARA SPECTRUM · 2026</span>
        <h1>One platform.<br/><em>A spectrum of possibilities.</em></h1>
        <p>BAZAARA uses color as a navigation system, not decoration. Deep navy anchors the brand; seven purpose-led spectrum tones make every product family instantly recognizable across mobile, web and desktop.</p>
        <div className="hero-actions"><a className="primary-action" href="http://localhost:3021">Open Workspace <span>↗</span></a><a className="secondary-action" href="#spectrum">Explore the system</a></div>
      </div>
      <div className="spectrum-orbit" aria-label="BAZAARA Spectrum brand system">
        <div className="orbit-core"><Mark/><strong>BAZAARA</strong><span>ONE PLATFORM</span></div>
        {spectrum.map((item, index) => <span key={item.key} className={`orbit-dot dot-${index}`} style={{'--dot': item.color} as CSSProperties} title={item.label}/>) }
        <div className="orbit-ring ring-one"/><div className="orbit-ring ring-two"/>
      </div>
    </section>

    <section className="platform-metrics" aria-label="Platform status">
      <div><strong>03</strong><span>Connected ecosystems</span></div>
      <div><strong>16</strong><span>Ecosystem 3 local apps</span></div>
      <div><strong>01</strong><span>Shared BazID identity</span></div>
      <div><strong>∞</strong><span>Room to grow</span></div>
    </section>

    <section className="spectrum-section" id="spectrum">
      <div className="section-heading"><div><span className="section-kicker">THE BAZAARA SPECTRUM</span><h2>Color with a job to do.</h2><p>Each family owns a distinct hue while keeping the same typography, spacing, geometry and deep-navy platform DNA.</p></div><span className="system-badge">7 PURPOSE TONES</span></div>
      <div className="spectrum-grid">{spectrum.map(item => <article className={`spectrum-card tone-${item.key}`} key={item.key}><span className="spectrum-swatch" style={{background:item.color}}/><div><strong>{item.label}</strong><p>{item.purpose}</p></div><span className="hex">{item.color}</span></article>)}</div>
    </section>

    <section className="ecosystems-section">
      <div className="section-heading"><div><span className="section-kicker">THREE ECOSYSTEMS</span><h2>Different jobs. One visual language.</h2><p>Every ecosystem keeps its own energy while sharing the same BAZAARA identity, account system and platform foundation.</p></div></div>
      <div className="ecosystem-grid">
        <article className="ecosystem-card eco-one"><div className="eco-top"><span>01</span><b>LOCAL PLATFORM</b></div><h3>Commerce & Everyday Life</h3><p>Marketplace, mobility, payments, logistics, health and daily services.</p><ProductPills names={ecosystemOne}/></article>
        <article className="ecosystem-card eco-two"><div className="eco-top"><span>02</span><b>ACTIVE BUILD</b></div><h3>Social, Media & Communication</h3><p>Conversation, communities, short media, music, creation and transfer.</p><ProductPills names={ecosystemTwo}/></article>
        <article className="ecosystem-card eco-three"><div className="eco-top"><span>03</span><b>ALPHA · 16 LOCAL APPS</b></div><h3>Intelligence, Productivity & Infrastructure</h3><p>Search, productivity, storage, collaboration and the foundation for Bazaara intelligence.</p><ProductPills names={ecosystemThree}/><a className="eco-link" href="http://localhost:3021">Launch Workspace ↗</a></article>
      </div>
    </section>

    <section className="live-section">
      <div className="section-heading"><div><span className="section-kicker">ECOSYSTEM 3 · LOCAL DEVELOPMENT</span><h2>Your current build, in color.</h2><p>These links point to local development services. “Running locally” is not the same as production readiness.</p></div><span className="live-count"><i/>16 WEB APPS</span></div>
      <div className="live-grid">{e3Live.map(app => <a className={`live-card tone-${app.group}`} href={app.href} key={app.name}><span className="live-icon">{app.name.slice(0,1)}</span><div><strong>{app.name}</strong><small>localhost:{app.port}</small></div><span className="arrow">↗</span></a>)}</div>
    </section>

    <section className="foundation-section">
      <div><span className="section-kicker light">CONNECTED BY THE BAZAARA PLATFORM</span><h2>One identity. One foundation.</h2><p>BazID, platform APIs, shared security and common design tokens connect the experience without forcing every product to look identical.</p></div>
      <div className="foundation-pills"><span>One Account · BazID</span><span>Unified Platform</span><span>Smart Automation</span><span>Secure Infrastructure</span></div>
    </section>

    <footer className="platform-footer"><div><Mark/><strong>BAZAARA</strong></div><span>One platform · three ecosystems · one spectrum</span><span>Platform home · localhost:3005</span></footer>
  </main>;
}
