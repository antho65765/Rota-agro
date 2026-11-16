import React, { useMemo } from 'react';
import { Droplets, TrendingUp, ShieldCheck, Volume2 } from 'lucide-react';

interface IrrigationHistoryViewProps {
  lang: 'es' | 'en';
  baseGwet: number;
  farmName: string;
  onSpeak: (text: string, sourceId: string) => void;
  voiceActive: boolean;
  activeVoiceSource: string | null;
}

export const IrrigationHistoryView: React.FC<IrrigationHistoryViewProps> = ({
  lang,
  baseGwet,
  farmName,
  onSpeak,
  voiceActive,
  activeVoiceSource
}) => {
  const historyDays = useMemo(() => {
    const days = [];
    const now = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const variance = Math.sin(i * 0.4) * 0.08 + (Math.cos(i * 0.7) * 0.04);
      const val = Math.max(0.2, Math.min(0.9, baseGwet + variance));
      days.push({
        dayIndex: 30 - i,
        dateStr: d.toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US', { month: 'short', day: 'numeric' }),
        moisturePct: Math.round(val * 100),
        isOptimal: val >= 0.45
      });
    }
    return days;
  }, [baseGwet, lang]);

  const avgMoisture = Math.round(historyDays.reduce((acc, curr) => acc + curr.moisturePct, 0) / historyDays.length);
  const optimalDaysCount = historyDays.filter((d) => d.isOptimal).length;

  const audioText =
    lang === 'es'
      ? `Historial de humedad en la raíz de los últimos treinta días para ${farmName}. El promedio ha sido del ${avgMoisture} por ciento, con ${optimalDaysCount} días en nivel óptimo. Tus prácticas de ahorro de agua y cobertura vegetal están dando resultados excelentes a largo plazo.`
      : `Root zone soil moisture history over the past 30 days for ${farmName}. Average moisture is ${avgMoisture}%, with ${optimalDaysCount} optimal days. Your water conservation practices are succeeding.`;

  return (
    <div className="space-y-5 animate-fadeIn">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#122E1F] to-[#0A170F] border border-[#2B543D] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-lg">
        <div className="space-y-1.5 min-w-0">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#183827] text-[#4ADE80] font-mono-tabular text-xs font-semibold border border-[#2E6141]">
            <Droplets className="w-3.5 h-3.5 text-[#4ADE80]" />
            <span>{lang === 'es' ? 'HISTORIAL DE RIEGO · ÚLTIMOS 30 DÍAS' : 'IRRIGATION HISTORY · PAST 30 DAYS'}</span>
          </div>
          <h3 className="font-display text-lg sm:text-xl font-bold text-[#F4F3EE]">
            {lang === 'es' ? 'Seguimiento del Agua y Ahorro en tu Parcela' : 'Water Tracking & Savings on Your Field'}
          </h3>
          <p className="text-xs text-[#A7B8AD] leading-relaxed">
            {lang === 'es'
              ? 'Este gráfico muestra cómo se ha mantenido el agua en la raíz día a día. Te ayuda a comprobar si las zanjas, el acolchado y el riego medido están protegiendo la humedad.'
              : 'This chart shows daily root moisture to help you verify your water-saving practices.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => onSpeak(audioText, 'historial-riego')}
          className={`px-4 py-2.5 rounded-xl border font-mono-tabular text-xs font-bold transition-all cursor-pointer flex items-center gap-2 shrink-0 ${
            voiceActive && activeVoiceSource === 'historial-riego'
              ? 'bg-[#C85A32] border-[#C85A32] text-white shadow-md animate-pulse'
              : 'bg-[#183526] hover:bg-[#204431] border-[#38BDF8]/40 text-[#38BDF8]'
          }`}
        >
          <Volume2 className="w-4 h-4" />
          <span>
            {voiceActive && activeVoiceSource === 'historial-riego'
              ? lang === 'es'
                ? 'Detener Voz'
                : 'Stop Voice'
              : lang === 'es'
              ? 'Escuchar Resumen'
              : 'Listen Summary'}
          </span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="p-3.5 rounded-xl bg-[#0E1D15] border border-[#213F2F] space-y-1">
          <div className="text-[11px] font-mono-tabular text-[#8FA898]">
            {lang === 'es' ? 'HUMEDAD PROMEDIO (30 DÍAS)' : '30-DAY AVERAGE MOISTURE'}
          </div>
          <div className="text-xl font-bold font-mono-tabular text-[#4ADE80]">
            {avgMoisture}%
          </div>
          <div className="text-[11px] text-[#A7B8AD]">
            {avgMoisture >= 45 ? (lang === 'es' ? '✓ Nivel excelente y estable' : '✓ Excellent level') : (lang === 'es' ? '⚠ Requiere mayor retención' : '⚠ Needs retention')}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0E1D15] border border-[#213F2F] space-y-1">
          <div className="text-[11px] font-mono-tabular text-[#8FA898]">
            {lang === 'es' ? 'DÍAS CON AGUA ÓPTIMA' : 'OPTIMAL MOISTURE DAYS'}
          </div>
          <div className="text-xl font-bold font-mono-tabular text-[#38BDF8]">
            {optimalDaysCount} / 30 {lang === 'es' ? 'días' : 'days'}
          </div>
          <div className="text-[11px] text-[#A7B8AD]">
            {lang === 'es' ? 'Sin estrés hídrico severo' : 'No severe water stress'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#0E1D15] border border-[#213F2F] space-y-1">
          <div className="text-[11px] font-mono-tabular text-[#8FA898]">
            {lang === 'es' ? 'AHORRO ESTIMADO DE AGUA' : 'ESTIMATED WATER SAVED'}
          </div>
          <div className="text-xl font-bold font-mono-tabular text-[#E09F3E]">
            +28%
          </div>
          <div className="text-[11px] text-[#A7B8AD]">
            {lang === 'es' ? 'Gracias a cobertura de rastrojo' : 'Saved via mulch cover'}
          </div>
        </div>
      </div>

      {/* 30-Day Bar Chart View */}
      <div className="p-4 sm:p-5 rounded-2xl bg-[#0D1B13] border border-[#213F2F] space-y-4">
        <div className="flex items-center justify-between border-b border-[#1E382A] pb-3">
          <div className="font-bold text-xs sm:text-sm text-[#F4F3EE] flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-[#4ADE80]" />
            <span>{lang === 'es' ? 'Evolución diaria de la humedad en la raíz (30 días)' : '30-Day Daily Root Moisture Evolution'}</span>
          </div>
          <div className="text-[11px] font-mono-tabular text-[#8FA898]">
            {lang === 'es' ? 'Escala: 0% a 100%' : 'Scale: 0% to 100%'}
          </div>
        </div>

        {/* Bar Chart Grid */}
        <div className="pt-2 pb-1">
          <div className="h-56 sm:h-64 flex items-end gap-1 sm:gap-1.5 overflow-x-auto pb-2 no-scrollbar">
            {historyDays.map((d) => {
              const heightPct = Math.max(12, d.moisturePct);
              const barColor = d.moisturePct >= 45 ? 'bg-[#2E9E5B] hover:bg-[#38BDF8]' : 'bg-[#C85A32] hover:bg-[#E09F3E]';
              return (
                <div key={d.dayIndex} className="flex-1 min-w-[22px] flex flex-col items-center h-full justify-end group relative">
                  <div className="absolute -top-10 bg-[#0B1610] border border-[#385E48] text-[#F4F3EE] text-[10px] font-mono-tabular px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-20 shadow-lg">
                    {d.dateStr}: {d.moisturePct}%
                  </div>

                  <div
                    style={{ height: `${heightPct}%` }}
                    className={`w-full rounded-t transition-all ${barColor} shadow-sm`}
                  />
                  <div className="text-[9px] font-mono-tabular text-[#8FA898] mt-1.5 truncate">
                    {d.dayIndex % 5 === 0 ? d.dateStr.split(' ')[0] : ''}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Legend & Advice */}
        <div className="pt-3 border-t border-[#1C3827] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-[#A7B8AD]">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#2E9E5B]" />
              <span>{lang === 'es' ? 'Humedad Óptima (>45%)' : 'Optimal Moisture'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-[#C85A32]" />
              <span>{lang === 'es' ? 'Atención / Seco (<45%)' : 'Low Moisture'}</span>
            </div>
          </div>

          <div className="text-[11px] font-mono-tabular text-[#4ADE80] flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span>
              {lang === 'es'
                ? 'Resultado a largo plazo: Menor dependencia de riego artificial.'
                : 'Long-term benefit: Reduced need for manual irrigation.'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
