import React, { useState } from 'react';
import { SectionConfig, TextElement } from '../../types/configurator';
import { POPULAR_FONTS } from '../../constants/productData';
import { Type, Plus, Bold } from 'lucide-react';

interface TextToolProps {
  sectionConfig: SectionConfig;
  onUpdateSection: (updated: SectionConfig) => void;
}

export const TextTool: React.FC<TextToolProps> = ({
  sectionConfig,
  onUpdateSection,
}) => {
  const [newText, setNewText] = useState('CUSTOM BRANDING');
  const [fontFamily, setFontFamily] = useState('Bebas Neue');
  const [fontSize, setFontSize] = useState(56);
  const [textColor, setTextColor] = useState('#ffffff');
  const [bold, setBold] = useState(true);
  const [letterSpacing, setLetterSpacing] = useState(4);
  const [rotation, setRotation] = useState(0);

  const handleAddText = () => {
    if (!newText.trim()) return;

    const newElement: TextElement = {
      id: 'txt_' + Math.random().toString(36).substring(2, 9),
      text: newText.trim(),
      fontFamily,
      fontSize,
      color: textColor,
      x: 50,
      y: 60,
      rotation,
      bold,
      letterSpacing,
    };

    onUpdateSection({
      ...sectionConfig,
      textElements: [...sectionConfig.textElements, newElement],
    });
  };

  const handleRemoveText = (id: string) => {
    onUpdateSection({
      ...sectionConfig,
      textElements: sectionConfig.textElements.filter((t) => t.id !== id),
    });
  };

  return (
    <div className="flex flex-col gap-3 p-3 bg-slate-900 rounded-xl border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-slate-300">
          <Type className="w-4 h-4 text-sky-400" />
          <span>Add Custom Typography / Text</span>
        </div>
        <span className="text-[11px] text-slate-400">
          {sectionConfig.textElements.length} item(s)
        </span>
      </div>

      {/* Text Input Row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newText}
          onChange={(e) => setNewText(e.target.value)}
          placeholder="Enter custom slogan or name..."
          className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-sky-500"
        />
        <button
          onClick={handleAddText}
          className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1 transition shadow-md shadow-sky-600/30"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add</span>
        </button>
      </div>

      {/* Font & Style Controls */}
      <div className="grid grid-cols-2 gap-2 text-xs">
        {/* Font Family */}
        <div>
          <label className="text-[11px] text-slate-400 block mb-1">Font Family</label>
          <select
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
            className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white focus:outline-none focus:border-sky-500"
          >
            {POPULAR_FONTS.map((f) => (
              <option key={f.name} value={f.name}>
                {f.label}
              </option>
            ))}
          </select>
        </div>

        {/* Color Picker & Bold */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="text-[11px] text-slate-400">Color & Style</label>
            <button
              onClick={() => setBold(!bold)}
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold flex items-center gap-0.5 border transition ${
                bold
                  ? 'bg-sky-600 text-white border-sky-500'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}
            >
              <Bold className="w-3 h-3" />
              <span>Bold</span>
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer p-0.5"
            />
            <div className="flex gap-1">
              {['#ffffff', '#000000', '#facc15', '#dc2626', '#38bdf8'].map((c) => (
                <button
                  key={c}
                  onClick={() => setTextColor(c)}
                  style={{ backgroundColor: c }}
                  className={`w-5 h-5 rounded-full border ${
                    textColor === c ? 'border-sky-400 scale-110' : 'border-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sliders: Size, Spacing & Rotation */}
      <div className="grid grid-cols-3 gap-2 text-xs">
        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Size</span>
            <span className="text-sky-400 font-mono">{fontSize}px</span>
          </div>
          <input
            type="range"
            min="24"
            max="110"
            value={fontSize}
            onChange={(e) => setFontSize(Number(e.target.value))}
            className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded-lg"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Spacing</span>
            <span className="text-sky-400 font-mono">{letterSpacing}px</span>
          </div>
          <input
            type="range"
            min="0"
            max="16"
            value={letterSpacing}
            onChange={(e) => setLetterSpacing(Number(e.target.value))}
            className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded-lg"
          />
        </div>

        <div>
          <div className="flex justify-between text-[11px] text-slate-400 mb-1">
            <span>Rotation</span>
            <span className="text-sky-400 font-mono">{rotation}°</span>
          </div>
          <input
            type="range"
            min="-180"
            max="180"
            step="5"
            value={rotation}
            onChange={(e) => setRotation(Number(e.target.value))}
            className="w-full accent-sky-500 bg-slate-800 h-1.5 rounded-lg"
          />
        </div>
      </div>

      {/* Existing Text Elements List */}
      {sectionConfig.textElements.length > 0 && (
        <div className="border-t border-slate-800 pt-2 flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-slate-400">Layered Texts:</span>
          {sectionConfig.textElements.map((t) => (
            <div
              key={t.id}
              className="flex items-center justify-between bg-slate-800/80 px-2.5 py-1.5 rounded-lg text-xs"
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: t.color }}
                />
                <span className="font-semibold text-slate-200 truncate max-w-[150px]">
                  "{t.text}"
                </span>
                <span className="text-[10px] text-slate-400">({t.fontFamily})</span>
              </div>
              <button
                onClick={() => handleRemoveText(t.id)}
                className="text-slate-400 hover:text-rose-400 text-xs px-1.5 py-0.5"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
