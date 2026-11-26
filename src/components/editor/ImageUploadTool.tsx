import React, { useRef } from 'react';
import { SectionConfig, ImageElement } from '../../types/configurator';
import { textureCompositor } from '../../services/textureCompositor';
import { Image as ImageIcon, Upload, Sparkles, Trash2 } from 'lucide-react';

interface ImageUploadToolProps {
  sectionConfig: SectionConfig;
  onUpdateSection: (updated: SectionConfig) => void;
}

const SAMPLE_LOGOS = [
  { name: 'Apex Outdoors', path: '/sample-logos/apex-outdoors.svg' },
  { name: 'Tech Expo', path: '/sample-logos/tech-summit.svg' },
  { name: 'Artisan Coffee', path: '/sample-logos/artisan-coffee.svg' },
];

export const ImageUploadTool: React.FC<ImageUploadToolProps> = ({
  sectionConfig,
  onUpdateSection,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  /**
   * Handle user uploading an image from computer
   */
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        const aspectRatio = img.width / img.height;
        textureCompositor.preloadImage(src).then(() => {
          const newImgEl: ImageElement = {
            id: 'img_' + Math.random().toString(36).substring(2, 9),
            src,
            fileName: file.name,
            x: 50,
            y: 50,
            scale: 1.0,
            rotation: 0,
            aspectRatio: aspectRatio || 1.0,
          };
          onUpdateSection({
            ...sectionConfig,
            imageElements: [...sectionConfig.imageElements, newImgEl],
          });
        });
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  /**
   * Add sample preset logo
   */
  const handleAddSampleLogo = (path: string, name: string) => {
    textureCompositor.preloadImage(path).then((img) => {
      const aspectRatio = img.width / img.height;
      const newImgEl: ImageElement = {
        id: 'img_' + Math.random().toString(36).substring(2, 9),
        src: path,
        fileName: name,
        x: 50,
        y: 50,
        scale: 1.0,
        rotation: 0,
        aspectRatio: aspectRatio || 1.0,
      };
      onUpdateSection({
        ...sectionConfig,
        imageElements: [...sectionConfig.imageElements, newImgEl],
      });
    });
  };

  const handleRemoveImage = (id: string) => {
    onUpdateSection({
      ...sectionConfig,
      imageElements: sectionConfig.imageElements.filter((i) => i.id !== id),
    });
  };

  const handleScaleChange = (id: string, scale: number) => {
    onUpdateSection({
      ...sectionConfig,
      imageElements: sectionConfig.imageElements.map((i) =>
        i.id === id ? { ...i, scale } : i
      ),
    });
  };

  const handleRotationChange = (id: string, rotation: number) => {
    onUpdateSection({
      ...sectionConfig,
      imageElements: sectionConfig.imageElements.map((i) =>
        i.id === id ? { ...i, rotation } : i
      ),
    });
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <ImageIcon className="w-4 h-4 text-emerald-400" />
          <span>Upload Company Logo / Graphics</span>
        </div>
        <span className="text-[11px] text-slate-400">
          {sectionConfig.imageElements.length} logo(s)
        </span>
      </div>

      {/* Upload Button */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png, image/jpeg, image/svg+xml, image/webp"
        onChange={handleFileUpload}
        className="hidden"
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full py-2.5 border-2 border-dashed border-slate-700 hover:border-emerald-500 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-300 hover:text-emerald-400 transition bg-slate-800/50 hover:bg-emerald-950/20"
      >
        <Upload className="w-4 h-4" />
        <span>Choose File (PNG, SVG, JPG, WebP)</span>
      </button>

      {/* Sample Logos Quick Select */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 mb-1.5 flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5 text-amber-400" />
          <span>Try Sample Sponsor Logos:</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {SAMPLE_LOGOS.map((sample) => (
            <button
              key={sample.name}
              onClick={() => handleAddSampleLogo(sample.path, sample.name)}
              className="px-2 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700/80 text-[11px] text-slate-200 truncate transition font-medium text-center"
            >
              {sample.name}
            </button>
          ))}
        </div>
      </div>

      {/* Existing Images Control List */}
      {sectionConfig.imageElements.length > 0 && (
        <div className="border-t border-slate-800 pt-2 flex flex-col gap-2">
          <span className="text-[11px] font-semibold text-slate-400">Placed Logos:</span>
          {sectionConfig.imageElements.map((img) => (
            <div
              key={img.id}
              className="bg-slate-800 p-2.5 rounded-lg flex flex-col gap-2 text-xs border border-slate-700/60"
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-200 truncate max-w-[170px]">
                  {img.fileName}
                </span>
                <button
                  onClick={() => handleRemoveImage(img.id)}
                  className="text-rose-400 hover:text-rose-300 flex items-center gap-1 text-[11px]"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Remove</span>
                </button>
              </div>

              {/* Scale Slider */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                  <span>Size / Scale</span>
                  <span className="text-emerald-400 font-mono">{Math.round(img.scale * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="2.5"
                  step="0.05"
                  value={img.scale}
                  onChange={(e) => handleScaleChange(img.id, Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-700 h-1.5 rounded-lg"
                />
              </div>

              {/* Rotation Slider */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                  <span>Rotation</span>
                  <span className="text-emerald-400 font-mono">{img.rotation}°</span>
                </div>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="5"
                  value={img.rotation}
                  onChange={(e) => handleRotationChange(img.id, Number(e.target.value))}
                  className="w-full accent-emerald-500 bg-slate-700 h-1.5 rounded-lg"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
