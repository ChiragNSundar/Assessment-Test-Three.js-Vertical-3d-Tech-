import {
  TentSizeOption,
  FrameTypeOption,
  CanopyColorOption,
  SectionDefinition,
  AccessoryOption,
  ConfiguratorState,
  SectionId,
} from '../types/configurator';

export const TENT_SIZES: TentSizeOption[] = [
  {
    id: '5x5',
    name: '5 x 5 ft Compact',
    dimensions: '60"W x 60"D x 110"H',
    modelPath: '/models/tent_5x5.glb',
    basePrice: 249,
    scale: [1, 1, 1],
  },
  {
    id: '6.5x6.5',
    name: '6.5 x 6.5 ft Standard',
    dimensions: '78"W x 78"D x 115"H',
    modelPath: '/models/tent_6.5x6.5.glb',
    basePrice: 319,
    popular: true,
    scale: [1, 1, 1],
  },
  {
    id: '8x8',
    name: '8 x 8 ft Commercial',
    dimensions: '96"W x 96"D x 128"H',
    modelPath: '/models/tent_8x8.glb',
    basePrice: 389,
    scale: [1, 1, 1],
  },
];

export const FRAME_TYPES: FrameTypeOption[] = [
  {
    id: 'steel',
    name: 'Steel Standard Frame',
    description: 'Durable powder-coated white steel with push-pin locking legs.',
    priceModifier: 0,
    weight: '38 lbs',
    warranty: '1 Year Warranty',
    metalColor: '#e2e8f0',
    roughness: 0.35,
    metalness: 0.8,
  },
  {
    id: 'aluminum',
    name: 'Anodized Aluminum Frame',
    description: 'Lightweight commercial anodized aluminum, rust-free & portable.',
    priceModifier: 85,
    weight: '29 lbs',
    warranty: '5 Year Warranty',
    metalColor: '#cbd5e1',
    roughness: 0.25,
    metalness: 0.9,
  },
  {
    id: 'hex_aluminum',
    name: 'Heavy-Duty Hex Pro Frame',
    description: '50mm hexagonal legs, internal truss support & lifetime durability.',
    priceModifier: 165,
    weight: '44 lbs',
    warranty: 'Lifetime Warranty',
    metalColor: '#334155',
    roughness: 0.2,
    metalness: 0.95,
  },
];

export const CANOPY_COLORS: CanopyColorOption[] = [
  { id: 'white', name: 'Optic White', hex: '#ffffff', textContrast: 'dark' },
  { id: 'royal_blue', name: 'Royal Blue', hex: '#1d4ed8', textContrast: 'light' },
  { id: 'navy', name: 'Deep Navy', hex: '#0f172a', textContrast: 'light' },
  { id: 'crimson', name: 'Crimson Red', hex: '#dc2626', textContrast: 'light' },
  { id: 'forest_green', name: 'Forest Green', hex: '#15803d', textContrast: 'light' },
  { id: 'jet_black', name: 'Jet Black', hex: '#18181b', textContrast: 'light' },
  { id: 'sun_yellow', name: 'Sunburst Yellow', hex: '#facc15', textContrast: 'dark' },
  { id: 'orange', name: 'Tangerine Orange', hex: '#ea580c', textContrast: 'light' },
  { id: 'graphite', name: 'Graphite Gray', hex: '#475569', textContrast: 'light' },
  { id: 'purple', name: 'Imperial Purple', hex: '#7e22ce', textContrast: 'light' },
];

