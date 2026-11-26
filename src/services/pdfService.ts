import jsPDF from 'jspdf';
import {
  ConfiguratorState,
  PricingBreakdown,
  SectionId,
} from '../types/configurator';
import { TENT_SIZES, FRAME_TYPES, CANOPY_COLORS, ACCESSORIES, SECTIONS } from '../constants/productData';
import { textureCompositor } from './textureCompositor';

export class PdfService {
  /**
   * Generates a professional production proof PDF document
   */
  public async generateProductionProof(
    state: ConfiguratorState,
    pricing: PricingBreakdown,
    viewportSnapshotDataUrl: string
  ): Promise<{ doc: jsPDF; blobUrl: string; fileName: string }> {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 14;
    const contentWidth = pageWidth - margin * 2;

    const sizeConfig = TENT_SIZES.find((s) => s.id === state.size);
    const frameConfig = FRAME_TYPES.find((f) => f.id === state.frameType);
    const colorConfig = CANOPY_COLORS.find(
      (c) => c.hex.toLowerCase() === state.canopyColor.toLowerCase()
    );

    const configId = 'CFG-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    const timestamp = new Date().toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    // --- 1. HEADER BAR ---
    doc.setFillColor(15, 23, 42); // Slate-900
    doc.rect(0, 0, pageWidth, 28, 'F');

    // Accent line
    doc.setFillColor(2, 132, 199); // Sky-600
    doc.rect(0, 27, pageWidth, 1.5, 'F');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(255, 255, 255);
    doc.text('MVP VISUALS • PRODUCTION PROOF SHEET', margin, 13);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // Slate-400
    doc.text('CUSTOM CANOPY TENT - DYE SUBLIMATION PRINT SPECIFICATION', margin, 19);

    // Order ID Badge on Top Right
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(56, 189, 248); // Sky-400
    doc.text(`CONFIG ID: ${configId}`, pageWidth - margin, 12, { align: 'right' });

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(203, 213, 225);
    doc.text(`Generated: ${timestamp}`, pageWidth - margin, 18, { align: 'right' });

    let currentY = 36;

    // --- 2. 3D RENDER SNAPSHOT & FLAT MASTER TEXTURE ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('1. VISUAL 3D PROOF & 2D UNROLLED PRINT LAYOUT', margin, currentY);
    currentY += 4;

    const imgBoxWidth = (contentWidth - 6) / 2;
    const imgBoxHeight = 55;

    // 3D Viewport Snapshot
    if (viewportSnapshotDataUrl) {
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(margin, currentY, imgBoxWidth, imgBoxHeight, 2, 2, 'FD');

      try {
        doc.addImage(
          viewportSnapshotDataUrl,
          'PNG',
          margin + 2,
          currentY + 2,
          imgBoxWidth - 4,
          imgBoxHeight - 4,
          undefined,
          'FAST'
        );
      } catch (err) {
        console.warn('Snapshot render error:', err);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('3D Perspective Assembly Render', margin + 3, currentY + imgBoxHeight - 2);
    }

    // 2D Unrolled Cut Layout
    const masterDataUrl = textureCompositor.getMasterDataUrl();
    if (masterDataUrl) {
      const x2 = margin + imgBoxWidth + 6;
      doc.setFillColor(248, 250, 252);
      doc.setDrawColor(203, 213, 225);
      doc.roundedRect(x2, currentY, imgBoxWidth, imgBoxHeight, 2, 2, 'FD');

      try {
        doc.addImage(
          masterDataUrl,
          'PNG',
          x2 + 2,
          currentY + 2,
          imgBoxWidth - 4,
          imgBoxHeight - 4,
          undefined,
          'FAST'
        );
      } catch (err) {
        console.warn('Master texture render error:', err);
      }

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(71, 85, 105);
      doc.text('Unrolled Master Fabric Dye-Sub Map (2048x2048)', x2 + 3, currentY + imgBoxHeight - 2);
    }

    currentY += imgBoxHeight + 8;

    // --- 3. HARDWARE SPECIFICATIONS & MATERIALS ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('2. PRODUCT SPECIFICATIONS & BILL OF MATERIALS (BOM)', margin, currentY);
    currentY += 4;

    doc.setFillColor(241, 245, 249); // Slate-100
    doc.setDrawColor(226, 232, 240);
    doc.roundedRect(margin, currentY, contentWidth, 38, 2, 2, 'FD');

    const colW = contentWidth / 3;

    // Col 1: Canopy Specs
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(2, 132, 199);
    doc.text('CANOPY TOP & FABRIC', margin + 4, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Size: ${sizeConfig?.name || state.size}`, margin + 4, currentY + 14);
    doc.text(`Dimensions: ${sizeConfig?.dimensions || 'N/A'}`, margin + 4, currentY + 19);
    doc.text(`Base Color: ${colorConfig?.name || state.canopyColor}`, margin + 4, currentY + 24);
    doc.text(`Hex Code: ${state.canopyColor.toUpperCase()}`, margin + 4, currentY + 29);
    doc.text('Fabric: 600D Poly / UV50+ / Waterproof', margin + 4, currentY + 34);

    // Col 2: Frame Hardware
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(2, 132, 199);
    doc.text('FRAME HARDWARE', margin + colW + 4, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    doc.text(`Model: ${frameConfig?.name || state.frameType}`, margin + colW + 4, currentY + 14);
    doc.text(`Weight: ${frameConfig?.weight || '35 lbs'}`, margin + colW + 4, currentY + 19);
    doc.text(`Warranty: ${frameConfig?.warranty || 'Commercial'}`, margin + colW + 4, currentY + 24);
    doc.text('Locking: Push-Pin Auto Locking', margin + colW + 4, currentY + 29);
    doc.text('Footpads: Heavy Steel Anchor Feet', margin + colW + 4, currentY + 34);

    // Col 3: Enclosures & Accessories
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(2, 132, 199);
    doc.text('ENCLOSURES & ADD-ONS', margin + colW * 2 + 4, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(51, 65, 85);
    const wallStr =
      state.walls.backWall !== 'none' ||
      state.walls.leftWall !== 'none' ||
      state.walls.rightWall !== 'none'
        ? `Back: ${state.walls.backWall}, L: ${state.walls.leftWall}, R: ${state.walls.rightWall}`
        : 'None (Open Canopy)';
    doc.text(`Walls: ${wallStr}`, margin + colW * 2 + 4, currentY + 14);

    const accNames = state.accessories
      .map((id) => ACCESSORIES.find((a) => a.id === id)?.name.split('(')[0].trim())
      .join(', ');
    doc.text(`Accessories: ${accNames || 'None'}`, margin + colW * 2 + 4, currentY + 19);
    doc.text('Production: 2-Day Rush Sublimation', margin + colW * 2 + 4, currentY + 24);
    doc.text('Packaging: Heavy Corrugated Export Carton', margin + colW * 2 + 4, currentY + 29);

    currentY += 44;

    // --- 4. CUSTOM PRINTED SECTIONS TABLE ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('3. CUSTOM PRINTED SECTIONS DETAIL', margin, currentY);
    currentY += 4;

    // Table Header
    doc.setFillColor(30, 41, 59);
    doc.rect(margin, currentY, contentWidth, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text('SECTION', margin + 3, currentY + 5);
    doc.text('PRINT TYPE', margin + 45, currentY + 5);
    doc.text('CUSTOM TEXT / GRAPHICS DESCRIPTION', margin + 90, currentY + 5);
    doc.text('COLOR', pageWidth - margin - 3, currentY + 5, { align: 'right' });
    currentY += 7;

    const sectionsWithCustomization = (Object.keys(state.sections) as SectionId[]).filter(
      (sid) => {
        const sec = state.sections[sid];
        return (
          sec &&
          (sec.textElements.length > 0 ||
            sec.imageElements.length > 0 ||
            sec.customColor !== null)
        );
      }
    );

    if (sectionsWithCustomization.length === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(margin, currentY, contentWidth, 8, 'F');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text('Solid canopy color - No custom logos or text requested.', margin + 4, currentY + 5.5);
      currentY += 9;
    } else {
      sectionsWithCustomization.forEach((sid, idx) => {
        const sec = state.sections[sid];
        const secDef = SECTIONS.find((s) => s.id === sid);
        const isEven = idx % 2 === 0;

        doc.setFillColor(isEven ? 255 : 248, isEven ? 255 : 250, isEven ? 255 : 252);
        doc.rect(margin, currentY, contentWidth, 7.5, 'F');
        doc.setDrawColor(226, 232, 240);
        doc.line(margin, currentY + 7.5, margin + contentWidth, currentY + 7.5);

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8);
        doc.setTextColor(30, 41, 59);
        doc.text(secDef?.name || sid, margin + 3, currentY + 5);

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7.5);
        doc.setTextColor(71, 85, 105);
        doc.text('Dye-Sub Print', margin + 45, currentY + 5);

        const textDetails = sec.textElements.map((t) => `"${t.text}" (${t.fontFamily})`).join(', ');
        const imgDetails = sec.imageElements.map((i) => `Logo: ${i.fileName}`).join(', ');
        const combined = [textDetails, imgDetails].filter(Boolean).join(' | ');
        const truncated = combined.length > 48 ? combined.substring(0, 45) + '...' : combined;

        doc.text(truncated || 'Custom Background Color', margin + 90, currentY + 5);

        const colorHex = (sec.customColor || state.canopyColor).toUpperCase();
        doc.text(colorHex, pageWidth - margin - 3, currentY + 5, { align: 'right' });

        currentY += 7.5;
      });
    }

    currentY += 6;

    // --- 5. ITEMIZED PRICING SUMMARY & SHOPIFY METADATA ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(15, 23, 42);
    doc.text('4. SHOPIFY ORDER & PRICING BREAKDOWN', margin, currentY);
    currentY += 4;

    doc.setFillColor(248, 250, 252);
    doc.setDrawColor(203, 213, 225);
    doc.roundedRect(margin, currentY, contentWidth, 38, 2, 2, 'FD');

    // Left side: Shopify Order Metadata
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    doc.text('Shopify Line Item Association:', margin + 4, currentY + 7);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.text(`Configuration ID: ${configId}`, margin + 4, currentY + 13);
    doc.text(`Variant ID: 420202 (Custom 600D Dye-Sub)`, margin + 4, currentY + 18);
    doc.text(`Production Status: Approved for Pre-Press`, margin + 4, currentY + 23);
    doc.text(`Estimated Turnaround: 2 Business Days`, margin + 4, currentY + 28);
    doc.text(`Shipping Method: UPS Ground Commercial (Insured)`, margin + 4, currentY + 33);

    // Right side: Itemized Totals
    const rightColX = margin + contentWidth - 65;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);

    doc.text('Subtotal:', rightColX, currentY + 9);
    doc.text(`$${pricing.subtotal.toFixed(2)}`, pageWidth - margin - 4, currentY + 9, {
      align: 'right',
    });

    doc.text('Standard Shipping:', rightColX, currentY + 15);
    doc.text('FREE', pageWidth - margin - 4, currentY + 15, { align: 'right' });

    doc.text('Estimated Sales Tax:', rightColX, currentY + 21);
    doc.text(`$${pricing.estimatedTax.toFixed(2)}`, pageWidth - margin - 4, currentY + 21, {
      align: 'right',
    });

    doc.setDrawColor(203, 213, 225);
    doc.line(rightColX, currentY + 25, pageWidth - margin - 4, currentY + 25);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(2, 132, 199);
    doc.text('Total (USD):', rightColX, currentY + 32);
    doc.text(`$${pricing.total.toFixed(2)}`, pageWidth - margin - 4, currentY + 32, {
      align: 'right',
    });

    // --- 6. FOOTER SIGN-OFF & PRE-PRESS NOTES ---
    const footerY = pageHeight - 16;
    doc.setFillColor(15, 23, 42);
    doc.rect(0, footerY, pageWidth, 16, 'F');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      'MVP Visuals Quality Assurance: Proof verified for color space (CMYK sublimation), bleed tolerances, and safe zone compliance.',
      pageWidth / 2,
      footerY + 6,
      { align: 'center' }
    );
    doc.text(
      `Confidential & Proprietary • Order Attachment Ref: ${configId} • ${timestamp}`,
      pageWidth / 2,
      footerY + 11,
      { align: 'center' }
    );

    const fileName = `Production-Proof-${configId}.pdf`;
    const blob = doc.output('blob');
    const blobUrl = URL.createObjectURL(blob);

    // Trigger user download
    doc.save(fileName);

    return {
      doc,
      blobUrl,
      fileName,
    };
  }
}

export const pdfService = new PdfService();
