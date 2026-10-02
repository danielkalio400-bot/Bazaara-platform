'use client';

import { useEffect, useMemo, useRef, useState, type FormEvent, type PointerEvent, type ReactNode } from 'react';

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

const icons: Record<string, ReactNode> = {
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

export function BChatPhase2() {
  const [selectedId, setSelectedId] = useState('emma');
  const [filter, setFilter] = useState<'all' | 'unread' | 'group' | 'channel'>('all');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>(seedMessages);
  const [mobilePane, setMobilePane] = useState<'inbox' | 'chat'>('inbox');
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [attachOpen, setAttachOpen] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [lastSentId, setLastSentId] = useState('');
  const [mediaOpen, setMediaOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [callMode, setCallMode] = useState<'voice' | 'video' | null>(null);
  const [callMuted, setCallMuted] = useState(false);
  const [callCameraOn, setCallCameraOn] = useState(true);
  const [callSpeakerOn, setCallSpeakerOn] = useState(true);
  const [callSeconds, setCallSeconds] = useState(0);

  useEffect(() => {
    if (!callMode) {
      setCallSeconds(0);
      return;
    }
    const timer = window.setInterval(() => setCallSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [callMode]);

  function startCall(mode: 'voice' | 'video') {
    setCallMode(mode);
    setCallMuted(false);
    setCallCameraOn(mode === 'video');
    setCallSpeakerOn(true);
    setDetailsOpen(false);
  }

  function endCall() {
    setCallMode(null);
    setCallMuted(false);
    setCallCameraOn(true);
    setCallSpeakerOn(true);
  }

  const callClock = `${String(Math.floor(callSeconds / 60)).padStart(2, '0')}:${String(callSeconds % 60).padStart(2, '0')}`;

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
    const id = `local-${Date.now()}`;
    setMessages((current) => [
      ...current,
      {
        id,
        conversationId: selected.id,
        mine: true,
        text,
        replyTo: replyingTo?.text?.slice(0, 72),
        time: 'Now',
        status: 'sent',
      },
    ]);
    setLastSentId(id);
    window.setTimeout(() => setLastSentId((current) => current === id ? '' : current), 520);
    setReplyingTo(null);
    setDraft('');
    inputRef.current?.focus();
  }

  function reactToMessage(id: string, reaction: string) {
    setMessages((current) => current.map((message) => message.id === id ? { ...message, reaction } : message));
  }

  return (
    <main className="bc-app" data-mobile-pane={mobilePane}>
      <div className="bc-ambient bc-ambient--one" />
      <div className="bc-ambient bc-ambient--two" />

      <section className="bc-shell" aria-label="BChat messaging interface">
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
              <button className="bc-icon-btn" aria-label="Video call" onClick={() => startCall('video')}><Icon name="video" /></button>
              <button className="bc-icon-btn" aria-label="Voice call" onClick={() => startCall('voice')}><Icon name="call" /></button>
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
              <div className="bc-conversation-motion" key={selected.id}>
                {chatMessages.map((message) => (
                  <MessageBubble
                    key={message.id}
                    message={message}
                    isNew={message.id === lastSentId}
                    onReply={(value) => { setReplyingTo(value); inputRef.current?.focus(); }}
                    onReact={reactToMessage}
                    onOpenMedia={() => setMediaOpen(true)}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="bc-composer-zone">
            {replyingTo && (
              <div className="bc-replying">
                <div><strong>Replying</strong><span>{replyingTo.text || (replyingTo.voice ? 'Voice message' : 'Media')}</span></div>
                <button type="button" onClick={() => setReplyingTo(null)} aria-label="Cancel reply">×</button>
              </div>
            )}
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
            <button onClick={() => startCall('voice')}><Icon name="call" /><span>Audio</span></button>
            <button onClick={() => startCall('video')}><Icon name="video" /><span>Video</span></button>
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

      {callMode && (
        <div className={`bc-call-surface ${callMode === 'video' ? 'is-video' : 'is-voice'}`} role="dialog" aria-modal="true" aria-label={`${callMode === 'video' ? 'Video' : 'Voice'} call with ${selected.name}`}>
          <div className="bc-call-backdrop" aria-hidden="true" />
          <div className="bc-call-topbar">
            <button className="bc-call-minimize" onClick={endCall} aria-label="Close call"><Icon name="back" /></button>
            <div><strong>BChat</strong><span>{callMode === 'video' ? 'Video call' : 'Voice call'}</span></div>
            <button className="bc-call-more" aria-label="More call options"><Icon name="more" /></button>
          </div>

          <div className="bc-call-stage">
            {callMode === 'video' && callCameraOn && <div className="bc-call-video-orb" aria-hidden="true"><span>{selected.initials}</span></div>}
            <Avatar item={selected} large />
            <h2>{selected.name}</h2>
            {selected.phone && <p>{selected.phone}</p>}
            <div className="bc-call-status"><i /> Call UI <span>·</span> {callClock}</div>
            <small className="bc-call-note">Phase 2 call interface. Live WebRTC transport remains isolated in the existing call engine until the integration phase.</small>
          </div>

          <div className="bc-call-controls">
            <button className={callSpeakerOn ? 'is-active' : ''} onClick={() => setCallSpeakerOn((value) => !value)} aria-pressed={callSpeakerOn}><span>◖)))</span><strong>Speaker</strong></button>
            <button className={callCameraOn ? 'is-active' : ''} onClick={() => setCallCameraOn((value) => !value)} aria-pressed={callCameraOn}><Icon name="video" /><strong>Video</strong></button>
            <button className={callMuted ? 'is-muted' : ''} onClick={() => setCallMuted((value) => !value)} aria-pressed={callMuted}><Icon name="mic" /><strong>{callMuted ? 'Unmute' : 'Mute'}</strong></button>
            <button className="bc-call-add"><Icon name="people" /><strong>Add</strong></button>
            <button className="bc-call-end" onClick={endCall} aria-label="End call"><Icon name="call" /><strong>End</strong></button>
          </div>
        </div>
      )}

      {mediaOpen && (
        <div className="bc-media-viewer" role="dialog" aria-modal="true" aria-label="Media viewer" onClick={() => setMediaOpen(false)}>
          <button className="bc-media-close" onClick={() => setMediaOpen(false)} aria-label="Close media">×</button>
          <div className="bc-media-stage" onClick={(event) => event.stopPropagation()}>
            <div className="bc-photo-preview bc-photo-preview--large"><div className="bc-photo-moon" /><div className="bc-photo-ridge" /><div className="bc-photo-water" /></div>
            <div className="bc-media-tools"><button>Share</button><button>Save</button><button>Info</button></div>
          </div>
        </div>
      )}
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

function MessageBubble({
  message,
  isNew,
  onReply,
  onReact,
  onOpenMedia,
}: {
  message: Message;
  isNew: boolean;
  onReply: (message: Message) => void;
  onReact: (id: string, reaction: string) => void;
  onOpenMedia: () => void;
}) {
  const [dragX, setDragX] = useState(0);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const startX = useRef(0);
  const holdTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function clearHold() {
    if (holdTimer.current) {
      clearTimeout(holdTimer.current);
      holdTimer.current = null;
    }
  }

  function pointerDown(event: PointerEvent<HTMLDivElement>) {
    startX.current = event.clientX;
    holdTimer.current = setTimeout(() => {
      setActionsOpen(true);
      if ('vibrate' in navigator) navigator.vibrate?.(12);
    }, 420);
  }

  function pointerMove(event: PointerEvent<HTMLDivElement>) {
    const delta = Math.max(0, Math.min(78, event.clientX - startX.current));
    if (delta > 7) clearHold();
    setDragX(delta);
  }

  function pointerUp() {
    clearHold();
    if (dragX > 48) {
      onReply(message);
      if ('vibrate' in navigator) navigator.vibrate?.(10);
    }
    setDragX(0);
  }

  async function copyMessage() {
    if (message.text && navigator.clipboard) await navigator.clipboard.writeText(message.text);
    setActionsOpen(false);
  }

  function toggleVoice() {
    setVoicePlaying((current) => {
      const next = !current;
      if (next) window.setTimeout(() => setVoicePlaying(false), 3200);
      return next;
    });
  }

  return (
    <div
      className={`bc-message ${message.mine ? 'is-mine' : 'is-theirs'} ${isNew ? 'is-new' : ''}`}
      onPointerDown={pointerDown}
      onPointerMove={pointerMove}
      onPointerUp={pointerUp}
      onPointerCancel={() => { clearHold(); setDragX(0); }}
    >
      <div className="bc-reply-gesture" style={{ opacity: Math.min(1, dragX / 46), transform: `translateX(${Math.min(14, dragX / 5)}px)` }}>↩</div>
      <div className="bc-bubble-wrap" style={{ transform: `translateX(${dragX}px)` }}>
        <div className={`bc-bubble ${message.image ? 'bc-bubble--image' : ''} ${message.voice ? 'bc-bubble--voice' : ''}`}>
          {message.replyTo && <button className="bc-reply-strip" onClick={() => setActionsOpen(false)}>{message.replyTo}</button>}
          {message.text && <p>{message.text}</p>}
          {message.image && (
            <button className="bc-photo-button" onClick={(event) => { event.stopPropagation(); onOpenMedia(); }} aria-label="Open image">
              <div className="bc-photo-preview"><div className="bc-photo-moon" /><div className="bc-photo-ridge" /><div className="bc-photo-water" /></div>
            </button>
          )}
          {message.voice && (
            <div className={`bc-voice ${voicePlaying ? 'is-playing' : ''}`}>
              <button onClick={(event) => { event.stopPropagation(); toggleVoice(); }} aria-label={voicePlaying ? 'Pause voice note' : 'Play voice note'}>{voicePlaying ? 'Ⅱ' : '▶'}</button>
              <div className="bc-wave" aria-hidden="true">{Array.from({ length: 28 }, (_, i) => <i key={i} style={{ height: `${8 + ((i * 11) % 25)}px`, animationDelay: `${i * 24}ms` }} />)}</div>
              <strong>{message.voice}</strong>
            </div>
          )}
          <div className="bc-meta"><time>{message.time}</time>{message.mine && <span>{message.status === 'read' ? '✓✓' : '✓'}</span>}</div>
        </div>
        {message.reaction && <button className="bc-reaction" onClick={() => setActionsOpen(true)}>{message.reaction}</button>}
      </div>

      {actionsOpen && (
        <div className={`bc-message-menu ${message.mine ? 'is-mine' : 'is-theirs'}`} role="menu">
          <div className="bc-reaction-bar">
            {['❤️','👍','😂','😮','😢','🙏'].map((reaction) => (
              <button key={reaction} onClick={() => { onReact(message.id, `${reaction} 1`); setActionsOpen(false); }}>{reaction}</button>
            ))}
          </div>
          <div className="bc-menu-actions">
            <button onClick={() => { onReply(message); setActionsOpen(false); }}>↩ <span>Reply</span></button>
            <button onClick={copyMessage}>▣ <span>Copy</span></button>
            <button onClick={() => setActionsOpen(false)}>➜ <span>Forward</span></button>
            <button onClick={() => setActionsOpen(false)}>☆ <span>Star</span></button>
            <button onClick={() => setActionsOpen(false)}>◆ <span>Pin</span></button>
            {message.mine && <button onClick={() => setActionsOpen(false)}>✎ <span>Edit</span></button>}
          </div>
          <button className="bc-menu-dismiss" onClick={() => setActionsOpen(false)}>Close</button>
        </div>
      )}
    </div>
  );
}
