import React, { useState } from 'react';
import { Plus, Image as ImageIcon, Sparkles, X, RefreshCw, User, Package } from 'lucide-react';
import { AssetPickerModal } from './AssetPickerModal';
import { cn } from '../../lib/utils';

interface ProductMergeSlotsProps {
  asset1Url: string | null;
  asset2Url: string | null;
  onSetAsset1: (url: string | null) => void;
  onSetAsset2: (url: string | null) => void;
}

export function ProductMergeSlots({
  asset1Url,
  asset2Url,
  onSetAsset1,
  onSetAsset2
}: ProductMergeSlotsProps) {
  const [activeSlotModal, setActiveSlotModal] = useState<1 | 2 | null>(null);

  return (
    <div className="space-y-3 bg-violet-50/40 border border-violet-100/80 rounded-2xl p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-violet-600 text-white flex items-center justify-center">
            <Sparkles className="w-3.5 h-3.5" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-slate-900 font-display">Product Image Creator</h4>
            <p className="text-[11px] text-slate-500">
              Select 2 assets to merge with <span className="font-semibold text-violet-700">gpt-image-2</span>
            </p>
          </div>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 border border-violet-200">
          Dual Asset Synthesis
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        {/* Slot 1: Product / Main Item */}
        <div className="relative border border-dashed border-slate-200 hover:border-violet-400 bg-white rounded-xl p-3 flex flex-col items-center justify-center min-h-[170px] transition-colors">
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <Package className="w-3.5 h-3.5 text-violet-600" />
              Asset 1: Product / Item
            </span>
            {asset1Url && (
              <button
                onClick={() => onSetAsset1(null)}
                className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                title="Remove Asset 1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {asset1Url ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200 group bg-slate-50">
              <img
                src={asset1Url}
                alt="Asset 1 (Product)"
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setActiveSlotModal(1)}
                className="absolute inset-0 bg-black/40 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Change
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setActiveSlotModal(1)}
              className="w-full h-full flex flex-col items-center justify-center py-4 cursor-pointer text-slate-400 hover:text-violet-600 group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-violet-50 text-slate-400 group-hover:text-violet-600 flex items-center justify-center transition-colors mb-2">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-700">Choose Primary Product</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Upload or pick from library</span>
            </button>
          )}
        </div>

        {/* Slot 2: Person / Model / Second Product */}
        <div className="relative border border-dashed border-slate-200 hover:border-violet-400 bg-white rounded-xl p-3 flex flex-col items-center justify-center min-h-[170px] transition-colors">
          <div className="flex items-center justify-between w-full mb-2">
            <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-violet-600" />
              Asset 2: Person / Model / Item 2
            </span>
            {asset2Url && (
              <button
                onClick={() => onSetAsset2(null)}
                className="text-slate-400 hover:text-red-500 p-1 rounded-md transition-colors"
                title="Remove Asset 2"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {asset2Url ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden border border-slate-200 group bg-slate-50">
              <img
                src={asset2Url}
                alt="Asset 2 (Person / Item)"
                className="w-full h-full object-contain"
              />
              <button
                onClick={() => setActiveSlotModal(2)}
                className="absolute inset-0 bg-black/40 text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Change
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setActiveSlotModal(2)}
              className="w-full h-full flex flex-col items-center justify-center py-4 cursor-pointer text-slate-400 hover:text-violet-600 group"
            >
              <div className="w-10 h-10 rounded-xl bg-slate-50 group-hover:bg-violet-50 text-slate-400 group-hover:text-violet-600 flex items-center justify-center transition-colors mb-2">
                <Plus className="w-5 h-5" />
              </div>
              <span className="text-xs font-semibold text-slate-700">Choose Person or Second Item</span>
              <span className="text-[10px] text-slate-400 mt-0.5">Upload or pick from library</span>
            </button>
          )}
        </div>
      </div>

      <AssetPickerModal
        isOpen={activeSlotModal !== null}
        onClose={() => setActiveSlotModal(null)}
        title={activeSlotModal === 1 ? "Select Asset 1 (Primary Product)" : "Select Asset 2 (Person / Model / Item 2)"}
        description={
          activeSlotModal === 1
            ? "Choose your primary product packshot or item photo."
            : "Choose the person, model photo, or complementary product asset to merge with."
        }
        onSelectAsset={(url) => {
          if (activeSlotModal === 1) onSetAsset1(url);
          if (activeSlotModal === 2) onSetAsset2(url);
        }}
      />
    </div>
  );
}
