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
                        els[els.length - 1].focus();
                    } else if (!event.shiftKey && document.activeElement === els[els.length - 1]) {
                        event.preventDefault();
                        els[0].focus();
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
        [next[at], next[destination]] = [
            next[destination],
            next[at]
        ];
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
                            lineNumber: 118,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "bz85-app-name",
                            children: app.name
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 119,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                    lineNumber: 117,
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
                            lineNumber: 121,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "bz85-app-name",
                            children: app.name
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 122,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                            children: "Not configured"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 123,
                            columnNumber: 9
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                    lineNumber: 120,
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
                            lineNumber: 125,
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
                                    lineNumber: 125,
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
                                    lineNumber: 125,
                                    columnNumber: 374
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 125,
                            columnNumber: 229
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                    lineNumber: 125,
                    columnNumber: 19
                }, this)
            ]
        }, app.id, true, {
            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
            lineNumber: 116,
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
                                    lineNumber: 131,
                                    columnNumber: 47
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    children: "Apps"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                    lineNumber: 131,
                                    columnNumber: 83
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 131,
                            columnNumber: 42
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: "bz85-close",
                            onClick: onClose,
                            "aria-label": "Close app launcher",
                            children: "×"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 131,
                            columnNumber: 102
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                    lineNumber: 131,
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
                            lineNumber: 132,
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
                            lineNumber: 132,
                            columnNumber: 71
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                    lineNumber: 132,
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
                                            lineNumber: 134,
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
                                            lineNumber: 134,
                                            columnNumber: 137
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                    lineNumber: 134,
                                    columnNumber: 79
                                }, this),
                                favApps.length ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "bz85-app-grid",
                                    children: favApps.map((app)=>tile(app, true))
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                    lineNumber: 135,
                                    columnNumber: 29
                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "bz85-empty",
                                    children: "No matching favorites. Browse the full catalog below."
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                    lineNumber: 135,
                                    columnNumber: 103
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 134,
                            columnNumber: 9
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "bz85-section-divider"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 137,
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
                                            lineNumber: 140,
                                            columnNumber: 123
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                        lineNumber: 140,
                                        columnNumber: 88
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bz85-app-grid",
                                        children: section.map((app)=>tile(app, favorites.includes(app.id)))
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                        lineNumber: 140,
                                        columnNumber: 148
                                    }, this)
                                ]
                            }, category, true, {
                                fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                                lineNumber: 140,
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
                                    lineNumber: 141,
                                    columnNumber: 118
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 141,
                            columnNumber: 14
                        }, this),
                        visible.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "bz85-empty",
                            children: "No apps matched your search."
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 142,
                            columnNumber: 32
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                    lineNumber: 133,
                    columnNumber: 7
                }, this),
                notice && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bz85-live-note",
                    role: "status",
                    children: notice
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                    lineNumber: 144,
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
                            lineNumber: 145,
                            columnNumber: 43
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: "Connected by BazID"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                            lineNumber: 145,
                            columnNumber: 86
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
                    lineNumber: 145,
                    columnNumber: 7
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
            lineNumber: 130,
            columnNumber: 5
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/search-web/components/SearchAppLauncher.tsx",
        lineNumber: 129,
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
        'Yorùbá',
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
        'हिन्दी',
        'বাংলা',
        'తెలుగు',
        'मराठी'
    ],
    CA: [
        'Français'
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
                    lineNumber: 52,
                    columnNumber: 15
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "m16.2 16.2 5 5"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 52,
                    columnNumber: 53
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 52,
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
                    lineNumber: 53,
                    columnNumber: 14
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 53,
                    columnNumber: 45
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 53,
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
                    lineNumber: 54,
                    columnNumber: 14
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "8",
                    cy: "9",
                    r: "1.6"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 54,
                    columnNumber: 63
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "m3 17 5-5 4 4 3-3 6 6"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 54,
                    columnNumber: 94
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 54,
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
                    lineNumber: 55,
                    columnNumber: 13
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M8 8h8M8 12h8M8 16h5"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 55,
                    columnNumber: 62
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 55,
            columnNumber: 11
        }, this),
        map: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "m3 5 6-2 6 3 6-3v16l-6 2-6-3-6 3V5Zm6-2v15m6-12v15"
            }, void 0, false, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 56,
                columnNumber: 12
            }, this)
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 56,
            columnNumber: 10
        }, this),
        spark: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "m12 2 2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3L12 2Z"
            }, void 0, false, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 57,
                columnNumber: 14
            }, this)
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 57,
            columnNumber: 12
        }, this),
        arrow: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M4 12h16m-7-7 7 7-7 7"
            }, void 0, false, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 58,
                columnNumber: 14
            }, this)
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 58,
            columnNumber: 12
        }, this),
        chevron: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "m6 9 6 6 6-6"
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 58,
            columnNumber: 61
        }, this),
        x: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M5 5 19 19M19 5 5 19"
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 59,
            columnNumber: 8
        }, this),
        filter: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M4 7h16M4 17h16"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 60,
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
                    lineNumber: 60,
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
                    lineNumber: 60,
                    columnNumber: 105
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 60,
            columnNumber: 13
        }, this),
        shield: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "m12 2 8 4v6c0 5-3 8-8 10-5-2-8-5-8-10V6l8-4Z"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 61,
                    columnNumber: 15
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "m8.5 12 2.5 2.5 4.5-5"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 61,
                    columnNumber: 71
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 61,
            columnNumber: 13
        }, this),
        bookmark: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M6 4h12v17l-6-4-6 4V4Z"
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 62,
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
                    lineNumber: 62,
                    columnNumber: 59
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 62,
                    columnNumber: 108
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 62,
            columnNumber: 57
        }, this),
        check: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "m5 12 4 4 10-10"
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 63,
            columnNumber: 12
        }, this),
        menu: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M4 6h16M4 12h16M4 18h16"
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 63,
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
                    lineNumber: 64,
                    columnNumber: 15
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M10 4v16"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 64,
                    columnNumber: 64
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 64,
            columnNumber: 13
        }, this),
        external: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M13 4h7v7M20 4l-9 9"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 65,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M19 14v5H5V5h6"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 65,
                    columnNumber: 48
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 65,
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
                    lineNumber: 66,
                    columnNumber: 14
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M12 7v5l3 2"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 66,
                    columnNumber: 45
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 66,
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
                    lineNumber: 67,
                    columnNumber: 12
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M5 11a7 7 0 0 0 14 0M12 18v4m-4 0h8"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 67,
                    columnNumber: 60
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 67,
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
                    lineNumber: 68,
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
                    lineNumber: 68,
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
                    lineNumber: 68,
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
                    lineNumber: 68,
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
                    lineNumber: 68,
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
                    lineNumber: 68,
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
                    lineNumber: 68,
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
                    lineNumber: 68,
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
                    lineNumber: 68,
                    columnNumber: 399
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 68,
            columnNumber: 11
        }, this),
        camera: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M3 7h4l2-3h6l2 3h4v12H3V7Z"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 69,
                    columnNumber: 15
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "12",
                    cy: "13",
                    r: "3.5"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 69,
                    columnNumber: 53
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 69,
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
        lineNumber: 71,
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
        label: 'Detecting region…',
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
            if (push) window.history.pushState(null, '', `?${params}`);
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
            recognition.lang = navigator.language || 'en-US';
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
                                lineNumber: 210,
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
                                        lineNumber: 212,
                                        columnNumber: 60
                                    }, this),
                                    !hasQuery && category === 'web' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "bz84-head-link",
                                        onClick: ()=>setCategory('images'),
                                        children: "Images"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 213,
                                        columnNumber: 45
                                    }, this),
                                    !hasQuery && category === 'images' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "bz84-head-link",
                                        onClick: ()=>setCategory('web'),
                                        children: "Search"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 214,
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
                                        lineNumber: 215,
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
                                            lineNumber: 216,
                                            columnNumber: 198
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 216,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        className: "bzs-avatar",
                                        href: links.bazid ? links.bazid + 'account' : '#',
                                        "aria-label": "BazID account",
                                        children: "B"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 217,
                                        columnNumber: 11
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 211,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 209,
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
                                                    lineNumber: 222,
                                                    columnNumber: 82
                                                }, this),
                                                !hasQuery && category === 'images' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "bz84-product-label",
                                                    children: "images"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 222,
                                                    columnNumber: 161
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 222,
                                            columnNumber: 77
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 222,
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
                                                        "aria-label": "Add image input",
                                                        title: "Search with an image",
                                                        onClick: ()=>{
                                                            setLensOpen(true);
                                                            setLensError('');
                                                        },
                                                        children: "+"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 225,
                                                        columnNumber: 46
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                        name: "search",
                                                        size: 24
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 225,
                                                        columnNumber: 212
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                        ref: input,
                                                        value: query,
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
                                                        lineNumber: 226,
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
                                                            lineNumber: 227,
                                                            columnNumber: 170
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 227,
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
                                                            lineNumber: 228,
                                                            columnNumber: 126
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 228,
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
                                                            lineNumber: 229,
                                                            columnNumber: 172
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 229,
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
                                                                lineNumber: 230,
                                                                columnNumber: 227
                                                            }, this),
                                                            " AI Mode"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 230,
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
                                                            lineNumber: 231,
                                                            columnNumber: 106
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 231,
                                                        columnNumber: 26
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 224,
                                                columnNumber: 11
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
                                                            lineNumber: 233,
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
                                                                lineNumber: 233,
                                                                columnNumber: 296
                                                            }, this)),
                                                        links.bazclips && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                            href: links.bazclips,
                                                            children: "Videos"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 233,
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
                                                                            lineNumber: 233,
                                                                            columnNumber: 732
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                    lineNumber: 233,
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
                                                                            lineNumber: 233,
                                                                            columnNumber: 823
                                                                        }, this),
                                                                        links.bmap && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                            role: "menuitem",
                                                                            href: links.bmap,
                                                                            children: "BMap"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 233,
                                                                            columnNumber: 911
                                                                        }, this),
                                                                        links.shopping && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                            role: "menuitem",
                                                                            href: links.shopping,
                                                                            children: "Shopping"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 233,
                                                                            columnNumber: 974
                                                                        }, this),
                                                                        links.learn && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                            role: "menuitem",
                                                                            href: links.learn,
                                                                            children: "Books"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 233,
                                                                            columnNumber: 1042
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                    lineNumber: 233,
                                                                    columnNumber: 784
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 233,
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
                                                                            lineNumber: 233,
                                                                            columnNumber: 1333
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                    lineNumber: 233,
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
                                                                                    lineNumber: 233,
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
                                                                                            lineNumber: 233,
                                                                                            columnNumber: 1673
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                            value: "moderate",
                                                                                            children: "Moderate"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                            lineNumber: 233,
                                                                                            columnNumber: 1711
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                            value: "off",
                                                                                            children: "Off"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                            lineNumber: 233,
                                                                                            columnNumber: 1753
                                                                                        }, this)
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 233,
                                                                                    columnNumber: 1496
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 233,
                                                                            columnNumber: 1441
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "bz82-tools-region",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    children: "Search region"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 233,
                                                                                    columnNumber: 1835
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                                    children: regionMeta.country === 'ALL' ? 'Automatic' : regionMeta.label
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 233,
                                                                                    columnNumber: 1861
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                                    children: regionMeta.source === 'edge-ip' || regionMeta.source === 'geoip' ? 'Detected automatically from your network country' : regionMeta.source === 'browser-locale' ? 'Local fallback from browser locale' : 'Automatic country detection will apply when IP-aware deployment data is available'
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 233,
                                                                                    columnNumber: 1935
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 233,
                                                                            columnNumber: 1800
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                    lineNumber: 233,
                                                                    columnNumber: 1386
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 233,
                                                            columnNumber: 1103
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 233,
                                                    columnNumber: 66
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 233,
                                                columnNumber: 24
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 223,
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
                                                        lineNumber: 237,
                                                        columnNumber: 13
                                                    }, this),
                                                    links.news && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                        href: links.news,
                                                        children: "Explore"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 238,
                                                        columnNumber: 28
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 236,
                                                columnNumber: 11
                                            }, this),
                                            regionalLanguages(regionMeta.country).length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "bz84-languages",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Regional languages:"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 240,
                                                        columnNumber: 92
                                                    }, this),
                                                    regionalLanguages(regionMeta.country).map((language)=>links.translate ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                            href: links.translate,
                                                            title: `Open BAZAARA Translate for ${language}`,
                                                            children: language
                                                        }, language, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 240,
                                                            columnNumber: 193
                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: language
                                                        }, language, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 240,
                                                            columnNumber: 298
                                                        }, this))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 240,
                                                columnNumber: 62
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 235,
                                        columnNumber: 23
                                    }, this),
                                    !hasQuery && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                                        className: "bz84-home-footer",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: regionMeta.country === 'ALL' ? 'Region automatic' : regionMeta.label
                                            }, void 0, false, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 242,
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
                                                        lineNumber: 242,
                                                        columnNumber: 173
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        className: "bz85-footer-control",
                                                        onClick: ()=>openSettings('preferences'),
                                                        children: "Settings"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 242,
                                                        columnNumber: 281
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 242,
                                                columnNumber: 141
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 242,
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
                                                        children: loading ? 'Finding sources…' : error ? 'Search could not complete' : data ? `${results.length} results on this page` : 'Preparing results'
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 244,
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
                                                                lineNumber: 244,
                                                                columnNumber: 260
                                                            }, this),
                                                            " Copy search link"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 244,
                                                        columnNumber: 189
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 244,
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
                                                                lineNumber: 245,
                                                                columnNumber: 95
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 245,
                                                                columnNumber: 102
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 245,
                                                                columnNumber: 109
                                                            }, this)
                                                        ]
                                                    }, n, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 245,
                                                        columnNumber: 82
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 245,
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
                                                        lineNumber: 246,
                                                        columnNumber: 73
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                        children: error.code === 'PROVIDER_NOT_CONFIGURED' ? 'Search provider not yet connected' : 'Search is temporarily unavailable'
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 246,
                                                        columnNumber: 114
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        children: error.message
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 246,
                                                        columnNumber: 235
                                                    }, this),
                                                    error.code === 'PROVIDER_NOT_CONFIGURED' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "bzs-setup",
                                                        children: [
                                                            "Configure ",
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                                                children: "BRAVE_SEARCH_API_KEY"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 246,
                                                                columnNumber: 335
                                                            }, this),
                                                            " on Search API port 4020; BAZAARA will never invent search results while disconnected."
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 246,
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
                                                                lineNumber: 246,
                                                                columnNumber: 547
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 246,
                                                        columnNumber: 459
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 246,
                                                columnNumber: 33
                                            }, this),
                                            !loading && data && results.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bzs-error",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                        children: "No matching sources"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 247,
                                                        columnNumber: 81
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        children: "Try a different query, region or result category."
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 247,
                                                        columnNumber: 109
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 247,
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
                                                                                    lineNumber: 249,
                                                                                    columnNumber: 139
                                                                                }, this)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 249,
                                                                                columnNumber: 105
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                children: "SOURCE FOCUS"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 249,
                                                                                columnNumber: 176
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "bzs-evidence-badge",
                                                                                children: "From live results"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 249,
                                                                                columnNumber: 201
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 249,
                                                                        columnNumber: 72
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                                        children: results[0]?.title
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 249,
                                                                        columnNumber: 268
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        children: results[0]?.description || 'Open the original source to read the full article.'
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 249,
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
                                                                                        lineNumber: 249,
                                                                                        columnNumber: 544
                                                                                    }, this),
                                                                                    r.displayUrl,
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                                        name: "external",
                                                                                        size: 12
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                        lineNumber: 249,
                                                                                        columnNumber: 630
                                                                                    }, this)
                                                                                ]
                                                                            }, r.url, true, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 249,
                                                                                columnNumber: 445
                                                                            }, this))
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 249,
                                                                        columnNumber: 384
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                        children: "This is an excerpt of an actual search result, not an AI-generated answer."
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 249,
                                                                        columnNumber: 675
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 249,
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
                                                                        lineNumber: 250,
                                                                        columnNumber: 87
                                                                    }, this),
                                                                    " Image previews are loaded from provider-supplied HTTPS sources."
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 250,
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
                                                                                    lineNumber: 252,
                                                                                    columnNumber: 100
                                                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                                    name: "image",
                                                                                    size: 36
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 252,
                                                                                    columnNumber: 176
                                                                                }, this)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 252,
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
                                                                                                lineNumber: 253,
                                                                                                columnNumber: 83
                                                                                            }, this),
                                                                                            r.displayUrl,
                                                                                            r.age && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                children: [
                                                                                                    "· ",
                                                                                                    r.age
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                lineNumber: 253,
                                                                                                columnNumber: 177
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                        lineNumber: 253,
                                                                                        columnNumber: 48
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                                        className: "bzs-result-title",
                                                                                        href: r.url,
                                                                                        target: "_blank",
                                                                                        rel: "noopener noreferrer",
                                                                                        referrerPolicy: "no-referrer",
                                                                                        children: r.title
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                        lineNumber: 253,
                                                                                        columnNumber: 206
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                        children: r.description
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                        lineNumber: 253,
                                                                                        columnNumber: 335
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
                                                                                                        lineNumber: 253,
                                                                                                        columnNumber: 448
                                                                                                    }, this),
                                                                                                    " Focus"
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                lineNumber: 253,
                                                                                                columnNumber: 393
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                type: "button",
                                                                                                onClick: ()=>setAboutUrl(r.url),
                                                                                                children: "About result"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                lineNumber: 253,
                                                                                                columnNumber: 494
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
                                                                                                        lineNumber: 253,
                                                                                                        columnNumber: 657
                                                                                                    }, this),
                                                                                                    pins.some((p)=>p.url === r.url) ? 'Saved' : 'Save'
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                lineNumber: 253,
                                                                                                columnNumber: 570
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
                                                                                                        lineNumber: 253,
                                                                                                        columnNumber: 835
                                                                                                    }, this),
                                                                                                    " Copy"
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                lineNumber: 253,
                                                                                                columnNumber: 781
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                        lineNumber: 253,
                                                                                        columnNumber: 357
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 253,
                                                                                columnNumber: 15
                                                                            }, this)
                                                                        ]
                                                                    }, `${r.url}-${index}`, true, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 251,
                                                                        columnNumber: 110
                                                                    }, this))
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 251,
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
                                                                        lineNumber: 254,
                                                                        columnNumber: 83
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        children: [
                                                                            "Page ",
                                                                            page
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 254,
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
                                                                                lineNumber: 254,
                                                                                columnNumber: 429
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 254,
                                                                        columnNumber: 271
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 254,
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
                                                                lineNumber: 255,
                                                                columnNumber: 13
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 248,
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
                                                                        lineNumber: 256,
                                                                        columnNumber: 106
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                        name: "spark",
                                                                        size: 17
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 256,
                                                                        columnNumber: 138
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 256,
                                                                columnNumber: 70
                                                            }, this),
                                                            selected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "bzs-insight-logo",
                                                                        children: selected.displayUrl[0]?.toUpperCase()
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 256,
                                                                        columnNumber: 189
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                                        children: selected.title
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 256,
                                                                        columnNumber: 270
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "bzs-insight-domain",
                                                                        children: selected.displayUrl
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 256,
                                                                        columnNumber: 295
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        children: selected.description || 'Open this source to learn more.'
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 256,
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
                                                                                lineNumber: 256,
                                                                                columnNumber: 566
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 256,
                                                                        columnNumber: 422
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 256,
                                                                columnNumber: 187
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "bzs-insight-divider"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 257,
                                                                columnNumber: 13
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                                children: "Compare sources"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 257,
                                                                columnNumber: 51
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "bzs-insight-help",
                                                                children: "Select a result to inspect its published excerpt. Compare information using the original pages."
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 257,
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
                                                                            lineNumber: 257,
                                                                            columnNumber: 357
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            children: [
                                                                                r.title,
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                                    children: r.displayUrl
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 257,
                                                                                    columnNumber: 444
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 257,
                                                                            columnNumber: 429
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                            name: "chevron",
                                                                            size: 15
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 257,
                                                                            columnNumber: 480
                                                                        }, this)
                                                                    ]
                                                                }, r.url, true, {
                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                    lineNumber: 257,
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
                                                                        lineNumber: 258,
                                                                        columnNumber: 47
                                                                    }, this),
                                                                    " Source context only. No invented summaries, statistics or ratings."
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 258,
                                                                columnNumber: 13
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 256,
                                                        columnNumber: 39
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 248,
                                                columnNumber: 52
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 243,
                                        columnNumber: 43
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 221,
                                columnNumber: 48
                            }, this),
                            screen === 'Notifications' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "bzs-v5-page",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        children: "Notifications"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 262,
                                        columnNumber: 69
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "Notifications are not enabled yet. No alerts will be fabricated."
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 262,
                                        columnNumber: 91
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 262,
                                columnNumber: 36
                            }, this),
                            screen === 'Activity' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "bzs-v5-page",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        children: "Activity"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 263,
                                        columnNumber: 64
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "Links saved in this browser"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 263,
                                        columnNumber: 81
                                    }, this),
                                    pins.length ? pins.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: p.url,
                                            target: "_blank",
                                            rel: "noopener noreferrer",
                                            children: [
                                                p.title,
                                                " ↗"
                                            ]
                                        }, p.url, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 263,
                                            columnNumber: 140
                                        }, this)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "No saved links yet."
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 263,
                                        columnNumber: 227
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 263,
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
                                                            lineNumber: 265,
                                                            columnNumber: 261
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                            children: aboutResult.displayUrl
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 265,
                                                            columnNumber: 317
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 265,
                                                    columnNumber: 256
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>setAboutUrl(null),
                                                    "aria-label": "Close",
                                                    children: "×"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 265,
                                                    columnNumber: 356
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 265,
                                            columnNumber: 248
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: aboutResult.description || 'No provider excerpt was returned for this result.'
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 265,
                                            columnNumber: 434
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                            children: "Destination"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 265,
                                                            columnNumber: 528
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                            children: aboutResult.displayUrl
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 265,
                                                            columnNumber: 548
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 265,
                                                    columnNumber: 523
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                            children: "Result type"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 265,
                                                            columnNumber: 592
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                            children: category === 'images' ? 'Image result' : category === 'news' ? 'News result' : 'Web result'
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 265,
                                                            columnNumber: 612
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 265,
                                                    columnNumber: 587
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                            children: "Provider"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 265,
                                                            columnNumber: 713
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                            children: data?.provider || 'Connected search provider'
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 265,
                                                            columnNumber: 730
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 265,
                                                    columnNumber: 708
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 265,
                                            columnNumber: 519
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: aboutResult.url,
                                            target: "_blank",
                                            rel: "noopener noreferrer",
                                            referrerPolicy: "no-referrer",
                                            children: "Open original source ↗"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 265,
                                            columnNumber: 795
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                                            children: "BAZAARA shows provider-supplied source metadata only. It does not fabricate trust scores, ownership claims or publisher ratings."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 265,
                                            columnNumber: 918
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                    lineNumber: 265,
                                    columnNumber: 147
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 265,
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
                                                            lineNumber: 266,
                                                            columnNumber: 249
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                            children: voiceListening ? 'Listening…' : voiceTranscript ? 'Ready to search' : 'Speak your search'
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 266,
                                                            columnNumber: 300
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 266,
                                                    columnNumber: 244
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: closeVoice,
                                                    "aria-label": "Close voice search",
                                                    children: "×"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 266,
                                                    columnNumber: 398
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 266,
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
                                                        lineNumber: 266,
                                                        columnNumber: 575
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 266,
                                                    columnNumber: 569
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 266,
                                                    columnNumber: 610
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 266,
                                                    columnNumber: 614
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 266,
                                                    columnNumber: 618
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 266,
                                            columnNumber: 492
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "bz8-voice-transcript",
                                            children: voiceTranscript || voiceError || 'Say a word, place, question or topic.'
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 266,
                                            columnNumber: 628
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
                                                    lineNumber: 266,
                                                    columnNumber: 791
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    className: "bz8-primary",
                                                    disabled: !voiceTranscript.trim(),
                                                    onClick: submitVoice,
                                                    children: "Search"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 266,
                                                    columnNumber: 857
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 266,
                                            columnNumber: 738
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                                            children: [
                                                "Recognition language: ",
                                                typeof navigator !== 'undefined' ? navigator.language || 'browser default' : 'browser default',
                                                " · Microphone is used only while listening."
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 266,
                                            columnNumber: 981
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                    lineNumber: 266,
                                    columnNumber: 140
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 266,
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
                                                            lineNumber: 267,
                                                            columnNumber: 263
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                            children: "Search any image"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 267,
                                                            columnNumber: 309
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            children: "Drop an image, upload a file or import an HTTPS image link."
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 267,
                                                            columnNumber: 334
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 267,
                                                    columnNumber: 258
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: closeLens,
                                                    "aria-label": "Close BazLens",
                                                    children: "×"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 267,
                                                    columnNumber: 406
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 267,
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
                                            lineNumber: 267,
                                            columnNumber: 494
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
                                                lineNumber: 267,
                                                columnNumber: 830
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "bz8-lens-upload-icon",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                            name: "image",
                                                            size: 34
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 267,
                                                            columnNumber: 931
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 267,
                                                        columnNumber: 892
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: "Drag an image here"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 267,
                                                        columnNumber: 968
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "or"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 267,
                                                        columnNumber: 1003
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: ()=>lensInput.current?.click(),
                                                        children: "Upload a file"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 267,
                                                        columnNumber: 1018
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 267,
                                                columnNumber: 890
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 267,
                                            columnNumber: 638
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bz8-lens-or",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 267,
                                                    columnNumber: 1142
                                                }, this),
                                                "OR",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 267,
                                                    columnNumber: 1151
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 267,
                                            columnNumber: 1113
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
                                                    lineNumber: 267,
                                                    columnNumber: 1194
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    disabled: !lensUrl.trim(),
                                                    onClick: ()=>void importLensUrl(),
                                                    children: "Import"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 267,
                                                    columnNumber: 1324
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 267,
                                            columnNumber: 1164
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
                                                    lineNumber: 267,
                                                    columnNumber: 1505
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    role: "tab",
                                                    "aria-selected": lensMode === 'text',
                                                    onClick: ()=>setLensMode('text'),
                                                    children: "Text"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 267,
                                                    columnNumber: 1620
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    role: "tab",
                                                    "aria-selected": lensMode === 'objects',
                                                    onClick: ()=>setLensMode('objects'),
                                                    children: "Shopping & objects"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 267,
                                                    columnNumber: 1720
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 267,
                                            columnNumber: 1429
                                        }, this),
                                        lensError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "bz8-lens-error",
                                            role: "alert",
                                            children: lensError
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 267,
                                            columnNumber: 1858
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
                                                            lineNumber: 267,
                                                            columnNumber: 1990
                                                        }, this),
                                                        lensResult.text.slice(0, 420)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 267,
                                                    columnNumber: 1987
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
                                                            lineNumber: 267,
                                                            columnNumber: 2128
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 267,
                                                    columnNumber: 2086
                                                }, this),
                                                lensResult.matches.slice(0, 3).map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                        href: m.url,
                                                        target: "_blank",
                                                        rel: "noopener noreferrer",
                                                        referrerPolicy: "no-referrer",
                                                        children: [
                                                            m.title,
                                                            " ↗"
                                                        ]
                                                    }, m.url, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 267,
                                                        columnNumber: 2291
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 267,
                                            columnNumber: 1930
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
                                                    lineNumber: 267,
                                                    columnNumber: 2447
                                                }, this),
                                                links.bazlens && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                    href: links.bazlens,
                                                    children: "Open full BazLens ↗"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 267,
                                                    columnNumber: 2571
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    className: "bz8-primary",
                                                    disabled: !lensFile || lensLoading,
                                                    onClick: ()=>void analyzeLens(),
                                                    children: lensLoading ? 'Analyzing…' : 'Search image'
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 267,
                                                    columnNumber: 2619
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 267,
                                            columnNumber: 2414
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                            className: "bz8-lens-privacy",
                                            children: "Images are sent only when you press Search image. BazLens provider configuration determines analysis availability."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 267,
                                            columnNumber: 2788
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                    lineNumber: 267,
                                    columnNumber: 138
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 267,
                                columnNumber: 20
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 220,
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
                                        children: t === 'Home' ? '⌂' : t === 'Search' ? '⌕' : t === 'Notifications' ? '♧' : '◷'
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 269,
                                        columnNumber: 300
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: t
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 269,
                                        columnNumber: 374
                                    }, this)
                                ]
                            }, t, true, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 269,
                                columnNumber: 133
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 269,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 208,
                columnNumber: 5
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$apps$2f$search$2d$web$2f$components$2f$SearchAppLauncher$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                open: launcherOpen,
                onClose: closeLauncher
            }, void 0, false, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 271,
                columnNumber: 5
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
                bazidHref: links.bazid ? `${links.bazid}account` : undefined
            }, void 0, false, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 272,
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
                            lineNumber: 273,
                            columnNumber: 136
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 273,
                        columnNumber: 65
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 273,
                columnNumber: 16
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
        lineNumber: 207,
        columnNumber: 10
    }, this);
}
_s(SearchExperience, "47J+jCwIrcaguTnt6530tHfD1A0=");
_c1 = SearchExperience;
var _c, _c1;
__turbopack_context__.k.register(_c, "Icon");
__turbopack_context__.k.register(_c1, "SearchExperience");
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
function SearchSettingsPanel({ open, initialTab, onClose, dark, onDarkChange, safe, onSafeChange, country, onCountryChange, autoRegion, onAutoRegionChange, regionInfo, savedCount, onClearSaved, bazidHref }) {
    _s();
    const [tab, setTab] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(initialTab);
    const [confirmClear, setConfirmClear] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const close = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const panel = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(null);
    const onCloseRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRef"])(onClose);
    onCloseRef.current = onClose;
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useEffect"])({
        "SearchSettingsPanel.useEffect": ()=>{
            if (open) {
                setTab(initialTab);
                setConfirmClear(false);
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
            const key = {
                "SearchSettingsPanel.useEffect.key": (event)=>{
                    if (event.key === 'Escape') {
                        event.stopPropagation();
                        onCloseRef.current();
                    }
                    if (event.key !== 'Tab' || !panel.current) return;
                    const els = Array.from(panel.current.querySelectorAll('button:not([disabled]),a[href],select:not([disabled]),input:not([disabled])'));
                    if (!els.length) return;
                    if (event.shiftKey && document.activeElement === els[0]) {
                        event.preventDefault();
                        els[els.length - 1].focus();
                    } else if (!event.shiftKey && document.activeElement === els[els.length - 1]) {
                        event.preventDefault();
                        els[0].focus();
                    }
                }
            }["SearchSettingsPanel.useEffect.key"];
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
    if (!open) return null;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "bz85-screen-backdrop bz85-settings-backdrop",
        onMouseDown: (e)=>{
            if (e.target === e.currentTarget) onClose();
        },
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "bz85-settings",
            role: "dialog",
            "aria-modal": "true",
            "aria-label": "BAZAARA Search settings",
            ref: panel,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                    className: "bz85-settings-head",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                    children: "BAZAARA SEARCH"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 42,
                                    columnNumber: 51
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                    children: "Settings & privacy"
                                }, void 0, false, {
                                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                    lineNumber: 42,
                                    columnNumber: 80
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                            lineNumber: 42,
                            columnNumber: 46
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
                            lineNumber: 42,
                            columnNumber: 113
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                    lineNumber: 42,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                    className: "bz85-settings-tabs",
                    "aria-label": "Settings pages",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            "aria-current": tab === 'preferences' ? 'page' : undefined,
                            onClick: ()=>setTab('preferences'),
                            children: "Preferences"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                            lineNumber: 43,
                            columnNumber: 71
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            "aria-current": tab === 'privacy' ? 'page' : undefined,
                            onClick: ()=>setTab('privacy'),
                            children: "Privacy & data"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                            lineNumber: 43,
                            columnNumber: 201
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                    lineNumber: 43,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "bz85-settings-scroll",
                    children: tab === 'preferences' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "bz85-preference-section",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "Appearance"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 46,
                                        columnNumber: 54
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "Choose the appearance of Search on this browser."
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 46,
                                        columnNumber: 73
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bz85-control-row",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                htmlFor: "bz85-theme",
                                                children: "Color theme"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                lineNumber: 46,
                                                columnNumber: 162
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                id: "bz85-theme",
                                                value: dark ? 'dark' : 'light',
                                                onChange: (e)=>onDarkChange(e.target.value === 'dark'),
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: "dark",
                                                        children: "Neon black"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                        lineNumber: 46,
                                                        columnNumber: 313
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: "light",
                                                        children: "Pearl light"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                        lineNumber: 46,
                                                        columnNumber: 353
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                lineNumber: 46,
                                                columnNumber: 209
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 46,
                                        columnNumber: 128
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                lineNumber: 46,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "bz85-preference-section",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "Search content"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 47,
                                        columnNumber: 54
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "Filtering requests are sent to the connected search provider. The provider determines actual enforcement."
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 47,
                                        columnNumber: 77
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bz85-control-row",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                htmlFor: "bz85-safety",
                                                children: "SafeSearch"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                lineNumber: 47,
                                                columnNumber: 223
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                id: "bz85-safety",
                                                value: safe,
                                                onChange: (e)=>onSafeChange(e.target.value),
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: "strict",
                                                        children: "Strict"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                        lineNumber: 47,
                                                        columnNumber: 361
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: "moderate",
                                                        children: "Moderate"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                        lineNumber: 47,
                                                        columnNumber: 399
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: "off",
                                                        children: "Off"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                        lineNumber: 47,
                                                        columnNumber: 441
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                lineNumber: 47,
                                                columnNumber: 270
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 47,
                                        columnNumber: 189
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                lineNumber: 47,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "bz85-preference-section",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "Language & region"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 48,
                                        columnNumber: 54
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "When available, BAZAARA uses deployment-supplied network country. On localhost, browser locale may be used instead."
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 48,
                                        columnNumber: 80
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "bz85-switch-row",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: [
                                                    "Automatic search region",
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                        children: regionInfo.source === 'edge-ip' || regionInfo.source === 'geoip' ? 'Country estimated from your network' : regionInfo.source === 'browser-locale' ? 'Browser locale fallback' : 'Location not verified'
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                        lineNumber: 48,
                                                        columnNumber: 266
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                lineNumber: 48,
                                                columnNumber: 237
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                type: "checkbox",
                                                checked: autoRegion,
                                                onChange: (e)=>onAutoRegionChange(e.target.checked)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                lineNumber: 48,
                                                columnNumber: 473
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 48,
                                        columnNumber: 202
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bz85-control-row",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                                htmlFor: "bz85-country",
                                                children: "Search region"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                lineNumber: 49,
                                                columnNumber: 45
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
                                                id: "bz85-country",
                                                value: COUNTRY_OPTIONS.some(([code])=>code === country) ? country : 'ALL',
                                                disabled: autoRegion,
                                                onChange: (e)=>onCountryChange(e.target.value),
                                                children: COUNTRY_OPTIONS.map(([code, name])=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                        value: code,
                                                        children: name
                                                    }, code, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                        lineNumber: 49,
                                                        columnNumber: 295
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                lineNumber: 49,
                                                columnNumber: 96
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 49,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "bz85-note",
                                        children: [
                                            "Current region: ",
                                            autoRegion ? regionInfo.label : country,
                                            " · ",
                                            autoRegion ? 'Auto' : 'Manual override',
                                            ". IP country is approximate and may differ with a VPN."
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 50,
                                        columnNumber: 11
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                lineNumber: 48,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                        lineNumber: 45,
                        columnNumber: 30
                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "bz85-preference-section",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "Your information in Search"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 53,
                                        columnNumber: 54
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "Search queries are sent to the configured search provider. Its privacy terms may differ from BAZAARA's. Search preferences and saved links here use this browser's storage; they are not a substitute for your BazID privacy controls."
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 53,
                                        columnNumber: 89
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bz85-data-pill",
                                        children: [
                                            savedCount,
                                            " browser-saved result",
                                            savedCount === 1 ? '' : 's'
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 53,
                                        columnNumber: 326
                                    }, this),
                                    savedCount > 0 ? confirmClear ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "bz85-confirm",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                children: [
                                                    "Delete the ",
                                                    savedCount,
                                                    " search result bookmarks stored by this browser?"
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                lineNumber: 54,
                                                columnNumber: 70
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>{
                                                    onClearSaved();
                                                    setConfirmClear(false);
                                                },
                                                children: "Delete local saved links"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                lineNumber: 54,
                                                columnNumber: 148
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                type: "button",
                                                onClick: ()=>setConfirmClear(false),
                                                children: "Cancel"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                                lineNumber: 54,
                                                columnNumber: 258
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 54,
                                        columnNumber: 40
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "bz85-danger-button",
                                        onClick: ()=>setConfirmClear(true),
                                        children: "Clear saved result links"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 54,
                                        columnNumber: 341
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "bz85-note",
                                        children: "There are no locally saved results to clear."
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 54,
                                        columnNumber: 466
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                lineNumber: 53,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "bz85-preference-section",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "Permissions"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 56,
                                        columnNumber: 54
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "Camera and microphone access are controlled by your browser and operating system. Use the permissions icon in your browser address bar to review or revoke access."
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 56,
                                        columnNumber: 74
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                lineNumber: 56,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "bz85-preference-section",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                        children: "BazID & account settings"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 57,
                                        columnNumber: 54
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "Manage your BAZAARA account, sign-in and available privacy settings through BazID. Search does not display account-data controls that have not been implemented."
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 57,
                                        columnNumber: 87
                                    }, this),
                                    bazidHref ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        className: "bz85-primary-link",
                                        href: bazidHref,
                                        children: "Open BazID account ↗"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 57,
                                        columnNumber: 267
                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        className: "bz85-note",
                                        children: "Configure BazID's HTTPS app URL to enable this link in deployment."
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                        lineNumber: 57,
                                        columnNumber: 344
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                                lineNumber: 57,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                        lineNumber: 52,
                        columnNumber: 13
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                    lineNumber: 44,
                    columnNumber: 7
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                    className: "bz85-settings-foot",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "bz85-ribbon-mark",
                            children: "B"
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                            lineNumber: 60,
                            columnNumber: 46
                        }, this),
                        " Search built for people"
                    ]
                }, void 0, true, {
                    fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
                    lineNumber: 60,
                    columnNumber: 7
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
            lineNumber: 41,
            columnNumber: 5
        }, this)
    }, void 0, false, {
        fileName: "[project]/apps/search-web/components/SearchSettingsPanel.tsx",
        lineNumber: 40,
        columnNumber: 10
    }, this);
}
_s(SearchSettingsPanel, "GTS7Yv1zsl53AXToYMMEdJGNShY=");
_c = SearchSettingsPanel;
var _c;
__turbopack_context__.k.register(_c, "SearchSettingsPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=apps_search-web_components_20bqe-z._.js.map