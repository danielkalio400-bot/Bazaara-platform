'use client';

import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type FormEvent,
  type PointerEvent,
  type ReactNode,
  type RefObject,
  type Dispatch,
  type SetStateAction,
} from 'react';

type Section = 'chats' | 'calls' | 'stories' | 'people' | 'groups' | 'channels' | 'settings';
type ThemeName = 'aurora' | 'violet' | 'ocean' | 'black';
type BubbleStyle = 'smooth' | 'glass' | 'flex' | 'arcade';
type WallpaperName = 'aurora' | 'midnight' | 'ocean' | 'grid';
type StickerTone = 'cyan' | 'violet' | 'rose' | 'lime' | 'gold';
type StickerDefinition = { id: string; glyph: string; label: string; pack: string; tone: StickerTone };

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
  sticker?: StickerDefinition;
};

type CallItem = {
  id: string;
  name: string;
  phone: string;
  initials: string;
  time: string;
  mode: 'voice' | 'video';
  direction: 'incoming' | 'outgoing' | 'missed';
  online?: boolean;
};

type StoryItem = {
  id: string;
  name: string;
  initials: string;
  time: string;
  seen?: boolean;
  mine?: boolean;
  caption: string;
};

type GroupItem = {
  id: string;
  name: string;
  initials: string;
  members: number;
  description: string;
  recent: string;
};

type ChannelItem = {
  id: string;
  name: string;
  initials: string;
  followers: string;
  description: string;
  followed: boolean;
};

const conversations: Conversation[] = [
  { id: 'emma', name: 'Emma Carter', phone: '+234 801 234 5678', initials: 'EC', preview: 'See you tomorrow! ✨', time: '9:41 PM', unread: 2, pinned: true, online: true, kind: 'person' },
  { id: 'family', name: 'Family', phone: '', initials: 'FA', preview: 'Photo', time: '8:24 PM', unread: 3, pinned: true, kind: 'group' },
  { id: 'design', name: 'Design Team', phone: '', initials: 'DT', preview: "Let's finalize the proposal.", time: '6:12 PM', pinned: true, muted: true, kind: 'group' },
  { id: 'michael', name: 'Michael Lee', phone: '+234 803 441 9001', initials: 'ML', preview: 'Typing…', time: '9:40 PM', unread: 2, typing: true, online: true, kind: 'person' },
  { id: 'olivia', name: 'Olivia Bennett', phone: '+234 805 000 4108', initials: 'OB', preview: 'Voice message · 0:24', time: '9:12 PM', unread: 1, kind: 'person' },
  { id: 'launch', name: 'Project Launch', phone: '', initials: 'PL', preview: 'Amazing progress today!', time: '8:05 PM', kind: 'group' },
  { id: 'david', name: 'David Kim', phone: '+234 809 671 2043', initials: 'DK', preview: "Let's catch up this week.", time: '6:50 PM', kind: 'person' },
  { id: 'channel', name: 'Bazaara Product', phone: '', initials: 'BP', preview: 'New release notes published', time: '5:18 PM', kind: 'channel' },
];

const seedMessages: Message[] = [
  { id: 'm1', conversationId: 'emma', mine: false, text: "Hey! How's the new design coming along?", time: '9:20 PM' },
  { id: 'm2', conversationId: 'emma', mine: true, text: "It's looking amazing! ✨ Here's a preview.", time: '9:21 PM', status: 'read' },
  { id: 'm3', conversationId: 'emma', mine: true, image: true, time: '9:21 PM', status: 'read' },
  { id: 'm4', conversationId: 'emma', mine: false, text: 'Wow! This looks incredible! 😍', time: '9:22 PM', reaction: '❤️ 1' },
  { id: 'm5', conversationId: 'emma', mine: true, voice: '0:28', time: '9:24 PM', status: 'read' },
  { id: 'm6', conversationId: 'emma', mine: false, text: "Let's finalize it tomorrow and share with the team.", time: '9:26 PM' },
  { id: 'm7', conversationId: 'emma', mine: true, text: 'Perfect! See you tomorrow! 🚀', time: '9:26 PM', status: 'read' },
  { id: 'm8', conversationId: 'emma', mine: false, time: '9:27 PM', sticker: { id: 'b-win', glyph: '🏆', label: 'Big win', pack: 'Bazaara', tone: 'gold' } },
];

const calls: CallItem[] = [
  { id: 'c1', name: 'Emma Carter', phone: '+234 801 234 5678', initials: 'EC', time: 'Today, 10:42 AM', mode: 'video', direction: 'outgoing', online: true },
  { id: 'c2', name: 'Michael Lee', phone: '+234 803 441 9001', initials: 'ML', time: 'Yesterday, 8:17 PM', mode: 'voice', direction: 'missed', online: true },
  { id: 'c3', name: 'Olivia Bennett', phone: '+234 805 000 4108', initials: 'OB', time: 'Yesterday, 3:05 PM', mode: 'voice', direction: 'incoming' },
  { id: 'c4', name: 'David Kim', phone: '+234 809 671 2043', initials: 'DK', time: 'Monday, 7:32 PM', mode: 'video', direction: 'outgoing' },
];

const stories: StoryItem[] = [
  { id: 's0', name: 'Your story', initials: 'LD', time: 'Add update', mine: true, caption: 'Share a moment with people you choose.' },
  { id: 's1', name: 'Emma Carter', initials: 'EC', time: '12m', caption: 'Night drive. Good music. Better ideas.' },
  { id: 's2', name: 'Michael Lee', initials: 'ML', time: '38m', caption: 'Design review wrapped. Shipping soon.' },
  { id: 's3', name: 'Olivia Bennett', initials: 'OB', time: '1h', caption: 'Quiet afternoon.' },
  { id: 's4', name: 'David Kim', initials: 'DK', time: '2h', caption: 'Weekend loading…', seen: true },
];

const groups: GroupItem[] = [
  { id: 'g1', name: 'Family', initials: 'FA', members: 8, description: 'Private family space', recent: 'Mum: Dinner is ready 🍲' },
  { id: 'g2', name: 'Design Team', initials: 'DT', members: 12, description: 'Product and visual design', recent: 'Emma: Final mockups uploaded' },
  { id: 'g3', name: 'Project Launch', initials: 'PL', members: 18, description: 'Launch coordination', recent: 'David: Build passed QA' },
  { id: 'g4', name: 'Study Circle', initials: 'SC', members: 6, description: 'Focused study sessions', recent: 'Olivia: Notes are in Files' },
];

const channels: ChannelItem[] = [
  { id: 'ch1', name: 'Bazaara Product', initials: 'BP', followers: '2.4M', description: 'Product releases, platform updates and launch notes.', followed: true },
  { id: 'ch2', name: 'Tech Brief', initials: 'TB', followers: '860K', description: 'Concise technology news and product analysis.', followed: true },
  { id: 'ch3', name: 'Design Signal', initials: 'DS', followers: '418K', description: 'Interfaces, systems and visual craft.', followed: false },
  { id: 'ch4', name: 'Creator Desk', initials: 'CD', followers: '301K', description: 'Tools, workflows and creator business.', followed: false },
];


const emojiGroups = [
  { id: 'recent', label: 'Recent', icon: '🕘', items: ['😂','❤️','🔥','✨','👍','😭','😍','🥹','🎉','🙏','💯','🚀'] },
  { id: 'smileys', label: 'Smileys', icon: '😀', items: ['😀','😃','😄','😁','😆','😅','😂','🤣','😊','🙂','🙃','😉','😍','🥰','😘','😎','🤩','🥳','😴','🤯','🥹','😭','😤','😡','🤔','🫡','🫠','👀'] },
  { id: 'gestures', label: 'Gestures', icon: '👋', items: ['👋','🤚','🖐️','✋','👌','🤌','🤏','✌️','🤞','🫰','🤟','🤘','🤙','👈','👉','👆','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','🫶','🙏'] },
  { id: 'hearts', label: 'Hearts', icon: '❤️', items: ['❤️','🩷','🧡','💛','💚','💙','🩵','💜','🤎','🖤','🩶','🤍','💔','❤️‍🔥','💕','💞','💓','💗','💖','💘','💝','💟'] },
  { id: 'fun', label: 'Fun', icon: '🎮', items: ['🎮','🏆','⚡','💥','🔥','✨','🎉','🎊','🚀','👑','💎','🎯','🧠','🛡️','⚔️','🎧','📸','🎬','🪄','🌙','☀️','🌊','🦾','🤖'] },
];

