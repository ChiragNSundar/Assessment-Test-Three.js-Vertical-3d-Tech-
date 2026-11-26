import * as THREE from 'three';
import {
  ConfiguratorState,
  SectionConfig,
  SectionId,
} from '../types/configurator';

export interface UVTile {
  x: number;
  y: number;
  width: number;
  height: number;
  uMin: number;
  uMax: number;
  vMin: number;
  vMax: number;
}

// 2048x2048 Master Texture Layout mapping
export const UV_TILES: Record<SectionId, UVTile> = {
  peak_front: {
    x: 0,
    y: 0,
    width: 1024,
    height: 1024,
    uMin: 0.0,
    uMax: 0.5,
    vMin: 0.5,
    vMax: 1.0,
  },
  peak_back: {
    x: 1024,
    y: 0,
    width: 1024,
    height: 1024,
    uMin: 0.5,
    uMax: 1.0,
    vMin: 0.5,
    vMax: 1.0,
  },
  peak_left: {
    x: 0,
    y: 1024,
    width: 1024,
    height: 680,
    uMin: 0.0,
    uMax: 0.5,
    vMin: 1.0 - 1704 / 2048,
    vMax: 0.5,
  },
  peak_right: {
    x: 1024,
    y: 1024,
    width: 1024,
    height: 680,
    uMin: 0.5,
    uMax: 1.0,
    vMin: 1.0 - 1704 / 2048,
    vMax: 0.5,
  },
  valance_front: {
    x: 0,
    y: 1704,
    width: 1024,
    height: 172,
    uMin: 0.0,
    uMax: 0.5,
    vMin: 1.0 - 1876 / 2048,
    vMax: 1.0 - 1704 / 2048,
  },
  valance_back: {
    x: 1024,
    y: 1704,
    width: 1024,
    height: 172,
    uMin: 0.5,
    uMax: 1.0,
    vMin: 1.0 - 1876 / 2048,
    vMax: 1.0 - 1704 / 2048,
  },
  valance_left: {
    x: 0,
    y: 1876,
    width: 1024,
    height: 172,
    uMin: 0.0,
    uMax: 0.5,
    vMin: 0.0,
    vMax: 1.0 - 1876 / 2048,
  },
  valance_right: {
    x: 1024,
    y: 1876,
    width: 1024,
    height: 172,
    uMin: 0.5,
    uMax: 1.0,
    vMin: 0.0,
    vMax: 1.0 - 1876 / 2048,
  },
  wall_back: {
    x: 0,
    y: 0,
    width: 1024,
    height: 1024,
    uMin: 0,
    uMax: 1,
    vMin: 0,
    vMax: 1,
  },
  wall_left: {
    x: 0,
    y: 0,
    width: 1024,
    height: 1024,
    uMin: 0,
    uMax: 1,
    vMin: 0,
    vMax: 1,
  },
  wall_right: {
    x: 0,
    y: 0,
    width: 1024,
    height: 1024,
    uMin: 0,
    uMax: 1,
    vMin: 0,
    vMax: 1,
  },
};

export class TextureCompositor {
  private masterCanvas: HTMLCanvasElement;
  private masterCtx: CanvasRenderingContext2D;
  public masterTexture: THREE.CanvasTexture;

  private sectionCanvases: Map<SectionId, HTMLCanvasElement> = new Map();
  private loadedImages: Map<string, HTMLImageElement> = new Map();
  private animationFrameId: number | null = null;

  constructor() {
    this.masterCanvas = document.createElement('canvas');
    this.masterCanvas.width = 2048;
    this.masterCanvas.height = 2048;
    this.masterCtx = this.masterCanvas.getContext('2d', { willReadFrequently: true })!;

    this.masterTexture = new THREE.CanvasTexture(this.masterCanvas);
    this.masterTexture.colorSpace = THREE.SRGBColorSpace;
    this.masterTexture.wrapS = THREE.ClampToEdgeWrapping;
    this.masterTexture.wrapT = THREE.ClampToEdgeWrapping;
    this.masterTexture.generateMipmaps = true;
    this.masterTexture.minFilter = THREE.LinearMipmapLinearFilter;
    this.masterTexture.magFilter = THREE.LinearFilter;
    this.masterTexture.flipY = true;
  }

