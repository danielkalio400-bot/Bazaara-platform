'use client';

import { FormEvent, useMemo, useRef, useState } from 'react';

type Conversation = {
  id: string;
  name: string;
  phone: string;
  initials: string;
  preview: string;
  time: string;
  unread?: number;
  pinned?: boolean;
  muted?: boolean;
  typing?: boolean;
  online?: boolean;
  kind: 'person' | 'group' | 'channel';
};

type Message = {
  id: string;
  conversationId: string;
  mine: boolean;
  text?: string;
  time: string;
  status?: 'sent' | 'delivered' | 'read';
  voice?: string;
  image?: boolean;
  replyTo?: string;
  reaction?: string;
};

const conversations: Conversation[] = [
  {
    id: 'emma',
    name: 'Emma Carter',
    phone: '+234 801 234 5678',
    initials: 'EC',
    preview: 'See you tomorrow! ✨',
    time: '9:41 PM',
    unread: 2,
    pinned: true,
    online: true,
    kind: 'person',
  },
  {
    id: 'family',
    name: 'Family',
    phone: '',
    initials: 'FA',
    preview: 'Photo',
    time: '8:24 PM',
    unread: 3,
    pinned: true,
    kind: 'group',
  },
  {
    id: 'design',
    name: 'Design Team',
    phone: '',
    initials: 'DT',
    preview: "Let's finalize the proposal.",
    time: '6:12 PM',
    pinned: true,
    muted: true,
    kind: 'group',
  },
  {
    id: 'michael',
    name: 'Michael Lee',
    phone: '+234 803 441 9001',
    initials: 'ML',
    preview: 'Typing…',
    time: '9:40 PM',
    unread: 2,
    typing: true,
    online: true,
    kind: 'person',
  },
  {
    id: 'olivia',
    name: 'Olivia Bennett',
    phone: '+234 805 000 4108',
    initials: 'OB',
    preview: 'Voice message · 0:24',
    time: '9:12 PM',
    unread: 1,
    kind: 'person',
  },
  {
    id: 'launch',
    name: 'Project Launch',
    phone: '',
    initials: 'PL',
    preview: 'Amazing progress today!',
    time: '8:05 PM',
    kind: 'group',
  },
  {
    id: 'david',
    name: 'David Kim',
    phone: '+234 809 671 2043',
    initials: 'DK',
    preview: "Let's catch up this week.",
    time: '6:50 PM',
    kind: 'person',
  },
  {
    id: 'channel',
    name: 'Bazaara Product',
    phone: '',
    initials: 'BP',
    preview: 'New release notes published',
    time: '5:18 PM',
    kind: 'channel',
  },
];

const seedMessages: Message[] = [
  { id: 'm1', conversationId: 'emma', mine: false, text: "Hey! How's the new design coming along?", time: '9:20 PM' },
  { id: 'm2', conversationId: 'emma', mine: true, text: "It's looking amazing! ✨ Here's a preview.", time: '9:21 PM', status: 'read' },
  { id: 'm3', conversationId: 'emma', mine: true, image: true, time: '9:21 PM', status: 'read' },
  { id: 'm4', conversationId: 'emma', mine: false, text: 'Wow! This looks incredible! 😍', time: '9:22 PM', reaction: '❤️ 1' },
  { id: 'm5', conversationId: 'emma', mine: true, voice: '0:28', time: '9:24 PM', status: 'read' },
  { id: 'm6', conversationId: 'emma', mine: false, text: "Let's finalize it tomorrow and share with the team.", time: '9:26 PM' },
  { id: 'm7', conversationId: 'emma', mine: true, text: 'Perfect! See you tomorrow! 🚀', time: '9:26 PM', status: 'read' },
];

