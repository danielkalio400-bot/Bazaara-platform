'use client';

import {ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useRef, useState} from 'react';

import MapPlanner,{geoJSON,type Stop} from '../../../packages/smart-ui/src/map-planner';

type MapTheme = 'neon' | 'bright' | 'dark' | 'minimal';
type Place = {
  id: string;
  name: string;
  subtitle?: string;
  lat: number;
  lon: number;
  category?: string;
  bbox?: [number, number, number, number];
};

type MapLibreWindow = Window & typeof globalThis & {maplibregl?: any};

const MAPLIBRE_VERSION = '5.17.0';
const MAPLIBRE_CSS = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.css`;
const MAPLIBRE_JS = `https://unpkg.com/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js`;
const MAPLIBRE_JS_FALLBACK = `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_VERSION}/dist/maplibre-gl.js`;

const STYLE_URLS: Record<MapTheme, string> = {
  neon: 'https://tiles.openfreemap.org/styles/liberty',
  bright: 'https://tiles.openfreemap.org/styles/bright',
  dark: 'https://tiles.openfreemap.org/styles/dark',
  minimal: 'https://tiles.openfreemap.org/styles/positron',
};

const DEFAULT_CENTER: [number, number] = [8.6753, 9.0820];
const RECENTS_KEY = 'bazaara:bmap:recent:v6';
const SAVED_KEY = 'bazaara:bmap:saved:v6';

const CATEGORY_PRESETS = [
  ['Restaurants', 'food'],
  ['Gas', 'fuel'],
  ['Groceries', 'grocery'],
  ['Hotels', 'hotel'],
  ['Coffee', 'coffee'],
  ['Attractions', 'attraction'],
] as const;

const RAIL_ITEMS = [
  ['Explore', 'compass'],
  ['You', 'bookmark'],
  ['Contribute', 'plus'],
  ['Updates', 'bell'],
  ['Layers', 'layers'],
] as const;

function Glyph({name, size = 20}: {name: string; size?: number}) {
  const common = {width: size, height: size, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.9, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true};
  switch (name) {
    case 'search': return <svg {...common}><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.2 4.2"/></svg>;
    case 'menu': return <svg {...common}><path d="M4 7h16M4 12h16M4 17h16"/></svg>;
    case 'compass': return <svg {...common}><circle cx="12" cy="12" r="8.5"/><path d="m15.3 8.7-2.1 4.5-4.5 2.1 2.1-4.5 4.5-2.1Z"/></svg>;
    case 'bookmark': return <svg {...common}><path d="M7 4.5h10v15l-5-3.2-5 3.2v-15Z"/></svg>;
    case 'plus': return <svg {...common}><path d="M12 5v14M5 12h14"/></svg>;
    case 'bell': return <svg {...common}><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 7h18s-3 0-3-7"/><path d="M10 20h4"/></svg>;
    case 'layers': return <svg {...common}><path d="m12 3 8 4.5-8 4.5-8-4.5L12 3Z"/><path d="m4 12 8 4.5 8-4.5M4 16.5 12 21l8-4.5"/></svg>;
    case 'grid': return <svg {...common}><rect x="4" y="4" width="6" height="6" rx="1"/><rect x="14" y="4" width="6" height="6" rx="1"/><rect x="4" y="14" width="6" height="6" rx="1"/><rect x="14" y="14" width="6" height="6" rx="1"/></svg>;
    case 'locate': return <svg {...common}><circle cx="12" cy="12" r="3"/><circle cx="12" cy="12" r="8"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3"/></svg>;
    case 'route': return <svg {...common}><circle cx="6" cy="18" r="2"/><circle cx="18" cy="6" r="2"/><path d="M8 18h3a4 4 0 0 0 4-4v-4M15 10l3-4"/></svg>;
    case 'share': return <svg {...common}><circle cx="18" cy="5" r="2"/><circle cx="6" cy="12" r="2"/><circle cx="18" cy="19" r="2"/><path d="m8 11 8-5M8 13l8 5"/></svg>;
    case 'close': return <svg {...common}><path d="m6 6 12 12M18 6 6 18"/></svg>;
    case 'chevron': return <svg {...common}><path d="m9 6 6 6-6 6"/></svg>;
    case 'pin': return <svg {...common}><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="2.4"/></svg>;
    default: return <svg {...common}><circle cx="12" cy="12" r="8"/></svg>;
  }
}