export const SECTIONS: SectionDefinition[] = [
  // Peaks (Triangular roof panels)
  {
    id: 'peak_front',
    name: 'Peak Front',
    group: 'peaks',
    type: 'peak',
    uvBounds: { uMin: 0.077, uMax: 0.731, vMin: 0.504, vMax: 0.924 },
    canvasWidth: 1000,
    canvasHeight: 750,
    isPolygon: true,
    polygonPoints: [
      [0.5, 0.05], // Apex
      [0.95, 0.95], // Bottom right
      [0.05, 0.95], // Bottom left
    ],
    cameraTargetPreset: 'front',
  },
  {
    id: 'peak_back',
    name: 'Peak Back',
    group: 'peaks',
    type: 'peak',
    uvBounds: { uMin: 0.263, uMax: 0.903, vMin: 0.078, vMax: 0.500 },
    canvasWidth: 1000,
    canvasHeight: 750,
    isPolygon: true,
    polygonPoints: [
      [0.5, 0.05],
      [0.95, 0.95],
      [0.05, 0.95],
    ],
    cameraTargetPreset: 'back',
  },
  {
    id: 'peak_left',
    name: 'Peak Left',
    group: 'peaks',
    type: 'peak',
    uvBounds: { uMin: 0.077, uMax: 0.497, vMin: 0.078, vMax: 0.735 },
    canvasWidth: 1000,
    canvasHeight: 750,
    isPolygon: true,
    polygonPoints: [
      [0.5, 0.05],
      [0.95, 0.95],
      [0.05, 0.95],
    ],
    cameraTargetPreset: 'left',
  },
  {
    id: 'peak_right',
    name: 'Peak Right',
    group: 'peaks',
    type: 'peak',
    uvBounds: { uMin: 0.500, uMax: 0.924, vMin: 0.269, vMax: 0.903 },
    canvasWidth: 1000,
    canvasHeight: 750,
    isPolygon: true,
    polygonPoints: [
      [0.5, 0.05],
      [0.95, 0.95],
      [0.05, 0.95],
    ],
    cameraTargetPreset: 'right',
  },

  // Valances (Horizontal overhang flaps)
  {
    id: 'valance_front',
    name: 'Valance Front',
    group: 'valances',
    type: 'valance',
    uvBounds: { uMin: 0.008, uMax: 0.730, vMin: 0.731, vMax: 0.996 },
    canvasWidth: 1200,
    canvasHeight: 280,
    cameraTargetPreset: 'front',
  },
  {
    id: 'valance_back',
    name: 'Valance Back',
    group: 'valances',
    type: 'valance',
    uvBounds: { uMin: 0.263, uMax: 0.994, vMin: 0.007, vMax: 0.273 },
    canvasWidth: 1200,
    canvasHeight: 280,
    cameraTargetPreset: 'back',
  },
  {
    id: 'valance_left',
    name: 'Valance Left',
    group: 'valances',
    type: 'valance',
    uvBounds: { uMin: 0.006, uMax: 0.267, vMin: 0.009, vMax: 0.735 },
    canvasWidth: 1200,
    canvasHeight: 280,
    cameraTargetPreset: 'left',
  },
  {
    id: 'valance_right',
    name: 'Valance Right',
    group: 'valances',
    type: 'valance',
    uvBounds: { uMin: 0.726, uMax: 0.996, vMin: 0.269, vMax: 0.993 },
    canvasWidth: 1200,
    canvasHeight: 280,
    cameraTargetPreset: 'right',
  },

  // Custom Walls
  {
    id: 'wall_back',
    name: 'Full Back Wall',
    group: 'walls',
    type: 'wall',
    uvBounds: { uMin: 0, uMax: 1, vMin: 0, vMax: 1 },
    canvasWidth: 1000,
    canvasHeight: 800,
    cameraTargetPreset: 'back',
  },
  {
    id: 'wall_left',
    name: 'Left Wall',
    group: 'walls',
    type: 'wall',
    uvBounds: { uMin: 0, uMax: 1, vMin: 0, vMax: 1 },
    canvasWidth: 1000,
    canvasHeight: 800,
    cameraTargetPreset: 'left',
  },
  {
    id: 'wall_right',
    name: 'Right Wall',
    group: 'walls',
    type: 'wall',
    uvBounds: { uMin: 0, uMax: 1, vMin: 0, vMax: 1 },
    canvasWidth: 1000,
    canvasHeight: 800,
    cameraTargetPreset: 'right',
  },
];

