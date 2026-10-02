'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react';
import {
  attachmentStore,
  exportEML,
  freshMail,
  mailBackup,
  mailMatches,
  parseEML,
  removeAttachment,
  restoreMailBackup,
  validMail,
  type Mail,
  type MailAttachment,
} from '../../../packages/flagship-ui/src/mail-engine';
import {
  download,
  errorText,
  now,
  useCollection,
} from '../../../packages/flagship-ui/src/core';

type Section = 'Inbox' | 'Starred' | 'Snoozed' | 'Important' | 'Purchases' | 'Sent' | 'Scheduled' | 'Outbox' | 'Drafts' | 'Archive' | 'Reminders' | 'All mail' | 'Spam' | 'Trash';
type QuickFilter = 'all' | 'unread' | 'starred' | 'attachments' | 'today';
type SortMode = 'newest' | 'oldest' | 'focus';
type Density = 'comfortable' | 'compact';
type IconName =
  | 'menu' | 'search' | 'compose' | 'inbox' | 'star' | 'draft' | 'archive' | 'clock'
  | 'mail' | 'trash' | 'chevron' | 'paperclip' | 'more' | 'apps' | 'settings'
  | 'close' | 'back' | 'reply' | 'forward' | 'label' | 'read' | 'unread'
  | 'calendar' | 'contacts' | 'video' | 'spark' | 'download' | 'upload' | 'check'
  | 'filter' | 'sort' | 'shield' | 'expand' | 'send' | 'plus';

const SECTIONS: { id: Section; icon: IconName; hint?: string }[] = [
  { id: 'Inbox', icon: 'inbox' },
  { id: 'Starred', icon: 'star' },
  { id: 'Snoozed', icon: 'clock' },
  { id: 'Important', icon: 'label' },
  { id: 'Purchases', icon: 'archive' },
  { id: 'Sent', icon: 'send' },
  { id: 'Scheduled', icon: 'clock' },
  { id: 'Outbox', icon: 'mail' },
  { id: 'Drafts', icon: 'draft' },
  { id: 'Archive', icon: 'archive' },
  { id: 'Reminders', icon: 'clock' },
  { id: 'All mail', icon: 'mail' },
  { id: 'Spam', icon: 'shield' },
  { id: 'Trash', icon: 'trash' },
];

const QUICK_FILTERS: { id: QuickFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'starred', label: 'Starred' },
  { id: 'attachments', label: 'Attachments' },
  { id: 'today', label: 'Today' },
];

function Icon({ name, size = 20 }: { name: IconName; size?: number }) {
  const paths: Record<IconName, ReactNode> = {
    menu: <path d="M4 7h16M4 12h16M4 17h16" />,
    search: <><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></>,
    compose: <><path d="M4 20h4l11-11-4-4L4 16z" /><path d="m13.5 6.5 4 4M12 4H5a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2h13a2 2 0 0 0 2-2v-7" /></>,
    inbox: <><path d="M4 5h16l2 11H2z" /><path d="M2.5 16h5l2 3h5l2-3h5" /></>,
    star: <path d="m12 3 2.8 5.8 6.2.9-4.5 4.4 1.1 6.2-5.6-3-5.6 3 1.1-6.2L3 9.7l6.2-.9z" />,
    draft: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 13h7M9 17h5" /></>,
    archive: <><rect x="3" y="5" width="18" height="4" rx="1" /><path d="M5 9v11h14V9M9 13h6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.5 2" /></>,
    mail: <><rect x="3" y="5" width="18" height="14" rx="2" /><path d="m4 7 8 6 8-6" /></>,
    trash: <><path d="M4 7h16M9 7V4h6v3M6.5 7l1 14h9l1-14M10 11v6M14 11v6" /></>,
    chevron: <path d="m9 5 7 7-7 7" />,
    paperclip: <path d="M8.5 12.5 15 6a3.5 3.5 0 1 1 5 5l-8.5 8.5a5 5 0 0 1-7-7L13 4" />,
    more: <><circle cx="5" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" /><circle cx="19" cy="12" r="1" fill="currentColor" stroke="none" /></>,
    apps: <>{[4, 10, 16].flatMap(x => [4, 10, 16].map(y => <rect key={`${x}-${y}`} x={x} y={y} width="4" height="4" rx="1" fill="currentColor" stroke="none" />))}</>,
    settings: <><circle cx="12" cy="12" r="3.2" /><path d="m10 2-.6 2.1-2.1 1L5 4.6 3.6 7l1.6 1.5-.3 2.3L3 12l1.9 1.2.3 2.3L3.6 17 5 19.4l2.3-.5 2.1 1L10 22h4l.6-2.1 2.1-1 2.3.5 1.4-2.4-1.6-1.5.3-2.3L21 12l-1.9-1.2-.3-2.3L20.4 7 19 4.6l-2.3.5-2.1-1L14 2z" /></>,
    close: <path d="M5 5 19 19M19 5 5 19" />,
    back: <path d="m15 5-7 7 7 7" />,
    reply: <><path d="m10 8-5 4 5 4" /><path d="M6 12h7c4 0 6 2 6 6" /></>,
    forward: <><path d="m14 8 5 4-5 4" /><path d="M18 12h-7c-4 0-6 2-6 6" /></>,
    label: <><path d="M3 6v12h10l8-6-8-6z" /><circle cx="8" cy="12" r="1.2" /></>,
    read: <><path d="M3 6h18v12H3z" /><path d="m4 8 8 5 8-5" /></>,
    unread: <><path d="M3 7h18v11H3z" /><path d="M3 7l9 6 9-6" /><circle cx="19" cy="5" r="3" fill="currentColor" stroke="none" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M7 2v6M17 2v6M3 10h18" /></>,
    contacts: <><circle cx="9" cy="8" r="3.4" /><path d="M3 20c0-4 2-6 6-6s6 2 6 6M17 8h4M17 12h4M17 16h4" /></>,
    video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3z" /></>,
    spark: <><path d="m12 2 1.4 5.1L18 9l-4.6 1.9L12 16l-1.4-5.1L6 9l4.6-1.9z" /><path d="m19 15 .8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" /></>,
    download: <><path d="M12 3v12m-5-5 5 5 5-5" /><path d="M4 19v2h16v-2" /></>,
    upload: <><path d="M12 16V4m-5 5 5-5 5 5" /><path d="M4 19v2h16v-2" /></>,
    check: <path d="m4 12 5 5L20 6" />,
    filter: <path d="M4 5h16l-6 7v6l-4 2v-8z" />,
    sort: <><path d="M8 4v16m0 0-4-4m4 4 4-4M16 20V4m0 0-4 4m4-4 4 4" /></>,
    shield: <><path d="m12 2 8 4v6c0 5-4 8-8 10-4-2-8-5-8-10V6z" /><path d="m8.5 12 2.2 2.2 4.8-5" /></>,
    expand: <path d="M8 3H3v5M16 3h5v5M8 21H3v-5M16 21h5v-5" />,
    send: <><path d="m3 4 18 8-18 8 3-8z" /><path d="M6 12h12" /></>,
    plus: <path d="M12 4v16M4 12h16" />,
  };
  const fill = name === 'star' ? 'none' : 'none';
  return <svg className="bm3-icon" width={size} height={size} viewBox="0 0 24 24" aria-hidden="true" fill={fill} stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">{paths[name]}</svg>;
}

