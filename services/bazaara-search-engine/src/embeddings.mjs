import crypto from 'node:crypto';
import { tokenize } from './util.mjs';

function fnv1a(str) {
  let h=2166136261;
  for (let i=0;i<str.length;i++) { h ^= str.charCodeAt(i); h = Math.imul(h,16777619); }
  return h>>>0;
}

export function hashEmbedding(text, dims=256) {
  const v=new Float32Array(dims);
  const tokens=tokenize(text).slice(0,5000);
  for (let i=0;i<tokens.length;i++) {
    const token=tokens[i];
    const h=fnv1a(token);
    const idx=h%dims;
    const sign=(h&0x80000000)?-1:1;
    const weight=1/Math.sqrt(1+i/40);
    v[idx]+=sign*weight;
    if (token.length>5) {
      const h2=fnv1a(token.slice(0,4));
      v[h2%dims]+=((h2&1)?1:-1)*weight*0.35;
    }
  }
  let norm=0; for (const x of v) norm+=x*x; norm=Math.sqrt(norm)||1;
  return Array.from(v,x=>x/norm);
}

export function cosine(a,b) {
  if (!a || !b || a.length!==b.length) return 0;
  let dot=0,na=0,nb=0;
  for (let i=0;i<a.length;i++){dot+=a[i]*b[i];na+=a[i]*a[i];nb+=b[i]*b[i];}
  return na&&nb ? dot/(Math.sqrt(na)*Math.sqrt(nb)) : 0;
}

export class Embeddings {
  constructor(config) { this.config=config; }
  async embed(text) {
    if (this.config.ollamaEnabled) {
      try {
        const r=await fetch(`${this.config.ollamaUrl}/api/embed`,{
          method:'POST',headers:{'content-type':'application/json'},signal:AbortSignal.timeout(15000),
          body:JSON.stringify({model:this.config.ollamaModel,input:text.slice(0,12000)})
        });
        if (r.ok) {
          const j=await r.json(); const vector=j.embeddings?.[0];
          if (Array.isArray(vector) && vector.length) return {provider:'ollama',model:this.config.ollamaModel,vector};
        }
      } catch {}
    }
    return {provider:'bazaara-local',model:'feature-hash-v1',vector:hashEmbedding(text)};
  }
}
