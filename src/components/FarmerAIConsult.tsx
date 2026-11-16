import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Send,
  Camera,
  Image as ImageIcon,
  X,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  RefreshCw,
  Droplets,
  Sun,
  CloudRain,
  Volume2,
  VolumeX,
  Bug,
  Sprout,
  Database,
  Trash2,
  Clock
} from 'lucide-react';
import {
  AiConsultHistoryEntry,
  saveAiConsultationEntry,
  loadAiConsultationHistory,
  deleteAiConsultationEntry
} from '../utils/db';

interface FarmerAIConsultProps {
  lang: 'es' | 'en';
  fincaNombre: string;
  cultivoActivo: string;
  humedadSuelo: number;
  temperatura: number;
  lluvia: number;
  humedadAire: number;
  onSpeak?: (text: string, sourceId: string) => void;
  stopSpeak?: () => void;
  voiceActive?: boolean;
  activeVoiceSource?: string | null;
}

export const FarmerAIConsult: React.FC<FarmerAIConsultProps> = ({
  lang,
  fincaNombre,
  cultivoActivo,
  humedadSuelo,
  temperatura,
  lluvia,
  humedadAire,
  onSpeak,
  stopSpeak,
  voiceActive = false,
  activeVoiceSource = null
}) => {
  const [consulta, setConsulta] = useState<string>('');
  const [fotoBase64, setFotoBase64] = useState<string | null>(null);
  const [cargando, setCargando] = useState<boolean>(false);
  const [respuesta, setRespuesta] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [localSpeaking, setLocalSpeaking] = useState<boolean>(false);
  const [savedHistory, setSavedHistory] = useState<AiConsultHistoryEntry[]>([]);
  const [expandedHistoryId, setExpandedHistoryId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    loadAiConsultationHistory().then((items) => {
      if (items.length > 0) setSavedHistory(items);
    });
  }, []);

  const preguntasComunes = [
    lang === 'es' ? 'Las hojas tienen manchas amarillas y se secan en las puntas' : 'Leaves have yellow spots and tips dry out',
    lang === 'es' ? 'Gusano o plaga comiéndose el cogollo del maíz' : 'Worm eating the crop shoot',
    lang === 'es' ? 'La planta se ve marchita aunque el suelo tiene humedad' : 'Plant wilts even though soil has water',
    lang === 'es' ? 'Hongo blanco o cenicilla en las hojas después de la lluvia' : 'White powdery mildew on leaves after rain',
    lang === 'es' ? '¿Cómo preparar un abono o purín natural para darle fuerza a la raíz?' : 'How to prepare a natural organic fertilizer for roots?'
  ];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setErrorMsg(
        lang === 'es'
          ? 'La imagen es muy pesada. Por favor sube una foto menor a 5MB.'
          : 'Image is too large. Please upload an image under 5MB.'
      );
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoBase64(reader.result as string);
      setErrorMsg(null);
    };
    reader.readAsDataURL(file);
  };

  const handleConsultar = async (preguntaTexto?: string) => {
    const textoFinal = preguntaTexto || consulta;
    if (!textoFinal.trim() && !fotoBase64) {
      setErrorMsg(
        lang === 'es'
          ? 'Por favor escribe qué problema tiene tu cultivo o sube una foto de la planta.'
          : 'Please describe the problem or upload a photo of the plant.'
      );
      return;
    }

    setCargando(true);
    setErrorMsg(null);
    setRespuesta(null);
    detenerVoz();

    try {
      const res = await fetch('/api/consultar-cultivo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          consulta: textoFinal,
          cultivo: cultivoActivo,
          fincaNombre,
          temperatura,
          lluvia,
          humedadSuelo,
          humedadAire,
          fotoBase64
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Error al conectar con la inteligencia artificial');
      }

      setRespuesta(data.respuesta);

      const newEntry: AiConsultHistoryEntry = {
        id: `ai-${Date.now()}`,
        fecha: new Date().toISOString(),
        fincaNombre,
        cultivo: cultivoActivo,
        humedadSuelo,
        consulta: textoFinal || (lang === 'es' ? 'Consulta con fotografía de planta' : 'Plant photo diagnosis'),
        respuesta: data.respuesta
      };
      await saveAiConsultationEntry(newEntry);
      setSavedHistory((prev) => [newEntry, ...prev].slice(0, 25));
    } catch (err: any) {
      console.error(err);
      setErrorMsg(
        lang === 'es'
          ? 'No pudimos conectar con la IA en línea (sin señal o servidor ocupado). Puedes revisar tus recomendaciones guardadas abajo o consultar la Base Local en "Campo y ODS".'
          : 'Could not reach online AI right now. You can still review saved recommendations below or open the offline database in "Field & SDGs".'
      );
    } finally {
      setCargando(false);
    }
  };

  const isSpeaking = onSpeak ? voiceActive && activeVoiceSource === 'farmer-ai-consult' : localSpeaking;

  const leerEnVozAlta = (texto: string) => {
    // Limpiar markdown básico para que la voz lea fluido
    const textoLimpio = texto
      .replace(/[*#_`>-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    if (onSpeak) {
      if (isSpeaking && stopSpeak) {
        stopSpeak();
      } else {
        onSpeak(textoLimpio, 'farmer-ai-consult');
      }
      return;
    }

    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;

    if (localSpeaking) {
      detenerVoz();
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(textoLimpio);
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

    utterance.onend = () => setLocalSpeaking(false);
    utterance.onerror = () => setLocalSpeaking(false);

    setLocalSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const detenerVoz = () => {
    if (stopSpeak) {
      stopSpeak();
      return;
    }
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setLocalSpeaking(false);
    }
  };

  return (
    <div className="bg-[#0B1711] border border-[#214331] rounded-2xl p-4 sm:p-6 shadow-xl space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-[#1A3728]">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#162D21] border border-[#4ADE80]/50 text-xs font-bold text-[#4ADE80]">
              <Sparkles className="w-3.5 h-3.5 text-[#4ADE80]" />
              <span>{lang === 'es' ? 'INTELIGENCIA ARTIFICIAL AGRÍCOLA' : 'AGRICULTURAL AI ADVISOR'}</span>
            </span>
            <span className="text-xs text-[#8FA898]">
              {lang === 'es' ? '· Ayuda rápida para tu siembra' : '· Instant field solutions'}
            </span>
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-[#F4F3EE] flex items-center gap-2">
            <Sprout className="w-6 h-6 text-[#4ADE80]" />
            <span>
              {lang === 'es'
                ? '¿Qué problema tiene tu cultivo hoy?'
                : 'What problem is your crop facing today?'}
            </span>
          </h3>
          <p className="text-xs sm:text-sm text-[#A7B8AD] max-w-2xl leading-relaxed">
            {lang === 'es'
              ? 'Pregunta con tus propias palabras o sube una foto de la hoja o fruto dañado. La inteligencia artificial revisa la humedad y el clima actual de tu finca para darte un remedio rápido y natural.'
              : 'Ask in plain language or upload a photo of the affected plant. The AI cross-references your current farm weather to give you a practical solution.'}
          </p>
        </div>

        {/* Resumen de clima de la parcela para dar confianza al campesino */}
        <div className="flex flex-wrap items-center gap-2 bg-[#10241A] border border-[#1E3B2C] p-2.5 rounded-xl text-xs font-mono-tabular shrink-0">
          <div className="flex items-center gap-1 text-[#4ADE80]" title={lang === 'es' ? 'Humedad en suelo' : 'Soil moisture'}>
            <Droplets className="w-3.5 h-3.5" />
            <span>{humedadSuelo}% agua</span>
          </div>
          <span className="text-[#325642]">·</span>
          <div className="flex items-center gap-1 text-[#E09F3E]" title={lang === 'es' ? 'Temperatura' : 'Temperature'}>
            <Sun className="w-3.5 h-3.5" />
            <span>{temperatura}°C</span>
          </div>
          <span className="text-[#325642]">·</span>
          <div className="flex items-center gap-1 text-[#38BDF8]" title={lang === 'es' ? 'Lluvia' : 'Rain'}>
            <CloudRain className="w-3.5 h-3.5" />
            <span>{lluvia} mm</span>
          </div>
        </div>
      </div>

      {/* Preguntas rápidas en un toque */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-[#8FA898] uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-[#4ADE80]" />
          <span>{lang === 'es' ? 'Problemas comunes (toca uno para consultar directo):' : 'Common issues (tap to ask instantly):'}</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {preguntasComunes.map((p, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                setConsulta(p);
                handleConsultar(p);
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-[#12261C] hover:bg-[#1B3828] text-[#D8E6DC] hover:text-white border border-[#244733] transition-all cursor-pointer text-left flex items-center gap-1.5"
            >
              <Bug className="w-3 h-3 text-[#E09F3E] shrink-0" />
              <span>{p}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input de consulta con botón para foto y envío */}
      <div className="space-y-3">
        <div className="relative rounded-2xl bg-[#09150E] border border-[#234532] focus-within:border-[#4ADE80] transition-all p-3">
          <textarea
            rows={3}
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder={
              lang === 'es'
                ? 'Escribe aquí: por ejemplo "Veo unos bichos verdes debajo de las hojas de frijol y están dejando huecos..."'
                : 'Type here: e.g. "I see green insects under my bean leaves and they are leaving holes..."'
            }
            className="w-full bg-transparent text-[#F4F3EE] placeholder-[#6E8878] text-sm sm:text-base outline-none resize-none leading-relaxed"
          />

          {/* Previsualización de la foto adjunta si hay una */}
          {fotoBase64 && (
            <div className="mt-2 relative inline-block">
              <img
                src={fotoBase64}
                alt="Foto del cultivo"
                className="w-24 h-24 object-cover rounded-xl border border-[#4ADE80]/60 shadow-md"
              />
              <button
                type="button"
                onClick={() => setFotoBase64(null)}
                className="absolute -top-2 -right-2 p-1 bg-[#C85A32] text-white rounded-full shadow-lg hover:bg-[#A84522] cursor-pointer"
                title={lang === 'es' ? 'Quitar foto' : 'Remove photo'}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#193325] mt-2">
            <div className="flex items-center gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#132A1E] hover:bg-[#1B3828] text-[#4ADE80] border border-[#2A523C] text-xs font-medium cursor-pointer transition-colors"
              >
                <Camera className="w-4 h-4" />
                <span>{fotoBase64 ? (lang === 'es' ? 'Cambiar foto' : 'Change photo') : (lang === 'es' ? 'Subir o tomar foto' : 'Take / Upload photo')}</span>
              </button>
            </div>

            <button
              type="button"
              disabled={cargando}
              onClick={() => handleConsultar()}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4ADE80] hover:bg-[#39C76E] disabled:bg-[#254C34] text-[#07130B] font-bold text-sm cursor-pointer transition-all shadow-md"
            >
              {cargando ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>{lang === 'es' ? 'Consultando al Asistente...' : 'Checking with AI...'}</span>
                </>
              ) : (
                <>
                  <span>{lang === 'es' ? 'Consultar Solución' : 'Ask for Solution'}</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Mensaje de espera amigable mientras procesa */}
        {cargando && (
          <div className="p-3.5 rounded-xl bg-[#10241A] border border-[#2E6141] text-[#D8E6DC] flex items-center gap-3 text-xs animate-pulse">
            <RefreshCw className="w-4 h-4 text-[#4ADE80] animate-spin shrink-0" />
            <span>
              {lang === 'es'
                ? 'El Asistente está revisando los síntomas de tu cultivo junto con el clima y la humedad de tu finca para darte la mejor solución...'
                : 'The AI assistant is analyzing your crop symptoms and farm weather to formulate the best solution...'}
            </span>
          </div>
        )}

        {errorMsg && (
          <div className="p-3 rounded-xl bg-[#2A1412] border border-[#C85A32] text-[#FCA5A5] flex items-center gap-2 text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#F87171]" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Respuesta de la IA Agrícola */}
      {respuesta && (
        <div className="p-4 sm:p-6 rounded-2xl bg-[#0D2115] border border-[#3CA368] space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#1E432B] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#193F27] border border-[#4ADE80] flex items-center justify-center text-[#4ADE80]">
                <CheckCircle2 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-base text-[#F4F3EE]">
                  {lang === 'es' ? 'Solución Recomendada por el Asistente' : 'Recommended Solution'}
                </h4>
                <p className="text-xs text-[#8FA898]">
                  {lang === 'es' ? 'Adaptada al clima y suelo de tu parcela' : 'Tailored to your current farm conditions'}
                </p>
              </div>
            </div>

            {/* Botón para escuchar en voz alta */}
            <button
              type="button"
              onClick={() => leerEnVozAlta(respuesta)}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-semibold cursor-pointer border transition-all ${
                isSpeaking
                  ? 'bg-[#C85A32] text-white border-[#C85A32] animate-pulse'
                  : 'bg-[#153120] text-[#4ADE80] border-[#2E6140] hover:bg-[#1D402B]'
              }`}
            >
              {isSpeaking ? (
                <>
                  <VolumeX className="w-4 h-4" />
                  <span>{lang === 'es' ? 'Detener lectura' : 'Stop voice'}</span>
                </>
              ) : (
                <>
                  <Volume2 className="w-4 h-4 text-[#4ADE80]" />
                  <span>{lang === 'es' ? 'Escuchar en voz alta' : 'Listen aloud'}</span>
                </>
              )}
            </button>
          </div>

          <div className="text-sm sm:text-base text-[#E6F0EA] leading-relaxed whitespace-pre-line space-y-2">
            {respuesta}
          </div>

          <div className="pt-3 border-t border-[#1C3E29] flex items-center justify-between text-xs text-[#8FA898]">
            <span>{lang === 'es' ? '¿Quieres consultar otro síntoma? Escribe una nueva pregunta arriba.' : 'Need to check another symptom? Type a new question above.'}</span>
          </div>
        </div>
      )}

      {/* Historial de Recomendaciones IA Guardado en IndexedDB (Disponible Sin Internet) */}
      {savedHistory.length > 0 && (
        <div className="p-4 sm:p-5 rounded-2xl bg-[#09140E] border border-[#1E3B2B] space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#1A3124] pb-2.5">
            <div className="flex items-center gap-2 text-xs font-mono-tabular text-[#38BDF8] font-semibold">
              <Database className="w-4 h-4 shrink-0" />
              <span>
                {lang === 'es'
                  ? `RECOMENDACIONES GUARDADAS EN TU DISPOSITIVO (${savedHistory.length})`
                  : `SAVED OFFLINE RECOMMENDATIONS (${savedHistory.length})`}
              </span>
            </div>
            <span className="text-[11px] text-[#8FA898]">
              {lang === 'es' ? 'Disponibles incluso sin señal en el campo' : 'Available without internet'}
            </span>
          </div>

          <div className="space-y-2.5">
            {savedHistory.slice(0, 6).map((item) => {
              const isOpen = expandedHistoryId === item.id;
              const historyVoiceId = `ai-history-${item.id}`;
              const isItemSpeaking = onSpeak ? voiceActive && activeVoiceSource === historyVoiceId : false;
              return (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-[#0D1C14] border border-[#1C3527] space-y-2"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setExpandedHistoryId(isOpen ? null : item.id)}
                      className="text-left flex-1 cursor-pointer space-y-0.5"
                    >
                      <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono-tabular text-[#8FA898]">
                        <Clock className="w-3 h-3 shrink-0 text-[#E09F3E]" />
                        <span>{new Date(item.fecha).toLocaleDateString(lang === 'es' ? 'es-ES' : 'en-US')}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.fincaNombre}</span>
                        <span aria-hidden="true">·</span>
                        <span>{item.humedadSuelo}% H₂O</span>
                      </div>
                      <div className="text-xs sm:text-sm font-semibold text-[#F4F3EE]">
                        {item.consulta}
                      </div>
                    </button>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          const clean = item.respuesta.replace(/[*#_`>-]/g, ' ').replace(/\s+/g, ' ').trim();
                          if (onSpeak) {
                            if (isItemSpeaking && stopSpeak) stopSpeak();
                            else onSpeak(clean, historyVoiceId);
                          } else {
                            leerEnVozAlta(item.respuesta);
                          }
                        }}
                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border cursor-pointer whitespace-nowrap ${
                          isItemSpeaking
                            ? 'bg-[#C85A32] text-white border-[#E09F3E]'
                            : 'bg-[#12231A] text-[#4ADE80] border-[#264935] hover:bg-[#193024]'
                        }`}
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>{isItemSpeaking ? (lang === 'es' ? 'Detener' : 'Stop') : (lang === 'es' ? 'Escuchar' : 'Listen')}</span>
                      </button>

                      <button
                        type="button"
                        aria-label={lang === 'es' ? 'Borrar recomendación' : 'Delete recommendation'}
                        onClick={async () => {
                          await deleteAiConsultationEntry(item.id);
                          setSavedHistory((prev) => prev.filter((x) => x.id !== item.id));
                        }}
                        className="p-1.5 rounded-lg bg-[#12231A] text-[#8FA898] hover:text-[#FCA5A5] border border-[#223B2D] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {isOpen && (
                    <div className="pt-2 border-t border-[#1A3124] text-xs sm:text-sm text-[#D7E0DA] whitespace-pre-line leading-relaxed">
                      {item.respuesta}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
