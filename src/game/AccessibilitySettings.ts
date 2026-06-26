/**
 * Player accessibility preferences — persisted in localStorage.
 */

import type { CSSProperties } from 'react';

export type DifficultyId = 'easy' | 'normal' | 'hard';
export type ColorblindMode = 'off' | 'protanopia' | 'deuteranopia' | 'tritanopia';

export interface AccessibilitySettings {
  colorblindMode: ColorblindMode;
  reducedMotion: boolean;
  showEnemyShapes: boolean;
  difficulty: DifficultyId;
  gamepadEnabled: boolean;
}

const STORAGE_KEY = 'bugsmasher_accessibility';
const CHANGE_EVENT = 'bugsmasher:accessibility-changed';

/** CSS filter values for canvas colorblind assist (WCAG-oriented simulation) */
export const COLORBLIND_FILTERS: Record<ColorblindMode, string | undefined> = {
  off: undefined,
  protanopia: 'url(#protanopia) saturate(1.1)',
  deuteranopia: 'url(#deuteranopia) saturate(1.1)',
  tritanopia: 'url(#tritanopia) saturate(1.1)',
};

/** Simplified matrix filters when SVG defs unavailable — applied on game wrapper */
export const COLORBLIND_CSS_FILTERS: Record<ColorblindMode, string | undefined> = {
  off: undefined,
  protanopia:
    'contrast(1.05) sepia(0.15) saturate(1.2) hue-rotate(-20deg)',
  deuteranopia:
    'contrast(1.05) sepia(0.1) saturate(1.15) hue-rotate(10deg)',
  tritanopia:
    'contrast(1.05) saturate(0.9) hue-rotate(180deg)',
};

export function getColorblindCanvasStyle(mode: ColorblindMode): CSSProperties | undefined {
  const filter = COLORBLIND_CSS_FILTERS[mode];
  if (!filter) return undefined;
  return { filter };
}

export const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  colorblindMode: 'off',
  reducedMotion: false,
  showEnemyShapes: false,
  difficulty: 'normal',
  gamepadEnabled: true,
};

/** Difficulty multipliers applied in GameEngine on session start */
export const DIFFICULTY_PRESETS: Record<
  DifficultyId,
  { enemySpeed: number; enemyHp: number; playerMaxHealth: number; dropBonus: number }
> = {
  easy: { enemySpeed: 0.85, enemyHp: 0.8, playerMaxHealth: 1.15, dropBonus: 1.1 },
  normal: { enemySpeed: 1.0, enemyHp: 1.0, playerMaxHealth: 1.0, dropBonus: 1.0 },
  hard: { enemySpeed: 1.15, enemyHp: 1.25, playerMaxHealth: 0.9, dropBonus: 0.9 },
};

export function loadAccessibilitySettings(): AccessibilitySettings {
  if (typeof window === 'undefined') return { ...DEFAULT_ACCESSIBILITY };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_ACCESSIBILITY };
    return { ...DEFAULT_ACCESSIBILITY, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_ACCESSIBILITY };
  }
}

export function saveAccessibilitySettings(settings: AccessibilitySettings): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(
    new CustomEvent<AccessibilitySettings>(CHANGE_EVENT, { detail: settings })
  );
}

export function subscribeAccessibility(
  listener: (settings: AccessibilitySettings) => void
): () => void {
  if (typeof window === 'undefined') {
    listener(loadAccessibilitySettings());
    return () => {};
  }
  const handler = (e: Event) => {
    const detail = (e as CustomEvent<AccessibilitySettings>).detail;
    listener(detail ?? loadAccessibilitySettings());
  };
  window.addEventListener(CHANGE_EVENT, handler);
  listener(loadAccessibilitySettings());
  return () => window.removeEventListener(CHANGE_EVENT, handler);
}