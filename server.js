// server.ts
import express from "express";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, ThinkingLevel } from "@google/genai";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
dotenv.config();
var __filename = fileURLToPath(import.meta.url);
var __dirname = path.dirname(__filename);
var app = express();
var PORT = Number(process.env.PORT) || 3e3;
app.use((_req, res, next) => {
  res.setHeader("Permissions-Policy", "geolocation=*");
  next();
});
app.use(express.json({ limit: "10mb" }));
app.get("/api/buscar-lugar", async (req, res) => {
  const q = String(req.query.q || "").trim();
  if (!q || q.length < 2) {
    return res.json({ results: [] });
  }
  try {
    const omUrl = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=6&language=es&format=json`;
    const omResp = await fetch(omUrl, { signal: AbortSignal.timeout(4500) });
    if (omResp.ok) {
      const omData = await omResp.json();
      if (Array.isArray(omData?.results) && omData.results.length > 0) {
        const mapped = omData.results.map((item) => ({
          name: item.name,
          region: [item.admin1, item.country].filter(Boolean).join(", "),
          country: item.country || "",
          lat: Number(item.latitude),
          lon: Number(item.longitude),
          altitudeM: typeof item.elevation === "number" ? Math.round(item.elevation) : 1200
        }));
        return res.json({ results: mapped });
      }
    }
  } catch (err) {
    console.warn("Open-Meteo geocoding error:", err);
  }
  try {
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=5&accept-language=es`;
    const nomResp = await fetch(nomUrl, {
      headers: { "User-Agent": "ROTA-AGRO-App/1.0" },
      signal: AbortSignal.timeout(4500)
    });
    if (nomResp.ok) {
      const nomData = await nomResp.json();
      if (Array.isArray(nomData)) {
        const mapped = nomData.map((item) => ({
          name: String(item.display_name || q).split(",")[0].trim(),
          region: String(item.display_name || "").split(",").slice(1, 3).join(",").trim(),
          country: String(item.display_name || "").split(",").slice(-1)[0]?.trim() || "",
          lat: Number(item.lat),
          lon: Number(item.lon),
          altitudeM: 1200
        }));
        return res.json({ results: mapped });
      }
    }
  } catch (err) {
    console.warn("Nominatim geocoding error:", err);
  }
  return res.json({ results: [] });
});
app.get("/api/reversa-lugar", async (req, res) => {
  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);
  if (isNaN(lat) || isNaN(lon)) {
    return res.status(400).json({ error: "Coordenadas inv\xE1lidas" });
  }
  let name = "";
  let region = "";
  let altitudeM = 1200;
  try {
    const [nomRes, elevRes] = await Promise.allSettled([
      fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=es`,
        { headers: { "User-Agent": "ROTA-AGRO-App/1.0" }, signal: AbortSignal.timeout(4e3) }
      ),
      fetch(
        `https://api.open-meteo.com/v1/elevation?latitude=${lat}&longitude=${lon}`,
        { signal: AbortSignal.timeout(4e3) }
      )
    ]);
    if (nomRes.status === "fulfilled" && nomRes.value.ok) {
      const nomJson = await nomRes.value.json();
      const addr = nomJson?.address || {};
      const place = addr.village || addr.town || addr.city || addr.municipality || addr.county || "";
      const state = addr.state || addr.region || "";
      const country = addr.country || "";
      name = place || state || "";
      region = [place, state, country].filter(Boolean).join(", ");
    }
    if (elevRes.status === "fulfilled" && elevRes.value.ok) {
      const elevJson = await elevRes.value.json();
      if (Array.isArray(elevJson?.elevation) && typeof elevJson.elevation[0] === "number") {
        altitudeM = Math.max(0, Math.round(elevJson.elevation[0]));
      }
    }
  } catch (err) {
    console.warn("Reverse geocoding error:", err);
  }
  return res.json({ name, region, altitudeM });
});
app.get("/api/ubicar-por-ip", async (req, res) => {
  const fwd = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  const clientIp = fwd && fwd !== "127.0.0.1" && fwd !== "::1" ? fwd : "";
  try {
    const url = clientIp ? `https://ipwho.is/${encodeURIComponent(clientIp)}` : "https://ipwho.is/";
    const resp = await fetch(url, { signal: AbortSignal.timeout(4e3) });
    if (resp.ok) {
      const d = await resp.json();
      if (d?.success !== false && typeof d?.latitude === "number" && typeof d?.longitude === "number") {
        let altitudeM = 1200;
        try {
          const elevResp = await fetch(
            `https://api.open-meteo.com/v1/elevation?latitude=${d.latitude}&longitude=${d.longitude}`,
            { signal: AbortSignal.timeout(3e3) }
          );
          if (elevResp.ok) {
            const elevJson = await elevResp.json();
            if (Array.isArray(elevJson?.elevation) && typeof elevJson.elevation[0] === "number") {
              altitudeM = Math.max(0, Math.round(elevJson.elevation[0]));
            }
          }
        } catch {
        }
        return res.json({
          success: true,
          lat: Number(d.latitude),
          lon: Number(d.longitude),
          city: d.city || "",
          region: [d.city, d.region, d.country].filter(Boolean).join(", "),
          country: d.country || "",
          altitudeM
        });
      }
    }
  } catch (err) {
    console.warn("IP geolocation error:", err);
  }
  return res.status(502).json({ success: false });
});
var ELEVENLABS_VOICE_ID = "1PoI1lbOcOBIyi33pnza";
function inspectElevenLabsKey() {
  const raw = (process.env.ELEVENLABS_API_KEY || "").trim();
  if (!raw || raw === "MY_ELEVENLABS_API_KEY" || raw.startsWith("MY_")) {
    return {
      ok: false,
      key: "",
      code: "missing_key",
      reason: "Falta configurar tu clave API de ElevenLabs (ELEVENLABS_API_KEY) en Secrets."
    };
  }
  if (!raw.startsWith("sk_")) {
    return {
      ok: false,
      key: "",
      code: "invalid_prefix",
      reason: 'La clave ELEVENLABS_API_KEY configurada en Secrets no empieza con "sk_".'
    };
  }
  return { ok: true, key: raw, code: "ok", reason: "" };
}
function formatElevenLabsError(status, errText) {
  try {
    const parsed = JSON.parse(errText);
    const detail = parsed?.detail;
    const code = detail?.code || detail?.status || "";
    const msg = detail?.message || "";
    if (code === "invalid_api_key" || code === "invalid_api_key_prefix" || status === 401) {
      return 'La clave API de ElevenLabs es inv\xE1lida o fue rechazada (verifica que empiece por "sk_").';
    }
    if (code === "voice_not_found" || status === 404) {
      return `El ID de voz ${ELEVENLABS_VOICE_ID} no se encontr\xF3 en tu cuenta de ElevenLabs o falta agregarlo a "My Voices".`;
    }
    if (code === "quota_exceeded" || status === 429) {
      return "Se agotaron los caracteres disponibles de tu cuenta de ElevenLabs.";
    }
    if (msg) {
      return `ElevenLabs (${status}): ${msg}`;
    }
  } catch {
  }
  return `ElevenLabs devolvi\xF3 error ${status}.`;
}
async function synthesizeElevenLabsAudio(text, apiKey) {
  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${ELEVENLABS_VOICE_ID}`, {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        "Accept": "audio/mpeg"
      },
      body: JSON.stringify({
        text: text.slice(0, 2800),
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      }),
      signal: AbortSignal.timeout(15e3)
    });
    if (!response.ok) {
      const errText = await response.text();
      console.warn("ElevenLabs API error:", response.status, errText);
      return {
        ok: false,
        status: response.status,
        reason: formatElevenLabsError(response.status, errText)
      };
    }
    const audioBuffer = await response.arrayBuffer();
    if (!audioBuffer || audioBuffer.byteLength === 0) {
      return { ok: false, status: 502, reason: "ElevenLabs devolvi\xF3 un audio vac\xEDo." };
    }
    return { ok: true, buffer: Buffer.from(audioBuffer) };
  } catch (err) {
    console.warn("ElevenLabs network error:", err?.message || err);
    return { ok: false, status: 502, reason: "No se pudo conectar con ElevenLabs." };
  }
}
async function synthesizeGeminiMaleAudio(text, lang = "es") {
  const apiKey = process.env.GEMINI_API_KEY || "";
  const ttsAi = new GoogleGenAI({
    apiKey,
    apiVersion: "v1beta",
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
  const safeText = text.trim().slice(0, 2600);
  const stylePrompt = lang === "en" ? "Warm, friendly, calm adult male voice, clear and respectful rural advisor tone." : "Voz masculina adulta, c\xE1lida, amable, grave, natural y tranquila de un agr\xF3nomo amigo hablando en espa\xF1ol latinoamericano.";
  const response = await ttsAi.models.generateContent({
    model: "gemini-3.8-flash-lite-tts",
    contents: [
      {
        role: "user",
        parts: [
          {
            text: safeText,
            speechMetadata: {
              style: stylePrompt
            }
          }
        ]
      }
    ],
    config: {
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          // Charon: warm, natural adult male voice
          prebuiltVoiceConfig: { voiceName: "Charon" }
        }
      }
    }
  });
  const parts = response.candidates?.[0]?.content?.parts || [];
  const audioPart = parts.find((p) => p?.inlineData?.data);
  const base64Audio = audioPart?.inlineData?.data;
  if (!base64Audio) {
    throw new Error("Gemini TTS did not return audio data");
  }
  return Buffer.from(base64Audio, "base64");
}
app.post("/api/elevenlabs-tts", async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Text is required" });
  }
  const keyCheck = inspectElevenLabsKey();
  if (!keyCheck.ok) {
    return res.status(503).json({ error: keyCheck.reason, code: keyCheck.code });
  }
  const result = await synthesizeElevenLabsAudio(text, keyCheck.key);
  if (!result.ok) {
    return res.status(result.status).json({ error: result.reason });
  }
  res.setHeader("Content-Type", "audio/mpeg");
  res.setHeader("X-Voice-Provider", "elevenlabs");
  return res.send(result.buffer);
});
app.post("/api/voz-ia", async (req, res) => {
  const { text, lang = "es" } = req.body || {};
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "Text is required" });
  }
  const targetLang = lang === "en" ? "en" : "es";
  let elevenWarning = "";
  const keyCheck = inspectElevenLabsKey();
  if (keyCheck.ok) {
    const elevenResult = await synthesizeElevenLabsAudio(text, keyCheck.key);
    if (elevenResult.ok) {
      res.setHeader("Content-Type", "audio/mpeg");
      res.setHeader("X-Voice-Provider", "elevenlabs");
      res.setHeader("Access-Control-Expose-Headers", "X-Voice-Provider, X-ElevenLabs-Warning");
      return res.send(elevenResult.buffer);
    }
    elevenWarning = elevenResult.reason;
  } else {
    elevenWarning = keyCheck.reason;
  }
  try {
    const wavBuffer = await synthesizeGeminiMaleAudio(text, targetLang);
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("X-Voice-Provider", "gemini-male");
    if (elevenWarning) {
      res.setHeader("X-ElevenLabs-Warning", encodeURIComponent(elevenWarning));
    }
    res.setHeader("Access-Control-Expose-Headers", "X-Voice-Provider, X-ElevenLabs-Warning");
    return res.send(wavBuffer);
  } catch (err) {
    console.error("Gemini male TTS fallback error:", err?.message || err);
    return res.status(502).json({
      error: "No se pudo generar el audio en el servidor.",
      elevenWarning,
      details: err?.message || String(err)
    });
  }
});
app.get("/api/verificar-voz", async (_req, res) => {
  const keyCheck = inspectElevenLabsKey();
  if (!keyCheck.ok) {
    return res.json({ valid: false, code: keyCheck.code, reason: keyCheck.reason });
  }
  try {
    const resp = await fetch(`https://api.elevenlabs.io/v1/voices/${ELEVENLABS_VOICE_ID}`, {
      headers: { "xi-api-key": keyCheck.key },
      signal: AbortSignal.timeout(6e3)
    });
    if (resp.ok) {
      const data = await resp.json();
      return res.json({ valid: true, voiceName: data?.name || "Voz Campesina Custom" });
    } else {
      const errText = await resp.text();
      return res.json({ valid: false, reason: formatElevenLabsError(resp.status, errText) });
    }
  } catch (err) {
    return res.json({ valid: false, reason: err?.message || "Error de conexi\xF3n con ElevenLabs" });
  }
});
var aiClient = null;
function getAi() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn("GEMINI_API_KEY is not defined in environment variables.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey || "",
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build"
        }
      }
    });
  }
  return aiClient;
}
app.post("/api/consultar-cultivo", async (req, res) => {
  try {
    const {
      consulta,
      cultivo,
      fincaNombre,
      temperatura,
      lluvia,
      humedadSuelo,
      humedadAire,
      fotoBase64
    } = req.body;
    if (!consulta || typeof consulta !== "string" || !consulta.trim()) {
      return res.status(400).json({ error: "Debes describir el problema de tu cultivo." });
    }
    const ai = getAi();
    const systemPrompt = `Eres el "Asistente Agr\xF3nomo Campesino", un sabio especialista en agricultura tradicional, agroecolog\xEDa y sanidad vegetal.
Tu misi\xF3n es ayudar a agricultores y campesinos a resolver problemas en sus cultivos de forma r\xE1pida, pr\xE1ctica, efectiva y en un lenguaje sumamente claro, cercano y amigable (sin palabras rebuscadas ni tecnicismos confusos).

Reglas de respuesta:
1. Habla con cercan\xEDa y respeto, como un t\xE9cnico de campo amigo que visita la finca.
2. Identifica con claridad qu\xE9 le pasa al cultivo (posible plaga, hongo, deficiencia de nutrientes, exceso/falta de agua o da\xF1o por fr\xEDo/calor).
3. Da una soluci\xF3n inmediata y pr\xE1ctica en 3 pasos sencillos:
   - Paso 1: Acci\xF3n urgente hoy mismo.
   - Paso 2: Remedio casero, org\xE1nico o preparaci\xF3n natural (ej. caldo de ceniza, infusi\xF3n de ajo/aj\xED, pur\xEDn de ortiga, abono verde, macerado, o poda sanitaria).
   - Paso 3: Prevenci\xF3n para que no vuelva a ocurrir (rotaci\xF3n de cultivos, acolchado, manejo de humedad).
4. Explica en 1 o 2 frases cortas c\xF3mo influyen las condiciones clim\xE1ticas actuales de su parcela en ese problema.
5. Mant\xE9n la respuesta concisa, limpia y muy f\xE1cil de leer en un celular o tablet.`;
    const contextoClima = `
Contexto de la finca del campesino:
- Finca: ${fincaNombre || "No especificada"}
- Cultivo principal: ${cultivo || "No especificado"}
- Humedad en el suelo: ${humedadSuelo !== void 0 ? `${humedadSuelo}%` : "Normal"}
- Humedad del aire: ${humedadAire !== void 0 ? `${humedadAire}%` : "Normal"}
- Temperatura registrada: ${temperatura !== void 0 ? `${temperatura}\xB0C` : "Normal"}
- Lluvia reciente: ${lluvia !== void 0 ? `${lluvia} mm/d\xEDa` : "Normal"}

Pregunta o problema del agricultor:
"${consulta}"
`;
    let responseText = "";
    const generarRespuesta = async (contentsPayload) => {
      const modelos = [
        { name: "gemini-3.1-flash-lite", config: { thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL } } },
        { name: "gemini-3.8-flash", config: { thinkingConfig: { thinkingLevel: ThinkingLevel.LOW } } }
      ];
      let ultimoError = null;
      for (const m of modelos) {
        try {
          const resp = await ai.models.generateContent({
            model: m.name,
            contents: contentsPayload,
            config: {
              systemInstruction: systemPrompt,
              ...m.config
            }
          });
          if (resp.text) {
            return resp.text;
          }
        } catch (err) {
          ultimoError = err;
          console.warn(`Modelo ${m.name} fall\xF3, pasando al siguiente:`, err?.message || err);
        }
      }
      throw ultimoError || new Error("No se pudo obtener respuesta del modelo.");
    };
    if (fotoBase64 && typeof fotoBase64 === "string" && fotoBase64.includes("base64,")) {
      const parts = fotoBase64.split("base64,");
      const mimeMatch = fotoBase64.match(/data:([a-zA-Z0-9]+\/[a-zA-Z0-9-.+]+);base64,/);
      const mimeType = mimeMatch ? mimeMatch[1] : "image/jpeg";
      const base64Data = parts[1];
      const imagePart = {
        inlineData: {
          mimeType,
          data: base64Data
        }
      };
      responseText = await generarRespuesta([
        {
          parts: [
            imagePart,
            { text: `${contextoClima}
Por favor observa detenidamente la fotograf\xEDa de la planta enviada por el agricultor para diagnosticar el s\xEDntoma visual.` }
          ]
        }
      ]);
    } else {
      responseText = await generarRespuesta(contextoClima);
    }
    return res.json({ respuesta: responseText });
  } catch (err) {
    console.error("Error en /api/consultar-cultivo:", err);
    return res.status(500).json({
      error: 'El servicio de inteligencia artificial est\xE1 experimentando alta demanda en este momento. Por favor espera unos segundos y pulsa nuevamente en "Consultar Soluci\xF3n".',
      details: err?.message
    });
  }
});
app.get("/api/health", (_req, res) => {
  return res.json({ ok: true, status: "ready", app: "ROTA-AGRO", version: "1.0.0" });
});
app.use("/api", (_req, res) => {
  return res.status(404).json({ error: "API endpoint not found" });
});
async function startServer() {
  if (process.env.NODE_ENV === "production") {
    const distDir = path.resolve(__dirname, "dist");
    app.use(express.static(distDir));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distDir, "index.html"));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa"
    });
    app.use(vite.middlewares);
  }
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Servidor ROTA-AGRO con Asistente IA escuchando en el puerto ${PORT}`);
  });
}
startServer();