const stickerPacks: { id: string; label: string; icon: string; items: StickerDefinition[] }[] = [
  {
    id: 'bazaara', label: 'Bazaara', icon: 'B', items: [
      { id: 'b-love', glyph: '💜', label: 'B Love', pack: 'Bazaara', tone: 'violet' },
      { id: 'b-fire', glyph: '🔥', label: 'Locked in', pack: 'Bazaara', tone: 'rose' },
      { id: 'b-win', glyph: '🏆', label: 'Big win', pack: 'Bazaara', tone: 'gold' },
      { id: 'b-wave', glyph: '👋', label: 'Yo!', pack: 'Bazaara', tone: 'cyan' },
      { id: 'b-gg', glyph: '🎮', label: 'GG', pack: 'Bazaara', tone: 'lime' },
      { id: 'b-rocket', glyph: '🚀', label: 'Ship it', pack: 'Bazaara', tone: 'cyan' },
    ],
  },
  {
    id: 'mood', label: 'Mood', icon: '😎', items: [
      { id: 'm-hype', glyph: '🤩', label: 'Hyped', pack: 'Mood', tone: 'violet' },
      { id: 'm-laugh', glyph: '😂', label: 'Dead', pack: 'Mood', tone: 'gold' },
      { id: 'm-cry', glyph: '😭', label: 'Pain', pack: 'Mood', tone: 'cyan' },
      { id: 'm-shock', glyph: '🤯', label: 'No way', pack: 'Mood', tone: 'rose' },
      { id: 'm-cool', glyph: '😎', label: 'Cool', pack: 'Mood', tone: 'cyan' },
      { id: 'm-sleep', glyph: '😴', label: 'Later', pack: 'Mood', tone: 'violet' },
    ],
  },
  {
    id: 'game', label: 'Game', icon: '🎮', items: [
      { id: 'g-clutch', glyph: '⚡', label: 'Clutch', pack: 'Game', tone: 'cyan' },
      { id: 'g-crown', glyph: '👑', label: 'MVP', pack: 'Game', tone: 'gold' },
      { id: 'g-target', glyph: '🎯', label: 'Locked', pack: 'Game', tone: 'rose' },
      { id: 'g-shield', glyph: '🛡️', label: 'Safe', pack: 'Game', tone: 'violet' },
      { id: 'g-sword', glyph: '⚔️', label: 'Run it', pack: 'Game', tone: 'lime' },
      { id: 'g-gg', glyph: '🤝', label: 'GG', pack: 'Game', tone: 'cyan' },
    ],
  },
];

const bubbleStyles: { id: BubbleStyle; label: string; note: string }[] = [
  { id: 'smooth', label: 'Smooth', note: 'Clean iMessage rhythm' },
  { id: 'glass', label: 'Glass', note: 'Soft translucent depth' },
  { id: 'flex', label: 'Flex', note: 'Dynamic game-like shape' },
  { id: 'arcade', label: 'Arcade', note: 'Angular neon edge' },
];

const wallpapers: { id: WallpaperName; label: string }[] = [
  { id: 'aurora', label: 'Aurora' },
  { id: 'midnight', label: 'Midnight' },
  { id: 'ocean', label: 'Ocean' },
  { id: 'grid', label: 'Neon Grid' },
];

const icons: Record<string, ReactNode> = {
  chats: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3h11A2.5 2.5 0 0 1 20 5.5v7A2.5 2.5 0 0 1 17.5 15H10l-4.8 3.6V15.1A2.5 2.5 0 0 1 4 13z" /></>,
  call: <><path d="M8.1 4.3 6.6 3.5a2 2 0 0 0-2.7.8L3 6.2c-.9 2 1.2 6.4 4.8 10s8 5.7 10 4.8l1.9-.9a2 2 0 0 0 .8-2.7l-.8-1.5a2 2 0 0 0-2.4-.9l-1.8.7a1.6 1.6 0 0 1-1.7-.4l-5.1-5.1a1.6 1.6 0 0 1-.4-1.7L9 6.7a2 2 0 0 0-.9-2.4Z" /></>,
  story: <><circle cx="12" cy="12" r="8" /><path d="M12 8v4l3 2" /></>,
  people: <><circle cx="9" cy="8" r="3" /><path d="M3.5 18a5.5 5.5 0 0 1 11 0" /><path d="M16 7.5a2.5 2.5 0 1 1 0 5" /><path d="M16 14.5c2.5.2 4.5 1.4 4.5 3.5" /></>,
  groups: <><circle cx="8" cy="9" r="3" /><circle cx="16" cy="9" r="3" /><path d="M2.5 19a5.5 5.5 0 0 1 11 0M10.5 19a5.5 5.5 0 0 1 11 0" /></>,
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
  image: <><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="m5 18 5-5 3 3 2-2 4 4" /></>,
  camera: <><path d="M7 7.5 8.5 5h7L17 7.5h2A2 2 0 0 1 21 9.5v8A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5v-8A2 2 0 0 1 5 7.5z" /><circle cx="12" cy="13" r="3.5" /></>,
  document: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 12h6M9 16h6" /></>,
  contact: <><circle cx="9" cy="9" r="3" /><path d="M3.5 19a5.5 5.5 0 0 1 11 0M17 8v6M14 11h6" /></>,
  location: <><path d="M12 21s6-5.2 6-11a6 6 0 1 0-12 0c0 5.8 6 11 6 11Z" /><circle cx="12" cy="10" r="2" /></>,
  poll: <><path d="M5 19V9M12 19V5M19 19v-7" /></>,
  calendar: <><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M8 3v4M16 3v4M4 10h16" /></>,
  sparkle: <><path d="m12 3 1.4 4.1L17.5 8.5l-4.1 1.4L12 14l-1.4-4.1-4.1-1.4 4.1-1.4zM18.5 14l.8 2.2 2.2.8-2.2.8-.8 2.2-.8-2.2-2.2-.8 2.2-.8z" /></>,
  star: <><path d="m12 3 2.7 5.5 6 .9-4.4 4.3 1 6-5.3-2.8-5.3 2.8 1-6-4.4-4.3 6-.9z" /></>,
  more: <><circle cx="5" cy="12" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /></>,
  shield: <><path d="M12 3 19 6v5c0 5-3.3 8.2-7 10-3.7-1.8-7-5-7-10V6z" /><path d="m9.5 12 1.7 1.7 3.6-4" /></>,
  bell: <><path d="M6 9a6 6 0 0 1 12 0v5l2 2H4l2-2z" /><path d="M10 19h4" /></>,
  devices: <><rect x="3" y="4" width="13" height="10" rx="2" /><path d="M8 18h3M9.5 14v4" /><rect x="16" y="9" width="5" height="10" rx="1.5" /></>,
  palette: <><path d="M12 3a9 9 0 1 0 0 18h1.5a2 2 0 0 0 0-4H12a2 2 0 0 1 0-4h4a5 5 0 0 0 0-10z" /><circle cx="7.5" cy="9" r="1" /><circle cx="10.5" cy="6.5" r="1" /><circle cx="14" cy="6.5" r="1" /></>,
};

function Icon({ name, size = 20 }: { name: keyof typeof icons; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {icons[name]}
    </svg>
  );
}

function avatarClass(id: string) {
  return `bc-avatar--${id.slice(0, 3)}`;
}

function Avatar({ item, large = false }: { item: Pick<Conversation, 'id' | 'initials' | 'online'>; large?: boolean }) {
  return (
    <div className={`bc-avatar ${large ? 'bc-avatar--large' : ''} ${avatarClass(item.id)}`} aria-hidden="true">
      <span>{item.initials}</span>
      {item.online && <i className="bc-presence" />}
    </div>
  );
}

function GenericAvatar({ id, initials, online = false, large = false }: { id: string; initials: string; online?: boolean; large?: boolean }) {
  return <Avatar item={{ id, initials, online }} large={large} />;
}

