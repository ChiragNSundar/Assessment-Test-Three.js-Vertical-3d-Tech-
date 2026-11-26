import {
  ConfiguratorState,
  PricingBreakdown,
  ShopifyCartPayload,
  SectionId,
} from '../types/configurator';
import { TENT_SIZES, FRAME_TYPES, ACCESSORIES, CANOPY_COLORS } from '../constants/productData';

export interface ShopifyCartResult {
  success: boolean;
  cartToken: string;
  itemCount: number;
  totalPrice: number;
  lineItem: {
    title: string;
    variantTitle: string;
    price: number;
    quantity: number;
    properties: Record<string, string>;
  };
}

class ShopifyService {
  /**
   * Generates standard Shopify line item properties according to Shopify Cart API standards.
   * Internal properties prefixed with '_' are hidden from the customer in standard liquid templates
   * but available to fulfillment, print technicians, and CRM webhooks.
   */
  generateCartProperties(
    state: ConfiguratorState,
    pricing: PricingBreakdown,
    pdfBlobUrl?: string
  ): Record<string, string> {
    const sizeConfig = TENT_SIZES.find((s) => s.id === state.size);
    const frameConfig = FRAME_TYPES.find((f) => f.id === state.frameType);
    const colorConfig = CANOPY_COLORS.find(
      (c) => c.hex.toLowerCase() === state.canopyColor.toLowerCase()
    );

    const customSections: string[] = [];
    (Object.keys(state.sections) as SectionId[]).forEach((sid) => {
      const sec = state.sections[sid];
      if (sec && (sec.textElements.length > 0 || sec.imageElements.length > 0)) {
        customSections.push(sid.replace('_', ' ').toUpperCase());
      }
    });

    const wallSelections: string[] = [];
    if (state.walls.backWall !== 'none') wallSelections.push(`Back Wall (${state.walls.backWall})`);
    if (state.walls.leftWall !== 'none') wallSelections.push(`Left Wall (${state.walls.leftWall})`);
    if (state.walls.rightWall !== 'none') wallSelections.push(`Right Wall (${state.walls.rightWall})`);

    const accessoryNames = state.accessories
      .map((id) => ACCESSORIES.find((a) => a.id === id)?.name)
      .filter(Boolean);

    const configId = 'CFG-' + Math.random().toString(36).substring(2, 9).toUpperCase();

    const properties: Record<string, string> = {
      _config_id: configId,
      'Tent Size': sizeConfig?.name || state.size,
      'Frame Type': frameConfig?.name || state.frameType,
      'Canopy Color': colorConfig ? `${colorConfig.name} (${colorConfig.hex})` : state.canopyColor,
      'Custom Printed Sections':
        customSections.length > 0 ? customSections.join(', ') : 'None (Blank Canopy)',
      'Wall Packages': wallSelections.length > 0 ? wallSelections.join(', ') : 'None',
      Accessories: accessoryNames.length > 0 ? accessoryNames.join(', ') : 'None',
      'Total Calculated Price': `$${pricing.total.toFixed(2)}`,
      _production_ready: 'true',
      _timestamp: new Date().toISOString(),
    };

    if (pdfBlobUrl) {
      properties['_production_proof_url'] = pdfBlobUrl;
    }

    // Minified structured data representation for downstream CRM / ERP ingestion
    const compactState = {
      size: state.size,
      frame: state.frameType,
      color: state.canopyColor,
      walls: state.walls,
      accessories: state.accessories,
      customSectionCount: customSections.length,
    };
    properties['_raw_config_json'] = JSON.stringify(compactState);

    return properties;
  }

  /**
   * Simulates adding to Shopify Cart using the standard Shopify AJAX API format (`/cart/add.js`)
   */
  async addToCart(
    state: ConfiguratorState,
    pricing: PricingBreakdown,
    pdfBlobUrl?: string
  ): Promise<ShopifyCartResult> {
    const properties = this.generateCartProperties(state, pricing, pdfBlobUrl);

    // Mock variant ID mapping (in production, mapped from size + frame Shopify Variant Matrix)
    const variantIdMap: Record<string, number> = {
      '5x5_steel': 420101,
      '5x5_aluminum': 420102,
      '5x5_hex_aluminum': 420103,
      '6.5x6.5_steel': 420201,
      '6.5x6.5_aluminum': 420202,
      '6.5x6.5_hex_aluminum': 420203,
      '8x8_steel': 420301,
      '8x8_aluminum': 420302,
      '8x8_hex_aluminum': 420303,
    };

    const variantKey = `${state.size}_${state.frameType}`;
    const variantId = variantIdMap[variantKey] || 420000;

    const payload: ShopifyCartPayload = {
      items: [
        {
          id: variantId,
          quantity: 1,
          properties,
        },
      ],
    };

    // Simulate Shopify Cart API network roundtrip
    await new Promise((resolve) => setTimeout(resolve, 600));

    // Notify parent window if embedded in iframe
    if (window.parent && window.parent !== window) {
      window.parent.postMessage(
        {
          type: 'ADDED_TO_CART',
          payload,
          pricing,
        },
        '*'
      );
    }

    // Dispatch DOM event for custom Shopify themes (e.g., Shopify Dawn drawer trigger)
    const cartEvent = new CustomEvent('shopify:cart:added', {
      detail: { payload, pricing },
    });
    window.dispatchEvent(cartEvent);

    return {
      success: true,
      cartToken: 'shptkn_' + Math.random().toString(36).substring(2, 12),
      itemCount: 1,
      totalPrice: pricing.total,
      lineItem: {
        title: 'Custom Canopy Tent - MVP Visuals Spec',
        variantTitle: `${properties['Tent Size']} / ${properties['Frame Type']}`,
        price: pricing.total,
        quantity: 1,
        properties,
      },
    };
  }
}

export const shopifyService = new ShopifyService();
