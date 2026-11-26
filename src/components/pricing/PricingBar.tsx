import React, { useState } from 'react';
import { PricingBreakdown } from '../../types/configurator';
import {
  ShoppingCart,
  FileDown,
  ChevronUp,
  ChevronDown,
  Truck,
  ShieldCheck,
} from 'lucide-react';

interface PricingBarProps {
  pricing: PricingBreakdown | null;
  isLoadingPrice: boolean;
  onAddToCart: () => void;
  onDownloadPdf: () => void;
  isGeneratingPdf: boolean;
}

export const PricingBar: React.FC<PricingBarProps> = ({
  pricing,
  isLoadingPrice,
  onAddToCart,
  onDownloadPdf,
  isGeneratingPdf,
}) => {
  const [showItemizedDetails, setShowItemizedDetails] = useState(false);

  return (
    <>
      {/* Itemized Pricing Popover/Drawer */}
      {showItemizedDetails && pricing && (
        <div className="absolute bottom-20 right-4 w-96 bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl p-4 z-40 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-300">
              Itemized Cost Breakdown
            </h4>
            <button
              onClick={() => setShowItemizedDetails(false)}
              className="text-slate-400 hover:text-white text-xs"
            >
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-2 my-3 max-h-60 overflow-y-auto pr-1">
            {pricing.itemizedLines.map((line, idx) => (
              <div key={idx} className="flex items-start justify-between text-xs">
                <div>
                  <div className="font-semibold text-slate-200">{line.label}</div>
                  {line.detail && (
                    <div className="text-[10px] text-slate-400">{line.detail}</div>
                  )}
                </div>
                <div className="font-mono text-slate-300 font-bold ml-2">
                  {line.amount === 0 ? 'FREE' : `$${line.amount.toFixed(2)}`}
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 border-t border-slate-800 flex flex-col gap-1.5 text-xs">
            <div className="flex justify-between text-slate-400">
              <span>Subtotal</span>
              <span className="font-mono">${pricing.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span className="flex items-center gap-1">
                <Truck className="w-3 h-3 text-emerald-400" />
                <span>Standard Ground Shipping</span>
              </span>
              <span className="text-emerald-400 font-semibold font-mono">FREE</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Est. Sales Tax</span>
              <span className="font-mono">${pricing.estimatedTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-extrabold text-white pt-2 border-t border-slate-800">
              <span>Total Calculated Price</span>
              <span className="text-sky-400 font-mono">${pricing.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Persistent Bottom Bar */}
      <footer className="h-20 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 px-4 md:px-6 flex items-center justify-between z-30 shadow-2xl">
        {/* Left: Value Props */}
        <div className="hidden lg:flex items-center gap-6 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-emerald-950/60 border border-emerald-800 flex items-center justify-center text-emerald-400">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">Lifetime Frame Warranty</div>
              <div className="text-[10px] text-slate-400">Commercial Grade Durability</div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-sky-950/60 border border-sky-800 flex items-center justify-center text-sky-400">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-white">2-Day Fast Production</div>
              <div className="text-[10px] text-slate-400">Free Standard US Shipping</div>
            </div>
          </div>
        </div>

        {/* Center / Right: Dynamic Price & Actions */}
        <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto">
          {/* Dynamic Price Display */}
          <div
            onClick={() => setShowItemizedDetails(!showItemizedDetails)}
            className="flex flex-col cursor-pointer hover:opacity-90 transition pr-2"
          >
            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <span>Total Price (USD)</span>
              {showItemizedDetails ? (
                <ChevronDown className="w-3 h-3 text-sky-400" />
              ) : (
                <ChevronUp className="w-3 h-3 text-sky-400" />
              )}
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black text-white font-mono tracking-tight">
                {isLoadingPrice ? (
                  <span className="text-slate-500 animate-pulse">$---.--</span>
                ) : pricing ? (
                  `$${pricing.total.toFixed(2)}`
                ) : (
                  '$319.00'
                )}
              </span>
              <span className="text-[11px] text-emerald-400 font-semibold hidden sm:inline">
                • Details
              </span>
            </div>
          </div>

          {/* Download PDF Production Proof Button */}
          <button
            onClick={onDownloadPdf}
            disabled={isGeneratingPdf}
            className="px-3.5 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold flex items-center gap-1.5 transition shadow-sm disabled:opacity-50"
            title="Download PDF Production Proof & Summary"
          >
            <FileDown className="w-4 h-4 text-sky-400" />
            <span className="hidden sm:inline">
              {isGeneratingPdf ? 'Generating PDF...' : 'Production Proof PDF'}
            </span>
          </button>

          {/* Add to Shopify Cart Button */}
          <button
            onClick={onAddToCart}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs md:text-sm font-extrabold flex items-center gap-2 shadow-lg shadow-sky-600/30 hover:shadow-sky-500/50 hover:scale-[1.02] active:scale-[0.98] transition"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Add to Cart</span>
          </button>
        </div>
      </footer>
    </>
  );
};
