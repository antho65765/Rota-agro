import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine
} from 'recharts';
import { Droplets, ShieldCheck, AlertTriangle, Satellite, Sparkles } from 'lucide-react';

export interface NasaRootMoistureProjectionDay {
  day: number;
  dateLabel: string;
  dailyRainMm: number;
  dailyEt0Mm: number;
  dailyDeficitMm: number;
  cumulativeDeficitMm: number;
  rotationMoisturePct: number;
  monocultureMoisturePct: number;
  wiltingPointPct: number;
  stressThresholdPct: number;
  fieldCapacityPct: number;
  isDeficitActive: boolean;
}

export interface RootMoistureChartProps {
  lang: 'es' | 'en';
  rotationName: string;
  rotationRetentionBonus: number;
  rotationKc: number;
  baseGwetroot: number;
  baseRainMmDay: number;
  dailyEt0Mm: number;
  isDroughtCrisis: boolean;
  locationName: string;
}

export const RootMoistureChart: React.FC<RootMoistureChartProps> = ({
  lang,
  rotationName,
  rotationRetentionBonus,
  rotationKc,
  baseGwetroot,
  baseRainMmDay,
  dailyEt0Mm,
  isDroughtCrisis,
  locationName
}) => {
  const data = useMemo<NasaRootMoistureProjectionDay[]>(() => {
    const rainMultipliers = [
      1.4, 1.8, 0.5, 0.0, 0.0, 0.1, 0.8, 2.0, 1.5, 0.2, 0.0, 0.1, 0.2, 1.2
    ];

    const effectiveBaseRain = isDroughtCrisis ? baseRainMmDay * 0.6 : baseRainMmDay;
    const initialMoisture = Math.min(0.92, Math.max(0.18, baseGwetroot * (isDroughtCrisis ? 0.78 : 1.0)));

    let currentRotMoisture = initialMoisture;
    let currentMonoMoisture = initialMoisture;
    let runningDeficitMm = 0;

    const wiltingPoint = 30;
    const stressThreshold = 45;
    const fieldCapacity = 75;

    const result: NasaRootMoistureProjectionDay[] = [];

    for (let i = 0; i < 14; i++) {
      const dayNum = i + 1;
      const mult = rainMultipliers[i];
      const dailyRain = Number((effectiveBaseRain * mult).toFixed(1));

      const cropWaterDemandMm = rotationKc * dailyEt0Mm;
      const monoWaterDemandMm = 1.15 * dailyEt0Mm;

      const dailyDeficitMm = Number((dailyRain - cropWaterDemandMm).toFixed(1));
      runningDeficitMm += dailyDeficitMm;

      const coverInfiltrationEff = 0.82 + rotationRetentionBonus * 0.18;
      const monoInfiltrationEff = 0.58;

      const rotInfiltrationMm = dailyRain * coverInfiltrationEff;
      const monoInfiltrationMm = dailyRain * monoInfiltrationEff;

      const rotEtActualMm = Math.min(
        cropWaterDemandMm,
        currentRotMoisture * 120 * 0.08 + rotInfiltrationMm
      );
      const monoEtActualMm = Math.min(
        monoWaterDemandMm,
        currentMonoMoisture * 120 * 0.11 + monoInfiltrationMm
      );

      const deltaRot = (rotInfiltrationMm - rotEtActualMm) / 120;
      const deltaMono = (monoInfiltrationMm - monoEtActualMm) / 120;

      currentRotMoisture = Math.max(0.20, Math.min(0.88, currentRotMoisture + deltaRot));
      currentMonoMoisture = Math.max(0.18, Math.min(0.86, currentMonoMoisture + deltaMono));

      const rotPct = Number((currentRotMoisture * 100).toFixed(1));
      const monoPct = Number((currentMonoMoisture * 100).toFixed(1));

      const monthName = lang === 'es' ? 'Día' : 'Day';

      result.push({
        day: dayNum,
        dateLabel: `${monthName} ${dayNum}`,
        dailyRainMm: dailyRain,
        dailyEt0Mm: Number(dailyEt0Mm.toFixed(1)),
        dailyDeficitMm,
        cumulativeDeficitMm: Number(runningDeficitMm.toFixed(1)),
        rotationMoisturePct: rotPct,
        monocultureMoisturePct: monoPct,
        wiltingPointPct: wiltingPoint,
        stressThresholdPct: stressThreshold,
        fieldCapacityPct: fieldCapacity,
        isDeficitActive: rotPct < stressThreshold || dailyDeficitMm < -1.0
      });
    }

    return result;
  }, [
    lang,
    rotationRetentionBonus,
    rotationKc,
    baseGwetroot,
    baseRainMmDay,
    dailyEt0Mm,
    isDroughtCrisis
  ]);

  const endRotPct = data[data.length - 1]?.rotationMoisturePct ?? 50;
  const endMonoPct = data[data.length - 1]?.monocultureMoisturePct ?? 35;

  return (
    <div className="bg-[#12231A] border border-[#243E2F] rounded-2xl p-4 sm:p-6 space-y-6 shadow-xl">
      {/* Chart Header */}
      <div className="flex flex-col gap-3 border-b border-[#1E3528] pb-4">
        <div className="flex flex-wrap items-center gap-2 text-xs font-mono-tabular text-[#38BDF8]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#102B3F] text-[#38BDF8] border border-[#38BDF8]/40 font-semibold">
            <Satellite className="w-3.5 h-3.5" />
            <span>{lang === 'es' ? 'Pronóstico de Humedad en la Raíz' : 'Satellite Soil Forecast'}</span>
          </span>
          <span className="text-[#8FA898]">· {lang === 'es' ? 'Próximos 14 Días' : 'Next 14 Days'}</span>
        </div>

        <h3 className="text-lg sm:text-xl font-bold text-[#F4F3EE] flex items-center gap-2">
          <Droplets className="w-5 h-5 text-[#38BDF8]" />
          <span>
            {lang === 'es'
              ? `Cómo se Mantendrá el Agua en la Raíz en 14 Días`
              : `14-Day Root Moisture Projection`}
          </span>
        </h3>

        <p className="text-xs sm:text-sm text-[#A7B8AD] max-w-3xl leading-relaxed">
          {lang === 'es'
            ? `Compara cómo se conserva la humedad en tu tierra con la siembra "${rotationName}" frente a tener la tierra sin protección. Así sabrás si tus plantas beberán suficiente agua.`
            : `Tracks daily soil moisture retention comparing protected rotation with bare soil.`}
        </p>

        {/* Qualitative Status Pills (No Numbers) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          <div className="p-3.5 rounded-xl bg-[#0B1610] border border-[#4ADE80]/40 flex items-center justify-between">
            <span className="text-xs text-[#8FA898]">
              {lang === 'es' ? 'Tu forma de sembrar (Día 14):' : 'Your rotation (Day 14):'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#4ADE80]">
              {endRotPct >= 50 ? (lang === 'es' ? 'Humedad Muy Buena y Segura' : 'Great Moisture') : (lang === 'es' ? 'Humedad Adecuada' : 'Good Moisture')}
            </span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#0B1610] border border-[#F87171]/40 flex items-center justify-between">
            <span className="text-xs text-[#8FA898]">
              {lang === 'es' ? 'Tierra descubierta (Día 14):' : 'Bare soil (Day 14):'}
            </span>
            <span className="text-xs sm:text-sm font-bold text-[#F87171]">
              {endMonoPct <= 40 ? (lang === 'es' ? 'Riesgo de Resecarse y Sed' : 'Drought Risk') : (lang === 'es' ? 'Humedad Baja' : 'Low Moisture')}
            </span>
          </div>
        </div>
      </div>

      {/* Simplified Legend */}
      <div className="flex flex-wrap items-center justify-center gap-4 text-xs font-mono-tabular bg-[#0A150F] p-3 rounded-xl border border-[#1A3728]">
        <span className="flex items-center gap-2 text-[#4ADE80] font-semibold">
          <span className="w-3.5 h-1.5 bg-[#4ADE80] rounded inline-block" />
          <span>{lang === 'es' ? `Tu siembra (${rotationName})` : rotationName}</span>
        </span>
        <span className="flex items-center gap-2 text-[#F87171] font-semibold">
          <span className="w-3.5 h-0.5 border-t-2 border-dashed border-[#F87171] inline-block" />
          <span>{lang === 'es' ? 'Tierra descubierta' : 'Bare soil'}</span>
        </span>
        <span className="flex items-center gap-2 text-[#38BDF8] font-semibold">
          <span className="w-3.5 h-1.5 bg-[#38BDF8] rounded inline-block" />
          <span>{lang === 'es' ? 'Lluvia esperada' : 'Expected rain'}</span>
        </span>
      </div>

      {/* Responsive Tall Chart Container for Mobile */}
      <div className="w-full h-96 sm:h-[400px] bg-[#0B1610] rounded-2xl p-3 sm:p-5 border border-[#1E3528] shadow-inner">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 15, right: 10, left: -18, bottom: 5 }}
          >
            <defs>
              <linearGradient id="rotMoistGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#4ADE80" stopOpacity={0.4} />
                <stop offset="95%" stopColor="#4ADE80" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="rainAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.45} />
                <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.05} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#1A3324" vertical={false} />

            <XAxis
              dataKey="dateLabel"
              stroke="#6E8577"
              tick={{ fill: '#8FA898', fontSize: 11, fontFamily: 'monospace' }}
              tickLine={{ stroke: '#2A4735' }}
              dy={6}
            />

            <YAxis
              yAxisId="left"
              domain={[15, 95]}
              stroke="#6E8577"
              tick={{ fill: '#8FA898', fontSize: 11, fontFamily: 'monospace' }}
              tickLine={{ stroke: '#2A4735' }}
              tickFormatter={(val) => (val > 60 ? 'Húmedo' : val > 40 ? 'Regular' : 'Seco')}
            />

            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 15]}
              stroke="#38BDF8"
              tick={{ fill: '#38BDF8', fontSize: 10, fontFamily: 'monospace' }}
              tickLine={{ stroke: '#1B384B' }}
              tickFormatter={(val) => (val > 8 ? 'Mucha Lluvia' : val > 3 ? 'Lluvia' : 'Poca')}
            />

            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload || !payload.length) return null;
                const d = payload[0]?.payload as NasaRootMoistureProjectionDay;
                if (!d) return null;

                const isGoodMoist = d.rotationMoisturePct >= 45;

                return (
                  <div className="bg-[#0E1D15] border border-[#2B4F3A] rounded-xl p-3.5 shadow-2xl text-xs font-mono-tabular space-y-2 max-w-[280px]">
                    <div className="flex items-center justify-between border-b border-[#1E3528] pb-1.5 font-bold text-[#F4F3EE]">
                      <span>{label}</span>
                      <span className={isGoodMoist ? 'text-[#4ADE80]' : 'text-[#E09F3E]'}>
                        {isGoodMoist ? (lang === 'es' ? '● Tierra Húmeda' : '● Hydrated') : (lang === 'es' ? '▲ Cuidado Seco' : '▲ Dry Risk')}
                      </span>
                    </div>

                    <div className="space-y-1.5 pt-0.5">
                      <div className="flex justify-between text-[#4ADE80]">
                        <span>{lang === 'es' ? 'Humedad con tu siembra:' : 'Rotation moisture:'}</span>
                        <span className="font-bold">
                          {d.rotationMoisturePct >= 50 ? (lang === 'es' ? 'Muy Buena' : 'High') : (lang === 'es' ? 'Adecuada' : 'Good')}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#F87171]">
                        <span>{lang === 'es' ? 'Humedad sin cobertura:' : 'Bare soil moisture:'}</span>
                        <span className="font-bold">
                          {d.monocultureMoisturePct <= 40 ? (lang === 'es' ? 'Baja / Seca' : 'Low') : (lang === 'es' ? 'Regular' : 'Fair')}
                        </span>
                      </div>
                      <div className="flex justify-between text-[#38BDF8] pt-1 border-t border-[#1E3528]">
                        <span>{lang === 'es' ? 'Condición de lluvia:' : 'Rainfall condition:'}</span>
                        <span>
                          {d.dailyRainMm > 5 ? (lang === 'es' ? 'Lluvia Frecuente' : 'Rain') : (lang === 'es' ? 'Sol / Sin Lluvia' : 'Dry')}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              }}
            />

            {/* Threshold Line for Stress */}
            <ReferenceLine
              yAxisId="left"
              y={45}
              stroke="#E09F3E"
              strokeDasharray="4 4"
              strokeWidth={1.5}
            />

            <Area
              yAxisId="right"
              type="monotone"
              dataKey="dailyRainMm"
              fill="url(#rainAreaGrad)"
              stroke="#38BDF8"
              strokeWidth={1}
              isAnimationActive={false}
            />

            <Area
              yAxisId="left"
              type="monotone"
              dataKey="rotationMoisturePct"
              fill="url(#rotMoistGrad)"
              stroke="#4ADE80"
              strokeWidth={3}
              dot={{ r: 4, fill: '#4ADE80', stroke: '#0B1610', strokeWidth: 2 }}
              activeDot={{ r: 6, fill: '#4ADE80', stroke: '#F4F3EE', strokeWidth: 2 }}
              isAnimationActive={false}
            />

            <Line
              yAxisId="left"
              type="monotone"
              dataKey="monocultureMoisturePct"
              stroke="#F87171"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: '#F87171', stroke: '#0B1610', strokeWidth: 1 }}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Farmer Guidance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="p-4 rounded-xl bg-[#0B1610] border border-[#1E3528] space-y-2">
          <div className="flex items-center gap-2 font-mono-tabular font-bold text-[#4ADE80]">
            <ShieldCheck className="w-4 h-4 text-[#4ADE80] shrink-0" />
            <span>{lang === 'es' ? 'BENEFICIO DE TU ROTACIÓN' : 'ROTATION BENEFIT'}</span>
          </div>
          <p className="text-[#A7B8AD] leading-relaxed">
            {lang === 'es'
              ? 'Las raíces asociadas y el rastrojo actúan como una esponja que retiene el agua por más tiempo, asegurando que tus plantas no sufran sed en las semanas secas.'
              : 'Living cover acts like a sponge, holding moisture much longer.'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-[#0B1610] border border-[#1E3528] space-y-2">
          <div className="flex items-center gap-2 font-mono-tabular font-bold text-[#38BDF8]">
            <Sparkles className="w-4 h-4 text-[#38BDF8] shrink-0" />
            <span>{lang === 'es' ? 'CONSEJO PRÁCTICO' : 'PRACTICAL ADVICE'}</span>
          </div>
          <p className="text-[#A7B8AD] leading-relaxed">
            {lang === 'es'
              ? 'Mantén siempre una capa de hojarasca o residuos vegetales sobre la tierra para evitar que el sol directo evapore el agua del suelo.'
              : 'Keep a mulch layer on top of soil to prevent direct sun evaporation.'}
          </p>
        </div>
      </div>
    </div>
  );
};
