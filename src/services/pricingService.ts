import {
  ConfiguratorState,
  PricingBreakdown,
  SectionId,
} from '../types/configurator';
import { TENT_SIZES, FRAME_TYPES, ACCESSORIES } from '../constants/productData';

class PricingService {
  private cache = new Map<string, PricingBreakdown>();
  private currentAbortController: AbortController | null = null;

  /**
   * Calculates pricing dynamically through a mock API service.
   * Simulates network latency and returns a strongly-typed pricing breakdown.
   */
  async calculatePricing(
    state: ConfiguratorState,
    signal?: AbortSignal
  ): Promise<PricingBreakdown> {
    const cacheKey = this.generateCacheKey(state);
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    // Cancel in-flight calculation if exists
    if (this.currentAbortController) {
      this.currentAbortController.abort();
    }
    this.currentAbortController = new AbortController();
    const effectiveSignal = signal || this.currentAbortController.signal;

    // Simulate async API call latency (80-120ms)
    await new Promise((resolve, reject) => {
      const timer = setTimeout(resolve, 90);
      effectiveSignal.addEventListener('abort', () => {
        clearTimeout(timer);
        reject(new DOMException('Aborted', 'AbortError'));
      });
    });

    const breakdown = this.computeBreakdown(state);
    this.cache.set(cacheKey, breakdown);
    return breakdown;
  }

  private computeBreakdown(state: ConfiguratorState): PricingBreakdown {
    const itemizedLines: PricingBreakdown['itemizedLines'] = [];

    // 1. Base canopy & size
    const sizeConfig = TENT_SIZES.find((s) => s.id === state.size) || TENT_SIZES[0];
    const basePrice = sizeConfig.basePrice;
    itemizedLines.push({
      label: `Canopy Tent Top (${sizeConfig.name})`,
      detail: `Commercial 600D UV/Water-Resistant Fabric - ${sizeConfig.dimensions}`,
      amount: basePrice,
    });

    // 2. Frame variant
    const frameConfig = FRAME_TYPES.find((f) => f.id === state.frameType) || FRAME_TYPES[0];
    const framePrice = frameConfig.priceModifier;
    if (framePrice > 0) {
      itemizedLines.push({
        label: `Frame Upgrade: ${frameConfig.name}`,
        detail: `${frameConfig.weight}, ${frameConfig.warranty}`,
        amount: framePrice,
      });
    } else {
      itemizedLines.push({
        label: `Standard Frame: ${frameConfig.name}`,
        detail: `${frameConfig.weight}, Included`,
        amount: 0,
      });
    }

    // 3. Custom Peak Printing fees ($40 each printed peak)
    const peakIds: SectionId[] = ['peak_front', 'peak_back', 'peak_left', 'peak_right'];
    let customPeakPrice = 0;
    peakIds.forEach((pid) => {
      const sec = state.sections[pid];
      if (sec && (sec.textElements.length > 0 || sec.imageElements.length > 0)) {
        customPeakPrice += 40;
        const faceName = pid.replace('peak_', '').toUpperCase();
        itemizedLines.push({
          label: `Custom Print: Peak ${faceName}`,
          detail: 'Full-Color Dye-Sublimation Print',
          amount: 40,
        });
      }
    });

    // 4. Custom Valance Printing fees ($25 each printed valance)
    const valanceIds: SectionId[] = [
      'valance_front',
      'valance_back',
      'valance_left',
      'valance_right',
    ];
    let customValancePrice = 0;
    valanceIds.forEach((vid) => {
      const sec = state.sections[vid];
      if (sec && (sec.textElements.length > 0 || sec.imageElements.length > 0)) {
        customValancePrice += 25;
        const faceName = vid.replace('valance_', '').toUpperCase();
        itemizedLines.push({
          label: `Custom Print: Valance ${faceName}`,
          detail: 'High-Resolution Edge-to-Edge Print',
          amount: 25,
        });
      }
    });

    // 5. Walls
    let wallsPrice = 0;
    if (state.walls.backWall === 'full') {
      wallsPrice += 89;
      itemizedLines.push({
        label: 'Full Solid Back Wall',
        detail: 'Heavy-Duty 600D with Velcro Attachment Straps',
        amount: 89,
      });
    } else if (state.walls.backWall === 'window') {
      wallsPrice += 115;
      itemizedLines.push({
        label: 'Back Wall with Panoramic Window',
        detail: 'Clear PVC Window Inset + Heavy-Duty Canopy Fabric',
        amount: 115,
      });
    }

    if (state.walls.leftWall === 'half') {
      wallsPrice += 49;
      itemizedLines.push({
        label: 'Left Half-Wall with Support Bar',
        detail: 'Includes Aluminum Telescoping Support Bar & Clamps',
        amount: 49,
      });
    } else if (state.walls.leftWall === 'full') {
      wallsPrice += 79;
      itemizedLines.push({
        label: 'Left Full Wall Panel',
        detail: 'Full solid side enclosure',
        amount: 79,
      });
    }

    if (state.walls.rightWall === 'half') {
      wallsPrice += 49;
      itemizedLines.push({
        label: 'Right Half-Wall with Support Bar',
        detail: 'Includes Aluminum Telescoping Support Bar & Clamps',
        amount: 49,
      });
    } else if (state.walls.rightWall === 'full') {
      wallsPrice += 79;
      itemizedLines.push({
        label: 'Right Full Wall Panel',
        detail: 'Full solid side enclosure',
        amount: 79,
      });
    }

    // 6. Accessories
    let accessoriesPrice = 0;
    state.accessories.forEach((accId) => {
      const acc = ACCESSORIES.find((a) => a.id === accId);
      if (acc) {
        accessoriesPrice += acc.price;
        itemizedLines.push({
          label: `Accessory: ${acc.name}`,
          detail: acc.description,
          amount: acc.price,
        });
      }
    });

    const subtotal =
      basePrice +
      framePrice +
      customPeakPrice +
      customValancePrice +
      wallsPrice +
      accessoriesPrice;

    // Free standard ground shipping for tent packages
    const shipping = 0;
    const estimatedTax = Math.round(subtotal * 0.07 * 100) / 100; // 7.0% tax
    const total = Math.round((subtotal + shipping + estimatedTax) * 100) / 100;

    return {
      basePrice,
      framePrice,
      customPeakPrice,
      customValancePrice,
      wallsPrice,
      accessoriesPrice,
      subtotal,
      shipping,
      estimatedTax,
      total,
      itemizedLines,
    };
  }

  private generateCacheKey(state: ConfiguratorState): string {
    const customPeakCounts = ['peak_front', 'peak_back', 'peak_left', 'peak_right'].filter(
      (id) =>
        state.sections[id as SectionId]?.textElements.length > 0 ||
        state.sections[id as SectionId]?.imageElements.length > 0
    ).join(',');

    const customValanceCounts = [
      'valance_front',
      'valance_back',
      'valance_left',
      'valance_right',
    ].filter(
      (id) =>
        state.sections[id as SectionId]?.textElements.length > 0 ||
        state.sections[id as SectionId]?.imageElements.length > 0
    ).join(',');

    return `${state.size}_${state.frameType}_${customPeakCounts}_${customValanceCounts}_${state.walls.backWall}_${state.walls.leftWall}_${state.walls.rightWall}_${state.accessories.sort().join(',')}`;
  }
}

export const pricingService = new PricingService();
