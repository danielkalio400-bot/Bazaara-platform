import { Workspace } from '../components/Workspace';
import { getIdentity } from '../lib/session';
export const dynamic = 'force-dynamic';
export default async function Home() { return <Workspace initialIdentity={await getIdentity()}/>; }
