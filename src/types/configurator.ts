export type TentSizeId = '5x5' | '6.5x6.5' | '8x8';

export interface TentSizeOption {
  id: TentSizeId;
  name: string;
  dimensions: string;
  modelPath: string;
  basePrice: number;
  popular?: boolean;
  scale: [number, number, number];
}

export type FrameTypeId = 'steel' | 'aluminum' | 'hex_aluminum';

export interface FrameTypeOption {
  id: FrameTypeId;
  name: string;
  description: string;
  priceModifier: number;
  weight: string;
  warranty: string;
  metalColor: string;
  roughness: number;
  metalness: number;
}

export interface CanopyColorOption {
  id: string;
  name: string;
  hex: string;
  textContrast: 'light' | 'dark';
}

export type SectionType = 'peak' | 'valance' | 'wall';

export type SectionId =
  | 'peak_front'
  | 'peak_back'
  | 'peak_left'
  | 'peak_right'
  | 'valance_front'
  | 'valance_back'
  | 'valance_left'
  | 'valance_right'
  | 'wall_back'
  | 'wall_left'
  | 'wall_right';

export interface SectionDefinition {
  id: SectionId;
  name: string;
  group: 'peaks' | 'valances' | 'walls';
  type: SectionType;
  uvBounds: {
    uMin: number;
    uMax: number;
    vMin: number;
    vMax: number;
  };
  canvasWidth: number;
  canvasHeight: number;
  isPolygon?: boolean;
  polygonPoints?: [number, number][]; // normalized [0-1] coordinates
  cameraTargetPreset: 'front' | 'back' | 'left' | 'right' | 'top' | 'iso';
}

export interface TextElement {
  id: string;
  text: string;
  fontFamily: string;
  fontSize: number; // in pixels relative to section canvas
  color: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  rotation: number; // degrees
  bold: boolean;
  letterSpacing: number; // pixels
}

export interface ImageElement {
  id: string;
  src: string;
  fileName: string;
  x: number; // percentage (0 - 100)
  y: number; // percentage (0 - 100)
  scale: number; // 0.1 to 3.0
  rotation: number; // degrees
  aspectRatio: number;
}

export interface SectionConfig {
  sectionId: SectionId;
  customColor: string | null; // null means inherit canopy base color
  textElements: TextElement[];
  imageElements: ImageElement[];
}

export type WallOptionId = 'none' | 'full' | 'half' | 'window';

export interface WallsConfig {
  backWall: WallOptionId;
  leftWall: WallOptionId;
  rightWall: WallOptionId;
}

export interface AccessoryOption {
  id: string;
  name: string;
  description: string;
  price: number;
  iconName: string;
}

export interface PricingBreakdown {
  basePrice: number;
  framePrice: number;
  customPeakPrice: number;
  customValancePrice: number;
  wallsPrice: number;
  accessoriesPrice: number;
  subtotal: number;
  shipping: number;
  estimatedTax: number;
  total: number;
  itemizedLines: {
    label: string;
    detail?: string;
    amount: number;
  }[];
}

export interface ConfiguratorState {
  size: TentSizeId;
  frameType: FrameTypeId;
  canopyColor: string; // hex
  customCanopyColorHex: string;
  activeSectionId: SectionId;
  sections: Record<SectionId, SectionConfig>;
  walls: WallsConfig;
  accessories: string[]; // list of accessory IDs
  cameraPreset: 'front' | 'back' | 'left' | 'right' | 'top' | 'iso';
  editorViewMode: 'split' | '3d-only' | '2d-only';
  environmentPreset: 'studio' | 'outdoor' | 'fairground';
  autoRotate: boolean;
  showWireframe: boolean;
  showSafePrintMargins: boolean;
  isCapturingPdf: boolean;
  isAddingToCart: boolean;
}

export interface ShopifyCartPayload {
  items: Array<{
    id: number;
    quantity: number;
    properties: Record<string, string>;
  }>;
}

export interface IframeMessagePayload {
  type:
    | 'CONFIGURATOR_READY'
    | 'CONFIGURATION_CHANGED'
    | 'PRICE_UPDATED'
    | 'ADDED_TO_CART'
    | 'PDF_GENERATED'
    | 'SET_CONFIGURATION'
    | 'GET_CONFIGURATION'
    | 'ADD_TO_CART';
  data?: unknown;
}
