import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Search,
  Volume2,
  VolumeX,
  Sprout,
  Recycle,
  Globe,
  Droplets,
  Leaf,
  Bug,
  ShieldCheck,
  Database,
  RefreshCw
} from 'lucide-react';
import { UniversalCropRotationCycle } from './UniversalCropRotationCycle';
import { GlossaryVisualDiagram } from './GlossaryVisualDiagram';

export interface HubParcelSummary {
  id: string;
  name: string;
  country: string;
  altitudeM: number;
  agroZone: string;
  gwetroot: number;
  prectotMmDay: number;
  t2mC: number;
  resilienceScore?: number;
}

interface KnowledgeAndSustainabilityHubProps {
  lang: 'es' | 'en';
  selectedParcel: HubParcelSummary;
  liveNasaData: {
    gwetroot: number;
    prectotMmDay: number;
    t2mC: number;
    rh2mPct: number;
    solarMjDay: number;
    source: 'LIVE_API' | 'NASA_BASELINE' | 'OFFLINE_CACHE';
  };
  activeRotation: {
    id: string;
    name: string;
    legumeNitrogenSavingRatio: number;
    soilMoistureRetentionGain: number;
    carbonSequestrationTonsHa: number;
    grainHarvestKgPerHa: number;
  };
  simulationMetrics: {
    resilienceScore: number;
    infiltratedWaterLitersM2Yr: number;
    biologicalNitrogenKgHa: number;
    soilOrganicBiomassKgHa: number;
    soilHealthScore: number;
    nutritionCoverage: number;
    monthsFed: number;
    netUsableHarvestKg: number;
    postHarvestSavedKg: number;
  };
  referenceParcels: HubParcelSummary[];
  onSpeak: (text: string, sourceId: string) => void;
  stopSpeak: () => void;
  voiceActive: boolean;
  activeVoiceSource: string | null;
}

type HubSection =
  | 'glosario-tecnico'
  | 'ciclo-universal'
  | 'plagas-offline'
  | 'saber-ancestral'
  | 'economia-circular'
  | 'ods-global';

type GlossaryTopic = 'todos' | 'agua-clima' | 'satelites-relieve' | 'suelo-cultivo';

interface GlossaryOrRemedyItem {
  id: string;
  category: 'glosario' | 'plaga';
  topic?: Exclude<GlossaryTopic, 'todos'>;
  termEs: string;
  termEn: string;
  tagEs: string;
  tagEn: string;
  bodyEs: string;
  bodyEn: string;
  actionEs: string;
  actionEn: string;
}

