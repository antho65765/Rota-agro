import React, { useState } from 'react';
import {
  TrendingUp,
  Calendar,
  CloudRain,
  Sun,
  Thermometer,
  ShieldCheck,
  RefreshCw,
  Sparkles,
  Volume2,
  VolumeX,
  CheckCircle2,
  AlertTriangle,
  Compass,
  Activity
} from 'lucide-react';

export interface FuturePredictionReport {
  farmName: string;
  region: string;
  forecastMonths: {
    monthName: string;
    projectedRainMm: number;
    projectedTempC: number;
    soilMoisturePct: number;
    riskLevel: 'bajo' | 'moderado' | 'alto';
    plainSummaryEs: string;
    plainSummaryEn: string;
  }[];
  trendSummaryEs: string;
  trendSummaryEn: string;
  modelAccuracyPct: number;
  lastCalibrationTime: string;
}

interface FutureClimatePredictionProps {
  lang: 'es' | 'en';
  report: FuturePredictionReport;
  onRecalibrate: () => void;
  isRecalibrating?: boolean;
  onSpeak?: (text: string) => void;
  isSpeaking?: boolean;
}

export const FutureClimatePrediction: React.FC<FutureClimatePredictionProps> = ({
  lang,
  report,
  onRecalibrate,
  isRecalibrating = false,
  onSpeak,
  isSpeaking = false
}) => {
  const [activeMonthIdx, setActiveMonthIdx] = useState<number>(0);

  const currentMonthForecast = report.forecastMonths[activeMonthIdx] || report.forecastMonths[0];

  const fullSpeechText =
    lang === 'es'
      ? `Pronóstico del tiempo para los próximos meses en ${report.farmName}. Para el mes de ${currentMonthForecast.monthName}: ${currentMonthForecast.plainSummaryEs}`
      : `Future climate forecast for ${report.farmName}. For ${currentMonthForecast.monthName}: ${currentMonthForecast.plainSummaryEn}`;

  return (
    <div className="bg-[#0B1711] border border-[#214331] rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#1A3728]">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#162D21] border border-[#38BDF8]/50 text-xs font-mono-tabular font-bold text-[#38BDF8]">
              <TrendingUp className="w-3.5 h-3.5 text-[#38BDF8] animate-pulse" />
              <span>Pronóstico del Tiempo a Futuro</span>
            </span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[#10241A] border border-[#4ADE80]/40 text-[11px] font-mono-tabular text-[#4ADE80]">
              <ShieldCheck className="w-3 h-3 text-[#4ADE80]" />
              <span>Pronóstico Actualizado y Confiable</span>
            </span>
          </div>

          <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F4F3EE] flex items-center gap-2">
            <span>
              {lang === 'es'
                ? `Cómo Estará el Tiempo en los Próximos Meses en ${report.farmName}`
                : `Future Weather & Crop Forecast for ${report.farmName}`}
            </span>
          </h3>

          <p className="text-xs sm:text-sm text-[#A7B8AD] max-w-3xl leading-relaxed">
            {lang === 'es'
              ? 'El sistema analiza el comportamiento del clima en años anteriores para adelantarse y decirte cuándo lloverá más o cuándo habrá sol fuerte.'
              : 'System projects upcoming weather trends to help farmers plan ahead.'}
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onRecalibrate}
            disabled={isRecalibrating}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-[#1E3D2B] hover:bg-[#254F37] border border-[#3CA368] text-[#4ADE80] text-xs font-mono-tabular font-bold transition-all cursor-pointer shadow-md disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRecalibrating ? 'animate-spin' : ''}`} />
            <span>
              {lang === 'es'
                ? isRecalibrating
                  ? 'Actualizando...'
                  : '🔄 Actualizar Pronóstico'
                : isRecalibrating
                ? 'Updating...'
                : '🔄 Refresh Forecast'}
            </span>
          </button>

          {onSpeak && (
            <button
              type="button"
              onClick={() => onSpeak(fullSpeechText)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-mono-tabular transition-colors cursor-pointer ${
                isSpeaking
                  ? 'bg-[#C85A32] text-white border-[#E09F3E]'
                  : 'bg-[#13261C] text-[#F4F3EE] hover:bg-[#1A3326] border-[#284635]'
              }`}
            >
              {isSpeaking ? <VolumeX className="w-3.5 h-3.5 shrink-0" /> : <Volume2 className="w-3.5 h-3.5 shrink-0 text-[#E09F3E]" />}
              <span>{isSpeaking ? (lang === 'es' ? 'Detener' : 'Stop') : (lang === 'es' ? 'Escuchar' : 'Listen')}</span>
            </button>
          )}
        </div>
      </div>

      {/* Trend Overview Box */}
      <div className="bg-[#12231A] border border-[#243E2F] rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#1E3D2B] border border-[#3CA368] flex items-center justify-center shrink-0 text-[#4ADE80]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="space-y-1">
            <div className="text-xs font-mono-tabular text-[#38BDF8]">
              {lang === 'es' ? 'RESUMEN DEL TIEMPO PARA LOS PRÓXIMOS MESES' : 'FUTURE TREND SUMMARY'}
            </div>
            <p className="text-xs sm:text-sm text-[#F4F3EE] leading-relaxed">
              {lang === 'es' ? report.trendSummaryEs : report.trendSummaryEn}
            </p>
          </div>
        </div>
        <div className="shrink-0 text-[11px] font-mono-tabular text-[#A7B8AD] bg-[#0A150F] px-3 py-1.5 rounded-lg border border-[#1A3728]">
          {report.lastCalibrationTime}
        </div>
      </div>

      {/* Month Selector Tabs */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-mono-tabular font-bold text-[#F4F3EE]">
            {lang === 'es' ? 'Selecciona el Mes que Deseas Consultar:' : 'Select Month to Inspect:'}
          </div>
          <span className="text-[11px] font-mono-tabular text-[#4ADE80]">
            {report.forecastMonths.length} {lang === 'es' ? 'meses listos' : 'months ready'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
          {report.forecastMonths.map((m, idx) => (
            <button
              key={m.monthName}
              type="button"
              onClick={() => setActiveMonthIdx(idx)}
              className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between space-y-1.5 ${
                activeMonthIdx === idx
                  ? 'bg-[#1D3B2A] border-[#4ADE80] shadow-md ring-1 ring-[#4ADE80]/30'
                  : 'bg-[#112219] hover:bg-[#183224] border-[#22402F] text-[#A7B8AD]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold font-mono-tabular ${activeMonthIdx === idx ? 'text-[#4ADE80]' : 'text-[#F4F3EE]'}`}>
                  {m.monthName}
                </span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    m.riskLevel === 'bajo'
                      ? 'bg-[#4ADE80]'
                      : m.riskLevel === 'moderado'
                      ? 'bg-[#E09F3E]'
                      : 'bg-[#E85D45]'
                  }`}
                />
              </div>
              <div className="text-[11px] font-mono-tabular text-[#38BDF8]">
                {m.projectedRainMm > 120 ? (lang === 'es' ? 'Lluvia Frecuente' : 'Frequent rain') : m.projectedRainMm > 60 ? (lang === 'es' ? 'Lluvia Normal' : 'Normal rain') : (lang === 'es' ? 'Poca Lluvia' : 'Low rain')}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Selected Month Detailed Breakdown Card */}
      <div className="bg-[#12231A] border border-[#2B543D] rounded-2xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1E3A2B]">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-[#1D3B2A] border border-[#4ADE80] flex items-center justify-center shrink-0 text-[#4ADE80]">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-mono-tabular text-[#38BDF8]">
                {lang === 'es' ? 'PRONÓSTICO PARA EL MES DE' : 'FORECAST FOR'}
              </div>
              <h4 className="text-lg sm:text-xl font-bold text-[#F4F3EE]">{currentMonthForecast.monthName}</h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono-tabular font-bold ${
                currentMonthForecast.riskLevel === 'bajo'
                  ? 'bg-[#142B1E] text-[#4ADE80] border border-[#2D5A40]'
                  : currentMonthForecast.riskLevel === 'moderado'
                  ? 'bg-[#2A2312] text-[#E09F3E] border border-[#52411E]'
                  : 'bg-[#2B1512] text-[#E85D45] border border-[#5E2B25]'
              }`}
            >
              {currentMonthForecast.riskLevel === 'bajo' ? (
                <CheckCircle2 className="w-3.5 h-3.5" />
              ) : (
                <AlertTriangle className="w-3.5 h-3.5" />
              )}
              <span>
                {lang === 'es'
                  ? currentMonthForecast.riskLevel === 'bajo'
                    ? 'Condiciones Seguras y Tranquilas'
                    : currentMonthForecast.riskLevel === 'moderado'
                    ? 'Atención a la Humedad'
                    : 'Alerta por Falta de Agua'
                  : `Climate Risk: ${currentMonthForecast.riskLevel.toUpperCase()}`}
              </span>
            </span>
          </div>
        </div>

        {/* 3 Qualitative Condition Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-[#0C1912] border border-[#1E382A] space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#38BDF8]">
              <CloudRain className="w-4 h-4 text-[#38BDF8]" />
              <span>{lang === 'es' ? 'Cantidad de Lluvia' : 'Projected Rainfall'}</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-[#F4F3EE]">
              {currentMonthForecast.projectedRainMm > 120
                ? (lang === 'es' ? 'Lluvia Frecuente y Abundante' : 'Heavy rain')
                : currentMonthForecast.projectedRainMm > 60
                ? (lang === 'es' ? 'Lluvia Moderada y Normal' : 'Moderate rain')
                : (lang === 'es' ? 'Lluvia Escasa o Poca' : 'Low rain')}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0C1912] border border-[#1E382A] space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#E09F3E]">
              <Thermometer className="w-4 h-4 text-[#E09F3E]" />
              <span>{lang === 'es' ? 'Ambiente y Calor' : 'Projected Temp'}</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-[#F4F3EE]">
              {currentMonthForecast.projectedTempC > 24
                ? (lang === 'es' ? 'Calor Fuerte / Templado' : 'Warm')
                : (lang === 'es' ? 'Clima Fresco y Agradable' : 'Cool & Fresh')}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-[#0C1912] border border-[#1E382A] space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#4ADE80]">
              <Activity className="w-4 h-4 text-[#4ADE80]" />
              <span>{lang === 'es' ? 'Humedad en la Tierra' : 'Root Moisture'}</span>
            </div>
            <div className="text-base sm:text-lg font-bold text-[#F4F3EE]">
              {currentMonthForecast.soilMoisturePct >= 50
                ? (lang === 'es' ? 'Tierra Bien Hidratada' : 'Well hydrated')
                : (lang === 'es' ? 'Tierra con Demanda de Agua' : 'Dry soil')}
            </div>
          </div>
        </div>

        {/* Plain language advice */}
        <div className="p-4 rounded-xl bg-[#0B1610] border border-[#214331] space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#4ADE80] font-bold">
            <Sparkles className="w-4 h-4" />
            <span>{lang === 'es' ? 'Recomendación Agrícola para este Mes' : 'Agricultural Recommendation'}</span>
          </div>
          <p className="text-xs sm:text-sm text-[#E2ECE5] leading-relaxed">
            {lang === 'es' ? currentMonthForecast.plainSummaryEs : currentMonthForecast.plainSummaryEn}
          </p>
        </div>
      </div>
    </div>
  );
};
