'use client';
import {useCollection} from './core';
type Saved={id:string;kind:string};
const valid=(v:unknown):v is Saved=>{const x=v as Saved;return !!x&&typeof x.id==='string'&&typeof x.kind==='string';};
export function useSocialSaves(userId:string,product:string){const store=useCollection<Saved>('saved.'+product+'.'+userId,valid);const has=(id:string)=>store.items.some(x=>x.id===id);const toggle=(id:string,kind:string)=>store.mutate(rows=>rows.some(x=>x.id===id)?rows.filter(x=>x.id!==id):[{id,kind},...rows]);return {...store,has,toggle};}
