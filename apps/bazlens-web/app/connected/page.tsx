import { redirect } from 'next/navigation';
// V9.1: restore standalone product UX instead of a generic connected marketing dashboard.
export default function Connected() { redirect('/'); }
