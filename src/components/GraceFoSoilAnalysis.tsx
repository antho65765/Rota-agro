import React, { useState } from 'react';
import {
  Satellite,
  Droplets,
  Layers,
  Activity,
  ArrowDownCircle,
  ShieldCheck,
  AlertTriangle,
  Volume2,
  VolumeX,
  Compass,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';

export interface GraceFoReport {
  farmName: string;
  lat: number;
  lon: number;
  altitudeM: number;
  regionName: string;
  groundwaterAnomalyCm: number;
  deepStorageTrend: 'recarga' | 'estable' | 'descenso';
  waterTableDepthM: number;
  waterTableChangeM: number;
  aquiferStressIndex: number;
  totalColumnStorageCm: number;
  deepResilienceYears: number;
  droughtBufferScore: number;
  twinSatellites: string;
  laserInterferometerDistanceKm: number;
  kBandMicrowavePrecisionMicrons: number;
  lastGravityPassDate: string;
  plainFarmerAdviceEs: string;
  plainFarmerAdviceEn: string;
}

interface GraceFoSoilAnalysisProps {
  lang: 'es' | 'en';
  report: GraceFoReport;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}

export const GraceFoSoilAnalysis: React.FC<GraceFoSoilAnalysisProps> = ({
  lang,
  report,
  onSpeak,
  isSpeaking = false
}) => {
  const [selectedDetail, setSelectedDetail] = useState<string | null>(null);

  const fullSpeechText =
    lang === 'es'
      ? `Análisis de agua profunda para ${report.farmName}. Estado del agua subterránea: ${
          report.groundwaterAnomalyCm >= 0 ? 'Abundante y con buena reserva' : 'En nivel bajo o ajustado'
        }. El agua bajo la tierra se encuentra a una profundidad segura. Tendencia del acuífero: ${
          report.deepStorageTrend === 'recarga'
            ? 'recuperándose gracias a las lluvias'
            : report.deepStorageTrend === 'estable'
            ? 'estable y normal'
            : 'en descenso por sequía'
        }. ${report.plainFarmerAdviceEs}`
      : `Deep water report for ${report.farmName}. Groundwater status: ${report.groundwaterAnomalyCm >= 0 ? 'Abundant reserve' : 'Low reserve'}. ${report.plainFarmerAdviceEn}`;

  return (
    <div className="bg-[#0B1711] border border-[#214331] rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1A3728]">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#162D21] border border-[#38BDF8]/50 text-xs font-mono-tabular font-bold text-[#38BDF8]">
              <Satellite className="w-3.5 h-3.5 text-[#38BDF8] animate-pulse" />
              <span>Satélites de Agua Profunda</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#10241A] border border-[#2B543D] text-[11px] font-mono-tabular text-[#4ADE80]">
              <span>Lectura del Manto Subterráneo</span>
            </span>
          </div>

          <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F4F3EE] flex items-center gap-2">
            <span>
              {lang === 'es'
                ? `Agua en el Fondo y Pozos para ${report.farmName}`
                : `Deep Water & Wells for ${report.farmName}`}
            </span>
          </h3>

          <p className="text-xs sm:text-sm text-[#A7B8AD] max-w-3xl leading-relaxed">
            {lang === 'es'
              ? 'Los satélites especiales revisan cuánta agua hay almacenada en las profundidades de tu tierra, en los mantos de agua y en los pozos para saber si estamos bien abastecidos.'
              : 'Satellites track deep water storage and underground reserves under your farm.'}
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
                  <span>{lang === 'es' ? 'Escuchar Estado del Agua' : 'Listen to Report'}</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 4 Pillars of Deep Soil & Groundwater Data */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Pillar 1: Groundwater Status */}
        <div
          onClick={() => setSelectedDetail('anomaly')}
          className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 relative ${
            selectedDetail === 'anomaly'
              ? 'bg-[#132A1E] border-[#38BDF8] shadow-lg ring-1 ring-[#38BDF8]/40'
              : 'bg-[#0E1E16] border-[#224431] hover:border-[#38BDF8]/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono-tabular">
            <span className="text-[#8FA898] flex items-center gap-1.5 font-semibold">
              <Droplets className="w-4 h-4 text-[#38BDF8]" />
              <span>{lang === 'es' ? '1. AGUA SUBTERRÁNEA' : '1. GROUNDWATER'}</span>
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className={`text-lg sm:text-xl font-bold ${
                report.groundwaterAnomalyCm >= 0 ? 'text-[#4ADE80]' : 'text-[#F87171]'
              }`}
            >
              {lang === 'es'
                ? report.groundwaterAnomalyCm >= 0
                  ? 'Reserva Saludable y Abundante'
                  : 'Reserva Ajustada o Baja'
                : report.groundwaterAnomalyCm >= 0
                ? 'Healthy Reserve'
                : 'Low Reserve'}
            </span>
          </div>

          <p className="text-[11px] text-[#A7B8AD] leading-relaxed pt-1">
            {lang === 'es'
              ? report.groundwaterAnomalyCm >= 0
                ? 'El fondo de la tierra mantiene buena humedad acumulada para sostener los cultivos.'
                : 'El agua profunda está por debajo de lo normal. Es mejor cuidar cada gota en los pozos.'
              : 'Groundwater reserve indicator.'}
          </p>
        </div>

        {/* Pillar 2: Water Table Depth */}
        <div
          onClick={() => setSelectedDetail('watertable')}
          className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 relative ${
            selectedDetail === 'watertable'
              ? 'bg-[#132A1E] border-[#4ADE80] shadow-lg ring-1 ring-[#4ADE80]/40'
              : 'bg-[#0E1E16] border-[#224431] hover:border-[#4ADE80]/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono-tabular">
            <span className="text-[#8FA898] flex items-center gap-1.5 font-semibold">
              <ArrowDownCircle className="w-4 h-4 text-[#4ADE80]" />
              <span>{lang === 'es' ? '2. NIVEL DEL POZO' : '2. WATER TABLE'}</span>
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-bold text-[#F4F3EE]">
              {lang === 'es'
                ? report.waterTableDepthM <= 12
                  ? 'Manto Cerca de la Superficie'
                  : report.waterTableDepthM <= 22
                  ? 'Manto a Profundidad Media'
                  : 'Manto Muy Hondo'
                : 'Water Table Depth'}
            </span>
          </div>

          <p className="text-[11px] text-[#A7B8AD] leading-relaxed pt-1">
            {lang === 'es'
              ? report.waterTableDepthM <= 12
                ? 'El agua está accesible para raíces hondas y pozos sin tanto esfuerzo de bombeo.'
                : 'El agua está en capas profundas; las plantas dependen más de la lluvia que cae directo.'
              : 'Water table relative depth.'}
          </p>
        </div>

        {/* Pillar 3: Aquifer Trend */}
        <div
          onClick={() => setSelectedDetail('trend')}
          className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 relative ${
            selectedDetail === 'trend'
              ? 'bg-[#132A1E] border-[#E09F3E] shadow-lg ring-1 ring-[#E09F3E]/40'
              : 'bg-[#0E1E16] border-[#224431] hover:border-[#E09F3E]/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono-tabular">
            <span className="text-[#8FA898] flex items-center gap-1.5 font-semibold">
              <Activity className="w-4 h-4 text-[#E09F3E]" />
              <span>{lang === 'es' ? '3. RUMBO DEL AGUA' : '3. AQUIFER TREND'}</span>
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className={`text-lg sm:text-xl font-bold ${
                report.deepStorageTrend === 'recarga'
                  ? 'text-[#4ADE80]'
                  : report.deepStorageTrend === 'estable'
                  ? 'text-[#38BDF8]'
                  : 'text-[#F87171]'
              }`}
            >
              {lang === 'es'
                ? report.deepStorageTrend === 'recarga'
                  ? 'Recuperándose y Llenándose ↗'
                  : report.deepStorageTrend === 'estable'
                  ? 'Estable y Sin Cambios ➔'
                  : 'Bajando por Falta de Lluvia ↘'
                : report.deepStorageTrend}
            </span>
          </div>

          <p className="text-[11px] text-[#A7B8AD] leading-relaxed pt-1">
            {lang === 'es'
              ? report.deepStorageTrend === 'recarga'
                ? 'Las lluvias recientes han filtrado bien hacia el fondo de la tierra.'
                : report.deepStorageTrend === 'estable'
                ? 'El nivel del agua se mantiene parejo con respecto a otros años.'
                : 'Está saliendo más agua de la que entra. Conviene usar cobertura para retener humedad.'
              : 'Long term trend.'}
          </p>
        </div>

        {/* Pillar 4: Drought Protection */}
        <div
          onClick={() => setSelectedDetail('resilience')}
          className={`p-4 rounded-xl border transition-all cursor-pointer space-y-2.5 relative ${
            selectedDetail === 'resilience'
              ? 'bg-[#132A1E] border-[#4ADE80] shadow-lg ring-1 ring-[#4ADE80]/40'
              : 'bg-[#0E1E16] border-[#224431] hover:border-[#4ADE80]/60'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-mono-tabular">
            <span className="text-[#8FA898] flex items-center gap-1.5 font-semibold">
              <ShieldCheck className="w-4 h-4 text-[#4ADE80]" />
              <span>{lang === 'es' ? '4. ESCUDO SEQUÍA' : '4. DROUGHT BUFFER'}</span>
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <span className="text-lg sm:text-xl font-bold text-[#4ADE80]">
              {report.droughtBufferScore >= 70
                ? (lang === 'es' ? 'Muy Protegido' : 'Well Protected')
                : report.droughtBufferScore >= 45
                ? (lang === 'es' ? 'Protección Moderada' : 'Moderate')
                : (lang === 'es' ? 'Vulnerable a Sequía' : 'Vulnerable')}
            </span>
          </div>

          <p className="text-[11px] text-[#A7B8AD] leading-relaxed pt-1">
            {lang === 'es'
              ? 'Capacidad que tiene la tierra para aguantar temporadas secas sin perder la humedad del subsuelo.'
              : 'Soil resilience against drought.'}
          </p>
        </div>
      </div>

      {/* Advice Card */}
      <div className="p-4 sm:p-5 rounded-xl bg-gradient-to-r from-[#112419] via-[#0E1E15] to-[#12271C] border border-[#2B543D] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5 max-w-3xl">
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#38BDF8] font-bold">
            <Sparkles className="w-4 h-4 text-[#38BDF8] shrink-0" />
            <span>
              {lang === 'es'
                ? `CONSEJO PRÁCTICO PARA ${report.farmName.toUpperCase()}`
                : `PRACTICAL ADVICE FOR ${report.farmName.toUpperCase()}`}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#F4F3EE] font-medium leading-relaxed">
            {lang === 'es' ? report.plainFarmerAdviceEs : report.plainFarmerAdviceEn}
          </p>
        </div>
      </div>
    </div>
  );
};
