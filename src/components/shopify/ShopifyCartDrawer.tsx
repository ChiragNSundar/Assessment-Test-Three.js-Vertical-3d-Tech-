import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import { ShopifyCartResult } from '../../services/shopifyService';
import {
  ShoppingBag,
  CheckCircle2,
  Code2,
  FileText,
  ArrowRight,
  X,
  Copy,
  Check,
} from 'lucide-react';

interface ShopifyCartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  cartResult: ShopifyCartResult | null;
  snapshotUrl?: string;
  onDownloadPdf: () => void;
}

export const ShopifyCartDrawer: React.FC<ShopifyCartDrawerProps> = ({
  isOpen,
  onClose,
  cartResult,
  snapshotUrl,
  onDownloadPdf,
}) => {
  const [activeTab, setActiveTab] = useState<'cart' | 'raw_api'>('cart');
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Trigger celebration confetti when cart drawer opens
  useEffect(() => {
    if (isOpen) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0284c7', '#38bdf8', '#facc15', '#10b981'],
      });
    }
  }, [isOpen]);

  if (!isOpen || !cartResult) return null;

  const item = cartResult.lineItem;
  const properties = item.properties;

  const handleCopyPayload = () => {
    navigator.clipboard.writeText(JSON.stringify(cartResult, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg h-full bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm text-white">Added to Shopify Cart!</h3>
              <p className="text-[11px] text-slate-400">Configuration payload ready for checkout</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Mode Toggle: Customer Cart vs Developer API */}
        <div className="px-4 pt-3 flex gap-2 border-b border-slate-800 bg-slate-900">
          <button
            onClick={() => setActiveTab('cart')}
            className={`pb-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'cart'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Cart Line Item Proof</span>
          </button>
          <button
            onClick={() => setActiveTab('raw_api')}
            className={`pb-2 text-xs font-bold border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'raw_api'
                ? 'border-sky-500 text-sky-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Shopify AJAX API Payload (/cart/add.js)</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
          {activeTab === 'cart' ? (
            <>
              {/* Product Card */}
              <div className="bg-slate-800/80 border border-slate-700/80 rounded-2xl p-3 flex gap-3">
                {snapshotUrl ? (
                  <img
                    src={snapshotUrl}
                    alt="Custom Tent Render"
                    className="w-24 h-24 object-cover rounded-xl bg-slate-950 border border-slate-700 flex-shrink-0"
                  />
                ) : (
                  <div className="w-24 h-24 rounded-xl bg-slate-950 border border-slate-700 flex items-center justify-center text-slate-600 flex-shrink-0">
                    <ShoppingBag className="w-8 h-8" />
                  </div>
                )}
                <div className="flex flex-col justify-between flex-1">
                  <div>
                    <h4 className="font-extrabold text-sm text-white">{item.title}</h4>
                    <p className="text-xs text-sky-400 font-semibold mt-0.5">{item.variantTitle}</p>
                    <span className="inline-block mt-1 font-mono text-[10px] text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-700">
                      ID: {properties._config_id}
                    </span>
                  </div>
                  <div className="text-base font-black text-white font-mono mt-2">
                    ${item.price.toFixed(2)}
                  </div>
                </div>
              </div>

              {/* Shopify Line Item Properties Table */}
              <div>
                <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                  Shopify Line Item Custom Properties:
                </h5>
                <div className="bg-slate-950 rounded-xl border border-slate-800 divide-y divide-slate-800/80 text-xs">
                  {Object.entries(properties)
                    .filter(([key]) => !key.startsWith('_'))
                    .map(([key, val]) => (
                      <div key={key} className="p-2.5 flex items-start justify-between gap-2">
                        <span className="text-slate-400 font-medium">{key}</span>
                        <span className="text-slate-200 font-bold text-right truncate max-w-[240px]">
                          {val}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* PDF Proof Shortcut Card */}
              <div className="bg-gradient-to-r from-sky-950/40 to-blue-950/40 border border-sky-800/50 rounded-xl p-3 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-5 h-5 text-sky-400" />
                  <div>
                    <div className="text-xs font-bold text-white">Production Proof PDF</div>
                    <div className="text-[10px] text-slate-300">
                      High-resolution render & print layout attached
                    </div>
                  </div>
                </div>
                <button
                  onClick={onDownloadPdf}
                  className="px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold transition shadow-sm"
                >
                  Download PDF
                </button>
              </div>
            </>
          ) : (
            /* Developer Raw Payload Inspector */
            <div className="flex flex-col gap-2 h-full">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>Shopify Cart AJAX Endpoint: POST /cart/add.js</span>
                <button
                  onClick={handleCopyPayload}
                  className="flex items-center gap-1 text-sky-400 hover:text-sky-300"
                >
                  {copiedPayload ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>
              <pre className="flex-1 bg-slate-950 p-3 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-400 overflow-auto whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(
                  {
                    items: [
                      {
                        id: 420202,
                        quantity: 1,
                        properties,
                      },
                    ],
                    cartToken: cartResult.cartToken,
                    calculatedSubtotal: cartResult.totalPrice,
                  },
                  null,
                  2
                )}
              </pre>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/80 flex flex-col gap-2">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-xs text-slate-400">Estimated Order Total:</span>
            <span className="text-xl font-extrabold text-white font-mono">
              ${cartResult.totalPrice.toFixed(2)}
            </span>
          </div>

          <button
            onClick={() => {
              alert(
                'Checkout Simulation: Configuration JSON and Proof PDF attached to Shopify Order Session successfully!'
              );
              onClose();
            }}
            className="w-full py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-xl font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition hover:scale-[1.01] active:scale-[0.99]"
          >
            <span>Proceed to Shopify Checkout</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-slate-400 hover:text-slate-200 transition text-center"
          >
            Continue Customizing Design
          </button>
        </div>
      </div>
    </div>
  );
};