const LOCAL_KNOWLEDGE_ITEMS: GlossaryOrRemedyItem[] = [
  {
    id: 'g-kcfactor',
    category: 'glosario',
    topic: 'agua-clima',
    termEs: 'KcFactor (Cuánta agua bebe tu cultivo)',
    termEn: 'KcFactor (Crop Water Need)',
    tagEs: 'Agua y Etapas del Cultivo',
    tagEn: 'Water & Crop Stages',
    bodyEs:
      'Muestra cuánta sed tiene tu cultivo según su edad. Cuando la planta apenas nace bebe poquita agua; cuando está floreciendo y llenando el grano o fruto pide el máximo; y cuando ya va secando para cosechar vuelve a pedir menos.',
    bodyEn:
      'Shows how thirsty your crop is at each growth stage: low when newly sprouted, highest during flowering and grain fill, and lower again near harvest dry-down.',
    actionEs:
      'Cuida que nunca falte agua cuando la mata está en flor o llenando mazorca; cuando ya esté madurando, reduce el riego para ahorrar agua y evitar que se pudra.',
    actionEn:
      'Protect soil moisture during flowering and grain fill; cut back watering near harvest to save water and prevent rot.'
  },
  {
    id: 'g-evapo',
    category: 'glosario',
    topic: 'agua-clima',
    termEs: 'Evapotranspiración (Agua que se lleva el sol)',
    termEn: 'Evapotranspiration (Water Lost to Sun & Air)',
    tagEs: 'Agua y Clima',
    tagEn: 'Water & Climate',
    bodyEs:
      'Es toda el agua que pierde tu lote en un día por dos lados: el agua que el sol y el viento secan directo de la tierra desnuda, más el agua que sudan las hojas de las plantas para mantenerse frescas.',
    bodyEn:
      'Total daily water lost from your field in two ways: moisture drying straight off bare soil plus water breathed out by leaves under sun and wind.',
    actionEs:
      'Siembra cultivos con sombra (como calabaza debajo del maíz) y tapa la tierra con rastrojo para que el sol no se robe el agua.',
    actionEn:
      'Intercrop shade cover (like squash under maize) and mulch bare earth so sunlight cannot steal soil moisture.'
  },
  {
    id: 'g-srtm',
    category: 'glosario',
    topic: 'satelites-relieve',
    termEs: 'Pendiente SRTM (Inclinación de tu terreno)',
    termEn: 'SRTM Slope (How Steep Your Field Is)',
    tagEs: 'Radar Satelital NASA',
    tagEn: 'NASA Radar Elevation',
    bodyEs:
      'Es qué tan plano o empinado está tu terreno, medido desde el espacio por el radar SRTM de la NASA. Si el lote es plano el agua se queda quieta; si está en ladera fuerte, la lluvia corre rápido cuesta abajo.',
    bodyEn:
      'Measures how flat or steep your parcel is using NASA SRTM radar. Flat fields hold rain easily; steep hillsides push rainwater downhill quickly.',
    actionEs:
      'En laderas empinadas no hagas surcos hacia abajo: siembra atravesando la loma (curvas a nivel) y pon barreras vivas para que la lluvia no lave tu abono ni tu tierra buena.',
    actionEn:
      'On steep slopes, never plow straight downhill: plant across the slope along contour lines with living barriers to protect topsoil.'
  },
  {
    id: 'g-grace',
    category: 'glosario',
    topic: 'satelites-relieve',
    termEs: 'Niveles Mascon GRACE-FO (Agua profunda bajo tierra)',
    termEn: 'GRACE-FO Mascon Levels (Deep Groundwater)',
    tagEs: 'Satélites Gemelos NASA',
    tagEn: 'Twin NASA Satellites',
    bodyEs:
      'Dos satélites gemelos de la NASA sienten cambios en el peso de la Tierra debajo de tu región (en zonas llamadas "Mascon") para avisar si los pozos, aljibes y nacimientos de agua subterránea están llenándose o bajando con los meses.',
    bodyEn:
      'Twin NASA satellites sense tiny shifts in Earth’s gravity under your region ("Mascon" zones) to tell whether deep wells, springs, and aquifers are refilling or draining over months.',
    actionEs:
      'Si estas reservas profundas marcan nivel bajo, aunque caiga un aguacero hoy los pozos tardarán meses en subir: cuida quebradas y riega directo al pie de la mata.',
    actionEn:
      'When deep reserves look low, wells recover slowly even after a heavy storm: protect headwaters and water gently right at plant roots.'
  },
  {
    id: 'g-gwetroot',
    category: 'glosario',
    topic: 'agua-clima',
    termEs: 'GWETROOT (Humedad en Raíz)',
    termEn: 'GWETROOT (Root-Zone Soil Wetness)',
    tagEs: 'Glosario Satelital NASA',
    tagEn: 'NASA Satellite Glossary',
    bodyEs:
      'Mide qué tan mojada está la tierra entre 0 y 100 centímetros de profundidad, justo donde toman agua y nutrientes las raíces de tus cultivos.',
    bodyEn:
      'Measures how moist the soil is between 0 and 100 cm deep, right where crop roots absorb water and nutrients.',
    actionEs: 'Si baja de 42%, aplica acolchado de rastrojo para evitar que el sol evapore la poca humedad que queda.',
    actionEn: 'If below 42%, apply crop residue mulch to stop solar evaporation.'
  },
  {
    id: 'g-ndvi',
    category: 'glosario',
    topic: 'satelites-relieve',
    termEs: 'NDVI / Sentinel-2 (Vigor Verde del Lote)',
    termEn: 'NDVI / Sentinel-2 (Crop Canopy Vigor)',
    tagEs: 'Satélite ESA Copernicus',
    tagEn: 'ESA Copernicus Satellite',
    bodyEs:
      'Es una foto de colores especiales tomada por el satélite Sentinel-2 que distingue dónde las hojas están verdes y sanas (NDVI alto) y en qué rincón del potrero la planta está amarillenta o pasando sed (NDVI bajo).',
    bodyEn:
      'Multispectral index from ESA Sentinel-2 showing where crop leaves are lush and healthy (high NDVI) versus stressed, thirsty, or sparse patches (low NDVI).',
    actionEs:
      'Cuando veas una mancha con vigor bajo dentro del mismo cultivo, camina directo a esa esquina para revisar si falta agua, nitrógeno o si hay gusano en raíz.',
    actionEn:
      'Walk straight to any low-vigor corner spotted in the parcel view to inspect for localized drought, nutrient deficiency, or root pests.'
  },
  {
    id: 'g-escorrentia',
    category: 'glosario',
    topic: 'agua-clima',
    termEs: 'Escorrentía y Zanjas de Infiltración',
    termEn: 'Runoff & Contour Infiltration Ditches',
    tagEs: 'Cuidado del Agua',
    tagEn: 'Water Care',
    bodyEs:
      'Cuando llueve fuerte sobre tierra desnuda en ladera, el agua corre cuesta abajo arrastrando el abono y la capa fértil hacia las quebradas en lugar de entrar al suelo.',
    bodyEn:
      'When heavy rain falls on bare slopes, water rushes downhill washing away topsoil and nutrients instead of soaking into the root zone.',
    actionEs: 'Traza surcos y pequeñas zanjas en curvas a nivel atravesando la pendiente para que el agua entre despacio en la tierra.',
    actionEn: 'Plant along contour lines and dig shallow infiltration ditches across the slope so rain soaks gently into the root zone.'
  },
  {
    id: 'g-acolchado',
    category: 'glosario',
    topic: 'suelo-cultivo',
    termEs: 'Acolchado o Mulching',
    termEn: 'Mulching / Soil Cover',
    tagEs: 'Práctica de Suelo Vivo',
    tagEn: 'Living Soil Practice',
    bodyEs:
      'Capa protectora de paja, hojas secas o rastrojo picado que cubre la tierra alrededor de las plantas sin enterrarla.',
    bodyEn:
      'Protective blanket of straw, dry leaves, or chopped crop residues laid over the soil surface.',
    actionEs: 'Nunca quemes el rastrojo: úsalo como abrigo del suelo para bajar la temperatura y guardar humedad.',
    actionEn: 'Never burn crop residue: spread it as soil armor to cool roots and conserve moisture.'
  },
  {
    id: 'g-biol',
    category: 'glosario',
    topic: 'suelo-cultivo',
    termEs: 'Biol y Purín Orgánico',
    termEn: 'Biol & Liquid Organic Biofertilizer',
    tagEs: 'Economía Circular',
    tagEn: 'Circular Economy',
    bodyEs:
      'Abono líquido fermentado hecho en caneca cerrada con estiércol fresco, melaza, suero o ceniza de leña y plantas como ortiga.',
    bodyEn:
      'Fermented liquid biofertilizer brewed in a sealed drum with fresh manure, molasses, wood ash, and green herbs.',
    actionEs: 'Se diluye 1 litro de biol en 20 litros de agua para fortalecer hojas y raíces sin gastar en químicos.',
    actionEn: 'Dilute 1 liter of biol in 20 liters of water to feed foliage and roots at minimal cost.'
  },
  {
    id: 'g-micorrizas',
    category: 'glosario',
    topic: 'suelo-cultivo',
    termEs: 'Micorrizas y Nódulos de Frijol',
    termEn: 'Mycorrhizae & Legume Nodules',
    tagEs: 'Biología del Suelo',
    tagEn: 'Soil Biology',
    bodyEs:
      'Hongos y bacterias buenas que viven abrazadas a las raíces del frijol, haba o arveja y atrapan nitrógeno del aire para regalarlo al suelo.',
    bodyEn:
      'Beneficial fungi and bacteria living on bean, pea, or fava roots that capture nitrogen from air for crops.',
    actionEs: 'Por eso rotar maíz o papa después de frijol ahorra hasta la mitad de los abonos nitrogenados.',
    actionEn: 'Rotating maize or potato after legumes cuts synthetic nitrogen needs significantly.'
  },
  {
    id: 'p-roya',
    category: 'plaga',
    termEs: 'Manchas café / Roya o Cenicilla en Hojas',
    termEn: 'Leaf Rust / Powdery Mildew',
    tagEs: 'Base Local Offline · Hongos',
    tagEn: 'Offline Database · Fungi',
    bodyEs:
      'Aparece tras lluvias seguidas y alta humedad (>75%). Se ven polvillos blancos o puntitos anaranjados y cafés debajo de las hojas.',
    bodyEn:
      'Appears after prolonged rain and high humidity (>75%), showing white powder or orange-brown spots under leaves.',
    actionEs:
      'Paso 1: Poda hojas muy manchadas. Paso 2: Fumiga caldo de ceniza (1 kg ceniza tamizada en 10 L agua hervida y enfriada) o leche cruda diluida al 10% al amanecer.',
    actionEn:
      'Step 1: Prune heavily spotted leaves. Step 2: Spray sifted wood-ash tea or 10% milk-water solution at dawn.'
  },
  {
    id: 'p-pulgon',
    category: 'plaga',
    termEs: 'Pulgón, Mosca Blanca o Cogollero',
    termEn: 'Aphids, Whitefly or Armyworm',
    tagEs: 'Base Local Offline · Insectos',
    tagEn: 'Offline Database · Pests',
    bodyEs:
      'Insectos chupadores en los brotes tiernos o gusanos mordiendo el cogollo cuando hay días secos y calurosos.',
    bodyEn:
      'Sap-sucking insects on tender shoots or caterpillars feeding inside the whorl during warm dry spells.',
    actionEs:
      'Paso 1: Machaca 4 cabezas de ajo y 4 ajíes picantes en 1 L de agua, deja reposar 24h y diluye en 15 L con 1 cucharada de jabón potásico o azul. Aplica al atardecer.',
    actionEn:
      'Step 1: Blend garlic and hot chili, steep 24h, strain into 15 L water with mild natural soap, and spray at dusk.'
  },
  {
    id: 'p-amarilla',
    category: 'plaga',
    termEs: 'Hojas Inferiores Amarillas (Falta de Nitrógeno)',
    termEn: 'Lower Yellowing Leaves (Nitrogen Deficit)',
    tagEs: 'Base Local Offline · Nutrición',
    tagEn: 'Offline Database · Nutrition',
    bodyEs:
      'Las hojas más viejas de abajo se vuelven amarillo parejo desde la punta hacia el tallo; ocurre tras lluvias fuertes que lavan el suelo.',
    bodyEn:
      'Older bottom leaves turn uniform yellow from tip to stem, often after heavy rains leach nutrients.',
    actionEs:
      'Aplica purín de ortiga o biol rico en estiércol alrededor de la base, e intercala fríjol o haba en la siguiente siembra.',
    actionEn:
      'Side-dress with nettle tea or fermented manure biol, and intercrop beans or fava in the next cycle.'
  },
  {
    id: 'p-encharcamiento',
    category: 'plaga',
    termEs: 'Marchitez con Suelo Muy Mojado (Asfixia de Raíz)',
    termEn: 'Wilting in Waterlogged Soil (Root Rot)',
    tagEs: 'Base Local Offline · Drenaje',
    tagEn: 'Offline Database · Drainage',
    bodyEs:
      'La planta se agacha aunque la tierra esté empapada. Las raíces se quedan sin aire y se pudren por hongos del suelo.',
    bodyEn:
      'Plants droop even when soil is soaked because roots suffocate without oxygen and suffer soil rot.',
    actionEs:
      'Abre zanjas pequeñas de desagüe entre surcos sin pisar la zona húmeda, aporca tierra suelta al tallo y agrega ceniza seca.',
    actionEn:
      'Open shallow drainage channels between rows, avoid compacting wet soil, and dust dry wood ash around stems.'
  },
  {
    id: 'p-helada',
    category: 'plaga',
    termEs: 'Riesgo de Helada Nocturna (Cielo Despejado y Frío)',
    termEn: 'Night Frost Risk (Clear Cold Sky)',
    tagEs: 'Base Local Offline · Clima',
    tagEn: 'Offline Database · Frost',
    bodyEs:
      'Cuando la temperatura mínima baja de 4°C sin nubes, el aire frío cae al fondo de los lotes y quema los brotes al amanecer.',
    bodyEn:
      'When night temperatures drop below 4°C under clear skies, cold air pools in low spots and burns shoots.',
    actionEs:
      'Riega ligeramente la tarde anterior (el suelo húmedo guarda calor), cubre brotes tiernos con paja y quema rastrojo húmedo en bordes para hacer cortina de humo antes del alba.',
    actionEn:
      'Irrigate lightly the afternoon before (wet soil holds heat) and cover tender seedlings with straw overnight.'
  }
];