export function BChatPhase3() {
  const [section, setSection] = useState<Section>('chats');
  const [theme, setTheme] = useState<ThemeName>('aurora');
  const [selectedId, setSelectedId] = useState('emma');
  const [filter, setFilter] = useState<'all' | 'unread' | 'group' | 'channel'>('all');
  const [query, setQuery] = useState('');
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState<Message[]>(seedMessages);
  const [mobilePane, setMobilePane] = useState<'inbox' | 'chat'>('inbox');
  const [detailsOpen, setDetailsOpen] = useState(true);
  const [attachOpen, setAttachOpen] = useState(false);
  const [novaOpen, setNovaOpen] = useState(false);
  const [novaPrompt, setNovaPrompt] = useState('');
  const [novaStyle, setNovaStyle] = useState('Cinematic');
  const [novaNotice, setNovaNotice] = useState('');
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [lastSentId, setLastSentId] = useState('');
  const [mediaOpen, setMediaOpen] = useState(false);
  const [storyOpen, setStoryOpen] = useState<StoryItem | null>(null);
  const [groupComposerOpen, setGroupComposerOpen] = useState(false);
  const [peopleQuery, setPeopleQuery] = useState('');
  const [channelState, setChannelState] = useState(channels);
  const [privacyReadReceipts, setPrivacyReadReceipts] = useState(true);
  const [privacyLastSeen, setPrivacyLastSeen] = useState(false);
  const [notificationPreview, setNotificationPreview] = useState(true);
  const [linkedDevicePanel, setLinkedDevicePanel] = useState(false);
  const [bubbleStyle, setBubbleStyle] = useState<BubbleStyle>('flex');
  const [wallpaper, setWallpaper] = useState<WallpaperName>('aurora');
  const [motionEnabled, setMotionEnabled] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [soundEffects, setSoundEffects] = useState(true);
  const [preferencesReady, setPreferencesReady] = useState(false);
  const [emojiPanel, setEmojiPanel] = useState<'emoji' | 'stickers' | null>(null);
  const [emojiGroup, setEmojiGroup] = useState('recent');
  const [stickerPack, setStickerPack] = useState('bazaara');
  const inputRef = useRef<HTMLInputElement>(null);

  const [callMode, setCallMode] = useState<'voice' | 'video' | null>(null);
  const [callContact, setCallContact] = useState<{ id: string; name: string; phone: string; initials: string; online?: boolean } | null>(null);
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

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('bchat-ui-preferences-v2');
      if (saved) {
        const value = JSON.parse(saved) as Partial<{ theme: ThemeName; bubbleStyle: BubbleStyle; wallpaper: WallpaperName; motionEnabled: boolean; compactMode: boolean; soundEffects: boolean }>;
        if (value.theme) setTheme(value.theme);
        if (value.bubbleStyle) setBubbleStyle(value.bubbleStyle);
        if (value.wallpaper) setWallpaper(value.wallpaper);
        if (typeof value.motionEnabled === 'boolean') setMotionEnabled(value.motionEnabled);
        if (typeof value.compactMode === 'boolean') setCompactMode(value.compactMode);
        if (typeof value.soundEffects === 'boolean') setSoundEffects(value.soundEffects);
      }
    } catch {
      // Corrupt local UI preferences should never block chat rendering.
    } finally {
      setPreferencesReady(true);
    }
  }, []);

  useEffect(() => {
    if (!preferencesReady) return;
    try {
      window.localStorage.setItem('bchat-ui-preferences-v2', JSON.stringify({ theme, bubbleStyle, wallpaper, motionEnabled, compactMode, soundEffects }));
    } catch {
      // Private browsing can disallow storage; keep preferences in memory.
    }
  }, [preferencesReady, theme, bubbleStyle, wallpaper, motionEnabled, compactMode, soundEffects]);

  const selected = conversations.find((conversation) => conversation.id === selectedId) ?? conversations[0];
  const activeCallContact = callContact ?? selected;
  const callClock = `${String(Math.floor(callSeconds / 60)).padStart(2, '0')}:${String(callSeconds % 60).padStart(2, '0')}`;

  function changeSection(next: Section) {
    setSection(next);
    setMobilePane('inbox');
    setDetailsOpen(false);
  }

  function startCall(mode: 'voice' | 'video', contact?: { id: string; name: string; phone: string; initials: string; online?: boolean }) {
    setCallContact(contact ?? selected);
    setCallMode(mode);
    setCallMuted(false);
    setCallCameraOn(mode === 'video');
    setCallSpeakerOn(true);
    setDetailsOpen(false);
  }

  function endCall() {
    setCallMode(null);
    setCallContact(null);
    setCallMuted(false);
    setCallCameraOn(true);
    setCallSpeakerOn(true);
  }

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

  const pinned = visible.filter((conversation) => conversation.pinned);
  const regular = visible.filter((conversation) => !conversation.pinned);
  const chatMessages = messages.filter((message) => message.conversationId === selected.id);

  function openConversation(id: string) {
    setSelectedId(id);
    setSection('chats');
    setMobilePane('chat');
    setAttachOpen(false);
    setNovaOpen(false);
    setEmojiPanel(null);
  }

  function submitMessage(event: FormEvent) {
    event.preventDefault();
    const text = draft.trim();
    if (!text) return;
    const id = `local-${Date.now()}`;
    setMessages((current) => [
      ...current,
      { id, conversationId: selected.id, mine: true, text, replyTo: replyingTo?.text?.slice(0, 72), time: 'Now', status: 'sent' },
    ]);
    setLastSentId(id);
    window.setTimeout(() => setLastSentId((current) => current === id ? '' : current), 520);
    setReplyingTo(null);
    setDraft('');
    setEmojiPanel(null);
    inputRef.current?.focus();
  }

  function reactToMessage(id: string, reaction: string) {
    setMessages((current) => current.map((message) => message.id === id ? { ...message, reaction } : message));
  }

  function insertEmoji(emoji: string) {
    setDraft((current) => `${current}${emoji}`);
    window.requestAnimationFrame(() => inputRef.current?.focus());
  }

  function sendSticker(sticker: StickerDefinition) {
    const id = `sticker-${Date.now()}`;
    setMessages((current) => [
      ...current,
      { id, conversationId: selected.id, mine: true, sticker, time: 'Now', status: 'sent' },
    ]);
    setLastSentId(id);
    window.setTimeout(() => setLastSentId((current) => current === id ? '' : current), 520);
    setEmojiPanel(null);
    setReplyingTo(null);
  }

  const contacts = conversations.filter((conversation) => conversation.kind === 'person');
  const normalizedPeopleQuery = peopleQuery.trim().toLowerCase();
  const peopleLooksLikePhone = /^[+\d\s()-]{5,}$/.test(peopleQuery.trim());
  const visibleContacts = contacts.filter((contact) => {
    if (!normalizedPeopleQuery) return true;
    return contact.name.toLowerCase().includes(normalizedPeopleQuery) || contact.phone.replace(/\s/g, '').includes(normalizedPeopleQuery.replace(/\s/g, ''));
  });

  return (
    <main className="bc-app bc3-app" data-theme={theme} data-mobile-pane={mobilePane} data-bubble-style={bubbleStyle} data-wallpaper={wallpaper} data-motion={motionEnabled ? 'on' : 'off'} data-density={compactMode ? 'compact' : 'comfort'}>
      <div className="bc-ambient bc-ambient--one" />
      <div className="bc-ambient bc-ambient--two" />

      <section className="bc-shell bc3-shell" aria-label="BChat Phase 3 interface">
        <aside className="bc-rail bc3-rail" aria-label="BChat navigation">
          <div className="bc-brand" aria-label="BChat">
            <div className="bc-brandmark">B</div>
            <strong>BChat</strong>
          </div>

          <nav className="bc-railnav">
            <RailButton section="chats" current={section} onClick={changeSection} icon="chats" label="Chats" badge="12" />
            <RailButton section="calls" current={section} onClick={changeSection} icon="call" label="Calls" />
            <RailButton section="stories" current={section} onClick={changeSection} icon="story" label="Stories" />
            <RailButton section="people" current={section} onClick={changeSection} icon="people" label="People" />
            <RailButton section="groups" current={section} onClick={changeSection} icon="groups" label="Groups" />
            <RailButton section="channels" current={section} onClick={changeSection} icon="channel" label="Channels" />
          </nav>

          <div className="bc-railnav bc-railnav--secondary">
            <button onClick={() => changeSection('settings')} className={section === 'settings' ? 'is-active' : ''}><Icon name="settings" /><span>Settings</span></button>
          </div>

          <div className="bc-account">
            <div className="bc-account-avatar">LD</div>
            <div><strong>BazID</strong><span>Connected</span></div>
          </div>
        </aside>

        <div className="bc3-workspace">
          {section === 'chats' && (
            <ChatWorkspace
              selected={selected}
              selectedId={selectedId}
              visible={visible}
              pinned={pinned}
              regular={regular}
              filter={filter}
              setFilter={setFilter}
              query={query}
              setQuery={setQuery}
              looksLikePhone={looksLikePhone}
              mobilePane={mobilePane}
              setMobilePane={setMobilePane}
              detailsOpen={detailsOpen}
              setDetailsOpen={setDetailsOpen}
              openConversation={openConversation}
              messages={chatMessages}
              lastSentId={lastSentId}
              draft={draft}
              setDraft={setDraft}
              inputRef={inputRef}
              submitMessage={submitMessage}
              attachOpen={attachOpen}
              setAttachOpen={setAttachOpen}
              novaOpen={novaOpen}
              setNovaOpen={setNovaOpen}
              novaPrompt={novaPrompt}
              setNovaPrompt={setNovaPrompt}
              novaStyle={novaStyle}
              setNovaStyle={setNovaStyle}
              novaNotice={novaNotice}
              setNovaNotice={setNovaNotice}
              emojiPanel={emojiPanel}
              setEmojiPanel={setEmojiPanel}
              emojiGroup={emojiGroup}
              setEmojiGroup={setEmojiGroup}
              stickerPack={stickerPack}
              setStickerPack={setStickerPack}
              insertEmoji={insertEmoji}
              sendSticker={sendSticker}
              replyingTo={replyingTo}
              setReplyingTo={setReplyingTo}
              reactToMessage={reactToMessage}
              openMedia={() => setMediaOpen(true)}
              startCall={(mode) => startCall(mode, selected)}
              onTheme={() => changeSection('settings')}
              onMobileNav={changeSection}
            />
          )}

          {section === 'calls' && <CallsSection onStartCall={startCall} onMobileNav={changeSection} />}
          {section === 'stories' && <StoriesSection onOpenStory={setStoryOpen} onMobileNav={changeSection} />}
          {section === 'people' && (
            <PeopleSection
              query={peopleQuery}
              setQuery={setPeopleQuery}
              looksLikePhone={peopleLooksLikePhone}
              contacts={visibleContacts}
              onOpenChat={openConversation}
              onStartCall={startCall}
              onMobileNav={changeSection}
            />
          )}
          {section === 'groups' && <GroupsSection onOpenChat={openConversation} onCreate={() => setGroupComposerOpen(true)} onMobileNav={changeSection} />}
          {section === 'channels' && <ChannelsSection items={channelState} setItems={setChannelState} onOpenChat={openConversation} onMobileNav={changeSection} />}
          {section === 'settings' && (
            <SettingsSection
              theme={theme}
              setTheme={setTheme}
              readReceipts={privacyReadReceipts}
              setReadReceipts={setPrivacyReadReceipts}
              lastSeen={privacyLastSeen}
              setLastSeen={setPrivacyLastSeen}
              notificationPreview={notificationPreview}
              setNotificationPreview={setNotificationPreview}
              bubbleStyle={bubbleStyle}
              setBubbleStyle={setBubbleStyle}
              wallpaper={wallpaper}
              setWallpaper={setWallpaper}
              motionEnabled={motionEnabled}
              setMotionEnabled={setMotionEnabled}
              compactMode={compactMode}
              setCompactMode={setCompactMode}
              soundEffects={soundEffects}
              setSoundEffects={setSoundEffects}
              openLinkedDevices={() => setLinkedDevicePanel(true)}
              onMobileNav={changeSection}
            />
          )}
        </div>
      </section>

      {callMode && (
        <CallSurface
          mode={callMode}
          contact={activeCallContact}
          clock={callClock}
          muted={callMuted}
          cameraOn={callCameraOn}
          speakerOn={callSpeakerOn}
          setMuted={setCallMuted}
          setCameraOn={setCallCameraOn}
          setSpeakerOn={setCallSpeakerOn}
          onEnd={endCall}
        />
      )}

      {mediaOpen && <MediaViewer onClose={() => setMediaOpen(false)} />}
      {storyOpen && <StoryViewer story={storyOpen} onClose={() => setStoryOpen(null)} />}
      {groupComposerOpen && <CreateGroupModal onClose={() => setGroupComposerOpen(false)} />}
      {linkedDevicePanel && <LinkedDevicesModal onClose={() => setLinkedDevicePanel(false)} />}
    </main>
  );
}

