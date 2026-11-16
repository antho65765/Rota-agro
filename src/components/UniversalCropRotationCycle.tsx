import React, { useEffect, useMemo, useState } from 'react';
import {
  RefreshCw,
  Droplets,
  Layers,
  ShieldCheck,
  Volume2,
  VolumeX,
  ArrowRight,
  Thermometer,
  Compass,
  PlusCircle,
  CheckCircle2
} from 'lucide-react';

export type ClimateZoneKey = 'fria' | 'templada' | 'calida-seca' | 'calida-humeda';
export type SoilConditionKey = 'equilibrado' | 'cansado' | 'sequia' | 'plagas';
export type FunctionalGroupKey = 'leguminosa' | 'hoja-cereal' | 'fruto' | 'raiz-tuberculo';

export interface UniversalRotationParcelContext {
  id: string;
  name: string;
  country: string;
  altitudeM: number;
  t2mC: number;
  prectotMmDay: number;
  gwetroot: number;
}

interface UniversalCropRotationCycleProps {
  lang: 'es' | 'en';
  parcel: UniversalRotationParcelContext;
  onSpeak: (text: string, sourceId: string) => void;
  stopSpeak: () => void;
  voiceActive: boolean;
  activeVoiceSource: string | null;
}

interface CropPreset {
  id: string;
  nameEs: string;
  nameEn: string;
  group: FunctionalGroupKey;
  botanicalFamilyEs: string;
  botanicalFamilyEn: string;
  climates: ClimateZoneKey[];
  droughtTolerant: boolean;
  kcApprox: number;
  cycleDays: string;
}

interface GroupDefinition {
  key: FunctionalGroupKey;
  stepNumber: number;
  titleEs: string;
  titleEn: string;
  roleEs: string;
  roleEn: string;
  soilActionEs: string;
  soilActionEn: string;
  nutrientEs: string;
  nutrientEn: string;
  accentHex: string;
  softBg: string;
  coverCompanionEs: string;
  coverCompanionEn: string;
}

const FUNCTIONAL_GROUPS: GroupDefinition[] = [
  {
    key: 'leguminosa',
    stepNumber: 1,
    titleEs: 'Leguminosas',
    titleEn: 'Legumes',
    roleEs: 'Aportan nitrógeno natural al suelo',
    roleEn: 'Fix natural nitrogen into the soil',
    soilActionEs:
      'Sus raíces atrapan nitrógeno del aire mediante nódulos y despiertan la fertilidad sin comprar tanto abono químico.',
    soilActionEn:
      'Roots capture nitrogen from air via natural nodules, rebuilding fertility before hungry crops.',
    nutrientEs: 'Regala abono natural a la tierra',
    nutrientEn: 'Feeds natural nitrogen to soil',
    accentHex: '#4ADE80',
    softBg: 'bg-[#10261A]',
    coverCompanionEs: 'Deja raíces enterradas y rastrojo picado encima',
    coverCompanionEn: 'Leave roots in soil and spread cut residue as mulch'
  },
  {
    key: 'hoja-cereal',
    stepNumber: 2,
    titleEs: 'Hojas y Cereales',
    titleEn: 'Leafy & Cereal Crops',
    roleEs: 'Aprovechan el nitrógeno para dar grano y follaje',
    roleEn: 'Use stored nitrogen for strong leaves and grain',
    soilActionEs:
      'Consumen el nitrógeno dejado por la leguminosa anterior para crecer vigorosos con tallos firmes y buena espiga o mazorca.',
    soilActionEn:
      'Feed heavily on nitrogen left by legumes to build vigorous stalks, leaves, and grain fill.',
    nutrientEs: 'Necesita buena fuerza y abono en la tierra',
    nutrientEn: 'High fertility demand',
    accentHex: '#38BDF8',
    softBg: 'bg-[#0F2029]',
    coverCompanionEs: 'Asocia con cobertura rastrera o paja entre surcos',
    coverCompanionEn: 'Intercrop low ground cover or mulch between rows'
  },
  {
    key: 'fruto',
    stepNumber: 3,
    titleEs: 'Frutos y Flores',
    titleEn: 'Fruiting Crops',
    roleEs: 'Piden abono para flor y fruto; cortan plagas de hoja',
    roleEn: 'Need bloom nutrients; break leaf-pest cycles',
    soilActionEs:
      'Toman nutrientes distintos de la capa media del suelo y rompen el ciclo de gusanos y hongos propios de cereales o repollos.',
    soilActionEn:
      'Draw mid-depth phosphorus and potassium while breaking cereal and leafy-crop pest cycles.',
    nutrientEs: 'Agradece ceniza o compost al florecer',
    nutrientEn: 'Benefits from ash or compost at bloom',
    accentHex: '#E09F3E',
    softBg: 'bg-[#241D11]',
    coverCompanionEs: 'Aplica ceniza de leña tamizada o compost maduro',
    coverCompanionEn: 'Apply sifted wood ash or cured compost at flowering'
  },
  {
    key: 'raiz-tuberculo',
    stepNumber: 4,
    titleEs: 'Raíces, Tubérculos y Bulbos',
    titleEn: 'Roots, Tubers & Bulbs',
    roleEs: 'Sueltan y airean la tierra antes de reiniciar',
    roleEn: 'Loosen compacted soil before restarting cycle',
    soilActionEs:
      'Sus raíces profundas descompactan la tierra, aprovechan los nutrientes sobrantes y preparan un lote limpio para volver a Leguminosas.',
    soilActionEn:
      'Deep roots break soil compaction, scavenge remaining nutrients, and clean the bed for Legumes.',
    nutrientEs: 'Aprovecha sobrantes · Airea el suelo',
    nutrientEn: 'Scavenges leftovers · Aerates soil',
    accentHex: '#C084FC',
    softBg: 'bg-[#1D1628]',
    coverCompanionEs: 'Cierra con 30–45 días de abono verde si está cansado',
    coverCompanionEn: 'Follow with 30–45 days green manure if soil is tired'
  }
];

