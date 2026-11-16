import React from 'react';

interface GlossaryVisualDiagramProps {
  termId: string;
  lang: 'es' | 'en';
}

export const GlossaryVisualDiagram: React.FC<GlossaryVisualDiagramProps> = ({
  termId,
  lang
}) => {
  const es = lang === 'es';

  switch (termId) {
    case 'g-kcfactor':
      return (
        <svg
          viewBox="0 0 320 112"
          className="w-full h-28 rounded-lg bg-[#08120D] border border-[#193023]"
          role="img"
          aria-label={es ? 'Esquema visual de sed del cultivo según su crecimiento' : 'Visual crop water need by stage'}
        >
          {/* Ground line */}
          <line x1="16" y1="86" x2="304" y2="86" stroke="#2D523D" strokeWidth="2" />
          {/* Stage 1: Sprout (Low water) */}
          <path d="M58 86 L58 68" stroke="#4ADE80" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="52" cy="67" rx="6" ry="3.5" fill="#4ADE80" transform="rotate(-25 52 67)" />
          <ellipse cx="64" cy="67" rx="6" ry="3.5" fill="#4ADE80" transform="rotate(25 64 67)" />
          <path d="M58 28 C58 28 53 35 53 39 A5 5 0 0 0 63 39 C63 35 58 28 58 28 Z" fill="#38BDF8" />
          <text x="58" y="101" textAnchor="middle" fill="#A7B8AD" fontSize="9.5" fontWeight="600">
            {es ? 'Brote (Poca)' : 'Sprout (Low)'}
          </text>

          {/* Stage 2: Flowering / Peak (High water) */}
          <path d="M160 86 L160 40" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="149" cy="62" rx="11" ry="5" fill="#4ADE80" transform="rotate(-25 149 62)" />
          <ellipse cx="171" cy="56" rx="11" ry="5" fill="#4ADE80" transform="rotate(25 171 56)" />
          <circle cx="160" cy="36" r="5" fill="#FDE047" />
          {/* 3 drops */}
          <path d="M142 14 C142 14 138 20 138 23 A4 4 0 0 0 146 23 C146 20 142 14 142 14 Z" fill="#38BDF8" />
          <path d="M160 10 C160 10 156 17 156 20 A4 4 0 0 0 164 20 C164 17 160 10 160 10 Z" fill="#38BDF8" />
          <path d="M178 14 C178 14 174 20 174 23 A4 4 0 0 0 182 23 C182 20 178 14 178 14 Z" fill="#38BDF8" />
          <text x="160" y="101" textAnchor="middle" fill="#4ADE80" fontSize="9.5" fontWeight="700">
            {es ? 'Floración (Máxima)' : 'Bloom (Peak)'}
          </text>

          {/* Stage 3: Harvest dry-down */}
          <path d="M262 86 L262 48" stroke="#E09F3E" strokeWidth="2.5" strokeLinecap="round" />
          <ellipse cx="253" cy="64" rx="8" ry="4" fill="#E09F3E" transform="rotate(-20 253 64)" />
          <ellipse cx="271" cy="60" rx="8" ry="4" fill="#E09F3E" transform="rotate(20 271 60)" />
          <path d="M262 28 C262 28 258 34 258 37 A4 4 0 0 0 266 37 C266 34 262 28 262 28 Z" fill="#38BDF8" opacity="0.7" />
          <text x="262" y="101" textAnchor="middle" fill="#E09F3E" fontSize="9.5" fontWeight="600">
            {es ? 'Madura (Menos)' : 'Mature (Less)'}
          </text>
        </svg>
      );

    case 'g-evapo':
      return (
        <svg
          viewBox="0 0 320 112"
          className="w-full h-28 rounded-lg bg-[#08120D] border border-[#193023]"
          role="img"
          aria-label={es ? 'Esquema visual de agua que sube por sol y hojas' : 'Visual soil evaporation and leaf transpiration'}
        >
          {/* Sun */}
          <circle cx="48" cy="26" r="11" fill="#FDE047" />
          <path d="M64 26 L72 26 M48 8 L48 12 M48 40 L48 44 M32 26 L24 26" stroke="#FDE047" strokeWidth="2" strokeLinecap="round" />
          {/* Soil */}
          <rect x="16" y="78" width="288" height="24" rx="4" fill="#172A1E" />
          {/* Bare soil evaporation (left) */}
          <path d="M88 74 L88 46" stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 3" />
          <path d="M84 50 L88 43 L92 50" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
          <path d="M106 74 L106 46" stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 3" />
          <path d="M102 50 L106 43 L110 50" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
          <text x="97" y="94" textAnchor="middle" fill="#E09F3E" fontSize="9" fontWeight="600">
            {es ? 'Suelo desnudo pierde agua' : 'Bare soil dries'}
          </text>

          {/* Plant transpiration (middle-right) */}
          <path d="M214 78 L214 48" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="202" cy="58" rx="11" ry="5" fill="#4ADE80" transform="rotate(-22 202 58)" />
          <ellipse cx="226" cy="54" rx="11" ry="5" fill="#4ADE80" transform="rotate(22 226 54)" />
          <path d="M214 42 L214 22" stroke="#38BDF8" strokeWidth="2" strokeDasharray="3 3" />
          <path d="M210 26 L214 19 L218 26" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
          <text x="225" y="94" textAnchor="middle" fill="#4ADE80" fontSize="9" fontWeight="600">
            {es ? 'Hojas sudan + sombra protege' : 'Leaves breathe + shade'}
          </text>
        </svg>
      );

    case 'g-srtm':
      return (
        <svg
          viewBox="0 0 320 112"
          className="w-full h-28 rounded-lg bg-[#08120D] border border-[#193023]"
          role="img"
          aria-label={es ? 'Esquema visual de pendiente medida desde satélite y curvas a nivel' : 'Visual satellite slope and contour farming'}
        >
          {/* Satellite */}
          <rect x="34" y="14" width="16" height="9" rx="2" fill="#38BDF8" />
          <line x1="26" y1="18.5" x2="34" y2="18.5" stroke="#93C5FD" strokeWidth="2" />
          <line x1="50" y1="18.5" x2="58" y2="18.5" stroke="#93C5FD" strokeWidth="2" />
          <line x1="46" y1="24" x2="112" y2="54" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="42" y1="24" x2="72" y2="68" stroke="#38BDF8" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Slope terrain */}
          <path d="M18 92 L95 48 L220 82 L302 82 L302 96 L18 96 Z" fill="#183022" stroke="#4ADE80" strokeWidth="1.8" />
          {/* Contour steps along hillside */}
          <circle cx="122" cy="56" r="3.5" fill="#4ADE80" />
          <circle cx="152" cy="64" r="3.5" fill="#4ADE80" />
          <circle cx="182" cy="72" r="3.5" fill="#4ADE80" />

          {/* Runoff arrow slowed */}
          <path d="M102 42 L195 66" stroke="#E09F3E" strokeWidth="2" />
          <path d="M190 61 L197 67 L188 69" fill="none" stroke="#E09F3E" strokeWidth="2" strokeLinecap="round" />

          <text x="250" y="34" textAnchor="middle" fill="#38BDF8" fontSize="9.5" fontWeight="700">
            {es ? 'Ladera inclinada' : 'Hillside slope'}
          </text>
          <text x="250" y="47" textAnchor="middle" fill="#A7B8AD" fontSize="9">
            {es ? 'Surcos atravesados' : 'Plant across slope'}
          </text>
          <text x="250" y="59" textAnchor="middle" fill="#4ADE80" fontSize="9" fontWeight="600">
            {es ? 'frenan el lavado' : 'to keep topsoil'}
          </text>
        </svg>
      );

    case 'g-grace':
      return (
        <svg
          viewBox="0 0 320 112"
          className="w-full h-28 rounded-lg bg-[#08120D] border border-[#193023]"
          role="img"
          aria-label={es ? 'Satélites gemelos midiendo agua profunda bajo tierra' : 'Twin satellites sensing deep groundwater'}
        >
          {/* Twin satellites */}
          <rect x="92" y="14" width="16" height="8" rx="2" fill="#38BDF8" />
          <rect x="208" y="14" width="16" height="8" rx="2" fill="#38BDF8" />
          <line x1="112" y1="18" x2="204" y2="18" stroke="#FDE047" strokeWidth="1.5" strokeDasharray="4 3" />
          <text x="158" y="11" textAnchor="middle" fill="#93C5FD" fontSize="8.5">
            {es ? 'Satélites gemelos' : 'Twin satellites'}
          </text>

          {/* Soil cross-section */}
          <rect x="20" y="46" width="280" height="22" rx="3" fill="#172A1E" />
          {/* Deep groundwater pocket */}
          <path d="M20 72 Q90 66 160 72 T300 72 L300 100 L20 100 Z" fill="#0F354D" stroke="#38BDF8" strokeWidth="1.5" />
          <path d="M100 26 L100 76" stroke="#38BDF8" strokeWidth="1.2" strokeDasharray="3 3" />
          <path d="M216 26 L216 76" stroke="#38BDF8" strokeWidth="1.2" strokeDasharray="3 3" />

          <text x="160" y="60" textAnchor="middle" fill="#B8C7BD" fontSize="9">
            {es ? 'Tierra y raíces arriba' : 'Topsoil & roots'}
          </text>
          <text x="160" y="89" textAnchor="middle" fill="#7DD3FC" fontSize="9.5" fontWeight="700">
            {es ? 'Agua subterránea y pozos profundos' : 'Deep groundwater & wells'}
          </text>
        </svg>
      );

    case 'g-gwetroot':
      return (
        <svg
          viewBox="0 0 320 112"
          className="w-full h-28 rounded-lg bg-[#08120D] border border-[#193023]"
          role="img"
          aria-label={es ? 'Humedad en la zona de raíces hasta 100 cm' : 'Moisture in 0-100 cm root zone'}
        >
          <rect x="20" y="42" width="280" height="54" rx="4" fill="#12271D" stroke="#234532" />
          {/* Depth marker */}
          <line x1="48" y1="44" x2="48" y2="94" stroke="#38BDF8" strokeWidth="2" />
          <text x="34" y="54" textAnchor="middle" fill="#A7B8AD" fontSize="8.5">0m</text>
          <text x="34" y="92" textAnchor="middle" fill="#38BDF8" fontSize="8.5">1m</text>
          {/* Plant + roots */}
          <path d="M150 42 L150 18" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="140" cy="26" rx="10" ry="4.5" fill="#4ADE80" transform="rotate(-20 140 26)" />
          <ellipse cx="160" cy="24" rx="10" ry="4.5" fill="#4ADE80" transform="rotate(20 160 24)" />
          <path d="M150 42 Q142 62 128 80 M150 42 L150 86 M150 42 Q158 64 174 82" stroke="#E09F3E" strokeWidth="2" fill="none" />
          {/* Water droplets near roots */}
          <circle cx="136" cy="68" r="3" fill="#38BDF8" />
          <circle cx="165" cy="70" r="3" fill="#38BDF8" />
          <circle cx="151" cy="76" r="3" fill="#38BDF8" />
          <text x="235" y="65" textAnchor="middle" fill="#7DD3FC" fontSize="9.5" fontWeight="600">
            {es ? 'Zona donde beben' : 'Root drinking zone'}
          </text>
          <text x="235" y="79" textAnchor="middle" fill="#4ADE80" fontSize="9">
            {es ? 'las raíces (0–100 cm)' : '(0–100 cm deep)'}
          </text>
        </svg>
      );

    case 'g-ndvi':
      return (
        <svg
          viewBox="0 0 320 112"
          className="w-full h-28 rounded-lg bg-[#08120D] border border-[#193023]"
          role="img"
          aria-label={es ? 'Mapa satelital de vigor verde del lote' : 'Satellite map of healthy vs stressed field patch'}
        >
          {/* Parcel split */}
          <rect x="28" y="34" width="128" height="60" rx="5" fill="#184D2E" stroke="#4ADE80" strokeWidth="1.5" />
          <rect x="164" y="34" width="128" height="60" rx="5" fill="#3F3315" stroke="#E09F3E" strokeWidth="1.5" />
          <text x="92" y="61" textAnchor="middle" fill="#4ADE80" fontSize="10" fontWeight="700">
            {es ? 'Verde vigoroso' : 'Lush & healthy'}
          </text>
          <text x="92" y="76" textAnchor="middle" fill="#B8C7BD" fontSize="8.5">
            {es ? 'Cultivo fuerte' : 'Strong canopy'}
          </text>
          <text x="228" y="61" textAnchor="middle" fill="#FDE047" fontSize="10" fontWeight="700">
            {es ? 'Zona pálida' : 'Stressed patch'}
          </text>
          <text x="228" y="76" textAnchor="middle" fill="#E09F3E" fontSize="8.5">
            {es ? 'Revisar agua o raíz' : 'Inspect water/roots'}
          </text>
          <text x="160" y="21" textAnchor="middle" fill="#38BDF8" fontSize="9" fontWeight="600">
            {es ? 'Vista desde el espacio sobre tu parcela' : 'Satellite view over your parcel'}
          </text>
        </svg>
      );

    case 'g-escorrentia':
      return (
        <svg
          viewBox="0 0 320 112"
          className="w-full h-28 rounded-lg bg-[#08120D] border border-[#193023]"
          role="img"
          aria-label={es ? 'Zanjas frenando la escorrentía en ladera' : 'Contour ditches capturing downhill runoff'}
        >
          <path d="M20 34 L120 60 L132 72 L148 62 L210 80 L222 92 L238 82 L300 94 L300 102 L20 102 Z" fill="#193324" stroke="#4ADE80" strokeWidth="1.5" />
          <circle cx="139" cy="67" r="5" fill="#38BDF8" />
          <circle cx="229" cy="87" r="5" fill="#38BDF8" />
          <path d="M52 24 L118 44" stroke="#38BDF8" strokeWidth="2" />
          <path d="M112 38 L120 44 L111 46" fill="none" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" />
          <text x="208" y="34" textAnchor="middle" fill="#7DD3FC" fontSize="9.5" fontWeight="600">
            {es ? 'Las zanjas atrapan el agua' : 'Ditches trap rainwater'}
          </text>
          <text x="208" y="48" textAnchor="middle" fill="#4ADE80" fontSize="9">
            {es ? 'para que entre en la raíz' : 'so it soaks into roots'}
          </text>
        </svg>
      );

    case 'g-acolchado':
      return (
        <svg
          viewBox="0 0 320 112"
          className="w-full h-28 rounded-lg bg-[#08120D] border border-[#193023]"
          role="img"
          aria-label={es ? 'Capa de paja o rastrojo protegiendo la tierra' : 'Straw mulch protecting soil moisture'}
        >
          <circle cx="48" cy="24" r="10" fill="#FDE047" />
          <rect x="24" y="68" width="272" height="30" rx="4" fill="#172A1E" />
          {/* Golden mulch blanket */}
          <rect x="24" y="61" width="272" height="9" rx="3" fill="#B6842D" />
          <path d="M160 64 L160 28" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="148" cy="40" rx="11" ry="5" fill="#4ADE80" transform="rotate(-22 148 40)" />
          <ellipse cx="172" cy="36" rx="11" ry="5" fill="#4ADE80" transform="rotate(22 172 36)" />
          <circle cx="110" cy="83" r="3.5" fill="#38BDF8" />
          <circle cx="210" cy="83" r="3.5" fill="#38BDF8" />
          <text x="232" y="44" textAnchor="middle" fill="#FDE047" fontSize="9" fontWeight="600">
            {es ? 'Abrigo de rastrojo' : 'Straw armor'}
          </text>
          <text x="160" y="90" textAnchor="middle" fill="#7DD3FC" fontSize="9">
            {es ? 'Tierra fresca y húmeda debajo' : 'Cool & moist soil underneath'}
          </text>
        </svg>
      );

    default:
      return (
        <svg
          viewBox="0 0 320 112"
          className="w-full h-28 rounded-lg bg-[#08120D] border border-[#193023]"
          role="img"
          aria-label={es ? 'Biología natural del suelo vivo' : 'Living soil natural fertility'}
        >
          <rect x="20" y="60" width="280" height="38" rx="4" fill="#162B1E" />
          <path d="M110 60 L110 26" stroke="#4ADE80" strokeWidth="3" strokeLinecap="round" />
          <ellipse cx="99" cy="38" rx="10" ry="4.5" fill="#4ADE80" transform="rotate(-22 99 38)" />
          <ellipse cx="121" cy="34" rx="10" ry="4.5" fill="#4ADE80" transform="rotate(22 121 34)" />
          {/* Roots with nitrogen nodules */}
          <path d="M110 60 Q100 76 88 88 M110 60 Q122 76 132 88" stroke="#E09F3E" strokeWidth="2" fill="none" />
          <circle cx="96" cy="78" r="4" fill="#4ADE80" />
          <circle cx="124" cy="77" r="4" fill="#4ADE80" />
          <text x="220" y="44" textAnchor="middle" fill="#4ADE80" fontSize="9.5" fontWeight="700">
            {es ? 'Abono vivo del campo' : 'Living farm fertility'}
          </text>
          <text x="220" y="81" textAnchor="middle" fill="#B8C7BD" fontSize="9">
            {es ? 'Raíces y vida natural que nutren' : 'Natural roots & biology feed soil'}
          </text>
        </svg>
      );
  }
};
