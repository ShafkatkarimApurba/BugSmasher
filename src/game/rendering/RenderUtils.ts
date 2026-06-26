/**
 * Shared color utility to apply alpha transparency to Hex and RGB/RGBA color strings.
 * Helps prevent duplication across BloomSystem and DynamicLightingSystem (DRY compliance).
 */
export function applyAlpha(color: string, alpha: number): string {
  // Handle hex colors
  if (color.startsWith('#')) {
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
  }
  // Handle rgb() / rgba()
  if (color.startsWith('rgb(') || color.startsWith('rgba(')) {
    const match = color.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
    if (match) {
      return `rgba(${match[1]},${match[2]},${match[3]},${alpha})`;
    }
  }
  return color;
}
