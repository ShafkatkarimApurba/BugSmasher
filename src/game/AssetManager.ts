export class AssetManager {
  private images: Map<string, HTMLImageElement> = new Map();
  private audioContextInitialized: boolean = false;
  
  // Default backgrounds to preload for instant switching
  private defaultAssets: string[] = [
    'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=1920&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?q=80&w=1920&auto=format&fit=crop'
  ];

  async preloadAll(onProgress?: (progress: number) => void): Promise<void> {
    let loaded = 0;
    const total = this.defaultAssets.length;

    if (total === 0) {
      onProgress?.(100);
      return;
    }

    const promises = this.defaultAssets.map((url) => {
      return new Promise<void>((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
          this.images.set(url, img);
          loaded++;
          onProgress?.(Math.round((loaded / total) * 100));
          resolve();
        };
        img.onerror = () => {
          console.warn(`Failed to preload image: ${url}`);
          loaded++;
          onProgress?.(Math.round((loaded / total) * 100));
          resolve(); // Resolve anyway so we don't block the game
        };
        img.src = url;
      });
    });

    await Promise.all(promises);
  }

  getImage(url: string): HTMLImageElement | null {
    if (this.images.has(url)) {
      return this.images.get(url)!;
    }
    
    // If we request an ad-hoc image that wasn't preloaded (e.g. Gemini gen)
    // we return null initially, trigger load, and store it.
    if (url.startsWith('data:')) {
       const img = new Image();
       img.src = url;
       this.images.set(url, img);
       return img;
    }
    
    return null;
  }
}

export const assetManager = new AssetManager();