const CROP_PRESETS: CropPreset[] = [
  // LEGUMINOSAS
  {
    id: 'frijol-comun',
    nameEs: 'Frijol / Caraota / Poroto',
    nameEn: 'Common Bean',
    group: 'leguminosa',
    botanicalFamilyEs: 'Fabáceas',
    botanicalFamilyEn: 'Fabaceae',
    climates: ['templada', 'calida-humeda'],
    droughtTolerant: false,
    kcApprox: 0.75,
    cycleDays: '85–105 d'
  },
  {
    id: 'frijol-caupi',
    nameEs: 'Frijol Caupí / Guandul (Rústico)',
    nameEn: 'Cowpea / Pigeon Pea',
    group: 'leguminosa',
    botanicalFamilyEs: 'Fabáceas',
    botanicalFamilyEn: 'Fabaceae',
    climates: ['calida-seca', 'calida-humeda', 'templada'],
    droughtTolerant: true,
    kcApprox: 0.68,
    cycleDays: '75–110 d'
  },
  {
    id: 'haba-tarwi',
    nameEs: 'Haba / Arveja / Tarwi (Chocho)',
    nameEn: 'Faba Bean / Pea / Tarwi',
    group: 'leguminosa',
    botanicalFamilyEs: 'Fabáceas',
    botanicalFamilyEn: 'Fabaceae',
    climates: ['fria', 'templada'],
    droughtTolerant: true,
    kcApprox: 0.72,
    cycleDays: '120–150 d'
  },
  {
    id: 'mucuna-canavalia',
    nameEs: 'Mucuna / Canavalia (Abono Verde)',
    nameEn: 'Mucuna / Jack Bean (Green Manure)',
    group: 'leguminosa',
    botanicalFamilyEs: 'Fabáceas',
    botanicalFamilyEn: 'Fabaceae',
    climates: ['templada', 'calida-seca', 'calida-humeda'],
    droughtTolerant: true,
    kcApprox: 0.65,
    cycleDays: '60–90 d'
  },
  // HOJAS Y CEREALES
  {
    id: 'maiz-criollo',
    nameEs: 'Maíz Criollo',
    nameEn: 'Creole Maize',
    group: 'hoja-cereal',
    botanicalFamilyEs: 'Gramíneas (Poáceas)',
    botanicalFamilyEn: 'Poaceae',
    climates: ['templada', 'calida-humeda', 'fria'],
    droughtTolerant: false,
    kcApprox: 0.92,
    cycleDays: '110–145 d'
  },
  {
    id: 'sorgo-mijo',
    nameEs: 'Sorgo / Mijo (Resistente a Sequía)',
    nameEn: 'Sorghum / Millet (Drought Hardy)',
    group: 'hoja-cereal',
    botanicalFamilyEs: 'Gramíneas (Poáceas)',
    botanicalFamilyEn: 'Poaceae',
    climates: ['calida-seca', 'templada'],
    droughtTolerant: true,
    kcApprox: 0.72,
    cycleDays: '95–115 d'
  },
  {
    id: 'quinoa-avena',
    nameEs: 'Quinoa / Avena / Cebada',
    nameEn: 'Quinoa / Oats / Barley',
    group: 'hoja-cereal',
    botanicalFamilyEs: 'Amarantáceas / Poáceas',
    botanicalFamilyEn: 'Amaranthaceae / Poaceae',
    climates: ['fria', 'templada'],
    droughtTolerant: true,
    kcApprox: 0.68,
    cycleDays: '120–155 d'
  },
  {
    id: 'repollo-acelga',
    nameEs: 'Repollo / Acelga / Lechuga',
    nameEn: 'Cabbage / Chard / Lettuce',
    group: 'hoja-cereal',
    botanicalFamilyEs: 'Brasicáceas / Asteráceas',
    botanicalFamilyEn: 'Brassicaceae / Asteraceae',
    climates: ['fria', 'templada'],
    droughtTolerant: false,
    kcApprox: 0.82,
    cycleDays: '65–95 d'
  },
  {
    id: 'arroz-secano',
    nameEs: 'Arroz de Secano / Pasto de Corte',
    nameEn: 'Upland Rice / Forage Grass',
    group: 'hoja-cereal',
    botanicalFamilyEs: 'Gramíneas (Poáceas)',
    botanicalFamilyEn: 'Poaceae',
    climates: ['calida-humeda'],
    droughtTolerant: false,
    kcApprox: 1.05,
    cycleDays: '110–130 d'
  },
  // FRUTOS Y FLORES
  {
    id: 'calabaza-ahuyama',
    nameEs: 'Calabaza / Ahuyama / Zapallo',
    nameEn: 'Squash / Pumpkin',
    group: 'fruto',
    botanicalFamilyEs: 'Cucurbitáceas',
    botanicalFamilyEn: 'Cucurbitaceae',
    climates: ['templada', 'calida-seca', 'calida-humeda', 'fria'],
    droughtTolerant: true,
    kcApprox: 0.76,
    cycleDays: '90–120 d'
  },
  {
    id: 'tomate-pimenton',
    nameEs: 'Tomate / Ají / Pimentón',
    nameEn: 'Tomato / Chili / Bell Pepper',
    group: 'fruto',
    botanicalFamilyEs: 'Solanáceas',
    botanicalFamilyEn: 'Solanaceae',
    climates: ['templada', 'calida-humeda', 'calida-seca'],
    droughtTolerant: false,
    kcApprox: 0.94,
    cycleDays: '85–115 d'
  },
  {
    id: 'sandia-melon-pepino',
    nameEs: 'Patilla (Sandía) / Melón / Pepino',
    nameEn: 'Watermelon / Melon / Cucumber',
    group: 'fruto',
    botanicalFamilyEs: 'Cucurbitáceas',
    botanicalFamilyEn: 'Cucurbitaceae',
    climates: ['calida-seca', 'calida-humeda'],
    droughtTolerant: true,
    kcApprox: 0.78,
    cycleDays: '75–95 d'
  },
  {
    id: 'tomate-arbol-uchuva',
    nameEs: 'Uchuva / Tomate de Árbol / Arándano',
    nameEn: 'Cape Gooseberry / Andean Berry',
    group: 'fruto',
    botanicalFamilyEs: 'Solanáceas / Ericáceas',
    botanicalFamilyEn: 'Solanaceae / Ericaceae',
    climates: ['fria'],
    droughtTolerant: false,
    kcApprox: 0.80,
    cycleDays: '130–180 d'
  },
  // RAÍCES, TUBÉRCULOS Y BULBOS
  {
    id: 'papa-nativa',
    nameEs: 'Papa / Patata Nativa',
    nameEn: 'Native Potato',
    group: 'raiz-tuberculo',
    botanicalFamilyEs: 'Solanáceas',
    botanicalFamilyEn: 'Solanaceae',
    climates: ['fria', 'templada'],
    droughtTolerant: false,
    kcApprox: 0.86,
    cycleDays: '115–150 d'
  },
  {
    id: 'yuca-camote',
    nameEs: 'Yuca / Camote (Batata) / Ñame',
    nameEn: 'Cassava / Sweet Potato / Yam',
    group: 'raiz-tuberculo',
    botanicalFamilyEs: 'Euforbiáceas / Convolvuláceas',
    botanicalFamilyEn: 'Euphorbiaceae / Convolvulaceae',
    climates: ['calida-seca', 'calida-humeda', 'templada'],
    droughtTolerant: true,
    kcApprox: 0.68,
    cycleDays: '120–240 d'
  },
  {
    id: 'zanahoria-remolacha',
    nameEs: 'Zanahoria / Remolacha / Rábano',
    nameEn: 'Carrot / Beetroot / Radish',
    group: 'raiz-tuberculo',
    botanicalFamilyEs: 'Apiáceas / Amarantáceas',
    botanicalFamilyEn: 'Apiaceae / Amaranthaceae',
    climates: ['fria', 'templada'],
    droughtTolerant: false,
    kcApprox: 0.82,
    cycleDays: '75–105 d'
  },
  {
    id: 'cebolla-ajo',
    nameEs: 'Cebolla / Ajo (Limpiador de Suelo)',
    nameEn: 'Onion / Garlic (Pest-Cleanser)',
    group: 'raiz-tuberculo',
    botanicalFamilyEs: 'Aliáceas',
    botanicalFamilyEn: 'Amaryllidaceae',
    climates: ['fria', 'templada', 'calida-seca'],
    droughtTolerant: true,
    kcApprox: 0.72,
    cycleDays: '95–130 d'
  }
];

