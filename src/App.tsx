import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ConfiguratorState,
  PricingBreakdown,
  SectionId,
  SectionConfig,
} from './types/configurator';
import {
  INITIAL_CONFIGURATOR_STATE,
  SECTIONS,
} from './constants/productData';
import { ThreeViewport, ThreeViewportRef } from './components/viewport/ThreeViewport';
import { EditorTabs } from './components/editor/EditorTabs';
import { Canvas2DEditor } from './components/editor/Canvas2DEditor';
import { TextTool } from './components/editor/TextTool';
import { ImageUploadTool } from './components/editor/ImageUploadTool';
import { SectionColorPicker } from './components/editor/SectionColorPicker';
import { ProductOptionsPanel } from './components/panels/ProductOptionsPanel';
import { PricingBar } from './components/pricing/PricingBar';
import { ShopifyCartDrawer } from './components/shopify/ShopifyCartDrawer';
import { pricingService } from './services/pricingService';
import { shopifyService, ShopifyCartResult } from './services/shopifyService';
import { pdfService } from './services/pdfService';
import {
  Columns,
  Eye,
  PenTool,
  RotateCcw,
  Share2,
  Code,
  Sliders,
  CheckCircle2,
} from 'lucide-react';

export const App: React.FC = () => {
  const [state, setState] = useState<ConfiguratorState>(INITIAL_CONFIGURATOR_STATE);
  const [pricing, setPricing] = useState<PricingBreakdown | null>(null);
  const [isLoadingPrice, setIsLoadingPrice] = useState(false);
  const [activeSidebarTab, setActiveSidebarTab] = useState<'editor' | 'options'>('editor');

  // Shopify Cart Drawer
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartResult, setCartResult] = useState<ShopifyCartResult | null>(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showEmbedModal, setShowEmbedModal] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  const viewportRef = useRef<ThreeViewportRef>(null);

  /**
   * Helper to show temporary toast notification
   */
  const showToast = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 3000);
  };

  /**
   * Recalculate dynamic pricing whenever relevant state changes
   */
  useEffect(() => {
    let isCancelled = false;
    setIsLoadingPrice(true);

    pricingService
      .calculatePricing(state)
      .then((breakdown) => {
        if (!isCancelled) {
          setPricing(breakdown);
          setIsLoadingPrice(false);

          // Post price update message if in iframe
          if (window.parent && window.parent !== window) {
            window.parent.postMessage(
              {
                type: 'PRICE_UPDATED',
                pricing: breakdown,
              },
              '*'
            );
          }
        }
      })
      .catch((err) => {
        if (!isCancelled && err.name !== 'AbortError') {
          console.error('Pricing error:', err);
          setIsLoadingPrice(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [
    state.size,
    state.frameType,
    state.sections,
    state.walls,
    state.accessories,
  ]);

  /**
   * PostMessage listener for iframe communication
   */
  useEffect(() => {
    // Notify parent window that configurator is mounted and ready
    if (window.parent && window.parent !== window) {
      window.parent.postMessage({ type: 'CONFIGURATOR_READY' }, '*');
    }

    const handleMessage = (e: MessageEvent) => {
      const data = e.data;
      if (!data || typeof data !== 'object') return;

      switch (data.type) {
        case 'SET_CONFIGURATION':
          if (data.configuration) {
            setState((prev) => ({ ...prev, ...data.configuration }));
            showToast('Configuration loaded from host page!');
          }
          break;
        case 'GET_CONFIGURATION':
          window.parent.postMessage(
            {
              type: 'CONFIGURATION_DATA',
              configuration: state,
              pricing,
            },
            '*'
          );
          break;
        case 'TRIGGER_ADD_TO_CART':
          handleAddToCart();
          break;
        case 'SET_SIZE':
          if (data.size) setState((prev) => ({ ...prev, size: data.size }));
          break;
        default:
          break;
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [state, pricing]);

  /**
   * Handle section selection (either via 2D tabs or 3D raycasting click)
   */
  const handleSelectSection = useCallback((sectionId: SectionId) => {
    setState((prev) => ({
      ...prev,
      activeSectionId: sectionId,
    }));
    setActiveSidebarTab('editor');

    // Smoothly pivot camera towards the selected section
    const secDef = SECTIONS.find((s) => s.id === sectionId);
    if (secDef && viewportRef.current) {
      viewportRef.current.setPreset(secDef.cameraTargetPreset);
    }

    showToast(`Focused on ${sectionId.replace('_', ' ').toUpperCase()}`);
  }, []);

  /**
   * Update active section configuration
   */
  const handleUpdateActiveSection = (updated: SectionConfig) => {
    setState((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [updated.sectionId]: updated,
      },
    }));
  };

  /**
   * Partial state updates from Product Options Panel
   */
  const handleUpdateState = (partial: Partial<ConfiguratorState>) => {
    setState((prev) => ({ ...prev, ...partial }));
  };

  /**
   * Add to Shopify Cart
   */
  const handleAddToCart = async () => {
    if (!pricing) return;
    setState((prev) => ({ ...prev, isAddingToCart: true }));

    try {
      const snapshotUrl = viewportRef.current?.exportSnapshot() || '';
      const result = await shopifyService.addToCart(state, pricing, snapshotUrl);
      setCartResult(result);
      setIsCartOpen(true);
    } catch (err) {
      console.error('Add to cart failed:', err);
      alert('Error adding to cart');
    } finally {
      setState((prev) => ({ ...prev, isAddingToCart: false }));
    }
  };

  /**
   * Download PDF Production Summary
   */
  const handleDownloadPdf = async () => {
    if (!pricing) return;
    setIsGeneratingPdf(true);
    showToast('Generating high-res production proof PDF...');

    try {
      const snapshotUrl = viewportRef.current?.exportSnapshot() || '';
      await pdfService.generateProductionProof(state, pricing, snapshotUrl);
      showToast('Production proof PDF downloaded successfully!');
    } catch (err) {
      console.error('PDF generation error:', err);
      alert('Failed to generate PDF proof');
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  /**
   * Reset design to defaults
   */
  const handleResetDesign = () => {
    if (window.confirm('Reset all custom graphics and options to default?')) {
      setState(INITIAL_CONFIGURATOR_STATE);
      viewportRef.current?.resetCamera();
      showToast('Design reset to default');
    }
  };

  /**
   * Share / Export structured JSON
   */
  const handleExportJson = () => {
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(state, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `tent-config-${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Structured JSON configuration exported!');
  };

  // Active section definition
  const activeSectionDef =
    SECTIONS.find((s) => s.id === state.activeSectionId) || SECTIONS[0];
  const activeSectionConfig = state.sections[state.activeSectionId] || {
    sectionId: state.activeSectionId,
    customColor: null,
    textElements: [],
    imageElements: [],
  };

  // Customized status per section for tab badges
  const sectionCustomizedStatus: Record<SectionId, boolean> = {} as Record<SectionId, boolean>;
  (Object.keys(state.sections) as SectionId[]).forEach((sid) => {
    const sec = state.sections[sid];
    sectionCustomizedStatus[sid] =
      Boolean(sec) &&
      (sec.textElements.length > 0 ||
        sec.imageElements.length > 0 ||
        sec.customColor !== null);
  });

  return (
    <div className="w-screen h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 bg-sky-600/90 backdrop-blur-md text-white text-xs font-semibold px-4 py-2 rounded-full shadow-2xl border border-sky-400/40 animate-in fade-in slide-in-from-top-2">
          {notification}
        </div>
      )}

      {/* Top Application Navigation Bar */}
      <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between z-30 flex-shrink-0">
        {/* Brand Title */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-600 to-blue-500 flex items-center justify-center font-black text-white text-base shadow-md shadow-sky-600/30">
            ▲
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white tracking-tight flex items-center gap-2">
              <span>MVP Visuals</span>
              <span className="text-[10px] text-sky-400 bg-sky-950/80 border border-sky-800/80 px-2 py-0.5 rounded-full font-bold">
                10x10 Custom Canopy Tent
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Interactive 3D Configurator & Dye-Sublimation Proofing Engine
            </p>
          </div>
        </div>

        {/* View Mode Switcher (Split, 3D Only, 2D Only) */}
        <div className="hidden md:flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => handleUpdateState({ editorViewMode: 'split' })}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              state.editorViewMode === 'split'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Columns className="w-3.5 h-3.5" />
            <span>Split View</span>
          </button>
          <button
            onClick={() => handleUpdateState({ editorViewMode: '3d-only' })}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              state.editorViewMode === '3d-only'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>3D Viewport</span>
          </button>
          <button
            onClick={() => handleUpdateState({ editorViewMode: '2d-only' })}
            className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition ${
              state.editorViewMode === '2d-only'
                ? 'bg-sky-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <PenTool className="w-3.5 h-3.5" />
            <span>2D Print Editor</span>
          </button>
        </div>

        {/* Right Toolbar Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetDesign}
            title="Reset Design"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-medium"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <button
            onClick={handleExportJson}
            title="Export JSON Configuration"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition text-xs font-medium"
          >
            <Share2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowEmbedModal(true)}
            title="Shopify Iframe Embed Code"
            className="px-2.5 py-1.5 rounded-lg bg-sky-600/20 text-sky-300 border border-sky-500/30 hover:bg-sky-600 hover:text-white transition text-xs font-bold flex items-center gap-1.5"
          >
            <Code className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Shopify Embed</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* 3D Viewport Column */}
        {state.editorViewMode !== '2d-only' && (
          <div
            className={`relative h-full transition-all duration-300 ${
              state.editorViewMode === '3d-only'
                ? 'w-full'
                : 'w-full lg:w-[58%] border-r border-slate-800'
            }`}
          >
            <ThreeViewport
              ref={viewportRef}
              state={state}
              onSelectSection={handleSelectSection}
              onToggleAutoRotate={() =>
                handleUpdateState({ autoRotate: !state.autoRotate })
              }
              onToggleWireframe={() =>
                handleUpdateState({ showWireframe: !state.showWireframe })
              }
            />
          </div>
        )}

        {/* 2D Editor & Options Sidebar Column */}
        {state.editorViewMode !== '3d-only' && (
          <div
            className={`h-full flex flex-col bg-slate-900 overflow-hidden transition-all duration-300 ${
              state.editorViewMode === '2d-only'
                ? 'w-full'
                : 'w-full lg:w-[42%]'
            }`}
          >
            {/* Sidebar View Toggle Tabs */}
            <div className="flex border-b border-slate-800 bg-slate-950/80 px-3 pt-2">
              <button
                onClick={() => setActiveSidebarTab('editor')}
                className={`pb-2.5 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition ${
                  activeSidebarTab === 'editor'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <PenTool className="w-3.5 h-3.5" />
                <span>2D Custom Print Editor</span>
              </button>
              <button
                onClick={() => setActiveSidebarTab('options')}
                className={`pb-2.5 px-4 text-xs font-extrabold flex items-center gap-2 border-b-2 transition ${
                  activeSidebarTab === 'options'
                    ? 'border-sky-500 text-sky-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Product Hardware & Options</span>
              </button>
            </div>

            {/* Sidebar Tab Content */}
            <div className="flex-1 overflow-hidden flex flex-col">
              {activeSidebarTab === 'editor' ? (
                <div className="flex-1 flex flex-col overflow-hidden">
                  {/* Section Switcher Tabs */}
                  <EditorTabs
                    activeSectionId={state.activeSectionId}
                    onSelectSection={handleSelectSection}
                    sectionCustomizedStatus={sectionCustomizedStatus}
                  />

                  {/* 2D Interactive Canvas Editor */}
                  <div className="h-64 sm:h-72 flex-shrink-0">
                    <Canvas2DEditor
                      sectionDef={activeSectionDef}
                      sectionConfig={activeSectionConfig}
                      canopyBaseColor={state.canopyColor}
                      showSafeMargins={state.showSafePrintMargins}
                      onToggleSafeMargins={() =>
                        handleUpdateState({
                          showSafePrintMargins: !state.showSafePrintMargins,
                        })
                      }
                      onUpdateSection={handleUpdateActiveSection}
                    />
                  </div>

                  {/* Tools Panel (Text, Logo Upload, Color) */}
                  <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3">
                    <TextTool
                      sectionConfig={activeSectionConfig}
                      onUpdateSection={handleUpdateActiveSection}
                    />
                    <ImageUploadTool
                      sectionConfig={activeSectionConfig}
                      onUpdateSection={handleUpdateActiveSection}
                    />
                    <SectionColorPicker
                      sectionConfig={activeSectionConfig}
                      canopyBaseColor={state.canopyColor}
                      onUpdateSection={handleUpdateActiveSection}
                    />
                  </div>
                </div>
              ) : (
                /* Hardware Options Panel */
                <ProductOptionsPanel
                  state={state}
                  onUpdateState={handleUpdateState}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Persistent Bottom Pricing & Add to Cart Bar */}
      <PricingBar
        pricing={pricing}
        isLoadingPrice={isLoadingPrice}
        onAddToCart={handleAddToCart}
        onDownloadPdf={handleDownloadPdf}
        isGeneratingPdf={isGeneratingPdf}
      />

      {/* Slide-out Shopify Cart Drawer Modal */}
      <ShopifyCartDrawer
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cartResult={cartResult}
        snapshotUrl={viewportRef.current?.exportSnapshot()}
        onDownloadPdf={handleDownloadPdf}
      />

      {/* Shopify Iframe Embed Guide Modal */}
      {showEmbedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-xl w-full p-5 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Code className="w-5 h-5 text-sky-400" />
                <h3 className="font-bold text-sm text-white">
                  Shopify Storefront Iframe Integration
                </h3>
              </div>
              <button
                onClick={() => setShowEmbedModal(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              This configurator is designed to be cleanly embedded into any Shopify
              Product Page (e.g., inside <code>product-template.liquid</code> or an App Block).
              It communicates bidirectionally with the host page via <code>postMessage</code>.
            </p>

            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
              <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                <span>Standard Iframe Embed Code:</span>
                <span className="text-sky-400 font-mono">Responsive 100% Height</span>
              </div>
              <pre className="text-[11px] font-mono text-sky-300 overflow-x-auto whitespace-pre-wrap">
{`<iframe
  src="https://your-domain.com/configurator?embed=true"
  width="100%"
  height="720px"
  frameborder="0"
  allow="camera; accelerometer"
></iframe>`}
              </pre>
            </div>

            <div className="bg-slate-800/60 p-3 rounded-xl border border-slate-700/80 flex flex-col gap-2">
              <span className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                <span>Interactive Live Demo Available!</span>
              </span>
              <p className="text-[11px] text-slate-300">
                You can test the full Shopify parent-child iframe communication in action by opening:
                <br />
                <a
                  href="/embed-demo.html"
                  target="_blank"
                  rel="noreferrer"
                  className="font-mono text-sky-400 underline font-semibold mt-1 inline-block"
                >
                  /embed-demo.html (Shopify PDP Simulator)
                </a>
              </p>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => setShowEmbedModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
