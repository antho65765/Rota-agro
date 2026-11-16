import React, { useState } from 'react';
import {
  Satellite,
  Layers,
  Droplets,
  ShieldCheck,
  Activity,
  Sparkles,
  Mountain,
  AlertTriangle,
  Volume2,
  VolumeX,
  Calendar,
  Compass,
  ArrowRight,
  Info
} from 'lucide-react';

export interface NisarSoilReport {
  farmName: string;
  lat: number;
  lon: number;
  altitudeM: number;
  terrainType: string;
  volumetricMoisturePct: number;
  dielectricConstant: number;
  penetrationDepthCm: number;
  surfaceRoughnessCm: number;
  hhVvRatioDb: number;
  tillageClass: 'Labranza Cero / Cobertura Densa' | 'Labranza Mínima / Rastrojo' | 'Suelo Arado / Rugoso' | 'Suelo Encostrado / Liso';
  tillageClassEn: 'Zero Till / Dense Mulch' | 'Reduced Till / Stubble' | 'Plowed / Rough Soil' | 'Crusted / Smooth Bare Soil';
  compactionScorePct: number;
  deformationRateMmYr: number;
  hardpanDetected: boolean;
  canopyBiomassTonsHa: number;
  mulchCoverPct: number;
  radarFrequency: string;
  orbitCycleDays: number;
  nextPassDays: number;
  plainFarmerRecommendationEs: string;
  plainFarmerRecommendationEn: string;
}

interface NisarSoilAnalysisProps {
  lang: 'es' | 'en';
  report: NisarSoilReport;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}