function formatDate(value: string, detailed = false) {
  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) return '';
  const today = new Date();
  const sameDay = date.toDateString() === today.toDateString();
  if (detailed) return date.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
  if (sameDay) return date.toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  if (date.getFullYear() === today.getFullYear()) return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

function initials(value: string) {
  const clean = value.replace(/<.*?>/g, '').trim();
  if (!clean) return 'B';
  const parts = clean.split(/\s+/).filter(Boolean);
  return (parts.length > 1 ? parts[0][0] + parts[1][0] : parts[0].slice(0, 2)).toUpperCase();
}

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement || (target instanceof HTMLElement && target.isContentEditable);
}

function localDateTimeValue(iso: string) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(+d)) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function Modal({ title, children, close, wide = false }: { title: string; children: ReactNode; close: () => void; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  const latestClose = useRef(close);
  latestClose.current = close;

  useEffect(() => {
    const dialog = ref.current;
    const previous = document.activeElement;
    if (!dialog) return;
    dialog.showModal();
    const cancel = (event: Event) => {
      event.preventDefault();
      latestClose.current();
    };
    dialog.addEventListener('cancel', cancel);
    return () => {
      dialog.removeEventListener('cancel', cancel);
      if (dialog.open) dialog.close();
      if (previous instanceof HTMLElement) previous.focus();
    };
  }, []);

  return (
    <dialog
      ref={ref}
      className={`bm3-dialog${wide ? ' bm3-dialog-wide' : ''}`}
      aria-label={title}
      onClick={(event) => {
        if (event.target !== event.currentTarget) return;
        const box = event.currentTarget.getBoundingClientRect();
        if (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom) close();
      }}
    >
      <header className="bm3-dialog-head">
        <div>
          <span className="bm3-kicker">BMAIL</span>
          <h2>{title}</h2>
        </div>
        <button type="button" className="bm3-icon-button" aria-label="Close" onClick={close}><Icon name="close" /></button>
      </header>
      {children}
    </dialog>
  );
}

function useBazaaraLinks() {
  const [links, setLinks] = useState<Record<string, string>>({});
  useEffect(() => {
    const fallback: Record<string, number> = {
      search: 3020,
      bmail: 3036,
      bazmeet: 3037,
      calendar: 3028,
      contacts: 3029,
      bazid: 3004,
    };
    let config: Record<string, string> = {};
    try {
      config = JSON.parse(process.env.NEXT_PUBLIC_BAZAARA_APP_URLS || '{}');
    } catch {}
    const host = window.location.hostname;
    const local = ['localhost', '127.0.0.1', '::1'].includes(host);
    const safe: Record<string, string> = {};
    for (const [key, port] of Object.entries(fallback)) {
      const configured = config[key];
      if (typeof configured === 'string') {
        try {
          const url = new URL(configured);
          if (url.protocol === 'https:' || (local && url.protocol === 'http:')) safe[key] = url.href;
        } catch {}
      } else if (local) {
        const hostname = host.includes(':') ? `[${host}]` : host;
        safe[key] = `${window.location.protocol}//${hostname}:${port}/`;
      }
    }
    setLinks(safe);
  }, []);
  return links;
}

export default function BmailExperience() {
  const store = useCollection<Mail>('mail-v2', validMail);
  const links = useBazaaraLinks();
  const [section, setSection] = useState<Section>('Inbox');
  const [query, setQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<QuickFilter>('all');
  const [sortMode, setSortMode] = useState<SortMode>('newest');
  const [activeLabel, setActiveLabel] = useState('');
  const [selected, setSelected] = useState<string[]>([]);
  const [focus, setFocus] = useState<Mail | null>(null);
  const [draft, setDraft] = useState<Mail | null>(null);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [signature, setSignature] = useState('');
  const [template, setTemplate] = useState('');
  const [density, setDensity] = useState<Density>('comfortable');
  const [busy, setBusy] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [labelDialog, setLabelDialog] = useState<string[] | null>(null);
  const [labelName, setLabelName] = useState('');
  const [reminderMail, setReminderMail] = useState<Mail | null>(null);
  const [reminderValue, setReminderValue] = useState('');
  const [visibleLimit, setVisibleLimit] = useState(180);
  const searchRef = useRef<HTMLInputElement>(null);
  const emlInput = useRef<HTMLInputElement>(null);
  const backupInput = useRef<HTMLInputElement>(null);
  const attachmentInput = useRef<HTMLInputElement>(null);
  const draftRef = useRef<Mail | null>(draft);
  const putRef = useRef(store.put);
  draftRef.current = draft;
  putRef.current = store.put;

  useEffect(() => {
    try {
      const writing = JSON.parse(localStorage.getItem('bazaara.mail.v2.writing') || '{}');
      if (typeof writing.signature === 'string') setSignature(writing.signature.slice(0, 3000));
      if (typeof writing.template === 'string') setTemplate(writing.template.slice(0, 10000));
      const ui = JSON.parse(localStorage.getItem('bazaara.mail.ui.v1') || '{}');
      if (ui.density === 'compact' || ui.density === 'comfortable') setDensity(ui.density);
    } catch {}
  }, []);

  useEffect(() => {
    if (!draft) return;
    const timer = window.setTimeout(() => {
      const current = draftRef.current;
      if (current) putRef.current({ ...current, updated: now() });
    }, 650);
    return () => window.clearTimeout(timer);
  }, [draft]);

  useEffect(() => {
    const flush = () => {
      if (draftRef.current) putRef.current({ ...draftRef.current, updated: now() });
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, []);

  useEffect(() => {
    const key = (event: globalThis.KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        searchRef.current?.focus();
      }
      if (event.key.toLowerCase() === 'c' && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        compose();
      }
      if (event.key === 'Escape' && focus) setFocus(null);
    };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });

  useEffect(() => {
    setVisibleLimit(180);
    setSelected([]);
  }, [section, query, quickFilter, sortMode, activeLabel]);

  const labels = useMemo(() => [...new Set(store.items.flatMap(mail => mail.labels).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [store.items]);

  const sectionCounts = useMemo(() => {
    const live = store.items.filter(mail => !mail.trashed);
    const dueNow = (mail: Mail) => !!mail.remind && Date.parse(mail.remind) <= Date.now();
    return {
      Inbox: live.filter(mail => mail.kind === 'message' && !mail.archived).length,
      Starred: live.filter(mail => mail.starred).length,
      Drafts: live.filter(mail => mail.kind === 'draft').length,
      Archive: live.filter(mail => mail.archived).length,
      Reminders: live.filter(mail => !!mail.remind).length,
      'All mail': live.length,
      Trash: store.items.filter(mail => mail.trashed).length,
      unread: live.filter(mail => mail.kind === 'message' && !mail.read).length,
      due: live.filter(dueNow).length,
      attachments: live.filter(mail => mail.attachments.length > 0).length,
    };
  }, [store.items]);

  const shown = useMemo(() => {
    const today = new Date();
    const todayKey = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
    const dueNow = (mail: Mail) => !!mail.remind && Date.parse(mail.remind) <= Date.now();
    const inSection = (mail: Mail) => {
      if (section === 'Trash') return mail.trashed;
      if (mail.trashed) return false;
      if (section === 'Inbox') return mail.kind === 'message' && !mail.archived;
      if (section === 'Starred') return mail.starred;
      if (section === 'Drafts') return mail.kind === 'draft';
      if (section === 'Archive') return mail.archived;
      if (section === 'Reminders') return !!mail.remind;
      return true;
    };
    const inQuickFilter = (mail: Mail) => {
      if (quickFilter === 'unread') return !mail.read;
      if (quickFilter === 'starred') return mail.starred;
      if (quickFilter === 'attachments') return mail.attachments.length > 0;
      if (quickFilter === 'today') {
        const date = new Date(mail.date);
        return !Number.isNaN(+date) && `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}` === todayKey;
      }
      return true;
    };
    const focusScore = (mail: Mail) => (dueNow(mail) ? 12 : 0) + (!mail.read ? 6 : 0) + (mail.starred ? 4 : 0) + (mail.attachments.length ? 1 : 0);

    const rows = store.items
      .filter(mail => inSection(mail))
      .filter(mail => !activeLabel || mail.labels.includes(activeLabel))
      .filter(mail => inQuickFilter(mail))
      .filter(mail => mailMatches(mail, query));

    rows.sort((a, b) => {
      if (sortMode === 'oldest') return a.date.localeCompare(b.date);
      if (sortMode === 'focus') {
        const delta = focusScore(b) - focusScore(a);
        return delta || b.date.localeCompare(a.date);
      }
      return b.date.localeCompare(a.date);
    });
    return rows;
  }, [store.items, section, activeLabel, quickFilter, query, sortMode]);

  const visible = shown.slice(0, visibleLimit);
  const attention = useMemo(() => store.items
    .filter(mail => !mail.trashed && mail.kind === 'message' && (!mail.read || mail.starred || (!!mail.remind && Date.parse(mail.remind) <= Date.now())))
    .sort((a, b) => {
      const aDue = !!a.remind && Date.parse(a.remind) <= Date.now() ? 1 : 0;
      const bDue = !!b.remind && Date.parse(b.remind) <= Date.now() ? 1 : 0;
      return bDue - aDue || Number(!b.read) - Number(!a.read) || b.date.localeCompare(a.date);
    })
    .slice(0, 4), [store.items]);

  const patch = (ids: string[], part: Partial<Mail>) => {
    if (!ids.length) return;
    store.mutate(rows => rows.map(mail => ids.includes(mail.id) ? { ...mail, ...part, updated: now() } : mail));
    if (focus && ids.includes(focus.id)) setFocus(current => current ? { ...current, ...part, updated: now() } : current);
  };

  const saveDraft = () => {
    const current = draftRef.current;
    if (!current) return true;
    return putRef.current({ ...current, updated: now() });
  };

  const compose = (source?: Mail, forward = false) => {
    if (!saveDraft()) return;
    const next = freshMail();
    if (source) {
      next.to = forward ? '' : source.from;
      const cleanSubject = source.subject.replace(/^(Re:|Fwd:)\s*/i, '');
      next.subject = `${forward ? 'Fwd: ' : 'Re: '}${cleanSubject}`;
      const intro = forward ? 'Forwarded message' : `On ${new Date(source.date).toLocaleString()}, ${source.from} wrote:`;
      next.body = `\n\n${intro}\n${source.body.split('\n').map(line => `> ${line}`).join('\n')}`;
    } else {
      next.body = template;
    }
    setDraft(next);
    setError('');
  };

  const openMail = (mail: Mail) => {
    if (mail.kind === 'draft') {
      if (saveDraft()) setDraft(mail);
      return;
    }
    setFocus(mail);
    if (!mail.read) patch([mail.id], { read: true });
  };

  const attachFiles = async (files: File[]) => {
    const current = draftRef.current;
    if (!current || !files.length) return;
    setBusy(true);
    setError('');
    try {
      if (files.length + current.attachments.length > 20) throw Error('A draft supports up to 20 attachments.');
      if (files.some(file => file.size > 10_000_000)) throw Error('Each attachment must be under 10 MB.');
      const total = files.reduce((sum, file) => sum + file.size, 0) + current.attachments.reduce((sum, file) => sum + file.size, 0);
      if (total > 25_000_000) throw Error('Attachments are limited to 25 MB per draft.');
      const added: MailAttachment[] = [];
      for (const file of files) {
        const attachment: MailAttachment = {
          id: crypto.randomUUID(),
          name: file.name,
          type: file.type || 'application/octet-stream',
          size: file.size,
        };
        await attachmentStore(attachment.id, file);
        added.push(attachment);
      }
      if (draftRef.current?.id === current.id) setDraft({ ...draftRef.current, attachments: [...draftRef.current.attachments, ...added] });
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  };

  const exportMail = async (mail: Mail) => {
    setBusy(true);
    setError('');
    try {
      const eml = await exportEML(mail, id => attachmentStore(id));
      download((mail.subject || 'bazaara-mail').replace(/[\\/:*?"<>|]/g, '_') + '.eml', eml, 'message/rfc822');
      setNotice('EML exported with attachments. Review Bcc before sharing the file.');
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  };

  const importEml = async (file: File) => {
    setBusy(true);
    setError('');
    try {
      if (file.size > 15_000_000) throw Error('Choose an EML under 15 MB.');
      const raw = new Uint8Array(await file.arrayBuffer());
      let source = '';
      for (let index = 0; index < raw.length; index += 8192) source += String.fromCharCode(...raw.subarray(index, index + 8192));
      const parsed = parseEML(source);
      for (const imported of parsed.files) {
        const attachment: MailAttachment = {
          id: crypto.randomUUID(),
          name: imported.name,
          type: imported.type,
          size: imported.bytes.byteLength,
        };
        await attachmentStore(attachment.id, new Blob([imported.bytes as BlobPart], { type: imported.type }));
        parsed.mail.attachments.push(attachment);
      }
      if (store.put(parsed.mail)) {
        setSection('Inbox');
        setQuickFilter('all');
        setNotice('Message imported into your local Bmail workspace.');
      }
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  };

  const restoreBackup = async (file: File) => {
    setBusy(true);
    setError('');
    try {
      const rows = await restoreMailBackup(file);
      if (store.mutate(old => [...rows, ...old])) setNotice(`${rows.length} Bmail record${rows.length === 1 ? '' : 's'} restored with attachments.`);
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  };

  const exportBackup = async (rows: Mail[]) => {
    setBusy(true);
    setError('');
    try {
      const backup = await mailBackup(rows);
      download('bazaara-bmail-backup.json', JSON.stringify(backup), 'application/json');
      setNotice(`${rows.length} Bmail record${rows.length === 1 ? '' : 's'} exported.`);
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setBusy(false);
    }
  };

  const removePermanently = async (ids: string[]) => {
    const removed = store.items.filter(mail => ids.includes(mail.id));
    const remaining = store.items.filter(mail => !ids.includes(mail.id));
    if (!store.mutate(() => remaining)) return;
    setSelected([]);
    if (focus && ids.includes(focus.id)) setFocus(null);
    const stillUsed = new Set(remaining.flatMap(mail => mail.attachments.map(file => file.id)));
    for (const attachment of removed.flatMap(mail => mail.attachments)) {
      if (!stillUsed.has(attachment.id)) {
        try { await removeAttachment(attachment.id); } catch (cause) { setError(errorText(cause)); }
      }
    }
    setNotice(`${ids.length} message${ids.length === 1 ? '' : 's'} permanently deleted.`);
  };

  const setReminder = () => {
    if (!reminderMail) return;
    patch([reminderMail.id], { remind: reminderValue ? new Date(reminderValue).toISOString() : '' });
    setNotice(reminderValue ? 'Reminder scheduled for this device workspace.' : 'Reminder cleared.');
    setReminderMail(null);
    setReminderValue('');
  };

  const openReminder = (mail: Mail) => {
    setReminderMail(mail);
    setReminderValue(localDateTimeValue(mail.remind));
  };

  const toggleSelection = (id: string, checked: boolean) => {
    setSelected(current => checked ? [...new Set([...current, id])] : current.filter(value => value !== id));
  };

  const saveWritingSettings = () => {
    try {
      localStorage.setItem('bazaara.mail.v2.writing', JSON.stringify({ signature, template }));
      localStorage.setItem('bazaara.mail.ui.v1', JSON.stringify({ density }));
      setSettingsOpen(false);
      setNotice('Bmail writing and display settings saved.');
    } catch (cause) {
      setError(errorText(cause));
    }
  };

  const navigateSection = (next: Section) => {
    setSection(next);
    setFocus(null);
    setSelected([]);
    setNavOpen(false);
  };

  const addLabel = () => {
    const value = labelName.trim().slice(0, 100);
    if (!value || !labelDialog?.length) return;
    store.mutate(rows => rows.map(mail => labelDialog.includes(mail.id) ? { ...mail, labels: [...new Set([...mail.labels, value])], updated: now() } : mail));
    setLabelDialog(null);
    setLabelName('');
    setNotice(`Label "${value}" added.`);
  };

  const removeLabel = (mail: Mail, value: string) => {
    store.mutate(rows => rows.map(row => row.id === mail.id ? { ...row, labels: row.labels.filter(label => label !== value), updated: now() } : row));
    if (focus?.id === mail.id) setFocus({ ...mail, labels: mail.labels.filter(label => label !== value), updated: now() });
  };

  const selectionRows = selected.length ? store.items.filter(mail => selected.includes(mail.id)) : shown;
  const selectedAllVisible = visible.length > 0 && visible.every(mail => selected.includes(mail.id));

  return (
    <div className={`bm3-root bm3-density-${density}`}>
      <a className="bm3-skip" href="#bm3-main">Skip to mail</a>

      <header className="bm3-topbar">
        <div className="bm3-brand-zone">
          <button className="bm3-icon-button bm3-menu-button" aria-label="Open Bmail navigation" onClick={() => setNavOpen(true)}><Icon name="menu" /></button>
          <a className="bm3-brand" href="/" aria-label="Bmail home">
            <span className="bm3-brand-mark"><img src="/bazaara-v9-symbol.svg" alt="" /></span>
            <span><strong>Bmail</strong><small>BAZAARA</small></span>
          </a>
        </div>

        <div className="bm3-search" role="search">
          <Icon name="search" size={21} />
          <input
            ref={searchRef}
            value={query}
            onChange={event => setQuery(event.target.value)}
            placeholder="Search mail, people, labels or use from:, is:, has:"
            aria-label="Search Bmail"
          />
          {query ? <button className="bm3-search-clear" aria-label="Clear search" onClick={() => setQuery('')}><Icon name="close" size={17} /></button> : <kbd>/</kbd>}
          <button className="bm3-search-filter" aria-label="Open search filters" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(value => !value)}><Icon name="filter" size={18} /></button>
          {filtersOpen && (
            <div className="bm3-search-popover">
              <span className="bm3-kicker">SEARCH FILTERS</span>
              <button onClick={() => { setQuery('is:unread'); setFiltersOpen(false); }}>Unread mail</button>
              <button onClick={() => { setQuery('is:starred'); setFiltersOpen(false); }}>Starred mail</button>
              <button onClick={() => { setQuery('has:attachment'); setFiltersOpen(false); }}>Has attachments</button>
              <button onClick={() => { setQuery('after:' + new Date(Date.now() - 7 * 86400000).toISOString().slice(0, 10)); setFiltersOpen(false); }}>Last 7 days</button>
              <button onClick={() => { setQuery(''); setFiltersOpen(false); }}>Clear query</button>
            </div>
          )}
        </div>

        <div className="bm3-top-actions">
          <span className="bm3-security"><Icon name="shield" size={16} /> Secure workspace</span>
          <button className="bm3-icon-button" aria-label="Writing and display settings" onClick={() => setSettingsOpen(true)}><Icon name="settings" /></button>
          <div className="bm3-apps">
            <button className="bm3-icon-button" aria-label="Connected BAZAARA apps"><Icon name="apps" /></button>
          </div>
          <button className="bm3-avatar-account" aria-label="Open Bmail account switcher" onClick={() => setAccountOpen(true)}>B</button>
        </div>
      </header>

      <div className="bm3-shell">
        <aside className="bm3-navigation" aria-label="Mailbox navigation">
          <button className="bm3-compose" onClick={() => compose()}><span><Icon name="compose" size={21} /></span><strong>Compose</strong><kbd>C</kbd></button>

          <nav className="bm3-nav-sections">
            {SECTIONS.map(item => (
              <button key={item.id} aria-current={section === item.id ? 'page' : undefined} onClick={() => navigateSection(item.id)}>
                <span className="bm3-nav-icon"><Icon name={item.icon} size={19} /></span>
                <span className="bm3-nav-label">{item.id}</span>
                {sectionCounts[item.id] > 0 && <small>{sectionCounts[item.id]}</small>}
              </button>
            ))}
          </nav>

          <div className="bm3-nav-divider" />

          <div className="bm3-label-head">
            <span>Labels</span>
            <button aria-label="Create or add a label to selected mail" onClick={() => { if (selected.length) setLabelDialog(selected); else setNotice('Select one or more messages to add a label.'); }}><Icon name="plus" size={16} /></button>
          </div>
          <div className="bm3-label-list">
            {labels.slice(0, 12).map(value => (
              <button key={value} aria-pressed={activeLabel === value} onClick={() => setActiveLabel(activeLabel === value ? '' : value)}>
                <span className="bm3-label-dot" />{value}
              </button>
            ))}
            {!labels.length && <p>No labels yet</p>}
          </div>

          <div className="bm3-nav-foot">
            <span><Icon name="shield" size={15} /> Local mail workspace</span>
            <p>Drafts and imported EML stay in this browser until a connected Bmail service is used.</p>
            {links.bmail && <a href="/v9">Open connected mail <Icon name="chevron" size={15} /></a>}
          </div>
        </aside>

        <main id="bm3-main" className={`bm3-main${focus ? ' bm3-main-with-reader' : ''}`}>
          <section className="bm3-mail-surface" aria-label={`${section} messages`}>
            <header className="bm3-mail-head">
              <div>
                <h1>{activeLabel ? activeLabel : section === 'Inbox' ? 'Focused' : section}</h1>
                <p>{shown.length} message{shown.length === 1 ? '' : 's'}{sectionCounts.unread ? ` · ${sectionCounts.unread} unread` : ''}</p>
              </div>
              <div className="bm3-head-actions">
                <button className="bm3-icon-button" disabled={busy} title="Import EML" aria-label="Import EML" onClick={() => emlInput.current?.click()}><Icon name="upload" size={18} /></button>
                <input ref={emlInput} hidden type="file" accept=".eml,message/rfc822" onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) void importEml(file); }} />
              </div>
            </header>

            {section === 'Inbox' && (
              <nav className="bm3-category-tabs" aria-label="Inbox categories">
                {[
                  ['','Focused','inbox'],
                  ['Offers','Offers','label'],
                  ['Social','Social','contacts'],
                  ['Updates','Updates','clock'],
                  ['Forums','Forums','mail'],
                ].map(([value,label,icon]) => (
                  <button key={label} aria-current={activeLabel === value ? 'page' : undefined} onClick={() => setActiveLabel(value)}>
                    <Icon name={icon as IconName} size={18}/>
                    <span>{label}</span>
                    {value === '' && sectionCounts.unread > 0 && <small>{sectionCounts.unread > 99 ? '99+' : sectionCounts.unread}</small>}
                  </button>
                ))}
              </nav>
            )}

            {(notice || error || store.error) && (
              <div className={`bm3-notice${error || store.error ? ' bm3-notice-error' : ''}`} role={error || store.error ? 'alert' : 'status'}>
                <span>{error || store.error || notice}</span>
                <button aria-label="Dismiss" onClick={() => { setError(''); setNotice(''); }}><Icon name="close" size={16} /></button>
              </div>
            )}

            <div className="bm3-filter-row">
              <div className="bm3-quick-filters" aria-label="Quick mail filters">
                {QUICK_FILTERS.map(item => <button key={item.id} aria-pressed={quickFilter === item.id} onClick={() => setQuickFilter(item.id)}>{item.label}</button>)}
              </div>
              <label className="bm3-sort">
                <Icon name="sort" size={16} />
                <span className="bm3-visually-hidden">Sort mail</span>
                <select value={sortMode} onChange={event => setSortMode(event.target.value as SortMode)} aria-label="Sort mail">
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                  <option value="focus">Focus first</option>
                </select>
              </label>
            </div>

            <div className={`bm3-bulkbar${selected.length ? ' bm3-bulkbar-active' : ''}`}>
              <label className="bm3-select-all">
                <input type="checkbox" checked={selectedAllVisible} onChange={event => setSelected(event.target.checked ? [...new Set([...selected, ...visible.map(mail => mail.id)])] : selected.filter(id => !visible.some(mail => mail.id === id)))} />
                <span>{selected.length ? `${selected.length} selected` : 'Select visible'}</span>
              </label>
              {selected.length ? (
                <div className="bm3-bulk-actions">
                  <button aria-label="Archive selected" onClick={() => patch(selected, { archived: section !== 'Archive' })}><Icon name="archive" size={17} /></button>
                  <button aria-label="Mark selected read" onClick={() => patch(selected, { read: true })}><Icon name="read" size={17} /></button>
                  <button aria-label="Star selected" onClick={() => patch(selected, { starred: true })}><Icon name="star" size={17} /></button>
                  <button aria-label="Add label" onClick={() => setLabelDialog(selected)}><Icon name="label" size={17} /></button>
                  <button aria-label="Move selected to trash" onClick={() => patch(selected, { trashed: section !== 'Trash' })}><Icon name="trash" size={17} /></button>
                  {section === 'Trash' && <button className="bm3-danger-text" onClick={() => void removePermanently(selected)}>Delete permanently</button>}
                </div>
              ) : (
                <div className="bm3-bulk-actions">
                  <button disabled={busy || !shown.length} onClick={() => void exportBackup(selectionRows)} title="Export visible mail backup" aria-label="Export visible mail backup"><Icon name="download" size={17} /></button>
                  <button onClick={() => setSettingsOpen(true)} title="Mailbox settings" aria-label="Mailbox settings"><Icon name="settings" size={17} /></button>
                </div>
              )}
            </div>

            {visible.length ? (
              <div className="bm3-list" role="list">
                {visible.map(mail => {
                  const due = !!mail.remind && Date.parse(mail.remind) <= Date.now();
                  const active = focus?.id === mail.id;
                  return (
                    <article key={mail.id} className={`bm3-row${mail.read ? '' : ' bm3-row-unread'}${active ? ' bm3-row-active' : ''}`} role="listitem">
                      <label className="bm3-row-check" onClick={event => event.stopPropagation()}>
                        <input type="checkbox" aria-label={`Select ${mail.subject || 'message'}`} checked={selected.includes(mail.id)} onChange={event => toggleSelection(mail.id, event.target.checked)} />
                      </label>
                      <button className={`bm3-row-star${mail.starred ? ' is-starred' : ''}`} aria-label={mail.starred ? 'Unstar message' : 'Star message'} onClick={() => patch([mail.id], { starred: !mail.starred })}><Icon name="star" size={18} /></button>
                      <button className="bm3-row-open" onClick={() => openMail(mail)}>
                        <span className="bm3-sender-avatar">{mail.kind === 'draft' ? 'D' : initials(mail.from)}</span>
                        <span className="bm3-row-copy">
                          <span className="bm3-row-line1">
                            <strong>{mail.kind === 'draft' ? <><i>Draft</i>{mail.to ? ` · ${mail.to}` : ' · Add recipient'}</> : (mail.from || 'Unknown sender')}</strong>
                            <time>{formatDate(mail.date)}</time>
                          </span>
                          <span className="bm3-row-line2">
                            <b>{mail.subject || 'No subject'}</b>
                            <span>{mail.body.replace(/\s+/g, ' ').slice(0, 150) || 'No message preview'}</span>
                          </span>
                          <span className="bm3-row-meta">
                            {mail.labels.slice(0, 3).map(value => <i key={value}>{value}</i>)}
                            {mail.attachments.length > 0 && <em><Icon name="paperclip" size={12} /> {mail.attachments.length}</em>}
                            {due && <em className="bm3-due"><Icon name="clock" size={12} /> due</em>}
                          </span>
                        </span>
                      </button>
                      <div className="bm3-row-actions">
                        <button aria-label="Archive" onClick={() => patch([mail.id], { archived: !mail.archived })}><Icon name="archive" size={17} /></button>
                        <button aria-label={mail.read ? 'Mark unread' : 'Mark read'} onClick={() => patch([mail.id], { read: !mail.read })}><Icon name={mail.read ? 'unread' : 'read'} size={17} /></button>
                        <button aria-label="Set reminder" onClick={() => openReminder(mail)}><Icon name="clock" size={17} /></button>
                        <button aria-label="Move to trash" onClick={() => patch([mail.id], { trashed: true })}><Icon name="trash" size={17} /></button>
                      </div>
                    </article>
                  );
                })}
                {shown.length > visible.length && <button className="bm3-load-more" onClick={() => setVisibleLimit(value => value + 180)}>Load {Math.min(180, shown.length - visible.length)} more</button>}
              </div>
            ) : (
              <div className="bm3-empty">
                <span><Icon name={section === 'Trash' ? 'trash' : section === 'Drafts' ? 'draft' : 'mail'} size={34} /></span>
                <h2>{query || quickFilter !== 'all' || activeLabel ? 'No matching mail' : `${section} is clear`}</h2>
                <p>{query ? 'Try a broader query or clear a filter.' : 'Import an EML or compose a new draft to begin.'}</p>
                <button className="bm3-primary-button" onClick={() => compose()}><Icon name="compose" size={18} /> Compose</button>
              </div>
            )}
          </section>

          {focus ? (
            <aside className="bm3-reader" aria-label="Open message">
              <header className="bm3-reader-toolbar">
                <button className="bm3-icon-button bm3-reader-back" aria-label="Back to list" onClick={() => setFocus(null)}><Icon name="back" /></button>
                <div className="bm3-reader-tools">
                  <button aria-label="Archive" onClick={() => { patch([focus.id], { archived: true }); setFocus(null); }}><Icon name="archive" size={18} /></button>
                  <button aria-label={focus.starred ? 'Unstar' : 'Star'} onClick={() => patch([focus.id], { starred: !focus.starred })}><Icon name="star" size={18} /></button>
                  <button aria-label="Set reminder" onClick={() => openReminder(focus)}><Icon name="clock" size={18} /></button>
                  <button aria-label="Mark unread" onClick={() => patch([focus.id], { read: false })}><Icon name="unread" size={18} /></button>
                  <button aria-label="Move to trash" onClick={() => { patch([focus.id], { trashed: true }); setFocus(null); }}><Icon name="trash" size={18} /></button>
                </div>
              </header>

              <div className="bm3-reader-scroll">
                <div className="bm3-reader-title">
                  <span className="bm3-kicker">MESSAGE</span>
                  <h2>{focus.subject || 'No subject'}</h2>
                  <div className="bm3-reader-labels">
                    {focus.labels.map(value => <button key={value} title="Remove label" onClick={() => removeLabel(focus, value)}>{value} <span>×</span></button>)}
                    <button className="bm3-add-label" onClick={() => setLabelDialog([focus.id])}><Icon name="plus" size={13} /> label</button>
                  </div>
                </div>

                <div className="bm3-sender-card">
                  <span className="bm3-sender-avatar bm3-sender-avatar-large">{initials(focus.from)}</span>
                  <div>
                    <strong>{focus.from || 'Unknown sender'}</strong>
                    <span>to {focus.to || 'you'}</span>
                  </div>
                  <time>{formatDate(focus.date, true)}</time>
                </div>

                <pre className="bm3-message-body">{focus.body || 'This message has no plain-text body.'}</pre>

                {focus.attachments.length > 0 && (
                  <section className="bm3-attachment-section">
                    <header><strong>{focus.attachments.length} attachment{focus.attachments.length === 1 ? '' : 's'}</strong><span>Stored on this device</span></header>
                    <div className="bm3-attachment-grid">
                      {focus.attachments.map(file => (
                        <button key={file.id} onClick={() => void attachmentStore(file.id).then(blob => download(file.name, blob, file.type)).catch(cause => setError(errorText(cause)))}>
                          <span><Icon name="paperclip" /></span>
                          <strong>{file.name}</strong>
                          <small>{(file.size / 1024).toFixed(0)} KB · {file.type || 'file'}</small>
                          <Icon name="download" size={16} />
                        </button>
                      ))}
                    </div>
                  </section>
                )}

                <div className="bm3-reader-reply">
                  <button className="bm3-primary-button" onClick={() => compose(focus)}><Icon name="reply" size={18} /> Reply</button>
                  <button className="bm3-soft-button" onClick={() => compose(focus, true)}><Icon name="forward" size={18} /> Forward</button>
                  <button className="bm3-soft-button" disabled={busy} onClick={() => void exportMail(focus)}><Icon name="download" size={18} /> Export EML</button>
                </div>
              </div>
            </aside>
          ) : (
            <aside className="bm3-focus-panel" aria-label="Bmail focus pulse">
              <header>
                <span className="bm3-focus-orb"><Icon name="spark" size={22} /></span>
                <div><span className="bm3-kicker">FOCUS PULSE</span><h2>What needs attention</h2></div>
              </header>

              <div className="bm3-focus-metrics">
                <button onClick={() => { setSection('Inbox'); setQuickFilter('unread'); }}>
                  <strong>{sectionCounts.unread}</strong><span>Unread</span>
                </button>
                <button onClick={() => navigateSection('Drafts')}>
                  <strong>{sectionCounts.Drafts}</strong><span>Drafts</span>
                </button>
                <button onClick={() => navigateSection('Reminders')}>
                  <strong>{sectionCounts.due}</strong><span>Due</span>
                </button>
              </div>

              <section className="bm3-attention">
                <div className="bm3-panel-title"><strong>Priority queue</strong><span>{attention.length ? 'Live from your mailbox' : 'Nothing urgent'}</span></div>
                {attention.map(mail => (
                  <button key={mail.id} onClick={() => openMail(mail)}>
                    <span className="bm3-mini-avatar">{initials(mail.from)}</span>
                    <span><strong>{mail.subject || mail.from || 'Message'}</strong><small>{mail.from || 'Unknown sender'} · {formatDate(mail.date)}</small></span>
                    <Icon name="chevron" size={15} />
                  </button>
                ))}
                {!attention.length && <div className="bm3-calm"><Icon name="check" size={18} /><span>Your local queue is clear.</span></div>}
              </section>

              <section className="bm3-connected-tools">
                <div className="bm3-panel-title"><strong>Connected tools</strong><span>Continue the conversation</span></div>
                <div>
                  {links.calendar ? <a href={links.calendar}><span><Icon name="calendar" /></span><b>Calendar</b><small>Schedule</small></a> : <span className="is-disabled"><span><Icon name="calendar" /></span><b>Calendar</b><small>URL needed</small></span>}
                  {links.contacts ? <a href={links.contacts}><span><Icon name="contacts" /></span><b>Contacts</b><small>People</small></a> : <span className="is-disabled"><span><Icon name="contacts" /></span><b>Contacts</b><small>URL needed</small></span>}
                  {links.bazmeet ? <a href={links.bazmeet}><span><Icon name="video" /></span><b>BazMeet</b><small>Meet</small></a> : <span className="is-disabled"><span><Icon name="video" /></span><b>BazMeet</b><small>URL needed</small></span>}
                </div>
              </section>

              <section className="bm3-workspace-note">
                <Icon name="shield" size={18} />
                <div><strong>Local-first workspace</strong><p>Imported messages, drafts and attachments stay on this device. Account sending and inbound sync remain separate connected services.</p></div>
              </section>
            </aside>
          )}
        </main>
      </div>

      <button className="bm3-compose-fab" onClick={() => compose()} aria-label="Compose mail"><Icon name="compose" size={22} /><span>Compose</span></button>
      <nav className="bm3-mobile-nav" aria-label="Bmail mobile navigation">
        <button aria-current="page" onClick={() => navigateSection('Inbox')}><span className="bm3-mobile-nav-icon"><Icon name="mail" /><i>{sectionCounts.unread > 99 ? '99+' : sectionCounts.unread || ''}</i></span><span>Mail</span></button>
        <button onClick={() => { if (links.bazmeet) window.location.href = links.bazmeet; }}><span className="bm3-mobile-nav-icon"><Icon name="video" /></span><span>Meet</span></button>
      </nav>

      {navOpen && (
        <div className="bm3-drawer-layer" onMouseDown={event => { if (event.target === event.currentTarget) setNavOpen(false); }}>
          <aside className="bm3-drawer" aria-label="Bmail navigation drawer">
            <header>
              <a className="bm3-brand" href="/"><span className="bm3-brand-mark"><img src="/bazaara-v9-symbol.svg" alt="" /></span><span><strong>Bmail</strong><small>BAZAARA</small></span></a>
              <button className="bm3-icon-button" aria-label="Close navigation" onClick={() => setNavOpen(false)}><Icon name="close" /></button>
            </header>
            <div className="bm3-drawer-all"><button onClick={() => navigateSection('All mail')}><Icon name="inbox" size={21}/><strong>All inboxes</strong></button></div>
            <div className="bm3-drawer-categories">
              <button className={section === 'Inbox' && !activeLabel ? 'is-active' : ''} onClick={() => navigateSection('Inbox')}><Icon name="inbox"/><span>Focused</span><small>{sectionCounts.Inbox || ''}</small></button>
              <button onClick={() => { navigateSection('Inbox'); setActiveLabel('Offers'); }}><Icon name="label"/><span>Offers</span></button>
              <button onClick={() => { navigateSection('Inbox'); setActiveLabel('Social'); }}><Icon name="contacts"/><span>Social</span></button>
              <button onClick={() => { navigateSection('Inbox'); setActiveLabel('Updates'); }}><Icon name="clock"/><span>Updates</span></button>
              <button onClick={() => { navigateSection('Inbox'); setActiveLabel('Forums'); }}><Icon name="mail"/><span>Forums</span></button>
            </div>
            <div className="bm3-drawer-heading">All labels</div>
            <nav className="bm3-nav-sections">
              {SECTIONS.filter(item => item.id !== 'Inbox').map(item => (
                <button key={item.id} aria-current={section === item.id ? 'page' : undefined} onClick={() => navigateSection(item.id)}>
                  <span className="bm3-nav-icon"><Icon name={item.icon} size={20} /></span><span className="bm3-nav-label">{item.id}</span>{sectionCounts[item.id] > 0 && <small>{sectionCounts[item.id] > 99 ? '99+' : sectionCounts[item.id]}</small>}
                </button>
              ))}
            </nav>
            <button className="bm3-drawer-utility" onClick={() => setNotice('Subscription controls will use the connected Bmail service.')}><Icon name="mail"/><span>Manage subscriptions</span><b>New</b></button>
            <button className="bm3-drawer-utility" onClick={() => { if (selected.length) setLabelDialog(selected); else setNotice('Select mail first, then create or apply a label.'); }}><Icon name="plus"/><span>Create label</span></button>
            <div className="bm3-drawer-heading">Bazaara apps</div>
            {links.calendar && <a className="bm3-drawer-utility" href={links.calendar}><Icon name="calendar"/><span>Calendar</span></a>}
            {links.contacts && <a className="bm3-drawer-utility" href={links.contacts}><Icon name="contacts"/><span>Contacts</span></a>}
            <div className="bm3-drawer-bottom">
              <button onClick={() => { setNavOpen(false); setSettingsOpen(true); }}><Icon name="settings"/><span>Settings</span></button>
              <button onClick={() => setNotice('Bmail help center will connect here.')}><Icon name="shield"/><span>Help & feedback</span></button>
            </div>
          </aside>
        </div>
      )}

      {accountOpen && (
        <Modal title="Bmail accounts" close={() => setAccountOpen(false)}>
          <div className="bm3-account-sheet">
            <section className="bm3-account-primary">
              <span className="bm3-account-avatar">B</span>
              <div><strong>BazID account</strong><span>Your primary Bmail identity</span></div>
              <button aria-label="Collapse account"><Icon name="chevron"/></button>
            </section>
            <button className="bm3-account-action" onClick={() => setNotice('BazID account connection flow opens here.')}><Icon name="plus"/><span><strong>Add another account</strong><small>Connect another Bmail or supported mailbox</small></span></button>
            {links.bazid && <a className="bm3-account-action" href={links.bazid}><Icon name="settings"/><span><strong>Manage BazID account</strong><small>Identity, security, sessions and connected services</small></span></a>}
            <button className="bm3-account-action" onClick={() => setNotice('Sign-out will be handled by BazID session management.')}><Icon name="back"/><span><strong>Sign out</strong><small>End the current Bmail session</small></span></button>
            <section className="bm3-storage-card"><Icon name="shield"/><div><strong>Bmail storage</strong><span>Storage usage appears when Bmail cloud sync is connected.</span><div className="bm3-storage-track"><i/></div></div></section>
          </div>
        </Modal>
      )}

      {draft && (
        <Modal title={draft.id && store.items.some(mail => mail.id === draft.id) ? 'Edit draft' : 'New message'} close={() => { if (!busy && saveDraft()) setDraft(null); }} wide>
          <form className="bm3-compose-form" onSubmit={(event: FormEvent) => { event.preventDefault(); if (saveDraft()) { setDraft(null); setNotice('Draft saved on this device.'); } }}>
            <div className="bm3-compose-fields">
              <label><span>From</span><input type="email" value={draft.from} onChange={event => setDraft({ ...draft, from: event.target.value })} placeholder="you@bmail.com" /></label>
              <label className="bm3-to-field"><span>To</span><input autoFocus value={draft.to} maxLength={2000} onChange={event => setDraft({ ...draft, to: event.target.value })} placeholder="name@example.com" /></label>
              <label><span>Cc</span><input value={draft.cc} maxLength={2000} onChange={event => setDraft({ ...draft, cc: event.target.value })} /></label>
              <label><span>Bcc</span><input value={draft.bcc} maxLength={2000} onChange={event => setDraft({ ...draft, bcc: event.target.value })} /></label>
              <label className="bm3-subject-field"><span>Subject</span><input value={draft.subject} maxLength={300} onChange={event => setDraft({ ...draft, subject: event.target.value })} placeholder="What is this about?" /></label>
            </div>

            <textarea className="bm3-compose-body" aria-label="Message body" value={draft.body} maxLength={200000} onChange={event => setDraft({ ...draft, body: event.target.value })} placeholder="Write your message…" />

            {draft.attachments.length > 0 && (
              <div className="bm3-compose-attachments">
                {draft.attachments.map(file => (
                  <span key={file.id}><Icon name="paperclip" size={14} /><b>{file.name}</b><small>{(file.size / 1024).toFixed(0)} KB</small><button type="button" aria-label={`Remove ${file.name}`} onClick={() => {
                    setDraft({ ...draft, attachments: draft.attachments.filter(item => item.id !== file.id) });
                    void removeAttachment(file.id).catch(cause => setError(errorText(cause)));
                  }}><Icon name="close" size={14} /></button></span>
                ))}
              </div>
            )}

            <div className="bm3-compose-tools">
              <div>
                <button type="button" disabled={busy} onClick={() => attachmentInput.current?.click()}><Icon name="paperclip" size={17} /> Attach</button>
                <input ref={attachmentInput} hidden multiple type="file" onChange={event => { const files = Array.from(event.currentTarget.files || []); event.currentTarget.value = ''; void attachFiles(files); }} />
                <button type="button" disabled={!signature} onClick={() => setDraft({ ...draft, body: `${draft.body}\n\n${signature}` })}>Signature</button>
                <button type="button" disabled={!template} onClick={() => setDraft({ ...draft, body: `${draft.body}\n${template}` })}>Template</button>
                <button type="button" onClick={() => openReminder(draft)}><Icon name="clock" size={17} /> Reminder</button>
              </div>
              <small>Autosaved locally</small>
            </div>

            <div className="bm3-compose-footer">
              <div>
                <button type="submit" className="bm3-soft-button">Save draft</button>
                <button type="button" className="bm3-soft-button" disabled={busy} onClick={() => void exportMail(draft)}>Export EML</button>
              </div>
              <button
                type="button"
                className="bm3-primary-button"
                disabled={busy}
                onClick={() => {
                  if (!draft.to.trim()) { setError('Add at least one recipient first.'); return; }
                  if (draft.attachments.length) setNotice('Mail-app handoff does not include local attachments. Export EML to keep them.');
                  if (saveDraft()) {
                    window.location.href = `mailto:${encodeURIComponent(draft.to)}?cc=${encodeURIComponent(draft.cc)}&bcc=${encodeURIComponent(draft.bcc)}&subject=${encodeURIComponent(draft.subject)}&body=${encodeURIComponent(draft.body)}`;
                  }
                }}
              >
                <Icon name="send" size={18} /> Send with mail app
              </button>
            </div>
          </form>
        </Modal>
      )}

      {settingsOpen && (
        <Modal title="Bmail settings" close={() => setSettingsOpen(false)}>
          <div className="bm3-settings-form">
            <section>
              <span className="bm3-kicker">WRITING</span>
              <label><span>Signature</span><textarea value={signature} maxLength={3000} onChange={event => setSignature(event.target.value)} placeholder="Your default sign-off" /></label>
              <label><span>Reusable template</span><textarea value={template} maxLength={10000} onChange={event => setTemplate(event.target.value)} placeholder="Reusable opening or message body" /></label>
            </section>
            <section>
              <span className="bm3-kicker">DISPLAY</span>
              <div className="bm3-segmented">
                <button type="button" aria-pressed={density === 'comfortable'} onClick={() => setDensity('comfortable')}>Comfortable</button>
                <button type="button" aria-pressed={density === 'compact'} onClick={() => setDensity('compact')}>Compact</button>
              </div>
            </section>
            <section>
              <span className="bm3-kicker">DATA</span>
              <div className="bm3-settings-actions">
                <button type="button" disabled={busy || !store.items.length} onClick={() => void exportBackup(store.items)}><Icon name="download" size={17} /> Export full backup</button>
                <button type="button" disabled={busy} onClick={() => backupInput.current?.click()}><Icon name="upload" size={17} /> Restore backup</button>
                <input ref={backupInput} hidden type="file" accept="application/json,.json" onChange={event => { const file = event.currentTarget.files?.[0]; event.currentTarget.value = ''; if (file) void restoreBackup(file); }} />
              </div>
            </section>
            <p className="bm3-settings-note">Bmail keeps imported mail, drafts and attachment blobs on this device. Connected account transport is handled separately.</p>
            <button className="bm3-primary-button bm3-save-settings" onClick={saveWritingSettings}>Save settings</button>
          </div>
        </Modal>
      )}

      {labelDialog && (
        <Modal title="Add label" close={() => { setLabelDialog(null); setLabelName(''); }}>
          <form className="bm3-mini-form" onSubmit={event => { event.preventDefault(); addLabel(); }}>
            <label><span>Label name</span><input autoFocus value={labelName} maxLength={100} onChange={event => setLabelName(event.target.value)} placeholder="Project, Finance, Travel…" /></label>
            <p>This adds the label to {labelDialog.length} selected message{labelDialog.length === 1 ? '' : 's'}.</p>
            <div><button type="button" className="bm3-soft-button" onClick={() => { setLabelDialog(null); setLabelName(''); }}>Cancel</button><button className="bm3-primary-button" type="submit">Add label</button></div>
          </form>
        </Modal>
      )}

      {reminderMail && (
        <Modal title="Mail reminder" close={() => { setReminderMail(null); setReminderValue(''); }}>
          <form className="bm3-mini-form" onSubmit={event => { event.preventDefault(); setReminder(); }}>
            <div className="bm3-reminder-preview"><span className="bm3-mini-avatar">{initials(reminderMail.from || reminderMail.to || 'B')}</span><div><strong>{reminderMail.subject || 'No subject'}</strong><small>{reminderMail.kind === 'draft' ? reminderMail.to : reminderMail.from}</small></div></div>
            <label><span>Remind me on this device</span><input type="datetime-local" value={reminderValue} onChange={event => setReminderValue(event.target.value)} /></label>
            <p>This does not remove the message from Inbox; it creates a local follow-up reminder.</p>
            <div><button type="button" className="bm3-soft-button" onClick={() => setReminderValue('')}>Clear</button><button className="bm3-primary-button" type="submit">Save reminder</button></div>
          </form>
        </Modal>
      )}
    </div>
  );
}
