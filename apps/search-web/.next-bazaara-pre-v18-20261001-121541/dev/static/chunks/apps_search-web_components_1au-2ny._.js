(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/apps/search-web/components/SearchAppLauncher.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SearchAppLauncher
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
const CATALOG = [
    {
        id: 'search',
        name: 'Search',
        short: '⌕',
        category: 'Internet',
        port: 3020
    },
    {
        id: 'bmap',
        name: 'BMap',
        short: '⌖',
        category: 'Internet',
        port: 3038
    },
    {
        id: 'translate',
        name: 'Translate',
        short: '文',
        category: 'Internet',
        port: 3039
    },
    {
        id: 'news',
        name: 'News',
        short: '≡',
        category: 'Internet',
        port: 3040
    },
    {
        id: 'bazlens',
        name: 'BazLens',
        short: '◎',
        category: 'Internet',
        port: 3041
    },
    {
        id: 'bmail',
        name: 'BMail',
        short: '✉',
        category: 'Communication',
        port: 3036
    },
    {
        id: 'bazmeet',
        name: 'BazMeet',
        short: '▣',
        category: 'Communication',
        port: 3037
    },
    {
        id: 'groups',
        name: 'Groups',
        short: '♧',
        category: 'Communication',
        port: 3046
    },
    {
        id: 'docs',
        name: 'Docs',
        short: '▤',
        category: 'Productivity',
        port: 3023
    },
    {
        id: 'sheets',
        name: 'Sheets',
        short: '▦',
        category: 'Productivity',
        port: 3024
    },
    {
        id: 'slides',
        name: 'Slides',
        short: '▭',
        category: 'Productivity',
        port: 3025
    },
    {
        id: 'forms',
        name: 'Forms',
        short: '☷',
        category: 'Productivity',
        port: 3026
    },
    {
        id: 'notes',
        name: 'Notes',
        short: '✎',
        category: 'Productivity',
        port: 3027
    },
    {
        id: 'calendar',
        name: 'Calendar',
        short: '31',
        category: 'Productivity',
        port: 3028
    },
    {
        id: 'contacts',
        name: 'Contacts',
        short: '◉',
        category: 'Productivity',
        port: 3029
    },
    {
        id: 'tasks',
        name: 'Tasks',
        short: '✓',
        category: 'Productivity',
        port: 3045
    },
    {
        id: 'projects',
        name: 'Projects',
        short: '◫',
        category: 'Productivity',
        port: 3034
    },
    {
        id: 'flow',
        name: 'Flow',
        short: '⤳',
        category: 'Productivity',
        port: 3035
    },
    {
        id: 'photos',
        name: 'Photos',
        short: '✧',
        category: 'Storage & security',
        port: 3030
    },
    {
        id: 'box',
        name: 'Box',
        short: '⬡',
        category: 'Storage & security',
        port: 3022
    },
    {
        id: 'vault',
        name: 'Vault',
        short: '◇',
        category: 'Storage & security',
        port: 3031
    },
    {
        id: 'bcloud',
        name: 'BCloud',
        short: '☁',
        category: 'Storage & security',
        port: 3043
    },
    {
        id: 'bazshield',
        name: 'BazShield',
        short: '⬟',
        category: 'Storage & security',
        port: 3054
    },
    {
        id: 'sites',
        name: 'Sites',
        short: '▧',
        category: 'Creative',
        port: 3042
    },
    {
        id: 'boards',
        name: 'Boards',
        short: '▥',
        category: 'Creative',
        port: 3033
    },
    {
        id: 'spaces',
        name: 'Spaces',
        short: '∞',
        category: 'Creative',
        port: 3032
    },
    {
        id: 'learn',
        name: 'Learn',
        short: '◈',
        category: 'Creative',
        port: 3048
    },
    {
        id: 'home',
        name: 'Bazaara Home',
        short: '⌂',
        category: 'Platform',
        port: 3005
    },
    {
        id: 'bazid',
        name: 'BazID',
        short: 'B',
        category: 'Platform',
        port: 3004
    },
    {
        id: 'workspace',
        name: 'Workspace',
        short: '▦',
        category: 'Platform',
        port: 3021
    },
    {
        id: 'one',
        name: 'Bazaara One',
        short: '◌',
        category: 'Platform',
        port: 3051
    },
    {
        id: 'analytics',
        name: 'Analytics',
        short: '▥',
        category: 'Platform',
        port: 3052
    },
    {
        id: 'admin',
        name: 'Admin',
        short: '⚙',
        category: 'Platform',
        port: 3044
    }
];
const INITIAL_FAVORITES = [
    'bazid',
    'search',
    'bmap',
    'translate',
    'news',
    'bazlens',
    'bmail',
    'docs',
    'calendar'
];
const STORAGE_KEY = 'bazaara-search-launcher-favorites-v85';
const CATEGORY_ORDER = [
    'Internet',
    'Communication',
    'Productivity',
    'Storage & security',
    'Creative',
    'Platform'
];
function getAppHref(app) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const config = JSON.parse(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_BAZAARA_APP_URLS || '{}');
        const configured = config[app.id];
        if (typeof configured === 'string') {
            const url = new URL(configured);
            if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
        }
    } catch  {}
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
        const host = hostname.includes(':') ? `[${hostname}]` : hostname;
        return `${window.location.protocol}//${host}:${app.port}/`;
    }
    return null;
}
function launcherApps() {
    return CATALOG;
}
function SearchAppLauncher({ open, onClose }) {
    _s();
    const [favorites, setFavorites] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(INITIAL_FAVORITES);
    const [editing, setEditing] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [filter, setFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [showAll, setShowAll] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [notice, setNotice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const searchInput = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const root = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const onCloseRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(onClose);
    onCloseRef.current = onClose;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SearchAppLauncher.useEffect": ()=>{
            try {
                const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
                if (Array.isArray(saved)) {
                    const valid = saved.filter({
                        "SearchAppLauncher.useEffect.valid": (id)=>typeof id === 'string' && CATALOG.some({
                                "SearchAppLauncher.useEffect.valid": (app)=>app.id === id
                            }["SearchAppLauncher.useEffect.valid"])
                    }["SearchAppLauncher.useEffect.valid"]);
                    setFavorites(Array.from(new Set(valid)).slice(0, 15));
                }
            } catch  {}
        }
    }["SearchAppLauncher.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SearchAppLauncher.useEffect": ()=>{
            if (!open) {
                setEditing(false);
                setFilter('');
                setShowAll(false);
                setNotice('');
                return;
            }
            const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            const t = window.setTimeout({
                "SearchAppLauncher.useEffect.t": ()=>searchInput.current?.focus()
            }["SearchAppLauncher.useEffect.t"], 0);
            const handleKey = {
                "SearchAppLauncher.useEffect.handleKey": (event)=>{
                    if (event.key === 'Escape') {
                        event.stopPropagation();
                        onCloseRef.current();
                    }
                    if (event.key !== 'Tab' || !root.current) return;
                    const els = Array.from(root.current.querySelectorAll('button:not([disabled]), a[href], input:not([disabled])'));
                    if (!els.length) return;
                    if (event.shiftKey && document.activeElement === els[0]) {
                        event.preventDefault();
                        els[els.length - 1]?.focus();
                    } else if (!event.shiftKey && document.activeElement === els[els.length - 1]) {
                        event.preventDefault();
                        els[0]?.focus();
                    }
                }
            }["SearchAppLauncher.useEffect.handleKey"];
            document.addEventListener('keydown', handleKey, true);
            return ({
                "SearchAppLauncher.useEffect": ()=>{
                    window.clearTimeout(t);
                    document.removeEventListener('keydown', handleKey, true);
                    previous?.focus();
                }
            })["SearchAppLauncher.useEffect"];
        }
    }["SearchAppLauncher.useEffect"], [
        open
    ]);
    const visible = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SearchAppLauncher.useMemo[visible]": ()=>launcherApps().filter({
                "SearchAppLauncher.useMemo[visible]": (app)=>`${app.name} ${app.category}`.toLowerCase().includes(filter.trim().toLowerCase())
            }["SearchAppLauncher.useMemo[visible]"])
    }["SearchAppLauncher.useMemo[visible]"], [
        filter
    ]);
    const favApps = favorites.map((id)=>CATALOG.find((app)=>app.id === id)).filter((app)=>!!app && visible.some((v)=>v.id === app.id));
    function persist(next) {
        setFavorites(next);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            setNotice('Favorites saved on this device.');
        } catch  {
            setNotice('Favorites changed for this session. Browser storage is unavailable.');
        }
    }
    function toggle(id) {
        persist(favorites.includes(id) ? favorites.filter((v)=>v !== id) : [
            ...favorites,
            id
        ].slice(0, 15));
    }
    function move(id, direction) {
        const next = [
            ...favorites
        ];
        const at = next.indexOf(id);
        const destination = at + direction;
        if (at < 0 || destination < 0 || destination >= next.length) return;
        const current = next[at];
        const target = next[destination];
        if (current === undefined || target === undefined) return;
        next[at] = target;
        next[destination] = current;
        persist(next);
    }
    function tile(app, pinned) {
        const href = getAppHref(app);
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bz85-app-item",
            children: [
                href ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                    className: "bz85-app-tile",
                    href: href,
                    title: `Open ${app.name}`,
                    onClick: onClose,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: `bz85-app-icon bz85-icon-${app.category.toLowerCase().replace(/[^a-z]+/g, '-')}`,
                            "aria-hidden": "true",
                            children: app.short
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 120,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "bz85-app-name",
                            children: app.name
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 121,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                    lineNumber: 119,
                    columnNumber: 15
                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    className: "bz85-app-tile bz85-app-disabled",
                    title: "Configure an HTTPS URL for this app before launching it",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: `bz85-app-icon bz85-icon-${app.category.toLowerCase().replace(/[^a-z]+/g, '-')}`,
                            "aria-hidden": "true",
                            children: app.short
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 123,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "bz85-app-name",
                            children: app.name
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 124,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                            children: "Not configured"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 125,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                    lineNumber: 122,
                    columnNumber: 14
                }, this),
                editing && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bz85-edit-controls",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: ()=>toggle(app.id),
                            "aria-label": pinned ? `Remove ${app.name} from favorites` : `Add ${app.name} to favorites`,
                            children: pinned ? '−' : '+'
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 127,
                            columnNumber: 55
                        }, this),
                        pinned && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    disabled: favorites.indexOf(app.id) === 0,
                                    onClick: ()=>move(app.id, -1),
                                    "aria-label": `Move ${app.name} earlier`,
                                    children: "←"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                    lineNumber: 127,
                                    columnNumber: 231
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    disabled: favorites.indexOf(app.id) === favorites.length - 1,
                                    onClick: ()=>move(app.id, 1),
                                    "aria-label": `Move ${app.name} later`,
                                    children: "→"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                    lineNumber: 127,
                                    columnNumber: 374
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 127,
                            columnNumber: 229
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                    lineNumber: 127,
                    columnNumber: 19
                }, this)
            ]
        }, app.id, true, {
            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
            lineNumber: 118,
            columnNumber: 12
        }, this);
    }
    if (!open) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bz85-screen-backdrop",
        onMouseDown: (event)=>{
            if (event.target === event.currentTarget) onClose();
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bz85-launcher",
            ref: root,
            role: "dialog",
            "aria-modal": "true",
            "aria-label": "BAZAARA app launcher",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bz85-launcher-top",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                    children: "THE BAZAARA ECOSYSTEM"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                    lineNumber: 133,
                                    columnNumber: 47
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    children: "Apps"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                    lineNumber: 133,
                                    columnNumber: 83
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 133,
                            columnNumber: 42
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            href: "/connected",
                            style: {
                                color: "#c8adff",
                                fontSize: 11,
                                textDecoration: "none"
                            },
                            "aria-label": "Open BAZAARA connected workflows",
                            children: "Connected journeys"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 133,
                            columnNumber: 102
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "bz85-close",
                            onClick: onClose,
                            "aria-label": "Close app launcher",
                            children: "×"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 133,
                            columnNumber: 252
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                    lineNumber: 133,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bz85-app-find",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            "aria-hidden": "true",
                            children: "⌕"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 134,
                            columnNumber: 38
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                            ref: searchInput,
                            type: "search",
                            value: filter,
                            onChange: (e)=>setFilter(e.target.value),
                            placeholder: "Search BAZAARA apps",
                            "aria-label": "Search apps"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 134,
                            columnNumber: 71
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                    lineNumber: 134,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bz85-launcher-scroll",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                            className: "bz85-app-section",
                            "aria-label": "Your favorite apps",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bz85-section-head",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            children: "Your favorites"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                            lineNumber: 136,
                                            columnNumber: 114
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            className: "bz85-edit-button",
                                            onClick: ()=>setEditing(!editing),
                                            "aria-pressed": editing,
                                            children: editing ? 'Done' : 'Edit'
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                            lineNumber: 136,
                                            columnNumber: 137
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                    lineNumber: 136,
                                    columnNumber: 79
                                }, this),
                                favApps.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bz85-app-grid",
                                    children: favApps.map((app)=>tile(app, true))
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                    lineNumber: 137,
                                    columnNumber: 29
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "bz85-empty",
                                    children: "No matching favorites. Browse the full catalog below."
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                    lineNumber: 137,
                                    columnNumber: 103
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 136,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bz85-section-divider"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 139,
                            columnNumber: 9
                        }, this),
                        showAll || !!filter || editing ? CATEGORY_ORDER.map((category)=>{
                            const section = visible.filter((app)=>app.category === category && (!favorites.includes(app.id) || editing || !!filter));
                            return section.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "bz85-app-section",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bz85-section-head",
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            children: category
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                            lineNumber: 142,
                                            columnNumber: 123
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                        lineNumber: 142,
                                        columnNumber: 88
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bz85-app-grid",
                                        children: section.map((app)=>tile(app, favorites.includes(app.id)))
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                        lineNumber: 142,
                                        columnNumber: 148
                                    }, this)
                                ]
                            }, category, true, {
                                fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                lineNumber: 142,
                                columnNumber: 35
                            }, this) : null;
                        }) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "bz85-show-all",
                            onClick: ()=>setShowAll(true),
                            children: [
                                "Explore all BAZAARA apps ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    "aria-hidden": "true",
                                    children: "↓"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                    lineNumber: 143,
                                    columnNumber: 118
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 143,
                            columnNumber: 14
                        }, this),
                        visible.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "bz85-empty",
                            children: "No apps matched your search."
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 144,
                            columnNumber: 32
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                    lineNumber: 135,
                    columnNumber: 7
                }, this),
                notice && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bz85-live-note",
                    role: "status",
                    children: notice
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                    lineNumber: 146,
                    columnNumber: 18
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bz85-launcher-foot",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "bz85-ribbon-mark",
                            children: "B"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 147,
                            columnNumber: 43
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Connected by BazID"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 147,
                            columnNumber: 86
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                    lineNumber: 147,
                    columnNumber: 7
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
            lineNumber: 132,
            columnNumber: 5
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
        lineNumber: 131,
        columnNumber: 10
    }, this);
}
_s(SearchAppLauncher, "VH0VxKiralmmpPGw0KwpNdepnHw=");
_c = SearchAppLauncher;
var _c;
__turbopack_context__.k.register(_c, "SearchAppLauncher");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/search-web/components/SearchExperience.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SearchExperience",
    ()=>SearchExperience
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$search$2d$web$2f$components$2f$SearchMoments$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/search-web/components/SearchMoments.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$search$2d$web$2f$components$2f$SearchInputTools$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/search-web/components/SearchInputTools.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$search$2d$web$2f$components$2f$searchLocalHistory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/search-web/components/searchLocalHistory.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$search$2d$web$2f$components$2f$SearchAppLauncher$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/search-web/components/SearchAppLauncher.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$search$2d$web$2f$components$2f$SearchSettingsPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/apps/search-web/components/SearchSettingsPanel.tsx [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
;
;
;
;
const REGIONS = [
    {
        code: 'ALL',
        label: 'All regions'
    },
    {
        code: 'NG',
        label: 'Nigeria'
    },
    {
        code: 'GH',
        label: 'Ghana'
    },
    {
        code: 'KE',
        label: 'Kenya'
    },
    {
        code: 'ZA',
        label: 'South Africa'
    },
    {
        code: 'GB',
        label: 'United Kingdom'
    },
    {
        code: 'US',
        label: 'United States'
    },
    {
        code: 'CA',
        label: 'Canada'
    },
    {
        code: 'IN',
        label: 'India'
    }
];
function validRegion(value) {
    const normalized = (value || '').trim().toUpperCase();
    return normalized === 'ALL' || /^[A-Z]{2}$/.test(normalized) ? normalized : 'ALL';
}
function regionLabel(code) {
    if (code === 'ALL') return 'All regions';
    try {
        return new Intl.DisplayNames([
            'en'
        ], {
            type: 'region'
        }).of(code) || code;
    } catch  {
        return REGIONS.find((r)=>r.code === code)?.label || code;
    }
}
function browserRegion() {
    try {
        return validRegion(new Intl.Locale(navigator.language || 'en-US').region);
    } catch  {
        return 'ALL';
    }
}
const REGION_LANGUAGES = {
    NG: [
        'Hausa',
        'Igbo',
        'YorÃ¹bÃ¡',
        'Nigerian Pidgin'
    ],
    GH: [
        'Twi',
        'Ewe',
        'Ga'
    ],
    KE: [
        'Kiswahili'
    ],
    ZA: [
        'isiZulu',
        'isiXhosa',
        'Afrikaans'
    ],
    IN: [
        'à¤¹à¤¿à¤¨à¥à¤¦à¥€',
        'à¦¬à¦¾à¦‚à¦²à¦¾',
        'à°¤à±†à°²à±à°—à±',
        'à¤®à¤°à¤¾à¤ à¥€'
    ],
    CA: [
        'FranÃ§ais'
    ]
};
function regionalLanguages(code) {
    return REGION_LANGUAGES[code] || [];
}
const TABS = [
    {
        id: 'web',
        label: 'All',
        icon: 'globe'
    },
    {
        id: 'images',
        label: 'Images',
        icon: 'image'
    },
    {
        id: 'news',
        label: 'News',
        icon: 'news'
    }
];
function Icon({ name, size = 19 }) {
    const paths = {
        search: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "10.8",
                    cy: "10.8",
                    r: "7.2"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 56,
                    columnNumber: 15
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "m16.2 16.2 5 5"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 56,
                    columnNumber: 53
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 56,
            columnNumber: 13
        }, this),
        globe: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "12",
                    cy: "12",
                    r: "9"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 57,
                    columnNumber: 14
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 57,
                    columnNumber: 45
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 57,
            columnNumber: 12
        }, this),
        image: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "3",
                    y: "4",
                    width: "18",
                    height: "16",
                    rx: "3"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 58,
                    columnNumber: 14
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "8",
                    cy: "9",
                    r: "1.6"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 58,
                    columnNumber: 63
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "m3 17 5-5 4 4 3-3 6 6"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 58,
                    columnNumber: 94
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 58,
            columnNumber: 12
        }, this),
        news: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "4",
                    y: "3",
                    width: "16",
                    height: "18",
                    rx: "2"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 59,
                    columnNumber: 13
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M8 8h8M8 12h8M8 16h5"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 59,
                    columnNumber: 62
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 59,
            columnNumber: 11
        }, this),
        map: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "m3 5 6-2 6 3 6-3v16l-6 2-6-3-6 3V5Zm6-2v15m6-12v15"
            }, void 0, false, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 60,
                columnNumber: 12
            }, this)
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 60,
            columnNumber: 10
        }, this),
        spark: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "m12 2 2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3L12 2Z"
            }, void 0, false, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 61,
                columnNumber: 14
            }, this)
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 61,
            columnNumber: 12
        }, this),
        arrow: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M4 12h16m-7-7 7 7-7 7"
            }, void 0, false, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 62,
                columnNumber: 14
            }, this)
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 62,
            columnNumber: 12
        }, this),
        chevron: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "m6 9 6 6 6-6"
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 62,
            columnNumber: 61
        }, this),
        x: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M5 5 19 19M19 5 5 19"
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 63,
            columnNumber: 8
        }, this),
        filter: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M4 7h16M4 17h16"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 64,
                    columnNumber: 15
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "9",
                    cy: "7",
                    r: "2",
                    fill: "currentColor",
                    stroke: "none"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 64,
                    columnNumber: 42
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "15",
                    cy: "17",
                    r: "2",
                    fill: "currentColor",
                    stroke: "none"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 64,
                    columnNumber: 105
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 64,
            columnNumber: 13
        }, this),
        shield: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "m12 2 8 4v6c0 5-3 8-8 10-5-2-8-5-8-10V6l8-4Z"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 65,
                    columnNumber: 15
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "m8.5 12 2.5 2.5 4.5-5"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 65,
                    columnNumber: 71
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 65,
            columnNumber: 13
        }, this),
        bookmark: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M6 4h12v17l-6-4-6 4V4Z"
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 66,
            columnNumber: 15
        }, this),
        copy: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "8",
                    y: "8",
                    width: "12",
                    height: "12",
                    rx: "2"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 66,
                    columnNumber: 59
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 66,
                    columnNumber: 108
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 66,
            columnNumber: 57
        }, this),
        check: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "m5 12 4 4 10-10"
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 67,
            columnNumber: 12
        }, this),
        menu: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M4 6h16M4 12h16M4 18h16"
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 67,
            columnNumber: 47
        }, this),
        layout: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "3",
                    y: "4",
                    width: "18",
                    height: "16",
                    rx: "2"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 68,
                    columnNumber: 15
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M10 4v16"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 68,
                    columnNumber: 64
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 68,
            columnNumber: 13
        }, this),
        external: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M13 4h7v7M20 4l-9 9"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 69,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M19 14v5H5V5h6"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 69,
                    columnNumber: 48
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 69,
            columnNumber: 15
        }, this),
        clock: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "12",
                    cy: "12",
                    r: "9"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 70,
                    columnNumber: 14
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M12 7v5l3 2"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 70,
                    columnNumber: 45
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 70,
            columnNumber: 12
        }, this),
        mic: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "9",
                    y: "2",
                    width: "6",
                    height: "13",
                    rx: "3"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 71,
                    columnNumber: 12
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M5 11a7 7 0 0 0 14 0M12 18v4m-4 0h8"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 71,
                    columnNumber: 60
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 71,
            columnNumber: 10
        }, this),
        grid: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "3",
                    y: "3",
                    width: "5",
                    height: "5",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 72,
                    columnNumber: 13
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "10",
                    y: "3",
                    width: "5",
                    height: "5",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 72,
                    columnNumber: 60
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "17",
                    y: "3",
                    width: "5",
                    height: "5",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 72,
                    columnNumber: 108
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "3",
                    y: "10",
                    width: "5",
                    height: "5",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 72,
                    columnNumber: 156
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "10",
                    y: "10",
                    width: "5",
                    height: "5",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 72,
                    columnNumber: 204
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "17",
                    y: "10",
                    width: "5",
                    height: "5",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 72,
                    columnNumber: 253
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "3",
                    y: "17",
                    width: "5",
                    height: "5",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 72,
                    columnNumber: 302
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "10",
                    y: "17",
                    width: "5",
                    height: "5",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 72,
                    columnNumber: 350
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "17",
                    y: "17",
                    width: "5",
                    height: "5",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 72,
                    columnNumber: 399
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 72,
            columnNumber: 11
        }, this),
        camera: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M3 7h4l2-3h6l2 3h4v12H3V7Z"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 73,
                    columnNumber: 15
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "12",
                    cy: "13",
                    r: "3.5"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 73,
                    columnNumber: 53
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 73,
            columnNumber: 13
        }, this)
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
        width: size,
        height: size,
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        strokeWidth: "1.8",
        strokeLinecap: "round",
        strokeLinejoin: "round",
        "aria-hidden": "true",
        children: paths[name]
    }, void 0, false, {
        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
        lineNumber: 75,
        columnNumber: 10
    }, this);
}
_c = Icon;
function appUrl(slug, port) {
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    try {
        const overrides = JSON.parse(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_BAZAARA_APP_URLS || '{}');
        if (typeof overrides[slug] === 'string' && /^https:\/\//.test(overrides[slug])) return overrides[slug];
    } catch  {}
    const host = window.location.hostname;
    return [
        'localhost',
        '127.0.0.1',
        '::1'
    ].includes(host) ? `${window.location.protocol}//${host.includes(':') ? `[${host}]` : host}:${port}/` : undefined;
}
function readUrl() {
    const params = new URLSearchParams(window.location.search);
    const requestedCategory = params.get('category');
    const requestedSafety = params.get('safe');
    const requestedCountry = params.get('country')?.toUpperCase();
    const requestedPage = Number(params.get('page') || '1');
    return {
        q: (params.get('q') || '').trim().slice(0, 200),
        category: [
            'web',
            'images',
            'news'
        ].includes(requestedCategory || '') ? requestedCategory : 'web',
        safe: [
            'off',
            'moderate',
            'strict'
        ].includes(requestedSafety || '') ? requestedSafety : 'moderate',
        country: validRegion(requestedCountry),
        page: Number.isInteger(requestedPage) && requestedPage >= 1 && requestedPage <= 10 ? requestedPage : 1
    };
}
function safeResult(raw) {
    if (typeof raw?.title !== 'string' || typeof raw?.url !== 'string') return null;
    try {
        const url = new URL(raw.url);
        if (![
            'https:',
            'http:'
        ].includes(url.protocol) || url.username || url.password) return null;
        return {
            title: raw.title.slice(0, 250),
            url: url.href,
            displayUrl: url.hostname.replace(/^www\./, ''),
            description: typeof raw.description === 'string' ? raw.description.slice(0, 800) : '',
            thumbnail: typeof raw.thumbnail === 'string' && /^https:\/\//i.test(raw.thumbnail) ? raw.thumbnail : null,
            age: typeof raw.age === 'string' ? raw.age.slice(0, 50) : undefined
        };
    } catch  {
        return null;
    }
}
function SearchExperience() {
    _s();
    const [query, setQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [searched, setSearched] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [category, setCategory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('web');
    const [safe, setSafe] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('moderate');
    const [country, setCountry] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('ALL');
    const [regionMeta, setRegionMeta] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        country: 'ALL',
        label: 'Detecting regionâ€¦',
        source: 'unavailable',
        auto: true
    });
    const [autoRegion, setAutoRegion] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [page, setPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [thumbnails] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [moreOpen, setMoreOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [toolsOpen, setToolsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [focusUrl, setFocusUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [launcherOpen, setLauncherOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [settingsOpen, setSettingsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [settingsTab, setSettingsTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('preferences');
    const [pins, setPins] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [notice, setNotice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [addOpen, setAddOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [history, setHistory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [historyEnabled, setHistoryEnabled] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [prefs, setPrefs] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        language: 'auto',
        newTab: true,
        suggestions: true,
        spokenAnswers: false
    });
    const [showSuggestions, setShowSuggestions] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [links, setLinks] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({});
    const [aboutUrl, setAboutUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [voiceOpen, setVoiceOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false), [voiceListening, setVoiceListening] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false), [voiceTranscript, setVoiceTranscript] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(''), [voiceError, setVoiceError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [lensOpen, setLensOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false), [lensMode, setLensMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('similar'), [lensFile, setLensFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null), [lensPreview, setLensPreview] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(''), [lensUrl, setLensUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(''), [lensLoading, setLensLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false), [lensError, setLensError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(''), [lensResult, setLensResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [screen, setScreen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('Home');
    const [dark, setDark] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(true);
    const [discover, setDiscover] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const input = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const controller = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const recognitionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const lensInput = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const search = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SearchExperience.useCallback[search]": async (next, push = true)=>{
            const q = next.q.trim().replace(/\s+/g, ' ').slice(0, 200);
            const requestedPage = next.category === 'images' ? 1 : next.page || 1;
            controller.current?.abort();
            setScreen(q ? 'Search' : 'Home');
            setQuery(q);
            setSearched(q);
            setCategory(next.category);
            setSafe(next.safe);
            setCountry(next.country);
            setPage(requestedPage);
            setFocusUrl(null);
            setData(null);
            setError(null);
            if (!q) {
                setLoading(false);
                if (push) window.history.pushState(null, '', window.location.pathname);
                return;
            }
            const params = new URLSearchParams({
                q,
                category: next.category,
                safe: next.safe,
                country: next.country,
                page: String(requestedPage)
            });
            if (push) {
                window.history.pushState(null, '', `?${params}`);
                // Optional local history, off by default. No server-side history added.
                try {
                    setHistory((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$search$2d$web$2f$components$2f$searchLocalHistory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["recordHistory"])({
                        q,
                        category: next.category,
                        at: Date.now()
                    }));
                } catch  {}
            }
            const task = new AbortController();
            controller.current = task;
            setLoading(true);
            try {
                const response = await fetch(`/api/search?${params}`, {
                    signal: task.signal,
                    cache: 'no-store',
                    credentials: 'same-origin'
                });
                const body = await response.json();
                if (task.signal.aborted) return;
                if (!response.ok) {
                    const reason = body;
                    setError({
                        code: typeof reason.code === 'string' ? reason.code : 'SEARCH_FAILED',
                        message: typeof reason.message === 'string' ? reason.message : 'The search provider is unavailable.'
                    });
                    return;
                }
                const parsed = body;
                setData({
                    results: Array.isArray(parsed.results) ? parsed.results.map(safeResult).filter({
                        "SearchExperience.useCallback[search]": (r)=>r !== null
                    }["SearchExperience.useCallback[search]"]) : [],
                    hasMore: parsed.hasMore === true,
                    provider: typeof parsed.provider === 'string' ? parsed.provider : 'connected provider',
                    privacy: parsed.privacy
                });
            } catch  {
                if (!task.signal.aborted) setError({
                    code: 'NETWORK_ERROR',
                    message: 'Could not reach the search service. Check its connection and try again.'
                });
            } finally{
                if (!task.signal.aborted) setLoading(false);
            }
        }
    }["SearchExperience.useCallback[search]"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SearchExperience.useEffect": ()=>{
            setLinks(Object.fromEntries([
                [
                    'bmap',
                    3038
                ],
                [
                    'translate',
                    3039
                ],
                [
                    'news',
                    3040
                ],
                [
                    'bazlens',
                    3041
                ],
                [
                    'workspace',
                    3021
                ],
                [
                    'shopping',
                    3003
                ],
                [
                    'bazid',
                    3004
                ],
                [
                    'bazclips',
                    3014
                ],
                [
                    'learn',
                    3048
                ],
                [
                    'bmail',
                    3036
                ]
            ].map({
                "SearchExperience.useEffect": ([slug, port])=>[
                        slug,
                        appUrl(slug, port)
                    ]
            }["SearchExperience.useEffect"]).filter({
                "SearchExperience.useEffect": (pair)=>typeof pair[1] === 'string'
            }["SearchExperience.useEffect"])));
            try {
                setHistory((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$search$2d$web$2f$components$2f$searchLocalHistory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["readHistory"])());
                setHistoryEnabled(localStorage.getItem(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$search$2d$web$2f$components$2f$searchLocalHistory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HISTORY_OPTIN_KEY"]) === 'on');
                setPrefs((0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$search$2d$web$2f$components$2f$searchLocalHistory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["readPrefs"])());
            } catch  {}
            try {
                const savedTheme = localStorage.getItem('bazaara-search-theme-v5');
                setDark(savedTheme !== 'light');
                const storedSafe = localStorage.getItem('bazaara-search-safety-v85');
                if (storedSafe && [
                    'off',
                    'moderate',
                    'strict'
                ].includes(storedSafe) && !new URLSearchParams(window.location.search).has('safe')) setSafe(storedSafe);
            } catch  {}
            try {
                const stored = JSON.parse(localStorage.getItem('bazaara-search-saved-v2') || '[]');
                if (Array.isArray(stored)) setPins(stored.filter({
                    "SearchExperience.useEffect": (p)=>!!p && typeof p.title === 'string' && typeof p.url === 'string' && typeof p.displayUrl === 'string'
                }["SearchExperience.useEffect"]).slice(0, 40));
            } catch  {}
            const sync = {
                "SearchExperience.useEffect.sync": ()=>{
                    const state = readUrl();
                    void search(state, false);
                }
            }["SearchExperience.useEffect.sync"];
            sync();
            window.addEventListener('popstate', sync);
            const keys = {
                "SearchExperience.useEffect.keys": (event)=>{
                    const target = event.target;
                    if (event.altKey && event.key.toLowerCase() === 'i') {
                        event.preventDefault();
                        setLauncherOpen({
                            "SearchExperience.useEffect.keys": (value)=>!value
                        }["SearchExperience.useEffect.keys"]);
                        setSettingsOpen(false);
                    }
                    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
                        event.preventDefault();
                        input.current?.focus();
                        input.current?.select();
                    }
                    if (event.key === '/' && !event.ctrlKey && !event.metaKey && ![
                        'INPUT',
                        'TEXTAREA'
                    ].includes(target?.tagName || '')) {
                        event.preventDefault();
                        input.current?.focus();
                    }
                    if (event.key === 'Escape') {
                        setLauncherOpen(false);
                        setSettingsOpen(false);
                        setMoreOpen(false);
                        setToolsOpen(false);
                    }
                }
            }["SearchExperience.useEffect.keys"];
            window.addEventListener('keydown', keys);
            return ({
                "SearchExperience.useEffect": ()=>{
                    window.removeEventListener('popstate', sync);
                    window.removeEventListener('keydown', keys);
                    controller.current?.abort();
                }
            })["SearchExperience.useEffect"];
        }
    }["SearchExperience.useEffect"], [
        search
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SearchExperience.useEffect": ()=>{
            let active = true;
            void fetch('/api/discover', {
                cache: 'no-store'
            }).then({
                "SearchExperience.useEffect": async (r)=>r.ok ? await r.json() : null
            }["SearchExperience.useEffect"]).then({
                "SearchExperience.useEffect": (data)=>{
                    if (!active || !Array.isArray(data?.articles)) return;
                    setDiscover(data.articles.filter({
                        "SearchExperience.useEffect": (a)=>a && typeof a.title === 'string' && /^https:\/\//.test(a.url)
                    }["SearchExperience.useEffect"]).slice(0, 6));
                }
            }["SearchExperience.useEffect"]).catch({
                "SearchExperience.useEffect": ()=>{}
            }["SearchExperience.useEffect"]);
            return ({
                "SearchExperience.useEffect": ()=>{
                    active = false;
                }
            })["SearchExperience.useEffect"];
        }
    }["SearchExperience.useEffect"], []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SearchExperience.useEffect": ()=>{
            let active = true;
            void fetch('/api/region', {
                cache: 'no-store',
                credentials: 'same-origin'
            }).then({
                "SearchExperience.useEffect": async (r)=>r.ok ? await r.json() : null
            }["SearchExperience.useEffect"]).then({
                "SearchExperience.useEffect": (raw)=>{
                    if (!active) return;
                    let detected = validRegion(typeof raw?.country === 'string' ? raw.country : '');
                    let source = raw?.source === 'edge-ip' || raw?.source === 'geoip' ? raw.source : 'unavailable';
                    if (detected === 'ALL') {
                        const fallback = browserRegion();
                        if (fallback !== 'ALL') {
                            detected = fallback;
                            source = 'browser-locale';
                        }
                    }
                    const meta = {
                        country: detected,
                        label: regionLabel(detected),
                        source,
                        auto: true
                    };
                    setRegionMeta(meta);
                    const explicit = new URLSearchParams(window.location.search).has('country');
                    let mode = 'auto';
                    let savedCountry = 'ALL';
                    try {
                        mode = localStorage.getItem('bazaara-search-region-mode-v85') || 'auto';
                        savedCountry = validRegion(localStorage.getItem('bazaara-search-country-v85'));
                    } catch  {}
                    if (mode === 'manual') {
                        setAutoRegion(false);
                        if (!explicit) {
                            setCountry(savedCountry);
                            const state = readUrl();
                            if (state.q) void search({
                                ...state,
                                country: savedCountry
                            }, false);
                        }
                    } else if (!explicit && detected !== 'ALL') {
                        setCountry(detected);
                        setAutoRegion(true);
                        const state = readUrl();
                        if (state.q) void search({
                            ...state,
                            country: detected
                        }, false);
                    }
                }
            }["SearchExperience.useEffect"]).catch({
                "SearchExperience.useEffect": ()=>{
                    if (!active) return;
                    const fallback = browserRegion();
                    setRegionMeta({
                        country: fallback,
                        label: regionLabel(fallback),
                        source: fallback === 'ALL' ? 'unavailable' : 'browser-locale',
                        auto: true
                    });
                    let mode = 'auto';
                    let savedCountry = 'ALL';
                    try {
                        mode = localStorage.getItem('bazaara-search-region-mode-v85') || 'auto';
                        savedCountry = validRegion(localStorage.getItem('bazaara-search-country-v85'));
                    } catch  {}
                    if (mode === 'manual') {
                        setAutoRegion(false);
                        setCountry(savedCountry);
                    } else if (fallback !== 'ALL') {
                        setCountry(fallback);
                        const state = readUrl();
                        if (state.q) void search({
                            ...state,
                            country: fallback
                        }, false);
                    }
                }
            }["SearchExperience.useEffect"]);
            return ({
                "SearchExperience.useEffect": ()=>{
                    active = false;
                }
            })["SearchExperience.useEffect"];
        }
    }["SearchExperience.useEffect"], [
        search
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SearchExperience.useEffect": ()=>{
            if (!lensFile) {
                setLensPreview('');
                return;
            }
            const url = URL.createObjectURL(lensFile);
            setLensPreview(url);
            return ({
                "SearchExperience.useEffect": ()=>URL.revokeObjectURL(url)
            })["SearchExperience.useEffect"];
        }
    }["SearchExperience.useEffect"], [
        lensFile
    ]);
    const results = data?.results || [];
    const selected = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SearchExperience.useMemo[selected]": ()=>results.find({
                "SearchExperience.useMemo[selected]": (r)=>r.url === focusUrl
            }["SearchExperience.useMemo[selected]"]) || results[0] || null
    }["SearchExperience.useMemo[selected]"], [
        results,
        focusUrl
    ]);
    const aboutResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SearchExperience.useMemo[aboutResult]": ()=>results.find({
                "SearchExperience.useMemo[aboutResult]": (r)=>r.url === aboutUrl
            }["SearchExperience.useMemo[aboutResult]"]) || null
    }["SearchExperience.useMemo[aboutResult]"], [
        results,
        aboutUrl
    ]);
    function voiceSearch() {
        setVoiceOpen(true);
        setVoiceError('');
        setVoiceTranscript('');
        const browser = window;
        const Recognition = browser.SpeechRecognition || browser.webkitSpeechRecognition;
        if (!Recognition) {
            setVoiceError('Voice search is unavailable in this browser. Try a current Chromium browser or type your query.');
            return;
        }
        try {
            const recognition = new Recognition();
            recognition.lang = prefs.language === 'auto' ? navigator.language || 'en-US' : prefs.language;
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.onstart = ()=>setVoiceListening(true);
            recognition.onresult = (e)=>{
                let text = '';
                for(let i = 0; i < e.results.length; i++)text += (e.results[i]?.[0]?.transcript || '') + ' ';
                setVoiceTranscript(text.trim().slice(0, 200));
            };
            recognition.onerror = (e)=>{
                setVoiceListening(false);
                setVoiceError(e.error === 'not-allowed' ? 'Microphone permission was denied. Allow microphone access in your browser settings and try again.' : 'Voice recognition stopped before a query was captured.');
            };
            recognition.onend = ()=>setVoiceListening(false);
            recognitionRef.current = recognition;
            recognition.start();
        } catch  {
            setVoiceError('Could not start voice recognition.');
        }
    }
    function closeVoice() {
        recognitionRef.current?.abort?.();
        recognitionRef.current = null;
        setVoiceListening(false);
        setVoiceOpen(false);
    }
    function submitVoice() {
        const spoken = voiceTranscript.trim();
        if (!spoken) return;
        setQuery(spoken);
        closeVoice();
        void search({
            q: spoken,
            category,
            safe,
            country
        });
    }
    function chooseLensFile(candidate) {
        if (!candidate) return;
        setLensError('');
        setLensResult(null);
        if (![
            'image/png',
            'image/jpeg',
            'image/webp',
            'image/gif'
        ].includes(candidate.type)) {
            setLensError('Choose a PNG, JPEG, WebP or GIF image.');
            return;
        }
        if (candidate.size > 8 * 1024 * 1024) {
            setLensError('Choose an image smaller than 8 MB.');
            return;
        }
        setLensFile(candidate);
    }
    async function importLensUrl() {
        const raw = lensUrl.trim();
        if (!raw) return;
        setLensError('');
        try {
            const parsed = new URL(raw);
            if (parsed.protocol !== 'https:') throw Error('Use an HTTPS image URL.');
            const response = await fetch(parsed.href, {
                mode: 'cors',
                credentials: 'omit',
                referrerPolicy: 'no-referrer'
            });
            if (!response.ok) throw Error('The image host did not allow this request.');
            const blob = await response.blob();
            if (!blob.type.startsWith('image/')) throw Error('That URL did not return an image.');
            if (blob.size > 8 * 1024 * 1024) throw Error('The image is larger than 8 MB.');
            chooseLensFile(new File([
                blob
            ], `linked-image.${blob.type.split('/')[1] || 'jpg'}`, {
                type: blob.type
            }));
        } catch (e) {
            setLensError(e instanceof Error ? e.message : 'Could not import that image URL.');
        }
    }
    async function analyzeLens() {
        if (!lensFile) {
            setLensError('Choose an image first.');
            return;
        }
        setLensLoading(true);
        setLensError('');
        setLensResult(null);
        try {
            const form = new FormData();
            form.append('image', lensFile);
            form.append('mode', lensMode);
            const response = await fetch('/api/lens/analyze', {
                method: 'POST',
                body: form,
                credentials: 'same-origin'
            });
            const body = await response.json();
            if (!response.ok) throw Error(body.message || 'BazLens analysis is unavailable.');
            const parsed = {
                labels: Array.isArray(body.labels) ? body.labels.filter((x)=>typeof x === 'string').slice(0, 20) : [],
                text: typeof body.text === 'string' ? body.text.slice(0, 10000) : '',
                matches: Array.isArray(body.matches) ? body.matches.filter((x)=>!!x && typeof x.title === 'string' && typeof x.url === 'string').slice(0, 8) : []
            };
            setLensResult(parsed);
        } catch (e) {
            setLensError(e instanceof Error ? e.message : 'BazLens analysis failed.');
        } finally{
            setLensLoading(false);
        }
    }
    function closeLens() {
        setLensOpen(false);
        setLensError('');
        setLensResult(null);
    }
    function submit(event) {
        event.preventDefault();
        setShowSuggestions(false);
        void search({
            q: query,
            category,
            safe,
            country
        });
    }
    function tab(value) {
        setMoreOpen(false);
        setToolsOpen(false);
        setCategory(value);
        if (searched) void search({
            q: searched,
            category: value,
            safe,
            country
        });
    }
    function save(result) {
        const next = pins.some((p)=>p.url === result.url) ? pins.filter((p)=>p.url !== result.url) : [
            {
                title: result.title,
                url: result.url,
                displayUrl: result.displayUrl
            },
            ...pins
        ].slice(0, 40);
        setPins(next);
        try {
            localStorage.setItem('bazaara-search-saved-v2', JSON.stringify(next));
        } catch  {
            setNotice('Browser storage is unavailable; saved links will not persist.');
        }
    }
    async function share(value) {
        try {
            await navigator.clipboard.writeText(value);
            setNotice('Link copied.');
        } catch  {
            setNotice('Copy is unavailable in this browser.');
        }
    }
    function openSettings(tab) {
        setLauncherOpen(false);
        setAddOpen(false);
        setSettingsTab(tab);
        setSettingsOpen(true);
    }
    function changeTheme(next) {
        setDark(next);
        try {
            localStorage.setItem('bazaara-search-theme-v5', next ? 'dark' : 'light');
        } catch  {}
    }
    function changeSafety(next) {
        setSafe(next);
        try {
            localStorage.setItem('bazaara-search-safety-v85', next);
        } catch  {}
        if (searched) void search({
            q: searched,
            category,
            safe: next,
            country
        });
    }
    function changeAutoRegion(next) {
        setAutoRegion(next);
        try {
            localStorage.setItem('bazaara-search-region-mode-v85', next ? 'auto' : 'manual');
        } catch  {}
        if (next) {
            const detected = regionMeta.country;
            setCountry(detected);
            if (searched) void search({
                q: searched,
                category,
                safe,
                country: detected
            });
        }
    }
    function changeCountry(next) {
        setAutoRegion(false);
        setCountry(next);
        try {
            localStorage.setItem('bazaara-search-region-mode-v85', 'manual');
            localStorage.setItem('bazaara-search-country-v85', next);
        } catch  {}
        if (searched) void search({
            q: searched,
            category,
            safe,
            country: next
        });
    }
    function clearBrowserPins() {
        setPins([]);
        try {
            localStorage.removeItem('bazaara-search-saved-v2');
            setNotice('Browser-saved results deleted.');
        } catch  {
            setNotice('Could not clear browser storage.');
        }
    }
    function updatePrefs(value) {
        setPrefs(value);
        try {
            localStorage.setItem(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$search$2d$web$2f$components$2f$searchLocalHistory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SEARCH_PREFS_KEY"], JSON.stringify(value));
        } catch  {
            setNotice('Browser settings cannot be saved in this session.');
        }
    }
    function toggleHistory(enabled) {
        setHistoryEnabled(enabled);
        try {
            localStorage.setItem(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$search$2d$web$2f$components$2f$searchLocalHistory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HISTORY_OPTIN_KEY"], enabled ? 'on' : 'off');
        } catch  {
            setNotice('Browser storage unavailable; history consent cannot be saved.');
            setHistoryEnabled(false);
        }
    }
    function clearHistory() {
        setHistory([]);
        try {
            localStorage.removeItem(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$search$2d$web$2f$components$2f$searchLocalHistory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HISTORY_KEY"]);
            setNotice('Local search history cleared.');
        } catch  {
            setNotice('Unable to clear browser storage.');
        }
    }
    function exportLocal() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$search$2d$web$2f$components$2f$searchLocalHistory$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["exportLocalSearchData"])(history, pins, prefs);
    }
    function speakExcerpt(text) {
        if (("TURBOPACK compile-time value", "object") === 'undefined' || !('speechSynthesis' in window)) {
            setNotice('Spoken excerpts are unavailable in this browser.');
            return;
        }
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text.slice(0, 450));
        utterance.lang = prefs.language === 'auto' ? navigator.language || 'en-US' : prefs.language;
        window.speechSynthesis.speak(utterance);
    }
    function aiStudioUrl() {
        try {
            const value = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_BAZAARA_AI_STUDIO_URL;
            if (!value) return;
            const url = new URL(value);
            if (url.protocol === 'https:' && !url.username && !url.password) return url.href;
        } catch  {}
        return undefined;
    }
    const closeLauncher = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SearchExperience.useCallback[closeLauncher]": ()=>setLauncherOpen(false)
    }["SearchExperience.useCallback[closeLauncher]"], []);
    const closeSettings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "SearchExperience.useCallback[closeSettings]": ()=>setSettingsOpen(false)
    }["SearchExperience.useCallback[closeSettings]"], []);
    const hasQuery = searched.length > 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-theme": dark ? 'dark' : 'light',
        className: `bzs bzs-v5 bz82-google-nav ${!hasQuery ? 'bz84-home' : 'bz84-results'}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bzs-shell",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                        className: "bzs-header",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: "/",
                                className: "bzs-v5-brand",
                                "aria-label": "BAZAARA Search home",
                                children: "BAZAARA"
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 228,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bzs-header-actions",
                                children: [
                                    !hasQuery && category === 'web' && links.bmail && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        className: "bz84-head-link",
                                        href: links.bmail,
                                        children: "BMail"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 230,
                                        columnNumber: 60
                                    }, this),
                                    !hasQuery && category === 'web' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "bz84-head-link",
                                        onClick: ()=>setCategory('images'),
                                        children: "Images"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 231,
                                        columnNumber: 45
                                    }, this),
                                    !hasQuery && category === 'images' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "bz84-head-link",
                                        onClick: ()=>setCategory('web'),
                                        children: "Search"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 232,
                                        columnNumber: 48
                                    }, this),
                                    hasQuery && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "bz85-head-settings",
                                        "aria-label": "Search settings",
                                        onClick: ()=>openSettings('preferences'),
                                        children: "Settings"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 233,
                                        columnNumber: 24
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "bzs-v5-apps",
                                        "aria-label": "BAZAARA apps",
                                        "aria-expanded": launcherOpen,
                                        "aria-haspopup": "dialog",
                                        onClick: ()=>{
                                            setLauncherOpen((v)=>!v);
                                            setSettingsOpen(false);
                                        },
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                            name: "grid",
                                            size: 20
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 234,
                                            columnNumber: 198
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 234,
                                        columnNumber: 11
                                    }, this),
                                    links.bazid ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        className: "bzs-avatar",
                                        href: links.bazid + 'account',
                                        "aria-label": "BazID account",
                                        children: "B"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 235,
                                        columnNumber: 24
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "bzs-avatar",
                                        "aria-label": "BazID account settings",
                                        onClick: ()=>openSettings('privacy'),
                                        children: "B"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 235,
                                        columnNumber: 112
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 229,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 227,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: "bzs-main",
                        children: [
                            (screen === 'Home' || screen === 'Search') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `bzs-intro ${hasQuery ? 'bzs-intro-compact' : ''}`,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                                    children: hasQuery ? 'Search' : 'BAZAARA'
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 240,
                                                    columnNumber: 82
                                                }, this),
                                                !hasQuery && category === 'images' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "bz84-product-label",
                                                    children: "images"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 240,
                                                    columnNumber: 161
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 240,
                                            columnNumber: 77
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 240,
                                        columnNumber: 9
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                        className: "bzs-search-area",
                                        "aria-label": category === 'images' ? 'Search images' : 'Search the web',
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                                className: "bzs-search-form",
                                                onSubmit: submit,
                                                role: "search",
                                                children: [
                                                    !hasQuery && category === 'web' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: "bz84-add",
                                                        type: "button",
                                                        "aria-label": "Add image, document or AI tool",
                                                        title: "Add to Search",
                                                        onClick: ()=>{
                                                            setAddOpen(true);
                                                            setShowSuggestions(false);
                                                        },
                                                        children: "+"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 243,
                                                        columnNumber: 46
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                        name: "search",
                                                        size: 24
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 243,
                                                        columnNumber: 228
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        ref: input,
                                                        value: query,
                                                        onFocus: ()=>setShowSuggestions(true),
                                                        onBlur: ()=>window.setTimeout(()=>setShowSuggestions(false), 175),
                                                        onPaste: (e)=>{
                                                            const file = Array.from(e.clipboardData.files).find((f)=>f.type.startsWith('image/'));
                                                            if (file) {
                                                                e.preventDefault();
                                                                chooseLensFile(file);
                                                                setLensOpen(true);
                                                                setShowSuggestions(false);
                                                            }
                                                        },
                                                        onChange: (e)=>setQuery(e.target.value),
                                                        placeholder: category === 'images' ? 'Search images' : 'Search the web',
                                                        "aria-label": category === 'images' ? 'Search images' : 'Search the web',
                                                        name: "q",
                                                        maxLength: 200,
                                                        autoComplete: "off",
                                                        spellCheck: false,
                                                        enterKeyHint: "search"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 244,
                                                        columnNumber: 13
                                                    }, this),
                                                    query && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: "bzs-clear",
                                                        type: "button",
                                                        title: "Clear input",
                                                        "aria-label": "Clear input",
                                                        onClick: ()=>{
                                                            setQuery('');
                                                            input.current?.focus();
                                                        },
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                            name: "x",
                                                            size: 18
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 245,
                                                            columnNumber: 170
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 245,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: "bzs-voice",
                                                        type: "button",
                                                        "aria-label": "Voice search",
                                                        title: "Voice search",
                                                        onClick: voiceSearch,
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                            name: "mic",
                                                            size: 18
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 246,
                                                            columnNumber: 126
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 246,
                                                        columnNumber: 13
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: "bzs-camera",
                                                        type: "button",
                                                        "aria-label": "Search with BazLens",
                                                        title: "Search with an image",
                                                        onClick: ()=>{
                                                            setLensOpen(true);
                                                            setLensError('');
                                                        },
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                            name: "camera",
                                                            size: 19
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 247,
                                                            columnNumber: 172
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 247,
                                                        columnNumber: 13
                                                    }, this),
                                                    !hasQuery && category === 'web' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: "bz84-ai-chip",
                                                        type: "button",
                                                        onClick: ()=>setNotice('AI Mode requires a connected AI provider. BAZAARA will not fabricate AI answers while it is disconnected.'),
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                name: "spark",
                                                                size: 17
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 248,
                                                                columnNumber: 227
                                                            }, this),
                                                            " AI Mode"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 248,
                                                        columnNumber: 47
                                                    }, this),
                                                    hasQuery && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: "bzs-go",
                                                        type: "submit",
                                                        "aria-label": "Search",
                                                        disabled: loading,
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                            name: "arrow",
                                                            size: 22
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 249,
                                                            columnNumber: 106
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 249,
                                                        columnNumber: 26
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 242,
                                                columnNumber: 11
                                            }, this),
                                            showSuggestions && prefs.suggestions && historyEnabled && history.length > 0 && !hasQuery && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bz86-suggestions",
                                                role: "listbox",
                                                "aria-label": "Recent local searches",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                                                        children: [
                                                            "Recent searches ",
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                type: "button",
                                                                onMouseDown: (e)=>e.preventDefault(),
                                                                onClick: ()=>openSettings('history'),
                                                                children: "Manage"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 251,
                                                                columnNumber: 201
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 251,
                                                        columnNumber: 177
                                                    }, this),
                                                    history.filter((h)=>!query || h.q.toLowerCase().includes(query.toLowerCase())).slice(0, 5).map((h)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            type: "button",
                                                            role: "option",
                                                            "aria-selected": false,
                                                            onMouseDown: (e)=>e.preventDefault(),
                                                            onClick: ()=>{
                                                                setShowSuggestions(false);
                                                                void search({
                                                                    q: h.q,
                                                                    category: h.category,
                                                                    safe,
                                                                    country
                                                                });
                                                            },
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    children: "â—·"
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                    lineNumber: 251,
                                                                    columnNumber: 635
                                                                }, this),
                                                                h.q,
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                    children: h.category
                                                                }, void 0, false, {
                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                    lineNumber: 251,
                                                                    columnNumber: 656
                                                                }, this)
                                                            ]
                                                        }, `${h.q}-${h.category}`, true, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 251,
                                                            columnNumber: 415
                                                        }, this))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 251,
                                                columnNumber: 93
                                            }, this),
                                            hasQuery && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bzs-toolbar bz82-toolbar",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bzs-tabs bz82-search-nav",
                                                    role: "tablist",
                                                    "aria-label": "Search category",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            className: "bzs-v5-ai",
                                                            type: "button",
                                                            disabled: true,
                                                            title: "AI Mode requires a separately connected AI provider",
                                                            children: "AI Mode"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 252,
                                                            columnNumber: 152
                                                        }, this),
                                                        TABS.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                role: "tab",
                                                                "aria-selected": category === t.id,
                                                                className: category === t.id ? 'bzs-tab-active' : '',
                                                                onClick: ()=>tab(t.id),
                                                                children: t.label
                                                            }, t.id, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 252,
                                                                columnNumber: 296
                                                            }, this)),
                                                        links.bazclips && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                            href: links.bazclips,
                                                            children: "Videos"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 252,
                                                            columnNumber: 469
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "bz82-nav-menu",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    type: "button",
                                                                    className: moreOpen ? 'bz82-nav-trigger is-open' : 'bz82-nav-trigger',
                                                                    "aria-expanded": moreOpen,
                                                                    "aria-haspopup": "menu",
                                                                    onClick: ()=>{
                                                                        setMoreOpen((v)=>!v);
                                                                        setToolsOpen(false);
                                                                    },
                                                                    children: [
                                                                        "More ",
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                            name: "chevron",
                                                                            size: 13
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 252,
                                                                            columnNumber: 732
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                    lineNumber: 252,
                                                                    columnNumber: 536
                                                                }, this),
                                                                moreOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "bz82-menu",
                                                                    role: "menu",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                            type: "button",
                                                                            role: "menuitem",
                                                                            onClick: ()=>tab('web'),
                                                                            children: "Web"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 252,
                                                                            columnNumber: 823
                                                                        }, this),
                                                                        links.bmap && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                            role: "menuitem",
                                                                            href: links.bmap,
                                                                            children: "BMap"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 252,
                                                                            columnNumber: 911
                                                                        }, this),
                                                                        links.shopping && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                            role: "menuitem",
                                                                            href: links.shopping,
                                                                            children: "Shopping"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 252,
                                                                            columnNumber: 974
                                                                        }, this),
                                                                        links.learn && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                            role: "menuitem",
                                                                            href: links.learn,
                                                                            children: "Books"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 252,
                                                                            columnNumber: 1042
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                    lineNumber: 252,
                                                                    columnNumber: 784
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 252,
                                                            columnNumber: 505
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "bz82-nav-menu",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    type: "button",
                                                                    className: toolsOpen ? 'bz82-nav-trigger is-open' : 'bz82-nav-trigger',
                                                                    "aria-expanded": toolsOpen,
                                                                    "aria-haspopup": "menu",
                                                                    onClick: ()=>{
                                                                        setToolsOpen((v)=>!v);
                                                                        setMoreOpen(false);
                                                                    },
                                                                    children: [
                                                                        "Tools ",
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                            name: "chevron",
                                                                            size: 13
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 252,
                                                                            columnNumber: 1333
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                    lineNumber: 252,
                                                                    columnNumber: 1134
                                                                }, this),
                                                                toolsOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "bz82-menu bz82-tools-menu",
                                                                    role: "menu",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "bz82-tools-row",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    children: "SafeSearch"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 252,
                                                                                    columnNumber: 1473
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                                                    "aria-label": "SafeSearch",
                                                                                    value: safe,
                                                                                    onChange: (e)=>{
                                                                                        const next = e.target.value;
                                                                                        setSafe(next);
                                                                                        if (searched) void search({
                                                                                            q: searched,
                                                                                            category,
                                                                                            safe: next,
                                                                                            country
                                                                                        });
                                                                                    },
                                                                                    children: [
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                            value: "strict",
                                                                                            children: "Strict"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                            lineNumber: 252,
                                                                                            columnNumber: 1673
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                            value: "moderate",
                                                                                            children: "Moderate"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                            lineNumber: 252,
                                                                                            columnNumber: 1711
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                            value: "off",
                                                                                            children: "Off"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                            lineNumber: 252,
                                                                                            columnNumber: 1753
                                                                                        }, this)
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 252,
                                                                                    columnNumber: 1496
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 252,
                                                                            columnNumber: 1441
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "bz82-tools-region",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    children: "Search region"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 252,
                                                                                    columnNumber: 1835
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                                    children: regionMeta.country === 'ALL' ? 'Automatic' : regionMeta.label
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 252,
                                                                                    columnNumber: 1861
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                                    children: regionMeta.source === 'edge-ip' || regionMeta.source === 'geoip' ? 'Detected automatically from your network country' : regionMeta.source === 'browser-locale' ? 'Local fallback from browser locale' : 'Automatic country detection will apply when IP-aware deployment data is available'
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 252,
                                                                                    columnNumber: 1935
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 252,
                                                                            columnNumber: 1800
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                    lineNumber: 252,
                                                                    columnNumber: 1386
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 252,
                                                            columnNumber: 1103
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 252,
                                                    columnNumber: 66
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 252,
                                                columnNumber: 24
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 241,
                                        columnNumber: 9
                                    }, this),
                                    !hasQuery && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                        className: "bz84-home-actions",
                                        "aria-label": "Search actions",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bz84-buttons",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: ()=>{
                                                            const q = query.trim();
                                                            if (q) void search({
                                                                q,
                                                                category,
                                                                safe,
                                                                country
                                                            });
                                                        },
                                                        disabled: !query.trim(),
                                                        children: "Bazaara Search"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 256,
                                                        columnNumber: 13
                                                    }, this),
                                                    links.news && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                        href: links.news,
                                                        children: "Explore"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 257,
                                                        columnNumber: 28
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 255,
                                                columnNumber: 11
                                            }, this),
                                            regionalLanguages(regionMeta.country).length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "bz84-languages",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Regional languages:"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 259,
                                                        columnNumber: 92
                                                    }, this),
                                                    regionalLanguages(regionMeta.country).map((language)=>links.translate ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                            href: links.translate,
                                                            title: `Open BAZAARA Translate for ${language}`,
                                                            children: language
                                                        }, language, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 259,
                                                            columnNumber: 193
                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: language
                                                        }, language, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 259,
                                                            columnNumber: 298
                                                        }, this))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 259,
                                                columnNumber: 62
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 254,
                                        columnNumber: 23
                                    }, this),
                                    !hasQuery && category === 'web' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$search$2d$web$2f$components$2f$SearchMoments$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SearchMoments"], {
                                        onSearch: (q)=>{
                                            setQuery(q);
                                            void search({
                                                q,
                                                category: 'web',
                                                safe,
                                                country
                                            });
                                        }
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 261,
                                        columnNumber: 39
                                    }, this),
                                    !hasQuery && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                                        className: "bz84-home-footer",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: regionMeta.country === 'ALL' ? 'Region automatic' : regionMeta.label
                                            }, void 0, false, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 262,
                                                columnNumber: 60
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                                                "aria-label": "Search footer",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        className: "bz85-footer-control",
                                                        onClick: ()=>openSettings('privacy'),
                                                        children: "Privacy"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 262,
                                                        columnNumber: 173
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        className: "bz85-footer-control",
                                                        onClick: ()=>openSettings('preferences'),
                                                        children: "Settings"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 262,
                                                        columnNumber: 281
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 262,
                                                columnNumber: 141
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 262,
                                        columnNumber: 23
                                    }, this),
                                    hasQuery && screen === 'Search' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                        className: "bzs-response",
                                        "aria-live": "polite",
                                        "aria-busy": loading,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bzs-results-heading",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: loading ? 'Finding sourcesâ€¦' : error ? 'Search could not complete' : data ? `${results.length} results on this page` : 'Preparing results'
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 264,
                                                        columnNumber: 48
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: ()=>void share(window.location.href),
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                name: "copy",
                                                                size: 14
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 264,
                                                                columnNumber: 262
                                                            }, this),
                                                            " Copy search link"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 264,
                                                        columnNumber: 191
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 264,
                                                columnNumber: 11
                                            }, this),
                                            loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bzs-loading",
                                                role: "status",
                                                children: [
                                                    1,
                                                    2,
                                                    3
                                                ].map((n)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 265,
                                                                columnNumber: 95
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 265,
                                                                columnNumber: 102
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 265,
                                                                columnNumber: 109
                                                            }, this)
                                                        ]
                                                    }, n, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 265,
                                                        columnNumber: 82
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 265,
                                                columnNumber: 23
                                            }, this),
                                            !loading && error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bzs-error",
                                                role: "alert",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "bzs-error-icon",
                                                        children: "!"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 266,
                                                        columnNumber: 73
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                        children: error.code === 'PROVIDER_NOT_CONFIGURED' ? 'BAZAARA Search engine unavailable' : 'Search is temporarily unavailable'
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 266,
                                                        columnNumber: 114
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        children: error.message
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 266,
                                                        columnNumber: 235
                                                    }, this),
                                                    error.code === 'PROVIDER_NOT_CONFIGURED' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "bzs-setup",
                                                        children: [
                                                            "Configure ",
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                                                children: "BAZAARA_SEARCH_API"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 266,
                                                                columnNumber: 335
                                                            }, this),
                                                            " on Search API port 4020; BAZAARA will never invent search results while disconnected."
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 266,
                                                        columnNumber: 300
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>void search({
                                                                q: searched,
                                                                category,
                                                                safe,
                                                                country,
                                                                page
                                                            }),
                                                        children: [
                                                            "Retry search ",
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                name: "arrow",
                                                                size: 16
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 266,
                                                                columnNumber: 545
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 266,
                                                        columnNumber: 457
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 266,
                                                columnNumber: 33
                                            }, this),
                                            !loading && data && results.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bzs-error",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                        children: "No matching sources"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 267,
                                                        columnNumber: 81
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        children: "Try a different query, region or result category."
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 267,
                                                        columnNumber: 109
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 267,
                                                columnNumber: 54
                                            }, this),
                                            !loading && data && results.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bzs-columns",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "bzs-result-column",
                                                        children: [
                                                            category === 'web' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                                                className: "bzs-source-brief",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "bzs-brief-label",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "bzs-brief-spark",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                                    name: "spark",
                                                                                    size: 18
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 269,
                                                                                    columnNumber: 139
                                                                                }, this)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 269,
                                                                                columnNumber: 105
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                children: "SOURCE FOCUS"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 269,
                                                                                columnNumber: 176
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "bzs-evidence-badge",
                                                                                children: "From live results"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 269,
                                                                                columnNumber: 201
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 269,
                                                                        columnNumber: 72
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                                        children: results[0]?.title
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 269,
                                                                        columnNumber: 268
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        children: results[0]?.description || 'Open the original source to read the full article.'
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 269,
                                                                        columnNumber: 296
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "bzs-source-chips",
                                                                        children: results.slice(0, 3).map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                                href: r.url,
                                                                                target: "_blank",
                                                                                rel: "noopener noreferrer",
                                                                                referrerPolicy: "no-referrer",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                        className: "bzs-domain-dot",
                                                                                        children: r.displayUrl[0]?.toUpperCase()
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                        lineNumber: 269,
                                                                                        columnNumber: 544
                                                                                    }, this),
                                                                                    r.displayUrl,
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                                        name: "external",
                                                                                        size: 12
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                        lineNumber: 269,
                                                                                        columnNumber: 630
                                                                                    }, this)
                                                                                ]
                                                                            }, r.url, true, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 269,
                                                                                columnNumber: 445
                                                                            }, this))
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 269,
                                                                        columnNumber: 384
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                        children: "This is an excerpt of an actual search result, not an AI-generated answer."
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 269,
                                                                        columnNumber: 675
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 269,
                                                                columnNumber: 34
                                                            }, this),
                                                            category === 'images' && !thumbnails && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "bzs-image-privacy",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                        name: "shield",
                                                                        size: 18
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 270,
                                                                        columnNumber: 87
                                                                    }, this),
                                                                    " Image previews are loaded from provider-supplied HTTPS sources."
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 270,
                                                                columnNumber: 52
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: category === 'images' ? 'bzs-result-grid' : 'bzs-result-list',
                                                                children: results.map((r, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                                                        className: selected?.url === r.url ? 'bzs-result bzs-result-focused' : 'bzs-result',
                                                                        children: [
                                                                            category === 'images' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "bzs-result-image",
                                                                                children: thumbnails && r.thumbnail ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                                                    src: r.thumbnail,
                                                                                    alt: "",
                                                                                    loading: "lazy",
                                                                                    referrerPolicy: "no-referrer"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 272,
                                                                                    columnNumber: 100
                                                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                                    name: "image",
                                                                                    size: 36
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 272,
                                                                                    columnNumber: 176
                                                                                }, this)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 272,
                                                                                columnNumber: 39
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "bzs-result-body",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "bzs-result-domain",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                className: "bzs-domain-dot",
                                                                                                children: r.displayUrl[0]?.toUpperCase()
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                lineNumber: 273,
                                                                                                columnNumber: 83
                                                                                            }, this),
                                                                                            r.displayUrl,
                                                                                            r.age && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                children: [
                                                                                                    "Â· ",
                                                                                                    r.age
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                lineNumber: 273,
                                                                                                columnNumber: 177
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                        lineNumber: 273,
                                                                                        columnNumber: 48
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                                        className: "bzs-result-title",
                                                                                        href: r.url,
                                                                                        target: prefs.newTab ? "_blank" : "_self",
                                                                                        rel: "noopener noreferrer",
                                                                                        referrerPolicy: "no-referrer",
                                                                                        children: r.title
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                        lineNumber: 273,
                                                                                        columnNumber: 207
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                        children: r.description
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                        lineNumber: 273,
                                                                                        columnNumber: 359
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "bzs-result-actions",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                type: "button",
                                                                                                onClick: ()=>setFocusUrl(r.url),
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                                                        name: "layout",
                                                                                                        size: 14
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                        lineNumber: 273,
                                                                                                        columnNumber: 472
                                                                                                    }, this),
                                                                                                    " Focus"
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                lineNumber: 273,
                                                                                                columnNumber: 417
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                type: "button",
                                                                                                onClick: ()=>setAboutUrl(r.url),
                                                                                                children: "About result"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                lineNumber: 273,
                                                                                                columnNumber: 518
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                type: "button",
                                                                                                onClick: ()=>save(r),
                                                                                                "aria-pressed": pins.some((p)=>p.url === r.url),
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                                                        name: pins.some((p)=>p.url === r.url) ? 'check' : 'bookmark',
                                                                                                        size: 14
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                        lineNumber: 273,
                                                                                                        columnNumber: 681
                                                                                                    }, this),
                                                                                                    pins.some((p)=>p.url === r.url) ? 'Saved' : 'Save'
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                lineNumber: 273,
                                                                                                columnNumber: 594
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                type: "button",
                                                                                                onClick: ()=>void share(r.url),
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                                                        name: "copy",
                                                                                                        size: 14
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                        lineNumber: 273,
                                                                                                        columnNumber: 859
                                                                                                    }, this),
                                                                                                    " Copy"
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                lineNumber: 273,
                                                                                                columnNumber: 805
                                                                                            }, this),
                                                                                            prefs.spokenAnswers && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                type: "button",
                                                                                                onClick: ()=>speakExcerpt(`${r.title}. ${r.description}`),
                                                                                                "aria-label": `Read aloud ${r.title}`,
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                                                        name: "mic",
                                                                                                        size: 14
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                        lineNumber: 273,
                                                                                                        columnNumber: 1042
                                                                                                    }, this),
                                                                                                    " Listen"
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                lineNumber: 273,
                                                                                                columnNumber: 924
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                        lineNumber: 273,
                                                                                        columnNumber: 381
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 273,
                                                                                columnNumber: 15
                                                                            }, this)
                                                                        ]
                                                                    }, `${r.url}-${index}`, true, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 271,
                                                                        columnNumber: 110
                                                                    }, this))
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 271,
                                                                columnNumber: 13
                                                            }, this),
                                                            data.hasMore && category !== 'images' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "bzs-pagination",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        disabled: page <= 1,
                                                                        onClick: ()=>{
                                                                            void search({
                                                                                q: searched,
                                                                                category,
                                                                                safe,
                                                                                country,
                                                                                page: page - 1
                                                                            });
                                                                            window.scrollTo({
                                                                                top: 0,
                                                                                behavior: 'smooth'
                                                                            });
                                                                        },
                                                                        children: "Previous"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 274,
                                                                        columnNumber: 83
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        children: [
                                                                            "Page ",
                                                                            page
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 274,
                                                                        columnNumber: 247
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                        disabled: page >= 10,
                                                                        onClick: ()=>{
                                                                            void search({
                                                                                q: searched,
                                                                                category,
                                                                                safe,
                                                                                country,
                                                                                page: page + 1
                                                                            });
                                                                            window.scrollTo({
                                                                                top: 0,
                                                                                behavior: 'smooth'
                                                                            });
                                                                        },
                                                                        children: [
                                                                            "Next page ",
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                                name: "arrow",
                                                                                size: 15
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 274,
                                                                                columnNumber: 429
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 274,
                                                                        columnNumber: 271
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 274,
                                                                columnNumber: 51
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "bzs-provider",
                                                                children: [
                                                                    "Results via ",
                                                                    data.provider,
                                                                    ". ",
                                                                    data.privacy?.notice || 'Third-party search provider policies apply.'
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 275,
                                                                columnNumber: 13
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 268,
                                                        columnNumber: 81
                                                    }, this),
                                                    category !== 'images' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                                                        className: "bzs-insight",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "bzs-insight-header",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        children: "EXPLORE THIS SOURCE"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 276,
                                                                        columnNumber: 106
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                        name: "spark",
                                                                        size: 17
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 276,
                                                                        columnNumber: 138
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 276,
                                                                columnNumber: 70
                                                            }, this),
                                                            selected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "bzs-insight-logo",
                                                                        children: selected.displayUrl[0]?.toUpperCase()
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 276,
                                                                        columnNumber: 189
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                                        children: selected.title
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 276,
                                                                        columnNumber: 270
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "bzs-insight-domain",
                                                                        children: selected.displayUrl
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 276,
                                                                        columnNumber: 295
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        children: selected.description || 'Open this source to learn more.'
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 276,
                                                                        columnNumber: 358
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                        href: selected.url,
                                                                        target: "_blank",
                                                                        rel: "noopener noreferrer",
                                                                        referrerPolicy: "no-referrer",
                                                                        className: "bzs-insight-open",
                                                                        children: [
                                                                            "Read original source ",
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                                name: "external",
                                                                                size: 15
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 276,
                                                                                columnNumber: 566
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 276,
                                                                        columnNumber: 422
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 276,
                                                                columnNumber: 187
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "bzs-insight-divider"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 277,
                                                                columnNumber: 13
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                                children: "Compare sources"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 277,
                                                                columnNumber: 51
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "bzs-insight-help",
                                                                children: "Select a result to inspect its published excerpt. Compare information using the original pages."
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 277,
                                                                columnNumber: 75
                                                            }, this),
                                                            results.filter((r)=>r.url !== selected?.url).slice(0, 4).map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    type: "button",
                                                                    className: "bzs-compare",
                                                                    onClick: ()=>setFocusUrl(r.url),
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "bzs-domain-dot",
                                                                            children: r.displayUrl[0]?.toUpperCase()
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 277,
                                                                            columnNumber: 357
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            children: [
                                                                                r.title,
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                                    children: r.displayUrl
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 277,
                                                                                    columnNumber: 444
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 277,
                                                                            columnNumber: 429
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                            name: "chevron",
                                                                            size: 15
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 277,
                                                                            columnNumber: 480
                                                                        }, this)
                                                                    ]
                                                                }, r.url, true, {
                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                    lineNumber: 277,
                                                                    columnNumber: 266
                                                                }, this)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "bzs-insight-foot",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                        name: "shield",
                                                                        size: 18
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 278,
                                                                        columnNumber: 47
                                                                    }, this),
                                                                    " Source context only. No invented summaries, statistics or ratings."
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 278,
                                                                columnNumber: 13
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 276,
                                                        columnNumber: 39
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 268,
                                                columnNumber: 52
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 263,
                                        columnNumber: 43
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 239,
                                columnNumber: 48
                            }, this),
                            screen === 'Notifications' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "bzs-v5-page",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        children: "Notifications"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 282,
                                        columnNumber: 69
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "Notifications are not enabled yet. No alerts will be fabricated."
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 282,
                                        columnNumber: 91
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 282,
                                columnNumber: 36
                            }, this),
                            screen === 'Activity' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "bzs-v5-page bz86-activity",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        children: "Activity"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 283,
                                        columnNumber: 78
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bz86-activity-bar",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                children: [
                                                    "Local browser history: ",
                                                    historyEnabled ? 'On' : 'Off',
                                                    " Â· ",
                                                    history.length,
                                                    " entries"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 283,
                                                columnNumber: 130
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>openSettings('history'),
                                                children: "Manage history & export"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 283,
                                                columnNumber: 215
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 283,
                                        columnNumber: 95
                                    }, this),
                                    historyEnabled && history.slice(0, 10).map((h)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "bz86-activity-item",
                                            type: "button",
                                            onClick: ()=>void search({
                                                    q: h.q,
                                                    category: h.category,
                                                    safe,
                                                    country
                                                }),
                                            children: [
                                                h.q,
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                    children: new Date(h.at).toLocaleString()
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 283,
                                                    columnNumber: 506
                                                }, this)
                                            ]
                                        }, `${h.q}-${h.at}`, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 283,
                                            columnNumber: 357
                                        }, this)),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                        children: "Links saved in this browser"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 283,
                                        columnNumber: 565
                                    }, this),
                                    pins.length ? pins.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: p.url,
                                            target: prefs.newTab ? '_blank' : '_self',
                                            rel: "noopener noreferrer",
                                            children: [
                                                p.title,
                                                " â†—"
                                            ]
                                        }, p.url, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 283,
                                            columnNumber: 626
                                        }, this)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "No saved links yet."
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 283,
                                        columnNumber: 738
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 283,
                                columnNumber: 31
                            }, this),
                            aboutResult && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bz8-modal-backdrop",
                                role: "presentation",
                                onMouseDown: (e)=>{
                                    if (e.target === e.currentTarget) setAboutUrl(null);
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    className: "bz8-about-result",
                                    role: "dialog",
                                    "aria-modal": "true",
                                    "aria-label": "About this result",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                            className: "bz8-eyebrow",
                                                            children: "ABOUT THIS RESULT"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 285,
                                                            columnNumber: 261
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                            children: aboutResult.displayUrl
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 285,
                                                            columnNumber: 317
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 285,
                                                    columnNumber: 256
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>setAboutUrl(null),
                                                    "aria-label": "Close",
                                                    children: "Ã—"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 285,
                                                    columnNumber: 356
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 285,
                                            columnNumber: 248
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: aboutResult.description || 'No provider excerpt was returned for this result.'
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 285,
                                            columnNumber: 435
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                            children: "Destination"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 285,
                                                            columnNumber: 529
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                            children: aboutResult.displayUrl
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 285,
                                                            columnNumber: 549
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 285,
                                                    columnNumber: 524
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                            children: "Result type"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 285,
                                                            columnNumber: 593
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                            children: category === 'images' ? 'Image result' : category === 'news' ? 'News result' : 'Web result'
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 285,
                                                            columnNumber: 613
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 285,
                                                    columnNumber: 588
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                            children: "Provider"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 285,
                                                            columnNumber: 714
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                            children: data?.provider || 'Connected search provider'
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 285,
                                                            columnNumber: 731
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 285,
                                                    columnNumber: 709
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 285,
                                            columnNumber: 520
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: aboutResult.url,
                                            target: "_blank",
                                            rel: "noopener noreferrer",
                                            referrerPolicy: "no-referrer",
                                            children: "Open original source â†—"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 285,
                                            columnNumber: 796
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                                            children: "BAZAARA shows provider-supplied source metadata only. It does not fabricate trust scores, ownership claims or publisher ratings."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 285,
                                            columnNumber: 921
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                    lineNumber: 285,
                                    columnNumber: 147
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 285,
                                columnNumber: 23
                            }, this),
                            voiceOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bz8-modal-backdrop",
                                role: "presentation",
                                onMouseDown: (e)=>{
                                    if (e.target === e.currentTarget) closeVoice();
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    className: "bz8-voice-dialog",
                                    role: "dialog",
                                    "aria-modal": "true",
                                    "aria-label": "Voice search",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                            className: "bz8-eyebrow",
                                                            children: "VOICE SEARCH"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 286,
                                                            columnNumber: 249
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                            children: voiceListening ? 'Listeningâ€¦' : voiceTranscript ? 'Ready to search' : 'Speak your search'
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 286,
                                                            columnNumber: 300
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 286,
                                                    columnNumber: 244
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: closeVoice,
                                                    "aria-label": "Close voice search",
                                                    children: "Ã—"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 286,
                                                    columnNumber: 400
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 286,
                                            columnNumber: 236
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: voiceListening ? 'bz8-voice-orb is-listening' : 'bz8-voice-orb',
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                        name: "mic",
                                                        size: 34
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 286,
                                                        columnNumber: 578
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 286,
                                                    columnNumber: 572
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 286,
                                                    columnNumber: 613
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 286,
                                                    columnNumber: 617
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 286,
                                                    columnNumber: 621
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 286,
                                            columnNumber: 495
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "bz8-voice-transcript",
                                            children: voiceTranscript || voiceError || 'Say a word, place, question or topic.'
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 286,
                                            columnNumber: 631
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bz8-voice-actions",
                                            children: [
                                                !voiceListening && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: voiceSearch,
                                                    children: "Listen again"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 286,
                                                    columnNumber: 794
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    className: "bz8-primary",
                                                    disabled: !voiceTranscript.trim(),
                                                    onClick: submitVoice,
                                                    children: "Search"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 286,
                                                    columnNumber: 860
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 286,
                                            columnNumber: 741
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                                            children: [
                                                "Recognition language: ",
                                                typeof navigator !== 'undefined' ? navigator.language || 'browser default' : 'browser default',
                                                " Â· Microphone is used only while listening."
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 286,
                                            columnNumber: 984
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                    lineNumber: 286,
                                    columnNumber: 140
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 286,
                                columnNumber: 21
                            }, this),
                            lensOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bz8-modal-backdrop",
                                role: "presentation",
                                onMouseDown: (e)=>{
                                    if (e.target === e.currentTarget) closeLens();
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    className: "bz8-search-lens",
                                    role: "dialog",
                                    "aria-modal": "true",
                                    "aria-label": "Search any image with BazLens",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                            className: "bz8-eyebrow",
                                                            children: "BAZLENS"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 287,
                                                            columnNumber: 263
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                            children: "Search any image"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 287,
                                                            columnNumber: 309
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            children: "Drop an image, upload a file or import an HTTPS image link."
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 287,
                                                            columnNumber: 334
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 287,
                                                    columnNumber: 258
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: closeLens,
                                                    "aria-label": "Close BazLens",
                                                    children: "Ã—"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 287,
                                                    columnNumber: 406
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 287,
                                            columnNumber: 250
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ref: lensInput,
                                            type: "file",
                                            accept: "image/png,image/jpeg,image/webp,image/gif",
                                            hidden: true,
                                            onChange: (e)=>chooseLensFile(e.target.files?.[0])
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 287,
                                            columnNumber: 495
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: lensFile ? 'bz8-lens-drop has-image' : 'bz8-lens-drop',
                                            onDragOver: (e)=>e.preventDefault(),
                                            onDrop: (e)=>{
                                                e.preventDefault();
                                                chooseLensFile(e.dataTransfer.files?.[0]);
                                            },
                                            children: lensPreview ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                src: lensPreview,
                                                alt: "Selected visual search image"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 287,
                                                columnNumber: 831
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "bz8-lens-upload-icon",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                            name: "image",
                                                            size: 34
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 287,
                                                            columnNumber: 932
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 287,
                                                        columnNumber: 893
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: "Drag an image here"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 287,
                                                        columnNumber: 969
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "or"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 287,
                                                        columnNumber: 1004
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: ()=>lensInput.current?.click(),
                                                        children: "Upload a file"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 287,
                                                        columnNumber: 1019
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 287,
                                                columnNumber: 891
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 287,
                                            columnNumber: 639
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bz8-lens-or",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 287,
                                                    columnNumber: 1143
                                                }, this),
                                                "OR",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 287,
                                                    columnNumber: 1152
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 287,
                                            columnNumber: 1114
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bz8-lens-url",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "url",
                                                    value: lensUrl,
                                                    onChange: (e)=>setLensUrl(e.target.value),
                                                    placeholder: "Paste image link",
                                                    "aria-label": "Image URL"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 287,
                                                    columnNumber: 1195
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    disabled: !lensUrl.trim(),
                                                    onClick: ()=>void importLensUrl(),
                                                    children: "Import"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 287,
                                                    columnNumber: 1325
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 287,
                                            columnNumber: 1165
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bz8-lens-mode-row",
                                            role: "tablist",
                                            "aria-label": "BazLens mode",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    role: "tab",
                                                    "aria-selected": lensMode === 'similar',
                                                    onClick: ()=>setLensMode('similar'),
                                                    children: "Visual search"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 287,
                                                    columnNumber: 1506
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    role: "tab",
                                                    "aria-selected": lensMode === 'text',
                                                    onClick: ()=>setLensMode('text'),
                                                    children: "Text"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 287,
                                                    columnNumber: 1621
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    role: "tab",
                                                    "aria-selected": lensMode === 'objects',
                                                    onClick: ()=>setLensMode('objects'),
                                                    children: "Shopping & objects"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 287,
                                                    columnNumber: 1721
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 287,
                                            columnNumber: 1430
                                        }, this),
                                        lensError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "bz8-lens-error",
                                            role: "alert",
                                            children: lensError
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 287,
                                            columnNumber: 1859
                                        }, this),
                                        lensResult && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bz8-lens-mini-results",
                                            children: [
                                                lensResult.text && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                            children: "Recognized text"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 287,
                                                            columnNumber: 1991
                                                        }, this),
                                                        lensResult.text.slice(0, 420)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 287,
                                                    columnNumber: 1988
                                                }, this),
                                                lensResult.labels.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: lensResult.labels.slice(0, 8).map((x)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            onClick: ()=>{
                                                                setQuery(x);
                                                                closeLens();
                                                                void search({
                                                                    q: x,
                                                                    category: 'web',
                                                                    safe,
                                                                    country
                                                                });
                                                            },
                                                            children: x
                                                        }, x, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 287,
                                                            columnNumber: 2129
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 287,
                                                    columnNumber: 2087
                                                }, this),
                                                lensResult.matches.slice(0, 3).map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                        href: m.url,
                                                        target: "_blank",
                                                        rel: "noopener noreferrer",
                                                        referrerPolicy: "no-referrer",
                                                        children: [
                                                            m.title,
                                                            " â†—"
                                                        ]
                                                    }, m.url, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 287,
                                                        columnNumber: 2292
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 287,
                                            columnNumber: 1931
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bz8-lens-footer",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: ()=>{
                                                        setLensFile(null);
                                                        setLensResult(null);
                                                        setLensError('');
                                                    },
                                                    children: "Clear"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 287,
                                                    columnNumber: 2450
                                                }, this),
                                                links.bazlens && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                    href: links.bazlens,
                                                    children: "Open full BazLens â†—"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 287,
                                                    columnNumber: 2574
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    className: "bz8-primary",
                                                    disabled: !lensFile || lensLoading,
                                                    onClick: ()=>void analyzeLens(),
                                                    children: lensLoading ? 'Analyzingâ€¦' : 'Search image'
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 287,
                                                    columnNumber: 2624
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 287,
                                            columnNumber: 2417
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                            className: "bz8-lens-privacy",
                                            children: "Images are sent only when you press Search image. BazLens provider configuration determines analysis availability."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 287,
                                            columnNumber: 2795
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                    lineNumber: 287,
                                    columnNumber: 138
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 287,
                                columnNumber: 20
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 238,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        className: "bzs-v5-bottom",
                        "aria-label": "Search navigation",
                        children: [
                            'Home',
                            'Search',
                            'Notifications',
                            'Activity'
                        ].map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                "aria-current": screen === t ? 'page' : undefined,
                                onClick: ()=>{
                                    setScreen(t);
                                    if (t === 'Search') input.current?.focus();
                                    window.scrollTo({
                                        top: 0
                                    });
                                },
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: t === 'Home' ? 'âŒ‚' : t === 'Search' ? 'âŒ•' : t === 'Notifications' ? 'â™§' : 'â—·'
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 289,
                                        columnNumber: 300
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: t
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 289,
                                        columnNumber: 382
                                    }, this)
                                ]
                            }, t, true, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 289,
                                columnNumber: 133
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 289,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 226,
                columnNumber: 5
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$search$2d$web$2f$components$2f$SearchAppLauncher$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                open: launcherOpen,
                onClose: closeLauncher
            }, void 0, false, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 291,
                columnNumber: 5
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$search$2d$web$2f$components$2f$SearchInputTools$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                open: addOpen,
                onClose: ()=>setAddOpen(false),
                onLens: ()=>{
                    setLensOpen(true);
                    setLensError('');
                },
                onInsert: (text)=>{
                    setQuery(text);
                    setShowSuggestions(false);
                    window.setTimeout(()=>input.current?.focus(), 0);
                },
                aiStudioHref: aiStudioUrl()
            }, void 0, false, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 291,
                columnNumber: 69
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$search$2d$web$2f$components$2f$SearchSettingsPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                open: settingsOpen,
                initialTab: settingsTab,
                onClose: closeSettings,
                dark: dark,
                onDarkChange: changeTheme,
                safe: safe,
                onSafeChange: changeSafety,
                country: country,
                onCountryChange: changeCountry,
                autoRegion: autoRegion,
                onAutoRegionChange: changeAutoRegion,
                regionInfo: regionMeta,
                savedCount: pins.length,
                onClearSaved: clearBrowserPins,
                bazidHref: links.bazid ? `${links.bazid}account` : undefined,
                prefs: prefs,
                onPrefsChange: updatePrefs,
                historyEnabled: historyEnabled,
                onHistoryEnabledChange: toggleHistory,
                history: history,
                onClearHistory: clearHistory,
                onExport: exportLocal,
                onAdvancedSearch: (value)=>{
                    setQuery(value);
                    setScreen('Home');
                    input.current?.focus();
                }
            }, void 0, false, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 292,
                columnNumber: 5
            }, this),
            notice && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bzs-toast",
                role: "status",
                children: [
                    notice,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        "aria-label": "Dismiss",
                        onClick: ()=>setNotice(''),
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                            name: "x",
                            size: 15
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                            lineNumber: 293,
                            columnNumber: 136
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 293,
                        columnNumber: 65
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 293,
                columnNumber: 16
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
        lineNumber: 225,
        columnNumber: 10
    }, this);
}
_s(SearchExperience, "dyqdnqjUUsSBxNB6qcBftyo/UQI=");
_c1 = SearchExperience;
var _c, _c1;
__turbopack_context__.k.register(_c, "Icon");
__turbopack_context__.k.register(_c1, "SearchExperience");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/search-web/components/SearchInputTools.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SearchInputTools
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
const ACCEPT = '.txt,.md,.csv,.json,text/plain,text/markdown,text/csv,application/json';
function SearchInputTools({ open, onClose, onLens, onInsert, aiStudioHref }) {
    _s();
    const [file, setFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const ref = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const input = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SearchInputTools.useEffect": ()=>{
            if (!open) return;
            const focus = ref.current?.querySelector('button');
            focus?.focus();
            const escape = {
                "SearchInputTools.useEffect.escape": (e)=>{
                    if (e.key === 'Escape') {
                        onClose();
                        return;
                    }
                    if (e.key === 'Tab' && ref.current) {
                        const els = Array.from(ref.current.querySelectorAll('button:not([disabled]),a[href]'));
                        if (!els.length) return;
                        if (e.shiftKey && document.activeElement === els[0]) {
                            e.preventDefault();
                            els[els.length - 1]?.focus();
                        } else if (!e.shiftKey && document.activeElement === els[els.length - 1]) {
                            e.preventDefault();
                            els[0]?.focus();
                        }
                    }
                }
            }["SearchInputTools.useEffect.escape"];
            document.addEventListener('keydown', escape);
            return ({
                "SearchInputTools.useEffect": ()=>document.removeEventListener('keydown', escape)
            })["SearchInputTools.useEffect"];
        }
    }["SearchInputTools.useEffect"], [
        open,
        onClose
    ]);
    async function read(file) {
        if (!file) return;
        setError('');
        setFile(null);
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (![
            'txt',
            'md',
            'csv',
            'json'
        ].includes(ext || '')) {
            setError('This release reads text, Markdown, CSV and JSON locally. PDF/DOCX ingestion needs a configured document service.');
            return;
        }
        if (file.size > 1024 * 1024) {
            setError('Choose a text file below 1 MB.');
            return;
        }
        try {
            const text = await file.text();
            const cleaned = text.replace(/\s+/g, ' ').trim();
            if (!cleaned) {
                setError('The file contains no readable text.');
                return;
            }
            setFile({
                name: file.name.slice(0, 100),
                sample: cleaned.slice(0, 200)
            });
        } catch  {
            setError('This browser could not read the file.');
        }
    }
    if (!open) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bz86-tools-overlay",
        onMouseDown: (e)=>{
            if (e.currentTarget === e.target) onClose();
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
            className: "bz86-tools",
            ref: ref,
            role: "dialog",
            "aria-modal": "true",
            "aria-label": "Add to BAZAARA Search",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                    className: "bz86-eyebrow",
                                    children: "MULTIMODAL INPUT"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                                    lineNumber: 13,
                                    columnNumber: 227
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    children: "Add to Search"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                                    lineNumber: 13,
                                    columnNumber: 283
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                            lineNumber: 13,
                            columnNumber: 222
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: onClose,
                            "aria-label": "Close add menu",
                            children: "×"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                            lineNumber: 13,
                            columnNumber: 311
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                    lineNumber: 13,
                    columnNumber: 214
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bz86-tools-grid",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: ()=>{
                                onClose();
                                onLens();
                            },
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    "aria-hidden": "true",
                                    children: "▧"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                                    lineNumber: 14,
                                    columnNumber: 93
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "Image & screenshot"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                                    lineNumber: 14,
                                    columnNumber: 126
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                    children: "Open BazLens visual search"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                                    lineNumber: 14,
                                    columnNumber: 161
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                            lineNumber: 14,
                            columnNumber: 35
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: ()=>input.current?.click(),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    "aria-hidden": "true",
                                    children: "▤"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                                    lineNumber: 14,
                                    columnNumber: 270
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "Text document"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                                    lineNumber: 14,
                                    columnNumber: 303
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                    children: "Local TXT, MD, CSV or JSON"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                                    lineNumber: 14,
                                    columnNumber: 333
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                            lineNumber: 14,
                            columnNumber: 211
                        }, this),
                        aiStudioHref ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                            href: aiStudioHref,
                            target: "_blank",
                            rel: "noopener noreferrer",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    "aria-hidden": "true",
                                    children: "✧"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                                    lineNumber: 15,
                                    columnNumber: 81
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "AI Studio"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                                    lineNumber: 15,
                                    columnNumber: 114
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                    children: "Open your configured BAZAARA service ↗"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                                    lineNumber: 15,
                                    columnNumber: 140
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                            lineNumber: 15,
                            columnNumber: 16
                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bz86-tool-disabled",
                            "aria-disabled": "true",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    "aria-hidden": "true",
                                    children: "✧"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                                    lineNumber: 15,
                                    columnNumber: 255
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "AI creation"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                                    lineNumber: 15,
                                    columnNumber: 288
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                    children: "Requires an AI service connection"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                                    lineNumber: 15,
                                    columnNumber: 316
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                            lineNumber: 15,
                            columnNumber: 198
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bz86-tool-disabled",
                            "aria-disabled": "true",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    "aria-hidden": "true",
                                    children: "▧"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                                    lineNumber: 16,
                                    columnNumber: 59
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "PDF / DOCX"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                                    lineNumber: 16,
                                    columnNumber: 92
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                    children: "Secure document indexing is not configured"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                                    lineNumber: 16,
                                    columnNumber: 119
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                            lineNumber: 16,
                            columnNumber: 2
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                    lineNumber: 14,
                    columnNumber: 2
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                    ref: input,
                    type: "file",
                    hidden: true,
                    accept: ACCEPT,
                    onChange: (e)=>{
                        void read(e.currentTarget.files?.[0]);
                        e.currentTarget.value = '';
                    }
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                    lineNumber: 17,
                    columnNumber: 2
                }, this),
                file && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bz86-file-preview",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                            children: file.name
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                            lineNumber: 18,
                            columnNumber: 44
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: file.sample
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                            lineNumber: 18,
                            columnNumber: 72
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: ()=>{
                                onInsert(file.sample);
                                onClose();
                            },
                            children: "Insert excerpt in Search"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                            lineNumber: 18,
                            columnNumber: 92
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                            children: "Only the excerpt you choose will be sent when you submit a search. The file itself stays in this browser."
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                            lineNumber: 18,
                            columnNumber: 196
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                    lineNumber: 18,
                    columnNumber: 9
                }, this),
                error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "bz86-form-error",
                    role: "alert",
                    children: error
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                    lineNumber: 19,
                    columnNumber: 10
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                    children: "Only enabled actions are interactive; no simulated AI or document uploads."
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
                    lineNumber: 19,
                    columnNumber: 66
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
            lineNumber: 13,
            columnNumber: 105
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/search-web/components/SearchInputTools.tsx",
        lineNumber: 13,
        columnNumber: 9
    }, this);
}
_s(SearchInputTools, "l/atYe4aUygp/tAqzMJrwb37VoI=");
_c = SearchInputTools;
var _c;
__turbopack_context__.k.register(_c, "SearchInputTools");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/search-web/components/SearchMoments.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SearchMoments",
    ()=>SearchMoments
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
// Editorial exemplars: do not imply the selected event is today's news or auto-generated.
const MOMENTS = [
    {
        id: 'space',
        title: 'The wonder of discovery',
        subtitle: 'An original space-inspired visual story',
        month: 10,
        day: 4,
        category: 'Discovery',
        region: 'Global',
        story: 'From the night sky to spacecraft, curiosity connects the world. World Space Week runs October 4–10 each year.',
        prompt: 'What makes the night sky worth exploring?',
        symbol: '✦'
    },
    {
        id: 'literacy',
        title: 'Stories change everything',
        subtitle: 'Celebrating the power of reading',
        month: 9,
        day: 8,
        category: 'Learning',
        region: 'Global',
        story: 'International Literacy Day is observed September 8. Every language and every story creates new possibilities.',
        prompt: 'Search the history of writing',
        symbol: '⌘'
    },
    {
        id: 'ocean',
        title: 'A world beneath the surface',
        subtitle: 'Explore our extraordinary blue planet',
        month: 6,
        day: 8,
        category: 'Nature',
        region: 'Global',
        story: 'World Oceans Day takes place June 8. Oceans shape our climate, sustain ecosystems and inspire exploration.',
        prompt: 'Explore marine biodiversity',
        symbol: '≈'
    },
    {
        id: 'culture',
        title: 'Many cultures. One horizon.',
        subtitle: 'A celebration of creative expression',
        month: 5,
        day: 21,
        category: 'Culture',
        region: 'Global',
        story: 'The World Day for Cultural Diversity for Dialogue and Development is observed May 21.',
        prompt: 'Explore world cultures and traditions',
        symbol: '✳'
    },
    {
        id: 'teachers',
        title: 'Where every future begins',
        subtitle: 'Celebrating people who teach and inspire',
        month: 10,
        day: 5,
        category: 'Learning',
        region: 'Global',
        story: 'World Teachers’ Day is observed October 5. This original artwork celebrates learning everywhere.',
        prompt: 'History of education',
        symbol: '✎'
    },
    {
        id: 'earth',
        title: 'Designed to protect tomorrow',
        subtitle: 'Creative exploration of our planet',
        month: 4,
        day: 22,
        category: 'Nature',
        region: 'Global',
        story: 'Earth Day is observed April 22. This original BAZAARA illustration encourages learning about our environment.',
        prompt: 'Earth science',
        symbol: '◌'
    }
];
function SearchMoments({ onSearch }) {
    _s();
    const today = new Date();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const [filter, setFilter] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('All');
    const [term, setTerm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [selected, setSelected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const dialogRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SearchMoments.useEffect": ()=>{
            if (!selected) return;
            const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            dialogRef.current?.querySelector('button')?.focus();
            const onKey = {
                "SearchMoments.useEffect.onKey": (e)=>{
                    if (e.key === 'Escape') {
                        setSelected(null);
                        return;
                    }
                    if (e.key === 'Tab' && dialogRef.current) {
                        const els = Array.from(dialogRef.current.querySelectorAll('button,a[href]'));
                        if (!els.length) return;
                        if (e.shiftKey && document.activeElement === els[0]) {
                            e.preventDefault();
                            els[els.length - 1]?.focus();
                        } else if (!e.shiftKey && document.activeElement === els[els.length - 1]) {
                            e.preventDefault();
                            els[0]?.focus();
                        }
                    }
                }
            }["SearchMoments.useEffect.onKey"];
            document.addEventListener('keydown', onKey, true);
            return ({
                "SearchMoments.useEffect": ()=>{
                    document.removeEventListener('keydown', onKey, true);
                    previous?.focus();
                }
            })["SearchMoments.useEffect"];
        }
    }["SearchMoments.useEffect"], [
        selected
    ]);
    const sorted = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "SearchMoments.useMemo[sorted]": ()=>[
                ...MOMENTS
            ].sort({
                "SearchMoments.useMemo[sorted]": (a, b)=>{
                    const da = (a.month - today.getMonth() - 1 + 12) % 12;
                    const db = (b.month - today.getMonth() - 1 + 12) % 12;
                    return da - db || a.day - b.day;
                }
            }["SearchMoments.useMemo[sorted]"])
    }["SearchMoments.useMemo[sorted]"], [
        today.getMonth()
    ]);
    const featured = sorted[0];
    if (!featured) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "bz86-moments",
        "aria-label": "BAZAARA Moments original editorial collection",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
            children: "Moments are currently unavailable."
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
            lineNumber: 19,
            columnNumber: 118
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
        lineNumber: 19,
        columnNumber: 25
    }, this);
    const visible = MOMENTS.filter((m)=>(filter === 'All' || m.category === filter) && `${m.title} ${m.subtitle} ${m.category} ${m.region}`.toLowerCase().includes(term.toLowerCase()));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
        className: "bz86-moments",
        "aria-label": "BAZAARA Moments original editorial collection",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bz86-moment-hero",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bz86-moment-art",
                        "aria-hidden": "true",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "bz86-moment-orbit one"
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                lineNumber: 23,
                                columnNumber: 56
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "bz86-moment-orbit two"
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                lineNumber: 23,
                                columnNumber: 97
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "bz86-moment-glyph",
                                children: featured.symbol
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                lineNumber: 23,
                                columnNumber: 138
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "bz86-moment-star",
                                children: "✧"
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                lineNumber: 23,
                                columnNumber: 198
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                        lineNumber: 23,
                        columnNumber: 4
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bz86-moment-copy",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bz86-eyebrow",
                                children: [
                                    "BAZAARA MOMENTS ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: "·"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                        lineNumber: 24,
                                        columnNumber: 84
                                    }, this),
                                    " ORIGINAL ARTWORK"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                lineNumber: 24,
                                columnNumber: 38
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                children: featured.title
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                lineNumber: 24,
                                columnNumber: 121
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                children: featured.subtitle
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                lineNumber: 24,
                                columnNumber: 146
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bz86-moment-buttons",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        onClick: ()=>setSelected(featured),
                                        children: "Discover the story"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                        lineNumber: 24,
                                        columnNumber: 209
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "bz86-subtle",
                                        onClick: ()=>setOpen((value)=>!value),
                                        "aria-expanded": open,
                                        children: "Moments archive ↗"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                        lineNumber: 24,
                                        columnNumber: 294
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                lineNumber: 24,
                                columnNumber: 172
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                        lineNumber: 24,
                        columnNumber: 4
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                lineNumber: 22,
                columnNumber: 3
            }, this),
            open && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bz86-moment-archive",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        className: "bz86-eyebrow",
                                        children: "ARCHIVE · CURATED EDITORIAL EXAMPLES"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                        lineNumber: 26,
                                        columnNumber: 62
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "Explore Moments"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                        lineNumber: 26,
                                        columnNumber: 136
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "Original sample artwork. Upcoming calendar dates are not a live events feed."
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                        lineNumber: 26,
                                        columnNumber: 160
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                lineNumber: 26,
                                columnNumber: 57
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>setOpen(false),
                                "aria-label": "Close Moments archive",
                                children: "×"
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                lineNumber: 26,
                                columnNumber: 249
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                        lineNumber: 26,
                        columnNumber: 49
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bz86-moment-controls",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                "aria-label": "Find a moment",
                                placeholder: "Search the collection",
                                value: term,
                                onChange: (e)=>setTerm(e.target.value)
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                lineNumber: 27,
                                columnNumber: 42
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                value: filter,
                                onChange: (e)=>setFilter(e.target.value),
                                "aria-label": "Filter Moments category",
                                children: [
                                    'All',
                                    'Discovery',
                                    'Culture',
                                    'Learning',
                                    'Nature'
                                ].map((c)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                        children: c
                                    }, c, false, {
                                        fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                        lineNumber: 27,
                                        columnNumber: 322
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                lineNumber: 27,
                                columnNumber: 164
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                        lineNumber: 27,
                        columnNumber: 4
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bz86-moment-grid",
                        children: [
                            visible.map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>setSelected(m),
                                    className: `bz86-moment-tile bz86-moment-${m.id}`,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            "aria-hidden": "true",
                                            children: m.symbol
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                            lineNumber: 28,
                                            columnNumber: 167
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                            children: [
                                                new Date(2026, m.month - 1, m.day).toLocaleString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric'
                                                }),
                                                " · ",
                                                m.category
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                            lineNumber: 28,
                                            columnNumber: 209
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: m.title
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                            lineNumber: 28,
                                            columnNumber: 325
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("em", {
                                            children: m.region
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                            lineNumber: 28,
                                            columnNumber: 351
                                        }, this)
                                    ]
                                }, m.id, true, {
                                    fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                    lineNumber: 28,
                                    columnNumber: 54
                                }, this)),
                            visible.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                className: "bz86-empty",
                                children: "No Moments match your search."
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                                lineNumber: 28,
                                columnNumber: 402
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                        lineNumber: 28,
                        columnNumber: 4
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                lineNumber: 26,
                columnNumber: 12
            }, this),
            selected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bz86-moment-overlay",
                onMouseDown: (e)=>{
                    if (e.currentTarget === e.target) setSelected(null);
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                    className: "bz86-moment-dialog",
                    ref: dialogRef,
                    role: "dialog",
                    "aria-modal": "true",
                    "aria-label": "Moment story",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            "aria-label": "Close Moment story",
                            onClick: ()=>setSelected(null),
                            className: "bz86-moment-close",
                            children: "×"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                            lineNumber: 30,
                            columnNumber: 235
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "bz86-moment-story-glyph",
                            "aria-hidden": "true",
                            children: selected.symbol
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                            lineNumber: 30,
                            columnNumber: 361
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                            children: [
                                "BAZAARA MOMENTS · ",
                                selected.category.toUpperCase()
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                            lineNumber: 30,
                            columnNumber: 446
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                            children: selected.title
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                            lineNumber: 30,
                            columnNumber: 512
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            children: selected.story
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                            lineNumber: 30,
                            columnNumber: 537
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            onClick: ()=>{
                                setSelected(null);
                                onSearch(selected.prompt);
                            },
                            children: "Explore this topic ↗"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                            lineNumber: 30,
                            columnNumber: 560
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                    lineNumber: 30,
                    columnNumber: 121
                }, this)
            }, void 0, false, {
                fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
                lineNumber: 30,
                columnNumber: 16
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/search-web/components/SearchMoments.tsx",
        lineNumber: 21,
        columnNumber: 9
    }, this);
}
_s(SearchMoments, "qB1WLl3fqY1KaIdSz9lexGQ1ibI=");
_c = SearchMoments;
var _c;
__turbopack_context__.k.register(_c, "SearchMoments");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/search-web/components/SearchSettingsPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>SearchSettingsPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
const COUNTRY_OPTIONS = [
    [
        'ALL',
        'All regions'
    ],
    [
        'NG',
        'Nigeria'
    ],
    [
        'GH',
        'Ghana'
    ],
    [
        'KE',
        'Kenya'
    ],
    [
        'ZA',
        'South Africa'
    ],
    [
        'GB',
        'United Kingdom'
    ],
    [
        'US',
        'United States'
    ],
    [
        'CA',
        'Canada'
    ],
    [
        'IN',
        'India'
    ]
];
const INPUT_LANGUAGES = [
    [
        'auto',
        'Browser default'
    ],
    [
        'en',
        'English'
    ],
    [
        'fr',
        'French'
    ],
    [
        'es',
        'Spanish'
    ],
    [
        'de',
        'German'
    ],
    [
        'pt',
        'Portuguese'
    ],
    [
        'ar',
        'Arabic'
    ],
    [
        'hi',
        'Hindi'
    ],
    [
        'yo',
        'Yorùbá'
    ],
    [
        'ig',
        'Igbo'
    ],
    [
        'ha',
        'Hausa'
    ]
];
function SearchSettingsPanel({ open, initialTab, onClose, dark, onDarkChange, safe, onSafeChange, country, onCountryChange, autoRegion, onAutoRegionChange, regionInfo, savedCount, onClearSaved, bazidHref, prefs, onPrefsChange, historyEnabled, onHistoryEnabledChange, history, onClearHistory, onExport, onAdvancedSearch }) {
    _s();
    const [tab, setTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialTab);
    const [confirm, setConfirm] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(null);
    const [words, setWords] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [phrase, setPhrase] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [exclude, setExclude] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [site, setSite] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [filetype, setFiletype] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const close = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const panel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const closeRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(onClose);
    closeRef.current = onClose;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SearchSettingsPanel.useEffect": ()=>{
            if (open) {
                setTab(initialTab);
                setConfirm(null);
            }
        }
    }["SearchSettingsPanel.useEffect"], [
        open,
        initialTab
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SearchSettingsPanel.useEffect": ()=>{
            if (!open) return;
            const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            const timer = window.setTimeout({
                "SearchSettingsPanel.useEffect.timer": ()=>close.current?.focus()
            }["SearchSettingsPanel.useEffect.timer"], 0);
            function key(e) {
                if (e.key === 'Escape') {
                    e.stopPropagation();
                    closeRef.current();
                    return;
                }
                if (e.key !== 'Tab' || !panel.current) return;
                const els = Array.from(panel.current.querySelectorAll('button:not([disabled]),a[href],select:not([disabled]),input:not([disabled])'));
                if (!els.length) return;
                if (e.shiftKey && document.activeElement === els[0]) {
                    e.preventDefault();
                    els[els.length - 1]?.focus();
                }
                if (!e.shiftKey && document.activeElement === els[els.length - 1]) {
                    e.preventDefault();
                    els[0]?.focus();
                }
            }
            document.addEventListener('keydown', key, true);
            return ({
                "SearchSettingsPanel.useEffect": ()=>{
                    window.clearTimeout(timer);
                    document.removeEventListener('keydown', key, true);
                    previous?.focus();
                }
            })["SearchSettingsPanel.useEffect"];
        }
    }["SearchSettingsPanel.useEffect"], [
        open
    ]);
    function update(name, value) {
        onPrefsChange({
            ...prefs,
            [name]: value
        });
    }
    function build() {
        const query = [
            words.trim(),
            phrase.trim() ? `"${phrase.trim().replace(/"/g, '')}"` : '',
            exclude.trim() ? exclude.trim().split(/\s+/).map((s)=>`-${s.replace(/["\s]/g, '')}`).join(' ') : '',
            site.trim() ? `site:${site.trim().replace(/^https?:\/\//, '').replace(/\s/g, '')}` : '',
            filetype ? `filetype:${filetype}` : ''
        ].filter(Boolean).join(' ').slice(0, 200);
        if (query) {
            onAdvancedSearch(query);
            onClose();
        }
    }
    if (!open) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bz85-screen-backdrop bz85-settings-backdrop",
        onMouseDown: (e)=>{
            if (e.target === e.currentTarget) onClose();
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bz85-settings bz86-settings",
            ref: panel,
            role: "dialog",
            "aria-modal": "true",
            "aria-label": "BAZAARA Search settings",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                    className: "bz85-settings-head",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                    children: "BAZAARA SEARCH · V8.6"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 33,
                                    columnNumber: 48
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    children: "Preferences & privacy"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 33,
                                    columnNumber: 84
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                            lineNumber: 33,
                            columnNumber: 43
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            ref: close,
                            type: "button",
                            className: "bz85-close",
                            onClick: onClose,
                            "aria-label": "Close settings",
                            children: "×"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                            lineNumber: 33,
                            columnNumber: 120
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                    lineNumber: 33,
                    columnNumber: 4
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                    className: "bz85-settings-tabs",
                    "aria-label": "Search settings pages",
                    children: [
                        [
                            'preferences',
                            'Preferences'
                        ],
                        [
                            'advanced',
                            'Advanced Search'
                        ],
                        [
                            'history',
                            'History'
                        ],
                        [
                            'privacy',
                            'Privacy & data'
                        ]
                    ].map(([id, label])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            "aria-current": tab === id ? 'page' : undefined,
                            onClick: ()=>{
                                setTab(id);
                                setConfirm(null);
                            },
                            children: label
                        }, id, false, {
                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                            lineNumber: 34,
                            columnNumber: 219
                        }, this))
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                    lineNumber: 34,
                    columnNumber: 4
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bz85-settings-scroll",
                    children: [
                        tab === 'preferences' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    className: "bz85-preference-section",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            children: "Appearance"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 37,
                                            columnNumber: 51
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: "Adjust only this browser's Search appearance."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 37,
                                            columnNumber: 70
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bz85-control-row",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    htmlFor: "bzs86-theme",
                                                    children: "Theme"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 37,
                                                    columnNumber: 156
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                    id: "bzs86-theme",
                                                    value: dark ? 'dark' : 'light',
                                                    onChange: (e)=>onDarkChange(e.target.value === 'dark'),
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: "dark",
                                                            children: "Neon black"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                            lineNumber: 37,
                                                            columnNumber: 303
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: "light",
                                                            children: "Pearl light"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                            lineNumber: 37,
                                                            columnNumber: 343
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 37,
                                                    columnNumber: 198
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 37,
                                            columnNumber: 122
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 37,
                                    columnNumber: 6
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    className: "bz85-preference-section",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            children: "Search preferences"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 38,
                                            columnNumber: 51
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: "SafeSearch is requested from the connected search provider. Enforcement and supported operators depend on that provider."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 38,
                                            columnNumber: 78
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bz85-control-row",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    htmlFor: "bzs86-safe",
                                                    children: "SafeSearch"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 38,
                                                    columnNumber: 239
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                    id: "bzs86-safe",
                                                    value: safe,
                                                    onChange: (e)=>onSafeChange(e.target.value),
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: "strict",
                                                            children: "Strict"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                            lineNumber: 38,
                                                            columnNumber: 375
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: "moderate",
                                                            children: "Moderate"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                            lineNumber: 38,
                                                            columnNumber: 413
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: "off",
                                                            children: "Off"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                            lineNumber: 38,
                                                            columnNumber: 455
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 38,
                                                    columnNumber: 285
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 38,
                                            columnNumber: 205
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "bz85-switch-row",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: [
                                                        "Open results in a new tab",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                            children: "Use the same tab when disabled."
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                            lineNumber: 39,
                                                            columnNumber: 73
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 39,
                                                    columnNumber: 42
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox",
                                                    checked: prefs.newTab,
                                                    onChange: (e)=>update('newTab', e.target.checked)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 39,
                                                    columnNumber: 126
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 39,
                                            columnNumber: 7
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "bz85-switch-row",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: [
                                                        "Recent search suggestions",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                            children: "Only your optional, browser-saved search history; no invented trends."
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                            lineNumber: 40,
                                                            columnNumber: 73
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 40,
                                                    columnNumber: 42
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox",
                                                    checked: prefs.suggestions,
                                                    onChange: (e)=>update('suggestions', e.target.checked)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 40,
                                                    columnNumber: 164
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 40,
                                            columnNumber: 7
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "bz85-switch-row",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: [
                                                        "Spoken result excerpts",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                            children: "Uses your browser's text-to-speech where available."
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                            lineNumber: 41,
                                                            columnNumber: 70
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 41,
                                                    columnNumber: 42
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox",
                                                    checked: prefs.spokenAnswers,
                                                    onChange: (e)=>update('spokenAnswers', e.target.checked)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 41,
                                                    columnNumber: 143
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 41,
                                            columnNumber: 7
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 38,
                                    columnNumber: 6
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    className: "bz85-preference-section",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            children: "Language & region"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 43,
                                            columnNumber: 51
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: "Language controls voice recognition. Search results are returned by the configured provider, which may independently determine result language."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 43,
                                            columnNumber: 77
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bz85-control-row",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    htmlFor: "bzs86-language",
                                                    children: "Voice input language"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 43,
                                                    columnNumber: 261
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                    id: "bzs86-language",
                                                    value: prefs.language,
                                                    onChange: (e)=>update('language', e.target.value),
                                                    children: INPUT_LANGUAGES.map(([code, label])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: code,
                                                            children: label
                                                        }, code, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                            lineNumber: 43,
                                                            columnNumber: 457
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 43,
                                                    columnNumber: 321
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 43,
                                            columnNumber: 227
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                            className: "bz85-switch-row",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: [
                                                        "Automatic search region",
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                            children: [
                                                                'edge-ip',
                                                                'geoip'
                                                            ].includes(regionInfo.source) ? 'Approximate network country' : 'Browser-locale fallback if no trusted network country is available'
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                            lineNumber: 44,
                                                            columnNumber: 71
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 44,
                                                    columnNumber: 42
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "checkbox",
                                                    checked: autoRegion,
                                                    onChange: (e)=>onAutoRegionChange(e.target.checked)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 44,
                                                    columnNumber: 241
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 44,
                                            columnNumber: 7
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bz85-control-row",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                    htmlFor: "bzs86-country",
                                                    children: "Region"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 45,
                                                    columnNumber: 41
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                    id: "bzs86-country",
                                                    value: COUNTRY_OPTIONS.some(([code])=>code === country) ? country : 'ALL',
                                                    disabled: autoRegion,
                                                    onChange: (e)=>onCountryChange(e.target.value),
                                                    children: COUNTRY_OPTIONS.map(([code, label])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                            value: code,
                                                            children: label
                                                        }, code, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                            lineNumber: 45,
                                                            columnNumber: 287
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 45,
                                                    columnNumber: 86
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 45,
                                            columnNumber: 7
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "bz85-note",
                                            children: [
                                                autoRegion ? regionInfo.label : country,
                                                " · ",
                                                autoRegion ? 'Automatic' : 'Manual',
                                                ". VPNs and deployment configuration can affect IP detection."
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 45,
                                            columnNumber: 352
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 43,
                                    columnNumber: 6
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                            lineNumber: 36,
                            columnNumber: 27
                        }, this),
                        tab === 'advanced' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                            className: "bz85-preference-section bz86-advanced",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    children: "Advanced Search"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 48,
                                    columnNumber: 83
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: "Construct an explicit search query. Operator availability depends on the search provider."
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 48,
                                    columnNumber: 107
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "All these words",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            value: words,
                                            onChange: (e)=>setWords(e.target.value),
                                            placeholder: "e.g. renewable energy"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 48,
                                            columnNumber: 225
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 48,
                                    columnNumber: 203
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Exact phrase",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            value: phrase,
                                            onChange: (e)=>setPhrase(e.target.value),
                                            placeholder: "a quoted phrase"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 48,
                                            columnNumber: 349
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 48,
                                    columnNumber: 330
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Exclude words",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            value: exclude,
                                            onChange: (e)=>setExclude(e.target.value),
                                            placeholder: "words to omit"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 48,
                                            columnNumber: 470
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 48,
                                    columnNumber: 450
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "Within a website",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            value: site,
                                            onChange: (e)=>setSite(e.target.value),
                                            placeholder: "example.org"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 48,
                                            columnNumber: 594
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 48,
                                    columnNumber: 571
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    children: [
                                        "File type",
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                            value: filetype,
                                            onChange: (e)=>setFiletype(e.target.value),
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "",
                                                    children: "Any"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 48,
                                                    columnNumber: 770
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "pdf",
                                                    children: "PDF"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 48,
                                                    columnNumber: 799
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "docx",
                                                    children: "DOCX"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 48,
                                                    columnNumber: 831
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "pptx",
                                                    children: "PPTX"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 48,
                                                    columnNumber: 865
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                    value: "csv",
                                                    children: "CSV"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 48,
                                                    columnNumber: 899
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 48,
                                            columnNumber: 703
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 48,
                                    columnNumber: 687
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "bz85-primary-link",
                                    type: "button",
                                    onClick: build,
                                    children: "Use this query ↗"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 48,
                                    columnNumber: 948
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "bz85-note",
                                    children: "This builder sends a normal text query; it does not enable unsupported backend filters."
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 48,
                                    columnNumber: 1041
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                            lineNumber: 48,
                            columnNumber: 24
                        }, this),
                        tab === 'history' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                            className: "bz85-preference-section",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    children: "Local Search history"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 49,
                                    columnNumber: 68
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    children: "Off by default. Turning this on stores search terms in this browser only. It does not activate provider history or BazID account sync."
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 49,
                                    columnNumber: 97
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                    className: "bz85-switch-row",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            children: [
                                                "Save searches on this device",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                    children: "Up to 80 unique, recent entries."
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 49,
                                                    columnNumber: 307
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 49,
                                            columnNumber: 273
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            type: "checkbox",
                                            checked: historyEnabled,
                                            onChange: (e)=>onHistoryEnabledChange(e.target.checked)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 49,
                                            columnNumber: 361
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 49,
                                    columnNumber: 238
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bz85-data-pill",
                                    children: [
                                        history.length,
                                        " locally saved ",
                                        history.length === 1 ? 'query' : 'queries'
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 49,
                                    columnNumber: 473
                                }, this),
                                history.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bz86-history-list",
                                    children: history.slice(0, 15).map((item)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: [
                                                    item.q,
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                        children: [
                                                            item.category,
                                                            " · ",
                                                            new Date(item.at).toLocaleString()
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                        lineNumber: 50,
                                                        columnNumber: 146
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                lineNumber: 50,
                                                columnNumber: 132
                                            }, this)
                                        }, `${item.at}-${item.category}`, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 50,
                                            columnNumber: 91
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 50,
                                    columnNumber: 25
                                }, this),
                                history.length > 0 && (confirm === 'history' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bz85-confirm",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: "Clear local history from this browser? This will not affect your search provider or BazID."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 51,
                                            columnNumber: 76
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>{
                                                onClearHistory();
                                                setConfirm(null);
                                            },
                                            children: "Delete local history"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 51,
                                            columnNumber: 173
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            onClick: ()=>setConfirm(null),
                                            children: "Cancel"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 51,
                                            columnNumber: 261
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 51,
                                    columnNumber: 46
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    className: "bz85-danger-button",
                                    onClick: ()=>setConfirm('history'),
                                    children: "Clear local history"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 51,
                                    columnNumber: 322
                                }, this)),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: "bz85-primary-link",
                                    onClick: onExport,
                                    children: "Export local Search data"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 52,
                                    columnNumber: 6
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "bz85-note",
                                    children: "Export includes browser history, saved links and preferences—not provider-held records."
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 52,
                                    columnNumber: 110
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                            lineNumber: 49,
                            columnNumber: 23
                        }, this),
                        tab === 'privacy' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    className: "bz85-preference-section",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            children: "Data handling in this Search build"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 55,
                                            columnNumber: 51
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: "Queries are sent through BAZAARA's same-origin Search route to its configured third-party provider. This browser can optionally save history; bookmarks and preferences remain local. The provider and any infrastructure may process requests under their own terms."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 55,
                                            columnNumber: 94
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: "No account-level deletion or retention guarantee is implied by these browser controls."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 55,
                                            columnNumber: 362
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 55,
                                    columnNumber: 6
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                    className: "bz85-primary-link",
                                    href: "/search-data",
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                    children: "Read Search data-handling notes ↗"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 56,
                                    columnNumber: 6
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    className: "bz85-preference-section",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            children: "Saved result links"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 57,
                                            columnNumber: 51
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bz85-data-pill",
                                            children: [
                                                savedCount,
                                                " saved in this browser"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 57,
                                            columnNumber: 78
                                        }, this),
                                        savedCount > 0 && (confirm === 'saved' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bz85-confirm",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    children: "Delete browser-saved links?"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 57,
                                                    columnNumber: 214
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>{
                                                        onClearSaved();
                                                        setConfirm(null);
                                                    },
                                                    children: "Delete links"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 57,
                                                    columnNumber: 248
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>setConfirm(null),
                                                    children: "Cancel"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                    lineNumber: 57,
                                                    columnNumber: 326
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 57,
                                            columnNumber: 184
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            className: "bz85-danger-button",
                                            onClick: ()=>setConfirm('saved'),
                                            children: "Clear saved links"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 57,
                                            columnNumber: 387
                                        }, this))
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 57,
                                    columnNumber: 6
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    className: "bz85-preference-section",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            children: "Camera, microphone & files"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 58,
                                            columnNumber: 51
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: "Browser permissions control camera and microphone. BazLens images are transmitted when you explicitly request analysis. V8.6 text attachments are read locally; only inserted excerpts enter a submitted search query."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 58,
                                            columnNumber: 86
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 58,
                                    columnNumber: 6
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    className: "bz85-preference-section",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            children: "BazID account"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 59,
                                            columnNumber: 51
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: "Use BazID for existing account/security features. This Search release does not claim to synchronize search history or implement account-level data deletion."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 59,
                                            columnNumber: 73
                                        }, this),
                                        bazidHref ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            className: "bz85-primary-link",
                                            href: bazidHref,
                                            children: "Open BazID account ↗"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 59,
                                            columnNumber: 247
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "bz85-note",
                                            children: "BazID URL is not configured for this deployment."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                            lineNumber: 59,
                                            columnNumber: 322
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 59,
                                    columnNumber: 6
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    className: "bz85-primary-link",
                                    onClick: onExport,
                                    children: "Export local Search data"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 60,
                                    columnNumber: 6
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                            lineNumber: 54,
                            columnNumber: 23
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                    lineNumber: 35,
                    columnNumber: 4
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                    className: "bz85-settings-foot",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "bz85-ribbon-mark",
                            children: "B"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                            lineNumber: 62,
                            columnNumber: 49
                        }, this),
                        " BAZAARA Search · Your choices, clearly presented"
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                    lineNumber: 62,
                    columnNumber: 10
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
            lineNumber: 32,
            columnNumber: 3
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
        lineNumber: 31,
        columnNumber: 9
    }, this);
}
_s(SearchSettingsPanel, "3l5zu7tGt5ZCX7f/CSyRbbHEyX8=");
_c = SearchSettingsPanel;
var _c;
__turbopack_context__.k.register(_c, "SearchSettingsPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/apps/search-web/components/searchLocalHistory.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_SEARCH_PREFS",
    ()=>DEFAULT_SEARCH_PREFS,
    "HISTORY_KEY",
    ()=>HISTORY_KEY,
    "HISTORY_OPTIN_KEY",
    ()=>HISTORY_OPTIN_KEY,
    "SEARCH_PREFS_KEY",
    ()=>SEARCH_PREFS_KEY,
    "exportLocalSearchData",
    ()=>exportLocalSearchData,
    "readHistory",
    ()=>readHistory,
    "readPrefs",
    ()=>readPrefs,
    "recordHistory",
    ()=>recordHistory
]);
const HISTORY_KEY = 'bazaara-search-local-history-v86';
const HISTORY_OPTIN_KEY = 'bazaara-search-history-optin-v86';
const SEARCH_PREFS_KEY = 'bazaara-search-preferences-v86';
const DEFAULT_SEARCH_PREFS = {
    language: 'auto',
    newTab: true,
    suggestions: true,
    spokenAnswers: false
};
function readHistory() {
    try {
        const val = JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]');
        if (!Array.isArray(val)) return [];
        return val.filter((v)=>!!v && typeof v.q === 'string' && v.q.length <= 200 && [
                'web',
                'news',
                'images'
            ].includes(v.category) && typeof v.at === 'number' && Number.isFinite(v.at)).slice(0, 80);
    } catch  {
        return [];
    }
}
function recordHistory(entry) {
    if (localStorage.getItem(HISTORY_OPTIN_KEY) !== 'on') return readHistory();
    const next = [
        entry,
        ...readHistory().filter((v)=>!(v.q.toLowerCase() === entry.q.toLowerCase() && v.category === entry.category))
    ].slice(0, 80);
    try {
        localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch  {}
    return next;
}
function readPrefs() {
    try {
        const raw = JSON.parse(localStorage.getItem(SEARCH_PREFS_KEY) || 'null');
        if (!raw || typeof raw !== 'object') return {
            ...DEFAULT_SEARCH_PREFS
        };
        const value = raw;
        return {
            language: typeof value.language === 'string' && /^(auto|[a-z]{2}(?:-[A-Z]{2})?)$/.test(value.language) ? value.language : 'auto',
            newTab: typeof value.newTab === 'boolean' ? value.newTab : true,
            suggestions: typeof value.suggestions === 'boolean' ? value.suggestions : true,
            spokenAnswers: typeof value.spokenAnswers === 'boolean' ? value.spokenAnswers : false
        };
    } catch  {
        return {
            ...DEFAULT_SEARCH_PREFS
        };
    }
}
function exportLocalSearchData(history, pins, prefs) {
    const payload = {
        version: 1,
        exportedAt: new Date().toISOString(),
        scope: 'This browser only; not BazID or search-provider data.',
        history,
        savedLinks: pins,
        preferences: prefs
    };
    const url = URL.createObjectURL(new Blob([
        JSON.stringify(payload, null, 2)
    ], {
        type: 'application/json'
    }));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'bazaara-search-local-data.json';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url), 2500);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=apps_search-web_components_1au-2ny._.js.map