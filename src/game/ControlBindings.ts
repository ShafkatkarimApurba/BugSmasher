export interface ControlBindings {
  fire: string;
  dash: string;
  pause: string;
}

const STORAGE_KEY = 'bugsmasher_controls';
const CHANGE_EVENT = 'bugsmasher:controls-changed';

export const DEFAULT_BINDINGS: ControlBindings = {
  fire: 'Mouse0',
  dash: 'Space',
  pause: 'Escape',
};

export function loadControlBindings(): ControlBindings {
  if (typeof window === 'undefined') return { ...DEFAULT_BINDINGS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_BINDINGS };
    return { ...DEFAULT_BINDINGS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_BINDINGS };
  }
}

export function saveControlBindings(bindings: ControlBindings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(bindings));
  window.dispatchEvent(new CustomEvent<ControlBindings>(CHANGE_EVENT, { detail: bindings }));
}

export function subscribeControlBindings(listener: (b: ControlBindings) => void): () => void {
  if (typeof window === 'undefined') {
    listener(loadControlBindings());
    return () => {};
  }
  const handler = (e: Event) => {
    listener((e as CustomEvent<ControlBindings>).detail ?? loadControlBindings());
  };
  window.addEventListener(CHANGE_EVENT, handler);
  listener(loadControlBindings());
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}

export function matchesBinding(code: string, binding: string): boolean {
  return code === binding;
}