function RailButton({ section, current, onClick, icon, label, badge }: { section: Section; current: Section; onClick: (section: Section) => void; icon: keyof typeof icons; label: string; badge?: string }) {
  return <button className={current === section ? 'is-active' : ''} onClick={() => onClick(section)}><Icon name={icon} /><span>{label}</span>{badge && <b>{badge}</b>}</button>;
}

function MobileNav({ current, onChange }: { current: Section; onChange: (section: Section) => void }) {
  return (
    <nav className="bc-bottom-nav bc3-bottom-nav" aria-label="Mobile BChat navigation">
      <button className={current === 'chats' ? 'is-active' : ''} onClick={() => onChange('chats')}><Icon name="chats" /><span>Chats</span></button>
      <button className={current === 'calls' ? 'is-active' : ''} onClick={() => onChange('calls')}><Icon name="call" /><span>Calls</span></button>
      <button className={current === 'stories' ? 'is-active' : ''} onClick={() => onChange('stories')}><Icon name="story" /><span>Stories</span></button>
      <button className={current === 'people' ? 'is-active' : ''} onClick={() => onChange('people')}><Icon name="people" /><span>People</span></button>
      <button className={['groups','channels','settings'].includes(current) ? 'is-active' : ''} onClick={() => onChange(current === 'settings' ? 'chats' : 'settings')}><Icon name="more" /><span>More</span></button>
    </nav>
  );
}

function ChatWorkspace(props: {
  selected: Conversation;
  selectedId: string;
  visible: Conversation[];
  pinned: Conversation[];
  regular: Conversation[];
  filter: 'all' | 'unread' | 'group' | 'channel';
  setFilter: (filter: 'all' | 'unread' | 'group' | 'channel') => void;
  query: string;
  setQuery: (value: string) => void;
  looksLikePhone: boolean;
  mobilePane: 'inbox' | 'chat';
  setMobilePane: (pane: 'inbox' | 'chat') => void;
  detailsOpen: boolean;
  setDetailsOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  openConversation: (id: string) => void;
  messages: Message[];
  lastSentId: string;
  draft: string;
  setDraft: (value: string) => void;
  inputRef: RefObject<HTMLInputElement | null>;
  submitMessage: (event: FormEvent) => void;
  attachOpen: boolean;
  setAttachOpen: (value: boolean | ((current: boolean) => boolean)) => void;
  novaOpen: boolean;
  setNovaOpen: Dispatch<SetStateAction<boolean>>;
  novaPrompt: string;
  setNovaPrompt: Dispatch<SetStateAction<string>>;
  novaStyle: string;
  setNovaStyle: Dispatch<SetStateAction<string>>;
  novaNotice: string;
  setNovaNotice: Dispatch<SetStateAction<string>>;
  emojiPanel: 'emoji' | 'stickers' | null;
  setEmojiPanel: (value: 'emoji' | 'stickers' | null | ((current: 'emoji' | 'stickers' | null) => 'emoji' | 'stickers' | null)) => void;
  emojiGroup: string;
  setEmojiGroup: (value: string) => void;
  stickerPack: string;
  setStickerPack: (value: string) => void;
  insertEmoji: (emoji: string) => void;
  sendSticker: (sticker: StickerDefinition) => void;
  replyingTo: Message | null;
  setReplyingTo: (message: Message | null) => void;
  reactToMessage: (id: string, reaction: string) => void;
  openMedia: () => void;
  startCall: (mode: 'voice' | 'video') => void;
  onTheme: () => void;
  onMobileNav: (section: Section) => void;
}) {
  const {
    selected, selectedId, visible, pinned, regular, filter, setFilter, query, setQuery, looksLikePhone,
    setMobilePane, detailsOpen, setDetailsOpen, openConversation, messages, lastSentId, draft, setDraft,
    inputRef, submitMessage, attachOpen, setAttachOpen, novaOpen, setNovaOpen, novaPrompt, setNovaPrompt,
    novaStyle, setNovaStyle, novaNotice, setNovaNotice, emojiPanel, setEmojiPanel, emojiGroup, setEmojiGroup,
    stickerPack, setStickerPack, insertEmoji, sendSticker, replyingTo, setReplyingTo, reactToMessage, openMedia,
    startCall, onTheme, onMobileNav,
  } = props;

  return (
    <div className="bc3-chat-layout">
      <section className="bc-inbox" aria-label="Chats">
        <header className="bc-inbox-head">
          <div className="bc-mobile-brand"><div className="bc-brandmark">B</div><strong>BChat</strong></div>
          <div className="bc-title-row"><h1>Chats</h1><button className="bc-icon-btn" aria-label="New chat"><Icon name="plus" /></button></div>
          <label className="bc-search"><Icon name="search" size={18} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search chats or enter a phone number" aria-label="Search chats or enter a phone number" /></label>
          <div className="bc-filters" role="tablist" aria-label="Chat filters">
            {([['all','All'],['unread','Unread'],['group','Groups'],['channel','Channels']] as const).map(([value, label]) => (
              <button key={value} className={filter === value ? 'is-active' : ''} onClick={() => setFilter(value)} role="tab" aria-selected={filter === value}>{label}{value === 'unread' && <span>12</span>}</button>
            ))}
          </div>
        </header>

        <div className="bc-list" role="list">
          {looksLikePhone && query.trim() && visible.length === 0 && (
            <button className="bc-phone-discovery" onClick={() => setQuery('')}><div className="bc-phone-icon">+</div><div><strong>Start a new chat</strong><span>{query.trim()}</span></div><em>Phone number only</em></button>
          )}
          {pinned.length > 0 && <div className="bc-section-label"><span>Pinned</span><small>•••</small></div>}
          {pinned.map((item) => <ConversationRow key={item.id} item={item} selected={selectedId === item.id} onOpen={openConversation} />)}
          {regular.length > 0 && <div className="bc-section-label"><span>All chats</span><small>•••</small></div>}
          {regular.map((item) => <ConversationRow key={item.id} item={item} selected={selectedId === item.id} onOpen={openConversation} />)}
          {visible.length === 0 && !looksLikePhone && <div className="bc-empty"><Icon name="search" size={28} /><strong>No chats found</strong><span>Try a contact name, chat text, or phone number.</span></div>}
        </div>
        <MobileNav current="chats" onChange={onMobileNav} />
      </section>

      <section className="bc-chat" aria-label={`Conversation with ${selected.name}`}>
        <header className="bc-chat-head">
          <button className="bc-icon-btn bc-mobile-back" onClick={() => setMobilePane('inbox')} aria-label="Back to chats"><Icon name="back" /></button>
          <button className="bc-person-button" onClick={() => setDetailsOpen(true)}><Avatar item={selected} /><div><strong>{selected.name}</strong><span>{selected.online ? 'Online' : selected.kind === 'person' ? selected.phone : selected.kind === 'group' ? 'Group conversation' : 'Channel'}</span></div></button>
          <div className="bc-chat-actions">
            <button className="bc-icon-btn" aria-label="Video call" onClick={() => startCall('video')}><Icon name="video" /></button>
            <button className="bc-icon-btn" aria-label="Voice call" onClick={() => startCall('voice')}><Icon name="call" /></button>
            <button className="bc-icon-btn" aria-label="Search in conversation"><Icon name="search" /></button>
            <button className="bc-icon-btn" onClick={() => setDetailsOpen((current) => !current)} aria-label="Conversation details"><Icon name="info" /></button>
          </div>
        </header>

        <div className="bc-message-canvas">
          <div className="bc-date-pill">Today</div>
          <div className="bc-message-stack">
            {messages.length === 0 && <div className="bc-empty-chat"><Avatar item={selected} large /><strong>{selected.name}</strong>{selected.phone && <span>{selected.phone}</span>}<small>Phase 3 keeps the live message engine isolated until the integration phase.</small></div>}
            <div className="bc-conversation-motion" key={selected.id}>
              {messages.map((message) => <MessageBubble key={message.id} message={message} isNew={message.id === lastSentId} onReply={(value) => { setReplyingTo(value); inputRef.current?.focus(); }} onReact={reactToMessage} onOpenMedia={openMedia} />)}
            </div>
          </div>
        </div>

        <div className="bc-composer-zone">
          {replyingTo && <div className="bc-replying"><div><strong>Replying</strong><span>{replyingTo.text || (replyingTo.voice ? 'Voice message' : replyingTo.sticker ? `Sticker · ${replyingTo.sticker.label}` : 'Media')}</span></div><button type="button" onClick={() => setReplyingTo(null)} aria-label="Cancel reply">×</button></div>}
          {attachOpen && <AttachmentSheet onClose={() => setAttachOpen(false)} onNova={() => { setAttachOpen(false); setEmojiPanel(null); setNovaOpen(true); setNovaNotice(''); }} />}
          {novaOpen && <NovaImagePanel prompt={novaPrompt} setPrompt={setNovaPrompt} style={novaStyle} setStyle={setNovaStyle} notice={novaNotice} setNotice={setNovaNotice} onClose={() => setNovaOpen(false)} />}
          {emojiPanel && <EmojiStickerPanel mode={emojiPanel} setMode={setEmojiPanel} emojiGroup={emojiGroup} setEmojiGroup={setEmojiGroup} stickerPack={stickerPack} setStickerPack={setStickerPack} onEmoji={insertEmoji} onSticker={sendSticker} onClose={() => setEmojiPanel(null)} />}
          <form className="bc-composer" onSubmit={submitMessage}>
            <div className="bc-input-wrap"><input ref={inputRef} value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Message" aria-label="Message" /><button type="button" className={emojiPanel ? 'is-active' : ''} aria-label="Emoji and stickers" onClick={() => { setAttachOpen(false); setNovaOpen(false); setEmojiPanel((current) => current ? null : 'emoji'); }}><Icon name="smile" size={19} /></button><button type="button" className={attachOpen ? 'is-active' : ''} aria-label="Attachments" onClick={() => { setEmojiPanel(null); setNovaOpen(false); setAttachOpen((current) => !current); }}><Icon name="paperclip" size={19} /></button></div>
            <button className={`bc-send ${draft.trim() ? 'is-send' : ''}`} type={draft.trim() ? 'submit' : 'button'} aria-label={draft.trim() ? 'Send message' : 'Record voice note'}><Icon name={draft.trim() ? 'send' : 'mic'} size={20} /></button>
          </form>
        </div>
      </section>

      <aside className={`bc-details ${detailsOpen ? 'is-open' : ''}`} aria-label="Conversation details">
        <button className="bc-details-close" onClick={() => setDetailsOpen(false)} aria-label="Close details">×</button>
        <div className="bc-profile-top"><Avatar item={selected} large /><h2>{selected.name}</h2>{selected.phone && <span>{selected.phone}</span>}{selected.online && <small><i /> Online</small>}</div>
        <div className="bc-profile-actions"><button><Icon name="chats" /><span>Message</span></button><button onClick={() => startCall('voice')}><Icon name="call" /><span>Audio</span></button><button onClick={() => startCall('video')}><Icon name="video" /><span>Video</span></button><button><Icon name="more" /><span>More</span></button></div>
        <div className="bc3-detail-media-strip" aria-label="Recent shared media"><button className="is-sunset" aria-label="Recent image 1" /><button className="is-city" aria-label="Recent image 2" /><button className="is-neon" aria-label="Recent image 3" /><button className="is-grid" aria-label="Recent image 4"><span>+324</span></button></div>
        <div className="bc-detail-list">
          <button><span>▧</span><div><strong>Media, Links & Files</strong><small>328 items</small></div><b>›</b></button>
          <button><span>☆</span><div><strong>Starred Messages</strong><small>12 items</small></div><b>›</b></button>
          <button><span>◷</span><div><strong>Disappearing Messages</strong><small>Off</small></div><b>›</b></button>
          <button onClick={onTheme}><span>◈</span><div><strong>Chat Theme</strong><small>Customize</small></div><b>›</b></button>
          <button><span>♢</span><div><strong>Notifications</strong><small>Default</small></div><b>›</b></button>
          <button className="bc3-danger-row"><span>⊘</span><div><strong>Block contact</strong><small>Safety control</small></div><b>›</b></button>
        </div>
      </aside>
    </div>
  );
}