const ANCESTRAL_LESSONS = [
  {
    id: 'anc-luna',
    titleEs: 'Fases de la Luna y Movimiento de la Savia',
    titleEn: 'Lunar Phases & Plant Sap Movement',
    tagEs: 'Enseñanza Tradicional · Calendario',
    tagEn: 'Traditional Knowledge · Calendar',
    summaryEs:
      'En cuarto creciente y luna llena la savia sube hacia las hojas y frutos; en cuarto menguante baja hacia las raíces y tubérculos.',
    summaryEn:
      'During waxing and full moon, sap rises toward leaves and fruit; during waning moon it concentrates in roots.',
    stepsEs: [
      'Siembra papa, yuca, zanahoria, ajo y cebolla en Luna Menguante para raíces firmes.',
      'Siembra maíz, fríjol, tomate y hortalizas de hoja en Luna Creciente para mayor vigor.',
      'Realiza podas sanitarias y corte de madera en Menguante para evitar pudriciones.'
    ],
    stepsEn: [
      'Plant potatoes, cassava, garlic, and root crops during Waning Moon.',
      'Plant maize, beans, tomatoes, and leafy crops during Waxing Moon.',
      'Prune trees and cut timber during Waning Moon to minimize sap loss and rot.'
    ]
  },
  {
    id: 'anc-bioindicadores',
    titleEs: 'Bioindicadores del Campo + Datos Satelitales NASA',
    titleEn: 'Field Bioindicators + NASA Satellite Cross-Check',
    tagEs: 'Observación Local + Ciencia',
    tagEn: 'Local Observation + Science',
    summaryEs:
      'Nuestros abuelos leían el clima en las nubes, los vientos y los insectos; al cruzarlo con la humedad NASA SMAP logras doble certeza.',
    summaryEn:
      'Elders read weather through clouds, winds, and insects; pairing that with NASA SMAP soil moisture gives double confidence.',
    stepsEs: [
      'Hormigas subiendo huevos a partes altas o nubes bajas pegadas al cerro avisan lluvias próximas.',
      'Noches muy despejadas sin viento después de tarde fría anuncian riesgo de helada al amanecer.',
      'Confirma tus señales del campo revisando el porcentaje GWETROOT en la pestaña Mi Parcela.'
    ],
    stepsEn: [
      'Ants moving eggs higher or low mountain fog signals approaching rain.',
      'Calm crystal-clear nights following cool afternoons warn of dawn frost.',
      'Cross-check your local signs with live GWETROOT moisture in My Plot.'
    ]
  },
  {
    id: 'anc-milpa',
    titleEs: 'La Milpa y Policultivos Hermanos',
    titleEn: 'Milpa Polyculture & Companion Guilds',
    tagEs: 'Manejo Agroecológico',
    tagEn: 'Agroecological Design',
    summaryEs:
      'Nunca dejar el suelo pelado ni sembrar una sola cosa: cada planta cumple un trabajo diferente protegiendo el agua y frenando plagas.',
    summaryEn:
      'Never leave soil bare or plant a single crop: each species performs a distinct ecological role.',
    stepsEs: [
      'El maíz da tutor firme y sombra parcial contra el golpe directo del sol.',
      'El fríjol o haba fija nitrógeno en las raíces alimentando al maíz vecino.',
      'La calabaza o ahuyama tiende hojas anchas sobre la tierra reduciendo la evaporación hasta en 35%.'
    ],
    stepsEn: [
      'Maize provides vertical stalks and dappled shade against intense sun.',
      'Climbing beans fix atmospheric nitrogen right into neighboring maize roots.',
      'Broad squash leaves shade bare ground, cutting soil evaporation by up to 35%.'
    ]
  },
  {
    id: 'anc-barreras',
    titleEs: 'Barreras Vivas y Cosecha de Agua en Ladera',
    titleEn: 'Living Barriers & Slope Water Harvesting',
    tagEs: 'Conservación de Agua y Suelo',
    tagEn: 'Water & Soil Conservation',
    summaryEs:
      'En terrenos inclinados, el agua que baja rápido roba la tierra negra; si la frenas con pasto vetiver, cabuya o zanjas, recargas el acuífero.',
    summaryEn:
      'On slopes, fast runoff steals fertile topsoil; slowing water with living hedges recharges groundwater.',
    stepsEs: [
      'Siembra franjas de limoncillo, vetiver o plantas aromáticas siguiendo las curvas de nivel.',
      'Las flores de caléndula, ruda y cilantro en los bordes atraen insectos benéficos que comen pulgones.',
      'Revisa el impacto vecinal en la pestaña Agua & Vecinos para coordinar toda la ladera.'
    ],
    stepsEn: [
      'Plant strips of vetiver, lemongrass, or herbs along contour lines across slopes.',
      'Marigold, rue, and cilantro borders attract beneficial insects that eat aphids.',
      'Track hillside neighbor impact in the Water & Neighbors D3 tab.'
    ]
  }
];

