import React from 'react';
import {
  ConfiguratorState,
  TentSizeId,
  FrameTypeId,
  WallOptionId,
} from '../../types/configurator';
import {
  TENT_SIZES,
  FRAME_TYPES,
  CANOPY_COLORS,
  ACCESSORIES,
} from '../../constants/productData';
import {
  Maximize2,
  Shield,
  Palette,
  Layers,
  ShoppingBag,
  Check,
  Star,
} from 'lucide-react';

interface ProductOptionsPanelProps {
  state: ConfiguratorState;
  onUpdateState: (partial: Partial<ConfiguratorState>) => void;
}

export const ProductOptionsPanel: React.FC<ProductOptionsPanelProps> = ({
  state,
  onUpdateState,
}) => {
  const handleSizeSelect = (size: TentSizeId) => {
    onUpdateState({ size });
  };

  const handleFrameSelect = (frameType: FrameTypeId) => {
    onUpdateState({ frameType });
  };

  const handleColorSelect = (hex: string) => {
    onUpdateState({ canopyColor: hex, customCanopyColorHex: hex });
  };

  const handleWallChange = (
    wallKey: 'backWall' | 'leftWall' | 'rightWall',
    option: WallOptionId
  ) => {
    onUpdateState({
      walls: {
        ...state.walls,
        [wallKey]: option,
      },
    });
  };

  const handleAccessoryToggle = (accId: string) => {
    const exists = state.accessories.includes(accId);
    const updated = exists
      ? state.accessories.filter((id) => id !== accId)
      : [...state.accessories, accId];
    onUpdateState({ accessories: updated });
  };

  return (
    <div className="flex flex-col gap-5 p-4 overflow-y-auto">
      {/* 1. Size Selection */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Maximize2 className="w-4 h-4 text-sky-400" />
          <span>1. Select Canopy Size</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {TENT_SIZES.map((s) => {
            const isSelected = state.size === s.id;
            return (
              <button
                key={s.id}
                onClick={() => handleSizeSelect(s.id)}
                className={`relative p-2.5 rounded-xl text-left border transition flex flex-col justify-between ${
                  isSelected
                    ? 'bg-sky-600/20 border-sky-500 shadow-md shadow-sky-600/20'
                    : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-700/80'
                }`}
              >
                {s.popular && (
                  <span className="absolute -top-2 right-2 bg-gradient-to-r from-amber-500 to-orange-500 text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded-full text-white shadow-sm flex items-center gap-0.5">
                    <Star className="w-2.5 h-2.5 fill-current" /> Popular
                  </span>
                )}
                <div>
                  <div className="font-bold text-xs text-white">{s.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{s.dimensions}</div>
                </div>
                <div className="mt-2 text-xs font-extrabold text-sky-400">
                  ${s.basePrice}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. Frame Type */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Shield className="w-4 h-4 text-sky-400" />
          <span>2. Commercial Frame Construction</span>
        </div>
        <div className="flex flex-col gap-2">
          {FRAME_TYPES.map((f) => {
            const isSelected = state.frameType === f.id;
            return (
              <button
                key={f.id}
                onClick={() => handleFrameSelect(f.id)}
                className={`p-3 rounded-xl text-left border transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-sky-600/20 border-sky-500 shadow-md shadow-sky-600/20'
                    : 'bg-slate-800/80 border-slate-700/80 hover:bg-slate-700/80'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-5 h-5 rounded-full border-2 border-slate-500 flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: f.metalColor }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-slate-900 stroke-[3]" />}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{f.name}</span>
                      <span className="text-[10px] font-normal text-emerald-400 bg-emerald-950/60 px-1.5 py-0.5 rounded border border-emerald-800/60">
                        {f.warranty}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{f.description}</div>
                  </div>
                </div>
                <div className="text-xs font-extrabold text-sky-400 flex-shrink-0 ml-2">
                  {f.priceModifier === 0 ? 'Included' : `+$${f.priceModifier}`}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Canopy Base Color */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
            <Palette className="w-4 h-4 text-sky-400" />
            <span>3. Canopy Base Fabric Color</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {state.canopyColor.toUpperCase()}
          </span>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {CANOPY_COLORS.map((c) => {
            const isSelected = state.canopyColor.toLowerCase() === c.hex.toLowerCase();
            return (
              <button
                key={c.id}
                onClick={() => handleColorSelect(c.hex)}
                className={`flex flex-col items-center gap-1 p-1.5 rounded-xl border transition ${
                  isSelected
                    ? 'border-sky-400 bg-sky-950/40 shadow-md'
                    : 'border-slate-800 bg-slate-800/60 hover:border-slate-700'
                }`}
              >
                <div
                  className="w-7 h-7 rounded-full border border-black/20 shadow-inner flex items-center justify-center"
                  style={{ backgroundColor: c.hex }}
                >
                  {isSelected && (
                    <Check
                      className={`w-3.5 h-3.5 stroke-[3] ${
                        c.textContrast === 'dark' ? 'text-slate-900' : 'text-white'
                      }`}
                    />
                  )}
                </div>
                <span className="text-[10px] text-slate-300 truncate w-full text-center">
                  {c.name.split(' ')[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Wall Packages */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-slate-300">
          <Layers className="w-4 h-4 text-sky-400" />
          <span>4. Wall Packages & Enclosures</span>
        </div>
        <div className="flex flex-col gap-2 bg-slate-850 p-3 rounded-xl border border-slate-800 bg-slate-900/60">
          {/* Back Wall */}
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300">Full Back Wall</span>
            <select
              value={state.walls.backWall}
              onChange={(e) => handleWallChange('backWall', e.target.value as WallOptionId)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="none">None (Open Back)</option>
              <option value="full">Solid Wall (+$89)</option>
              <option value="window">Panoramic Window Wall (+$115)</option>
            </select>
          </div>

          {/* Left Wall */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
            <span className="font-semibold text-slate-300">Left Side Wall</span>
            <select
              value={state.walls.leftWall}
              onChange={(e) => handleWallChange('leftWall', e.target.value as WallOptionId)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="none">None (Open)</option>
              <option value="half">Half Wall w/ Support Bar (+$49)</option>
              <option value="full">Full Solid Wall (+$79)</option>
            </select>
          </div>

          {/* Right Wall */}
          <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800">
            <span className="font-semibold text-slate-300">Right Side Wall</span>
            <select
              value={state.walls.rightWall}
              onChange={(e) => handleWallChange('rightWall', e.target.value as WallOptionId)}
              className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-sky-500"
            >
              <option value="none">None (Open)</option>
              <option value="half">Half Wall w/ Support Bar (+$49)</option>
              <option value="full">Full Solid Wall (+$79)</option>
            </select>
          </div>
        </div>
      </div>

      {/* 5. Accessories */}
      <div>
        <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider text-slate-300">
          <ShoppingBag className="w-4 h-4 text-sky-400" />
          <span>5. Outdoor Hardware & Accessories</span>
        </div>
        <div className="flex flex-col gap-2">
          {ACCESSORIES.map((acc) => {
            const isChecked = state.accessories.includes(acc.id);
            return (
              <div
                key={acc.id}
                onClick={() => handleAccessoryToggle(acc.id)}
                className={`p-2.5 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                  isChecked
                    ? 'bg-sky-600/15 border-sky-500 text-white'
                    : 'bg-slate-800/60 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="w-4 h-4 rounded text-sky-600 accent-sky-500"
                  />
                  <div>
                    <div className="text-xs font-bold">{acc.name}</div>
                    <div className="text-[10px] text-slate-400">{acc.description}</div>
                  </div>
                </div>
                <div className="text-xs font-extrabold text-sky-400 flex-shrink-0 ml-2">
                  +${acc.price}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
