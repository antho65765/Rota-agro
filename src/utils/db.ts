// IndexedDB advanced local storage helper for offline resilience in rural areas

const DB_NAME = 'RotaAgroOfflineDB';
const DB_VERSION = 2;

export interface ParcelTelemetrySnapshot {
  farmId: string;
  farmName: string;
  gwetroot: number;
  gwettop: number;
  gwetprof: number;
  prectotMmDay: number;
  t2mC: number;
  t2mMaxC: number;
  t2mMinC: number;
  rh2mPct: number;
  solarMjDay: number;
  ws2mMs: number;
  savedAt: string;
}

export interface AiConsultHistoryEntry {
  id: string;
  fecha: string;
  fincaNombre: string;
  cultivo: string;
  humedadSuelo: number;
  consulta: string;
  respuesta: string;
}

export function openRotaAgroDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB not supported'));
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains('keyval')) {
        db.createObjectStore('keyval');
      }
      if (!db.objectStoreNames.contains('telemetry_snapshots')) {
        db.createObjectStore('telemetry_snapshots', { keyPath: 'farmId' });
      }
      if (!db.objectStoreNames.contains('ai_history')) {
        db.createObjectStore('ai_history', { keyPath: 'id' });
      }
    };
  });
}

export async function dbSet(key: string, val: any): Promise<void> {
  try {
    const db = await openRotaAgroDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('keyval', 'readwrite');
      const store = transaction.objectStore('keyval');
      const request = store.put(val, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch {}
  }
}

export async function dbGet(key: string): Promise<any> {
  try {
    const db = await openRotaAgroDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction('keyval', 'readonly');
      const store = transaction.objectStore('keyval');
      const request = store.get(key);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch {
    try {
      const val = localStorage.getItem(key);
      return val ? JSON.parse(val) : undefined;
    } catch {
      return undefined;
    }
  }
}

export async function saveParcelTelemetrySnapshot(snapshot: ParcelTelemetrySnapshot): Promise<void> {
  try {
    const db = await openRotaAgroDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('telemetry_snapshots', 'readwrite');
      const store = tx.objectStore('telemetry_snapshots');
      const req = store.put(snapshot);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    await dbSet(`telemetry_${snapshot.farmId}`, snapshot);
  }
}

export async function loadParcelTelemetrySnapshot(
  farmId: string
): Promise<ParcelTelemetrySnapshot | null> {
  try {
    const db = await openRotaAgroDB();
    const res = await new Promise<ParcelTelemetrySnapshot | undefined>((resolve, reject) => {
      const tx = db.transaction('telemetry_snapshots', 'readonly');
      const store = tx.objectStore('telemetry_snapshots');
      const req = store.get(farmId);
      req.onsuccess = () => resolve(req.result as ParcelTelemetrySnapshot | undefined);
      req.onerror = () => reject(req.error);
    });
    return res || null;
  } catch {
    const fallback = await dbGet(`telemetry_${farmId}`);
    return fallback || null;
  }
}

export async function saveAiConsultationEntry(entry: AiConsultHistoryEntry): Promise<void> {
  try {
    const db = await openRotaAgroDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('ai_history', 'readwrite');
      const store = tx.objectStore('ai_history');
      const req = store.put(entry);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const existing = (await dbGet('rotaagro_ai_history')) || [];
    const updated = [entry, ...existing.filter((e: AiConsultHistoryEntry) => e.id !== entry.id)].slice(0, 25);
    await dbSet('rotaagro_ai_history', updated);
  }
}

export async function loadAiConsultationHistory(): Promise<AiConsultHistoryEntry[]> {
  try {
    const db = await openRotaAgroDB();
    const items = await new Promise<AiConsultHistoryEntry[]>((resolve, reject) => {
      const tx = db.transaction('ai_history', 'readonly');
      const store = tx.objectStore('ai_history');
      const req = store.getAll();
      req.onsuccess = () => resolve((req.result as AiConsultHistoryEntry[]) || []);
      req.onerror = () => reject(req.error);
    });
    return items.sort((a, b) => (b.fecha > a.fecha ? 1 : -1)).slice(0, 25);
  } catch {
    const fallback = await dbGet('rotaagro_ai_history');
    return Array.isArray(fallback) ? fallback : [];
  }
}

export async function deleteAiConsultationEntry(id: string): Promise<void> {
  try {
    const db = await openRotaAgroDB();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction('ai_history', 'readwrite');
      const store = tx.objectStore('ai_history');
      const req = store.delete(id);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch {
    const existing = (await dbGet('rotaagro_ai_history')) || [];
    const updated = existing.filter((e: AiConsultHistoryEntry) => e.id !== id);
    await dbSet('rotaagro_ai_history', updated);
  }
}