function AttachmentSheet({ onClose, onNova }: { onClose: () => void; onNova: () => void }) {
  const items: { label: string; note: string; icon: keyof typeof icons; tone: string }[] = [
    { label: 'Photos', note: 'Gallery', icon: 'image', tone: 'blue' },
    { label: 'Camera', note: 'Capture now', icon: 'camera', tone: 'violet' },
    { label: 'Video', note: 'Clips & movies', icon: 'video', tone: 'rose' },
    { label: 'Documents', note: 'PDF, DOCX, ZIP', icon: 'document', tone: 'cyan' },
    { label: 'Contact', note: 'Share a person', icon: 'contact', tone: 'indigo' },
    { label: 'Location', note: 'Share a place', icon: 'location', tone: 'emerald' },
    { label: 'Poll', note: 'Ask the chat', icon: 'poll', tone: 'amber' },
    { label: 'Event', note: 'Plan together', icon: 'calendar', tone: 'magenta' },
  ];
  return (
    <div className="bc3-attach-panel" role="dialog" aria-label="Share or create">
      <div className="bc3-attach-head"><div><strong>Share or create</strong><span>Send something without leaving the conversation.</span></div><button type="button" onClick={onClose} aria-label="Close attachments">×</button></div>
      <button type="button" className="bc3-nova-card" onClick={onNova}>
        <span className="bc3-nova-orb"><Icon name="sparkle" size={23} /></span>
        <div><b>AI Images by Nova</b><small>Describe it. Style it. Send it.</small></div>
        <em>Nova</em><i>›</i>
      </button>
      <div className="bc3-attach-grid">
        {items.map((item) => <button type="button" key={item.label} className={`bc3-attach-item tone-${item.tone}`}><span><Icon name={item.icon} size={21} /></span><div><strong>{item.label}</strong><small>{item.note}</small></div></button>)}
      </div>
    </div>
  );
}

function NovaImagePanel(props: { prompt: string; setPrompt: (value: string) => void; style: string; setStyle: (value: string) => void; notice: string; setNotice: (value: string) => void; onClose: () => void }) {
  const { prompt, setPrompt, style, setStyle, notice, setNotice, onClose } = props;
  const styles = ['Cinematic','Illustration','3D','Anime','Photoreal'];
  return (
    <div className="bc3-nova-panel" role="dialog" aria-label="AI Images by Nova">
      <div className="bc3-nova-head"><div className="bc3-nova-brand"><span><Icon name="sparkle" size={20} /></span><div><strong>Nova Images</strong><small>AI creation inside BChat</small></div></div><button type="button" onClick={onClose} aria-label="Close Nova">×</button></div>
      <div className="bc3-nova-preview-row" aria-hidden="true"><i className="nova-preview nova-a"/><i className="nova-preview nova-b"/><i className="nova-preview nova-c"/></div>
      <label className="bc3-nova-prompt"><span>Describe your image</span><textarea value={prompt} onChange={(event) => { setPrompt(event.target.value); setNotice(''); }} placeholder="A futuristic Bazaara city at night, neon rain, cinematic lighting…" rows={3}/></label>
      <div className="bc3-nova-style-row">{styles.map((name) => <button type="button" key={name} className={style === name ? 'is-active' : ''} onClick={() => setStyle(name)}>{name}</button>)}</div>
      <div className="bc3-nova-actions"><div><strong>{style}</strong><span>1:1 · High quality</span></div><button type="button" onClick={() => setNotice(prompt.trim() ? 'Nova generation will connect to the live image engine in Phase 4.' : 'Describe the image first.')}>Generate <Icon name="sparkle" size={16}/></button></div>
      {notice && <div className="bc3-nova-notice">{notice}</div>}
    </div>
  );
}

