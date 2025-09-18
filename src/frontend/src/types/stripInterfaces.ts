// stripInterfaces.ts
// SOLID principle interfaces for strip generation

export interface Layout {
  rows: number;
  cols: number;
  score?: number;
}

export interface StripOptions {
  stampsEarned: number;
  stampsRequired: number;
  iconPath?: string | null;
  scale?: number;
  panelFill?: string;
  circleFill?: string;
  circleStroke?: string;
  circleStrokePx?: number;
}

export interface StripResult {
  x1: Buffer;
  x2: Buffer;
  x3: Buffer;
  size: { w: number; h: number };
}

export interface StripDimensions {
  rows: number;
  cols: number;
  stripWidth: number;
  stripHeight: number;
  safeAreaHeight: number;
  safeAreaPadding: number;
  adjustedGap: number;
  stampDiameter: number;
  scale: number;
}

// SOLID Principle Interfaces

/**
 * Single Responsibility: Calculate optimal layout for stamps
 */
export interface LayoutCalculator {
  calculateOptimalLayout(stampCount: number): Layout;
}

/**
 * Single Responsibility: Calculate strip dimensions and positioning
 */
export interface DimensionCalculator {
  calculateDimensions(stampCount: number, scale?: number): StripDimensions;
}

/**
 * Single Responsibility: Render stamps onto canvas
 */
export interface StripRenderer {
  renderStamps(
    canvas: HTMLCanvasElement,
    layout: Layout,
    dimensions: StripDimensions,
    options: StripOptions
  ): Promise<void>;
}

/**
 * Single Responsibility: Export canvas to different formats
 */
export interface StripExporter {
  exportToPNG(canvas: HTMLCanvasElement): Promise<string>;
  exportToBuffers(canvas: HTMLCanvasElement): Promise<StripResult>;
}

/**
 * Single Responsibility: Generate complete strip images
 */
export interface StripGenerator {
  generateStripImages(options: StripOptions): Promise<StripResult>;
}

/**
 * Single Responsibility: Capture live preview elements
 */
export interface PreviewCapture {
  captureStripElement(element: HTMLElement): Promise<string>;
}
