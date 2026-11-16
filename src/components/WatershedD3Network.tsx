import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import {
  Users,
  Droplets,
  ShieldCheck,
  Sprout,
  Sparkles,
  Info,
  Volume2,
  VolumeX,
  HelpCircle,
  ArrowDown,
  CheckCircle2,
  AlertTriangle,
  Play,
  Pause
} from 'lucide-react';

export interface WatershedD3NetworkProps {
  lang: 'es' | 'en';
  selectedRotationId: string;
  selectedRotationName: string;
  parcelResilience: number;
  nasaGwetroot: number;
  nasaPrecipMmDay: number;
  countryName: string;
  compact?: boolean;
  onSpeak?: (text: string, sourceId: string) => void;
  stopSpeak?: () => void;
  voiceActive?: boolean;
  activeVoiceSource?: string | null;
}

interface FarmNode extends d3.SimulationNodeDatum {
  id: string;
  shortCode: string;
  avatarIcon: string;
  farmerNameEs: string;
  farmerNameEn: string;
  locationEs: string;
  locationEn: string;
  subLabelEs: string;
  subLabelEn: string;
  howItAffectsYouEs: string;
  howItAffectsYouEn: string;
  role: 'farmer' | 'neighbor' | 'watershed';
  adopted: boolean;
  elevationZone: 'upper' | 'mid' | 'lower';
  targetX: number;
  targetY: number;
  radius: number;
}

interface FarmLink extends d3.SimulationLinkDatum<FarmNode> {
  id: string;
  source: string;
  target: string;
  flowType: 'water-soil' | 'watershed-stream';
}

const INITIAL_NEIGHBOR_IDS = ['n1', 'n2', 'n3', 'n4', 'n5', 'n6'];