function EmojiStickerPanel(props: {
  mode: 'emoji' | 'stickers';
  setMode: (value: 'emoji' | 'stickers' | null | ((current: 'emoji' | 'stickers' | null) => 'emoji' | 'stickers' | null)) => void;
  emojiGroup: string;
  setEmojiGroup: (value: string) => void;
  stickerPack: string;
  setStickerPack: (value: string) => void;
  onEmoji: (emoji: string) => void;
  onSticker: (sticker: StickerDefinition) => void;
  onClose: () => void;
}) {
  const { mode, setMode, emojiGroup, setEmojiGroup, stickerPack, setStickerPack, onEmoji, onSticker, onClose } = props;
  const activeEmojiGroup = emojiGroups.find((group) => group.id === emojiGroup) ?? emojiGroups[0];
  const activeStickerPack = stickerPacks.find((pack) => pack.id === stickerPack) ?? stickerPacks[0];
  return (
    <div className="bc3-expression-panel" role="dialog" aria-label="Emoji and sticker picker">
      <div className="bc3-expression-head">
        <div className="bc3-expression-tabs">
          <button type="button" className={mode === 'emoji' ? 'is-active' : ''} onClick={() => setMode('emoji')}>Emoji</button>
          <button type="button" className={mode === 'stickers' ? 'is-active' : ''} onClick={() => setMode('stickers')}>Stickers</button>
        </div>
        <button type="button" className="bc3-expression-close" onClick={onClose} aria-label="Close picker">×</button>
      </div>

      {mode === 'emoji' ? (
        <>
          <div className="bc3-expression-categories" aria-label="Emoji categories">
            {emojiGroups.map((group) => <button type="button" key={group.id} className={emojiGroup === group.id ? 'is-active' : ''} onClick={() => setEmojiGroup(group.id)} title={group.label}><span>{group.icon}</span></button>)}
          </div>
          <div className="bc3-expression-title"><strong>{activeEmojiGroup.label}</strong><span>Tap to insert</span></div>
          <div className="bc3-emoji-grid">
            {activeEmojiGroup.items.map((emoji, index) => <button type="button" key={`${emoji}-${index}`} onClick={() => onEmoji(emoji)}>{emoji}</button>)}
          </div>
        </>
      ) : (
        <>
          <div className="bc3-sticker-packs" aria-label="Sticker packs">
            {stickerPacks.map((pack) => <button type="button" key={pack.id} className={stickerPack === pack.id ? 'is-active' : ''} onClick={() => setStickerPack(pack.id)}><span>{pack.icon}</span><strong>{pack.label}</strong></button>)}
          </div>
          <div className="bc3-expression-title"><strong>{activeStickerPack.label}</strong><span>Original BChat stickers</span></div>
          <div className="bc3-sticker-grid">
            {activeStickerPack.items.map((sticker) => <button type="button" key={sticker.id} className={`bc3-sticker-card is-${sticker.tone}`} onClick={() => onSticker(sticker)}><i>{sticker.glyph}</i><b>B</b><strong>{sticker.label}</strong><span>{sticker.pack}</span></button>)}
          </div>
        </>
      )}
    </div>
  );
}

function CallsSection({ onStartCall, onMobileNav }: { onStartCall: (mode: 'voice' | 'video', contact: { id: string; name: string; phone: string; initials: string; online?: boolean }) => void; onMobileNav: (section: Section) => void }) {
  return (
    <section className="bc3-section bc3-section--calls">
      <SectionHeader title="Calls" eyebrow="Voice & video" action="New call" />
      <div className="bc3-section-grid bc3-call-grid">
        <div className="bc3-card bc3-call-list-card">
          <div className="bc3-card-head"><div><strong>Recent</strong><span>Your latest BChat calls</span></div><button className="bc-icon-btn"><Icon name="search" /></button></div>
          <div className="bc3-list-stack">
            {calls.map((call) => (
              <div className="bc3-call-row" key={call.id}>
                <GenericAvatar id={call.id} initials={call.initials} online={call.online} />
                <div><strong>{call.name}</strong><span className={call.direction === 'missed' ? 'is-missed' : ''}>{call.direction === 'missed' ? '↙ Missed' : call.direction === 'incoming' ? '↙ Incoming' : '↗ Outgoing'} · {call.time}</span></div>
                <button onClick={() => onStartCall(call.mode, call)} aria-label={`${call.mode} call ${call.name}`}><Icon name={call.mode === 'video' ? 'video' : 'call'} /></button>
              </div>
            ))}
          </div>
        </div>
        <div className="bc3-card bc3-call-hero">
          <div className="bc3-orb"><Icon name="call" size={42} /></div>
          <span className="bc3-kicker">BChat Calls</span>
          <h2>Private conversation, one tap away.</h2>
          <p>Start a voice or video call from a contact or any active conversation. Group-call transport will connect in the integration phase.</p>
          <div className="bc3-hero-actions"><button className="bc3-primary" onClick={() => onStartCall('voice', calls[0])}><Icon name="call" /> Voice call</button><button onClick={() => onStartCall('video', calls[0])}><Icon name="video" /> Video call</button></div>
          <div className="bc3-mini-stats"><div><strong>4</strong><span>recent calls</span></div><div><strong>HD</strong><span>adaptive media</span></div><div><strong>WebRTC</strong><span>engine retained</span></div></div>
        </div>
      </div>
      <MobileNav current="calls" onChange={onMobileNav} />
    </section>
  );
}

function StoriesSection({ onOpenStory, onMobileNav }: { onOpenStory: (story: StoryItem) => void; onMobileNav: (section: Section) => void }) {
  return (
    <section className="bc3-section">
      <SectionHeader title="Stories" eyebrow="24-hour updates" action="New story" />
      <div className="bc3-story-strip">
        {stories.map((story) => <button key={story.id} className={`bc3-story-ring ${story.seen ? 'is-seen' : ''} ${story.mine ? 'is-mine' : ''}`} onClick={() => onOpenStory(story)}><div><GenericAvatar id={story.id} initials={story.initials} /></div><strong>{story.name}</strong><span>{story.time}</span></button>)}
      </div>
      <div className="bc3-story-feature-grid">
        {stories.filter((story) => !story.mine).map((story, index) => (
          <button key={story.id} className={`bc3-story-card bc3-story-card--${(index % 3) + 1}`} onClick={() => onOpenStory(story)}>
            <div className="bc3-story-card-top"><GenericAvatar id={story.id} initials={story.initials} /><div><strong>{story.name}</strong><span>{story.time}</span></div></div>
            <p>{story.caption}</p>
            <span className="bc3-story-open">View story →</span>
          </button>
        ))}
      </div>
      <MobileNav current="stories" onChange={onMobileNav} />
    </section>
  );
}

function PeopleSection({ query, setQuery, looksLikePhone, contacts, onOpenChat, onStartCall, onMobileNav }: { query: string; setQuery: (value: string) => void; looksLikePhone: boolean; contacts: Conversation[]; onOpenChat: (id: string) => void; onStartCall: (mode: 'voice' | 'video', contact: Conversation) => void; onMobileNav: (section: Section) => void }) {
  return (
    <section className="bc3-section">
      <SectionHeader title="People" eyebrow="Private contacts" action="Add contact" />
      <div className="bc3-people-search-wrap"><label className="bc-search bc3-people-search"><Icon name="search" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search contacts or enter a phone number" /></label><small>Unknown people are discoverable by phone number only. No public usernames.</small></div>
      {looksLikePhone && contacts.length === 0 && <button className="bc3-phone-card"><span>+</span><div><strong>Start with this phone number</strong><small>{query.trim()}</small></div><em>Phone number only</em></button>}
      <div className="bc3-contact-grid">
        {contacts.map((contact) => (
          <article className="bc3-contact-card" key={contact.id}><GenericAvatar id={contact.id} initials={contact.initials} online={contact.online} large /><h3>{contact.name}</h3><p>{contact.phone}</p><small>{contact.online ? 'Online now' : 'BChat contact'}</small><div><button onClick={() => onOpenChat(contact.id)}><Icon name="chats" /> Message</button><button onClick={() => onStartCall('voice', contact)}><Icon name="call" /></button><button onClick={() => onStartCall('video', contact)}><Icon name="video" /></button></div></article>
        ))}
      </div>
      <MobileNav current="people" onChange={onMobileNav} />
    </section>
  );
}

function GroupsSection({ onOpenChat, onCreate, onMobileNav }: { onOpenChat: (id: string) => void; onCreate: () => void; onMobileNav: (section: Section) => void }) {
  return (
    <section className="bc3-section">
      <SectionHeader title="Groups" eyebrow="Private collaboration" action="Create group" onAction={onCreate} />
      <div className="bc3-group-layout">
        <div className="bc3-group-grid">
          {groups.map((group) => (
            <article className="bc3-group-card" key={group.id}><div className="bc3-group-card-top"><GenericAvatar id={group.id} initials={group.initials} large /><div><h3>{group.name}</h3><span>{group.members} members</span></div></div><p>{group.description}</p><div className="bc3-group-recent">{group.recent}</div><div className="bc3-group-actions"><button onClick={() => onOpenChat(group.id === 'g1' ? 'family' : group.id === 'g2' ? 'design' : group.id === 'g3' ? 'launch' : 'family')}><Icon name="chats" /> Open chat</button><button><Icon name="info" /> Details</button></div></article>
          ))}
        </div>
        <aside className="bc3-card bc3-group-side"><span className="bc3-kicker">Group controls</span><h2>Built for focused conversations.</h2><p>Member roles, invitations, approval flows and moderation controls are surfaced here without turning private chat into a public community feed.</p><div className="bc3-checklist"><span>✓ Invite approvals</span><span>✓ Admin roles</span><span>✓ Shared media</span><span>✓ Group call UI ready</span></div></aside>
      </div>
      <MobileNav current="groups" onChange={onMobileNav} />
    </section>
  );
}

function ChannelsSection({ items, setItems, onOpenChat, onMobileNav }: { items: ChannelItem[]; setItems: Dispatch<SetStateAction<ChannelItem[]>>; onOpenChat: (id: string) => void; onMobileNav: (section: Section) => void }) {
  function toggleFollow(id: string) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, followed: !item.followed } : item));
  }
  return (
    <section className="bc3-section">
      <SectionHeader title="Channels" eyebrow="Broadcasts" action="Create channel" />
      <div className="bc3-channel-feature"><div><span className="bc3-kicker">Bazaara Product</span><h2>Updates without crowding your private inbox.</h2><p>Channels remain structurally separate from one-to-one conversations while still using the same BChat identity and sharing system.</p><button className="bc3-primary" onClick={() => onOpenChat('channel')}>Open followed channel</button></div><div className="bc3-channel-art"><span>B</span></div></div>
      <div className="bc3-channel-grid">
        {items.map((channel) => (
          <article className="bc3-channel-card" key={channel.id}><GenericAvatar id={channel.id} initials={channel.initials} large /><div><h3>{channel.name}</h3><span>{channel.followers} followers</span></div><p>{channel.description}</p><button className={channel.followed ? 'is-followed' : ''} onClick={() => toggleFollow(channel.id)}>{channel.followed ? 'Following' : 'Follow'}</button></article>
        ))}
      </div>
      <MobileNav current="channels" onChange={onMobileNav} />
    </section>
  );
}

