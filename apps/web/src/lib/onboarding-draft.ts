const DRAFT_KEY = "kayou.providerDraft";
export const DRAFT_VERSION = 1;

type Envelope<T> = { v: number; savedAt: string; draft: T };

/** Reads the wizard draft saved on this tab; a stale version is discarded. */
export function readDraft<T>(): T | null {
  try {
    const raw = window.sessionStorage.getItem(DRAFT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<Envelope<T>>;
    if (parsed.v !== DRAFT_VERSION || !parsed.draft) return null;
    return parsed.draft;
  } catch {
    return null;
  }
}

export function writeDraft<T>(draft: T): void {
  try {
    const envelope: Envelope<T> = { v: DRAFT_VERSION, savedAt: new Date().toISOString(), draft };
    window.sessionStorage.setItem(DRAFT_KEY, JSON.stringify(envelope));
  } catch {
    // Quota or private mode: the wizard still works within the page's lifetime.
  }
}

export function clearDraft(): void {
  try {
    window.sessionStorage.removeItem(DRAFT_KEY);
  } catch {
    // ignore
  }
}