  /**
   * Preload an image URL into cache and return an HTMLImageElement
   */
  public async preloadImage(src: string): Promise<HTMLImageElement> {
    if (this.loadedImages.has(src)) {
      return this.loadedImages.get(src)!;
    }
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        this.loadedImages.set(src, img);
        resolve(img);
      };
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  }

  /**
   * Render a specific section to its offscreen canvas
   */
  public renderSection(
    sectionId: SectionId,
    config: SectionConfig,
    baseColor: string,
    width = 1000,
    height = 750,
    options: { showMargins?: boolean; isPeakTriangle?: boolean } = {}
  ): HTMLCanvasElement {
    let canvas = this.sectionCanvases.get(sectionId);
    if (!canvas || canvas.width !== width || canvas.height !== height) {
      canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      this.sectionCanvases.set(sectionId, canvas);
    }

    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, width, height);

    // Background color
    ctx.fillStyle = config.customColor || baseColor;
    ctx.fillRect(0, 0, width, height);

    // If peak triangle, draw faint triangular guide mask if requested
    if (options.isPeakTriangle && options.showMargins) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.setLineDash([8, 8]);
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(width / 2, 20);
      ctx.lineTo(width - 20, height - 20);
      ctx.lineTo(20, height - 20);
      ctx.closePath();
      ctx.stroke();

      // Safe printing zone boundary (10% inward)
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      ctx.moveTo(width / 2, 70);
      ctx.lineTo(width - 70, height - 50);
      ctx.lineTo(70, height - 50);
      ctx.closePath();
      ctx.stroke();
      ctx.restore();
    } else if (options.showMargins) {
      // Safe margins for valance or rectangular sections
      ctx.save();
      ctx.strokeStyle = 'rgba(56, 189, 248, 0.5)';
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, width - 40, height - 40);
      ctx.restore();
    }

    // Render Images
    config.imageElements.forEach((imgEl) => {
      const img = this.loadedImages.get(imgEl.src);
      if (img && img.complete) {
        ctx.save();
        const centerX = (imgEl.x / 100) * width;
        const centerY = (imgEl.y / 100) * height;
        ctx.translate(centerX, centerY);
        ctx.rotate((imgEl.rotation * Math.PI) / 180);

        const imgWidth = 250 * imgEl.scale;
        const imgHeight = (imgWidth / imgEl.aspectRatio) || imgWidth;

        ctx.drawImage(img, -imgWidth / 2, -imgHeight / 2, imgWidth, imgHeight);
        ctx.restore();
      }
    });

    // Render Texts
    config.textElements.forEach((textEl) => {
      ctx.save();
      const centerX = (textEl.x / 100) * width;
      const centerY = (textEl.y / 100) * height;

      ctx.translate(centerX, centerY);
      ctx.rotate((textEl.rotation * Math.PI) / 180);

      ctx.font = `${textEl.bold ? 'bold ' : ''}${textEl.fontSize}px "${textEl.fontFamily}", sans-serif`;
      ctx.fillStyle = textEl.color;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      if (textEl.letterSpacing && 'letterSpacing' in ctx) {
        (ctx as unknown as { letterSpacing: string }).letterSpacing = `${textEl.letterSpacing}px`;
      }

      ctx.fillText(textEl.text, 0, 0);
      ctx.restore();
    });

    return canvas;
  }

  /**
   * Updates master 2048x2048 texture by compositing all configured sections
   */
  public updateMasterTexture(state: ConfiguratorState) {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }

    this.animationFrameId = requestAnimationFrame(() => {
      const ctx = this.masterCtx;
      const W = this.masterCanvas.width;
      const H = this.masterCanvas.height;

      // Base background fill
      ctx.fillStyle = state.canopyColor;
      ctx.fillRect(0, 0, W, H);

      // Composite each section
      const sectionKeys: SectionId[] = [
        'peak_front',
        'peak_back',
        'peak_left',
        'peak_right',
        'valance_front',
        'valance_back',
        'valance_left',
        'valance_right',
      ];

      sectionKeys.forEach((secId) => {
        const secConfig = state.sections[secId];
        const tile = UV_TILES[secId];
        if (!tile) return;

        const isPeak = secId.startsWith('peak_');
        const sectionCanvas = this.renderSection(
          secId,
          secConfig,
          state.canopyColor,
          tile.width,
          tile.height,
          { showMargins: false, isPeakTriangle: isPeak }
        );

        ctx.drawImage(sectionCanvas, tile.x, tile.y, tile.width, tile.height);
      });

      this.masterTexture.needsUpdate = true;
      this.animationFrameId = null;
    });
  }

  /**
   * Return high-res data URL for a specific section (for 2D proof / PDF summary)
   */
  public getSectionDataUrl(sectionId: SectionId): string | null {
    const canvas = this.sectionCanvases.get(sectionId);
    return canvas ? canvas.toDataURL('image/png') : null;
  }

  /**
   * Return master canvas data URL (for full unrolled print proof)
   */
  public getMasterDataUrl(): string {
    return this.masterCanvas.toDataURL('image/png');
  }

  public dispose() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    this.masterTexture.dispose();
    this.sectionCanvases.clear();
    this.loadedImages.clear();
  }
}

export const textureCompositor = new TextureCompositor();