function SettingsSection(props: {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  readReceipts: boolean;
  setReadReceipts: (value: boolean) => void;
  lastSeen: boolean;
  setLastSeen: (value: boolean) => void;
  notificationPreview: boolean;
  setNotificationPreview: (value: boolean) => void;
  bubbleStyle: BubbleStyle;
  setBubbleStyle: (value: BubbleStyle) => void;
  wallpaper: WallpaperName;
  setWallpaper: (value: WallpaperName) => void;
  motionEnabled: boolean;
  setMotionEnabled: (value: boolean) => void;
  compactMode: boolean;
  setCompactMode: (value: boolean) => void;
  soundEffects: boolean;
  setSoundEffects: (value: boolean) => void;
  openLinkedDevices: () => void;
  onMobileNav: (section: Section) => void;
}) {
  const {
    theme, setTheme, readReceipts, setReadReceipts, lastSeen, setLastSeen, notificationPreview, setNotificationPreview,
    bubbleStyle, setBubbleStyle, wallpaper, setWallpaper, motionEnabled, setMotionEnabled, compactMode, setCompactMode,
    soundEffects, setSoundEffects, openLinkedDevices, onMobileNav,
  } = props;
  const [tab, setTab] = useState<'appearance' | 'chats' | 'privacy' | 'notifications'>('appearance');
  const themes: { id: ThemeName; label: string }[] = [{ id: 'aurora', label: 'Aurora' }, { id: 'violet', label: 'Violet Glass' }, { id: 'ocean', label: 'Deep Ocean' }, { id: 'black', label: 'Pure Black' }];

  return (
    <section className="bc3-section bc3-settings-section">
      <SectionHeader title="Settings" eyebrow="Your BChat" />
      <div className="bc3-settings-grid">
        <aside className="bc3-settings-menu">
          <button className={tab === 'appearance' ? 'is-active' : ''} onClick={() => setTab('appearance')}><Icon name="palette" /><div><strong>Appearance</strong><span>Theme, wallpaper, bubbles</span></div></button>
          <button className={tab === 'chats' ? 'is-active' : ''} onClick={() => setTab('chats')}><Icon name="chats" /><div><strong>Chats</strong><span>Density, motion and sound</span></div></button>
          <button className={tab === 'privacy' ? 'is-active' : ''} onClick={() => setTab('privacy')}><Icon name="shield" /><div><strong>Privacy</strong><span>Visibility and safety</span></div></button>
          <button className={tab === 'notifications' ? 'is-active' : ''} onClick={() => setTab('notifications')}><Icon name="bell" /><div><strong>Notifications</strong><span>Alerts and previews</span></div></button>
          <button onClick={openLinkedDevices}><Icon name="devices" /><div><strong>Linked devices</strong><span>Sessions and security</span></div></button>
        </aside>

        <div className="bc3-settings-main">
          {tab === 'appearance' && <>
            <div className="bc3-settings-block"><div className="bc3-settings-block-head"><div><strong>Conversation atmosphere</strong><span>Deep Bazaara themes with restrained neon.</span></div></div><div className="bc3-theme-grid">{themes.map((item) => <button key={item.id} className={`${theme === item.id ? 'is-active' : ''} bc3-theme-${item.id}`} onClick={() => setTheme(item.id)}><i /><strong>{item.label}</strong>{theme === item.id && <span>Selected</span>}</button>)}</div></div>
            <div className="bc3-settings-block"><div className="bc3-settings-block-head"><div><strong>Chat wallpaper</strong><span>Image-like depth without reducing message contrast.</span></div></div><div className="bc3-wallpaper-grid">{wallpapers.map((item) => <button key={item.id} className={`${wallpaper === item.id ? 'is-active' : ''} bc3-wallpaper-card--${item.id}`} onClick={() => setWallpaper(item.id)}><i /><strong>{item.label}</strong><span>{wallpaper === item.id ? 'Active' : 'Preview'}</span></button>)}</div></div>
            <div className="bc3-settings-block"><div className="bc3-settings-block-head"><div><strong>Bubble shape</strong><span>Switch from clean iMessage-like curves to flexible game-inspired skins.</span></div></div><div className="bc3-bubble-style-grid">{bubbleStyles.map((item) => <button key={item.id} className={bubbleStyle === item.id ? 'is-active' : ''} onClick={() => setBubbleStyle(item.id)}><div className={`bc3-bubble-preview is-${item.id}`}><span>GG! 🔥</span><span>Ready.</span></div><strong>{item.label}</strong><small>{item.note}</small></button>)}</div></div>
          </>}

          {tab === 'chats' && <>
            <div className="bc3-settings-block"><div className="bc3-settings-block-head"><div><strong>Chat behavior</strong><span>Fast, tactile and adaptable.</span></div></div><SettingToggle label="Telegram-style motion" description="Use springy transitions, swipe feedback and animated sends." value={motionEnabled} onChange={setMotionEnabled} /><SettingToggle label="Compact conversation density" description="Fit more messages on screen without shrinking controls." value={compactMode} onChange={setCompactMode} /><SettingToggle label="Message sounds" description="Play subtle send and receive feedback." value={soundEffects} onChange={setSoundEffects} /></div>
            <div className="bc3-settings-block bc3-chat-preview-block"><div className="bc3-settings-block-head"><div><strong>Live preview</strong><span>Your selected bubble style and wallpaper update instantly.</span></div></div><div className="bc3-settings-chat-preview"><div className="bc3-preview-message is-theirs">Yo, ready for tonight? 🎮</div><div className="bc3-preview-message is-mine">Locked in. Let’s run it 🔥</div><div className="bc3-preview-sticker">🏆 <b>BIG WIN</b></div></div></div>
          </>}

          {tab === 'privacy' && <>
            <div className="bc3-settings-block"><div className="bc3-settings-block-head"><div><strong>Privacy</strong><span>Private-by-default controls.</span></div></div><SettingToggle label="Read receipts" description="Allow contacts to see when messages are read." value={readReceipts} onChange={setReadReceipts} /><SettingToggle label="Show last seen" description="Share your recent activity timestamp." value={lastSeen} onChange={setLastSeen} /></div>
            <div className="bc3-settings-block bc3-security-card"><Icon name="shield" size={26} /><div><strong>Security center</strong><span>Device sessions, blocked contacts, login alerts and encryption state live here.</span></div><button onClick={openLinkedDevices}>Review devices</button></div>
          </>}

          {tab === 'notifications' && <div className="bc3-settings-block"><div className="bc3-settings-block-head"><div><strong>Notifications</strong><span>Choose what appears outside BChat.</span></div></div><SettingToggle label="Message previews" description="Show message text in notifications." value={notificationPreview} onChange={setNotificationPreview} /><SettingToggle label="Message sounds" description="Use a subtle BChat notification sound." value={soundEffects} onChange={setSoundEffects} /></div>}
        </div>
      </div>
      <MobileNav current="settings" onChange={onMobileNav} />
    </section>
  );
}

function SettingToggle({ label, description, value, onChange }: { label: string; description: string; value: boolean; onChange: (value: boolean) => void }) {
  return <div className="bc3-setting-row"><div><strong>{label}</strong><span>{description}</span></div><button className={`bc3-switch ${value ? 'is-on' : ''}`} aria-pressed={value} onClick={() => onChange(!value)}><i /></button></div>;
}

function SectionHeader({ title, eyebrow, action, onAction }: { title: string; eyebrow: string; action?: string; onAction?: () => void }) {
  return <header className="bc3-section-head"><div><span>{eyebrow}</span><h1>{title}</h1></div>{action && <button className="bc3-primary" onClick={onAction}><Icon name="plus" /> {action}</button>}</header>;
}

function ConversationRow({ item, selected, onOpen }: { item: Conversation; selected: boolean; onOpen: (id: string) => void }) {
  return <button className={`bc-row ${selected ? 'is-selected' : ''}`} onClick={() => onOpen(item.id)} role="listitem"><Avatar item={item} /><div className="bc-row-main"><div className="bc-row-title"><strong>{item.name}</strong><time>{item.time}</time></div><div className="bc-row-preview"><span className={item.typing ? 'is-typing' : ''}>{item.preview}</span><div>{item.pinned && <b>◆</b>}{item.unread && <em>{item.unread}</em>}</div></div></div></button>;
}