export const ACCESSORIES: AccessoryOption[] = [
  {
    id: 'sandbags',
    name: 'Heavy-Duty Sandbag Weights (Set of 4)',
    description: 'Rugged 600D polyester anchor bags holding up to 30 lbs each for wind stability.',
    price: 45,
    iconName: 'Shield',
  },
  {
    id: 'roller_bag',
    name: 'Pro Heavy-Duty Wheeled Roller Case',
    description: 'Reinforced nylon travel bag with dual all-terrain rubber wheels and grab handles.',
    price: 69,
    iconName: 'Luggage',
  },
  {
    id: 'led_lighting',
    name: 'Perimeter Clip-On LED Light Kit',
    description: 'Ultra-bright rechargeable 1200 lumen LED strip with dimmer and battery pack.',
    price: 55,
    iconName: 'Lightbulb',
  },
  {
    id: 'flag_mounts',
    name: 'Leg-Mount Feather Flag Clamps (Pair)',
    description: 'Universal aluminum mounting brackets for displaying promotional feather flags.',
    price: 39,
    iconName: 'Flag',
  },
];

export const INITIAL_SECTIONS_STATE: Record<SectionId, {
  sectionId: SectionId;
  customColor: string | null;
  textElements: [];
  imageElements: [];
}> = {
  peak_front: { sectionId: 'peak_front', customColor: null, textElements: [], imageElements: [] },
  peak_back: { sectionId: 'peak_back', customColor: null, textElements: [], imageElements: [] },
  peak_left: { sectionId: 'peak_left', customColor: null, textElements: [], imageElements: [] },
  peak_right: { sectionId: 'peak_right', customColor: null, textElements: [], imageElements: [] },
  valance_front: { sectionId: 'valance_front', customColor: null, textElements: [], imageElements: [] },
  valance_back: { sectionId: 'valance_back', customColor: null, textElements: [], imageElements: [] },
  valance_left: { sectionId: 'valance_left', customColor: null, textElements: [], imageElements: [] },
  valance_right: { sectionId: 'valance_right', customColor: null, textElements: [], imageElements: [] },
  wall_back: { sectionId: 'wall_back', customColor: null, textElements: [], imageElements: [] },
  wall_left: { sectionId: 'wall_left', customColor: null, textElements: [], imageElements: [] },
  wall_right: { sectionId: 'wall_right', customColor: null, textElements: [], imageElements: [] },
};

export const INITIAL_CONFIGURATOR_STATE: ConfiguratorState = {
  size: '6.5x6.5',
  frameType: 'aluminum',
  canopyColor: '#1d4ed8', // Royal Blue
  customCanopyColorHex: '#1d4ed8',
  activeSectionId: 'peak_front',
  sections: INITIAL_SECTIONS_STATE,
  walls: {
    backWall: 'none',
    leftWall: 'none',
    rightWall: 'none',
  },
  accessories: ['roller_bag'],
  cameraPreset: 'front',
  editorViewMode: 'split',
  environmentPreset: 'outdoor',
  autoRotate: false,
  showWireframe: false,
  showSafePrintMargins: true,
  isCapturingPdf: false,
  isAddingToCart: false,
};

export const POPULAR_FONTS = [
  { name: 'Bebas Neue', label: 'Bebas Neue (Bold Display)' },
  { name: 'Montserrat', label: 'Montserrat (Modern Geometric)' },
  { name: 'Inter', label: 'Inter (Clean Sans-Serif)' },
  { name: 'Oswald', label: 'Oswald (Condensed Athletic)' },
  { name: 'Playfair Display', label: 'Playfair (Premium Serif)' },
  { name: 'Roboto', label: 'Roboto (Industrial)' },
];
