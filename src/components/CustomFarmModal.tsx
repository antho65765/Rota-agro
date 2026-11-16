import React, { useState, useEffect, useRef } from 'react';
import {
  MapPin,
  Satellite,
  CheckCircle2,
  X,
  AlertCircle,
  Navigation,
  Search,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Map as MapIcon
} from 'lucide-react';
import {
  APIProvider,
  Map as GoogleMap,
  AdvancedMarker,
  Pin,
  useMap,
  MapMouseEvent
} from '@vis.gl/react-google-maps';

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

export interface CustomFarmInput {
  id: string;
  name: string;
  country: string;
  lat: number;
  lon: number;
  altitudeM: number;
  agroZone: string;
  terrainType?: 'ladera-alta' | 'ladera-media' | 'valle' | 'plano';
}

interface PlaceSearchResult {
  name: string;
  region: string;
  country: string;
  lat: number;
  lon: number;
  altitudeM: number;
}

interface CustomFarmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectFarm: (farm: CustomFarmInput) => void;
  currentFarmId: string;
  existingFarms: CustomFarmInput[];
  lang: 'es' | 'en';
  initialTab?: 'preset' | 'custom';
  defaultLat?: number;
  defaultLon?: number;
}

const MapCameraController: React.FC<{
  targetCenter: { lat: number; lng: number } | null;
  targetZoom: number;
  triggerId: number;
}> = ({ targetCenter, targetZoom, triggerId }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !targetCenter || triggerId === 0) return;
    map.panTo(targetCenter);
    map.setZoom(targetZoom);
  }, [map, targetCenter, targetZoom, triggerId]);

  return null;
};