function MessageBubble({ message, isNew, onReply, onReact, onOpenMedia }: { message: Message; isNew: boolean; onReply: (message: Message) => void; onReact: (id: string, reaction: string) => void; onOpenMedia: () => void }) {
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
    <div className={`bc-message ${message.mine ? 'is-mine' : 'is-theirs'} ${isNew ? 'is-new' : ''}`} onPointerDown={pointerDown} onPointerMove={pointerMove} onPointerUp={pointerUp} onPointerCancel={() => { clearHold(); setDragX(0); }}>
      <div className="bc-reply-gesture" style={{ opacity: Math.min(1, dragX / 46), transform: `translateX(${Math.min(14, dragX / 5)}px)` }}>↩</div>
      <div className="bc-bubble-wrap" style={{ transform: `translateX(${dragX}px)` }}>
        <div className={`bc-bubble ${message.image ? 'bc-bubble--image' : ''} ${message.voice ? 'bc-bubble--voice' : ''} ${message.sticker ? 'bc-bubble--sticker' : ''}`}>
          {message.replyTo && <button className="bc-reply-strip" onClick={() => setActionsOpen(false)}>{message.replyTo}</button>}
          {message.sticker && <div className={`bc3-chat-sticker is-${message.sticker.tone}`}><span className="bc3-chat-sticker-glyph">{message.sticker.glyph}</span><b>B</b><strong>{message.sticker.label}</strong><small>{message.sticker.pack}</small></div>}
          {message.text && <p>{message.text}</p>}
          {message.image && <button className="bc-photo-button" onClick={(event) => { event.stopPropagation(); onOpenMedia(); }} aria-label="Open image"><div className="bc-photo-preview"><div className="bc-photo-moon" /><div className="bc-photo-ridge" /><div className="bc-photo-water" /></div></button>}
          {message.voice && <div className={`bc-voice ${voicePlaying ? 'is-playing' : ''}`}><button onClick={(event) => { event.stopPropagation(); toggleVoice(); }} aria-label={voicePlaying ? 'Pause voice note' : 'Play voice note'}>{voicePlaying ? 'Ⅱ' : '▶'}</button><div className="bc-wave" aria-hidden="true">{Array.from({ length: 28 }, (_, index) => <i key={index} style={{ height: `${8 + ((index * 11) % 25)}px`, animationDelay: `${index * 24}ms` }} />)}</div><strong>{message.voice}</strong></div>}
          <div className="bc-meta"><time>{message.time}</time>{message.mine && <span>{message.status === 'read' ? '✓✓' : '✓'}</span>}</div>
        </div>
        {message.reaction && <button className="bc-reaction" onClick={() => setActionsOpen(true)}>{message.reaction}</button>}
      </div>
      {actionsOpen && <div className={`bc-message-menu ${message.mine ? 'is-mine' : 'is-theirs'}`} role="menu"><div className="bc-reaction-bar">{['❤️','👍','😂','😮','😢','🙏'].map((reaction) => <button key={reaction} onClick={() => { onReact(message.id, `${reaction} 1`); setActionsOpen(false); }}>{reaction}</button>)}</div><div className="bc-menu-actions"><button onClick={() => { onReply(message); setActionsOpen(false); }}>↩ <span>Reply</span></button><button onClick={copyMessage}>▣ <span>Copy</span></button><button onClick={() => setActionsOpen(false)}>➜ <span>Forward</span></button><button onClick={() => setActionsOpen(false)}>☆ <span>Star</span></button><button onClick={() => setActionsOpen(false)}>◆ <span>Pin</span></button>{message.mine && <button onClick={() => setActionsOpen(false)}>✎ <span>Edit</span></button>}</div><button className="bc-menu-dismiss" onClick={() => setActionsOpen(false)}>Close</button></div>}
    </div>
  );
}

function CallSurface(props: { mode: 'voice' | 'video'; contact: { id: string; name: string; phone: string; initials: string; online?: boolean }; clock: string; muted: boolean; cameraOn: boolean; speakerOn: boolean; setMuted: (value: boolean | ((current: boolean) => boolean)) => void; setCameraOn: (value: boolean | ((current: boolean) => boolean)) => void; setSpeakerOn: (value: boolean | ((current: boolean) => boolean)) => void; onEnd: () => void }) {
  const { mode, contact, clock, muted, cameraOn, speakerOn, setMuted, setCameraOn, setSpeakerOn, onEnd } = props;
  return (
    <div className={`bc-call-surface ${mode === 'video' ? 'is-video' : 'is-voice'}`} role="dialog" aria-modal="true" aria-label={`${mode === 'video' ? 'Video' : 'Voice'} call with ${contact.name}`}>
      <div className="bc-call-backdrop" aria-hidden="true" /><div className="bc-call-topbar"><button className="bc-call-minimize" onClick={onEnd} aria-label="Close call"><Icon name="back" /></button><div><strong>BChat</strong><span>{mode === 'video' ? 'Video call' : 'Voice call'}</span></div><button className="bc-call-more" aria-label="More call options"><Icon name="more" /></button></div>
      <div className="bc-call-stage">{mode === 'video' && cameraOn && <div className="bc-call-video-orb" aria-hidden="true"><span>{contact.initials}</span></div>}<GenericAvatar id={contact.id} initials={contact.initials} online={contact.online} large /><h2>{contact.name}</h2>{contact.phone && <p>{contact.phone}</p>}<div className="bc-call-status"><i /> Call UI <span>·</span> {clock}</div><small className="bc-call-note">Phase 3 completes the call experience. Live WebRTC signaling remains in the existing engine until Phase 4 integration.</small></div>
      <div className="bc-call-controls"><button className={speakerOn ? 'is-active' : ''} onClick={() => setSpeakerOn((value) => !value)} aria-pressed={speakerOn}><span>◖)))</span><strong>Speaker</strong></button><button className={cameraOn ? 'is-active' : ''} onClick={() => setCameraOn((value) => !value)} aria-pressed={cameraOn}><Icon name="video" /><strong>Video</strong></button><button className={muted ? 'is-muted' : ''} onClick={() => setMuted((value) => !value)} aria-pressed={muted}><Icon name="mic" /><strong>{muted ? 'Unmute' : 'Mute'}</strong></button><button className="bc-call-add"><Icon name="people" /><strong>Add</strong></button><button className="bc-call-end" onClick={onEnd} aria-label="End call"><Icon name="call" /><strong>End</strong></button></div>
    </div>
  );
}

function MediaViewer({ onClose }: { onClose: () => void }) {
  return <div className="bc-media-viewer" role="dialog" aria-modal="true" aria-label="Media viewer" onClick={onClose}><button className="bc-media-close" onClick={onClose} aria-label="Close media">×</button><div className="bc-media-stage" onClick={(event) => event.stopPropagation()}><div className="bc-photo-preview bc-photo-preview--large"><div className="bc-photo-moon" /><div className="bc-photo-ridge" /><div className="bc-photo-water" /></div><div className="bc-media-tools"><button>Share</button><button>Save</button><button>Info</button></div></div></div>;
}

function StoryViewer({ story, onClose }: { story: StoryItem; onClose: () => void }) {
  return (
    <div className="bc3-story-viewer" role="dialog" aria-modal="true" aria-label={`${story.name} story`}>
      <div className="bc3-story-progress"><i /><i /><i /></div>
      <div className="bc3-story-viewer-head"><div><GenericAvatar id={story.id} initials={story.initials} /><strong>{story.name}</strong><span>{story.time}</span></div><button onClick={onClose}>×</button></div>
      <div className="bc3-story-scene"><div className="bc3-story-glow" /><div className="bc3-story-horizon" /><p>{story.caption}</p></div>
      <div className="bc3-story-reply"><input placeholder="Reply…" /><button>❤️</button><button><Icon name="send" /></button></div>
    </div>
  );
}

function CreateGroupModal({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(1);
  return <div className="bc3-modal-backdrop" role="dialog" aria-modal="true" aria-label="Create group"><div className="bc3-modal"><header><div><span>Step {step} of 2</span><h2>Create group</h2></div><button onClick={onClose}>×</button></header>{step === 1 ? <><label className="bc-search"><Icon name="search" /><input placeholder="Search contacts by name or phone number" /></label><div className="bc3-picker-list">{conversations.filter((item) => item.kind === 'person').map((item) => <label key={item.id}><GenericAvatar id={item.id} initials={item.initials} online={item.online} /><div><strong>{item.name}</strong><span>{item.phone}</span></div><input type="checkbox" /></label>)}</div><button className="bc3-primary bc3-modal-next" onClick={() => setStep(2)}>Continue</button></> : <><div className="bc3-group-name"><div className="bc3-group-placeholder">+</div><label><span>Group name</span><input placeholder="Enter a group name" autoFocus /></label></div><div className="bc3-modal-note">Member permissions and server ACL enforcement connect during Phase 4.</div><button className="bc3-primary bc3-modal-next" onClick={onClose}>Create preview group</button></>}</div></div>;
}

function LinkedDevicesModal({ onClose }: { onClose: () => void }) {
  return <div className="bc3-modal-backdrop" role="dialog" aria-modal="true" aria-label="Linked devices"><div className="bc3-modal bc3-device-modal"><header><div><span>Security</span><h2>Linked devices</h2></div><button onClick={onClose}>×</button></header><div className="bc3-device-row"><Icon name="devices" /><div><strong>This browser</strong><span>Windows · Active now</span></div><em>Current</em></div><div className="bc3-device-row"><Icon name="devices" /><div><strong>Android phone</strong><span>Last active 18 minutes ago</span></div><button>Log out</button></div><p>Cross-device encrypted history and verified device keys are reserved for the integration/security phase.</p></div></div>;
}