const icons: Record<string, React.ReactNode> = {
  chats: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H10l-4.8 3.6V15.1A2.5 2.5 0 0 1 4 13z" /></>,
  call: <><path d="M8.1 4.3 6.6 3.5a2 2 0 0 0-2.7.8L3 6.2c-.9 2 1.2 6.4 4.8 10s8 5.7 10 4.8l1.9-.9a2 2 0 0 0 .8-2.7l-.8-1.5a2 2 0 0 0-2.4-.9l-1.8.7a1.6 1.6 0 0 1-1.7-.4l-5.1-5.1a1.6 1.6 0 0 1-.4-1.7L9 6.7a2 2 0 0 0-.9-2.4Z" /></>,
  story: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  people: <><circle cx="9" cy="8" r="3" /><path d="M3.5 18a5.5 5.5 0 0 1 11 0" /><path d="M16 7.5a2.5 2.5 0 1 1 0 5" /><path d="M16 14.5c2.5.2 4.5 1.4 4.5 3.5" /></>,
  channel: <><path d="m4 11 12-5v12L4 13z" /><path d="M8 14.5 9 19" /><path d="M18 8.5a5 5 0 0 1 0 7" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.5 1a8 8 0 0 0-1.7-1L14.4 3h-4.8l-.3 3.1a8 8 0 0 0-1.7 1l-2.5-1-2 3.4L5.1 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.5-1a8 8 0 0 0 1.7 1l.3 3.1h4.8l.3-3.1a8 8 0 0 0 1.7-1l2.5 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z" /></>,
  search: <><circle cx="11" cy="11" r="6.5" /><path d="m16 16 4 4" /></>,
  plus: <><path d="M12 5v14M5 12h14" /></>,
  video: <><rect x="3" y="6" width="12" height="12" rx="3" /><path d="m15 10 5-3v10l-5-3z" /></>,
  info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v6" /><path d="M12 7.5h.01" /></>,
  back: <><path d="m15 18-6-6 6-6" /></>,
  smile: <><circle cx="12" cy="12" r="9" /><path d="M8.5 10h.01M15.5 10h.01" /><path d="M8 14c1 1.5 2.3 2 4 2s3-.5 4-2" /></>,
  mic: <><rect x="9" y="4" width="6" height="11" rx="3" /><path d="M6 11a6 6 0 0 0 12 0M12 17v3" /></>,
  send: <><path d="m4 4 16 8-16 8 3-8z" /><path d="M7 12h13" /></>,
  paperclip: <><path d="m8 12 6.8-6.8a3 3 0 1 1 4.2 4.2l-8.5 8.5a5 5 0 0 1-7.1-7.1l8.1-8.1" /></>,
  archive: <><path d="M4 7h16v13H4z" /><path d="M3 4h18v3H3z" /><path d="M9 11h6" /></>,
  star: <><path d="m12 3 2.7 5.5 6 .9-4.4 4.3 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.3 6-.9z" /></>,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
};