function readStored(key: string): Place[] {
  if (typeof window === 'undefined') return [];
  try {
    const value = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(value) ? value.filter(isPlace).slice(0, 30) : [];
  } catch { return []; }
}

function isPlace(value: any): value is Place {
  return value && typeof value.name === 'string' && Number.isFinite(Number(value.lat)) && Number.isFinite(Number(value.lon));
}

function normalizeResults(data: any): Place[] {
  const raw = Array.isArray(data)
    ? data
    : Array.isArray(data?.results) ? data.results
    : Array.isArray(data?.items) ? data.items
    : Array.isArray(data?.features) ? data.features
    : Array.isArray(data?.data) ? data.data
    : [];

  const normalized: Place[] = [];
  for (let i = 0; i < raw.length; i++) {
    const item = raw[i] || {};
    const coordinates = item?.geometry?.coordinates || item?.center || item?.coordinates;
    const lon = Number(item.lon ?? item.lng ?? item.longitude ?? (Array.isArray(coordinates) ? coordinates[0] : NaN));
    const lat = Number(item.lat ?? item.latitude ?? (Array.isArray(coordinates) ? coordinates[1] : NaN));
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    const props = item.properties || {};
    const name = String(item.display_name ?? item.label ?? item.name ?? props.display_name ?? props.label ?? props.name ?? 'Map result');
    const subtitle = String(item.type ?? item.category ?? props.type ?? props.category ?? '').trim();
    const bboxRaw = item.boundingbox ?? item.bbox ?? props.bbox;
    let bbox: [number, number, number, number] | undefined;
    if (Array.isArray(bboxRaw) && bboxRaw.length >= 4) {
      const nums = bboxRaw.map(Number);
      if (nums.every(Number.isFinite)) {
        if (Array.isArray(item.boundingbox)) {
          // Nominatim shape: [south, north, west, east].
          bbox = [Math.min(nums[2], nums[3]), Math.min(nums[0], nums[1]), Math.max(nums[2], nums[3]), Math.max(nums[0], nums[1])];
        } else {
          // GeoJSON / common bbox shape: [west, south, east, north].
          bbox = [Math.min(nums[0], nums[2]), Math.min(nums[1], nums[3]), Math.max(nums[0], nums[2]), Math.max(nums[1], nums[3])];
        }
      }
    }
    normalized.push({id: String(item.place_id ?? item.id ?? `${lat}:${lon}:${i}`), name, subtitle: subtitle || undefined, lat, lon, bbox});
  }
  return normalized.slice(0, 8);
}

function persist(key: string, places: Place[]) {
  try { localStorage.setItem(key, JSON.stringify(places.slice(0, 30))); } catch { /* storage can be blocked */ }
}

function loadMapLibre(): Promise<any> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Map renderer is browser-only.'));
  const w = window as MapLibreWindow;
  if (w.maplibregl) return Promise.resolve(w.maplibregl);

  const existing = document.querySelector<HTMLScriptElement>('script[data-bmap-maplibre="1"]');
  if (existing) {
    return new Promise((resolve, reject) => {
      const done = () => w.maplibregl ? resolve(w.maplibregl) : reject(new Error('Map renderer did not initialize.'));
      existing.addEventListener('load', done, {once: true});
      existing.addEventListener('error', () => reject(new Error('Map renderer failed to load.')), {once: true});
      setTimeout(() => { if (w.maplibregl) resolve(w.maplibregl); }, 50);
    });
  }

  if (!document.getElementById('bmap-maplibre-css')) {
    const link = document.createElement('link');
    link.id = 'bmap-maplibre-css';
    link.rel = 'stylesheet';
    link.href = MAPLIBRE_CSS;
    document.head.appendChild(link);
  }

  return new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.async = true;
    script.dataset.bmapMaplibre = '1';
    script.src = MAPLIBRE_JS;
    let fallbackUsed = false;
    script.onload = () => w.maplibregl ? resolve(w.maplibregl) : reject(new Error('Map renderer loaded without a usable runtime.'));
    script.onerror = () => {
      if (!fallbackUsed) {
        fallbackUsed = true;
        script.src = MAPLIBRE_JS_FALLBACK;
      } else {
        reject(new Error('Could not download the live map renderer. Check the internet connection.'));
      }
    };
    document.head.appendChild(script);
  });
}

