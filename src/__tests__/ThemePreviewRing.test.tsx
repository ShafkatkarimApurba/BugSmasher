/**
 * Tests for ThemePreviewRing and ThemePattern Armory components.
 *
 * Uses jsdom + React 19's createRoot API directly (no @testing-library dependency).
 */
import { describe, it, expect, afterEach, vi } from 'vitest';
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';

// Mock motion (framer-motion) to avoid jsdom incompatibilities
vi.mock('motion/react', () => ({
  motion: { div: 'div', button: 'button', span: 'span', p: 'p', svg: 'svg', ul: 'ul', li: 'li' },
  AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock lucide-react icons to avoid import issues
vi.mock('lucide-react', () => {
  const mockIcon = (props: any) => React.createElement('svg', props);
  return {
    X: mockIcon,
    Gem: mockIcon,
    Palette: mockIcon,
    Star: mockIcon,
    Crown: mockIcon,
    KeyRound: mockIcon,
    Sparkles: mockIcon,
    Bug: mockIcon,
    Shield: mockIcon,
    Wrench: mockIcon,
    ChevronRight: mockIcon,
  };
});

// Mock SoundManager to avoid AudioContext issues
vi.mock('../game/SoundManager', () => ({
  soundManager: {
    uiHover: vi.fn(),
    uiClick: vi.fn(),
    uiError: vi.fn(),
    armoryEquip: vi.fn(),
    armoryTabSwitch: vi.fn(),
    armoryUnlockTier: vi.fn(),
    powerup: vi.fn(),
  },
}));

import { ThemePreviewRing, ThemePattern } from '../components/Armory';
import { CORE_THEMES } from '../game/CosmeticsManager';

// ===== COLOR HELPER =====
// Convert hex color to rgb() string for jsdom compatibility

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

// ===== RENDER HELPER =====
// Uses act() to flush React rendering synchronously

interface RenderResult {
  container: HTMLElement;
  root: Root;
}

function renderComponent(component: React.ReactElement): RenderResult {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const root = createRoot(container);
  act(() => {
    root.render(component);
  });
  return { container, root };
}

function cleanup(result: RenderResult) {
  act(() => {
    result.root.unmount();
  });
  document.body.removeChild(result.container);
}

// =============================================================================
// ThemePreviewRing
// =============================================================================

describe('ThemePreviewRing', () => {
  let result: RenderResult | null = null;

  afterEach(() => {
    if (result) {
      cleanup(result);
      result = null;
    }
  });

  it('should return null for an invalid themeId', () => {
    result = renderComponent(
      React.createElement(ThemePreviewRing, { themeId: 'theme_nonexistent' as any, unlocked: true, active: false })
    );
    expect(result.container.children.length).toBe(0);
  });

  it('should render a preview ring div for a valid themeId', () => {
    result = renderComponent(
      React.createElement(ThemePreviewRing, { themeId: 'theme_void', unlocked: true, active: false })
    );
    const ring = result.container.querySelector('.theme-preview-ring');
    expect(ring).not.toBeNull();
  });

  it('should apply opacity-30 class when locked', () => {
    result = renderComponent(
      React.createElement(ThemePreviewRing, { themeId: 'theme_void', unlocked: false, active: false })
    );
    const ring = result.container.querySelector('.theme-preview-ring');
    expect(ring!.className).toContain('opacity-30');
  });

  it('should NOT apply opacity-30 when unlocked', () => {
    result = renderComponent(
      React.createElement(ThemePreviewRing, { themeId: 'theme_void', unlocked: true, active: false })
    );
    const ring = result.container.querySelector('.theme-preview-ring');
    expect(ring!.className).not.toContain('opacity-30');
  });

  it('should apply ring-2 ring-white/40 when active and unlocked', () => {
    result = renderComponent(
      React.createElement(ThemePreviewRing, { themeId: 'theme_void', unlocked: true, active: true })
    );
    const ring = result.container.querySelector('.theme-preview-ring');
    expect(ring!.className).toContain('ring-2');
    expect(ring!.className).toContain('ring-white/40');
  });

  it('should set borderColor to white when active', () => {
    result = renderComponent(
      React.createElement(ThemePreviewRing, { themeId: 'theme_void', unlocked: true, active: true })
    );
    const ring = result.container.querySelector('.theme-preview-ring') as HTMLElement;
    expect(ring.style.borderColor).toBe('rgb(255, 255, 255)');
  });

  it('should set borderColor to theme primary when not active', () => {
    result = renderComponent(
      React.createElement(ThemePreviewRing, { themeId: 'theme_void', unlocked: true, active: false })
    );
    const ring = result.container.querySelector('.theme-preview-ring') as HTMLElement;
    expect(ring.style.borderColor).toBe(hexToRgb(CORE_THEMES.theme_void.colors.primary));
  });

  it('should render ThemePattern when unlocked', () => {
    result = renderComponent(
      React.createElement(ThemePreviewRing, { themeId: 'theme_magma', unlocked: true, active: false })
    );
    const svg = result.container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('should NOT render ThemePattern when locked', () => {
    result = renderComponent(
      React.createElement(ThemePreviewRing, { themeId: 'theme_magma', unlocked: false, active: false })
    );
    const svg = result.container.querySelector('svg');
    expect(svg).toBeNull();
  });

  it('should render 5 orbiting particle dots when unlocked', () => {
    result = renderComponent(
      React.createElement(ThemePreviewRing, { themeId: 'theme_frost', unlocked: true, active: false })
    );
    const particles = result.container.querySelectorAll('.theme-preview-particle');
    expect(particles.length).toBe(5);
  });

  it('should NOT render particles when locked', () => {
    result = renderComponent(
      React.createElement(ThemePreviewRing, { themeId: 'theme_frost', unlocked: false, active: false })
    );
    const particles = result.container.querySelectorAll('.theme-preview-particle');
    expect(particles.length).toBe(0);
  });

  it('should use theme secondary color for the second particle', () => {
    result = renderComponent(
      React.createElement(ThemePreviewRing, { themeId: 'theme_void', unlocked: true, active: false })
    );
    const particles = result.container.querySelectorAll('.theme-preview-particle');
    expect(particles.length).toBe(5);
    expect((particles[1] as HTMLElement).style.backgroundColor).toBe(hexToRgb(CORE_THEMES.theme_void.colors.secondary));
  });

  it('should set CSS custom properties --theme-primary and --theme-glow on the ring', () => {
    result = renderComponent(
      React.createElement(ThemePreviewRing, { themeId: 'theme_magma', unlocked: true, active: false })
    );
    const ring = result.container.querySelector('.theme-preview-ring') as HTMLElement;
    expect(ring.style.getPropertyValue('--theme-primary')).toBe(CORE_THEMES.theme_magma.colors.primary);
    expect(ring.style.getPropertyValue('--theme-glow')).toBe(CORE_THEMES.theme_magma.colors.glow);
  });

  it('should render correctly for all 3 themes', () => {
    const themeIds: Array<keyof typeof CORE_THEMES> = ['theme_void', 'theme_magma', 'theme_frost'];
    for (const id of themeIds) {
      const r = renderComponent(
        React.createElement(ThemePreviewRing, { themeId: id, unlocked: true, active: false })
      );
      const ring = r.container.querySelector('.theme-preview-ring') as HTMLElement;
      expect(ring.style.borderColor).toBe(hexToRgb(CORE_THEMES[id].colors.primary));
      cleanup(r);
    }
  });
});

// =============================================================================
// ThemePattern
// =============================================================================

describe('ThemePattern', () => {
  let result: RenderResult | null = null;

  afterEach(() => {
    if (result) {
      cleanup(result);
      result = null;
    }
  });

  it('should return null for an unknown pattern type', () => {
    result = renderComponent(
      React.createElement(ThemePattern, { pattern: 'unknown', colors: CORE_THEMES.theme_void.colors })
    );
    expect(result.container.children.length).toBe(0);
  });

  it('should render an SVG for the lattice pattern', () => {
    result = renderComponent(
      React.createElement(ThemePattern, { pattern: 'lattice', colors: CORE_THEMES.theme_void.colors })
    );
    const svg = result.container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('should render an SVG for the sine pattern', () => {
    result = renderComponent(
      React.createElement(ThemePattern, { pattern: 'sine', colors: CORE_THEMES.theme_magma.colors })
    );
    const svg = result.container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('should render an SVG for the hex pattern', () => {
    result = renderComponent(
      React.createElement(ThemePattern, { pattern: 'hex', colors: CORE_THEMES.theme_frost.colors })
    );
    const svg = result.container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('should render an SVG for the tech pattern', () => {
    result = renderComponent(
      React.createElement(ThemePattern, { pattern: 'tech', colors: CORE_THEMES.theme_void.colors })
    );
    const svg = result.container.querySelector('svg');
    expect(svg).not.toBeNull();
  });

  it('should fill a rect with the pattern URL', () => {
    result = renderComponent(
      React.createElement(ThemePattern, { pattern: 'lattice', colors: CORE_THEMES.theme_void.colors })
    );
    const svg = result.container.querySelector('svg')!;
    const rect = svg.querySelector('rect');
    expect(rect).not.toBeNull();
    expect(rect!.getAttribute('fill')).toContain('url(#lattice-pattern)');
  });

  it('should set opacity inline on the SVG', () => {
    result = renderComponent(
      React.createElement(ThemePattern, { pattern: 'sine', colors: CORE_THEMES.theme_magma.colors })
    );
    const svg = result.container.querySelector('svg') as unknown as HTMLElement;
    expect(svg.style.opacity).toBeTruthy();
    const opacity = parseFloat(svg.style.opacity);
    expect(opacity).toBeGreaterThan(0);
    expect(opacity).toBeLessThan(1);
  });

  it('should have absolute inset-0 positioning on the SVG', () => {
    result = renderComponent(
      React.createElement(ThemePattern, { pattern: 'hex', colors: CORE_THEMES.theme_frost.colors })
    );
    const svg = result.container.querySelector('svg')!;
    expect(svg.classList.contains('absolute')).toBe(true);
    expect(svg.classList.contains('inset-0')).toBe(true);
  });
});