function Icon({ name, size = 20 }: { name: keyof typeof icons; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

function Avatar({ item, large = false }: { item: Conversation; large?: boolean }) {
  return (
    <div className={`bc-avatar ${large ? 'bc-avatar--large' : ''} bc-avatar--${item.id.slice(0, 3)}`} aria-hidden="true">
      <span>{item.initials}</span>
      {item.online && <i className="bc-presence" />}
    </div>
  );
}

export function BChatPhase1() {
  const [selectedId, setSelectedId] = useState('emma');
  const [filter, setFilter] = useState<'all' | 'unread' | 'group' | 'channel'>('all');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>(seedMessages);
  const [mobilePane, setMobilePane] = useState<'inbox' | 'chat'>('inbox');
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [attachOpen, setAttachOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const selected = conversations.find((c) => c.id === selectedId) ?? conversations[0];

  const normalizedQuery = query.trim().toLowerCase();
  const looksLikePhone = /^[+\d\s()-]{5,}$/.test(query.trim());

  const visible = useMemo(() => {
    return conversations.filter((conversation) => {
      if (filter === 'unread' && !conversation.unread) return false;
      if (filter === 'group' && conversation.kind !== 'group') return false;
      if (filter === 'channel' && conversation.kind !== 'channel') return false;
      if (!normalizedQuery) return true;
      return (
        conversation.name.toLowerCase().includes(normalizedQuery) ||
        conversation.phone.replace(/\s/g, '').includes(normalizedQuery.replace(/\s/g, '')) ||
        conversation.preview.toLowerCase().includes(normalizedQuery)
      );
    });
  }, [filter, normalizedQuery]);

  const pinned = visible.filter((c) => c.pinned);
  const regular = visible.filter((c) => !c.pinned);
  const chatMessages = messages.filter((m) => m.conversationId === selected.id);

  function openConversation(id: string) {
    setSelectedId(id);
    setMobilePane('chat');
    setAttachOpen(false);
  }

  function submitMessage(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setMessages((current) => [
      ...current,
      {
        id: `local-${Date.now()}`,
        conversationId: selected.id,
        mine: true,
        text,
        time: 'Now',
        status: 'sent',
      },
    ]);
    setDraft('');
    inputRef.current?.focus();
  }

  return (
    <main className="bc-app" data-mobile-pane={mobilePane}>
      <div className="bc-ambient bc-ambient--one" />
      <div className="bc-ambient bc-ambient--two" />

      <section className="bc-shell" aria-label="BChat Phase 1 interface preview">
        <aside className="bc-rail" aria-label="BChat navigation">
          <div className="bc-brand" aria-label="BChat">
            <div className="bc-brandmark">B</div>
            <strong>BChat</strong>
          </div>

          <nav className="bc-railnav">
            <button className="is-active"><Icon name="chats" /><span>Chats</span><b>12</b></button>
            <button><Icon name="call" /><span>Calls</span></button>
            <button><Icon name="story" /><span>Stories</span></button>
            <button><Icon name="people" /><span>People</span></button>
            <button><Icon name="channel" /><span>Channels</span></button>
          </nav>

          <div className="bc-railnav bc-railnav--secondary">
            <button><Icon name="star" /><span>Saved</span></button>
            <button><Icon name="settings" /><span>Settings</span></button>
          </div>

          <div className="bc-account">
            <div className="bc-account-avatar">LD</div>
            <div><strong>BazID</strong><span>Connected</span></div>
          </div>
        </aside>

        <section className="bc-inbox" aria-label="Chats">
          <header className="bc-inbox-head">
            <div className="bc-mobile-brand"><div className="bc-brandmark">B</div><strong>BChat</strong></div>
            <div className="bc-title-row"><h1>Chats</h1><button className="bc-icon-btn" aria-label="New chat"><Icon name="plus" /></button></div>
            <label className="bc-search">
              <Icon name="search" size={18} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search chats or enter a phone number"
                aria-label="Search chats or enter a phone number"
              />
            </label>
            <div className="bc-filters" role="tablist" aria-label="Chat filters">
              {[
                ['all', 'All'],
                ['unread', 'Unread'],
                ['group', 'Groups'],
                ['channel', 'Channels'],
              ].map(([value, label]) => (
                <button
                  key={value}
                  className={filter === value ? 'is-active' : ''}
                  onClick={() => setFilter(value as typeof filter)}
                  role="tab"
                  aria-selected={filter === value}
                >
                  {label}{value === 'unread' && <span>12</span>}
                </button>
              ))}
            </div>
          </header>

          <div className="bc-list" role="list">
            {looksLikePhone && normalizedQuery && visible.length === 0 && (
              <button className="bc-phone-discovery" onClick={() => setQuery('')}>
                <div className="bc-phone-icon">+</div>
                <div><strong>Start a new chat</strong><span>{query.trim()}</span></div>
                <em>Phone number only</em>
              </button>
            )}

            {pinned.length > 0 && <div className="bc-section-label"><span>Pinned</span><small>•••</small></div>}
            {pinned.map((item) => <ConversationRow key={item.id} item={item} selected={selectedId === item.id} onOpen={openConversation} />)}

            {regular.length > 0 && <div className="bc-section-label"><span>All chats</span><small>•••</small></div>}
            {regular.map((item) => <ConversationRow key={item.id} item={item} selected={selectedId === item.id} onOpen={openConversation} />)}

            {visible.length === 0 && !looksLikePhone && (
              <div className="bc-empty"><Icon name="search" size={28} /><strong>No chats found</strong><span>Try a contact name, chat text, or phone number.</span></div>
            )}
          </div>

          <nav className="bc-bottom-nav" aria-label="Mobile BChat navigation">
            <button className="is-active"><Icon name="chats" /><span>Chats</span></button>
            <button><Icon name="call" /><span>Calls</span></button>
            <button><Icon name="story" /><span>Stories</span></button>
            <button><Icon name="people" /><span>People</span></button>
          </nav>
        </section>

        <section className="bc-chat" aria-label={`Conversation with ${selected.name}`}>
          <header className="bc-chat-head">
            <button className="bc-icon-btn bc-mobile-back" onClick={() => setMobilePane('inbox')} aria-label="Back to chats"><Icon name="back" /></button>
            <button className="bc-person-button" onClick={() => setDetailsOpen(true)}>
              <Avatar item={selected} />
              <div><strong>{selected.name}</strong><span>{selected.online ? 'Online' : selected.kind === 'person' ? selected.phone : selected.kind === 'group' ? 'Group conversation' : 'Channel'}</span></div>
            </button>
            <div className="bc-chat-actions">
              <button className="bc-icon-btn" aria-label="Video call"><Icon name="video" /></button>
              <button className="bc-icon-btn" aria-label="Voice call"><Icon name="call" /></button>
              <button className="bc-icon-btn" aria-label="Search in conversation"><Icon name="search" /></button>
              <button className="bc-icon-btn" onClick={() => setDetailsOpen((v) => !v)} aria-label="Conversation details"><Icon name="info" /></button>
            </div>
          </header>

          <div className="bc-message-canvas">
            <div className="bc-date-pill">Today</div>
            <div className="bc-message-stack">
              {chatMessages.length === 0 && (
                <div className="bc-empty-chat">
                  <Avatar item={selected} large />
                  <strong>{selected.name}</strong>
                  {selected.phone && <span>{selected.phone}</span>}
                  <small>Messages in this Phase 1 preview are local-only and do not modify the live BChat API.</small>
                </div>
              )}
              {chatMessages.map((message) => <MessageBubble key={message.id} message={message} />)}
            </div>
          </div>

          <div className="bc-composer-zone">
            {attachOpen && (
              <div className="bc-attach-sheet" role="dialog" aria-label="Attachment options">
                {[
                  ['Photo', '▧'], ['Video', '▶'], ['File', '▤'], ['Contact', '◉'], ['Location', '⌖'], ['Poll', '▥'],
                ].map(([label, symbol]) => <button key={label}><span>{symbol}</span><strong>{label}</strong></button>)}
              </div>
            )}
            <form className="bc-composer" onSubmit={submitMessage}>
              <button type="button" className="bc-composer-plus" onClick={() => setAttachOpen((v) => !v)} aria-label="Attachments"><Icon name="plus" /></button>
              <div className="bc-input-wrap">
                <input ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Message" aria-label="Message" />
                <button type="button" aria-label="Emoji"><Icon name="smile" size={19} /></button>
                <button type="button" aria-label="Attach file" onClick={() => setAttachOpen((v) => !v)}><Icon name="paperclip" size={19} /></button>
              </div>
              <button className={`bc-send ${draft.trim() ? 'is-send' : ''}`} type={draft.trim() ? 'submit' : 'button'} aria-label={draft.trim() ? 'Send message' : 'Record voice note'}>
                <Icon name={draft.trim() ? 'send' : 'mic'} size={20} />
              </button>
            </form>
          </div>
        </section>

        <aside className={`bc-details ${detailsOpen ? 'is-open' : ''}`} aria-label="Conversation details">
          <button className="bc-details-close" onClick={() => setDetailsOpen(false)} aria-label="Close details">×</button>
          <div className="bc-profile-top">
            <Avatar item={selected} large />
            <h2>{selected.name}</h2>
            {selected.phone && <span>{selected.phone}</span>}
            {selected.online && <small><i /> Online</small>}
          </div>
          <div className="bc-profile-actions">
            <button><Icon name="chats" /><span>Message</span></button>
            <button><Icon name="call" /><span>Audio</span></button>
            <button><Icon name="video" /><span>Video</span></button>
            <button><Icon name="more" /><span>More</span></button>
          </div>
          <div className="bc-detail-list">
            <button><span>▧</span><div><strong>Media, Links & Files</strong><small>328 items</small></div><b>›</b></button>
            <button><span>☆</span><div><strong>Starred Messages</strong><small>12 items</small></div><b>›</b></button>
            <button><span>◷</span><div><strong>Disappearing Messages</strong><small>Off</small></div><b>›</b></button>
            <button><span>◈</span><div><strong>Chat Theme</strong><small>Aurora</small></div><b>›</b></button>
            <button><span>♢</span><div><strong>Notifications</strong><small>Default</small></div><b>›</b></button>
          </div>
        </aside>
      </section>

      <div className="bc-preview-note"><strong>Phase 1 UI preview</strong><span>Phone-number discovery only · No usernames · Existing live messenger remains untouched.</span></div>
    </main>
  );
}

function ConversationRow({ item, selected, onOpen }: { item: Conversation; selected: boolean; onOpen: (id: string) => void }) {
  return (
    <button className={`bc-row ${selected ? 'is-selected' : ''}`} onClick={() => onOpen(item.id)} role="listitem">
      <Avatar item={item} />
      <div className="bc-row-main">
        <div className="bc-row-title"><strong>{item.name}</strong><time>{item.time}</time></div>
        <div className="bc-row-preview"><span className={item.typing ? 'is-typing' : ''}>{item.preview}</span><div>{item.pinned && <b>◆</b>}{item.unread && <em>{item.unread}</em>}</div></div>
      </div>
    </button>
  );
}

function MessageBubble({ message }: { message: Message }) {
  return (
    <div className={`bc-message ${message.mine ? 'is-mine' : 'is-theirs'}`}>
      <div className={`bc-bubble ${message.image ? 'bc-bubble--image' : ''} ${message.voice ? 'bc-bubble--voice' : ''}`}>
        {message.replyTo && <div className="bc-reply-strip">{message.replyTo}</div>}
        {message.text && <p>{message.text}</p>}
        {message.image && <div className="bc-photo-preview"><div className="bc-photo-moon" /><div className="bc-photo-ridge" /><div className="bc-photo-water" /></div>}
        {message.voice && (
          <div className="bc-voice">
            <button aria-label="Play voice note">▶</button>
            <div className="bc-wave" aria-hidden="true">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ height: `${8 + ((i * 11) % 25)}px` }} />)}</div>
            <strong>{message.voice}</strong>
          </div>
        )}
        <div className="bc-meta"><time>{message.time}</time>{message.mine && <span>{message.status === 'read' ? '✓✓' : '✓'}</span>}</div>
      </div>
      {message.reaction && <div className="bc-reaction">{message.reaction}</div>}
    </div>
  );
}
