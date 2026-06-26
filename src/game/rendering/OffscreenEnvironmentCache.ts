import { GameEngine } from '../GameEngine';

/**
 * Caches static environment layers (grid / starfield) to an offscreen canvas.
 */
export class OffscreenEnvironmentCache {
  private canvas: OffscreenCanvas | HTMLCanvasElement | null = null;
  private ctx: OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D | null = null;
  private cacheKey = '';

  invalidate(): void {
    this.cacheKey = '';
  }

  private ensureCanvas(width: number, height: number): boolean {
    if (typeof OffscreenCanvas !== 'undefined') {
      if (!this.canvas || (this.canvas as OffscreenCanvas).width !== width) {
        this.canvas = new OffscreenCanvas(width, height);
        this.ctx = this.canvas.getContext('2d');
      }
      return !!this.ctx;
    }
    if (!this.canvas) {
      this.canvas = document.createElement('canvas');
    }
    const c = this.canvas as HTMLCanvasElement;
    if (c.width !== width || c.height !== height) {
      c.width = width;
      c.height = height;
      this.ctx = c.getContext('2d');
    }
    return !!this.ctx;
  }

  /**
   * Renders static layer if cache miss; returns true if blit was performed.
   */
  blitStaticLayer(
    engine: GameEngine,
    biomeId: string,
    drawStatic: (ctx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D) => void
  ): boolean {
    const key = `${biomeId}:${engine.width}x${engine.height}`;
    if (!this.ensureCanvas(engine.width, engine.height) || !this.ctx) return false;

    if (this.cacheKey !== key) {
      this.ctx.clearRect(0, 0, engine.width, engine.height);
      drawStatic(this.ctx);
      this.cacheKey = key;
    }

    engine.ctx.drawImage(this.canvas as CanvasImageSource, 0, 0);
    return true;
  }
}