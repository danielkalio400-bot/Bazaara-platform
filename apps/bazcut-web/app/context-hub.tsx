'use client';
import {usePathname} from 'next/navigation';
import BazaaraHub from './bazaara-hub';
export default function ContextHub(){const path=usePathname();return ['/','/studio','/motion'].includes(path)?null:<BazaaraHub currentApp="bazcut"/>;}