export const CustomFarmModal: React.FC<CustomFarmModalProps> = ({
  isOpen,
  onClose,
  onSelectFarm,
  currentFarmId,
  existingFarms,
  lang,
  initialTab = 'custom',
  defaultLat = 5.532,
  defaultLon = -73.361
}) => {
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>(initialTab);

  // Form state for creating a custom farm/terrain
  const [farmName, setFarmName] = useState<string>('');
  const [hasManualFarmName, setHasManualFarmName] = useState<boolean>(false);
  const [country, setCountry] = useState<string>('');
  const [lat, setLat] = useState<string>('');
  const [lon, setLon] = useState<string>('');
  const [altitude, setAltitude] = useState<string>('1800');
  const [terrainType, setTerrainType] = useState<'ladera-alta' | 'ladera-media' | 'valle' | 'plano'>('ladera-media');

  // Status & Search state
  const [geoStatus, setGeoStatus] = useState<{
    type: 'success' | 'fallback' | 'error' | 'loading';
    message: string;
  } | null>(null);
  const [isLocating, setIsLocating] = useState<boolean>(false);
  const [showAdvancedCoords, setShowAdvancedCoords] = useState<boolean>(false);

  // Town / Municipality search
  const [placeQuery, setPlaceQuery] = useState<string>('');
  const [isSearchingPlace, setIsSearchingPlace] = useState<boolean>(false);
  const [placeResults, setPlaceResults] = useState<PlaceSearchResult[]>([]);

  // Interactive Map state
  const [mapTypeId, setMapTypeId] = useState<'hybrid' | 'roadmap'>('hybrid');
  const [cameraTarget, setCameraTarget] = useState<{ lat: number; lng: number } | null>(null);
  const [cameraZoom, setCameraZoom] = useState<number>(11);
  const [cameraTriggerId, setCameraTriggerId] = useState<number>(0);

  const geocodeSeqRef = useRef<number>(0);

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setGeoStatus(null);
      setHasManualFarmName(false);
    }
  }, [isOpen, initialTab]);

  if (!isOpen) return null;

  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  const parsedLat = parseFloat(lat);
  const parsedLon = parseFloat(lon);
  const hasValidPin =
    !isNaN(parsedLat) &&
    !isNaN(parsedLon) &&
    parsedLat >= -90 &&
    parsedLat <= 90 &&
    parsedLon >= -180 &&
    parsedLon <= 180;

  const initialMapCenter = { lat: defaultLat, lng: defaultLon };

  const applyCoordinates = async (
    newLat: number,
    newLon: number,
    detectedPlace?: string,
    detectedCountry?: string,
    detectedAlt?: number,
    sourceMode: 'gps' | 'ip' | 'search' | 'map' = 'gps'
  ) => {
    const seq = ++geocodeSeqRef.current;

    setLat(newLat.toFixed(4));
    setLon(newLon.toFixed(4));

    // Move camera automatically when set via GPS, IP, or Search
    if (sourceMode !== 'map') {
      setCameraTarget({ lat: newLat, lng: newLon });
      setCameraZoom(sourceMode === 'ip' ? 12 : 15);
      setCameraTriggerId((id) => id + 1);
    }

    let finalPlace = detectedPlace || '';
    let finalRegion = detectedCountry || '';
    let finalAlt = detectedAlt;

    // Reverse geocode when coming from raw GPS or interactive map tap/drag
    if (sourceMode === 'gps' || sourceMode === 'map') {
      setGeoStatus({
        type: 'loading',
        message:
          lang === 'es'
            ? 'Identificando el pueblo y la altura de este terreno...'
            : 'Identifying town and elevation for this spot...'
      });

      try {
        const res = await fetch(`/api/reversa-lugar?lat=${newLat}&lon=${newLon}`);
        if (res.ok) {
          const info = await res.json();
          if (info.name) finalPlace = info.name;
          if (info.region) finalRegion = info.region;
          if (typeof info.altitudeM === 'number') finalAlt = info.altitudeM;
        }
      } catch {}

      // Ignore stale response if user tapped a newer location
      if (seq !== geocodeSeqRef.current) return;
    }

    if (typeof finalAlt === 'number' && !isNaN(finalAlt)) {
      setAltitude(String(Math.round(finalAlt)));
    }

    if (finalRegion) {
      setCountry(finalRegion);
    } else if (!country) {
      setCountry(lang === 'es' ? 'Mi Zona' : 'My Area');
    }

    if (!hasManualFarmName) {
      if (finalPlace) {
        setFarmName(lang === 'es' ? `Mi Finca (${finalPlace})` : `My Farm (${finalPlace})`);
      } else if (!farmName.trim()) {
        setFarmName(
          sourceMode === 'map'
            ? lang === 'es'
              ? 'Mi Parcela (Mapa)'
              : 'My Plot (Map)'
            : lang === 'es'
            ? 'Mi Parcela (GPS)'
            : 'My Plot (GPS)'
        );
      }
    }

    if (sourceMode === 'gps') {
      setGeoStatus({
        type: 'success',
        message:
          lang === 'es'
            ? `¡Ubicación GPS capturada con éxito! ${finalRegion ? `Zona detectada: ${finalRegion}.` : ''} Ahora pulsa "Guardar Terreno y Ver Clima" abajo.`
            : `GPS location captured! ${finalRegion ? `Detected area: ${finalRegion}.` : ''} Click "Save Land" below.`
      });
    } else if (sourceMode === 'map') {
      setGeoStatus({
        type: 'success',
        message:
          lang === 'es'
            ? `¡Punto marcado en el mapa! ${finalRegion ? `Zona detectada: ${finalRegion}.` : ''} Pulsa "Guardar Terreno y Ver Clima" abajo.`
            : `Location pinned on map! ${finalRegion ? `Detected area: ${finalRegion}.` : ''} Click "Save Land" below.`
      });
    } else if (sourceMode === 'ip') {
      setGeoStatus({
        type: 'fallback',
        message:
          lang === 'es'
            ? `Ubicamos tu zona aproximada (${finalRegion || 'tu región'}) porque el GPS directo no respondió. Toca el mapa abajo o mueve el pin verde justo sobre tu terreno.`
            : `Detected approximate area (${finalRegion || 'your region'}). Tap the map below or drag the green pin directly onto your field.`
      });
    } else if (sourceMode === 'search') {
      setGeoStatus({
        type: 'success',
        message:
          lang === 'es'
            ? `¡Lugar seleccionado: ${finalRegion || finalPlace}! Puedes ajustar el pin en el mapa si quieres, o pulsar "Guardar Terreno y Ver Clima" abajo.`
            : `Place selected: ${finalRegion || finalPlace}! You can fine-tune the pin on the map or click "Save Land" below.`
      });
    }
  };

  const handleMapClick = (e: MapMouseEvent) => {
    const clicked = e.detail?.latLng;
    if (!clicked) return;
    applyCoordinates(clicked.lat, clicked.lng, undefined, undefined, undefined, 'map');
  };

  const handleMarkerDragEnd = (e: {
    latLng?: { lat: (() => number) | number; lng: (() => number) | number } | null;
  }) => {
    if (!e.latLng) return;
    const draggedLat = typeof e.latLng.lat === 'function' ? e.latLng.lat() : Number(e.latLng.lat);
    const draggedLng = typeof e.latLng.lng === 'function' ? e.latLng.lng() : Number(e.latLng.lng);
    if (isNaN(draggedLat) || isNaN(draggedLng)) return;
    applyCoordinates(draggedLat, draggedLng, undefined, undefined, undefined, 'map');
  };

  const tryNetworkLocationFallback = async (reasonMsgEs: string) => {
    const clientProviders = [
      async () => {
        const r = await fetch('https://get.geojs.io/v1/ip/geo.json', { signal: AbortSignal.timeout(4000) });
        if (!r.ok) return null;
        const d = await r.json();
        const lt = Number(d?.latitude);
        const ln = Number(d?.longitude);
        if (isNaN(lt) || isNaN(ln)) return null;
        return {
          lat: lt,
          lon: ln,
          city: d.city || '',
          region: [d.city, d.region, d.country].filter(Boolean).join(', ')
        };
      },
      async () => {
        const r = await fetch('https://ipwho.is/', { signal: AbortSignal.timeout(4000) });
        if (!r.ok) return null;
        const d = await r.json();
        if (d?.success === false || typeof d?.latitude !== 'number') return null;
        return {
          lat: d.latitude,
          lon: d.longitude,
          city: d.city || '',
          region: [d.city, d.region, d.country].filter(Boolean).join(', ')
        };
      },
      async () => {
        const r = await fetch('/api/ubicar-por-ip', { signal: AbortSignal.timeout(4500) });
        if (!r.ok) return null;
        const d = await r.json();
        if (!d?.success) return null;
        return {
          lat: d.lat,
          lon: d.lon,
          city: d.city || '',
          region: d.region || '',
          altitudeM: d.altitudeM
        };
      }
    ];

    for (const provider of clientProviders) {
      try {
        const result = await provider();
        if (result) {
          let alt = (result as any).altitudeM;
          if (typeof alt !== 'number') {
            try {
              const er = await fetch(`/api/reversa-lugar?lat=${result.lat}&lon=${result.lon}`);
              if (er.ok) {
                const ej = await er.json();
                if (typeof ej.altitudeM === 'number') alt = ej.altitudeM;
              }
            } catch {}
          }
          setIsLocating(false);
          await applyCoordinates(result.lat, result.lon, result.city, result.region, alt, 'ip');
          return;
        }
      } catch {}
    }

    setIsLocating(false);
    setGeoStatus({
      type: 'error',
      message: reasonMsgEs
    });
  };

  const handleGetCurrentLocation = () => {
    setIsLocating(true);
    setGeoStatus(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      tryNetworkLocationFallback(
        lang === 'es'
          ? 'Tu navegador no tiene GPS activo. Toca tu terreno directamente en el mapa abajo o busca tu pueblo.'
          : 'GPS not available on this device. Tap your land directly on the map below or search your town.'
      );
      return;
    }

    const onSuccess = async (pos: GeolocationPosition) => {
      setIsLocating(false);
      await applyCoordinates(
        pos.coords.latitude,
        pos.coords.longitude,
        undefined,
        undefined,
        pos.coords.altitude ? Math.round(pos.coords.altitude) : undefined,
        'gps'
      );
    };

    const onFailFinal = (err?: GeolocationPositionError) => {
      const reason =
        err?.code === 1
          ? lang === 'es'
            ? 'El permiso de GPS está bloqueado en tu navegador. Toca tu terreno directamente en el mapa de abajo o busca tu pueblo.'
            : 'Location permission is blocked. Tap your land directly on the map below or search your town.'
          : lang === 'es'
          ? 'No pudimos conectar con la antena GPS. Toca tu terreno directamente en el mapa de abajo o busca tu pueblo.'
          : 'Could not reach GPS signal. Tap your land directly on the map below or search your town.';

      tryNetworkLocationFallback(reason);
    };

    navigator.geolocation.getCurrentPosition(
      onSuccess,
      (err) => {
        if (err.code === err.PERMISSION_DENIED) {
          onFailFinal(err);
          return;
        }
        navigator.geolocation.getCurrentPosition(
          onSuccess,
          (err2) => onFailFinal(err2),
          { enableHighAccuracy: false, timeout: 6000, maximumAge: 120000 }
        );
      },
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 30000 }
    );
  };

  const handleSearchPlace = async (e?: React.FormEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    const q = placeQuery.trim();
    if (q.length < 2) return;

    setIsSearchingPlace(true);
    setPlaceResults([]);

    try {
      const res = await fetch(`/api/buscar-lugar?q=${encodeURIComponent(q)}`);
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data?.results) && data.results.length > 0) {
          setPlaceResults(data.results);
          setIsSearchingPlace(false);
          return;
        }
      }
    } catch {}

    try {
      const r = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=es&format=json`
      );
      if (r.ok) {
        const d = await r.json();
        if (Array.isArray(d?.results)) {
          setPlaceResults(
            d.results.map((item: any) => ({
              name: item.name,
              region: [item.admin1, item.country].filter(Boolean).join(', '),
              country: item.country || '',
              lat: Number(item.latitude),
              lon: Number(item.longitude),
              altitudeM: typeof item.elevation === 'number' ? Math.round(item.elevation) : 1200
            }))
          );
        }
      }
    } catch {}

    setIsSearchingPlace(false);
  };

  const handlePickPlaceResult = async (place: PlaceSearchResult) => {
    setPlaceResults([]);
    setPlaceQuery(place.region ? `${place.name}, ${place.region}` : place.name);
    await applyCoordinates(
      place.lat,
      place.lon,
      place.name,
      place.region || place.country,
      place.altitudeM,
      'search'
    );
  };

  const handleSaveCustomFarm = (e: React.FormEvent) => {
    e.preventDefault();
    const latNum = parseFloat(lat);
    const lonNum = parseFloat(lon);
    const altNum = parseInt(altitude, 10) || 1200;

    if (isNaN(latNum) || latNum < -90 || latNum > 90 || isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
      setGeoStatus({
        type: 'error',
        message:
          lang === 'es'
            ? 'Primero marca tu terreno tocando el mapa, usando "📍 Usar Mi GPS" o buscando el nombre de tu pueblo.'
            : 'Please tap the map, click "📍 Use My GPS", or search your town first.'
      });
      return;
    }

    const newFarm: CustomFarmInput = {
      id: `custom-${Date.now()}`,
      name: farmName.trim() || (lang === 'es' ? 'Mi Finca' : 'My Farm'),
      country: country.trim() || (lang === 'es' ? 'Mi Región' : 'Local'),
      lat: Number(latNum.toFixed(4)),
      lon: Number(lonNum.toFixed(4)),
      altitudeM: altNum,
      agroZone:
        terrainType === 'ladera-alta'
          ? lang === 'es'
            ? 'Ladera Alta · Pendiente Fuerte'
            : 'High Slope · Steep Gradient'
          : terrainType === 'ladera-media'
          ? lang === 'es'
            ? 'Ladera Media · Suelo Ondulado'
            : 'Mid Slope · Rolling Terrain'
          : terrainType === 'valle'
          ? lang === 'es'
            ? 'Valle · Buena Humedad'
            : 'Valley · Water Retention'
          : lang === 'es'
          ? 'Terreno Plano · Sol Directo'
          : 'Flat Plain · High Insolation',
      terrainType
    };

    onSelectFarm(newFarm);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="farm-modal-title"
        className="w-full max-w-2xl bg-[#0D1B13] border border-[#2B543D] rounded-2xl p-4 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#1E382A] pb-3.5">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#4ADE80] font-semibold">
              <Satellite className="w-4 h-4 text-[#4ADE80]" />
              <span>
                {lang === 'es' ? 'UBICAR MI PARCELA O FINCA' : 'LOCATE MY FARM OR FIELD'}
              </span>
            </div>
            <h3 id="farm-modal-title" className="font-display text-xl sm:text-2xl font-bold text-[#F4F3EE]">
              {lang === 'es' ? '¿Dónde está ubicada tu finca?' : 'Where is your farm located?'}
            </h3>
            <p className="text-xs text-[#A7B8AD]">
              {lang === 'es'
                ? 'Usa tu GPS, busca tu pueblo o toca directamente sobre tu terreno en el mapa.'
                : 'Use your GPS, search your town, or tap your field directly on the map.'}
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label={lang === 'es' ? 'Cerrar' : 'Close'}
            className="p-1.5 rounded-lg bg-[#12231A] border border-[#243E2F] text-[#8FA898] hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Mode Switcher */}
        <div className="flex rounded-xl bg-[#08120D] p-1 border border-[#1A3325] text-xs font-mono-tabular">
          <button
            type="button"
            onClick={() => setActiveTab('custom')}
            className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer text-center ${
              activeTab === 'custom'
                ? 'bg-[#1E3D2C] text-[#38BDF8] shadow-sm'
                : 'text-[#8FA898] hover:text-[#F4F3EE]'
            }`}
          >
            {lang === 'es' ? '🗺️ Mapa, GPS y Buscador' : '🗺️ Map, GPS & Search'}
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('preset')}
            className={`flex-1 py-2 rounded-lg font-bold transition-all cursor-pointer text-center ${
              activeTab === 'preset'
                ? 'bg-[#1E3D2C] text-[#4ADE80] shadow-sm'
                : 'text-[#8FA898] hover:text-[#F4F3EE]'
            }`}
          >
            {lang === 'es' ? 'Fincas Guardadas' : 'Saved Farms'}
          </button>
        </div>

        {/* Tab 1: Existing Farms */}
        {activeTab === 'preset' && (
          <div className="space-y-3">
            <div className="text-xs text-[#8FA898] font-mono-tabular">
              {lang === 'es'
                ? 'Toca una finca para cargar su clima y suelo:'
                : 'Tap a farm to load its weather and soil:'}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[340px] overflow-y-auto pr-1">
              {existingFarms.map((farm) => {
                const isSelected = farm.id === currentFarmId;
                return (
                  <button
                    key={farm.id}
                    type="button"
                    onClick={() => {
                      onSelectFarm(farm);
                      onClose();
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-2 ${
                      isSelected
                        ? 'bg-[#183526] border-[#4ADE80] ring-1 ring-[#4ADE80]/50 text-white'
                        : 'bg-[#102218] border-[#203D2D] hover:border-[#38BDF8] text-[#D7E0DA]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-1.5">
                      <div className="font-semibold text-xs text-[#F4F3EE] flex items-center gap-1.5">
                        <MapPin className="w-3.5 h-3.5 text-[#E09F3E] shrink-0" />
                        <span className="truncate">{farm.name}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-[#4ADE80] shrink-0" />}
                    </div>

                    <div className="text-[11px] text-[#A7B8AD] truncate">
                      {farm.country} · {farm.agroZone}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Interactive Map + GPS + Place Search */}
        {activeTab === 'custom' && (
          <form onSubmit={handleSaveCustomFarm} className="space-y-3.5 text-xs">
            {/* Quick GPS & Search Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
              {/* GPS Button */}
              <div className="sm:col-span-5 p-3 rounded-xl bg-[#12261C] border border-[#264E38] flex flex-col justify-between gap-2">
                <div className="font-bold text-xs text-[#F4F3EE] flex items-center gap-1.5">
                  <Navigation className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
                  <span>{lang === 'es' ? 'Opción 1: GPS Automático' : 'Option 1: Auto GPS'}</span>
                </div>
                <button
                  type="button"
                  onClick={handleGetCurrentLocation}
                  disabled={isLocating}
                  className="w-full px-3 py-2 rounded-lg bg-[#38BDF8] hover:bg-[#28A5DE] text-[#07130B] font-bold font-mono-tabular transition-all cursor-pointer shadow-sm disabled:opacity-60"
                >
                  {isLocating
                    ? lang === 'es'
                      ? '⏳ Buscando...'
                      : '⏳ Locating...'
                    : lang === 'es'
                    ? '📍 Usar Mi GPS Ahora'
                    : '📍 Use My GPS Now'}
                </button>
              </div>

              {/* Place Search */}
              <div className="sm:col-span-7 p-3 rounded-xl bg-[#0B1711] border border-[#203D2D] flex flex-col justify-between gap-2">
                <div className="font-bold text-xs text-[#F4F3EE] flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-[#4ADE80] shrink-0" />
                  <span>
                    {lang === 'es' ? 'Opción 2: Buscar pueblo o municipio' : 'Option 2: Search town'}
                  </span>
                </div>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={placeQuery}
                    onChange={(e) => setPlaceQuery(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleSearchPlace(e);
                      }
                    }}
                    placeholder={lang === 'es' ? 'Ej. Tunja, Puno, Oaxaca...' : 'e.g. Tunja, Cusco...'}
                    className="flex-1 min-w-0 px-2.5 py-2 rounded-lg bg-[#08120D] border border-[#213F2F] text-[#F4F3EE] focus:border-[#4ADE80] outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => handleSearchPlace()}
                    disabled={isSearchingPlace || placeQuery.trim().length < 2}
                    className="px-3 py-2 rounded-lg bg-[#1E3D2B] hover:bg-[#28523A] border border-[#3CA368] text-[#4ADE80] font-bold cursor-pointer disabled:opacity-50 shrink-0"
                  >
                    {isSearchingPlace ? '...' : lang === 'es' ? 'Buscar' : 'Go'}
                  </button>
                </div>
              </div>
            </div>

            {placeResults.length > 0 && (
              <div className="space-y-1.5 max-h-36 overflow-y-auto p-2 rounded-xl bg-[#08120D] border border-[#264C36]">
                {placeResults.map((place, idx) => (
                  <button
                    key={`${place.lat}-${place.lon}-${idx}`}
                    type="button"
                    onClick={() => handlePickPlaceResult(place)}
                    className="w-full p-2 rounded-lg bg-[#112419] hover:bg-[#193625] border border-[#264C36] text-left flex items-center justify-between gap-2 cursor-pointer transition-colors"
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-[#F4F3EE] truncate">{place.name}</div>
                      <div className="text-[11px] text-[#A7B8AD] truncate">{place.region}</div>
                    </div>
                    <span className="text-[11px] font-bold text-[#4ADE80] shrink-0">
                      {lang === 'es' ? 'Ir al mapa →' : 'Show on map →'}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {/* Option 3: Interactive Google Map Selector */}
            <div className="p-3 rounded-xl bg-[#0B1711] border border-[#264E38] space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="space-y-0.5">
                  <div className="font-bold text-xs text-[#F4F3EE] flex items-center gap-1.5">
                    <MapIcon className="w-4 h-4 text-[#E09F3E] shrink-0" />
                    <span>
                      {lang === 'es'
                        ? 'Opción 3: Toca tu terreno directamente en el mapa'
                        : 'Option 3: Tap your field directly on the map'}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#A7B8AD]">
                    {lang === 'es'
                      ? hasValidPin
                        ? 'Puedes tocar otro sitio o arrastrar el pin verde para mover tu punto.'
                        : 'Acércate con los dedos o el ratón y toca encima de tu finca para marcarla.'
                      : hasValidPin
                      ? 'Tap another spot or drag the green pin to adjust your exact parcel.'
                      : 'Zoom in and tap directly over your field to drop a pin.'}
                  </p>
                </div>

                {/* Satellite / Normal Map Switch */}
                <div className="flex items-center rounded-lg bg-[#08120D] p-0.5 border border-[#1E382A] text-[11px]">
                  <button
                    type="button"
                    onClick={() => setMapTypeId('hybrid')}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                      mapTypeId === 'hybrid'
                        ? 'bg-[#1E3D2C] text-[#4ADE80]'
                        : 'text-[#8FA898] hover:text-white'
                    }`}
                  >
                    {lang === 'es' ? 'Satélite' : 'Satellite'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMapTypeId('roadmap')}
                    className={`px-2.5 py-1 rounded-md font-semibold cursor-pointer transition-colors ${
                      mapTypeId === 'roadmap'
                        ? 'bg-[#1E3D2C] text-[#38BDF8]'
                        : 'text-[#8FA898] hover:text-white'
                    }`}
                  >
                    {lang === 'es' ? 'Mapa' : 'Map'}
                  </button>
                </div>
              </div>

              {GOOGLE_MAPS_API_KEY ? (
                <div className="w-full h-[260px] sm:h-[300px] rounded-xl overflow-hidden border border-[#2B543D] relative bg-[#08120D]">
                  <APIProvider apiKey={GOOGLE_MAPS_API_KEY} language={lang} libraries={['marker']}>
                    <GoogleMap
                      mapId="DEMO_MAP_ID"
                      internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                      defaultCenter={initialMapCenter}
                      defaultZoom={11}
                      mapTypeId={mapTypeId}
                      gestureHandling="greedy"
                      streetViewControl={false}
                      mapTypeControl={false}
                      fullscreenControl={false}
                      onClick={handleMapClick}
                      style={{ width: '100%', height: '100%' }}
                    >
                      <MapCameraController
                        targetCenter={cameraTarget}
                        targetZoom={cameraZoom}
                        triggerId={cameraTriggerId}
                      />
                      {hasValidPin && (
                        <AdvancedMarker
                          position={{ lat: parsedLat, lng: parsedLon }}
                          draggable={true}
                          onDragEnd={handleMarkerDragEnd}
                          title={farmName || (lang === 'es' ? 'Mi Terreno' : 'My Field')}
                        >
                          <Pin
                            background="#4ADE80"
                            borderColor="#07130B"
                            glyphColor="#07130B"
                            scale={1.25}
                          />
                        </AdvancedMarker>
                      )}
                    </GoogleMap>
                  </APIProvider>

                  {!hasValidPin && (
                    <div className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 bg-[#0B1610]/90 border border-[#4ADE80]/60 text-[#F4F3EE] px-3 py-1.5 rounded-lg text-[11px] font-semibold shadow-lg whitespace-nowrap">
                      {lang === 'es'
                        ? '👆 Toca en el mapa dónde queda tu finca'
                        : '👆 Tap on the map where your farm is'}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-[#08120D] border border-[#243E2F] text-[#A7B8AD] text-center space-y-1">
                  <div className="font-semibold text-[#F4F3EE]">
                    {lang === 'es'
                      ? 'Mapa visual pendiente de clave de configuración'
                      : 'Map display key not configured yet'}
                  </div>
                  <p className="text-[11px]">
                    {lang === 'es'
                      ? 'Mientras tanto, puedes usar el botón GPS o buscar el nombre de tu municipio arriba.'
                      : 'Meanwhile, you can use the GPS button or search your town above.'}
                  </p>
                </div>
              )}
            </div>

            {/* Status Feedback */}
            {geoStatus && (
              <div
                className={`p-3 rounded-xl border flex flex-col gap-2 text-xs ${
                  geoStatus.type === 'success'
                    ? 'bg-[#12291B] border-[#4ADE80] text-[#D1FAE5]'
                    : geoStatus.type === 'loading'
                    ? 'bg-[#0F222D] border-[#38BDF8] text-[#BAE6FD]'
                    : geoStatus.type === 'fallback'
                    ? 'bg-[#221D11] border-[#E09F3E] text-[#FDE68A]'
                    : 'bg-[#2A1412] border-[#C85A32] text-[#FCA5A5]'
                }`}
              >
                <div className="flex items-start gap-2">
                  {geoStatus.type === 'success' ? (
                    <CheckCircle2 className="w-4 h-4 text-[#4ADE80] shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  )}
                  <span className="leading-relaxed">{geoStatus.message}</span>
                </div>

                {(geoStatus.type === 'fallback' || geoStatus.type === 'error') &&
                  isInIframe &&
                  typeof window !== 'undefined' && (
                    <a
                      href={window.location.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold underline text-[#38BDF8] hover:text-white self-start pl-6"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>
                        {lang === 'es'
                          ? 'Si quieres usar la antena GPS directa, abre la app en pantalla completa aquí'
                          : 'Open app in full browser tab for direct GPS antenna'}
                      </span>
                    </a>
                  )}
              </div>
            )}

            {/* Simple Farm Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[#A7B8AD] font-mono-tabular mb-1 text-[11px]">
                  {lang === 'es' ? 'Nombre de tu Finca o Parcela' : 'Farm or Plot Name'}
                </label>
                <input
                  type="text"
                  value={farmName}
                  onChange={(e) => {
                    setFarmName(e.target.value);
                    setHasManualFarmName(e.target.value.trim().length > 0);
                  }}
                  placeholder={lang === 'es' ? 'Ej. Finca La Esperanza' : 'e.g. Oak Tree Farm'}
                  className="w-full px-3 py-2 rounded-lg bg-[#08120D] border border-[#213F2F] text-[#F4F3EE] focus:border-[#4ADE80] outline-none"
                />
              </div>

              <div>
                <label className="block text-[#A7B8AD] font-mono-tabular mb-1 text-[11px]">
                  {lang === 'es' ? 'Cómo es el terreno de tu campo' : 'Field Terrain Type'}
                </label>
                <select
                  value={terrainType}
                  onChange={(e) => setTerrainType(e.target.value as any)}
                  className="w-full px-3 py-2 rounded-lg bg-[#08120D] border border-[#213F2F] text-[#F4F3EE] focus:border-[#4ADE80] outline-none"
                >
                  <option value="ladera-alta">
                    {lang === 'es' ? 'Ladera empinada (Cerro alto)' : 'Steep Hillside'}
                  </option>
                  <option value="ladera-media">
                    {lang === 'es' ? 'Ladera suave / Ondulado' : 'Gentle Rolling Slope'}
                  </option>
                  <option value="valle">
                    {lang === 'es' ? 'Valle / Bajío (Junta agua)' : 'Valley / Bottomland'}
                  </option>
                  <option value="plano">
                    {lang === 'es' ? 'Terreno plano' : 'Flat Plain'}
                  </option>
                </select>
              </div>
            </div>

            {/* Optional Advanced Coordinates Toggle */}
            <div className="border-t border-[#1A3325] pt-2">
              <button
                type="button"
                onClick={() => setShowAdvancedCoords((prev) => !prev)}
                className="inline-flex items-center gap-1.5 text-[11px] font-mono-tabular text-[#8FA898] hover:text-[#38BDF8] cursor-pointer"
              >
                {showAdvancedCoords ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
                <span>
                  {lang === 'es'
                    ? lat && lon
                      ? 'Ubicación lista (ver o ajustar coordenadas manualmente)'
                      : '¿Prefieres escribir tus coordenadas a mano? (Opcional)'
                    : 'Manual coordinates (Optional)'}
                </span>
              </button>

              {showAdvancedCoords && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-[#A7B8AD] font-mono-tabular mb-1 text-[11px]">
                      {lang === 'es' ? 'Municipio / País' : 'Municipality / Country'}
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      placeholder="Ej. Boyacá, Colombia"
                      className="w-full px-3 py-2 rounded-lg bg-[#08120D] border border-[#213F2F] text-[#F4F3EE] focus:border-[#4ADE80] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A7B8AD] font-mono-tabular mb-1 text-[11px]">
                      {lang === 'es' ? 'Latitud' : 'Latitude'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={lat}
                      onChange={(e) => setLat(e.target.value)}
                      placeholder="Ej. 5.5320"
                      className="w-full px-3 py-2 rounded-lg bg-[#08120D] border border-[#213F2F] text-[#F4F3EE] font-mono-tabular focus:border-[#38BDF8] outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[#A7B8AD] font-mono-tabular mb-1 text-[11px]">
                      {lang === 'es' ? 'Longitud' : 'Longitude'}
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={lon}
                      onChange={(e) => setLon(e.target.value)}
                      placeholder="Ej. -73.3610"
                      className="w-full px-3 py-2 rounded-lg bg-[#08120D] border border-[#213F2F] text-[#F4F3EE] font-mono-tabular focus:border-[#38BDF8] outline-none"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="pt-2 flex justify-end gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-[#12231A] text-[#8FA898] hover:text-white border border-[#213F2F] font-mono-tabular cursor-pointer"
              >
                {lang === 'es' ? 'Cancelar' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-5 py-2.5 rounded-xl bg-[#4ADE80] hover:bg-[#3bca70] text-[#07130B] font-bold font-mono-tabular transition-all cursor-pointer shadow-md flex items-center gap-2"
              >
                <Satellite className="w-4 h-4" />
                <span>{lang === 'es' ? 'Guardar Terreno y Ver Clima' : 'Save Land & View Weather'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