function safePaint(map: any, layerId: string, property: string, value: any) {
  try { map.setPaintProperty(layerId, property, value); } catch { /* style-specific property */ }
}

function applyBazaaraNeon(map: any) {
  try {
    const layers = map.getStyle()?.layers || [];
    for (const layer of layers) {
      const id = String(layer.id || '').toLowerCase();
      const type = layer.type;
      if (type === 'background') {
        safePaint(map, layer.id, 'background-color', '#07101d');
        continue;
      }
      if (type === 'fill') {
        let color = '#101a29';
        if (/water|ocean|river|lake/.test(id)) color = '#073f72';
        else if (/park|grass|wood|forest|green|nature/.test(id)) color = '#0b473b';
        else if (/building/.test(id)) color = '#1d2536';
        else if (/industrial|commercial/.test(id)) color = '#221b35';
        else if (/residential|landuse/.test(id)) color = '#111927';
        safePaint(map, layer.id, 'fill-color', color);
        safePaint(map, layer.id, 'fill-opacity', /building/.test(id) ? 0.9 : 0.82);
      } else if (type === 'line') {
        let color = '#53657c';
        let opacity = 0.72;
        if (/motorway|trunk|freeway/.test(id)) { color = '#ff3f9e'; opacity = 0.94; }
        else if (/primary/.test(id)) { color = '#ff8a21'; opacity = 0.94; }
        else if (/secondary/.test(id)) { color = '#ffd43f'; opacity = 0.9; }
        else if (/tertiary/.test(id)) { color = '#00d9ff'; opacity = 0.86; }
        else if (/street|road|service|minor/.test(id)) { color = '#8da2bd'; opacity = 0.72; }
        else if (/rail|transit/.test(id)) { color = '#a66cff'; opacity = 0.82; }
        else if (/water|river/.test(id)) { color = '#159dff'; opacity = 0.8; }
        safePaint(map, layer.id, 'line-color', color);
        safePaint(map, layer.id, 'line-opacity', opacity);
      } else if (type === 'symbol') {
        safePaint(map, layer.id, 'text-color', /road|highway/.test(id) ? '#f9fbff' : '#dbe9f8');
        safePaint(map, layer.id, 'text-halo-color', '#07101d');
        safePaint(map, layer.id, 'text-halo-width', 1.35);
        safePaint(map, layer.id, 'icon-opacity', 0.95);
      } else if (type === 'circle') {
        safePaint(map, layer.id, 'circle-color', '#00e7ff');
        safePaint(map, layer.id, 'circle-stroke-color', '#07101d');
      }
    }
  } catch { /* a provider style may not expose every layer at once */ }
}

/** BMap-owned share links keep users in the ecosystem without exposing the place to a third party. */
function bmapPlaceUrl(place: Place) {
  const url = new URL(window.location.pathname, window.location.origin);
  url.searchParams.set('lat', place.lat.toFixed(6));
  url.searchParams.set('lon', place.lon.toFixed(6));
  url.searchParams.set('label', place.name.slice(0, 120));
  return url.href;
}