export const NisarSoilAnalysis: React.FC<NisarSoilAnalysisProps> = ({
  lang,
  report,
  onSpeak,
  isSpeaking = false
}) => {
  const [activeMetricDetail, setActiveMetricDetail] = useState<string | null>(null);

  const fullSpeechText =
    lang === 'es'
      ? `Radiografía del suelo por radar para ${report.farmName}. Humedad bajo las plantas: ${
          report.volumetricMoisturePct >= 25 ? 'excelente y adecuada' : 'necesita más agua'
        }. Condición de la tierra: ${report.tillageClass}. Nivel de dureza o compactación: ${
          report.compactionScorePct <= 40 ? 'tierra suelta y blanda' : 'tierra apretada o dura'
        }. ${report.plainFarmerRecommendationEs}`
      : `Radar soil report for ${report.farmName}. ${report.plainFarmerRecommendationEn}`;

  return (
    <div className="bg-[#0B1711] border border-[#214331] rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1A3728]">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#162D21] border border-[#4ADE80]/50 text-xs font-mono-tabular font-bold text-[#4ADE80]">
              <Satellite className="w-3.5 h-3.5 text-[#4ADE80] animate-pulse" />
              <span>Radar Satelital de Suelo</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#10241A] border border-[#2B543D] text-[11px] font-mono-tabular text-[#38BDF8]">
              <span>Escaneo Bajo las Plantas y Nubes</span>
            </span>
          </div>

          <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F4F3EE] flex items-center gap-2">
            <span>
              {lang === 'es'
                ? `Radiografía del Suelo en ${report.farmName}`
                : `Radar Soil Radiography for ${report.farmName}`}
            </span>
          </h3>

          <p className="text-xs sm:text-sm text-[#A7B8AD] max-w-3xl leading-relaxed">
            {lang === 'es'
              ? 'El radar mira a través de las nubes y las hojas de los cultivos para ver cómo está la humedad abajo, si la tierra está apretada o si tiene buena cobertura de rastrojo.'
              : 'Radar scans through clouds and leaves to map root moisture and soil structure.'}
          </p>
        </div>

        {/* Audio narration button */}
        {onSpeak && (
          <div className="shrink-0 flex items-center gap-2">
            <button
              type="button"
              onClick={() => onSpeak(fullSpeechText)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-mono-tabular font-bold transition-all cursor-pointer border ${
                isSpeaking
                  ? 'bg-[#C85A32] text-white border-[#C85A32] shadow-md animate-pulse'
                  : 'bg-[#12271C] text-[#38BDF8] border-[#2A523C] hover:bg-[#193526]'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4 shrink-0" />
                  <span>{lang === 'es' ? 'Detener Voz' : 'Stop Audio'}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 shrink-0 text-[#38BDF8]" />
                  <span>{lang === 'es' ? 'Escuchar Estado del Suelo' : 'Listen to Report'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Main Grid of 4 Physical Soil Pillars */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* 1. Agua bajo las plantas */}
        <div
          onClick={() => setActiveMetricDetail('moisture')}
          className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 relative ${
            activeMetricDetail === 'moisture'
              ? 'bg-[#132A1E] border-[#4ADE80] shadow-lg ring-1 ring-[#4ADE80]/40'
              : 'bg-[#0E1E16] border-[#224431] hover:border-[#4ADE80]/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono-tabular">
            <span className="text-[#8FA898] flex items-center gap-1.5 font-semibold">
              <Droplets className="w-4 h-4 text-[#4ADE80]" />
              <span>{lang === 'es' ? '1. AGUA BAJO LAS MATAS' : '1. MOISTURE'}</span>
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-bold text-[#4ADE80]">
              {lang === 'es'
                ? report.volumetricMoisturePct >= 25
                  ? 'Humedad Buena y Adecuada'
                  : 'Humedad Bajita o Escasa'
                : report.volumetricMoisturePct >= 25
                ? 'Good Moisture'
                : 'Low Moisture'}
            </span>
          </div>

          <p className="text-[11px] text-[#A7B8AD] leading-relaxed pt-1">
            {lang === 'es'
              ? 'El radar confirma cuánta agua tienen las raíces de tus cultivos para beber tranquilamente.'
              : 'Root-zone moisture level.'}
          </p>
        </div>

        {/* 2. Capa protectora */}
        <div
          onClick={() => setActiveMetricDetail('roughness')}
          className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 relative ${
            activeMetricDetail === 'roughness'
              ? 'bg-[#132A1E] border-[#38BDF8] shadow-lg ring-1 ring-[#38BDF8]/40'
              : 'bg-[#0E1E16] border-[#224431] hover:border-[#38BDF8]/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono-tabular">
            <span className="text-[#8FA898] flex items-center gap-1.5 font-semibold">
              <Layers className="w-4 h-4 text-[#38BDF8]" />
              <span>{lang === 'es' ? '2. CAPA PROTECTORA' : '2. SOIL COVER'}</span>
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-sm sm:text-base font-bold text-[#F4F3EE]">
              {lang === 'es' ? report.tillageClass : report.tillageClassEn}
            </div>
          </div>

          <p className="text-[11px] text-[#A7B8AD] leading-relaxed pt-1">
            {lang === 'es'
              ? 'Indica si la tierra tiene rastrojo o cobertura natural que frena la lluvia y evita la erosión.'
              : 'Ground cover and stubble protection.'}
          </p>
        </div>

        {/* 3. Dureza de la tierra */}
        <div
          onClick={() => setActiveMetricDetail('compaction')}
          className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 relative ${
            activeMetricDetail === 'compaction'
              ? 'bg-[#132A1E] border-[#E09F3E] shadow-lg ring-1 ring-[#E09F3E]/40'
              : 'bg-[#0E1E16] border-[#224431] hover:border-[#E09F3E]/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono-tabular">
            <span className="text-[#8FA898] flex items-center gap-1.5 font-semibold">
              <Activity className="w-4 h-4 text-[#E09F3E]" />
              <span>{lang === 'es' ? '3. DUREZA DE LA TIERRA' : '3. COMPACTION'}</span>
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className={`text-lg sm:text-xl font-bold ${
                report.compactionScorePct <= 40 ? 'text-[#4ADE80]' : 'text-[#E85D45]'
              }`}
            >
              {lang === 'es'
                ? report.compactionScorePct <= 40
                  ? 'Tierra Suelta y Suave'
                  : 'Tierra Aprietada o Dura'
                : report.compactionScorePct <= 40
                ? 'Loose Soil'
                : 'Compacted Soil'}
            </span>
          </div>

          <p className="text-[11px] text-[#A7B8AD] leading-relaxed pt-1">
            {lang === 'es'
              ? 'Tierra suelta permite que el agua baje con facilidad; tierra dura dificulta el crecimiento de las raíces.'
              : 'Soil compaction status.'}
          </p>
        </div>

        {/* 4. Cobertura de rastrojo */}
        <div
          onClick={() => setActiveMetricDetail('mulch')}
          className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 relative ${
            activeMetricDetail === 'mulch'
              ? 'bg-[#132A1E] border-[#4ADE80] shadow-lg ring-1 ring-[#4ADE80]/40'
              : 'bg-[#0E1E16] border-[#224431] hover:border-[#4ADE80]/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono-tabular">
            <span className="text-[#8FA898] flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#4ADE80]" />
              <span>{lang === 'es' ? '4. MANTO DE PROTECCIÓN' : '4. MULCH COVER'}</span>
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-bold text-[#4ADE80]">
              {report.mulchCoverPct >= 50
                ? (lang === 'es' ? 'Cobertura Abundante' : 'Abundant Cover')
                : (lang === 'es' ? 'Cobertura Parcial' : 'Moderate Cover')}
            </span>
          </div>

          <p className="text-[11px] text-[#A7B8AD] leading-relaxed pt-1">
            {lang === 'es'
              ? 'Manto vegetal que protege la tierra contra el sol fuerte y el impacto directo de la lluvia.'
              : 'Plant residue protection layer.'}
          </p>
        </div>
      </div>

      {/* Recommendation Card */}
      <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-[#112419] via-[#0E1E15] to-[#12271C] border border-[#2B543D] space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#4ADE80] font-bold">
          <Sparkles className="w-4 h-4 text-[#4ADE80] shrink-0" />
          <span>
            {lang === 'es'
              ? `CONSEJO DEL RADAR PARA ${report.farmName.toUpperCase()}`
              : `RADAR RECOMMENDATION FOR ${report.farmName.toUpperCase()}`}
          </span>
        </div>
        <p className="text-xs sm:text-sm text-[#F4F3EE] font-medium leading-relaxed">
          {lang === 'es' ? report.plainFarmerRecommendationEs : report.plainFarmerRecommendationEn}
        </p>
      </div>
    </div>
  );
};
