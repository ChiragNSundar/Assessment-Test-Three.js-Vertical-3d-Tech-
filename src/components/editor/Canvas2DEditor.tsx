import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  SectionConfig,
  SectionDefinition,
} from '../../types/configurator';
import { textureCompositor } from '../../services/textureCompositor';
import {
  AlignCenter,
  AlignVerticalSpaceAround,
  Trash2,
  ZoomIn,
  ShieldAlert,
} from 'lucide-react';

interface Canvas2DEditorProps {
  sectionDef: SectionDefinition;
  sectionConfig: SectionConfig;
  canopyBaseColor: string;
  showSafeMargins: boolean;
  onToggleSafeMargins: () => void;
  onUpdateSection: (updated: SectionConfig) => void;
}

export const Canvas2DEditor: React.FC<Canvas2DEditorProps> = ({
  sectionDef,
  sectionConfig,
  canopyBaseColor,
  showSafeMargins,
  onToggleSafeMargins,
  onUpdateSection,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [selectedType, setSelectedType] = useState<'text' | 'image' | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const elementStartPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  const isPeak = sectionDef.group === 'peaks';
  const width = sectionDef.canvasWidth;
  const height = sectionDef.canvasHeight;

  // Selected item reference
  const selectedText = selectedType === 'text'
    ? sectionConfig.textElements.find((t) => t.id === selectedId)
    : null;
  const selectedImage = selectedType === 'image'
    ? sectionConfig.imageElements.find((i) => i.id === selectedId)
    : null;

  /**
   * Render the 2D canvas with all elements and guidelines
   */
  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, width, height);

    // 1. Background fill
    ctx.fillStyle = sectionConfig.customColor || canopyBaseColor;
    ctx.fillRect(0, 0, width, height);

    // 2. Section geometry mask / outline
    if (isPeak) {
      // Peak triangle
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.4)';
      // Shade outside triangle
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.moveTo(width / 2, 20);
      ctx.lineTo(20, height - 20);
      ctx.lineTo(width - 20, height - 20);
      ctx.closePath();
      ctx.fill('evenodd');

      // Triangular boundary
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Safe print zone (inner dashed triangle)
      if (showSafeMargins) {
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(width / 2, 80);
        ctx.lineTo(80, height - 60);
        ctx.lineTo(width - 80, height - 60);
        ctx.closePath();
        ctx.stroke();
      }
      ctx.restore();
    } else {
      // Valance / Wall safe margins
      if (showSafeMargins) {
        ctx.save();
        ctx.strokeStyle = 'rgba(56, 189, 248, 0.7)';
        ctx.setLineDash([8, 8]);
        ctx.lineWidth = 2;
        ctx.strokeRect(30, 25, width - 60, height - 50);
        ctx.restore();
      }
    }

    // 3. Center Guide Crosshairs
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.setLineDash([4, 6]);
    ctx.lineWidth = 1;
    // Vertical center
    ctx.beginPath();
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();
    // Horizontal center
    ctx.beginPath();
    ctx.moveTo(0, height / 2);
    ctx.lineTo(width, height / 2);
    ctx.stroke();
    ctx.restore();

    // 4. Render composed section canvas
    const composed = textureCompositor.renderSection(
      sectionConfig.sectionId,
      sectionConfig,
      canopyBaseColor,
      width,
      height,
      { showMargins: false }
    );
    ctx.drawImage(composed, 0, 0);

    // 5. Draw Selection Bounding Box & Handles
    if (selectedType === 'text' && selectedText) {
      const centerX = (selectedText.x / 100) * width;
      const centerY = (selectedText.y / 100) * height;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((selectedText.rotation * Math.PI) / 180);

      ctx.font = `${selectedText.bold ? 'bold ' : ''}${selectedText.fontSize}px "${selectedText.fontFamily}", sans-serif`;
      const metrics = ctx.measureText(selectedText.text);
      const textW = metrics.width + 24;
      const textH = selectedText.fontSize * 1.3 + 16;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(-textW / 2, -textH / 2, textW, textH);

      // Corner handles
      ctx.fillStyle = '#38bdf8';
      const handleSize = 8;
      ctx.fillRect(-textW / 2 - handleSize / 2, -textH / 2 - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(textW / 2 - handleSize / 2, -textH / 2 - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(-textW / 2 - handleSize / 2, textH / 2 - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(textW / 2 - handleSize / 2, textH / 2 - handleSize / 2, handleSize, handleSize);

      ctx.restore();
    } else if (selectedType === 'image' && selectedImage) {
      const centerX = (selectedImage.x / 100) * width;
      const centerY = (selectedImage.y / 100) * height;

      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate((selectedImage.rotation * Math.PI) / 180);

      const imgWidth = 250 * selectedImage.scale;
      const imgHeight = (imgWidth / selectedImage.aspectRatio) || imgWidth;

      ctx.strokeStyle = '#38bdf8';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 4]);
      ctx.strokeRect(-imgWidth / 2 - 8, -imgHeight / 2 - 8, imgWidth + 16, imgHeight + 16);

      // Corner handles
      ctx.fillStyle = '#38bdf8';
      const handleSize = 8;
      const hw = (imgWidth + 16) / 2;
      const hh = (imgHeight + 16) / 2;
      ctx.fillRect(-hw - handleSize / 2, -hh - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(hw - handleSize / 2, -hh - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(-hw - handleSize / 2, hh - handleSize / 2, handleSize, handleSize);
      ctx.fillRect(hw - handleSize / 2, hh - handleSize / 2, handleSize, handleSize);

      ctx.restore();
    }
  }, [
    canopyBaseColor,
    height,
    isPeak,
    sectionConfig,
    selectedId,
    selectedImage,
    selectedText,
    selectedType,
    showSafeMargins,
    width,
  ]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  /**
   * Pointer Down on 2D Canvas for selecting or dragging elements
   */
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    const clickX = (e.clientX - rect.left) * scaleX;
    const clickY = (e.clientY - rect.top) * scaleY;

    // Check hit test against text elements first
    for (const t of sectionConfig.textElements) {
      const elemX = (t.x / 100) * width;
      const elemY = (t.y / 100) * height;
      const dist = Math.hypot(clickX - elemX, clickY - elemY);

      if (dist < t.fontSize * 1.5 + 40) {
        setSelectedType('text');
        setSelectedId(t.id);
        setIsDragging(true);
        dragStartPos.current = { x: clickX, y: clickY };
        elementStartPos.current = { x: t.x, y: t.y };
        return;
      }
    }

    // Check hit test against image elements
    for (const img of sectionConfig.imageElements) {
      const elemX = (img.x / 100) * width;
      const elemY = (img.y / 100) * height;
      const dist = Math.hypot(clickX - elemX, clickY - elemY);

      if (dist < 140 * img.scale) {
        setSelectedType('image');
        setSelectedId(img.id);
        setIsDragging(true);
        dragStartPos.current = { x: clickX, y: clickY };
        elementStartPos.current = { x: img.x, y: img.y };
        return;
      }
    }

    // Deselect if clicked blank background
    setSelectedType(null);
    setSelectedId(null);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging || !selectedId || !canvasRef.current) return;

    const rect = canvasRef.current.getBoundingClientRect();
    const scaleX = width / rect.width;
    const scaleY = height / rect.height;

    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    const deltaX = currentX - dragStartPos.current.x;
    const deltaY = currentY - dragStartPos.current.y;

    const deltaXPercent = (deltaX / width) * 100;
    const deltaYPercent = (deltaY / height) * 100;

    let newX = Math.round((elementStartPos.current.x + deltaXPercent) * 10) / 10;
    let newY = Math.round((elementStartPos.current.y + deltaYPercent) * 10) / 10;

    // Magnetic snap to center guideline (within ±2%)
    if (Math.abs(newX - 50) < 2) newX = 50;
    if (Math.abs(newY - 50) < 2) newY = 50;

    // Bounds clamp
    newX = Math.max(10, Math.min(90, newX));
    newY = Math.max(10, Math.min(90, newY));

    if (selectedType === 'text') {
      const updatedTexts = sectionConfig.textElements.map((t) =>
        t.id === selectedId ? { ...t, x: newX, y: newY } : t
      );
      onUpdateSection({ ...sectionConfig, textElements: updatedTexts });
    } else if (selectedType === 'image') {
      const updatedImages = sectionConfig.imageElements.map((i) =>
        i.id === selectedId ? { ...i, x: newX, y: newY } : i
      );
      onUpdateSection({ ...sectionConfig, imageElements: updatedImages });
    }
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  // Quick alignment helpers
  const handleCenterHorizontal = () => {
    if (selectedType === 'text' && selectedId) {
      const updated = sectionConfig.textElements.map((t) =>
        t.id === selectedId ? { ...t, x: 50 } : t
      );
      onUpdateSection({ ...sectionConfig, textElements: updated });
    } else if (selectedType === 'image' && selectedId) {
      const updated = sectionConfig.imageElements.map((i) =>
        i.id === selectedId ? { ...i, x: 50 } : i
      );
      onUpdateSection({ ...sectionConfig, imageElements: updated });
    }
  };

  const handleCenterVertical = () => {
    const targetY = isPeak ? 60 : 50; // In peaks, visual center is lower due to apex taper
    if (selectedType === 'text' && selectedId) {
      const updated = sectionConfig.textElements.map((t) =>
        t.id === selectedId ? { ...t, y: targetY } : t
      );
      onUpdateSection({ ...sectionConfig, textElements: updated });
    } else if (selectedType === 'image' && selectedId) {
      const updated = sectionConfig.imageElements.map((i) =>
        i.id === selectedId ? { ...i, y: targetY } : i
      );
      onUpdateSection({ ...sectionConfig, imageElements: updated });
    }
  };

  const handleDeleteSelected = () => {
    if (selectedType === 'text' && selectedId) {
      const updated = sectionConfig.textElements.filter((t) => t.id !== selectedId);
      onUpdateSection({ ...sectionConfig, textElements: updated });
      setSelectedId(null);
    } else if (selectedType === 'image' && selectedId) {
      const updated = sectionConfig.imageElements.filter((i) => i.id !== selectedId);
      onUpdateSection({ ...sectionConfig, imageElements: updated });
      setSelectedId(null);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-900 border-b border-slate-800">
      {/* 2D Canvas Workspace Viewport */}
      <div
        ref={containerRef}
        className="relative flex-1 bg-slate-950 flex items-center justify-center p-3 overflow-hidden"
      >
        <div
          className="relative max-w-full max-h-full aspect-[4/3] rounded-xl shadow-2xl border border-slate-800 overflow-hidden flex items-center justify-center bg-slate-900"
          style={{
            aspectRatio: `${width} / ${height}`,
          }}
        >
          <canvas
            ref={canvasRef}
            width={width}
            height={height}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            className="w-full h-full cursor-crosshair select-none touch-none"
          />

          {/* Empty State Banner */}
          {sectionConfig.textElements.length === 0 &&
            sectionConfig.imageElements.length === 0 && (
              <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center gap-2 text-slate-400 bg-slate-900/40 backdrop-blur-[1px]">
                <ZoomIn className="w-8 h-8 text-sky-400 animate-bounce" />
                <p className="text-sm font-semibold text-slate-300">
                  {sectionDef.name} - Blank Surface
                </p>
                <p className="text-xs text-slate-400">
                  Add text or upload a logo below to customize this side.
                </p>
              </div>
            )}
        </div>

        {/* Safe Margins Floating Chip */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            onClick={onToggleSafeMargins}
            className={`px-2.5 py-1 text-xs rounded-lg flex items-center gap-1.5 transition ${
              showSafeMargins
                ? 'bg-sky-600/30 text-sky-300 border border-sky-500/40'
                : 'bg-slate-800/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Safe Print Zone</span>
          </button>
        </div>
      </div>

      {/* Selected Element Quick Action Bar */}
      {selectedId && (
        <div className="px-4 py-2 bg-slate-800/95 border-t border-slate-700/80 flex items-center justify-between text-xs text-slate-200">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sky-400 capitalize">
              Selected: {selectedType}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCenterHorizontal}
              title="Center Horizontally"
              className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 transition flex items-center gap-1"
            >
              <AlignCenter className="w-3.5 h-3.5" />
              <span>Center X</span>
            </button>
            <button
              onClick={handleCenterVertical}
              title="Center Vertically"
              className="px-2 py-1 rounded bg-slate-700 hover:bg-slate-600 transition flex items-center gap-1"
            >
              <AlignVerticalSpaceAround className="w-3.5 h-3.5" />
              <span>Center Y</span>
            </button>
            <button
              onClick={handleDeleteSelected}
              title="Delete Element"
              className="px-2 py-1 rounded bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600 hover:text-white transition flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