export default function BMapExperience() {
  const [tripStops,setTripStops]=useState<Stop[]>([]);const onTripStops=useCallback((stops:Stop[])=>setTripStops(stops),[]);
  const mapHostRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<any>(null);
  const maplibreRef = useRef<any>(null);
  const selectionMarkerRef = useRef<any>(null);
  const userMarkerRef = useRef<any>(null);
  const userPositionRef = useRef<{lat: number; lon: number} | null>(null);
  const themeRef = useRef<MapTheme>('neon');

  const [theme, setTheme] = useState<MapTheme>('neon');
  const [query, setQuery] = useState('');
  const [mapReady, setMapReady] = useState(false);
  const [mapError, setMapError] = useState('');
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [results, setResults] = useState<Place[]>([]);
  const [selected, setSelected] = useState<Place | null>(null);
  const [saved, setSaved] = useState<Place[]>([]);
  const [recents, setRecents] = useState<Place[]>([]);
  const [panel, setPanel] = useState<'none' | 'layers' | 'saved'>('none');
  const [routeOpen,setRouteOpen]=useState(false);
  const [userLocation,setUserLocation]=useState<{lat:number;lon:number}|null>(null);
  const [toast, setToast] = useState('');

  useEffect(() => {
    setSaved(readStored(SAVED_KEY));
    setRecents(readStored(RECENTS_KEY));
    const params = new URLSearchParams(window.location.search);
    // Prefill only: opening a deep link never silently submits a geocoder request.
    const linkedQuery = (params.get('q') || '').trim();
    if (linkedQuery.length >= 3 && linkedQuery.length <= 120 && !/[\u0000-\u001f\u007f]/u.test(linkedQuery)) {
      setQuery(linkedQuery);
    }
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(current => current === message ? '' : current), 2600);
  }, []);

  const focusPlace = useCallback((place: Place, zoom = 15) => {
    const map = mapRef.current;
    const maplibre = maplibreRef.current;
    if (!map || !maplibre) return;
    try {
      selectionMarkerRef.current?.remove?.();
      const markerElement = document.createElement('div');
      markerElement.className = 'bzm-live-pin';
      markerElement.innerHTML = '<span></span>';
      selectionMarkerRef.current = new maplibre.Marker({element: markerElement, anchor: 'bottom'})
        .setLngLat([place.lon, place.lat])
        .addTo(map);
      if (place.bbox) {
        map.fitBounds([[place.bbox[0], place.bbox[1]], [place.bbox[2], place.bbox[3]]], {padding: 90, maxZoom: 16, duration: 900});
      } else {
        map.flyTo({center: [place.lon, place.lat], zoom, speed: 1.35, curve: 1.4, essential: true});
      }
      setSelected(place);
    } catch { setMapError('The map could not move to that location.'); }
  }, []);

  useEffect(() => {
    if (!mapReady) return;
    const params = new URLSearchParams(window.location.search);
    const rawLat = params.get('lat');
    const rawLon = params.get('lon');
    if (!rawLat || !rawLon) return;
    const lat = Number(rawLat);
    const lon = Number(rawLon);
    if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return;
    const name = (params.get('label') || '').trim().slice(0, 120) || 'Shared location';
    focusPlace({id: `shared:${lat.toFixed(6)}:${lon.toFixed(6)}`, name, subtitle: `${lat.toFixed(5)}, ${lon.toFixed(5)}`, lat, lon});
  }, [mapReady, focusPlace]);

  useEffect(() => {
    let cancelled = false;
    let map: any;
    loadMapLibre()
      .then(maplibre => {
        if (cancelled || !mapHostRef.current) return;
        maplibreRef.current = maplibre;
        map = new maplibre.Map({
          container: mapHostRef.current,
          style: STYLE_URLS[themeRef.current],
          center: DEFAULT_CENTER,
          zoom: 5.2,
          minZoom: 2,
          maxZoom: 20,
          attributionControl: true,
          pitchWithRotate: true,
          dragRotate: true,
        });
        mapRef.current = map;
        map.once('load', () => {
          if (themeRef.current === 'neon') applyBazaaraNeon(map);
          setMapReady(true);
        });
        map.on('style.load', () => {
          if (themeRef.current === 'neon') window.setTimeout(() => applyBazaaraNeon(map), 30);
        });
        map.on('error', (event: any) => {
          const message = String(event?.error?.message || '');
          if (/failed|network|fetch|load/i.test(message)) setMapError('Some live map data could not load. Check your connection and retry.');
        });
        map.on('click', (event: any) => {
          const lat = Number(event?.lngLat?.lat);
          const lon = Number(event?.lngLat?.lng);
          if (!Number.isFinite(lat) || !Number.isFinite(lon)) return;
          const place: Place = {id: `pin:${lat.toFixed(6)}:${lon.toFixed(6)}`, name: 'Dropped pin', subtitle: `${lat.toFixed(5)}, ${lon.toFixed(5)}`, lat, lon};
          focusPlace(place, Math.max(14, map.getZoom?.() || 14));
        });
      })
      .catch(error => setMapError(error instanceof Error ? error.message : 'Could not start the live map.'));
    return () => {
      cancelled = true;
      try { map?.remove?.(); } catch { /* no-op */ }
      mapRef.current = null;
    };
  }, [focusPlace]);

  const changeTheme = useCallback((next: MapTheme) => {
    themeRef.current = next;
    setTheme(next);
    setPanel('none');
    const map = mapRef.current;
    if (!map) return;
    setMapReady(false);
    try {
      map.setStyle(STYLE_URLS[next], {diff: false});
      map.once('style.load', () => {
        if (next === 'neon') applyBazaaraNeon(map);
        setMapReady(true);
      });
    } catch {
      setMapError('Could not switch the map style.');
      setMapReady(true);
    }
  }, []);

  const performSearch = useCallback(async (rawQuery: string) => {
    const q = rawQuery.trim();
    if (!q) return;
    setSearching(true);
    setSearchError('');
    try {
      const response = await fetch(`/api/geocode?q=${encodeURIComponent(q)}`, {cache: 'no-store'});
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(String(data?.error || data?.message || `Search service returned ${response.status}.`));
      const places = normalizeResults(data);
      if (!places.length) throw new Error('No matching places were returned.');
      setResults(places);
      focusPlace(places[0]);
      setRecents(previous => {
        const next = [places[0], ...previous.filter(p => p.id !== places[0].id)].slice(0, 12);
        persist(RECENTS_KEY, next);
        return next;
      });
    } catch (error) {
      setResults([]);
      setSearchError(error instanceof Error ? error.message : 'Place search is unavailable.');
    } finally {
      setSearching(false);
    }
  }, [focusPlace]);

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    void performSearch(query);
  };

  const locateMe = useCallback(() => {
    if (!navigator.geolocation) {
      showToast('Location is not supported by this browser.');
      return;
    }
    showToast('Requesting your location…');
    navigator.geolocation.getCurrentPosition(position => {
      const lat = position.coords.latitude;
      const lon = position.coords.longitude;
      userPositionRef.current = {lat, lon};
      setUserLocation({lat,lon});
      const map = mapRef.current;
      const maplibre = maplibreRef.current;
      if (!map || !maplibre) return;
      userMarkerRef.current?.remove?.();
      const el = document.createElement('div');
      el.className = 'bzm-user-location';
      el.innerHTML = '<span></span>';
      userMarkerRef.current = new maplibre.Marker({element: el}).setLngLat([lon, lat]).addTo(map);
      map.flyTo({center: [lon, lat], zoom: 15.5, speed: 1.5, essential: true});
      showToast('Location found.');
    }, error => {
      showToast(error.code === 1 ? 'Location permission was not granted.' : 'Could not determine your location.');
    }, {enableHighAccuracy: true, timeout: 12000, maximumAge: 60000});
  }, [showToast]);

  const saveSelected = useCallback(() => {
    if (!selected) return;
    setSaved(previous => {
      const exists = previous.some(place => place.id === selected.id);
      const next = exists ? previous.filter(place => place.id !== selected.id) : [selected, ...previous].slice(0, 30);
      persist(SAVED_KEY, next);
      showToast(exists ? 'Removed from saved places.' : 'Saved to BMap.');
      return next;
    });
  }, [selected, showToast]);

  const openDirections = useCallback(() => {
    if (!selected) return;
    setRouteOpen(true);
  }, [selected]);

  const shareSelected = useCallback(async () => {
    if (!selected) return;
    const url = bmapPlaceUrl(selected);
    try {
      if (navigator.share) await navigator.share({title: selected.name, text: selected.name, url});
      else {
        await navigator.clipboard.writeText(url);
        showToast('Map link copied.');
      }
    } catch { /* user may cancel sharing */ }
  }, [selected, showToast]);

  useEffect(()=>{const map=mapRef.current;if(!map||!mapReady)return;const draw=()=>{try{const data=geoJSON(tripStops);const source=map.getSource('bazaara-trip');if(source)source.setData(data);else{map.addSource('bazaara-trip',{type:'geojson',data});map.addLayer({id:'bazaara-trip-line',type:'line',source:'bazaara-trip',filter:['==',['geometry-type'],'LineString'],paint:{'line-color':'#bc8aff','line-width':3,'line-dasharray':[2,2]}});map.addLayer({id:'bazaara-trip-points',type:'circle',source:'bazaara-trip',filter:['==',['geometry-type'],'Point'],paint:{'circle-color':'#7af3ef','circle-radius':6,'circle-stroke-color':'#171528','circle-stroke-width':2}});}}catch{/* wait for the live map style */}};draw();map.on('style.load',draw);return()=>{map.off('style.load',draw);};},[tripStops,mapReady,theme]);

  const selectedSaved = useMemo(() => selected ? saved.some(place => place.id === selected.id) : false, [saved, selected]);

  return (
    <div className="bzm bzm-standalone bzm-live-v6">
      <aside className="bzm-rail" aria-label="BMap navigation">
        <button className="bzm-rail-brand" aria-label="Bazaara Maps"><span>B</span></button>
        <div className="bzm-rail-divider"/>
        {RAIL_ITEMS.map(([label, icon], index) => (
          <button
            key={label}
            className={`bzm-rail-action ${label === 'Explore' ? 'active' : ''} ${index > 2 ? 'bzm-rail-secondary' : ''}`}
            onClick={() => {
              if (label === 'Layers') setPanel(current => current === 'layers' ? 'none' : 'layers');
              else if (label === 'You') setPanel(current => current === 'saved' ? 'none' : 'saved');
              else if (label === 'Contribute') window.open('https://www.openstreetmap.org/fixthemap', '_blank', 'noopener,noreferrer');
              else if (label !== 'Explore') showToast(`${label} is not connected yet; BMap will not fabricate updates.`);
            }}
          >
            <Glyph name={icon}/><span>{label}</span>
          </button>
        ))}
      </aside>

      <main className="bzm-canvas"><MapPlanner selected={selected} saved={saved} focus={focusPlace} onStops={onTripStops}/>
        <div ref={mapHostRef} className="bzm-live-map" aria-label="Interactive Bazaara map"/>
        {!mapReady && !mapError && <div className="bzm-map-loading"><span className="bzm-spinner"/>Loading live map…</div>}
        {mapError && <div className="bzm-map-error"><strong>Live map connection</strong><span>{mapError}</span><button onClick={() => window.location.reload()}>Retry</button></div>}

        <div className="bzm-wordmark" aria-hidden="true"><span className="bzm-wordmark-icon">B</span><span>Bazaara Maps</span></div>

        <form className="bzm-floating-search" onSubmit={submitSearch}>
          <div className="bzm-search">
            <button className="bzm-search-menu" type="button" aria-label="Open saved places" onClick={()=>setPanel(v=>v==='saved'?'none':'saved')}><Glyph name="menu"/></button>
            <input value={query} onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Search places" aria-label="Search places" autoComplete="off"/>
            {query && <button className="bzm-clear" type="button" aria-label="Clear" onClick={() => {setQuery(''); setResults([]); setSearchError('');}}><Glyph name="close" size={18}/></button>}
            <button className="bzm-search-submit" type="submit" aria-label="Search" disabled={searching}><Glyph name="search"/></button>
          </div>
          {(results.length > 0 || searchError) && (
            <div className="bzm-search-popover">
              {searchError ? <div className="bzm-search-message"><strong>Search unavailable</strong><span>{searchError}</span><small>The live base map still works. Search needs the configured BMap geocoder.</small></div> : results.map(place => (
                <button key={place.id} type="button" className="bzm-search-result" onClick={() => {focusPlace(place); setResults([]); setQuery(place.name);}}>
                  <span className="bzm-search-pin"><Glyph name="pin" size={17}/></span>
                  <span><strong>{place.name}</strong>{place.subtitle && <small>{place.subtitle}</small>}</span>
                  <Glyph name="chevron" size={16}/>
                </button>
              ))}
            </div>
          )}
        </form>

        <div className="bzm-floating-categories" aria-label="Place categories">
          {CATEGORY_PRESETS.map(([label]) => (
            <button key={label} type="button" onClick={() => {setQuery(label); void performSearch(label);}}>{label}</button>
          ))}
        </div>

        <div className="bzm-top-tools">
          <button className="bzm-account" aria-label="BazID account">B</button>
        </div>

        {panel === 'layers' && (
          <section className="bzm-floating-panel bzm-layer-panel" aria-label="Map styles">
            <header><div><small>Map appearance</small><strong>Layers & style</strong></div><button onClick={() => setPanel('none')} aria-label="Close"><Glyph name="close" size={18}/></button></header>
            <div className="bzm-style-grid">
              {([
                ['neon', 'Bazaara Neon', 'Signature dark + colorful roads'],
                ['bright', 'Bright', 'Clean daytime map'],
                ['dark', 'Dark', 'Low-glare night map'],
                ['minimal', 'Minimal', 'Reduced visual density'],
              ] as [MapTheme,string,string][]).map(([key, title, subtitle]) => (
                <button key={key} className={theme === key ? 'active' : ''} onClick={() => changeTheme(key)}>
                  <span className={`bzm-style-swatch ${key}`}/><span><strong>{title}</strong><small>{subtitle}</small></span>
                </button>
              ))}
            </div>
            <p>Map data: OpenStreetMap via OpenFreeMap. Bazaara Neon changes presentation only; it is not a traffic feed.</p>
          </section>
        )}

        {panel === 'saved' && (
          <section className="bzm-floating-panel bzm-saved-panel" aria-label="Saved places">
            <header><div><small>Your map</small><strong>Saved & recent</strong></div><button onClick={() => setPanel('none')} aria-label="Close"><Glyph name="close" size={18}/></button></header>
            <div className="bzm-saved-list">
              {[...saved, ...recents.filter(item => !saved.some(savedItem => savedItem.id === item.id))].slice(0, 10).map((place, index) => (
                <button key={`${place.id}:${index}`} onClick={() => {focusPlace(place); setPanel('none');}}><span><Glyph name={index < saved.length ? 'bookmark' : 'pin'} size={17}/></span><span><strong>{place.name}</strong><small>{place.subtitle || `${place.lat.toFixed(4)}, ${place.lon.toFixed(4)}`}</small></span></button>
              ))}
              {!saved.length && !recents.length && <div className="bzm-empty-state">Search for a place or drop a pin. Saved and recent places stay in this browser.</div>}
            </div>
          </section>
        )}

        <div className="bzm-map-controls" aria-label="Map controls">
          <button type="button" onClick={() => setPanel(current => current === 'layers' ? 'none' : 'layers')} aria-label="Layers"><Glyph name="layers"/></button>
          <button type="button" onClick={locateMe} aria-label="My location"><Glyph name="locate"/></button>
          <div className="bzm-control-divider"/>
          <button type="button" onClick={() => mapRef.current?.zoomIn?.({duration: 250})} aria-label="Zoom in"><span className="bzm-plusminus">+</span></button>
          <button type="button" onClick={() => mapRef.current?.zoomOut?.({duration: 250})} aria-label="Zoom out"><span className="bzm-plusminus">−</span></button>
        </div>

        {selected && (
          <section className="bzm-place-card">
            <button className="bzm-place-close" onClick={() => {setSelected(null); selectionMarkerRef.current?.remove?.();}} aria-label="Close place details"><Glyph name="close" size={18}/></button>
            <div className="bzm-place-media"><div className="bzm-place-orb"/><span>LIVE MAP</span></div>
            <div className="bzm-place-body">
              <small>{selected.subtitle || 'Selected location'}</small>
              <h2>{selected.name}</h2>
              <p>{selected.lat.toFixed(5)}, {selected.lon.toFixed(5)}</p>
              <div className="bzm-place-actions">
                <button className="primary" onClick={openDirections}><Glyph name="route" size={17}/>Directions</button>
                <button className={selectedSaved ? 'active' : ''} onClick={saveSelected}><Glyph name="bookmark" size={17}/>{selectedSaved ? 'Saved' : 'Save'}</button>
                <button onClick={shareSelected}><Glyph name="share" size={17}/>Share</button>
              </div>
            </div>
          </section>
        )}

        {routeOpen&&selected&&<div className="bz8-modal-backdrop bz8-map-route-backdrop" role="presentation" onMouseDown={event=>{if(event.target===event.currentTarget)setRouteOpen(false);}}><section className="bz8-map-route" role="dialog" aria-modal="true" aria-label="Directions"><header><div><small>ROUTE PLANNER</small><h2>Directions to {selected.name}</h2></div><button onClick={()=>setRouteOpen(false)} aria-label="Close"><Glyph name="close" size={18}/></button></header><div className="bz8-route-row"><span className="bz8-route-dot current"/><div><strong>{userLocation?'Your current location':'Choose a starting point'}</strong><small>{userLocation?`${userLocation.lat.toFixed(5)}, ${userLocation.lon.toFixed(5)}`:'Use My location first for a current-position route.'}</small></div></div><div className="bz8-route-line"/><div className="bz8-route-row"><span className="bz8-route-dot destination"/><div><strong>{selected.name}</strong><small>{selected.subtitle||`${selected.lat.toFixed(5)}, ${selected.lon.toFixed(5)}`}</small></div></div><div className="bz8-route-modes"><button disabled title="Native driving guidance requires a routing service">🚗 Driving</button><button disabled title="Native walking guidance requires a routing service">🚶 Walking</button><button disabled title="Native cycling guidance requires a routing service">🚲 Cycling</button><button disabled title="Transit requires a transit-data provider">🚆 Transit</button></div><p>BMap currently provides live maps, geocoding and location selection. Turn-by-turn routes, traffic, tolls and transit are not simulated without dedicated providers.</p><div className="bz8-actions"><button onClick={locateMe}>⌖ Use my location</button><a href={`https://www.openstreetmap.org/directions?from=${encodeURIComponent(userLocation?`${userLocation.lat},${userLocation.lon}`:'')}&to=${encodeURIComponent(`${selected.lat},${selected.lon}`)}`} target="_blank" rel="noopener noreferrer">Open external route planner ↗</a></div></section></div>}

        <nav className="bz8-map-mobile-nav" aria-label="BMap mobile navigation"><button onClick={()=>setPanel('none')} aria-current={panel==='none'?'page':undefined}><Glyph name="compass" size={18}/><small>Explore</small></button><button onClick={()=>setPanel(current=>current==='saved'?'none':'saved')} aria-current={panel==='saved'?'page':undefined}><Glyph name="bookmark" size={18}/><small>You</small></button><button onClick={()=>window.open('https://www.openstreetmap.org/fixthemap','_blank','noopener,noreferrer')}><Glyph name="plus" size={18}/><small>Contribute</small></button></nav>

        <div className="bzm-provider-note">Live vector map · OpenStreetMap data · OpenFreeMap tiles</div>
        {toast && <div className="bzm-toast" role="status">{toast}</div>}
      </main>
    </div>
  );
}