function detectClimateFromParcel(parcel: UniversalRotationParcelContext): ClimateZoneKey {
  if (parcel.altitudeM >= 2000 || parcel.t2mC < 15.5) return 'fria';
  if (parcel.altitudeM >= 1000 || parcel.t2mC < 22) return 'templada';
  if (parcel.prectotMmDay < 2.8 || parcel.gwetroot < 0.48) return 'calida-seca';
  return 'calida-humeda';
}

function getClimateLabel(key: ClimateZoneKey, lang: 'es' | 'en'): string {
  const map: Record<ClimateZoneKey, { es: string; en: string }> = {
    fria: { es: 'Tierra Fría / Páramo (>2,000 m)', en: 'Highland Cool (>2,000 m)' },
    templada: { es: 'Clima Templado (1,000–2,000 m)', en: 'Temperate Mid-Elevation' },
    'calida-seca': { es: 'Cálido Seco (Poca Lluvia)', en: 'Warm Dryland' },
    'calida-humeda': { es: 'Cálido Húmedo (Trópico)', en: 'Warm Humid Tropics' }
  };
  return lang === 'es' ? map[key].es : map[key].en;
}

const STORAGE_KEY = 'rota_agro_universal_cycle_v1';

export const UniversalCropRotationCycle: React.FC<UniversalCropRotationCycleProps> = ({
  lang,
  parcel,
  onSpeak,
  stopSpeak,
  voiceActive,
  activeVoiceSource
}) => {
  const detectedClimate = useMemo(() => detectClimateFromParcel(parcel), [parcel]);

  const [climateMode, setClimateMode] = useState<'auto' | ClimateZoneKey>('auto');
  const [selectedStartCropId, setSelectedStartCropId] = useState<string>('maiz-criollo');
  const [customCropName, setCustomCropName] = useState<string>('');
  const [customCropGroup, setCustomCropGroup] = useState<FunctionalGroupKey>('hoja-cereal');
  const [useCustomCrop, setUseCustomCrop] = useState<boolean>(false);
  const [soilCondition, setSoilCondition] = useState<SoilConditionKey>('equilibrado');
  const [lotCount, setLotCount] = useState<3 | 4>(4);
  const [activeCycleStep, setActiveCycleStep] = useState<number>(0); // 0..3

  // Load saved farmer adaptation settings on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.climateMode) setClimateMode(parsed.climateMode);
        if (parsed.selectedStartCropId) setSelectedStartCropId(parsed.selectedStartCropId);
        if (typeof parsed.customCropName === 'string') setCustomCropName(parsed.customCropName);
        if (parsed.customCropGroup) setCustomCropGroup(parsed.customCropGroup);
        if (typeof parsed.useCustomCrop === 'boolean') setUseCustomCrop(parsed.useCustomCrop);
        if (parsed.soilCondition) setSoilCondition(parsed.soilCondition);
        if (parsed.lotCount === 3 || parsed.lotCount === 4) setLotCount(parsed.lotCount);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  // Persist farmer adaptation choices locally (works 100% offline)
  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          climateMode,
          selectedStartCropId,
          customCropName,
          customCropGroup,
          useCustomCrop,
          soilCondition,
          lotCount
        })
      );
    } catch {
      // Ignore storage errors
    }
  }, [
    climateMode,
    selectedStartCropId,
    customCropName,
    customCropGroup,
    useCustomCrop,
    soilCondition,
    lotCount
  ]);

  const effectiveClimate: ClimateZoneKey =
    climateMode === 'auto' ? detectedClimate : climateMode;

  const startingPreset = useMemo(
    () => CROP_PRESETS.find((c) => c.id === selectedStartCropId) || CROP_PRESETS[4],
    [selectedStartCropId]
  );

  const startingGroupKey: FunctionalGroupKey = useCustomCrop
    ? customCropGroup
    : startingPreset.group;

  // Auto-suggest condition hint from NASA soil/rain data
  const nasaSuggestedCondition: SoilConditionKey = useMemo(() => {
    if (parcel.gwetroot < 0.42 || parcel.prectotMmDay < 2.1) return 'sequia';
    if (parcel.t2mC > 26 && parcel.prectotMmDay > 4.5) return 'plagas';
    return 'equilibrado';
  }, [parcel.gwetroot, parcel.prectotMmDay, parcel.t2mC]);

  // Order the 4 universal phases starting from the farmer's chosen group!
  const orderedGroups = useMemo(() => {
    const startIdx = FUNCTIONAL_GROUPS.findIndex((g) => g.key === startingGroupKey);
    const idx = startIdx >= 0 ? startIdx : 0;
    return [0, 1, 2, 3].map((offset) => FUNCTIONAL_GROUPS[(idx + offset) % 4]);
  }, [startingGroupKey]);

  // Select the best adapted concrete crop for each group based on climate + soilCondition + botanical anti-repeat safety
  const adaptedSequence = useMemo(() => {
    let previousFamily = '';

    return orderedGroups.map((group, stageIdx) => {
      // If stage 0 and farmer chose a specific or custom crop, keep that exact crop as stage 0!
      if (stageIdx === 0) {
        if (useCustomCrop && customCropName.trim().length > 0) {
          previousFamily = 'Personalizado';
          return {
            group,
            cropNameEs: customCropName.trim(),
            cropNameEn: customCropName.trim(),
            familyEs: 'Cultivo propio del campesino',
            familyEn: 'Farmer custom crop',
            cycleDays: 'Ciclo local',
            kcApprox: 0.78,
            droughtNoteEs:
              soilCondition === 'sequia'
                ? 'Acompaña con acolchado de paja desde el primer día.'
                : 'Punto de partida elegido por ti.',
            droughtNoteEn:
              soilCondition === 'sequia'
                ? 'Apply straw mulch from day one.'
                : 'Your chosen starting crop.'
          };
        }
        previousFamily = startingPreset.botanicalFamilyEs;
        return {
          group,
          cropNameEs: startingPreset.nameEs,
          cropNameEn: startingPreset.nameEn,
          familyEs: startingPreset.botanicalFamilyEs,
          familyEn: startingPreset.botanicalFamilyEn,
          cycleDays: startingPreset.cycleDays,
          kcApprox: startingPreset.kcApprox,
          droughtNoteEs:
            soilCondition === 'sequia' && !startingPreset.droughtTolerant
              ? 'Este cultivo pide agua: riega en la raíz y cubre surcos con rastrojo.'
              : 'Punto de partida elegido en tu parcela.',
          droughtNoteEn:
            soilCondition === 'sequia' && !startingPreset.droughtTolerant
              ? 'Needs moisture protection: drip/root water and mulch rows.'
              : 'Chosen starting crop on your parcel.'
        };
      }

      const candidates = CROP_PRESETS.filter((c) => c.group === group.key);
      const scored = candidates.map((c) => {
        let score = 0;
        if (c.climates.includes(effectiveClimate)) score += 40;
        if (soilCondition === 'sequia' && c.droughtTolerant) score += 35;
        if (soilCondition === 'cansado' && c.id === 'mucuna-canavalia') score += 30;
        if (soilCondition === 'plagas' && c.id === 'cebolla-ajo') score += 30;
        // CRITICAL AGRONOMIC SAFETY: avoid consecutive Solanaceae (e.g. Tomato -> Potato)!
        if (
          previousFamily.includes('Solanáceas') &&
          c.botanicalFamilyEs.includes('Solanáceas')
        ) {
          score -= 80;
        }
        return { crop: c, score };
      });

      scored.sort((a, b) => b.score - a.score);
      const best = scored[0]?.crop || candidates[0];
      previousFamily = best.botanicalFamilyEs;

      let fieldTipEs = group.coverCompanionEs;
      let fieldTipEn = group.coverCompanionEn;

      if (soilCondition === 'sequia') {
        fieldTipEs =
          best.kcApprox <= 0.75
            ? 'Aguanta bien con poca agua: siembra en surco cubierto con paja para guardar humedad.'
            : 'Pide algo más de agua: riega directo en la raíz y cubre con rastrojo.';
        fieldTipEn =
          best.kcApprox <= 0.75
            ? 'Handles low rainfall well: plant in straw-mulched furrows.'
            : 'Needs extra moisture protection: water near roots and apply mulch.';
      } else if (soilCondition === 'cansado') {
        fieldTipEs = 'Incorpora compost o abono verde al cortar para devolver materia orgánica.';
        fieldTipEn = 'Work in compost or chopped green manure residue to rebuild organic matter.';
      } else if (soilCondition === 'plagas') {
        fieldTipEs = 'Cambia de familia botánica y bordea el lote con ajo, cebolla o ruda repelente.';
        fieldTipEn = 'Botanical family shift breaks pests; border with garlic, onion, or herbs.';
      }

      return {
        group,
        cropNameEs: best.nameEs,
        cropNameEn: best.nameEn,
        familyEs: best.botanicalFamilyEs,
        familyEn: best.botanicalFamilyEn,
        cycleDays: best.cycleDays,
        kcApprox: best.kcApprox,
        droughtNoteEs: fieldTipEs,
        droughtNoteEn: fieldTipEn
      };
    });
  }, [
    orderedGroups,
    useCustomCrop,
    customCropName,
    startingPreset,
    effectiveClimate,
    soilCondition,
    parcel.gwetroot
  ]);

  // Multi-lot synchronous planner: divide farm into 3 or 4 lots so every season produces varied food!
  const farmLotsMatrix = useMemo(() => {
    const lotNamesEs = ['Lote A (Cerca a casa)', 'Lote B (Parte media)', 'Lote C (Ladera / Fondo)', 'Lote D (Reserva / Borde)'];
    const lotNamesEn = ['Plot A (Near home)', 'Plot B (Mid field)', 'Plot C (Lower slope)', 'Plot D (Edge plot)'];

    return Array.from({ length: lotCount }, (_, lotIdx) => {
      const stageIndex = (lotIdx + activeCycleStep) % adaptedSequence.length;
      const assigned = adaptedSequence[stageIndex];
      return {
        lotIndex: lotIdx,
        lotNameEs: lotNamesEs[lotIdx],
        lotNameEn: lotNamesEn[lotIdx],
        assigned
      };
    });
  }, [lotCount, activeCycleStep, adaptedSequence]);

  const activeStage = adaptedSequence[activeCycleStep % adaptedSequence.length];
  const voiceId = 'universal-rotation-guide';
  const isSpeakingThis = voiceActive && activeVoiceSource === voiceId;

  const handleSpeakUniversalCycle = () => {
    if (isSpeakingThis) {
      stopSpeak();
      return;
    }
    const seqTextEs = adaptedSequence
      .map(
        (s, idx) =>
          `Paso ${idx + 1}, ${s.group.titleEs}: siembra ${s.cropNameEs}. ${s.group.roleEs}.`
      )
      .join(' ');
    const seqTextEn = adaptedSequence
      .map(
        (s, idx) =>
          `Step ${idx + 1}, ${s.group.titleEn}: plant ${s.cropNameEn}. ${s.group.roleEn}.`
      )
      .join(' ');

    const fullText =
      lang === 'es'
        ? `Ciclo rotativo universal adaptable para ${parcel.name}, clima ${getClimateLabel(effectiveClimate, 'es')}. Tu secuencia en cuatro pasos es: ${seqTextEs} Recuerda: nunca siembres dos veces seguidas cultivos de la misma familia, y mantén siempre el suelo cubierto con paja o rastrojo.`
        : `Universal adaptable crop rotation cycle for ${parcel.name}, ${getClimateLabel(effectiveClimate, 'en')}. Your four-step sequence is: ${seqTextEn} Never repeat the same botanical family back-to-back and keep soil covered with residue mulch.`;

    onSpeak(fullText, voiceId);
  };

  // Coordinates for the 4 quadrant nodes on the 280x280 SVG wheel
  const wheelNodes: Array<{
    key: FunctionalGroupKey;
    cx: number;
    cy: number;
    labelX: number;
    labelY: number;
  }> = [
    { key: 'leguminosa', cx: 140, cy: 48, labelX: 140, labelY: 22 },
    { key: 'hoja-cereal', cx: 232, cy: 140, labelX: 232, labelY: 182 },
    { key: 'fruto', cx: 140, cy: 232, labelX: 140, labelY: 266 },
    { key: 'raiz-tuberculo', cx: 48, cy: 140, labelX: 48, labelY: 182 }
  ];

  return (
    <section
      aria-labelledby="universal-rotation-heading"
      className="bg-[#0E1E15] border border-[#243E2F] rounded-2xl p-5 sm:p-7 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-4 border-b border-[#1E3528]">
        <div className="space-y-1.5">
          <div className="text-xs font-mono-tabular text-[#4ADE80] flex flex-wrap items-center gap-2">
            <span>
              {lang === 'es'
                ? 'PRINCIPIO UNIVERSAL DE 4 FAMILIAS'
                : 'UNIVERSAL 4-FAMILY PRINCIPLE'}
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-[#38BDF8]">
              {parcel.name} ({parcel.altitudeM} m.s.n.m.)
            </span>
          </div>
          <h3
            id="universal-rotation-heading"
            className="font-display text-xl sm:text-2xl font-bold text-[#F4F3EE] max-w-3xl"
          >
            {lang === 'es'
              ? 'Ciclo Rotativo Universal y Adaptable para tu Finca'
              : 'Universal & Adaptable Crop Rotation Cycle'}
          </h3>
          <p className="text-xs sm:text-sm text-[#B8C7BD] max-w-3xl leading-relaxed">
            {lang === 'es'
              ? 'Funciona con cualquier cultivo y en cualquier piso térmico: alterna Leguminosas, Hojas/Cereales, Frutos y Raíces para que la tierra descanse produciendo, ahorre abono y corte el ciclo de plagas.'
              : 'Works with any crop in any climate zone: alternate Legumes, Leafy/Cereals, Fruits, and Roots so your soil stays fertile, saves fertilizer, and breaks pest cycles.'}
          </p>
        </div>

        <button
          type="button"
          onClick={handleSpeakUniversalCycle}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
            isSpeakingThis
              ? 'bg-[#C85A32] text-white border-[#E09F3E]'
              : 'bg-[#12231A] text-[#F4F3EE] border-[#2B4D39] hover:bg-[#193024]'
          }`}
        >
          {isSpeakingThis ? (
            <>
              <VolumeX className="w-4 h-4 shrink-0" />
              <span>{lang === 'es' ? 'Detener Guía de Voz' : 'Stop Voice Guide'}</span>
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 text-[#E09F3E] shrink-0" />
              <span>{lang === 'es' ? 'Escuchar Plan Rotativo' : 'Listen to Rotation Plan'}</span>
            </>
          )}
        </button>
      </div>

      {/* Adaptation Controls Panel (Farmer's Own Crop + Climate + Soil Condition + Plot Count) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 bg-[#0B1610] border border-[#1E3528] rounded-xl p-4 sm:p-5">
        {/* Control 1: What crop did you plant last or want to start with? */}
        <div className="lg:col-span-5 space-y-2.5">
          <label
            htmlFor="universal-start-crop"
            className="text-xs font-semibold text-[#F4F3EE] flex items-center justify-between gap-2"
          >
            <span>
              {lang === 'es'
                ? '1. ¿Con qué cultivo quieres empezar (o cuál sembraste)?'
                : '1. Starting crop (or last crop harvested)?'}
            </span>
            <button
              type="button"
              onClick={() => setUseCustomCrop((prev) => !prev)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#38BDF8] hover:underline cursor-pointer whitespace-nowrap shrink-0"
            >
              <PlusCircle className="w-3.5 h-3.5 shrink-0" />
              <span>
                {useCustomCrop
                  ? lang === 'es'
                    ? 'Usar lista común'
                    : 'Use common list'
                  : lang === 'es'
                  ? 'Escribir otro cultivo'
                  : 'Enter custom crop'}
              </span>
            </button>
          </label>

          {!useCustomCrop ? (
            <select
              id="universal-start-crop"
              value={selectedStartCropId}
              onChange={(e) => setSelectedStartCropId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg bg-[#12231A] border border-[#2B4D39] text-sm text-[#F4F3EE] focus:border-[#4ADE80] outline-none cursor-pointer"
            >
              {FUNCTIONAL_GROUPS.map((grp) => (
                <optgroup
                  key={grp.key}
                  label={lang === 'es' ? `Grupo: ${grp.titleEs}` : `Group: ${grp.titleEn}`}
                >
                  {CROP_PRESETS.filter((c) => c.group === grp.key).map((crop) => (
                    <option key={crop.id} value={crop.id}>
                      {lang === 'es' ? crop.nameEs : crop.nameEn}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
          ) : (
            <div className="space-y-2">
              <input
                type="text"
                value={customCropName}
                onChange={(e) => setCustomCropName(e.target.value)}
                placeholder={
                  lang === 'es'
                    ? 'Ej. Plátano, Café, Cilantro, Yautía, Maracuyá...'
                    : 'E.g. Plantain, Cilantro, Yam, Passionfruit...'
                }
                className="w-full px-3.5 py-2 rounded-lg bg-[#12231A] border border-[#2B4D39] text-sm text-[#F4F3EE] placeholder-[#6E8577] focus:border-[#4ADE80] outline-none"
              />
              <div className="flex flex-wrap gap-1.5">
                {FUNCTIONAL_GROUPS.map((g) => (
                  <button
                    key={g.key}
                    type="button"
                    onClick={() => setCustomCropGroup(g.key)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-medium border cursor-pointer whitespace-nowrap shrink-0 ${
                      customCropGroup === g.key
                        ? 'bg-[#1D3B2A] text-[#4ADE80] border-[#4ADE80]'
                        : 'bg-[#12231A] text-[#9FB0A5] border-[#213B2C] hover:text-white'
                    }`}
                  >
                    {lang === 'es' ? g.titleEs : g.titleEn}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className="text-[11px] text-[#8FA898]">
            {lang === 'es'
              ? `Siguiente paso automático después de este cultivo: ${adaptedSequence[1]?.cropNameEs} (${adaptedSequence[1]?.group.titleEs}).`
              : `Automatic next step after this crop: ${adaptedSequence[1]?.cropNameEn} (${adaptedSequence[1]?.group.titleEn}).`}
          </p>
        </div>

        {/* Control 2: Climate adaptation (Auto NASA or manual) */}
        <div className="lg:col-span-4 space-y-2.5">
          <div className="text-xs font-semibold text-[#F4F3EE] flex items-center gap-1.5">
            <Thermometer className="w-3.5 h-3.5 text-[#38BDF8] shrink-0" />
            <span>
              {lang === 'es'
                ? '2. Clima / Piso Térmico de tu Finca'
                : '2. Farm Climate / Elevation Zone'}
            </span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(
              [
                { id: 'auto', es: 'Auto (NASA)', en: 'Auto (NASA)' },
                { id: 'fria', es: 'Tierra Fría', en: 'Highland Cool' },
                { id: 'templada', es: 'Templado', en: 'Temperate' },
                { id: 'calida-seca', es: 'Cálido Seco', en: 'Warm Dry' },
                { id: 'calida-humeda', es: 'Cálido Húmedo', en: 'Warm Humid' }
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setClimateMode(opt.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                  climateMode === opt.id
                    ? 'bg-[#38BDF8] text-[#07130B] border-[#38BDF8] font-semibold'
                    : 'bg-[#12231A] text-[#C8D6CD] border-[#243E2F] hover:text-white'
                }`}
              >
                {lang === 'es' ? opt.es : opt.en}
              </button>
            ))}
          </div>
          <p className="text-[11px] font-mono-tabular text-[#9FB0A5]">
            {lang === 'es' ? 'Aplicado: ' : 'Active: '}
            <span className="text-[#F4F3EE]">{getClimateLabel(effectiveClimate, lang)}</span>
          </p>
        </div>

        {/* Control 3: Soil Condition & Lot Count */}
        <div className="lg:col-span-3 space-y-2.5">
          <div className="text-xs font-semibold text-[#F4F3EE] flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#E09F3E] shrink-0" />
            <span>
              {lang === 'es' ? '3. Estado del Suelo y Lotes' : '3. Soil Need & Plots'}
            </span>
          </div>

          <select
            aria-label={lang === 'es' ? 'Estado actual del suelo' : 'Current soil need'}
            value={soilCondition}
            onChange={(e) => setSoilCondition(e.target.value as SoilConditionKey)}
            className="w-full px-3 py-2 rounded-lg bg-[#12231A] border border-[#2B4D39] text-xs text-[#F4F3EE] focus:border-[#4ADE80] outline-none cursor-pointer"
          >
            <option value="equilibrado">
              {lang === 'es' ? 'Suelo equilibrado (Producción continua)' : 'Balanced soil (Continuous yield)'}
            </option>
            <option value="sequia">
              {lang === 'es'
                ? 'Poca agua / Sequía (Cultivos que piden poca agua)'
                : 'Low water / Drought (Low-water hardy crops)'}
            </option>
            <option value="cansado">
              {lang === 'es'
                ? 'Tierra cansada o dura (Más abono verde)'
                : 'Tired / compacted soil (Extra green manure)'}
            </option>
            <option value="plagas">
              {lang === 'es'
                ? 'Plagas recientes (Cortar familia botánica)'
                : 'Recent pests (Strict family break)'}
            </option>
          </select>

          <div className="flex items-center justify-between gap-2 pt-0.5">
            <span className="text-[11px] text-[#8FA898]">
              {lang === 'es' ? 'Dividir finca en:' : 'Split farm into:'}
            </span>
            <div className="inline-flex rounded-lg border border-[#243E2F] bg-[#12231A] p-0.5">
              {([3, 4] as const).map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setLotCount(n)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-mono-tabular font-semibold cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                    lotCount === n
                      ? 'bg-[#4ADE80] text-[#07130B]'
                      : 'text-[#9FB0A5] hover:text-white'
                  }`}
                >
                  {n} {lang === 'es' ? 'Lotes' : 'Plots'}
                </button>
              ))}
            </div>
          </div>

          {nasaSuggestedCondition !== 'equilibrado' && soilCondition !== nasaSuggestedCondition && (
            <button
              type="button"
              onClick={() => setSoilCondition(nasaSuggestedCondition)}
              className="text-[11px] text-[#E09F3E] hover:underline text-left cursor-pointer"
            >
              {nasaSuggestedCondition === 'sequia'
                ? lang === 'es'
                  ? 'La tierra está algo seca en la raíz: conviene adaptar a poca agua'
                  : 'Root zone looks dry: adapt for low-water hardy crops'
                : lang === 'es'
                ? 'Clima cálido y húmedo: conviene adaptar para frenar hongos y plagas'
                : 'Warm humid weather: adapt for strong pest break'}
            </button>
          )}
        </div>
      </div>

      {/* Main Visual Stage: Interactive Universal Wheel (Left) + 4-Step Sequential Plan (Right) */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        {/* Left Zone: Interactive 4-Phase Rotation Wheel */}
        <div className="xl:col-span-5 bg-[#0B1610] border border-[#1E3528] rounded-xl p-5 flex flex-col items-center space-y-4">
          <div className="w-full flex items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-[#F4F3EE]">
              {lang === 'es' ? 'Rueda Rotativa Universal' : 'Universal Rotation Wheel'}
            </span>
            <button
              type="button"
              onClick={() => setActiveCycleStep((prev) => (prev + 1) % 4)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#193325] hover:bg-[#224431] border border-[#2F5B42] text-xs font-medium text-[#4ADE80] cursor-pointer whitespace-nowrap shrink-0 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 shrink-0" />
              <span>
                {lang === 'es' ? 'Girar al Siguiente Ciclo' : 'Advance Next Season'}
              </span>
            </button>
          </div>

          <div className="relative w-full max-w-[300px] aspect-square flex items-center justify-center">
            <svg
              viewBox="0 0 280 280"
              className="w-full h-full overflow-visible"
              role="img"
              aria-label={
                lang === 'es'
                  ? 'Diagrama circular de los cuatro grupos de rotación agrícola'
                  : 'Circular diagram of the four agricultural crop rotation groups'
              }
            >
              {/* Outer circular track */}
              <circle
                cx="140"
                cy="140"
                r="92"
                fill="none"
                stroke="#1E3528"
                strokeWidth="3"
                strokeDasharray="6 6"
              />

              {/* Directional clockwise arrows between quadrants */}
              <defs>
                <marker
                  id="rot-arrow"
                  viewBox="0 0 10 10"
                  refX="7"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto-start-reverse"
                >
                  <path d="M 0 1 L 10 5 L 0 9 z" fill="#4ADE80" />
                </marker>
              </defs>
              <path
                d="M 188 61 A 92 92 0 0 1 219 92"
                fill="none"
                stroke="#4ADE80"
                strokeWidth="2.5"
                markerEnd="url(#rot-arrow)"
              />
              <path
                d="M 219 188 A 92 92 0 0 1 188 219"
                fill="none"
                stroke="#38BDF8"
                strokeWidth="2.5"
                markerEnd="url(#rot-arrow)"
              />
              <path
                d="M 92 219 A 92 92 0 0 1 61 188"
                fill="none"
                stroke="#E09F3E"
                strokeWidth="2.5"
                markerEnd="url(#rot-arrow)"
              />
              <path
                d="M 61 92 A 92 92 0 0 1 92 61"
                fill="none"
                stroke="#C084FC"
                strokeWidth="2.5"
                markerEnd="url(#rot-arrow)"
              />

              {/* Center Parcel Badge */}
              <circle cx="140" cy="140" r="46" fill="#12231A" stroke="#2B4D39" strokeWidth="1.5" />
              <text
                x="140"
                y="133"
                textAnchor="middle"
                fill="#8FA898"
                fontSize="10"
                fontWeight="600"
              >
                {lang === 'es' ? `CICLO ${activeCycleStep + 1} DE 4` : `CYCLE ${activeCycleStep + 1} OF 4`}
              </text>
              <text
                x="140"
                y="151"
                textAnchor="middle"
                fill="#F4F3EE"
                fontSize="11.5"
                fontWeight="700"
              >
                {lang === 'es' ? 'Suelo Vivo' : 'Living Soil'}
              </text>

              {/* 4 Clickable Group Nodes */}
              {wheelNodes.map((node) => {
                const grp = FUNCTIONAL_GROUPS.find((g) => g.key === node.key)!;
                const orderIdx = adaptedSequence.findIndex((s) => s.group.key === node.key);
                const isActive = activeStage?.group.key === node.key;

                return (
                  <g
                    key={node.key}
                    onClick={() => {
                      if (orderIdx >= 0) setActiveCycleStep(orderIdx);
                    }}
                    className="cursor-pointer"
                  >
                    <circle
                      cx={node.cx}
                      cy={node.cy}
                      r={isActive ? 27 : 22}
                      fill={isActive ? grp.accentHex : '#12231A'}
                      stroke={grp.accentHex}
                      strokeWidth={isActive ? 3 : 2}
                    />
                    <text
                      x={node.cx}
                      y={node.cy + 4}
                      textAnchor="middle"
                      fill={isActive ? '#07130B' : '#F4F3EE'}
                      fontSize="13"
                      fontWeight="700"
                    >
                      {orderIdx + 1}°
                    </text>
                    <text
                      x={node.labelX}
                      y={node.labelY}
                      textAnchor="middle"
                      fill={isActive ? grp.accentHex : '#C8D6CD'}
                      fontSize="10.5"
                      fontWeight={isActive ? '700' : '500'}
                    >
                      {lang === 'es' ? grp.titleEs.split(',')[0] : grp.titleEn.split(' ')[0]}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Active Wheel Stage Callout */}
          {activeStage && (
            <div className="w-full p-3.5 rounded-lg bg-[#12231A] border border-[#243E2F] space-y-1.5">
              <div className="flex items-center justify-between gap-2 text-xs font-mono-tabular">
                <span style={{ color: activeStage.group.accentHex }} className="font-bold">
                  {lang === 'es'
                    ? `Paso ${(activeCycleStep % 4) + 1} · ${activeStage.group.titleEs}`
                    : `Step ${(activeCycleStep % 4) + 1} · ${activeStage.group.titleEn}`}
                </span>
                <span className="text-[#8FA898]">{activeStage.cycleDays}</span>
              </div>
              <div className="font-display text-base font-bold text-[#F4F3EE]">
                {lang === 'es' ? activeStage.cropNameEs : activeStage.cropNameEn}
              </div>
              <p className="text-xs text-[#C8D6CD] leading-relaxed">
                {lang === 'es' ? activeStage.group.soilActionEs : activeStage.group.soilActionEn}
              </p>
              <p className="text-[11px] text-[#4ADE80] pt-1">
                {lang === 'es' ? activeStage.droughtNoteEs : activeStage.droughtNoteEn}
              </p>
            </div>
          )}
        </div>

        {/* Right Zone: 4-Stage Adapted Sequence + Multi-Plot Farm Schedule */}
        <div className="xl:col-span-7 space-y-5">
          {/* Sequential Cards for the 4 Cycles */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold text-[#D7E0DA] flex items-center justify-between gap-2">
              <span>
                {lang === 'es'
                  ? 'Secuencia Adaptada para un Mismo Lote (Paso 1 → 2 → 3 → 4)'
                  : 'Adapted Sequence on a Single Plot (Step 1 → 2 → 3 → 4)'}
              </span>
              <span className="text-[11px] font-mono-tabular text-[#8FA898]">
                {lang === 'es' ? 'Haz clic en un paso para inspeccionar' : 'Click any step to inspect'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {adaptedSequence.map((stage, idx) => {
                const isSelected = activeCycleStep % 4 === idx;
                return (
                  <button
                    key={stage.group.key}
                    type="button"
                    onClick={() => setActiveCycleStep(idx)}
                    className={`p-4 rounded-xl border text-left transition-colors cursor-pointer flex flex-col justify-between gap-2 ${
                      isSelected
                        ? 'bg-[#162C20] border-[#4ADE80]'
                        : 'bg-[#0B1610] border-[#1E3528] hover:border-[#38BDF8]'
                    }`}
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono-tabular">
                        <span style={{ color: stage.group.accentHex }} className="font-bold">
                          {lang === 'es'
                            ? `Siembra ${idx + 1} · ${stage.group.titleEs}`
                            : `Cycle ${idx + 1} · ${stage.group.titleEn}`}
                        </span>
                        <span className="text-[#8FA898]">
                          {stage.kcApprox <= 0.74
                            ? lang === 'es'
                              ? 'Poca agua'
                              : 'Low water'
                            : stage.kcApprox <= 0.85
                            ? lang === 'es'
                              ? 'Agua media'
                              : 'Mid water'
                            : lang === 'es'
                            ? 'Buena agua'
                            : 'Needs water'}
                        </span>
                      </div>

                      <div className="font-display text-base font-bold text-[#F4F3EE]">
                        {lang === 'es' ? stage.cropNameEs : stage.cropNameEn}
                      </div>

                      <div className="text-[11px] text-[#9FB0A5]">
                        {lang === 'es'
                          ? `Familia: ${stage.familyEs} · ${stage.group.nutrientEs}`
                          : `Family: ${stage.familyEn} · ${stage.group.nutrientEn}`}
                      </div>
                    </div>

                    <div className="text-xs text-[#C8D6CD] pt-2 border-t border-[#182E22] leading-snug">
                      {lang === 'es' ? stage.droughtNoteEs : stage.droughtNoteEn}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Synchronous Multi-Lot Planner (How to rotate 3 or 4 lots at the same time) */}
          <div className="bg-[#0B1610] border border-[#1E3528] rounded-xl p-4 sm:p-5 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2.5 border-b border-[#182E22]">
              <div>
                <div className="text-xs font-semibold text-[#F4F3EE] flex items-center gap-1.5">
                  <Layers className="w-4 h-4 text-[#4ADE80] shrink-0" />
                  <span>
                    {lang === 'es'
                      ? `Tablero Simultáneo por Lotes (${lotCount} divisiones de tu finca)`
                      : `Simultaneous Farm-Plot Board (${lotCount} farm divisions)`}
                  </span>
                </div>
                <p className="text-[11px] text-[#8FA898] mt-0.5">
                  {lang === 'es'
                    ? 'Así cosechas proteína, grano, fruto y raíz al mismo tiempo sin repetir cultivo en ningún lote.'
                    : 'Harvest protein, grain, fruit, and roots at once without ever repeating families in the same plot.'}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                {[0, 1, 2, 3].map((step) => (
                  <button
                    key={step}
                    type="button"
                    onClick={() => setActiveCycleStep(step)}
                    className={`px-2.5 py-1 rounded-md text-[11px] font-mono-tabular font-semibold border cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                      activeCycleStep === step
                        ? 'bg-[#4ADE80] text-[#07130B] border-[#4ADE80]'
                        : 'bg-[#12231A] text-[#9FB0A5] border-[#243E2F] hover:text-white'
                    }`}
                  >
                    {lang === 'es' ? `Ciclo ${step + 1}` : `Season ${step + 1}`}
                  </button>
                ))}
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#1E3528] text-[11px] font-mono-tabular text-[#8FA898]">
                    <th className="py-2 pr-3">{lang === 'es' ? 'Lote de Finca' : 'Farm Plot'}</th>
                    <th className="py-2 px-3">{lang === 'es' ? 'Grupo Rotativo' : 'Rotation Group'}</th>
                    <th className="py-2 px-3">{lang === 'es' ? 'Cultivo Asignado Ahora' : 'Assigned Crop Now'}</th>
                    <th className="py-2 pl-3">{lang === 'es' ? 'Próximo Turno' : 'Next Season'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182E22]">
                  {farmLotsMatrix.map((row) => {
                    const nextIdx =
                      (adaptedSequence.findIndex((s) => s.group.key === row.assigned.group.key) + 1) %
                      adaptedSequence.length;
                    const nextCrop = adaptedSequence[nextIdx];

                    return (
                      <tr key={row.lotIndex} className="text-[#D7E0DA]">
                        <td className="py-2.5 pr-3 font-medium text-[#F4F3EE]">
                          {lang === 'es' ? row.lotNameEs : row.lotNameEn}
                        </td>
                        <td className="py-2.5 px-3 font-mono-tabular">
                          <span style={{ color: row.assigned.group.accentHex }}>
                            {lang === 'es' ? row.assigned.group.titleEs : row.assigned.group.titleEn}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-[#F4F3EE]">
                          {lang === 'es' ? row.assigned.cropNameEs : row.assigned.cropNameEn}
                        </td>
                        <td className="py-2.5 pl-3 text-[#9FB0A5] flex items-center gap-1">
                          <ArrowRight className="w-3 h-3 text-[#4ADE80] shrink-0" />
                          <span>{lang === 'es' ? nextCrop.cropNameEs : nextCrop.cropNameEn}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3 Farmer Golden Rules of Universal Rotation */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-[#0B1610] border border-[#1E3528] space-y-1">
              <div className="font-semibold text-[#4ADE80] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'es' ? 'Regla 1: Familia Botánica' : 'Rule 1: Botanical Family'}</span>
              </div>
              <p className="text-[#B8C7BD] leading-relaxed">
                {lang === 'es'
                  ? 'No siembres papa justo después de tomate o ají (son primos Solanáceas y comparten plagas).'
                  : 'Never plant potato right after tomato or chili (same Solanaceae family and pests).'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B1610] border border-[#1E3528] space-y-1">
              <div className="font-semibold text-[#38BDF8] flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'es' ? 'Regla 2: Suelo Cubierto' : 'Rule 2: Armor the Soil'}</span>
              </div>
              <p className="text-[#B8C7BD] leading-relaxed">
                {lang === 'es'
                  ? 'Entre un ciclo y otro deja el rastrojo sobre la tierra; conserva hasta +30% de agua en raíz.'
                  : 'Leave chopped crop residue on top between cycles to retain up to +30% root moisture.'}
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-[#0B1610] border border-[#1E3528] space-y-1">
              <div className="font-semibold text-[#E09F3E] flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'es' ? 'Regla 3: Alterna Raíces' : 'Rule 3: Alternate Roots'}</span>
              </div>
              <p className="text-[#B8C7BD] leading-relaxed">
                {lang === 'es'
                  ? 'Alterna raíces superficiales con raíces profundas para aprovechar agua y abono a distintas alturas.'
                  : 'Alternate shallow and deep-rooted crops so every soil depth gets nourished and aerated.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
