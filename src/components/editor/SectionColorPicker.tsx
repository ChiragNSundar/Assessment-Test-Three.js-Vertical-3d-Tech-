import React from 'react';
import { SectionConfig } from '../../types/configurator';
import { CANOPY_COLORS } from '../../constants/productData';
import { Palette, RefreshCw } from 'lucide-react';

interface SectionColorPickerProps {
  sectionConfig: SectionConfig;
  canopyBaseColor: string;
  onUpdateSection: (updated: SectionConfig) => void;
}

export const SectionColorPicker: React.FC<SectionColorPickerProps> = ({
  sectionConfig,
  canopyBaseColor,
  onUpdateSection,
}) => {
  const isCustomColor = sectionConfig.customColor !== null;
  const activeColor = sectionConfig.customColor || canopyBaseColor;

  return (
    <div className="flex flex-col gap-2.5 p-3 bg-slate-900 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Palette className="w-4 h-4 text-violet-400" />
          <span>Section Background Color</span>
        </div>
        {isCustomColor && (
          <button
            onClick={() => onUpdateSection({ ...sectionConfig, customColor: null })}
            className="text-[11px] text-sky-400 hover:text-sky-300 flex items-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Reset to Canopy Color</span>
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Color preview circle */}
        <div
          className="w-8 h-8 rounded-full border-2 border-slate-600 shadow-md flex-shrink-0"
          style={{ backgroundColor: activeColor }}
        />

        {/* Quick Swatches */}
        <div className="flex flex-wrap gap-1.5 flex-1">
          {CANOPY_COLORS.slice(0, 8).map((c) => (
            <button
              key={c.id}
              onClick={() => onUpdateSection({ ...sectionConfig, customColor: c.hex })}
              style={{ backgroundColor: c.hex }}
              title={c.name}
              className={`w-6 h-6 rounded-lg border transition ${
                activeColor === c.hex ? 'border-violet-400 scale-110 shadow-md' : 'border-slate-700'
              }`}
            />
          ))}

          {/* Custom Hex Color Input */}
          <input
            type="color"
            value={activeColor}
            onChange={(e) => onUpdateSection({ ...sectionConfig, customColor: e.target.value })}
            className="w-6 h-6 rounded-lg border border-slate-700 bg-transparent cursor-pointer p-0.5"
            title="Custom Hex Picker"
          />
        </div>
      </div>
    </div>
  );
};
