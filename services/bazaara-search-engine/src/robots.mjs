import { fetchLimited, normalizeUrl } from './util.mjs';

function globToRegex(rule) {
  let end = false;
  if (rule.endsWith('$')) { end = true; rule = rule.slice(0,-1); }
  const escaped = rule.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp('^' + escaped + (end ? '$' : ''));
}

export function parseRobots(text='') {
  const groups=[];
  const sitemaps=[];
  let current=null;
  for (const raw of text.split(/\r?\n/)) {
    const line=raw.replace(/#.*$/,'').trim();
    if (!line) continue;
    const m=line.match(/^([^:]+):\s*(.*)$/);
    if (!m) continue;
    const key=m[1].trim().toLowerCase(), value=m[2].trim();
    if (key === 'sitemap') { if (value) sitemaps.push(value); continue; }
    if (key === 'user-agent') {
      if (!current || current.rules.length || current.crawlDelay != null) { current={agents:[],rules:[],crawlDelay:null}; groups.push(current); }
      current.agents.push(value.toLowerCase());
    } else if (current && (key === 'allow' || key === 'disallow')) {
      if (value || key === 'allow') current.rules.push({allow:key==='allow',path:value});
    } else if (current && key === 'crawl-delay') {
      const n=Number(value); if (Number.isFinite(n) && n >= 0) current.crawlDelay=Math.round(n*1000);
    }
  }
  return {groups,sitemaps};
}

function selectGroups(parsed, userAgent) {
  const ua=userAgent.toLowerCase();
  let best=-1, selected=[];
  for (const g of parsed.groups) {
    for (const a of g.agents) {
      const score=a==='*' ? 0 : (ua.includes(a) ? a.length : -1);
      if (score > best) { best=score; selected=[g]; }
      else if (score === best && score >= 0) selected.push(g);
    }
  }
  return selected;
}

export function robotsPolicy(text, userAgent, url) {
  const parsed=parseRobots(text);
  const groups=selectGroups(parsed,userAgent);
  const path=new URL(url).pathname + new URL(url).search;
  let winner=null;
  for (const g of groups) {
    for (const r of g.rules) {
      if (!r.path && !r.allow) continue;
      if (globToRegex(r.path).test(path)) {
        const specificity=r.path.replace(/\*/g,'').replace(/\$$/,'').length;
        if (!winner || specificity > winner.specificity || (specificity === winner.specificity && r.allow)) winner={...r,specificity};
      }
    }
  }
  const delays=groups.map(g=>g.crawlDelay).filter(Number.isFinite);
  return { allowed: winner ? winner.allow : true, crawlDelayMs: delays.length ? Math.max(...delays) : null, sitemaps: parsed.sitemaps };
}

export async function loadRobots(db, origin, config) {
  const u=new URL(origin);
  const host=u.hostname;
  const existing=db.getDomain(host);
  if (existing?.robots_fetched_at && Date.now()-Date.parse(existing.robots_fetched_at) < 24*3600_000) {
    return existing.robots_txt ?? '';
  }
  const robotsUrl=`${u.protocol}//${u.host}/robots.txt`;
  let text='';
  try {
    const {response,bytes}=await fetchLimited(robotsUrl,{userAgent:config.userAgent,timeoutMs:config.requestTimeoutMs,maxBytes:1_000_000,allowPrivate:config.allowPrivateNetwork});
    if (response.ok) text=bytes.toString('utf8');
  } catch {}
  const p=robotsPolicy(text,config.userAgent,origin);
  db.upsertDomain(host,{robots_txt:text,robots_fetched_at:new Date().toISOString(),crawl_delay_ms:p.crawlDelayMs});
  return text;
}

export function extractSitemapUrls(xml, baseUrl) {
  const out=[];
  for (const m of xml.matchAll(/<loc(?:\s[^>]*)?>([\s\S]*?)<\/loc>/gi)) {
    const raw=m[1].replace(/<!\[CDATA\[|\]\]>/g,'').replace(/&amp;/g,'&').trim();
    const u=normalizeUrl(raw,baseUrl); if (u) out.push(u);
  }
  return [...new Set(out)];
}
