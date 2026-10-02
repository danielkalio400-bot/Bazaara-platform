import { fetchLimited } from './util.mjs';

export async function fetchPage(url, config) {
  const {response,bytes,finalUrl,durationMs}=await fetchLimited(url,{
    userAgent:config.userAgent,
    timeoutMs:config.requestTimeoutMs,
    maxBytes:config.maxHtmlBytes,
    allowPrivate:config.allowPrivateNetwork,
  });
  const contentType=(response.headers.get('content-type')||'').toLowerCase();
  let html=bytes.toString('utf8');
  let rendered=false;

  const looksLikeJsShell = contentType.includes('text/html') &&
    html.length < 250_000 &&
    ((html.match(/<script\b/gi)||[]).length >= 5) &&
    html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<[^>]+>/g,' ').replace(/\s+/g,' ').trim().length < 800;

  if (config.renderJs && looksLikeJsShell) {
    try {
      const { chromium } = await import('playwright');
      const browser=await chromium.launch({headless:true});
      const page=await browser.newPage({userAgent:config.userAgent});
      await page.goto(finalUrl,{waitUntil:'networkidle',timeout:config.requestTimeoutMs});
      html=await page.content();
      await browser.close();
      rendered=true;
    } catch (error) {
      // Fetch result remains usable. Playwright is deliberately optional.
      console.warn('[BazRender] JS rendering unavailable:', error.message);
    }
  }

  return {response,html,finalUrl,durationMs,rendered,bytes:Buffer.byteLength(html)};
}
