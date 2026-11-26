import React from 'react';
import { SectionId } from '../../types/configurator';
import { SECTIONS } from '../../constants/productData';
import { Tent, Flag, PanelTop, CheckCircle2 } from 'lucide-react';

interface EditorTabsProps {
  activeSectionId: SectionId;
  onSelectSection: (sectionId: SectionId) => void;
  sectionCustomizedStatus: Record<SectionId, boolean>;
}

export const EditorTabs: React.FC<EditorTabsProps> = ({
  activeSectionId,
  onSelectSection,
  sectionCustomizedStatus,
}) => {
  const peaks = SECTIONS.filter((s) => s.group === 'peaks');
  const valances = SECTIONS.filter((s) => s.group === 'valances');
  const walls = SECTIONS.filter((s) => s.group === 'walls');

  return (
    <div className="w-full bg-slate-900 border-b border-slate-800 p-2.5">
      <div className="flex flex-col gap-2">
        {/* Peaks Row */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Tent className="w-3.5 h-3.5 text-sky-400" />
            <span>Roof Peaks (Slopes)</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {peaks.map((sec) => {
              const isSelected = activeSectionId === sec.id;
              const isCustomized = sectionCustomizedStatus[sec.id];
              return (
                <button
                  key={sec.id}
                  onClick={() => onSelectSection(sec.id)}
                  className={`relative py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition ${
                    isSelected
                      ? 'bg-sky-600 text-white shadow-md shadow-sky-600/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  <span className="truncate">{sec.name.replace('Peak ', '')}</span>
                  {isCustomized && (
                    <CheckCircle2
                      className={`w-3 h-3 ${isSelected ? 'text-sky-200' : 'text-emerald-400'}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Valances Row */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <Flag className="w-3.5 h-3.5 text-amber-400" />
            <span>Valances (Lower Overhangs)</span>
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            {valances.map((sec) => {
              const isSelected = activeSectionId === sec.id;
              const isCustomized = sectionCustomizedStatus[sec.id];
              return (
                <button
                  key={sec.id}
                  onClick={() => onSelectSection(sec.id)}
                  className={`relative py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition ${
                    isSelected
                      ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  <span className="truncate">{sec.name.replace('Valance ', '')}</span>
                  {isCustomized && (
                    <CheckCircle2
                      className={`w-3 h-3 ${isSelected ? 'text-amber-200' : 'text-emerald-400'}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Walls Row */}
        <div>
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
            <PanelTop className="w-3.5 h-3.5 text-indigo-400" />
            <span>Walls (Enclosures)</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            {walls.map((sec) => {
              const isSelected = activeSectionId === sec.id;
              const isCustomized = sectionCustomizedStatus[sec.id];
              return (
                <button
                  key={sec.id}
                  onClick={() => onSelectSection(sec.id)}
                  className={`relative py-1.5 px-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition ${
                    isSelected
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'bg-slate-800 text-slate-300 hover:bg-slate-700/80'
                  }`}
                >
                  <span className="truncate">{sec.name.replace('Full ', '').replace(' Wall', '')}</span>
                  {isCustomized && (
                    <CheckCircle2
                      className={`w-3 h-3 ${isSelected ? 'text-indigo-200' : 'text-emerald-400'}`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