export const WatershedD3Network: React.FC<WatershedD3NetworkProps> = ({
  lang,
  selectedRotationId,
  selectedRotationName,
  parcelResilience,
  nasaGwetroot,
  nasaPrecipMmDay,
  countryName,
  compact = false,
  onSpeak,
  stopSpeak,
  voiceActive = false,
  activeVoiceSource = null
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  // Track which neighboring parcels have adopted conservation crop rotations
  const [adoptedNeighbors, setAdoptedNeighbors] = useState<string[]>([
    'n1',
    'n2',
    'n3',
    'n4'
  ]);
  const [selectedNodeId, setSelectedNodeId] = useState<string>('farmer');
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [showHowItWorksGuide, setShowHowItWorksGuide] = useState<boolean>(false);
  const [localIsSpeaking, setLocalIsSpeaking] = useState<boolean>(false);
  const [isAnimationActive, setIsAnimationActive] = useState<boolean>(true);

  const isFarmerSustainable =
    selectedRotationId !== 'monocultivo-control' &&
    selectedRotationId !== 'monocultivo-riesgo';
  const adoptedCount = adoptedNeighbors.length;
  const totalNeighbors = INITIAL_NEIGHBOR_IDS.length;

  const toggleNeighbor = (neighborId: string) => {
    setAdoptedNeighbors((prev) =>
      prev.includes(neighborId)
        ? prev.filter((id) => id !== neighborId)
        : [...prev, neighborId]
    );
    setSelectedNodeId(neighborId);
  };

  const setPresetAdoption = (count: number) => {
    setAdoptedNeighbors(INITIAL_NEIGHBOR_IDS.slice(0, count));
  };

  // Scientifically grounded watershed soil & water conservation metrics from NASA data + neighbor network
  const communityMetrics = useMemo(() => {
    const adoptionRatio = adoptedCount / totalNeighbors; // 0 to 1
    const farmerFactor = isFarmerSustainable ? 1 : 0.35;

    const baseScore = isFarmerSustainable
      ? parcelResilience
      : Math.max(24, parcelResilience - 18);
    const neighborSynergy = Math.round(
      (adoptionRatio * 22 + (isFarmerSustainable ? 6 : -10)) *
        (0.85 + nasaGwetroot * 0.25)
    );
    const watershedResilience = Math.max(
      18,
      Math.min(98, Math.round(baseScore * 0.76 + neighborSynergy))
    );

    const upperAdopted =
      (adoptedNeighbors.includes('n1') ? 1 : 0) +
      (adoptedNeighbors.includes('n2') ? 1 : 0);
    const runoffReductionPct = Math.round(
      (isFarmerSustainable ? 9 : 2) + adoptionRatio * 24 + upperAdopted * 4
    );
    const extraWaterLitersPerM2 = Math.round(
      nasaPrecipMmDay * 365 * (runoffReductionPct / 100) * 0.35
    );

    const erosionControlPct = Math.round(
      (isFarmerSustainable ? 16 : 4) +
        adoptionRatio * 48 * farmerFactor +
        adoptionRatio * 12
    );

    const soilHealthGainPct = Math.round(
      (isFarmerSustainable ? 12 : 2) + adoptionRatio * 29
    );
    const organicMatterTonsHa = Number(
      ((isFarmerSustainable ? 3.2 : 0.5) + adoptedCount * 2.4).toFixed(1)
    );

    return {
      watershedResilience,
      runoffReductionPct,
      extraWaterLitersPerM2,
      erosionControlPct,
      soilHealthGainPct,
      organicMatterTonsHa
    };
  }, [
    adoptedNeighbors,
    adoptedCount,
    totalNeighbors,
    isFarmerSustainable,
    parcelResilience,
    nasaGwetroot,
    nasaPrecipMmDay
  ]);

  // Perfectly spaced coordinates in a 1000x620 canvas:
  // - Left Column (x: 18 - 230) is exclusively for huge high-contrast Zone Banners.
  // - Node Columns (x: 370, 610, 850) have 240px horizontal spacing.
  // - Vertical tiers (y: 105, 310, 515) have 205px vertical spacing.
  // - Right Column (x: 955 - 985) is for the vertical water flow channel.
  // Result: ZERO OVERLAPS, 100% READABILITY.
  const { nodesData, linksData } = useMemo(() => {
    const nodes: FarmNode[] = [
      {
        id: 'n1',
        shortCode: 'V1',
        avatarIcon: '🌾',
        farmerNameEs: 'Don Ramón (Parcela 1)',
        farmerNameEn: 'Farmer Ramon (Plot 1)',
        locationEs: 'Loma Alta Norte · 18° pendiente',
        locationEn: 'Upper North Ridge · 18° slope',
        subLabelEs: adoptedNeighbors.includes('n1')
          ? '✓ Suelo Fuerte (Con Raíces)'
          : '⚠ Tierra Pelada (Con Deslaves)',
        subLabelEn: adoptedNeighbors.includes('n1')
          ? '✓ Rooted Living Soil'
          : '⚠ Bare Soil (Erosion Risk)',
        howItAffectsYouEs: adoptedNeighbors.includes('n1')
          ? 'Al sembrar frijol y cobertura viva arriba, sus raíces frenan los aguaceros y evitan que el agua baje arrastrando lodo sobre tu campo.'
          : 'Al dejar la tierra descubierta arriba, la lluvia baja como torrente arrastrando tierra fértil y tapando los canales de tu parcela.',
        howItAffectsYouEn: adoptedNeighbors.includes('n1')
          ? 'By planting beans and living cover on the ridge, deep roots slow heavy rain and prevent mudslides from reaching your plot.'
          : 'Leaving soil bare on the ridge creates rushing mud torrents that erode soil and clog drainage channels below.',
        role: 'neighbor',
        adopted: adoptedNeighbors.includes('n1'),
        elevationZone: 'upper',
        targetX: 470,
        targetY: 105,
        radius: 30
      },
      {
        id: 'n2',
        shortCode: 'V2',
        avatarIcon: '🥔',
        farmerNameEs: 'Doña Elena (Parcela 2)',
        farmerNameEn: 'Farmer Elena (Plot 2)',
        locationEs: 'Loma Alta Noreste · 18° pendiente',
        locationEn: 'Upper NE Ridge · 18° slope',
        subLabelEs: adoptedNeighbors.includes('n2')
          ? '✓ Suelo Fuerte (Con Raíces)'
          : '⚠ Tierra Pelada (Con Deslaves)',
        subLabelEn: adoptedNeighbors.includes('n2')
          ? '✓ Rooted Living Soil'
          : '⚠ Bare Soil (Erosion Risk)',
        howItAffectsYouEs: adoptedNeighbors.includes('n2')
          ? 'Sus terrazas con abono verde hacen que el agua de lluvia se filtre directo al subsuelo, recargando los pozos para los meses secos.'
          : 'Sin raíces ni abono verde, el agua se escurre de golpe en vez de filtrarse, aumentando la sequía de verano en toda la comunidad.',
        howItAffectsYouEn: adoptedNeighbors.includes('n2')
          ? 'Green manure and terraces infiltrate rainwater into the subsoil, recharging community wells for dry months.'
          : 'Without roots or green manure, rain rushes off instead of soaking in, worsening summer drought for everyone.',
        role: 'neighbor',
        adopted: adoptedNeighbors.includes('n2'),
        elevationZone: 'upper',
        targetX: 750,
        targetY: 105,
        radius: 30
      },
      {
        id: 'n3',
        shortCode: 'V3',
        avatarIcon: '🌽',
        farmerNameEs: 'Don Mateo (Parcela 3)',
        farmerNameEn: 'Farmer Mateo (Plot 3)',
        locationEs: 'Ladera Media Oeste · 9° pendiente',
        locationEn: 'Mid West Slope · 9° slope',
        subLabelEs: adoptedNeighbors.includes('n3')
          ? '✓ Suelo Fuerte (Con Raíces)'
          : '⚠ Tierra Pelada (Con Deslaves)',
        subLabelEn: adoptedNeighbors.includes('n3')
          ? '✓ Rooted Living Soil'
          : '⚠ Bare Soil (Erosion Risk)',
        howItAffectsYouEs: adoptedNeighbors.includes('n3')
          ? 'Está pegado a tu lindero oeste. Rotar maíz con leguminosas corta el gusano cogollero para que las plagas no brinquen a tu siembra.'
          : 'El monocultivo repetido en su terreno multiplica las plagas del suelo que cruzan directo hacia tu parcela.',
        howItAffectsYouEn: adoptedNeighbors.includes('n3')
          ? 'Direct neighbor to your west. Rotating maize with legumes breaks worm cycles so pests do not jump into your field.'
          : 'Repeated monoculture next door breeds soil pests that readily cross over into your crops.',
        role: 'neighbor',
        adopted: adoptedNeighbors.includes('n3'),
        elevationZone: 'mid',
        targetX: 370,
        targetY: 310,
        radius: 30
      },
      {
        id: 'farmer',
        shortCode: lang === 'es' ? 'TÚ' : 'YOU',
        avatarIcon: '⭐',
        farmerNameEs: '¡TU PARCELA AGRÍCOLA!',
        farmerNameEn: 'YOUR AGRICULTURAL PLOT!',
        locationEs: `Ladera Media Central · ${countryName}`,
        locationEn: `Mid Central Slope · ${countryName}`,
        subLabelEs: isFarmerSustainable
          ? '★ Rotación Activa y Fuerte'
          : '⚠ Monocultivo Exhaustivo',
        subLabelEn: isFarmerSustainable
          ? '★ Active Resilient Rotation'
          : '⚠ Exhaustive Monoculture',
        howItAffectsYouEs: `Tu estrategia: "${selectedRotationName}". Estás en el centro de la ladera: aprovechas el agua limpia que baja de la loma alta y proteges al valle de abajo.`,
        howItAffectsYouEn: `Your strategy: "${selectedRotationName}". Centered on the slope: catching filtered water from above and safeguarding the valley below.`,
        role: 'farmer',
        adopted: isFarmerSustainable,
        elevationZone: 'mid',
        targetX: 610,
        targetY: 310,
        radius: 38
      },
      {
        id: 'n4',
        shortCode: 'V4',
        avatarIcon: '🌿',
        farmerNameEs: 'Doña Sofía (Parcela 4)',
        farmerNameEn: 'Farmer Sofia (Plot 4)',
        locationEs: 'Ladera Media Este · 9° pendiente',
        locationEn: 'Mid East Slope · 9° slope',
        subLabelEs: adoptedNeighbors.includes('n4')
          ? '✓ Suelo Fuerte (Con Raíces)'
          : '⚠ Tierra Pelada (Con Deslaves)',
        subLabelEn: adoptedNeighbors.includes('n4')
          ? '✓ Rooted Living Soil'
          : '⚠ Bare Soil (Erosion Risk)',
        howItAffectsYouEs: adoptedNeighbors.includes('n4')
          ? 'Su cobertura vegetal densa mantiene fresco el microclima, bajando la temperatura del suelo y evitando que el viento caliente reseque tu campo.'
          : 'Su tierra desnuda y caliente eleva la evaporación por viento, secando la humedad superficial en tu lindero este.',
        howItAffectsYouEn: adoptedNeighbors.includes('n4')
          ? 'Her dense cover crop cools the local microclimate, lowering soil temperature and preventing hot wind from drying your soil.'
          : 'Bare hot soil increases wind evaporation, drying out moisture along your eastern boundary.',
        role: 'neighbor',
        adopted: adoptedNeighbors.includes('n4'),
        elevationZone: 'mid',
        targetX: 850,
        targetY: 310,
        radius: 30
      },
      {
        id: 'n5',
        shortCode: 'V5',
        avatarIcon: '🥕',
        farmerNameEs: 'Don Andrés (Parcela 5)',
        farmerNameEn: 'Farmer Andres (Plot 5)',
        locationEs: 'Bajío Suroeste · 2° pendiente',
        locationEn: 'Lower SW Valley · 2° slope',
        subLabelEs: adoptedNeighbors.includes('n5')
          ? '✓ Suelo Fuerte (Con Raíces)'
          : '⚠ Tierra Pelada (Con Deslaves)',
        subLabelEn: adoptedNeighbors.includes('n5')
          ? '✓ Rooted Living Soil'
          : '⚠ Bare Soil (Erosion Risk)',
        howItAffectsYouEs: adoptedNeighbors.includes('n5')
          ? 'En la zona baja, sus zanjas vivas reciben el agua limpia de tu parcela y aportan nitrógeno natural al suelo compartido.'
          : 'El suelo compactado en la zona baja hace que el agua se estanque y pudra las raíces durante temporales lluviosos.',
        howItAffectsYouEn: adoptedNeighbors.includes('n5')
          ? 'In the valley, living trenches receive clean filtered water from your field and enrich shared soil fertility.'
          : 'Compacted soil below causes water to pool and rot plant roots during prolonged rainy periods.',
        role: 'neighbor',
        adopted: adoptedNeighbors.includes('n5'),
        elevationZone: 'lower',
        targetX: 370,
        targetY: 515,
        radius: 30
      },
      {
        id: 'watershed',
        shortCode: `${communityMetrics.watershedResilience}pt`,
        avatarIcon: '💧',
        farmerNameEs: 'Acuífero y Arroyo Común',
        farmerNameEn: 'Shared Stream & Aquifer',
        locationEs: 'Fondo del Valle · Agua de Todos',
        locationEn: 'Valley Bottom · Common Water',
        subLabelEs:
          communityMetrics.watershedResilience >= 65
            ? '● Agua Limpia y Permanente'
            : '▲ En Riesgo de Secarse',
        subLabelEn:
          communityMetrics.watershedResilience >= 65
            ? '● Clean & Steady Water'
            : '▲ Risk of Drying Out',
        howItAffectsYouEs:
          communityMetrics.watershedResilience >= 65
            ? '¡Gran trabajo vecinal! La microcuenca almacena suficiente agua en el subsuelo. Los pozos y el arroyo común tendrán agua incluso si no llueve en semanas.'
            : '¡Atención! La falta de cobertura vegetal en la ladera hace que el agua se escape en torrentes de lodo. El pozo común corre riesgo de secarse en verano.',
        howItAffectsYouEn:
          communityMetrics.watershedResilience >= 65
            ? 'Great community work! The watershed stores abundant subsoil water. Shared wells and streams will stay hydrated during dry spells.'
            : 'Warning! Lack of cover crops lets water escape as mud torrents. Shared community wells risk drying up in summer.',
        role: 'watershed',
        adopted: communityMetrics.watershedResilience >= 65,
        elevationZone: 'lower',
        targetX: 610,
        targetY: 515,
        radius: 36
      },
      {
        id: 'n6',
        shortCode: 'V6',
        avatarIcon: '🌳',
        farmerNameEs: 'Doña Carmen (Parcela 6)',
        farmerNameEn: 'Farmer Carmen (Plot 6)',
        locationEs: 'Bajío Sureste junto al arroyo',
        locationEn: 'Lower SE Stream Bank',
        subLabelEs: adoptedNeighbors.includes('n6')
          ? '✓ Suelo Fuerte (Con Raíces)'
          : '⚠ Tierra Pelada (Con Deslaves)',
        subLabelEn: adoptedNeighbors.includes('n6')
          ? '✓ Rooted Living Soil'
          : '⚠ Bare Soil (Erosion Risk)',
        howItAffectsYouEs: adoptedNeighbors.includes('n6')
          ? 'Sus árboles frutales y pastos de corte protegen la orilla del arroyo, frenando el desborde en tormentas fuertes.'
          : 'Sin vegetación en la orilla, las lluvias rompen el borde del arroyo y el agua anega las parcelas bajas.',
        howItAffectsYouEn: adoptedNeighbors.includes('n6')
          ? 'Her fruit trees and pasture buffer the stream bank, preventing flooding during violent storms.'
          : 'Without riparian plants, storms erode stream banks and flood surrounding fields.',
        role: 'neighbor',
        adopted: adoptedNeighbors.includes('n6'),
        elevationZone: 'lower',
        targetX: 850,
        targetY: 515,
        radius: 30
      }
    ];

    const links: FarmLink[] = [
      { id: 'l-n1-farmer', source: 'n1', target: 'farmer', flowType: 'water-soil' },
      { id: 'l-n2-farmer', source: 'n2', target: 'farmer', flowType: 'water-soil' },
      { id: 'l-n1-n3', source: 'n1', target: 'n3', flowType: 'water-soil' },
      { id: 'l-n2-n4', source: 'n2', target: 'n4', flowType: 'water-soil' },
      { id: 'l-n1-n2', source: 'n1', target: 'n2', flowType: 'water-soil' },
      { id: 'l-n3-farmer', source: 'n3', target: 'farmer', flowType: 'water-soil' },
      { id: 'l-n4-farmer', source: 'n4', target: 'farmer', flowType: 'water-soil' },
      { id: 'l-n3-n5', source: 'n3', target: 'n5', flowType: 'water-soil' },
      { id: 'l-n4-n6', source: 'n4', target: 'n6', flowType: 'water-soil' },
      { id: 'l-farmer-n5', source: 'farmer', target: 'n5', flowType: 'water-soil' },
      { id: 'l-farmer-n6', source: 'farmer', target: 'n6', flowType: 'water-soil' },
      { id: 'l-farmer-watershed', source: 'farmer', target: 'watershed', flowType: 'watershed-stream' },
      { id: 'l-n5-watershed', source: 'n5', target: 'watershed', flowType: 'watershed-stream' },
      { id: 'l-n6-watershed', source: 'n6', target: 'watershed', flowType: 'watershed-stream' }
    ];

    return { nodesData: nodes, linksData: links };
  }, [
    adoptedNeighbors,
    isFarmerSustainable,
    selectedRotationName,
    countryName,
    communityMetrics.watershedResilience,
    lang
  ]);

  const watershedVoiceSourceId = compact ? 'watershed-d3-compact' : 'watershed-d3-full';
  const isSpeaking = onSpeak ? voiceActive && activeVoiceSource === watershedVoiceSourceId : localIsSpeaking;

  // Voice narration helper: uses unified ElevenLabs / Google Male TTS when provided, with male Web Speech fallback
  const handlePlayVoiceGuide = () => {
    const selectedNode =
      nodesData.find((n) => n.id === selectedNodeId) ||
      nodesData.find((n) => n.id === 'farmer')!;

    const textToSpeak =
      lang === 'es'
        ? `Red vecinal animada de la microcuenca. El agua de lluvia baja desde la Loma Alta, pasa por tu parcela en la ladera media, y llega al arroyo común en el valle. Actualmente, ${adoptedCount} de 6 vecinos están cuidando la tierra. Resiliencia comunitaria: ${communityMetrics.watershedResilience} puntos. ${selectedNode.farmerNameEs}. ${selectedNode.locationEs}. ${selectedNode.howItAffectsYouEs}`
        : `Animated hillside community watershed network. Rainwater flows down from the Upper Ridge, through your plot on the mid-slope, down to the shared valley aquifer. Currently, ${adoptedCount} of 6 neighbors are protecting the soil. Resilience: ${communityMetrics.watershedResilience} points. ${selectedNode.farmerNameEn}. ${selectedNode.locationEn}. ${selectedNode.howItAffectsYouEn}`;

    if (onSpeak) {
      if (isSpeaking && stopSpeak) {
        stopSpeak();
      } else {
        onSpeak(textToSpeak, watershedVoiceSourceId);
      }
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (localIsSpeaking) {
      window.speechSynthesis.cancel();
      setLocalIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const voices = window.speechSynthesis.getVoices();
    const prefix = lang === 'es' ? 'es' : 'en';
    const maleRegex = /(male|hombre|masculin|pablo|alvaro|álvaro|jorge|mateo|carlos|diego|raul|raúl|enrique|andres|andrés|alonso|david|daniel|alex|ernesto)/i;
    const femaleRegex = /(female|woman|mujer|femenin|google español|paulina|sabina|helena|monica|mónica|laura|luciana|conchita|marisol|samantha|victoria|karen|zira|sara|sofia|sofía|paloma|carmen)/i;
    const maleVoice =
      voices.find((v) => v.lang.toLowerCase().startsWith(prefix) && maleRegex.test(v.name) && !femaleRegex.test(v.name)) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(prefix) && !femaleRegex.test(v.name));

    if (maleVoice) {
      utterance.voice = maleVoice;
      utterance.lang = maleVoice.lang;
      utterance.pitch = 0.92;
    } else {
      utterance.lang = lang === 'es' ? 'es-MX' : 'en-US';
      utterance.pitch = 0.72;
    }
    utterance.rate = 0.95;

    utterance.onend = () => setLocalIsSpeaking(false);
    utterance.onerror = () => setLocalIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setLocalIsSpeaking(true);
  };

  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  // D3 Rendering with animated streams, flowing water particles, high-contrast zone badges, and clean layout
  useEffect(() => {
    const svgElement = svgRef.current;
    if (!svgElement) return;

    const width = 1000;
    const height = compact ? 540 : 620;

    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();

    // Defs: styles, markers, and animations
    const defs = svg.append('defs');

    // Add CSS keyframe styles for animated flowing water dashes
    defs.append('style').text(`
      @keyframes waterFlowAnim {
        from { stroke-dashoffset: 24; }
        to { stroke-dashoffset: 0; }
      }
      @keyframes verticalWaterDrop {
        0% { transform: translateY(0); opacity: 0; }
        20% { opacity: 1; }
        80% { opacity: 1; }
        100% { transform: translateY(480px); opacity: 0; }
      }
      .anim-stream-healthy {
        stroke-dasharray: 6 6;
        animation: waterFlowAnim 1.2s linear infinite;
      }
      .anim-stream-degraded {
        stroke-dasharray: 6 6;
        animation: waterFlowAnim 0.7s linear infinite;
      }
      .anim-stream-stopped {
        stroke-dasharray: 6 6;
      }
    `);

    // Glow filter for highlighted water flows on hover
    const glowFilter = defs
      .append('filter')
      .attr('id', 'stream-glow')
      .attr('x', '-40%')
      .attr('y', '-40%')
      .attr('width', '180%')
      .attr('height', '180%');
    glowFilter.append('feGaussianBlur').attr('stdDeviation', '4.5').attr('result', 'blur');
    const feMerge = glowFilter.append('feMerge');
    feMerge.append('feMergeNode').attr('in', 'blur');
    feMerge.append('feMergeNode').attr('in', 'SourceGraphic');

    // 1. Three Topographic Elevation Bands (Background Cards)
    const bgGroup = svg.append('g').attr('class', 'watershed-bands');

    const bands = [
      {
        y: 12,
        h: height * 0.3,
        tierNum: '01',
        icon: '⛰️',
        title: lang === 'es' ? 'LOMA ALTA' : 'UPPER RIDGE',
        slopeBadge: '18° Pendiente',
        tagline: lang === 'es' ? 'Zona de Captación de Lluvia' : 'Rain Catchment Zone',
        desc:
          lang === 'es'
            ? 'Donde caen los aguaceros fuertes. Si el suelo tiene raíces, retiene el agua y frena deslaves.'
            : 'Heavy rain intake. Deep living roots soak in rainwater and prevent violent mudslides.',
        fill: '#081C12',
        border: '#1F4730',
        badgeBg: '#143825',
        badgeBorder: '#4ADE80'
      },
      {
        y: height * 0.34,
        h: height * 0.31,
        tierNum: '02',
        icon: '🌿',
        title: lang === 'es' ? 'LADERA MEDIA' : 'MID SLOPE',
        slopeBadge: '9° Pendiente',
        tagline: lang === 'es' ? 'Tu Parcela y Vecinos' : 'Your Field & Neighbors',
        desc:
          lang === 'es'
            ? 'Infiltra el agua dulce hacia la raíz profunda y forma una barrera biológica contra plagas.'
            : 'Infiltrates sweet water deep to roots and creates biological barriers against pests.',
        fill: '#0B2016',
        border: '#244F37',
        badgeBg: '#1B422D',
        badgeBorder: '#E09F3E'
      },
      {
        y: height * 0.68,
        h: height * 0.3,
        tierNum: '03',
        icon: '💧',
        title: lang === 'es' ? 'BAJÍO Y VALLE' : 'LOWER VALLEY',
        slopeBadge: '2° Pendiente',
        tagline: lang === 'es' ? 'Acuífero y Arroyo Común' : 'Shared Aquifer & Stream',
        desc:
          lang === 'es'
            ? 'El agua limpia se almacena bajo tierra para el verano. Abastece a toda la comunidad.'
            : 'Clean water is stored in subsoil for dry months. Supplies water for the whole town.',
        fill: '#071815',
        border: '#1B3F38',
        badgeBg: '#0F3830',
        badgeBorder: '#38BDF8'
      }
    ];

    const bandGroups = bgGroup.selectAll('g').data(bands).join('g');

    // Horizontal Band Background
    bandGroups
      .append('rect')
      .attr('x', 14)
      .attr('y', (d) => d.y)
      .attr('width', width - 28)
      .attr('height', (d) => d.h)
      .attr('rx', 14)
      .attr('fill', (d) => d.fill)
      .attr('stroke', (d) => d.border)
      .attr('stroke-width', 1.3);

    // 2. High-Contrast, Large-Format Left Zone Card (x: 24 to 235) - NEVER COLLIDES WITH NODES
    const zoneCards = bandGroups.append('g').attr('class', 'zone-badge-card');

    zoneCards
      .append('rect')
      .attr('x', 24)
      .attr('y', (d) => d.y + 14)
      .attr('width', 215)
      .attr('height', (d) => d.h - 28)
      .attr('rx', 10)
      .attr('fill', '#04120A')
      .attr('stroke', (d) => d.badgeBorder)
      .attr('stroke-width', 1.8);

    // Header Pill inside Zone Card
    zoneCards
      .append('rect')
      .attr('x', 34)
      .attr('y', (d) => d.y + 24)
      .attr('width', 195)
      .attr('height', 24)
      .attr('rx', 6)
      .attr('fill', (d) => d.badgeBg);

    zoneCards
      .append('text')
      .attr('x', 42)
      .attr('y', (d) => d.y + 40)
      .attr('fill', '#FFFFFF')
      .attr('font-size', 11)
      .attr('font-weight', 'bold')
      .attr('font-family', 'sans-serif')
      .text((d) => `${d.icon} TIERRA ${d.tierNum} · ${d.title}`);

    zoneCards
      .append('text')
      .attr('x', 36)
      .attr('y', (d) => d.y + 68)
      .attr('fill', '#FDE047')
      .attr('font-size', 13)
      .attr('font-weight', 'bold')
      .attr('font-family', 'sans-serif')
      .text((d) => d.slopeBadge);

    zoneCards
      .append('text')
      .attr('x', 36)
      .attr('y', (d) => d.y + 88)
      .attr('fill', '#BAE6FD')
      .attr('font-size', 11)
      .attr('font-weight', '600')
      .attr('font-family', 'sans-serif')
      .text((d) => d.tagline);

    // Multi-line clean text using native SVG tspan to eliminate foreignObject layout issues
    zoneCards.each(function (d) {
      const g = d3.select(this);
      const textElement = g
        .append('text')
        .attr('x', 36)
        .attr('y', d.y + 106)
        .attr('fill', '#D1D5DB')
        .attr('font-size', 9.5)
        .attr('font-family', 'sans-serif');

      // Word wrap into clean tspans
      const words = d.desc.split(' ');
      let line: string[] = [];
      let lineNumber = 0;
      const lineHeight = 13;

      words.forEach((word) => {
        line.push(word);
        if (line.join(' ').length > 28) {
          line.pop();
          textElement
            .append('tspan')
            .attr('x', 36)
            .attr('dy', lineNumber === 0 ? 0 : lineHeight)
            .text(line.join(' '));
          line = [word];
          lineNumber++;
        }
      });
      if (line.length > 0) {
        textElement
          .append('tspan')
          .attr('x', 36)
          .attr('dy', lineNumber === 0 ? 0 : lineHeight)
          .text(line.join(' '));
      }
    });

    // 3. Right-Side Vertical Water Downhill Slope Channel (x: 948 to 982)
    const rightChute = svg.append('g').attr('class', 'right-slope-chute');

    rightChute
      .append('rect')
      .attr('x', width - 48)
      .attr('y', 20)
      .attr('width', 34)
      .attr('height', height - 40)
      .attr('rx', 8)
      .attr('fill', '#04121C')
      .attr('stroke', '#0284C7')
      .attr('stroke-width', 1.5);

    // Downward chevrons and indicators
    const chuteSteps = [
      { y: 55, text: '⛰️' },
      { y: 120, text: '↓' },
      { y: 185, text: '💧' },
      { y: 250, text: '↓' },
      { y: 315, text: '🌿' },
      { y: 380, text: '↓' },
      { y: 445, text: '💧' },
      { y: 510, text: '↓' },
      { y: 565, text: '🌊' }
    ];

    chuteSteps.forEach((st) => {
      rightChute
        .append('text')
        .attr('x', width - 31)
        .attr('y', st.y)
        .attr('text-anchor', 'middle')
        .attr('fill', st.text === '↓' ? '#38BDF8' : '#FFFFFF')
        .attr('font-size', st.text === '↓' ? 14 : 12)
        .attr('font-weight', 'bold')
        .text(st.text);
    });

    // 4. Links / Water connections between parcels
    const linkGroup = svg.append('g').attr('class', 'links');

    const linkContainers = linkGroup
      .selectAll<SVGGElement, FarmLink>('g.farm-link')
      .data(linksData)
      .join('g')
      .attr('class', (d) => `farm-link farm-link-${d.source} farm-link-${d.target}`);

    linkContainers.each(function (d) {
      const g = d3.select(this);
      const s = nodesData.find((n) => n.id === d.source);
      const t = nodesData.find((n) => n.id === d.target);
      if (!s || !t) return;

      const isHealthy = s.adopted && t.adopted;
      const isMixed = s.adopted || t.adopted;

      const strokeColor = isHealthy
        ? d.flowType === 'watershed-stream'
          ? '#38BDF8'
          : '#4ADE80'
        : isMixed
        ? '#E09F3E'
        : '#F87171';

      const strokeW = isHealthy ? 3.5 : 2.2;
      const animClass = !isAnimationActive
        ? 'anim-stream-stopped'
        : isHealthy
        ? 'anim-stream-healthy'
        : 'anim-stream-degraded';

      // 4a. Outer Glow line (activated on hover)
      g.append('line')
        .attr('class', 'stream-glow-line')
        .attr('x1', s.targetX)
        .attr('y1', s.targetY)
        .attr('x2', t.targetX)
        .attr('y2', t.targetY)
        .attr('stroke', isHealthy ? '#38BDF8' : '#F87171')
        .attr('stroke-width', 9)
        .attr('stroke-linecap', 'round')
        .attr('stroke-opacity', 0)
        .style('filter', 'url(#stream-glow)')
        .style('pointer-events', 'none');

      // 4b. Base stream path line
      g.append('line')
        .attr('class', `stream-main-line ${animClass}`)
        .attr('x1', s.targetX)
        .attr('y1', s.targetY)
        .attr('x2', t.targetX)
        .attr('y2', t.targetY)
        .attr('stroke', strokeColor)
        .attr('stroke-width', strokeW)
        .attr('stroke-opacity', 0.9);

      // 4c. SVG animateMotion glowing water droplet particles moving downhill
      if (isAnimationActive) {
        const pathD = `M ${s.targetX},${s.targetY} L ${t.targetX},${t.targetY}`;
        const particleGroup = g.append('g').attr('class', 'stream-particle-group');

        // Particle 1 (Leader droplet)
        const p1 = particleGroup
          .append('circle')
          .attr('class', 'particle-leader')
          .attr('r', isHealthy ? 4.5 : 3.5)
          .attr('fill', isHealthy ? '#38BDF8' : '#F87171')
          .attr('opacity', 0.95);

        p1.append('animateMotion')
          .attr('path', pathD)
          .attr('dur', isHealthy ? '2.4s' : '1.4s')
          .attr('repeatCount', 'indefinite');

        // Particle 2 (Trailing droplet, offset in phase)
        const p2 = particleGroup
          .append('circle')
          .attr('class', 'particle-trailing')
          .attr('r', isHealthy ? 3.5 : 2.8)
          .attr('fill', isHealthy ? '#4ADE80' : '#FCA5A5')
          .attr('opacity', 0.85);

        p2.append('animateMotion')
          .attr('path', pathD)
          .attr('dur', isHealthy ? '2.4s' : '1.4s')
          .attr('begin', isHealthy ? '1.2s' : '0.7s')
          .attr('repeatCount', 'indefinite');
      }
    });

    // 5. Nodes: Spacious nodes with clear identities, badges, and icons
    const nodeGroup = svg.append('g').attr('class', 'nodes');

    const nodeContainers = nodeGroup
      .selectAll<SVGGElement, FarmNode>('g.farm-node')
      .data(nodesData)
      .join('g')
      .attr('class', (d) => `farm-node farm-node-${d.id}`)
      .attr('transform', (d) => `translate(${d.targetX}, ${d.targetY})`)
      .style('cursor', 'pointer')
      .on('click', (_event, d) => {
        if (d.role === 'neighbor') {
          toggleNeighbor(d.id);
        } else {
          setSelectedNodeId(d.id);
        }
      })
      .on('mouseenter', (_event, d) => {
        // Direct local D3 visual highlight without triggering React re-render of SVG
        const directNeighbors = linksData
          .filter((l) => l.source === d.id || l.target === d.id)
          .map((l) => (l.source === d.id ? l.target : l.source));

        // Update top hover banner text directly in the DOM if available
        const bannerTitle = document.getElementById('watershed-hover-title');
        const bannerDesc = document.getElementById('watershed-hover-desc');
        if (bannerTitle) {
          bannerTitle.textContent = `${d.avatarIcon} ${lang === 'es' ? d.farmerNameEs : d.farmerNameEn} (${lang === 'es' ? d.locationEs : d.locationEn})`;
        }
        if (bannerDesc) {
          bannerDesc.textContent = lang === 'es'
            ? `Conexión directa de agua con ${directNeighbors.length} vecinos. ${d.howItAffectsYouEs}`
            : `Direct water connection with ${directNeighbors.length} neighbors. ${d.howItAffectsYouEn}`;
        }

        // Highlight directly connected streams & dim others
        linkContainers.each(function (l) {
          const isDirect = l.source === d.id || l.target === d.id;
          const grp = d3.select(this);
          const glowLine = grp.select('.stream-glow-line');
          const mainLine = grp.select('.stream-main-line');
          const particles = grp.selectAll('.stream-particle-group circle');

          if (isDirect) {
            glowLine.attr('stroke-opacity', 0.85);
            mainLine
              .attr('stroke-width', 5.5)
              .attr('stroke-opacity', 1);
            particles.attr('r', 5.5).attr('opacity', 1);
          } else {
            glowLine.attr('stroke-opacity', 0);
            mainLine
              .attr('stroke-width', 1.2)
              .attr('stroke-opacity', 0.15);
            particles.attr('opacity', 0.05);
          }
        });

        // Highlight direct neighbor nodes with ring & dim unrelated
        nodeContainers.each(function (n) {
          const isCurrent = n.id === d.id;
          const isDirect = directNeighbors.includes(n.id);
          const grp = d3.select(this);

          if (isCurrent) {
            grp.style('opacity', '1');
            grp.select('.neighbor-ring').attr('opacity', 0);
          } else if (isDirect) {
            grp.style('opacity', '1');
            grp
              .select('.neighbor-ring')
              .attr('opacity', 1)
              .attr('stroke-width', 3.5);
          } else {
            grp.style('opacity', '0.35');
            grp.select('.neighbor-ring').attr('opacity', 0);
          }
        });
      })
      .on('mouseleave', () => {
        // Reset top hover banner text
        const bannerTitle = document.getElementById('watershed-hover-title');
        const bannerDesc = document.getElementById('watershed-hover-desc');
        if (bannerTitle) {
          bannerTitle.textContent = lang === 'es'
            ? 'Mapa de la microcuenca vecinal'
            : 'Community watershed hillside map';
        }
        if (bannerDesc) {
          bannerDesc.textContent = lang === 'es'
            ? 'Pasa el cursor sobre cualquier parcela para ver de dónde viene y hacia dónde fluye el agua.'
            : 'Hover over any parcel to see where water comes from and where it flows.';
        }

        // Reset all links
        linkContainers.each(function (l) {
          const grp = d3.select(this);
          const s = nodesData.find((n) => n.id === l.source);
          const t = nodesData.find((n) => n.id === l.target);
          const isHealthy = s?.adopted && t?.adopted;

          grp.select('.stream-glow-line').attr('stroke-opacity', 0);
          grp
            .select('.stream-main-line')
            .attr('stroke-width', isHealthy ? 3.5 : 2.2)
            .attr('stroke-opacity', 0.9);

          grp
            .selectAll('.stream-particle-group circle')
            .attr('r', (_dd, i) => (i === 0 ? (isHealthy ? 4.5 : 3.5) : (isHealthy ? 3.5 : 2.8)))
            .attr('opacity', (_dd, i) => (i === 0 ? 0.95 : 0.85));
        });

        // Reset all nodes
        nodeContainers.style('opacity', '1');
        nodeContainers.select('.neighbor-ring').attr('opacity', 0);
      });

    // Invisible larger hit area circle to completely prevent mouse boundary flickering
    nodeContainers
      .append('circle')
      .attr('r', (d) => d.radius + 18)
      .attr('fill', 'transparent')
      .attr('stroke', 'none');

    // Outer Direct Neighbor Highlight Ring (illuminates on hover)
    nodeContainers
      .append('circle')
      .attr('class', 'neighbor-ring')
      .attr('r', (d) => d.radius + 12)
      .attr('fill', 'none')
      .attr('stroke', '#38BDF8')
      .attr('stroke-width', 3)
      .attr('stroke-dasharray', '4,3')
      .attr('opacity', 0)
      .style('pointer-events', 'none');

    // Animated Aura Rings for "Tu Parcela" and "Acuífero"
    nodeContainers.each(function (d) {
      const g = d3.select(this);

      if (d.role === 'farmer' && isAnimationActive) {
        const aura = g.append('circle').attr('r', d.radius + 2).attr('fill', 'none').attr('stroke', '#FDE047').attr('stroke-width', 2.5);
        aura.append('animate').attr('attributeName', 'r').attr('values', `${d.radius + 2};${d.radius + 22};${d.radius + 2}`).attr('dur', '2.6s').attr('repeatCount', 'indefinite');
        aura.append('animate').attr('attributeName', 'opacity').attr('values', '0.85;0;0.85').attr('dur', '2.6s').attr('repeatCount', 'indefinite');
      }

      if (d.role === 'watershed' && isAnimationActive) {
        const ripple = g.append('circle').attr('r', d.radius + 2).attr('fill', 'none').attr('stroke', '#38BDF8').attr('stroke-width', 2);
        ripple.append('animate').attr('attributeName', 'r').attr('values', `${d.radius + 2};${d.radius + 24};${d.radius + 2}`).attr('dur', '3s').attr('repeatCount', 'indefinite');
        ripple.append('animate').attr('attributeName', 'opacity').attr('values', '0.9;0;0.9').attr('dur', '3s').attr('repeatCount', 'indefinite');
      }
    });

    // Outer Selection Ring
    nodeContainers
      .append('circle')
      .attr('r', (d) => d.radius + 7)
      .attr('fill', 'none')
      .attr('stroke', (d) => {
        if (d.id === selectedNodeId) return '#FDE047';
        if (d.role === 'farmer') return '#E09F3E';
        return 'transparent';
      })
      .attr('stroke-width', (d) => (d.id === selectedNodeId ? 3.5 : 2))
      .attr('stroke-dasharray', (d) => (d.id === selectedNodeId ? 'none' : '4,3'));

    // Main Circle Avatar Body
    nodeContainers
      .append('circle')
      .attr('r', (d) => d.radius)
      .attr('fill', (d) => {
        if (d.role === 'watershed') {
          return d.adopted ? '#0E7490' : '#334155';
        }
        if (d.role === 'farmer') {
          return d.adopted ? '#15803D' : '#991B1B';
        }
        return d.adopted ? '#166534' : '#571D20';
      })
      .attr('stroke', (d) => {
        if (d.role === 'watershed') return '#38BDF8';
        if (d.role === 'farmer') return '#FDE047';
        return d.adopted ? '#4ADE80' : '#F87171';
      })
      .attr('stroke-width', (d) => (d.role === 'farmer' ? 3.5 : 2.5));

    // Emoji / Icon inside Circle
    nodeContainers
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', -2)
      .attr('font-size', (d) => (d.role === 'farmer' ? 18 : 15))
      .text((d) => d.avatarIcon);

    // Short Code under Icon inside Circle
    nodeContainers
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', 16)
      .attr('fill', '#FFFFFF')
      .attr('font-size', 11)
      .attr('font-weight', 'bold')
      .attr('font-family', 'sans-serif')
      .text((d) => d.shortCode);

    // Rectangular High-Contrast Badge below node (Width: 168, Height: 44)
    nodeContainers
      .append('rect')
      .attr('x', -84)
      .attr('y', (d) => d.radius + 6)
      .attr('width', 168)
      .attr('height', 44)
      .attr('rx', 8)
      .attr('fill', '#07150E')
      .attr('fill-opacity', 0.96)
      .attr('stroke', (d) => {
        if (d.id === selectedNodeId) return '#FDE047';
        return d.adopted ? '#2E6343' : '#6E2A2A';
      })
      .attr('stroke-width', (d) => (d.id === selectedNodeId ? 2.2 : 1.3));

    // Primary Name Text inside Badge
    nodeContainers
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', (d) => d.radius + 23)
      .attr('fill', '#FFFFFF')
      .attr('font-size', 12)
      .attr('font-weight', 'bold')
      .attr('font-family', 'sans-serif')
      .text((d) => (lang === 'es' ? d.farmerNameEs : d.farmerNameEn));

    // Secondary Status Text inside Badge
    nodeContainers
      .append('text')
      .attr('text-anchor', 'middle')
      .attr('y', (d) => d.radius + 40)
      .attr('fill', (d) => (d.adopted ? '#4ADE80' : '#FCA5A5'))
      .attr('font-size', 10.5)
      .attr('font-weight', 'bold')
      .attr('font-family', 'sans-serif')
      .text((d) => (lang === 'es' ? d.subLabelEs : d.subLabelEn));
  }, [
    nodesData,
    linksData,
    selectedNodeId,
    lang,
    communityMetrics.watershedResilience,
    isAnimationActive,
    compact
  ]);

  const activeNodeInfo =
    nodesData.find((n) => n.id === selectedNodeId) ||
    nodesData.find((n) => n.id === 'farmer')!;

  const hoveredNodeInfo = useMemo(() => {
    if (!hoveredNodeId) return null;
    return nodesData.find((n) => n.id === hoveredNodeId) || null;
  }, [hoveredNodeId, nodesData]);

  const directNeighborNodes = useMemo(() => {
    if (!hoveredNodeId) return [];
    const directIds = linksData
      .filter((l) => l.source === hoveredNodeId || l.target === hoveredNodeId)
      .map((l) => (l.source === hoveredNodeId ? l.target : l.source));
    return nodesData.filter((n) => directIds.includes(n.id));
  }, [hoveredNodeId, linksData, nodesData]);

  const neighborNodes = nodesData.filter((n) => n.role === 'neighbor');

  return (
    <div className="p-4 sm:p-6 rounded-xl bg-[#0B1610] border border-[#284635] space-y-5">
      {/* 1. Header with Plain-Language Badge & Voice Assistant Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E3528] pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-xs sm:text-sm font-semibold text-[#4ADE80]">
            <Users className="w-4 h-4 shrink-0 text-[#E09F3E]" />
            <span>
              {lang === 'es'
                ? 'RED VECINAL ANIMADA DE LA CUENCA: CÓMO LO QUE HACE TU VECINO AFECTA TU TIERRA'
                : 'ANIMATED COMMUNITY WATERSHED NETWORK: HOW NEIGHBORS AFFECT YOUR FIELD'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-[#D7E0DA] leading-relaxed max-w-3xl">
            {lang === 'es'
              ? 'El agua de las tormentas no conoce cercas ni linderos: baja de la loma hacia el valle. Las líneas y gotas animadas te muestran en tiempo real cómo viaja el agua según los cultivos de cada vecino.'
              : 'Rainwater does not stop at fences: it flows down from ridge to valley. The animated streams and droplets show in real time how water travels based on each neighbor’s crops.'}
          </p>
        </div>

        {/* Action Controls: Animation Toggle, Voice Guide & How It Works */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsAnimationActive((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isAnimationActive
                ? 'bg-[#0369A1]/30 text-[#38BDF8] border-[#38BDF8]'
                : 'bg-[#12231A] text-[#94A3B8] border-[#243E2F]'
            }`}
            title={lang === 'es' ? 'Activar o pausar animación del agua' : 'Toggle water animation'}
          >
            {isAnimationActive ? (
              <>
                <Pause className="w-3.5 h-3.5 text-[#38BDF8]" />
                <span>{lang === 'es' ? 'Pausar Flujo' : 'Pause Flow'}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 text-[#4ADE80]" />
                <span>{lang === 'es' ? 'Animar Flujo' : 'Animate Flow'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handlePlayVoiceGuide}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              isSpeaking
                ? 'bg-[#C85A32] text-white border-[#E09F3E] shadow-sm animate-pulse'
                : 'bg-[#12231A] text-[#E09F3E] hover:text-white border-[#2E523C]'
            }`}
          >
            {isSpeaking ? (
              <>
                <VolumeX className="w-3.5 h-3.5" />
                <span>{lang === 'es' ? 'Detener Voz' : 'Stop Voice'}</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5" />
                <span>{lang === 'es' ? 'Escuchar Explicación' : 'Listen Explanation'}</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => setShowHowItWorksGuide((prev) => !prev)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#162D20] text-[#38BDF8] border border-[#234A35] hover:bg-[#1E3B2B] transition-all cursor-pointer"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>
              {showHowItWorksGuide
                ? lang === 'es'
                  ? 'Ocultar Guía'
                  : 'Hide Guide'
                : lang === 'es'
                ? '¿Cómo funciona?'
                : 'How it works?'}
            </span>
          </button>
        </div>
      </div>

      {/* 2. DEDICATED PROMINENT ANIMATED WATER DIRECTION BANNER (Placed above map so it is never hidden or clipped) */}
      <div className="bg-gradient-to-r from-[#082236] via-[#0D3627] to-[#082236] border-2 border-[#38BDF8]/80 rounded-xl p-3.5 sm:p-4 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-[#0284C7]/30 border-2 border-[#38BDF8] flex items-center justify-center text-xl shrink-0 shadow-inner animate-pulse">
            💧
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm sm:text-base font-extrabold text-[#38BDF8] tracking-wide">
                {lang === 'es'
                  ? 'DIRECCIÓN DEL AGUA: LA LLUVIA BAJA DE LA LOMA AL VALLE'
                  : 'WATER FLOW DIRECTION: RAIN RUNS FROM RIDGE DOWN TO VALLEY'}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-[#38BDF8]/20 text-[#BAE6FD] border border-[#38BDF8]/40">
                {isAnimationActive
                  ? lang === 'es'
                    ? 'Flujo Animado en Vivo'
                    : 'Live Animated Flow'
                  : lang === 'es'
                  ? 'Pausado'
                  : 'Paused'}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#F1F5F9] mt-0.5 leading-snug">
              {lang === 'es' ? (
                <>
                  La lluvia cae primero en la <strong>Loma Alta</strong> (arriba) → baja pasando por{' '}
                  <strong className="text-[#FDE047]">Tu Parcela</strong> (centro) → y se acumula en el{' '}
                  <strong className="text-[#38BDF8]">Acuífero y Arroyo Común</strong> (abajo).
                </>
              ) : (
                <>
                  Rain hits the <strong>Upper Ridge</strong> (top) → runs down through{' '}
                  <strong className="text-[#FDE047]">Your Field</strong> (center) → and collects in{' '}
                  <strong className="text-[#38BDF8]">Shared Aquifer</strong> (bottom).
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center bg-[#05131C] px-3.5 py-1.5 rounded-lg border border-[#38BDF8]/60 text-xs font-bold text-[#7DD3FC] shadow-sm">
          <span>{lang === 'es' ? 'El agua corre hacia abajo' : 'Water flows downward'}</span>
          <ArrowDown className="w-4 h-4 text-[#38BDF8] animate-bounce" />
        </div>
      </div>

      {/* 3. Plain-Language "How It Works" Visual Guide */}
      {showHowItWorksGuide && (
        <div className="p-4 rounded-xl bg-[#0E2016] border border-[#2D563D] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold text-[#E09F3E]">
            <Info className="w-4 h-4 shrink-0" />
            <span>
              {lang === 'es'
                ? 'EXPLICACIÓN SENCILLA EN 3 PASOS PARA TODOS LOS AGRICULTORES:'
                : 'SIMPLE 3-STEP GUIDE FOR ALL FARMERS:'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div className="p-3 rounded-lg bg-[#08150E] border border-[#1E3528] space-y-1">
              <div className="text-xs font-bold text-[#4ADE80] flex items-center gap-1.5">
                <span>1. Loma Alta (Arriba)</span>
              </div>
              <p className="text-xs text-[#D7E0DA] leading-relaxed">
                {lang === 'es'
                  ? 'Si el vecino de arriba siembra con frijol y abono verde, sus raíces actúan como esponja. El agua entra despacio a la tierra y no cae como torrente de lodo sobre ti.'
                  : 'If the upper neighbor plants beans and green manure, deep roots act like a sponge. Rain infiltrates slowly rather than rushing as mud over your field.'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#08150E] border border-[#1E3528] space-y-1">
              <div className="text-xs font-bold text-[#FDE047] flex items-center gap-1.5">
                <span>2. Ladera Media (¡Tu Terreno!)</span>
              </div>
              <p className="text-xs text-[#D7E0DA] leading-relaxed">
                {lang === 'es'
                  ? 'Al rotar maíz con calabaza y leguminosas, aprovechas el agua limpia que baja de arriba, enriqueces tu suelo con nitrógeno natural y proteges a los vecinos de abajo.'
                  : 'By rotating maize with squash and legumes, you capture clean water from above, enrich soil with natural nitrogen, and protect lower plots.'}
              </p>
            </div>

            <div className="p-3 rounded-lg bg-[#08150E] border border-[#1E3528] space-y-1">
              <div className="text-xs font-bold text-[#38BDF8] flex items-center gap-1.5">
                <span>3. Valle y Arroyo Común (Abajo)</span>
              </div>
              <p className="text-xs text-[#D7E0DA] leading-relaxed">
                {lang === 'es'
                  ? 'Cuando toda la ladera cuida el suelo, el agua se guarda bajo tierra para el verano. Los pozos y el río común nunca se secan, garantizando agua para toda la comunidad.'
                  : 'When the whole hillside protects its soil, water is stored underground for summer. Shared wells and streams never run dry.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 4. Three Interactive Community Scenarios */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-bold text-[#9FB0A5]">
          <span>
            {lang === 'es'
              ? 'PRUEBA ESTOS 3 ESCENARIOS PARA VER EL IMPACTO EN TIEMPO REAL:'
              : 'TRY THESE 3 SCENARIOS TO SEE REAL-TIME IMPACT:'}
          </span>
          <span className="text-[#E09F3E] text-[11px]">
            {lang === 'es'
              ? `${adoptedCount} de ${totalNeighbors} vecinos cooperando`
              : `${adoptedCount} of ${totalNeighbors} neighbors cooperating`}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <button
            type="button"
            onClick={() => setPresetAdoption(0)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              adoptedCount === 0
                ? 'bg-[#2E1414] border-[#F87171] text-white shadow-md'
                : 'bg-[#12231A] border-[#243E2F] text-[#A7B8AD] hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span>{lang === 'es' ? '1. Nadie Coopera (0 vecinos)' : '1. Nobody Cooperates (0)'}</span>
              <AlertTriangle className="w-3.5 h-3.5 text-[#F87171]" />
            </div>
            <p className="text-[11px] text-[#FCA5A5] mt-1 leading-snug">
              {lang === 'es'
                ? 'Suelos pelados: lluvia fuerte causa deslaves de lodo y los pozos se secan en verano.'
                : 'Bare soil: heavy rains cause mudslides and community wells run dry in summer.'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPresetAdoption(3)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              adoptedCount === 3
                ? 'bg-[#292010] border-[#E09F3E] text-white shadow-md'
                : 'bg-[#12231A] border-[#243E2F] text-[#A7B8AD] hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span>{lang === 'es' ? '2. Mitad Coopera (3 vecinos)' : '2. Half Cooperates (3)'}</span>
              <Sparkles className="w-3.5 h-3.5 text-[#E09F3E]" />
            </div>
            <p className="text-[11px] text-[#FDE047] mt-1 leading-snug">
              {lang === 'es'
                ? 'Se frena la mitad del lodo, pero las parcelas desnudas siguen enviando plagas y escorrentía.'
                : 'Halves mud damage, but remaining bare plots still send runoff and pests.'}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setPresetAdoption(6)}
            className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${
              adoptedCount === 6
                ? 'bg-[#13301F] border-[#4ADE80] text-white shadow-md'
                : 'bg-[#12231A] border-[#243E2F] text-[#A7B8AD] hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between text-xs font-bold">
              <span>{lang === 'es' ? '3. ¡Toda la Cuenca Unida! (6)' : '3. United Watershed! (6)'}</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-[#4ADE80]" />
            </div>
            <p className="text-[11px] text-[#86EFAC] mt-1 leading-snug">
              {lang === 'es'
                ? 'Ladera protegida como esponja: máxima agua en el subsuelo y sin pérdidas de suelo.'
                : 'Hillside protected like a living sponge: maximum aquifer storage and zero soil loss.'}
            </p>
          </button>
        </div>
      </div>

      {/* 5. Full-Width D3 Interactive Animated Network Map */}
      <div className="bg-[#07130D] border border-[#1E382A] rounded-xl p-3 sm:p-4 space-y-3 shadow-inner">
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#D7E0DA] px-1">
          <span className="font-semibold text-[#4ADE80]">
            {lang === 'es'
              ? `MAPA ANIMADO DE LA LADERA · ${adoptedCount} DE ${totalNeighbors} PARCELAS CON SUELO PROTEGIDO`
              : `ANIMATED HILLSIDE MAP · ${adoptedCount} OF ${totalNeighbors} PARCELS WITH LIVING SOIL`}
          </span>
          <span className="text-[#E09F3E] text-xs">
            {lang === 'es'
              ? '👉 Pasa el ratón para ver conexiones de agua'
              : '👉 Hover any node to see water connections'}
          </span>
        </div>

        {/* Stable Interactive Hover Connection Callout Banner (Updated in place without re-rendering SVG) */}
        <div className="bg-gradient-to-r from-[#0C2B1D] via-[#103D27] to-[#0C2B1D] border-2 border-[#4ADE80] rounded-xl px-4 py-3 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 transition-all min-h-[58px]">
          <div className="flex items-center gap-3">
            <span className="text-2xl shrink-0">💧</span>
            <div>
              <div id="watershed-hover-title" className="text-sm font-bold text-white leading-tight">
                {lang === 'es'
                  ? 'Red de agua de la ladera: pasa el cursor sobre cada agricultor'
                  : 'Hillside water network: hover over each farmer to see connection'}
              </div>
              <div id="watershed-hover-desc" className="text-xs text-[#B8C7BD] mt-0.5 leading-snug">
                {lang === 'es'
                  ? 'Descubre cómo el agua limpia viaja entre vecinos desde la cima hasta el arroyo del valle.'
                  : 'Discover how clean water travels between neighbors from the ridge down to the valley stream.'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-[#143B27] text-[#4ADE80] border border-[#4ADE80]/50">
              {lang === 'es' ? '✦ Conexión en Vivo' : '✦ Live Connection'}
            </span>
          </div>
        </div>

        <svg
          ref={svgRef}
          viewBox={`0 0 1000 ${compact ? 540 : 620}`}
          className="w-full h-auto rounded-lg bg-[#08150E] select-none shadow-sm"
          role="img"
          aria-label={
            lang === 'es'
              ? 'Red animada D3 de la ladera y conservación de agua comunitaria'
              : 'D3 animated hillside community water and soil network'
          }
        />

        {/* 6. Clear Quick Switches for All 6 Neighbors */}
        <div className="pt-3 border-t border-[#1E3528] space-y-2.5">
          <div className="text-xs font-bold text-[#8FA898] flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5 text-[#E09F3E]" />
            <span>
              {lang === 'es'
                ? 'INTERRUPTORES RÁPIDOS POR PARCELA (TOCA PARA CAMBIAR CADA VECINO):'
                : 'QUICK TOGGLE SWITCHES PER NEIGHBOR (TAP TO CHANGE PRACTICE):'}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
            {neighborNodes.map((n) => {
              const isSelected = n.id === selectedNodeId;
              return (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => toggleNeighbor(n.id)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                    isSelected ? 'ring-2 ring-[#FDE047]' : ''
                  } ${
                    n.adopted
                      ? 'bg-[#122D1E] border-[#4ADE80]/80 text-[#F4F3EE]'
                      : 'bg-[#261313] border-[#F87171]/80 text-[#FCA5A5]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-base">{n.avatarIcon}</span>
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        n.adopted
                          ? 'bg-[#166534] text-[#BBF7D0]'
                          : 'bg-[#7F1D1D] text-[#FECACA]'
                      }`}
                    >
                      {n.adopted ? '✓ Protegido' : '⚠ Desnudo'}
                    </span>
                  </div>
                  <div className="text-xs font-bold mt-1.5 truncate">
                    {lang === 'es' ? n.farmerNameEs : n.farmerNameEn}
                  </div>
                  <div className="text-[10px] text-[#A7B8AD] mt-0.5 truncate">
                    {lang === 'es' ? n.locationEs : n.locationEn}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Simple Color & Animation Guide for Farmers */}
          <div className="flex flex-wrap items-center gap-4 pt-1.5 text-xs text-[#D7E0DA]">
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full inline-block bg-[#166534] border-2 border-[#4ADE80]" />
              <strong>{lang === 'es' ? 'Verde:' : 'Green:'}</strong>
              <span className="text-[#A7B8AD]">
                {lang === 'es' ? 'Suelo con raíces que frena el agua' : 'Soil with roots that slows rain'}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full inline-block bg-[#571D20] border-2 border-[#F87171]" />
              <strong>{lang === 'es' ? 'Rojo:' : 'Red:'}</strong>
              <span className="text-[#A7B8AD]">
                {lang === 'es' ? 'Suelo pelado que genera deslaves' : 'Bare soil causing runoff and mud'}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-1 inline-block bg-[#4ADE80] rounded" />
              <span className="text-[#A7B8AD]">
                {lang === 'es' ? 'Gotas azules/verdes: Agua dulce infiltrándose' : 'Blue/green drops: Clean water soaking in'}
              </span>
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-5 h-1 inline-block bg-[#F87171] rounded" />
              <span className="text-[#A7B8AD]">
                {lang === 'es' ? 'Gotas rojas: Torrente de lodo y plagas' : 'Red drops: Mud runoff and pests'}
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* 7. Four Practical Farmer Impact Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-[#12231A] border border-[#243E2F] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#8FA898]">
            <span className="font-bold">
              {lang === 'es' ? 'FUERZA CONTRA SEQUÍA' : 'DROUGHT RESILIENCE'}
            </span>
            <Sparkles className="w-4 h-4 text-[#E09F3E]" />
          </div>
          <div className="text-2xl font-bold text-[#F4F3EE]">
            {communityMetrics.watershedResilience}{' '}
            <span className="text-xs font-normal text-[#8FA898]">/ 100 pts</span>
          </div>
          <div className="text-xs font-semibold text-[#4ADE80]">
            {communityMetrics.watershedResilience >= 75
              ? lang === 'es'
                ? '✓ Alta protección comunitaria'
                : '✓ High community protection'
              : communityMetrics.watershedResilience >= 55
              ? lang === 'es'
                ? '▲ Protección moderada en ladera'
                : '▲ Moderate hillside protection'
              : lang === 'es'
              ? '⚠ Ladera vulnerable a desastres'
              : '⚠ Hillside vulnerable to disasters'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12231A] border border-[#243E2F] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#8FA898]">
            <span className="font-bold">
              {lang === 'es' ? 'AGUA EN EL POZO COMÚN' : 'COMMON WELL WATER'}
            </span>
            <Droplets className="w-4 h-4 text-[#38BDF8]" />
          </div>
          <div className="text-2xl font-bold text-[#38BDF8]">
            +{communityMetrics.runoffReductionPct}%
          </div>
          <div className="text-xs text-[#D7E0DA]">
            +{communityMetrics.extraWaterLitersPerM2} litros/m²{' '}
            {lang === 'es' ? 'que entran a la tierra al año' : 'soaking into soil yearly'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12231A] border border-[#243E2F] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#8FA898]">
            <span className="font-bold">
              {lang === 'es' ? 'TIERRA FÉRTIL SALVADA' : 'TOPSOIL SAVED'}
            </span>
            <ShieldCheck className="w-4 h-4 text-[#4ADE80]" />
          </div>
          <div className="text-2xl font-bold text-[#4ADE80]">
            -{communityMetrics.erosionControlPct}%
          </div>
          <div className="text-xs text-[#D7E0DA]">
            {lang === 'es'
              ? 'Menos lodo y plagas que bajan por la ladera'
              : 'Less mud and pests running down slope'}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#12231A] border border-[#243E2F] space-y-1">
          <div className="flex items-center justify-between text-xs text-[#8FA898]">
            <span className="font-bold">
              {lang === 'es' ? 'ABONO NATURAL (N₂ Y MATERIA)' : 'NATURAL ORGANIC MATTER'}
            </span>
            <Sprout className="w-4 h-4 text-[#E09F3E]" />
          </div>
          <div className="text-2xl font-bold text-[#E09F3E]">
            +{communityMetrics.organicMatterTonsHa} t/ha
          </div>
          <div className="text-xs text-[#D7E0DA]">
            {lang === 'es'
              ? 'Tierra viva y esponjosa producida al año'
              : 'Living spongy soil produced yearly'}
          </div>
        </div>
      </div>

      {/* 8. Detailed Parcel Inspector (Ficha de la Parcela Seleccionada) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Selected Parcel Card */}
        <div className="p-4 rounded-xl bg-[#12231A] border border-[#2B4B39] space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1E3528] pb-2">
            <div className="flex items-center gap-2">
              <span className="text-xl">{activeNodeInfo.avatarIcon}</span>
              <div>
                <span className="text-sm font-bold text-[#E09F3E]">
                  {lang === 'es' ? activeNodeInfo.farmerNameEs : activeNodeInfo.farmerNameEn}
                </span>
                <div className="text-xs text-[#9FB0A5]">
                  {lang === 'es' ? activeNodeInfo.locationEs : activeNodeInfo.locationEn}
                </div>
              </div>
            </div>

            <span
              className={`px-2.5 py-1 rounded-md text-xs font-bold ${
                activeNodeInfo.adopted
                  ? 'bg-[#166534] text-[#BBF7D0]'
                  : 'bg-[#7F1D1D] text-[#FECACA]'
              }`}
            >
              {activeNodeInfo.adopted
                ? lang === 'es'
                  ? '✓ Suelo Protegido'
                  : '✓ Protected Soil'
                : lang === 'es'
                ? '⚠ Suelo Desnudo'
                : '⚠ Bare Soil'}
            </span>
          </div>

          <div className="space-y-1">
            <div className="text-xs font-bold text-[#4ADE80]">
              {lang === 'es'
                ? '¿CÓMO AFECTA ESTE VECINO A TU PARCELA?'
                : 'HOW DOES THIS NEIGHBOR AFFECT YOUR FIELD?'}
            </div>
            <p className="text-xs sm:text-sm text-[#F4F3EE] leading-relaxed">
              {lang === 'es' ? activeNodeInfo.howItAffectsYouEs : activeNodeInfo.howItAffectsYouEn}
            </p>
          </div>

          {activeNodeInfo.role === 'neighbor' && (
            <button
              type="button"
              onClick={() => toggleNeighbor(activeNodeInfo.id)}
              className={`w-full py-2 px-3 rounded-lg text-xs font-bold transition-colors cursor-pointer border ${
                activeNodeInfo.adopted
                  ? 'bg-[#261313] hover:bg-[#381B1B] text-[#FCA5A5] border-[#F87171]/60'
                  : 'bg-[#163624] hover:bg-[#1E452E] text-[#BBF7D0] border-[#4ADE80]/60'
              }`}
            >
              {activeNodeInfo.adopted
                ? lang === 'es'
                  ? 'Simular si este vecino deja de cuidar la tierra'
                  : 'Simulate if neighbor stops protecting soil'
                : lang === 'es'
                ? 'Simular si este vecino siembra rotación con cobertura'
                : 'Simulate if neighbor adopts cover rotation'}
            </button>
          )}
        </div>

        {/* Community Power Summary Card */}
        <div className="p-4 rounded-xl bg-[#0E1C14] border border-[#1E3528] space-y-2 text-xs sm:text-sm text-[#D7E0DA] leading-relaxed">
          <strong className="text-[#4ADE80] block text-sm">
            {lang === 'es'
              ? '💡 Conclusión para la comunidad agrícola:'
              : '💡 Takeaway for the farming community:'}
          </strong>
          {lang === 'es' ? (
            <>
              Ningún agricultor puede salvar la microcuenca solo. Cuando tú y{' '}
              <strong className="text-white">{adoptedCount} vecinos</strong> alternan cultivos con
              leguminosas y coberturas vivas, toda la loma actúa como una{' '}
              <strong className="text-[#4ADE80]">esponja viva</strong>: infiltra{' '}
              <strong>+{communityMetrics.runoffReductionPct}%</strong> más agua dulce al pozo común,
              evita en <strong>-{communityMetrics.erosionControlPct}%</strong> que el lodo tape los
              caminos y aporta{' '}
              <strong>+{communityMetrics.organicMatterTonsHa} t/ha</strong> de tierra fértil cada
              año.
            </>
          ) : (
            <>
              No single farmer can protect the entire watershed alone. When you and{' '}
              <strong className="text-white">{adoptedCount} neighbors</strong> rotate crops with
              legumes and living covers, the entire hillside acts as a{' '}
              <strong className="text-[#4ADE80]">living sponge</strong>: soaking in{' '}
              <strong>+{communityMetrics.runoffReductionPct}%</strong> more sweet water into shared
              wells, reducing mudslides by{' '}
              <strong>-{communityMetrics.erosionControlPct}%</strong>, and contributing{' '}
              <strong>+{communityMetrics.organicMatterTonsHa} t/ha</strong> of fertile organic
              matter every year.
            </>
          )}
        </div>
      </div>
    </div>
  );
};
