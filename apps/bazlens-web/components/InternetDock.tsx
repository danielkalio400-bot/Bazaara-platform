'use client';
import Hub from '../../../packages/smart-ui/src/hub';
export default function InternetDock({current}:{current:'search'|'bmap'|'translate'|'news'|'bazlens'}){return <Hub currentApp={current} initialScope="Internet"/>;}