export const KnowledgeAndSustainabilityHub: React.FC<KnowledgeAndSustainabilityHubProps> = ({
  lang,
  selectedParcel,
  liveNasaData,
  activeRotation,
  simulationMetrics,
  referenceParcels,
  onSpeak,
  stopSpeak,
  voiceActive,
  activeVoiceSource
}) => {
  const [section, setSection] = useState<HubSection>('glosario-tecnico');
  const [glossarySearch, setGlossarySearch] = useState<string>('');
  const [glossaryTopic, setGlossaryTopic] = useState<GlossaryTopic>('todos');
  const [pestSearch, setPestSearch] = useState<string>('');
  const [farmHectares, setFarmHectares] = useState<number>(2);
  const [roofAreaM2, setRoofAreaM2] = useState<number>(80);

  const filteredGlossaryItems = useMemo(() => {
    const q = glossarySearch.trim().toLowerCase();
    return LOCAL_KNOWLEDGE_ITEMS.filter((item) => {
      if (item.category !== 'glosario') return false;
      if (glossaryTopic !== 'todos' && item.topic !== glossaryTopic) return false;
      if (!q) return true;
      const haystack = `${item.termEs} ${item.termEn} ${item.tagEs} ${item.tagEn} ${item.bodyEs} ${item.bodyEn} ${item.actionEs} ${item.actionEn}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [glossarySearch, glossaryTopic]);

  const filteredPestItems = useMemo(() => {
    const q = pestSearch.trim().toLowerCase();
    return LOCAL_KNOWLEDGE_ITEMS.filter((item) => {
      if (item.category !== 'plaga') return false;
      if (!q) return true;
      const haystack = `${item.termEs} ${item.termEn} ${item.tagEs} ${item.tagEn} ${item.bodyEs} ${item.bodyEn} ${item.actionEs} ${item.actionEn}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [pestSearch]);

  // Circular economy real calculations tied to active parcel & NASA rainfall
  const circularCalcs = useMemo(() => {
    const residueKgPerHa = Math.round(activeRotation.grainHarvestKgPerHa * 1.15);
    const totalCompostKg = Math.round(residueKgPerHa * farmHectares * 0.48); // ~48% conversion to finished compost
    const monthlyRainLiters = Math.round(liveNasaData.prectotMmDay * 30 * roofAreaM2 * 0.85);
    const fertSavingPct = Math.round(activeRotation.legumeNitrogenSavingRatio * 100);
    const bioNitrogenTotalKg = Math.round(simulationMetrics.biologicalNitrogenKgHa * farmHectares);
    const carbonTonsTotal = Number((activeRotation.carbonSequestrationTonsHa * farmHectares).toFixed(2));
    return {
      totalCompostKg,
      monthlyRainLiters,
      fertSavingPct,
      bioNitrogenTotalKg,
      carbonTonsTotal
    };
  }, [activeRotation, farmHectares, roofAreaM2, liveNasaData.prectotMmDay, simulationMetrics.biologicalNitrogenKgHa]);

  // Local vs Global comparison dataset using live selected parcel + all reference parcels
  const localVsGlobal = useMemo(() => {
    const avgGlobalGwet =
      referenceParcels.reduce((acc, p) => acc + p.gwetroot, 0) / Math.max(1, referenceParcels.length);
    const avgGlobalRain =
      referenceParcels.reduce((acc, p) => acc + p.prectotMmDay, 0) / Math.max(1, referenceParcels.length);
    const avgGlobalTemp =
      referenceParcels.reduce((acc, p) => acc + p.t2mC, 0) / Math.max(1, referenceParcels.length);

    return {
      avgGlobalGwetPct: Math.round(avgGlobalGwet * 100),
      avgGlobalRainMm: Number(avgGlobalRain.toFixed(2)),
      avgGlobalTempC: Number(avgGlobalTemp.toFixed(1)),
      localGwetPct: Math.round(liveNasaData.gwetroot * 100),
      localRainMm: liveNasaData.prectotMmDay,
      localTempC: liveNasaData.t2mC
    };
  }, [referenceParcels, liveNasaData]);

  const sdgCards = [
    {
      code: 'ODS 2',
      titleEs: 'Hambre Cero',
      titleEn: 'Zero Hunger',
      metric: `${simulationMetrics.nutritionCoverage}%`,
      detailEs: `${simulationMetrics.monthsFed} meses de alimento seguro (${simulationMetrics.netUsableHarvestKg.toLocaleString()} kg/ha útiles).`,
      detailEn: `${simulationMetrics.monthsFed} months of household food security (${simulationMetrics.netUsableHarvestKg.toLocaleString()} kg/ha).`
    },
    {
      code: 'ODS 6',
      titleEs: 'Agua Limpia y Saneamiento',
      titleEn: 'Clean Water & Sanitation',
      metric: `${simulationMetrics.infiltratedWaterLitersM2Yr.toLocaleString()} L/m²`,
      detailEs: `Agua infiltrada al año en raíz (${Math.round(liveNasaData.gwetroot * 100)}% humedad SMAP actual).`,
      detailEn: `Annual water infiltrated in root zone (${Math.round(liveNasaData.gwetroot * 100)}% current SMAP wetness).`
    },
    {
      code: 'ODS 12',
      titleEs: 'Producción Responsable',
      titleEn: 'Responsible Production',
      metric: `-${Math.round(activeRotation.legumeNitrogenSavingRatio * 100)}%`,
      detailEs: `Menos fertilizante químico gracias a ${simulationMetrics.biologicalNitrogenKgHa} kg/ha de nitrógeno natural y economía circular.`,
      detailEn: `Lower synthetic fertilizer via ${simulationMetrics.biologicalNitrogenKgHa} kg/ha natural nitrogen and circular composting.`
    },
    {
      code: 'ODS 13',
      titleEs: 'Acción por el Clima',
      titleEn: 'Climate Action',
      metric: `${simulationMetrics.resilienceScore}/100`,
      detailEs: `Resiliencia climática y captura de ${activeRotation.carbonSequestrationTonsHa.toFixed(1)} t CO₂e/ha al año en materia orgánica.`,
      detailEn: `Climate resilience score with ${activeRotation.carbonSequestrationTonsHa.toFixed(1)} t CO₂e/ha/yr carbon sequestered.`
    },
    {
      code: 'ODS 15',
      titleEs: 'Vida de Ecosistemas Terrestres',
      titleEn: 'Life on Land',
      metric: `${simulationMetrics.soilHealthScore}/100`,
      detailEs: `Salud del suelo vivo con cobertura vegetal permanente y ${simulationMetrics.soilOrganicBiomassKgHa.toLocaleString()} kg/ha de biomasa.`,
      detailEn: `Living soil health with permanent ground cover and ${simulationMetrics.soilOrganicBiomassKgHa.toLocaleString()} kg/ha organic biomass.`
    }
  ];

  const handleToggleSpeak = (text: string, id: string) => {
    if (voiceActive && activeVoiceSource === id) {
      stopSpeak();
    } else {
      onSpeak(text, id);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-[#0E1E15] border border-[#243E2F] rounded-2xl p-5 sm:p-7 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-xs font-mono-tabular text-[#4ADE80] font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4 shrink-0" />
              <span>
                {lang === 'es'
                  ? 'ENSEÑANZA · SABER ANCESTRAL · ECONOMÍA CIRCULAR · ODS'
                  : 'EDUCATION · ANCESTRAL WISDOM · CIRCULAR ECONOMY · SDGs'}
              </span>
            </div>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-[#F4F3EE] max-w-3xl">
              {lang === 'es'
                ? 'Conocimiento Rural, Recursos Circulares y Metas ODS'
                : 'Field Knowledge, Circular Resources & SDG Impact'}
            </h2>
            <p className="text-xs sm:text-sm text-[#A7B8AD] max-w-3xl leading-relaxed">
              {lang === 'es'
                ? `Todo lo necesario para entender cada dato de ${selectedParcel.name}, cuidar tu cultivo incluso sin internet, aprovechar residuos y medir el aporte real de tu finca.`
                : `Practical rural guidance, offline pest/remedy database, circular resource calculator, and SDG metrics for ${selectedParcel.name}.`}
            </p>
          </div>

          <div className="text-xs font-mono-tabular text-[#8FA898] flex items-center gap-2 shrink-0">
            <Database className="w-4 h-4 text-[#38BDF8] shrink-0" />
            <span>
              {lang === 'es'
                ? 'Base local disponible sin internet'
                : 'Local database available offline'}
            </span>
          </div>
        </div>

        {/* Section Segmented Navigation */}
        <div className="flex flex-wrap gap-2 pt-2 border-t border-[#1E3528]">
          {(
            [
              {
                id: 'glosario-tecnico',
                icon: BookOpen,
                es: 'Glosario Técnico',
                en: 'Technical Glossary'
              },
              {
                id: 'ciclo-universal',
                icon: RefreshCw,
                es: 'Ciclo Rotativo Universal',
                en: 'Universal Rotation Cycle'
              },
              {
                id: 'plagas-offline',
                icon: Bug,
                es: 'Plagas y Remedios Offline',
                en: 'Offline Pests & Remedies'
              },
              {
                id: 'saber-ancestral',
                icon: Sprout,
                es: 'Saber Ancestral y Enseñanza',
                en: 'Ancestral Wisdom & Learning'
              },
              {
                id: 'economia-circular',
                icon: Recycle,
                es: 'Economía Circular y Recursos',
                en: 'Circular Economy & Resources'
              },
              {
                id: 'ods-global',
                icon: Globe,
                es: 'ODS y Local vs. Global',
                en: 'SDGs & Local vs Global'
              }
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const active = section === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSection(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap shrink-0 border ${
                  active
                    ? 'bg-[#4ADE80] text-[#07130B] border-[#4ADE80]'
                    : 'bg-[#12231A] text-[#C8D6CD] border-[#243E2F] hover:bg-[#193024] hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5 shrink-0" />
                <span>{lang === 'es' ? tab.es : tab.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* SECTION: CICLO ROTATIVO UNIVERSAL Y ADAPTABLE */}
      {section === 'ciclo-universal' && (
        <UniversalCropRotationCycle
          lang={lang}
          parcel={{
            id: selectedParcel.id,
            name: selectedParcel.name,
            country: selectedParcel.country,
            altitudeM: selectedParcel.altitudeM,
            t2mC: liveNasaData.t2mC,
            prectotMmDay: liveNasaData.prectotMmDay,
            gwetroot: liveNasaData.gwetroot
          }}
          onSpeak={onSpeak}
          stopSpeak={stopSpeak}
          voiceActive={voiceActive}
          activeVoiceSource={activeVoiceSource}
        />
      )}

      {/* SECTION 1: GLOSARIO TÉCNICO EN LENGUAJE SENCILLO */}
      {section === 'glosario-tecnico' && (
        <div className="bg-[#0E1E15] border border-[#243E2F] rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-3 border-b border-[#1E3528]">
            <div className="space-y-1">
              <div className="text-[11px] font-mono-tabular text-[#38BDF8] font-semibold">
                {lang === 'es'
                  ? 'GLOSARIO TÉCNICO · DICCIONARIO DE CAMPO'
                  : 'TECHNICAL GLOSSARY · PLAIN FIELD GUIDE'}
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F4F3EE]">
                {lang === 'es'
                  ? 'Glosario Técnico en Lenguaje Sencillo'
                  : 'Technical Glossary in Plain Farmer Language'}
              </h3>
              <p className="text-xs sm:text-sm text-[#B8C7BD] max-w-2xl leading-relaxed">
                {lang === 'es'
                  ? 'Traducimos los nombres científicos y satelitales (KcFactor, Evapotranspiración, Pendiente SRTM, Niveles Mascon GRACE-FO) a palabras claras y acciones concretas para tu parcela.'
                  : 'Satellite and agronomy terms (KcFactor, Evapotranspiration, SRTM Slope, GRACE-FO Mascon) explained in plain words with practical field actions.'}
              </p>
            </div>
            <div className="text-xs font-mono-tabular text-[#4ADE80] shrink-0">
              {filteredGlossaryItems.length}{' '}
              {lang === 'es' ? 'términos explicados' : 'terms explained'}
            </div>
          </div>

          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#8FA898] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={glossarySearch}
                onChange={(e) => setGlossarySearch(e.target.value)}
                placeholder={
                  lang === 'es'
                    ? 'Buscar término técnico (ej. KcFactor, Evapotranspiración, SRTM, Mascon, GWETROOT)...'
                    : 'Search technical term (e.g. KcFactor, Evapotranspiration, SRTM, Mascon)...'
                }
                className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08120D] border border-[#243E2F] text-sm text-[#F4F3EE] placeholder-[#6E8577] focus:border-[#4ADE80] outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'todos', es: 'Todos los términos', en: 'All terms' },
                  { id: 'agua-clima', es: 'Agua y Clima', en: 'Water & Climate' },
                  { id: 'satelites-relieve', es: 'Satélites y Terreno', en: 'Satellites & Relief' },
                  { id: 'suelo-cultivo', es: 'Suelo y Cultivos', en: 'Soil & Crops' }
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setGlossaryTopic(t.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium cursor-pointer border whitespace-nowrap shrink-0 transition-colors ${
                    glossaryTopic === t.id
                      ? 'bg-[#1D3B2A] text-[#4ADE80] border-[#4ADE80]'
                      : 'bg-[#0B1610] text-[#9FB0A5] border-[#213B2C] hover:text-white'
                  }`}
                >
                  {lang === 'es' ? t.es : t.en}
                </button>
              ))}
            </div>
          </div>

          {filteredGlossaryItems.length === 0 ? (
            <div className="p-6 text-center text-sm text-[#8FA898] border border-[#1E3528] rounded-xl bg-[#0B1610]">
              {lang === 'es'
                ? 'No encontramos ese término en el glosario. Prueba buscando "KcFactor", "Evapotranspiración", "SRTM" o "Mascon".'
                : 'No matching glossary terms found. Try searching "KcFactor", "Evapotranspiration", "SRTM", or "Mascon".'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredGlossaryItems.map((item) => {
                const voiceId = `hub-item-${item.id}`;
                const speaking = voiceActive && activeVoiceSource === voiceId;
                const fullSpeech =
                  lang === 'es'
                    ? `${item.termEs}. ${item.bodyEs} En el campo: ${item.actionEs}`
                    : `${item.termEn}. ${item.bodyEn} Field tip: ${item.actionEn}`;

                return (
                  <article
                    key={item.id}
                    className="p-4 sm:p-5 rounded-xl bg-[#0B1610] border border-[#1E3528] flex flex-col justify-between gap-3.5"
                  >
                    <div className="space-y-3">
                      <GlossaryVisualDiagram termId={item.id} lang={lang} />

                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono-tabular text-[#8FA898]">
                          <span className="inline-flex items-center gap-1.5">
                            <BookOpen className="w-3.5 h-3.5 shrink-0 text-[#38BDF8]" />
                            <span>{lang === 'es' ? item.tagEs : item.tagEn}</span>
                          </span>
                        </div>
                        <h4 className="font-display text-base sm:text-lg font-bold text-[#F4F3EE]">
                          {lang === 'es' ? item.termEs : item.termEn}
                        </h4>
                        <p className="text-xs sm:text-sm text-[#C8D6CD] leading-relaxed">
                          {lang === 'es' ? item.bodyEs : item.bodyEn}
                        </p>
                        <p className="text-xs text-[#4ADE80] leading-relaxed pt-2 border-t border-[#182E22]">
                          <strong>{lang === 'es' ? 'En el campo: ' : 'Field tip: '}</strong>
                          {lang === 'es' ? item.actionEs : item.actionEn}
                        </p>
                      </div>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleToggleSpeak(fullSpeech, voiceId)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                          speaking
                            ? 'bg-[#C85A32] text-white border-[#E09F3E]'
                            : 'bg-[#12231A] text-[#D7E0DA] border-[#243E2F] hover:bg-[#193024]'
                        }`}
                      >
                        {speaking ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 shrink-0" />
                            <span>{lang === 'es' ? 'Detener' : 'Stop'}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-[#E09F3E] shrink-0" />
                            <span>{lang === 'es' ? 'Escuchar' : 'Listen'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: PLAGAS Y REMEDIOS OFFLINE */}
      {section === 'plagas-offline' && (
        <div className="bg-[#0E1E15] border border-[#243E2F] rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 pb-3 border-b border-[#1E3528]">
            <div className="space-y-1">
              <div className="text-[11px] font-mono-tabular text-[#E09F3E] font-semibold">
                {lang === 'es'
                  ? 'BOTIQUÍN DEL CULTIVO · DISPONIBLE SIN SEÑAL'
                  : 'CROP FIRST-AID · AVAILABLE OFFLINE'}
              </div>
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F4F3EE]">
                {lang === 'es'
                  ? 'Plagas, Señales y Remedios Locales'
                  : 'Pests, Symptoms & Local Remedies'}
              </h3>
              <p className="text-xs sm:text-sm text-[#B8C7BD] max-w-2xl leading-relaxed">
                {lang === 'es'
                  ? 'Guía guardada en tu dispositivo para identificar manchas, insectos, asfixia de raíz o heladas y preparar remedios caseros con materiales de la finca.'
                  : 'Locally stored guide to spot leaf spots, pests, root suffocation, or frost and apply farm-made organic remedies.'}
              </p>
            </div>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-[#8FA898] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={pestSearch}
              onChange={(e) => setPestSearch(e.target.value)}
              placeholder={
                lang === 'es'
                  ? 'Buscar síntoma, plaga o remedio (ej. roya, pulgón, helada, ceniza)...'
                  : 'Search symptom, pest, or remedy (e.g. mildew, aphid, frost)...'
              }
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#08120D] border border-[#243E2F] text-sm text-[#F4F3EE] placeholder-[#6E8577] focus:border-[#4ADE80] outline-none"
            />
          </div>

          {filteredPestItems.length === 0 ? (
            <div className="p-6 text-center text-sm text-[#8FA898] border border-[#1E3528] rounded-xl bg-[#0B1610]">
              {lang === 'es'
                ? 'No encontramos resultados con esa palabra. Prueba buscando "roya", "pulgón", "helada" o "amarilla".'
                : 'No matching entries found. Try searching for "mildew", "aphid", or "frost".'}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredPestItems.map((item) => {
                const voiceId = `hub-item-${item.id}`;
                const speaking = voiceActive && activeVoiceSource === voiceId;
                const fullSpeech =
                  lang === 'es'
                    ? `${item.termEs}. ${item.bodyEs} Recomendación práctica: ${item.actionEs}`
                    : `${item.termEn}. ${item.bodyEn} Practical tip: ${item.actionEn}`;

                return (
                  <article
                    key={item.id}
                    className="p-4 sm:p-5 rounded-xl bg-[#0B1610] border border-[#1E3528] flex flex-col justify-between gap-3"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2 text-[11px] font-mono-tabular text-[#8FA898]">
                        <span className="inline-flex items-center gap-1.5">
                          <Bug className="w-3.5 h-3.5 shrink-0 text-[#E09F3E]" />
                          <span>{lang === 'es' ? item.tagEs : item.tagEn}</span>
                        </span>
                      </div>
                      <h4 className="font-display text-base sm:text-lg font-bold text-[#F4F3EE]">
                        {lang === 'es' ? item.termEs : item.termEn}
                      </h4>
                      <p className="text-xs sm:text-sm text-[#C8D6CD] leading-relaxed">
                        {lang === 'es' ? item.bodyEs : item.bodyEn}
                      </p>
                      <p className="text-xs text-[#4ADE80] leading-relaxed pt-2 border-t border-[#182E22]">
                        <strong>{lang === 'es' ? 'En el campo: ' : 'Field tip: '}</strong>
                        {lang === 'es' ? item.actionEs : item.actionEn}
                      </p>
                    </div>

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleToggleSpeak(fullSpeech, voiceId)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                          speaking
                            ? 'bg-[#C85A32] text-white border-[#E09F3E]'
                            : 'bg-[#12231A] text-[#D7E0DA] border-[#243E2F] hover:bg-[#193024]'
                        }`}
                      >
                        {speaking ? (
                          <>
                            <VolumeX className="w-3.5 h-3.5 shrink-0" />
                            <span>{lang === 'es' ? 'Detener' : 'Stop'}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3.5 h-3.5 text-[#E09F3E] shrink-0" />
                            <span>{lang === 'es' ? 'Escuchar' : 'Listen'}</span>
                          </>
                        )}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* SECTION 2: SABER ANCESTRAL Y ENSEÑANZA */}
      {section === 'saber-ancestral' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {ANCESTRAL_LESSONS.map((lesson) => {
            const voiceId = `hub-anc-${lesson.id}`;
            const speaking = voiceActive && activeVoiceSource === voiceId;
            const steps = lang === 'es' ? lesson.stepsEs : lesson.stepsEn;
            const speech =
              lang === 'es'
                ? `${lesson.titleEs}. ${lesson.summaryEs} Pasos prácticos: ${steps.join('. ')}`
                : `${lesson.titleEn}. ${lesson.summaryEn} Practical steps: ${steps.join('. ')}`;

            return (
              <article
                key={lesson.id}
                className="bg-[#0E1E15] border border-[#243E2F] rounded-2xl p-5 sm:p-6 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="text-[11px] font-mono-tabular text-[#E09F3E]">
                    {lang === 'es' ? lesson.tagEs : lesson.tagEn}
                  </div>
                  <h3 className="font-display text-lg sm:text-xl font-bold text-[#F4F3EE]">
                    {lang === 'es' ? lesson.titleEs : lesson.titleEn}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#B8C7BD] leading-relaxed">
                    {lang === 'es' ? lesson.summaryEs : lesson.summaryEn}
                  </p>
                  <ul className="space-y-2 pt-2 border-t border-[#1E3528] text-xs sm:text-sm text-[#E4ECE7]">
                    {steps.map((st, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="font-mono-tabular text-[#4ADE80] font-bold shrink-0">
                          0{idx + 1}.
                        </span>
                        <span className="leading-relaxed">{st}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex justify-end pt-2 border-t border-[#1A3124]">
                  <button
                    type="button"
                    onClick={() => handleToggleSpeak(speech, voiceId)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold border cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                      speaking
                        ? 'bg-[#C85A32] text-white border-[#E09F3E]'
                        : 'bg-[#12231A] text-[#F4F3EE] border-[#284635] hover:bg-[#1B3427]'
                    }`}
                  >
                    {speaking ? (
                      <>
                        <VolumeX className="w-3.5 h-3.5 shrink-0" />
                        <span>{lang === 'es' ? 'Detener Cápsula' : 'Stop Lesson'}</span>
                      </>
                    ) : (
                      <>
                        <Volume2 className="w-3.5 h-3.5 text-[#E09F3E] shrink-0" />
                        <span>{lang === 'es' ? 'Escuchar Cápsula' : 'Listen Lesson'}</span>
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {/* SECTION 3: ECONOMÍA CIRCULAR Y APROVECHAMIENTO DE RECURSOS */}
      {section === 'economia-circular' && (
        <div className="bg-[#0E1E15] border border-[#243E2F] rounded-2xl p-5 sm:p-6 space-y-6">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-[#1E3528] pb-4">
            <div className="space-y-1">
              <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F4F3EE]">
                {lang === 'es'
                  ? 'Economía Circular y Aprovechamiento de Recursos en tu Finca'
                  : 'Circular Economy & On-Farm Resource Recovery'}
              </h3>
              <p className="text-xs sm:text-sm text-[#A7B8AD] max-w-2xl">
                {lang === 'es'
                  ? `Cálculo real usando los datos de lluvia NASA de ${selectedParcel.name} (${liveNasaData.prectotMmDay} mm/día) y tu rotación elegida.`
                  : `Calculated from live NASA rainfall at ${selectedParcel.name} (${liveNasaData.prectotMmDay} mm/day) and your active crop rotation.`}
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                handleToggleSpeak(
                  lang === 'es'
                    ? `En tu parcela de ${farmHectares} hectáreas en ${selectedParcel.name}, al no quemar el rastrojo puedes producir aproximadamente ${circularCalcs.totalCompostKg} kilos de compost orgánico por ciclo, fijar ${circularCalcs.bioNitrogenTotalKg} kilos de nitrógeno natural y captar hasta ${circularCalcs.monthlyRainLiters} litros de agua lluvia al mes desde un techo rural de ${roofAreaM2} metros cuadrados.`
                    : `On your ${farmHectares} hectare plot at ${selectedParcel.name}, recycling crop residues yields about ${circularCalcs.totalCompostKg} kg of compost per cycle, ${circularCalcs.bioNitrogenTotalKg} kg of natural nitrogen, and up to ${circularCalcs.monthlyRainLiters} liters of harvested rainwater per month.`,
                  'hub-circular-audio'
                )
              }
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold border cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                voiceActive && activeVoiceSource === 'hub-circular-audio'
                  ? 'bg-[#C85A32] text-white border-[#E09F3E]'
                  : 'bg-[#12231A] text-[#F4F3EE] border-[#284635] hover:bg-[#1B3427]'
              }`}
            >
              <Volume2 className="w-4 h-4 text-[#E09F3E] shrink-0" />
              <span>{lang === 'es' ? 'Escuchar Plan Circular' : 'Listen Circular Plan'}</span>
            </button>
          </div>

          {/* Interactive Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="p-4 rounded-xl bg-[#0B1610] border border-[#1E3528] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-tabular">
                <span className="text-[#C8D6CD]">
                  {lang === 'es' ? 'Tamaño de tu parcela sembrada:' : 'Planted plot size:'}
                </span>
                <span className="text-[#4ADE80] font-bold">{farmHectares} ha</span>
              </div>
              <input
                type="range"
                min={0.5}
                max={15}
                step={0.5}
                value={farmHectares}
                onChange={(e) => setFarmHectares(Number(e.target.value))}
                className="w-full accent-[#4ADE80] cursor-pointer"
              />
            </div>

            <div className="p-4 rounded-xl bg-[#0B1610] border border-[#1E3528] space-y-2">
              <div className="flex items-center justify-between text-xs font-mono-tabular">
                <span className="text-[#C8D6CD]">
                  {lang === 'es' ? 'Área de techo/bodega para captar lluvia:' : 'Roof area for rainwater harvesting:'}
                </span>
                <span className="text-[#38BDF8] font-bold">{roofAreaM2} m²</span>
              </div>
              <input
                type="range"
                min={20}
                max={250}
                step={10}
                value={roofAreaM2}
                onChange={(e) => setRoofAreaM2(Number(e.target.value))}
                className="w-full accent-[#38BDF8] cursor-pointer"
              />
            </div>
          </div>

          {/* Circular Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#0B1610] border border-[#1E3528] space-y-1">
              <div className="text-[11px] font-mono-tabular text-[#8FA898] flex items-center gap-1.5">
                <Recycle className="w-3.5 h-3.5 text-[#4ADE80]" />
                <span>{lang === 'es' ? 'Compost de Rastrojo' : 'Recycled Compost'}</span>
              </div>
              <div className="font-mono-tabular text-2xl font-bold text-[#F4F3EE]">
                {circularCalcs.totalCompostKg.toLocaleString()} kg
              </div>
              <div className="text-[11px] text-[#9FB0A5]">
                {lang === 'es' ? 'Abono orgánico por ciclo sin quemas' : 'Organic fertilizer per cycle'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1610] border border-[#1E3528] space-y-1">
              <div className="text-[11px] font-mono-tabular text-[#8FA898] flex items-center gap-1.5">
                <Droplets className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>{lang === 'es' ? 'Cosecha de Agua Lluvia' : 'Rainwater Harvest'}</span>
              </div>
              <div className="font-mono-tabular text-2xl font-bold text-[#38BDF8]">
                {circularCalcs.monthlyRainLiters.toLocaleString()} L
              </div>
              <div className="text-[11px] text-[#9FB0A5]">
                {lang === 'es' ? 'Por mes para riego de huerta y bioinsumos' : 'Monthly reserve for seedlings'}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1610] border border-[#1E3528] space-y-1">
              <div className="text-[11px] font-mono-tabular text-[#8FA898] flex items-center gap-1.5">
                <Leaf className="w-3.5 h-3.5 text-[#4ADE80]" />
                <span>{lang === 'es' ? 'Nitrógeno Biológico' : 'Natural Nitrogen'}</span>
              </div>
              <div className="font-mono-tabular text-2xl font-bold text-[#4ADE80]">
                {circularCalcs.bioNitrogenTotalKg} kg N
              </div>
              <div className="text-[11px] text-[#9FB0A5]">
                {lang === 'es'
                  ? `Ahorro de ${circularCalcs.fertSavingPct}% en fertilizante químico`
                  : `${circularCalcs.fertSavingPct}% chemical fertilizer saved`}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#0B1610] border border-[#1E3528] space-y-1">
              <div className="text-[11px] font-mono-tabular text-[#8FA898] flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#E09F3E]" />
                <span>{lang === 'es' ? 'Carbono en Suelo' : 'Soil Carbon Stored'}</span>
              </div>
              <div className="font-mono-tabular text-2xl font-bold text-[#E09F3E]">
                {circularCalcs.carbonTonsTotal} t CO₂e
              </div>
              <div className="text-[11px] text-[#9FB0A5]">
                {lang === 'es' ? 'Captura anual en tu finca' : 'Annual farm carbon capture'}
              </div>
            </div>
          </div>

          {/* Practical 3-Step Circular Loop */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 border-t border-[#1E3528]">
            {[
              {
                step: 'Ciclo 01',
                titleEs: 'Cero Quemas · Picado de Rastrojo',
                titleEn: 'Zero Burning · Residue Mulching',
                descEs: 'Deja tallos y hojas picadas cubriendo el surco o mézclalos con estiércol para hacer compost en 45–60 días.'
              },
              {
                step: 'Ciclo 02',
                titleEs: 'Captación de Agua + Biol Artesanal',
                titleEn: 'Rainwater Capture + Farm Biol',
                descEs: 'Usa el agua lluvia recolectada del techo para preparar biol con ceniza, melaza y hojas frescas de leguminosas.'
              },
              {
                step: 'Ciclo 03',
                titleEs: 'Suelo Sano · Menor Costo Externo',
                titleEn: 'Healthy Soil · Lower Cash Costs',
                descEs: 'Cada ciclo con leguminosas y compost mejora la esponjosidad del suelo para retener más agua en verano.'
              }
            ].map((c) => (
              <div key={c.step} className="p-4 rounded-xl bg-[#0B1610] border border-[#1E3528] space-y-1.5">
                <div className="text-[11px] font-mono-tabular text-[#E09F3E] font-semibold">{c.step}</div>
                <div className="font-semibold text-sm text-[#F4F3EE]">
                  {lang === 'es' ? c.titleEs : c.titleEn}
                </div>
                <p className="text-xs text-[#9FB0A5] leading-relaxed">{c.descEs}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 4: ODS Y ENFOQUE LOCAL VS GLOBAL */}
      {section === 'ods-global' && (
        <div className="space-y-6">
          {/* ONU ODS Grid */}
          <div className="bg-[#0E1E15] border border-[#243E2F] rounded-2xl p-5 sm:p-6 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E3528] pb-4">
              <div>
                <h3 className="font-display text-xl sm:text-2xl font-bold text-[#F4F3EE]">
                  {lang === 'es'
                    ? 'Aporte de tu Parcela a los Objetivos de Desarrollo Sostenible (ODS)'
                    : 'Your Farm Contribution to UN Sustainable Development Goals (SDGs)'}
                </h3>
                <p className="text-xs sm:text-sm text-[#A7B8AD]">
                  {lang === 'es'
                    ? 'Indicadores calculados directamente con tu simulación activa y datos satelitales de tu finca.'
                    : 'Metrics driven directly by your active crop rotation simulation and satellite readings.'}
                </p>
              </div>

              <button
                type="button"
                onClick={() =>
                  handleToggleSpeak(
                    lang === 'es'
                      ? `Tu finca aporta directamente a cinco Objetivos de Desarrollo Sostenible: En ODS 2 Hambre Cero alcanzas ${simulationMetrics.nutritionCoverage} por ciento de seguridad alimentaria; en ODS 6 Agua Limpia infiltras ${simulationMetrics.infiltratedWaterLitersM2Yr} litros por metro cuadrado al año; y en ODS 13 Acción por el Clima logras ${simulationMetrics.resilienceScore} puntos de resiliencia.`
                      : `Your farm contributes to five SDGs: ${simulationMetrics.nutritionCoverage}% food security under SDG 2, ${simulationMetrics.infiltratedWaterLitersM2Yr} liters per square meter infiltrated under SDG 6, and ${simulationMetrics.resilienceScore} resilience points under SDG 13.`,
                    'hub-ods-audio'
                  )
                }
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border cursor-pointer whitespace-nowrap shrink-0 transition-colors ${
                  voiceActive && activeVoiceSource === 'hub-ods-audio'
                    ? 'bg-[#C85A32] text-white border-[#E09F3E]'
                    : 'bg-[#12231A] text-[#F4F3EE] border-[#284635] hover:bg-[#1B3427]'
                }`}
              >
                <Volume2 className="w-4 h-4 text-[#E09F3E] shrink-0" />
                <span>{lang === 'es' ? 'Escuchar Impacto ODS' : 'Listen SDG Impact'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {sdgCards.map((sdg) => (
                <div
                  key={sdg.code}
                  className="p-4 rounded-xl bg-[#0B1610] border border-[#1E3528] flex flex-col justify-between gap-2"
                >
                  <div className="space-y-1">
                    <div className="text-xs font-mono-tabular text-[#4ADE80] font-bold">{sdg.code}</div>
                    <div className="font-display text-base font-bold text-[#F4F3EE]">
                      {lang === 'es' ? sdg.titleEs : sdg.titleEn}
                    </div>
                  </div>
                  <div className="font-mono-tabular text-2xl font-bold text-[#E09F3E] py-1">
                    {sdg.metric}
                  </div>
                  <p className="text-xs text-[#9FB0A5] leading-relaxed">
                    {lang === 'es' ? sdg.detailEs : sdg.detailEn}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Enfoque Local vs Global */}
          <div className="bg-[#0E1E15] border border-[#243E2F] rounded-2xl p-5 sm:p-6 space-y-4">
            <div className="space-y-1">
              <h3 className="font-display text-lg sm:text-xl font-bold text-[#F4F3EE]">
                {lang === 'es'
                  ? 'Enfoque Local vs. Global: Tu Parcela frente a Zonas Agrícolas del Mundo'
                  : 'Local vs. Global Focus: Your Plot Compared Across Global Agricultural Regions'}
              </h3>
              <p className="text-xs sm:text-sm text-[#A7B8AD]">
                {lang === 'es'
                  ? 'Compara la humedad del suelo y lluvia diaria de tu vereda frente al promedio de las regiones monitoreadas.'
                  : 'Compare your local soil wetness and rainfall against monitored reference regions.'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-[#0B1610] border border-[#1E3528] space-y-1">
                <div className="text-xs font-mono-tabular text-[#8FA898]">
                  {lang === 'es' ? 'Humedad en Raíz (Local vs Global)' : 'Root Moisture (Local vs Global)'}
                </div>
                <div className="font-mono-tabular text-xl font-bold text-[#F4F3EE]">
                  {localVsGlobal.localGwetPct}% <span className="text-xs text-[#8FA898]">vs {localVsGlobal.avgGlobalGwetPct}% prom.</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#0B1610] border border-[#1E3528] space-y-1">
                <div className="text-xs font-mono-tabular text-[#8FA898]">
                  {lang === 'es' ? 'Lluvia Diaria (Local vs Global)' : 'Daily Rain (Local vs Global)'}
                </div>
                <div className="font-mono-tabular text-xl font-bold text-[#38BDF8]">
                  {localVsGlobal.localRainMm} mm <span className="text-xs text-[#8FA898]">vs {localVsGlobal.avgGlobalRainMm} mm</span>
                </div>
              </div>
              <div className="p-4 rounded-xl bg-[#0B1610] border border-[#1E3528] space-y-1">
                <div className="text-xs font-mono-tabular text-[#8FA898]">
                  {lang === 'es' ? 'Temperatura Media (Local vs Global)' : 'Mean Temp (Local vs Global)'}
                </div>
                <div className="font-mono-tabular text-xl font-bold text-[#E09F3E]">
                  {localVsGlobal.localTempC}°C <span className="text-xs text-[#8FA898]">vs {localVsGlobal.avgGlobalTempC}°C</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto border border-[#1E3528] rounded-xl">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B1610] text-[#8FA898] font-mono-tabular border-b border-[#1E3528]">
                  <tr>
                    <th className="py-2.5 px-3">{lang === 'es' ? 'Parcela / Región' : 'Plot / Region'}</th>
                    <th className="py-2.5 px-3">{lang === 'es' ? 'Altitud' : 'Altitude'}</th>
                    <th className="py-2.5 px-3">{lang === 'es' ? 'Humedad Raíz' : 'Root Moisture'}</th>
                    <th className="py-2.5 px-3">{lang === 'es' ? 'Lluvia/día' : 'Rain/day'}</th>
                    <th className="py-2.5 px-3">{lang === 'es' ? 'Temp.' : 'Temp'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#182E22] bg-[#0B1610]/70 font-mono-tabular">
                  <tr className="bg-[#13291D] text-[#F4F3EE]">
                    <td className="py-2.5 px-3 font-sans font-semibold">
                      {selectedParcel.name} ({selectedParcel.country}) · {lang === 'es' ? 'Tu finca' : 'Yours'}
                    </td>
                    <td className="py-2.5 px-3">{selectedParcel.altitudeM} m</td>
                    <td className="py-2.5 px-3 text-[#4ADE80] font-bold">{localVsGlobal.localGwetPct}%</td>
                    <td className="py-2.5 px-3 text-[#38BDF8]">{localVsGlobal.localRainMm} mm</td>
                    <td className="py-2.5 px-3 text-[#E09F3E]">{localVsGlobal.localTempC}°C</td>
                  </tr>
                  {referenceParcels
                    .filter((p) => p.id !== selectedParcel.id)
                    .map((p) => (
                      <tr key={p.id} className="text-[#C8D6CD]">
                        <td className="py-2.5 px-3 font-sans">
                          {p.name} ({p.country})
                        </td>
                        <td className="py-2.5 px-3">{p.altitudeM} m</td>
                        <td className="py-2.5 px-3">{Math.round(p.gwetroot * 100)}%</td>
                        <td className="py-2.5 px-3">{p.prectotMmDay} mm</td>
                        <td className="py-2.5 px-3">{p.t2mC}°C</td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
