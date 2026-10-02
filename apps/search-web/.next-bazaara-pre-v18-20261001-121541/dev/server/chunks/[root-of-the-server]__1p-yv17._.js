module.exports = [
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () => require("next/dist/server/app-render/action-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () => require("next/dist/server/runtime-reacts.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[project]/apps/search-web/app/api/region/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET,
    "dynamic",
    ()=>dynamic,
    "runtime",
    ()=>runtime
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
;
const runtime = 'nodejs';
const dynamic = 'force-dynamic';
const responseHeaders = {
    'Cache-Control': 'private, no-store',
    'Vary': 'CF-IPCountry, X-Vercel-IP-Country, X-Country-Code, X-Geo-Country, Accept-Language'
};
function validCountry(value) {
    const code = (value || '').trim().toUpperCase();
    return /^[A-Z]{2}$/.test(code) && code !== 'ZZ' ? code : null;
}
function clientIp(request) {
    const forwarded = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
    return forwarded || request.headers.get('x-real-ip')?.trim() || null;
}
async function configuredGeoIp(request) {
    const template = process.env.BAZAARA_GEOIP_ENDPOINT?.trim();
    const ip = clientIp(request);
    if (!template || !ip || [
        '127.0.0.1',
        '::1'
    ].includes(ip)) return null;
    let target;
    try {
        const raw = template.includes('{ip}') ? template.replace('{ip}', encodeURIComponent(ip)) : template;
        target = new URL(raw);
        if (target.protocol !== 'https:' || target.username || target.password) return null;
        if (!template.includes('{ip}')) target.searchParams.set('ip', ip);
    } catch  {
        return null;
    }
    try {
        const headers = {
            Accept: 'application/json'
        };
        if (process.env.BAZAARA_GEOIP_API_KEY) headers.Authorization = `Bearer ${process.env.BAZAARA_GEOIP_API_KEY}`;
        const response = await fetch(target, {
            headers,
            cache: 'no-store',
            redirect: 'error',
            signal: AbortSignal.timeout(3500)
        });
        if (!response.ok) return null;
        const payload = await response.json();
        const code = validCountry(typeof payload.country_code === 'string' ? payload.country_code : typeof payload.countryCode === 'string' ? payload.countryCode : typeof payload.country === 'string' && payload.country.length === 2 ? payload.country : null);
        return code;
    } catch  {
        return null;
    }
}
async function GET(request) {
    const edgeCountry = [
        request.headers.get('x-vercel-ip-country'),
        request.headers.get('cf-ipcountry'),
        request.headers.get('x-country-code'),
        request.headers.get('x-geo-country'),
        request.headers.get('x-appengine-country')
    ].map(validCountry).find(Boolean) || null;
    if (edgeCountry) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            country: edgeCountry,
            source: 'edge-ip'
        }, {
            headers: responseHeaders
        });
    }
    const geoCountry = await configuredGeoIp(request);
    if (geoCountry) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            country: geoCountry,
            source: 'geoip'
        }, {
            headers: responseHeaders
        });
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
        country: 'ALL',
        source: 'unavailable'
    }, {
        headers: responseHeaders
    });
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1p-yv17._.js.map