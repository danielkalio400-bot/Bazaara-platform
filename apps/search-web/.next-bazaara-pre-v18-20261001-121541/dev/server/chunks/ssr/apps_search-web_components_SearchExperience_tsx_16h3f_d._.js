module.exports = [
"[project]/apps/search-web/components/SearchExperience.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SearchExperience",
    ()=>SearchExperience
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react.js [app-ssr] (ecmascript)");
'use client';
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
        search: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "10.8",
                    cy: "10.8",
                    r: "7.2"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 49,
                    columnNumber: 15
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "m16.2 16.2 5 5"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 49,
                    columnNumber: 53
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 49,
            columnNumber: 13
        }, this),
        globe: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "12",
                    cy: "12",
                    r: "9"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 50,
                    columnNumber: 14
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M3 12h18M12 3a15 15 0 0 1 0 18M12 3a15 15 0 0 0 0 18"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 50,
                    columnNumber: 45
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 50,
            columnNumber: 12
        }, this),
        image: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "3",
                    y: "4",
                    width: "18",
                    height: "16",
                    rx: "3"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 51,
                    columnNumber: 14
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "8",
                    cy: "9",
                    r: "1.6"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 51,
                    columnNumber: 63
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "m3 17 5-5 4 4 3-3 6 6"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 51,
                    columnNumber: 94
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 51,
            columnNumber: 12
        }, this),
        news: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "4",
                    y: "3",
                    width: "16",
                    height: "18",
                    rx: "2"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 52,
                    columnNumber: 13
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M8 8h8M8 12h8M8 16h5"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 52,
                    columnNumber: 62
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 52,
            columnNumber: 11
        }, this),
        map: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "m3 5 6-2 6 3 6-3v16l-6 2-6-3-6 3V5Zm6-2v15m6-12v15"
            }, void 0, false, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 53,
                columnNumber: 12
            }, this)
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 53,
            columnNumber: 10
        }, this),
        spark: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "m12 2 2.3 7.7L22 12l-7.7 2.3L12 22l-2.3-7.7L2 12l7.7-2.3L12 2Z"
            }, void 0, false, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 54,
                columnNumber: 14
            }, this)
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 54,
            columnNumber: 12
        }, this),
        arrow: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                d: "M4 12h16m-7-7 7 7-7 7"
            }, void 0, false, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 55,
                columnNumber: 14
            }, this)
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 55,
            columnNumber: 12
        }, this),
        chevron: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "m6 9 6 6 6-6"
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 55,
            columnNumber: 61
        }, this),
        x: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M5 5 19 19M19 5 5 19"
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 56,
            columnNumber: 8
        }, this),
        filter: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M4 7h16M4 17h16"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 57,
                    columnNumber: 15
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "9",
                    cy: "7",
                    r: "2",
                    fill: "currentColor",
                    stroke: "none"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 57,
                    columnNumber: 42
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "15",
                    cy: "17",
                    r: "2",
                    fill: "currentColor",
                    stroke: "none"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 57,
                    columnNumber: 105
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 57,
            columnNumber: 13
        }, this),
        shield: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "m12 2 8 4v6c0 5-3 8-8 10-5-2-8-5-8-10V6l8-4Z"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 58,
                    columnNumber: 15
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "m8.5 12 2.5 2.5 4.5-5"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 58,
                    columnNumber: 71
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 58,
            columnNumber: 13
        }, this),
        bookmark: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M6 4h12v17l-6-4-6 4V4Z"
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 59,
            columnNumber: 15
        }, this),
        copy: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "8",
                    y: "8",
                    width: "12",
                    height: "12",
                    rx: "2"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 59,
                    columnNumber: 59
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 59,
                    columnNumber: 108
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 59,
            columnNumber: 57
        }, this),
        check: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "m5 12 4 4 10-10"
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 60,
            columnNumber: 12
        }, this),
        menu: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
            d: "M4 6h16M4 12h16M4 18h16"
        }, void 0, false, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 60,
            columnNumber: 47
        }, this),
        layout: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "3",
                    y: "4",
                    width: "18",
                    height: "16",
                    rx: "2"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 61,
                    columnNumber: 15
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M10 4v16"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 61,
                    columnNumber: 64
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 61,
            columnNumber: 13
        }, this),
        external: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M13 4h7v7M20 4l-9 9"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 62,
                    columnNumber: 17
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M19 14v5H5V5h6"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 62,
                    columnNumber: 48
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 62,
            columnNumber: 15
        }, this),
        clock: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "12",
                    cy: "12",
                    r: "9"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 63,
                    columnNumber: 14
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M12 7v5l3 2"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 63,
                    columnNumber: 45
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 63,
            columnNumber: 12
        }, this),
        mic: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "9",
                    y: "2",
                    width: "6",
                    height: "13",
                    rx: "3"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 64,
                    columnNumber: 12
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M5 11a7 7 0 0 0 14 0M12 18v4m-4 0h8"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 64,
                    columnNumber: 60
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 64,
            columnNumber: 10
        }, this),
        grid: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "3",
                    y: "3",
                    width: "5",
                    height: "5",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 65,
                    columnNumber: 13
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "10",
                    y: "3",
                    width: "5",
                    height: "5",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 65,
                    columnNumber: 60
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "17",
                    y: "3",
                    width: "5",
                    height: "5",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 65,
                    columnNumber: 108
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "3",
                    y: "10",
                    width: "5",
                    height: "5",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 65,
                    columnNumber: 156
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "10",
                    y: "10",
                    width: "5",
                    height: "5",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 65,
                    columnNumber: 204
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "17",
                    y: "10",
                    width: "5",
                    height: "5",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 65,
                    columnNumber: 253
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "3",
                    y: "17",
                    width: "5",
                    height: "5",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 65,
                    columnNumber: 302
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "10",
                    y: "17",
                    width: "5",
                    height: "5",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 65,
                    columnNumber: 350
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("rect", {
                    x: "17",
                    y: "17",
                    width: "5",
                    height: "5",
                    rx: "1"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 65,
                    columnNumber: 399
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 65,
            columnNumber: 11
        }, this),
        camera: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("path", {
                    d: "M3 7h4l2-3h6l2 3h4v12H3V7Z"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 66,
                    columnNumber: 15
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("circle", {
                    cx: "12",
                    cy: "13",
                    r: "3.5"
                }, void 0, false, {
                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                    lineNumber: 66,
                    columnNumber: 53
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
            lineNumber: 66,
            columnNumber: 13
        }, this)
    };
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("svg", {
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
        lineNumber: 68,
        columnNumber: 10
    }, this);
}
function appUrl(slug, port) {
    if ("TURBOPACK compile-time truthy", 1) return;
    //TURBOPACK unreachable
    ;
    const host = undefined;
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
    const [query, setQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [searched, setSearched] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [category, setCategory] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('web');
    const [safe, setSafe] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('moderate');
    const [country, setCountry] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('ALL');
    const [regionMeta, setRegionMeta] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({
        country: 'ALL',
        label: 'Detecting region…',
        source: 'unavailable',
        auto: true
    });
    const [autoRegion, setAutoRegion] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [page, setPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(1);
    const [data, setData] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [error, setError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [loading, setLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [thumbnails] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [moreOpen, setMoreOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [toolsOpen, setToolsOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [focusUrl, setFocusUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [drawer, setDrawer] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false);
    const [pins, setPins] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const [notice, setNotice] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [links, setLinks] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])({});
    const [aboutUrl, setAboutUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [voiceOpen, setVoiceOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false), [voiceListening, setVoiceListening] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false), [voiceTranscript, setVoiceTranscript] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(''), [voiceError, setVoiceError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('');
    const [lensOpen, setLensOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false), [lensMode, setLensMode] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('similar'), [lensFile, setLensFile] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null), [lensPreview, setLensPreview] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(''), [lensUrl, setLensUrl] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(''), [lensLoading, setLensLoading] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(false), [lensError, setLensError] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(''), [lensResult, setLensResult] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(null);
    const [screen, setScreen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])('Home');
    const [dark, setDark] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])(true);
    const [discover, setDiscover] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useState"])([]);
    const input = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const controller = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const recognitionRef = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const lensInput = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useRef"])(null);
    const search = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useCallback"])(async (next, push = true)=>{
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
                results: Array.isArray(parsed.results) ? parsed.results.map(safeResult).filter((r)=>r !== null) : [],
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
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
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
        ].map(([slug, port])=>[
                slug,
                appUrl(slug, port)
            ]).filter((pair)=>typeof pair[1] === 'string')));
        try {
            const savedTheme = localStorage.getItem('bazaara-search-theme-v5');
            setDark(savedTheme !== 'light');
        } catch  {}
        try {
            const stored = JSON.parse(localStorage.getItem('bazaara-search-saved-v2') || '[]');
            if (Array.isArray(stored)) setPins(stored.filter((p)=>!!p && typeof p.title === 'string' && typeof p.url === 'string' && typeof p.displayUrl === 'string').slice(0, 40));
        } catch  {}
        const sync = ()=>{
            const state = readUrl();
            void search(state, false);
        };
        sync();
        window.addEventListener('popstate', sync);
        const keys = (event)=>{
            const target = event.target;
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
                setDrawer(false);
                setMoreOpen(false);
                setToolsOpen(false);
            }
        };
        window.addEventListener('keydown', keys);
        return ()=>{
            window.removeEventListener('popstate', sync);
            window.removeEventListener('keydown', keys);
            controller.current?.abort();
        };
    }, [
        search
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let active = true;
        void fetch('/api/discover', {
            cache: 'no-store'
        }).then(async (r)=>r.ok ? await r.json() : null).then((data)=>{
            if (!active || !Array.isArray(data?.articles)) return;
            setDiscover(data.articles.filter((a)=>a && typeof a.title === 'string' && /^https:\/\//.test(a.url)).slice(0, 6));
        }).catch(()=>{});
        return ()=>{
            active = false;
        };
    }, []);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        let active = true;
        void fetch('/api/region', {
            cache: 'no-store',
            credentials: 'same-origin'
        }).then(async (r)=>r.ok ? await r.json() : null).then((raw)=>{
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
            if (!explicit && detected !== 'ALL') {
                setCountry(detected);
                setAutoRegion(true);
                const state = readUrl();
                if (state.q) void search({
                    ...state,
                    country: detected
                }, false);
            }
        }).catch(()=>{
            if (!active) return;
            const fallback = browserRegion();
            setRegionMeta({
                country: fallback,
                label: regionLabel(fallback),
                source: fallback === 'ALL' ? 'unavailable' : 'browser-locale',
                auto: true
            });
            if (fallback !== 'ALL') {
                setCountry(fallback);
                const state = readUrl();
                if (state.q) void search({
                    ...state,
                    country: fallback
                }, false);
            }
        });
        return ()=>{
            active = false;
        };
    }, [
        search
    ]);
    (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useEffect"])(()=>{
        if (!lensFile) {
            setLensPreview('');
            return;
        }
        const url = URL.createObjectURL(lensFile);
        setLensPreview(url);
        return ()=>URL.revokeObjectURL(url);
    }, [
        lensFile
    ]);
    const results = data?.results || [];
    const selected = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>results.find((r)=>r.url === focusUrl) || results[0] || null, [
        results,
        focusUrl
    ]);
    const aboutResult = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useMemo"])(()=>results.find((r)=>r.url === aboutUrl) || null, [
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
    const hasQuery = searched.length > 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        "data-theme": dark ? 'dark' : 'light',
        className: `bzs bzs-v5 bz82-google-nav ${!hasQuery ? 'bz84-home' : 'bz84-results'}`,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                className: `bzs-sidebar ${drawer ? 'bzs-drawer-open' : ''}`,
                "aria-hidden": !drawer,
                inert: !drawer,
                "aria-label": "BAZAARA app launcher",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        className: "bzs-brand",
                        href: "/",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "bzs-gem",
                                children: "◇"
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 197,
                                columnNumber: 41
                            }, this),
                            " BAZAARA"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 197,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "bzs-side-label",
                        children: "Apps"
                    }, void 0, false, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 198,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "bzs-side-link bzs-side-active",
                        onClick: ()=>{
                            setDrawer(false);
                            input.current?.focus();
                        },
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                name: "search"
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 199,
                                columnNumber: 119
                            }, this),
                            " Search"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 199,
                        columnNumber: 7
                    }, this),
                    links.bmap && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        className: "bzs-side-link",
                        href: links.bmap,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                name: "map"
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 200,
                                columnNumber: 69
                            }, this),
                            " BMap ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                name: "external",
                                size: 14
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 200,
                                columnNumber: 93
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 200,
                        columnNumber: 22
                    }, this),
                    links.news && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        className: "bzs-side-link",
                        href: links.news,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                name: "news"
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 201,
                                columnNumber: 69
                            }, this),
                            " News"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 201,
                        columnNumber: 22
                    }, this),
                    links.translate && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        className: "bzs-side-link",
                        href: links.translate,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                "aria-hidden": "true",
                                className: "bzs-translate-symbol",
                                children: "文"
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 202,
                                columnNumber: 79
                            }, this),
                            " Translate"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 202,
                        columnNumber: 27
                    }, this),
                    links.bazlens && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                        className: "bzs-side-link",
                        href: links.bazlens,
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                name: "image"
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 203,
                                columnNumber: 75
                            }, this),
                            " BazLens"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 203,
                        columnNumber: 25
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bzs-side-spacer"
                    }, void 0, false, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 204,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        className: "bzs-side-link",
                        onClick: ()=>setDrawer(!drawer),
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                name: "bookmark"
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 205,
                                columnNumber: 76
                            }, this),
                            " Saved in this browser ",
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "bzs-count",
                                children: pins.length
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 205,
                                columnNumber: 122
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 205,
                        columnNumber: 7
                    }, this),
                    pins.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bzs-pinned",
                        children: pins.slice(0, 5).map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: p.url,
                                target: "_blank",
                                rel: "noopener noreferrer",
                                referrerPolicy: "no-referrer",
                                children: p.title
                            }, p.url, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 206,
                                columnNumber: 81
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 206,
                        columnNumber: 27
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bzs-side-foot",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                onClick: ()=>{
                                    setDark((v)=>{
                                        try {
                                            localStorage.setItem('bazaara-search-theme-v5', !v ? 'dark' : 'light');
                                        } catch  {}
                                        return !v;
                                    });
                                },
                                children: dark ? '☼ Light mode' : '☾ Dark mode'
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 207,
                                columnNumber: 38
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                children: "Saved links are stored in this browser."
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 207,
                                columnNumber: 210
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 207,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 196,
                columnNumber: 5
            }, this),
            drawer && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                "aria-label": "Close navigation",
                className: "bzs-backdrop",
                onClick: ()=>setDrawer(false)
            }, void 0, false, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 209,
                columnNumber: 16
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bzs-shell",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                        className: "bzs-header",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                href: "/",
                                className: "bzs-v5-brand",
                                "aria-label": "BAZAARA Search home",
                                children: "BAZAARA"
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 212,
                                columnNumber: 9
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bzs-header-actions",
                                children: [
                                    !hasQuery && category === 'web' && links.bmail && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        className: "bz84-head-link",
                                        href: links.bmail,
                                        children: "BMail"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 214,
                                        columnNumber: 60
                                    }, this),
                                    !hasQuery && category === 'web' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "bz84-head-link",
                                        onClick: ()=>setCategory('images'),
                                        children: "Images"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 215,
                                        columnNumber: 45
                                    }, this),
                                    !hasQuery && category === 'images' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "bz84-head-link",
                                        onClick: ()=>setCategory('web'),
                                        children: "Search"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 216,
                                        columnNumber: 48
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                        type: "button",
                                        className: "bzs-v5-apps",
                                        "aria-label": "BAZAARA apps",
                                        "aria-expanded": drawer,
                                        onClick: ()=>setDrawer((v)=>!v),
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                            name: "grid",
                                            size: 20
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 217,
                                            columnNumber: 137
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 217,
                                        columnNumber: 11
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                        className: "bzs-avatar",
                                        href: links.bazid ? links.bazid + 'account' : '#',
                                        "aria-label": "BazID account",
                                        children: "B"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 218,
                                        columnNumber: 11
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 213,
                                columnNumber: 9
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 211,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("main", {
                        className: "bzs-main",
                        children: [
                            (screen === 'Home' || screen === 'Search') && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: `bzs-intro ${hasQuery ? 'bzs-intro-compact' : ''}`,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                                    children: hasQuery ? 'Search' : 'BAZAARA'
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 223,
                                                    columnNumber: 82
                                                }, this),
                                                !hasQuery && category === 'images' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "bz84-product-label",
                                                    children: "images"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 223,
                                                    columnNumber: 161
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 223,
                                            columnNumber: 77
                                        }, this)
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 223,
                                        columnNumber: 9
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                        className: "bzs-search-area",
                                        "aria-label": category === 'images' ? 'Search images' : 'Search the web',
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("form", {
                                                className: "bzs-search-form",
                                                onSubmit: submit,
                                                role: "search",
                                                children: [
                                                    !hasQuery && category === 'web' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                                                        lineNumber: 226,
                                                        columnNumber: 46
                                                    }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                        name: "search",
                                                        size: 24
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 226,
                                                        columnNumber: 212
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
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
                                                        lineNumber: 227,
                                                        columnNumber: 13
                                                    }, this),
                                                    query && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: "bzs-clear",
                                                        type: "button",
                                                        title: "Clear input",
                                                        "aria-label": "Clear input",
                                                        onClick: ()=>{
                                                            setQuery('');
                                                            input.current?.focus();
                                                        },
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                            name: "x",
                                                            size: 18
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 228,
                                                            columnNumber: 170
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 228,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: "bzs-voice",
                                                        type: "button",
                                                        "aria-label": "Voice search",
                                                        title: "Voice search",
                                                        onClick: voiceSearch,
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                            name: "mic",
                                                            size: 18
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 229,
                                                            columnNumber: 126
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 229,
                                                        columnNumber: 13
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: "bzs-camera",
                                                        type: "button",
                                                        "aria-label": "Search with BazLens",
                                                        title: "Search with an image",
                                                        onClick: ()=>{
                                                            setLensOpen(true);
                                                            setLensError('');
                                                        },
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                            name: "camera",
                                                            size: 19
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 230,
                                                            columnNumber: 172
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 230,
                                                        columnNumber: 13
                                                    }, this),
                                                    !hasQuery && category === 'web' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: "bz84-ai-chip",
                                                        type: "button",
                                                        onClick: ()=>setNotice('AI Mode requires a connected AI provider. BAZAARA will not fabricate AI answers while it is disconnected.'),
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                name: "spark",
                                                                size: 17
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 231,
                                                                columnNumber: 227
                                                            }, this),
                                                            " AI Mode"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 231,
                                                        columnNumber: 47
                                                    }, this),
                                                    hasQuery && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        className: "bzs-go",
                                                        type: "submit",
                                                        "aria-label": "Search",
                                                        disabled: loading,
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                            name: "arrow",
                                                            size: 22
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 232,
                                                            columnNumber: 106
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 232,
                                                        columnNumber: 26
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 225,
                                                columnNumber: 11
                                            }, this),
                                            hasQuery && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bzs-toolbar bz82-toolbar",
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    className: "bzs-tabs bz82-search-nav",
                                                    role: "tablist",
                                                    "aria-label": "Search category",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                            className: "bzs-v5-ai",
                                                            type: "button",
                                                            disabled: true,
                                                            title: "AI Mode requires a separately connected AI provider",
                                                            children: "AI Mode"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 234,
                                                            columnNumber: 152
                                                        }, this),
                                                        TABS.map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                role: "tab",
                                                                "aria-selected": category === t.id,
                                                                className: category === t.id ? 'bzs-tab-active' : '',
                                                                onClick: ()=>tab(t.id),
                                                                children: t.label
                                                            }, t.id, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 234,
                                                                columnNumber: 296
                                                            }, this)),
                                                        links.bazclips && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                            href: links.bazclips,
                                                            children: "Videos"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 234,
                                                            columnNumber: 469
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "bz82-nav-menu",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                            name: "chevron",
                                                                            size: 13
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 234,
                                                                            columnNumber: 732
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                    lineNumber: 234,
                                                                    columnNumber: 536
                                                                }, this),
                                                                moreOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "bz82-menu",
                                                                    role: "menu",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                            type: "button",
                                                                            role: "menuitem",
                                                                            onClick: ()=>tab('web'),
                                                                            children: "Web"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 234,
                                                                            columnNumber: 823
                                                                        }, this),
                                                                        links.bmap && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                            role: "menuitem",
                                                                            href: links.bmap,
                                                                            children: "BMap"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 234,
                                                                            columnNumber: 911
                                                                        }, this),
                                                                        links.shopping && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                            role: "menuitem",
                                                                            href: links.shopping,
                                                                            children: "Shopping"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 234,
                                                                            columnNumber: 974
                                                                        }, this),
                                                                        links.learn && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                            role: "menuitem",
                                                                            href: links.learn,
                                                                            children: "Books"
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 234,
                                                                            columnNumber: 1042
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                    lineNumber: 234,
                                                                    columnNumber: 784
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 234,
                                                            columnNumber: 505
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                            className: "bz82-nav-menu",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                            name: "chevron",
                                                                            size: 13
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 234,
                                                                            columnNumber: 1333
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                    lineNumber: 234,
                                                                    columnNumber: 1134
                                                                }, this),
                                                                toolsOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                    className: "bz82-menu bz82-tools-menu",
                                                                    role: "menu",
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "bz82-tools-row",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    children: "SafeSearch"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 234,
                                                                                    columnNumber: 1473
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("select", {
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
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                            value: "strict",
                                                                                            children: "Strict"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                            lineNumber: 234,
                                                                                            columnNumber: 1673
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                            value: "moderate",
                                                                                            children: "Moderate"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                            lineNumber: 234,
                                                                                            columnNumber: 1711
                                                                                        }, this),
                                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("option", {
                                                                                            value: "off",
                                                                                            children: "Off"
                                                                                        }, void 0, false, {
                                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                            lineNumber: 234,
                                                                                            columnNumber: 1753
                                                                                        }, this)
                                                                                    ]
                                                                                }, void 0, true, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 234,
                                                                                    columnNumber: 1496
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 234,
                                                                            columnNumber: 1441
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                            className: "bz82-tools-region",
                                                                            children: [
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                    children: "Search region"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 234,
                                                                                    columnNumber: 1835
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                                                    children: regionMeta.country === 'ALL' ? 'Automatic' : regionMeta.label
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 234,
                                                                                    columnNumber: 1861
                                                                                }, this),
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                                    children: regionMeta.source === 'edge-ip' || regionMeta.source === 'geoip' ? 'Detected automatically from your network country' : regionMeta.source === 'browser-locale' ? 'Local fallback from browser locale' : 'Automatic country detection will apply when IP-aware deployment data is available'
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 234,
                                                                                    columnNumber: 1935
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 234,
                                                                            columnNumber: 1800
                                                                        }, this)
                                                                    ]
                                                                }, void 0, true, {
                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                    lineNumber: 234,
                                                                    columnNumber: 1386
                                                                }, this)
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 234,
                                                            columnNumber: 1103
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 234,
                                                    columnNumber: 66
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 234,
                                                columnNumber: 24
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 224,
                                        columnNumber: 9
                                    }, this),
                                    !hasQuery && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                        className: "bz84-home-actions",
                                        "aria-label": "Search actions",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bz84-buttons",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                                                        lineNumber: 238,
                                                        columnNumber: 13
                                                    }, this),
                                                    links.news && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                        href: links.news,
                                                        children: "Explore"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 239,
                                                        columnNumber: 28
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 237,
                                                columnNumber: 11
                                            }, this),
                                            regionalLanguages(regionMeta.country).length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                className: "bz84-languages",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "Regional languages:"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 241,
                                                        columnNumber: 92
                                                    }, this),
                                                    regionalLanguages(regionMeta.country).map((language)=>links.translate ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                            href: links.translate,
                                                            title: `Open BAZAARA Translate for ${language}`,
                                                            children: language
                                                        }, language, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 241,
                                                            columnNumber: 193
                                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                            children: language
                                                        }, language, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 241,
                                                            columnNumber: 298
                                                        }, this))
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 241,
                                                columnNumber: 62
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 236,
                                        columnNumber: 23
                                    }, this),
                                    !hasQuery && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                                        className: "bz84-home-footer",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                children: regionMeta.country === 'ALL' ? 'Region automatic' : regionMeta.label
                                            }, void 0, false, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 243,
                                                columnNumber: 60
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                                                "aria-label": "Search footer",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                        href: "#",
                                                        onClick: (e)=>{
                                                            e.preventDefault();
                                                            setNotice('Privacy controls are managed through BazID and your browser permissions.');
                                                        },
                                                        children: "Privacy"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 243,
                                                        columnNumber: 173
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                        href: "#",
                                                        onClick: (e)=>{
                                                            e.preventDefault();
                                                            setToolsOpen(true);
                                                            setNotice('Search settings are available after a search under Tools.');
                                                        },
                                                        children: "Settings"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 243,
                                                        columnNumber: 317
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 243,
                                                columnNumber: 141
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 243,
                                        columnNumber: 23
                                    }, this),
                                    hasQuery && screen === 'Search' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                        className: "bzs-response",
                                        "aria-live": "polite",
                                        "aria-busy": loading,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bzs-results-heading",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: loading ? 'Finding sources…' : error ? 'Search could not complete' : data ? `${results.length} results on this page` : 'Preparing results'
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 245,
                                                        columnNumber: 48
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: ()=>void share(window.location.href),
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                name: "copy",
                                                                size: 14
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 245,
                                                                columnNumber: 260
                                                            }, this),
                                                            " Copy search link"
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 245,
                                                        columnNumber: 189
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 245,
                                                columnNumber: 11
                                            }, this),
                                            loading && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bzs-loading",
                                                role: "status",
                                                children: [
                                                    1,
                                                    2,
                                                    3
                                                ].map((n)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 246,
                                                                columnNumber: 95
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 246,
                                                                columnNumber: 102
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 246,
                                                                columnNumber: 109
                                                            }, this)
                                                        ]
                                                    }, n, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 246,
                                                        columnNumber: 82
                                                    }, this))
                                            }, void 0, false, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 246,
                                                columnNumber: 23
                                            }, this),
                                            !loading && error && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bzs-error",
                                                role: "alert",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "bzs-error-icon",
                                                        children: "!"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 247,
                                                        columnNumber: 73
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                        children: error.code === 'PROVIDER_NOT_CONFIGURED' ? 'Search provider not yet connected' : 'Search is temporarily unavailable'
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 247,
                                                        columnNumber: 114
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        children: error.message
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 247,
                                                        columnNumber: 235
                                                    }, this),
                                                    error.code === 'PROVIDER_NOT_CONFIGURED' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        className: "bzs-setup",
                                                        children: [
                                                            "Configure ",
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("code", {
                                                                children: "BRAVE_SEARCH_API_KEY"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 247,
                                                                columnNumber: 335
                                                            }, this),
                                                            " on Search API port 4020; BAZAARA will never invent search results while disconnected."
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 247,
                                                        columnNumber: 300
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        onClick: ()=>void search({
                                                                q: searched,
                                                                category,
                                                                safe,
                                                                country,
                                                                page
                                                            }),
                                                        children: [
                                                            "Retry search ",
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                name: "arrow",
                                                                size: 16
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 247,
                                                                columnNumber: 547
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 247,
                                                        columnNumber: 459
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 247,
                                                columnNumber: 33
                                            }, this),
                                            !loading && data && results.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bzs-error",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                        children: "No matching sources"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 248,
                                                        columnNumber: 81
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                        children: "Try a different query, region or result category."
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 248,
                                                        columnNumber: 109
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 248,
                                                columnNumber: 54
                                            }, this),
                                            !loading && data && results.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "bzs-columns",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: "bzs-result-column",
                                                        children: [
                                                            category === 'web' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                                                className: "bzs-source-brief",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "bzs-brief-label",
                                                                        children: [
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "bzs-brief-spark",
                                                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                                    name: "spark",
                                                                                    size: 18
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 250,
                                                                                    columnNumber: 139
                                                                                }, this)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 250,
                                                                                columnNumber: 105
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                children: "SOURCE FOCUS"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 250,
                                                                                columnNumber: 176
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                className: "bzs-evidence-badge",
                                                                                children: "From live results"
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 250,
                                                                                columnNumber: 201
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 250,
                                                                        columnNumber: 72
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                                        children: results[0]?.title
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 250,
                                                                        columnNumber: 268
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        children: results[0]?.description || 'Open the original source to read the full article.'
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 250,
                                                                        columnNumber: 296
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "bzs-source-chips",
                                                                        children: results.slice(0, 3).map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                                href: r.url,
                                                                                target: "_blank",
                                                                                rel: "noopener noreferrer",
                                                                                referrerPolicy: "no-referrer",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                        className: "bzs-domain-dot",
                                                                                        children: r.displayUrl[0]?.toUpperCase()
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                        lineNumber: 250,
                                                                                        columnNumber: 544
                                                                                    }, this),
                                                                                    r.displayUrl,
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                                        name: "external",
                                                                                        size: 12
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                        lineNumber: 250,
                                                                                        columnNumber: 630
                                                                                    }, this)
                                                                                ]
                                                                            }, r.url, true, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 250,
                                                                                columnNumber: 445
                                                                            }, this))
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 250,
                                                                        columnNumber: 384
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                        children: "This is an excerpt of an actual search result, not an AI-generated answer."
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 250,
                                                                        columnNumber: 675
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 250,
                                                                columnNumber: 34
                                                            }, this),
                                                            category === 'images' && !thumbnails && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "bzs-image-privacy",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                        name: "shield",
                                                                        size: 18
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 251,
                                                                        columnNumber: 87
                                                                    }, this),
                                                                    " Image previews are loaded from provider-supplied HTTPS sources."
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 251,
                                                                columnNumber: 52
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: category === 'images' ? 'bzs-result-grid' : 'bzs-result-list',
                                                                children: results.map((r, index)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("article", {
                                                                        className: selected?.url === r.url ? 'bzs-result bzs-result-focused' : 'bzs-result',
                                                                        children: [
                                                                            category === 'images' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "bzs-result-image",
                                                                                children: thumbnails && r.thumbnail ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                                                    src: r.thumbnail,
                                                                                    alt: "",
                                                                                    loading: "lazy",
                                                                                    referrerPolicy: "no-referrer"
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 253,
                                                                                    columnNumber: 100
                                                                                }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                                    name: "image",
                                                                                    size: 36
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 253,
                                                                                    columnNumber: 176
                                                                                }, this)
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 253,
                                                                                columnNumber: 39
                                                                            }, this),
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                className: "bzs-result-body",
                                                                                children: [
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "bzs-result-domain",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                className: "bzs-domain-dot",
                                                                                                children: r.displayUrl[0]?.toUpperCase()
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                lineNumber: 254,
                                                                                                columnNumber: 83
                                                                                            }, this),
                                                                                            r.displayUrl,
                                                                                            r.age && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                                                children: [
                                                                                                    "· ",
                                                                                                    r.age
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                lineNumber: 254,
                                                                                                columnNumber: 177
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                        lineNumber: 254,
                                                                                        columnNumber: 48
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                                        className: "bzs-result-title",
                                                                                        href: r.url,
                                                                                        target: "_blank",
                                                                                        rel: "noopener noreferrer",
                                                                                        referrerPolicy: "no-referrer",
                                                                                        children: r.title
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                        lineNumber: 254,
                                                                                        columnNumber: 206
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                                        children: r.description
                                                                                    }, void 0, false, {
                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                        lineNumber: 254,
                                                                                        columnNumber: 335
                                                                                    }, this),
                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                                        className: "bzs-result-actions",
                                                                                        children: [
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                type: "button",
                                                                                                onClick: ()=>setFocusUrl(r.url),
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                                                        name: "layout",
                                                                                                        size: 14
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                        lineNumber: 254,
                                                                                                        columnNumber: 448
                                                                                                    }, this),
                                                                                                    " Focus"
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                lineNumber: 254,
                                                                                                columnNumber: 393
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                type: "button",
                                                                                                onClick: ()=>setAboutUrl(r.url),
                                                                                                children: "About result"
                                                                                            }, void 0, false, {
                                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                lineNumber: 254,
                                                                                                columnNumber: 494
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                type: "button",
                                                                                                onClick: ()=>save(r),
                                                                                                "aria-pressed": pins.some((p)=>p.url === r.url),
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                                                        name: pins.some((p)=>p.url === r.url) ? 'check' : 'bookmark',
                                                                                                        size: 14
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                        lineNumber: 254,
                                                                                                        columnNumber: 657
                                                                                                    }, this),
                                                                                                    pins.some((p)=>p.url === r.url) ? 'Saved' : 'Save'
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                lineNumber: 254,
                                                                                                columnNumber: 570
                                                                                            }, this),
                                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                                                type: "button",
                                                                                                onClick: ()=>void share(r.url),
                                                                                                children: [
                                                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                                                        name: "copy",
                                                                                                        size: 14
                                                                                                    }, void 0, false, {
                                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                        lineNumber: 254,
                                                                                                        columnNumber: 835
                                                                                                    }, this),
                                                                                                    " Copy"
                                                                                                ]
                                                                                            }, void 0, true, {
                                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                                lineNumber: 254,
                                                                                                columnNumber: 781
                                                                                            }, this)
                                                                                        ]
                                                                                    }, void 0, true, {
                                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                        lineNumber: 254,
                                                                                        columnNumber: 357
                                                                                    }, this)
                                                                                ]
                                                                            }, void 0, true, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 254,
                                                                                columnNumber: 15
                                                                            }, this)
                                                                        ]
                                                                    }, `${r.url}-${index}`, true, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 252,
                                                                        columnNumber: 110
                                                                    }, this))
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 252,
                                                                columnNumber: 13
                                                            }, this),
                                                            data.hasMore && category !== 'images' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "bzs-pagination",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                                                                        lineNumber: 255,
                                                                        columnNumber: 83
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        children: [
                                                                            "Page ",
                                                                            page
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 255,
                                                                        columnNumber: 247
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                                name: "arrow",
                                                                                size: 15
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 255,
                                                                                columnNumber: 429
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 255,
                                                                        columnNumber: 271
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 255,
                                                                columnNumber: 51
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "bzs-provider",
                                                                children: [
                                                                    "Results via ",
                                                                    data.provider,
                                                                    ". ",
                                                                    data.privacy?.notice || 'Third-party search provider policies apply.'
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 256,
                                                                columnNumber: 13
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 249,
                                                        columnNumber: 81
                                                    }, this),
                                                    category !== 'images' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("aside", {
                                                        className: "bzs-insight",
                                                        children: [
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "bzs-insight-header",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        children: "EXPLORE THIS SOURCE"
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 257,
                                                                        columnNumber: 106
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                        name: "spark",
                                                                        size: 17
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 257,
                                                                        columnNumber: 138
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 257,
                                                                columnNumber: 70
                                                            }, this),
                                                            selected && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                        className: "bzs-insight-logo",
                                                                        children: selected.displayUrl[0]?.toUpperCase()
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 257,
                                                                        columnNumber: 189
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                                        children: selected.title
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 257,
                                                                        columnNumber: 270
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                        className: "bzs-insight-domain",
                                                                        children: selected.displayUrl
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 257,
                                                                        columnNumber: 295
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                        children: selected.description || 'Open this source to learn more.'
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 257,
                                                                        columnNumber: 358
                                                                    }, this),
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                                        href: selected.url,
                                                                        target: "_blank",
                                                                        rel: "noopener noreferrer",
                                                                        referrerPolicy: "no-referrer",
                                                                        className: "bzs-insight-open",
                                                                        children: [
                                                                            "Read original source ",
                                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                                name: "external",
                                                                                size: 15
                                                                            }, void 0, false, {
                                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                lineNumber: 257,
                                                                                columnNumber: 566
                                                                            }, this)
                                                                        ]
                                                                    }, void 0, true, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 257,
                                                                        columnNumber: 422
                                                                    }, this)
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 257,
                                                                columnNumber: 187
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "bzs-insight-divider"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 258,
                                                                columnNumber: 13
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                                                children: "Compare sources"
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 258,
                                                                columnNumber: 51
                                                            }, this),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                                className: "bzs-insight-help",
                                                                children: "Select a result to inspect its published excerpt. Compare information using the original pages."
                                                            }, void 0, false, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 258,
                                                                columnNumber: 75
                                                            }, this),
                                                            results.filter((r)=>r.url !== selected?.url).slice(0, 4).map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                                    type: "button",
                                                                    className: "bzs-compare",
                                                                    onClick: ()=>setFocusUrl(r.url),
                                                                    children: [
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            className: "bzs-domain-dot",
                                                                            children: r.displayUrl[0]?.toUpperCase()
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 258,
                                                                            columnNumber: 357
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                            children: [
                                                                                r.title,
                                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                                                    children: r.displayUrl
                                                                                }, void 0, false, {
                                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                                    lineNumber: 258,
                                                                                    columnNumber: 444
                                                                                }, this)
                                                                            ]
                                                                        }, void 0, true, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 258,
                                                                            columnNumber: 429
                                                                        }, this),
                                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                            name: "chevron",
                                                                            size: 15
                                                                        }, void 0, false, {
                                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                            lineNumber: 258,
                                                                            columnNumber: 480
                                                                        }, this)
                                                                    ]
                                                                }, r.url, true, {
                                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                    lineNumber: 258,
                                                                    columnNumber: 266
                                                                }, this)),
                                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                                className: "bzs-insight-foot",
                                                                children: [
                                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                                        name: "shield",
                                                                        size: 18
                                                                    }, void 0, false, {
                                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                        lineNumber: 259,
                                                                        columnNumber: 47
                                                                    }, this),
                                                                    " Source context only. No invented summaries, statistics or ratings."
                                                                ]
                                                            }, void 0, true, {
                                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                                lineNumber: 259,
                                                                columnNumber: 13
                                                            }, this)
                                                        ]
                                                    }, void 0, true, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 257,
                                                        columnNumber: 39
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 249,
                                                columnNumber: 52
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 244,
                                        columnNumber: 43
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 222,
                                columnNumber: 48
                            }, this),
                            screen === 'Notifications' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "bzs-v5-page",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        children: "Notifications"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 263,
                                        columnNumber: 69
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "Notifications are not enabled yet. No alerts will be fabricated."
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 263,
                                        columnNumber: 91
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 263,
                                columnNumber: 36
                            }, this),
                            screen === 'Activity' && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                className: "bzs-v5-page",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                                        children: "Activity"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 264,
                                        columnNumber: 64
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "Links saved in this browser"
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 264,
                                        columnNumber: 81
                                    }, this),
                                    pins.length ? pins.map((p)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: p.url,
                                            target: "_blank",
                                            rel: "noopener noreferrer",
                                            children: [
                                                p.title,
                                                " ↗"
                                            ]
                                        }, p.url, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 264,
                                            columnNumber: 140
                                        }, this)) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                        children: "No saved links yet."
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 264,
                                        columnNumber: 227
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 264,
                                columnNumber: 31
                            }, this),
                            aboutResult && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bz8-modal-backdrop",
                                role: "presentation",
                                onMouseDown: (e)=>{
                                    if (e.target === e.currentTarget) setAboutUrl(null);
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    className: "bz8-about-result",
                                    role: "dialog",
                                    "aria-modal": "true",
                                    "aria-label": "About this result",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                            className: "bz8-eyebrow",
                                                            children: "ABOUT THIS RESULT"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 266,
                                                            columnNumber: 261
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                            children: aboutResult.displayUrl
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 266,
                                                            columnNumber: 317
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 266,
                                                    columnNumber: 256
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    onClick: ()=>setAboutUrl(null),
                                                    "aria-label": "Close",
                                                    children: "×"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 266,
                                                    columnNumber: 356
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 266,
                                            columnNumber: 248
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            children: aboutResult.description || 'No provider excerpt was returned for this result.'
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 266,
                                            columnNumber: 434
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dl", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                            children: "Destination"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 266,
                                                            columnNumber: 528
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                            children: aboutResult.displayUrl
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 266,
                                                            columnNumber: 548
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 266,
                                                    columnNumber: 523
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                            children: "Result type"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 266,
                                                            columnNumber: 592
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                            children: category === 'images' ? 'Image result' : category === 'news' ? 'News result' : 'Web result'
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 266,
                                                            columnNumber: 612
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 266,
                                                    columnNumber: 587
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dt", {
                                                            children: "Provider"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 266,
                                                            columnNumber: 713
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("dd", {
                                                            children: data?.provider || 'Connected search provider'
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 266,
                                                            columnNumber: 730
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 266,
                                                    columnNumber: 708
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 266,
                                            columnNumber: 519
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                            href: aboutResult.url,
                                            target: "_blank",
                                            rel: "noopener noreferrer",
                                            referrerPolicy: "no-referrer",
                                            children: "Open original source ↗"
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 266,
                                            columnNumber: 795
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                                            children: "BAZAARA shows provider-supplied source metadata only. It does not fabricate trust scores, ownership claims or publisher ratings."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 266,
                                            columnNumber: 918
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                    lineNumber: 266,
                                    columnNumber: 147
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 266,
                                columnNumber: 23
                            }, this),
                            voiceOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bz8-modal-backdrop",
                                role: "presentation",
                                onMouseDown: (e)=>{
                                    if (e.target === e.currentTarget) closeVoice();
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    className: "bz8-voice-dialog",
                                    role: "dialog",
                                    "aria-modal": "true",
                                    "aria-label": "Voice search",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                            className: "bz8-eyebrow",
                                                            children: "VOICE SEARCH"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 267,
                                                            columnNumber: 249
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                            children: voiceListening ? 'Listening…' : voiceTranscript ? 'Ready to search' : 'Speak your search'
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 267,
                                                            columnNumber: 300
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 267,
                                                    columnNumber: 244
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: closeVoice,
                                                    "aria-label": "Close voice search",
                                                    children: "×"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 267,
                                                    columnNumber: 398
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 267,
                                            columnNumber: 236
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: voiceListening ? 'bz8-voice-orb is-listening' : 'bz8-voice-orb',
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                        name: "mic",
                                                        size: 34
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 267,
                                                        columnNumber: 575
                                                    }, this)
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 267,
                                                    columnNumber: 569
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 267,
                                                    columnNumber: 610
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 267,
                                                    columnNumber: 614
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("i", {}, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 267,
                                                    columnNumber: 618
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 267,
                                            columnNumber: 492
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "bz8-voice-transcript",
                                            children: voiceTranscript || voiceError || 'Say a word, place, question or topic.'
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 267,
                                            columnNumber: 628
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bz8-voice-actions",
                                            children: [
                                                !voiceListening && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: voiceSearch,
                                                    children: "Listen again"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 267,
                                                    columnNumber: 791
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    className: "bz8-primary",
                                                    disabled: !voiceTranscript.trim(),
                                                    onClick: submitVoice,
                                                    children: "Search"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 267,
                                                    columnNumber: 857
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 267,
                                            columnNumber: 738
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("footer", {
                                            children: [
                                                "Recognition language: ",
                                                typeof navigator !== 'undefined' ? navigator.language || 'browser default' : 'browser default',
                                                " · Microphone is used only while listening."
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 267,
                                            columnNumber: 981
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                    lineNumber: 267,
                                    columnNumber: 140
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 267,
                                columnNumber: 21
                            }, this),
                            lensOpen && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "bz8-modal-backdrop",
                                role: "presentation",
                                onMouseDown: (e)=>{
                                    if (e.target === e.currentTarget) closeLens();
                                },
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("section", {
                                    className: "bz8-search-lens",
                                    role: "dialog",
                                    "aria-modal": "true",
                                    "aria-label": "Search any image with BazLens",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("header", {
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                                            className: "bz8-eyebrow",
                                                            children: "BAZLENS"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 268,
                                                            columnNumber: 263
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h2", {
                                                            children: "Search any image"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 268,
                                                            columnNumber: 309
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                            children: "Drop an image, upload a file or import an HTTPS image link."
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 268,
                                                            columnNumber: 334
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 258
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: closeLens,
                                                    "aria-label": "Close BazLens",
                                                    children: "×"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 406
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 268,
                                            columnNumber: 250
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                            ref: lensInput,
                                            type: "file",
                                            accept: "image/png,image/jpeg,image/webp,image/gif",
                                            hidden: true,
                                            onChange: (e)=>chooseLensFile(e.target.files?.[0])
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 268,
                                            columnNumber: 494
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: lensFile ? 'bz8-lens-drop has-image' : 'bz8-lens-drop',
                                            onDragOver: (e)=>e.preventDefault(),
                                            onDrop: (e)=>{
                                                e.preventDefault();
                                                chooseLensFile(e.dataTransfer.files?.[0]);
                                            },
                                            children: lensPreview ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("img", {
                                                src: lensPreview,
                                                alt: "Selected visual search image"
                                            }, void 0, false, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 268,
                                                columnNumber: 830
                                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["Fragment"], {
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        className: "bz8-lens-upload-icon",
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                                                            name: "image",
                                                            size: 34
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 268,
                                                            columnNumber: 931
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 268,
                                                        columnNumber: 892
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                        children: "Drag an image here"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 268,
                                                        columnNumber: 968
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                        children: "or"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 268,
                                                        columnNumber: 1003
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                        type: "button",
                                                        onClick: ()=>lensInput.current?.click(),
                                                        children: "Upload a file"
                                                    }, void 0, false, {
                                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                        lineNumber: 268,
                                                        columnNumber: 1018
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                lineNumber: 268,
                                                columnNumber: 890
                                            }, this)
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 268,
                                            columnNumber: 638
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bz8-lens-or",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 1142
                                                }, this),
                                                "OR",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {}, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 1151
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 268,
                                            columnNumber: 1113
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bz8-lens-url",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("input", {
                                                    type: "url",
                                                    value: lensUrl,
                                                    onChange: (e)=>setLensUrl(e.target.value),
                                                    placeholder: "Paste image link",
                                                    "aria-label": "Image URL"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 1194
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    disabled: !lensUrl.trim(),
                                                    onClick: ()=>void importLensUrl(),
                                                    children: "Import"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 1324
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 268,
                                            columnNumber: 1164
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bz8-lens-mode-row",
                                            role: "tablist",
                                            "aria-label": "BazLens mode",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    role: "tab",
                                                    "aria-selected": lensMode === 'similar',
                                                    onClick: ()=>setLensMode('similar'),
                                                    children: "Visual search"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 1505
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    role: "tab",
                                                    "aria-selected": lensMode === 'text',
                                                    onClick: ()=>setLensMode('text'),
                                                    children: "Text"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 1620
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    role: "tab",
                                                    "aria-selected": lensMode === 'objects',
                                                    onClick: ()=>setLensMode('objects'),
                                                    children: "Shopping & objects"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 1720
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 268,
                                            columnNumber: 1429
                                        }, this),
                                        lensError && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "bz8-lens-error",
                                            role: "alert",
                                            children: lensError
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 268,
                                            columnNumber: 1858
                                        }, this),
                                        lensResult && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bz8-lens-mini-results",
                                            children: [
                                                lensResult.text && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                            children: "Recognized text"
                                                        }, void 0, false, {
                                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                            lineNumber: 268,
                                                            columnNumber: 1990
                                                        }, this),
                                                        lensResult.text.slice(0, 420)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 1987
                                                }, this),
                                                lensResult.labels.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                    children: lensResult.labels.slice(0, 8).map((x)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                                                            lineNumber: 268,
                                                            columnNumber: 2128
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 2086
                                                }, this),
                                                lensResult.matches.slice(0, 3).map((m)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
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
                                                        lineNumber: 268,
                                                        columnNumber: 2291
                                                    }, this))
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 268,
                                            columnNumber: 1930
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "bz8-lens-footer",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    onClick: ()=>{
                                                        setLensFile(null);
                                                        setLensResult(null);
                                                        setLensError('');
                                                    },
                                                    children: "Clear"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 2447
                                                }, this),
                                                links.bazlens && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
                                                    href: links.bazlens,
                                                    children: "Open full BazLens ↗"
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 2571
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                                    type: "button",
                                                    className: "bz8-primary",
                                                    disabled: !lensFile || lensLoading,
                                                    onClick: ()=>void analyzeLens(),
                                                    children: lensLoading ? 'Analyzing…' : 'Search image'
                                                }, void 0, false, {
                                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                                    lineNumber: 268,
                                                    columnNumber: 2619
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 268,
                                            columnNumber: 2414
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                            className: "bz8-lens-privacy",
                                            children: "Images are sent only when you press Search image. BazLens provider configuration determines analysis availability."
                                        }, void 0, false, {
                                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                            lineNumber: 268,
                                            columnNumber: 2788
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                    lineNumber: 268,
                                    columnNumber: 138
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 268,
                                columnNumber: 20
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 221,
                        columnNumber: 7
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
                        className: "bzs-v5-bottom",
                        "aria-label": "Search navigation",
                        children: [
                            'Home',
                            'Search',
                            'Notifications',
                            'Activity'
                        ].map((t)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
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
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                        children: t === 'Home' ? '⌂' : t === 'Search' ? '⌕' : t === 'Notifications' ? '♧' : '◷'
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 270,
                                        columnNumber: 300
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("small", {
                                        children: t
                                    }, void 0, false, {
                                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                        lineNumber: 270,
                                        columnNumber: 374
                                    }, this)
                                ]
                            }, t, true, {
                                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                                lineNumber: 270,
                                columnNumber: 133
                            }, this))
                    }, void 0, false, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 270,
                        columnNumber: 7
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 210,
                columnNumber: 5
            }, this),
            notice && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "bzs-toast",
                role: "status",
                children: [
                    notice,
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                        type: "button",
                        "aria-label": "Dismiss",
                        onClick: ()=>setNotice(''),
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                            name: "x",
                            size: 15
                        }, void 0, false, {
                            fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                            lineNumber: 272,
                            columnNumber: 136
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                        lineNumber: 272,
                        columnNumber: 65
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
                lineNumber: 272,
                columnNumber: 16
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/apps/search-web/components/SearchExperience.tsx",
        lineNumber: 195,
        columnNumber: 10
    }, this);
}
}),
];

//# sourceMappingURL=apps_search-web_components_SearchExperience_tsx_16h3f_d._.js.map