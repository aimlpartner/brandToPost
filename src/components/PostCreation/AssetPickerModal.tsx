import React, { useState, useEffect } from 'react';
import { X, Upload, Image as ImageIcon, Check, Loader2, Search, Plus } from 'lucide-react';
import { useProducts } from '../../contexts/ProductContext';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { Creative } from '../../types';
import { cn } from '../../lib/utils';

interface AssetPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAsset: (url: string) => void;
  title?: string;
  description?: string;
}

export function AssetPickerModal({
  isOpen,
  onClose,
  onSelectAsset,
  title = "Select Asset",
  description = "Upload from your computer or choose an asset from your Brand Library."
}: AssetPickerModalProps) {
  const { activeProduct } = useProducts();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'upload' | 'library'>('library');
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [isLoadingCreatives, setIsLoadingCreatives] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadedPreview, setUploadedPreview] = useState<string | null>(null);
  const [isProcessingUpload, setIsProcessingUpload] = useState(false);

  useEffect(() => {
    if (!isOpen || !activeProduct || !user) return;
    setIsLoadingCreatives(true);
    const q = query(
      collection(db, 'creatives'),
      where('productId', '==', activeProduct.id),
      where('userId', '==', user.uid)
    );
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: Creative[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() } as Creative);
        });
        setCreatives(list);
        setIsLoadingCreatives(false);
      },
      (err) => {
        console.warn('AssetPickerModal creatives listener note:', err);
        setIsLoadingCreatives(false);
      }
    );
    return () => unsubscribe();
  }, [isOpen, activeProduct, user]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsProcessingUpload(true);
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setUploadedPreview(result);
      setIsProcessingUpload(false);
    };
    reader.onerror = () => {
      setIsProcessingUpload(false);
      alert('Failed to read file. Please try a different image.');
    };
    reader.readAsDataURL(file);
  };

  const handleConfirmUploaded = () => {
    if (uploadedPreview) {
      onSelectAsset(uploadedPreview);
      onClose();
    }
  };

  // Combine Brand Creatives, Scraped Images, and Logo into available library items
  const extractedImages = activeProduct?.extractedMediaImages || [];
  const brandLogos = [activeProduct?.logoUrl, activeProduct?.logoDarkUrl].filter(Boolean) as string[];

  const allLibraryItems = [
    ...creatives.map((c) => ({ id: c.id, url: c.url, name: c.name || 'Creative Asset', source: 'Uploaded Creative' })),
    ...extractedImages.map((url, i) => ({ id: `extracted-${i}`, url, name: `Brand Media #${i + 1}`, source: 'Extracted Media' })),
    ...brandLogos.map((url, i) => ({ id: `logo-${i}`, url, name: `Brand Logo #${i + 1}`, source: 'Brand Identity' }))
  ];

  const filteredItems = allLibraryItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200/80 overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">{title}</h3>
            <p className="text-xs text-slate-500 mt-0.5">{description}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex px-6 pt-3 border-b border-slate-100 gap-4">
          <button
            onClick={() => setActiveTab('library')}
            className={cn(
              "pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer",
              activeTab === 'library'
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <ImageIcon className="w-4 h-4" />
            App Brand Library ({allLibraryItems.length})
          </button>
          <button
            onClick={() => setActiveTab('upload')}
            className={cn(
              "pb-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition-colors cursor-pointer",
              activeTab === 'upload'
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            )}
          >
            <Upload className="w-4 h-4" />
            Upload from System
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'upload' ? (
            <div className="space-y-4">
              <label
                htmlFor="modal-file-upload"
                className="border-2 border-dashed border-slate-200 hover:border-violet-400 rounded-2xl p-8 flex flex-col items-center justify-center cursor-pointer transition-colors bg-slate-50/50 hover:bg-violet-50/20"
              >
                <div className="w-12 h-12 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center mb-3">
                  <Upload className="w-6 h-6" />
                </div>
                <span className="text-sm font-semibold text-slate-800">
                  Click to browse or drop an image file
                </span>
                <span className="text-xs text-slate-400 mt-1">PNG, JPG, WEBP, or SVG up to 10MB</span>
                <input
                  id="modal-file-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>

              {isProcessingUpload && (
                <div className="flex items-center justify-center gap-2 py-4 text-xs text-slate-500">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                  Processing file...
                </div>
              )}

              {uploadedPreview && !isProcessingUpload && (
                <div className="space-y-3">
                  <span className="text-xs font-semibold text-slate-600 block">Uploaded Preview</span>
                  <div className="relative w-40 h-40 rounded-xl overflow-hidden border border-slate-200 shadow-sm bg-slate-100 mx-auto">
                    <img
                      src={uploadedPreview}
                      alt="Uploaded preview"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setUploadedPreview(null)}
                      className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      onClick={handleConfirmUploaded}
                      className="px-4 py-1.5 text-xs font-semibold bg-violet-600 hover:bg-violet-700 text-white rounded-lg transition-colors shadow-sm cursor-pointer"
                    >
                      Use Selected File
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Search bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search assets..."
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-violet-500 transition-colors"
                />
              </div>

              {isLoadingCreatives ? (
                <div className="flex items-center justify-center py-12 text-slate-400 text-xs gap-2">
                  <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                  Loading brand media...
                </div>
              ) : filteredItems.length === 0 ? (
                <div className="text-center py-12">
                  <ImageIcon className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs text-slate-500 font-medium">No assets found in brand library</p>
                  <p className="text-[11px] text-slate-400 mt-1">Upload a file from your system to use it immediately.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 max-h-[48vh] overflow-y-auto pr-1">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => {
                        onSelectAsset(item.url);
                        onClose();
                      }}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-slate-200 hover:border-violet-600 bg-slate-50 cursor-pointer transition-all hover:shadow-md"
                    >
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2">
                        <span className="text-[10px] font-semibold text-white truncate">{item.name}</span>
                        <span className="text-[8px] text-slate-300">{item.source}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
