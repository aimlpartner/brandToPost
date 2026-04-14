import { useState, useEffect } from "react";
import { ProductDNA as ProductDNAType } from "../types";
import { Save, Loader2, Sparkles, Trash2, AlertTriangle, Palette, Type, Image as ImageIcon, Layout, Globe, FileText, Target, MessageSquare, Zap, Link } from "lucide-react";
import { researchProductDNA } from "../services/geminiService";
import { useProducts } from "../contexts/ProductContext";
import { useAuth } from "../contexts/AuthContext";
import { logSilentError } from "../lib/firestore-error";

export function ProductDNA() {
  const { activeProduct, updateProduct, deleteProduct } = useProducts();
  const { user } = useAuth();
  const [dna, setDna] = useState<ProductDNAType>({
    id: "",
    name: "",
    website: "",
    positioning: "",
    audience: "",
    tone: "",
    stage: "",
    visualStyle: "",
    visualData: undefined,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isResearching, setIsResearching] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [productDocument, setProductDocument] = useState<{ data: string, mimeType: string, name: string } | null>(null);
  
  // Delete modal state
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (activeProduct) {
      setDna(activeProduct);
    }
  }, [activeProduct]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setDna({ ...dna, [e.target.name]: e.target.value });
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct) return;
    setIsSaving(true);
    // Simulate API call
    setTimeout(() => {
      updateProduct(activeProduct.id, dna);
      setIsSaving(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    }, 600);
  };

  const handleDeleteProduct = async () => {
    if (deleteConfirmation !== "DELETE" || !activeProduct) return;
    setIsDeleting(true);
    try {
      await deleteProduct(activeProduct.id);
      setIsDeleteModalOpen(false);
      setDeleteConfirmation("");
    } catch (err) {
      logSilentError(err as Error, { context: "deleteProduct", productId: activeProduct.id });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResearch = async () => {
    if ((!dna.website && !dna.description && !productDocument) || !activeProduct) {
      setError("Please enter a website URL, a product description, or upload a document first.");
      return;
    }
    setError(null);
    setIsResearching(true);
    try {
      const researchedData = await researchProductDNA(dna.website, dna, productDocument ? { data: productDocument.data, mimeType: productDocument.mimeType } : null, user?.uid);
      const newDna = { ...dna, ...researchedData } as ProductDNAType;
      setDna(newDna);
      updateProduct(activeProduct.id, newDna);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      logSilentError(err as Error, { context: "handleResearch" });
      setError("Failed to research. Please check your API key or document format.");
    } finally {
      setIsResearching(false);
    }
  };

  const handleDocumentUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError("Document file size must be less than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = (reader.result as string).split(',')[1];
      setProductDocument({
        data: base64String,
        mimeType: file.type,
        name: file.name
      });
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setError("Only JPEG and PNG images are allowed for PDF compatibility.");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError("Logo file size must be less than 2MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          
          // Preserve transparency by saving as PNG
          const base64String = canvas.toDataURL('image/png');
          setDna({ ...dna, logoUrl: base64String });
          setSaved(false);
          setError(null);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  if (!activeProduct) {
    return <div className="p-8">Please select or create a product first.</div>;
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto w-full">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-[#111827] font-display">Brand Position</h1>
        <p className="mt-3 text-lg text-[#111827]/70 font-light">
          Define your brand's Position (The 'P' in POST). The engine uses this to drive Outreach, Signal, and Traction.
        </p>
      </div>

      {error && (
        <div className="glass-panel bg-red-50/50 border-red-200/50 p-4">
          <p className="text-sm text-red-700 font-medium">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Core Identity */}
          <div className="lg:col-span-2 glass-panel p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2 border-b border-white/20 pb-4">
              <Layout className="h-5 w-5 text-[#ff6347]" />
              <h2 className="text-lg font-semibold text-[#111827]">Core Identity</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-semibold leading-6 text-[#111827]">
                  Company Logo
                </label>
                <div className="mt-2 flex items-center gap-4">
                  {dna.logoUrl && (
                    <div className="h-16 w-16 rounded-lg border border-[#ff8566] overflow-hidden bg-white/50 flex items-center justify-center shrink-0">
                      <img src={dna.logoUrl} alt="Logo" className="max-h-full max-w-full object-contain" />
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="block w-full text-sm text-[#4b5563] file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#fafafa] file:text-[#111827] hover:file:bg-[#fafafa] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="name" className="block text-sm font-semibold leading-6 text-[#111827]">
                  Product Name
                </label>
                <div className="mt-2">
                  <input
                    type="text"
                    name="name"
                    id="name"
                    value={dna.name}
                    onChange={handleChange}
                    className="glass-input px-4 py-3"
                    placeholder="My Product"
                    required
                  />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="positioning" className="block text-sm font-semibold leading-6 text-[#111827]">
                Positioning / Value Prop
              </label>
              <div className="mt-2">
                <textarea
                  name="positioning"
                  id="positioning"
                  rows={2}
                  value={dna.positioning}
                  onChange={handleChange}
                  className="glass-input px-4 py-3"
                  placeholder="e.g., AI-powered social campaign engine..."
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="audience" className="block text-sm font-semibold leading-6 text-[#111827]">
                Target Audience Persona
              </label>
              <div className="mt-2">
                <textarea
                  name="audience"
                  id="audience"
                  rows={2}
                  value={dna.audience}
                  onChange={handleChange}
                  className="glass-input px-4 py-3"
                  placeholder="e.g., Solo founder / Head of Growth at early-stage SaaS..."
                  required
                />
              </div>
            </div>
          </div>

          {/* AI Auto-Fill */}
          <div className="lg:col-span-1 glass-panel p-6 space-y-6 bg-gradient-to-br from-white/40 to-[#ff6347]/5 border-[#ff6347]/20">
            <div className="flex items-center gap-2 mb-2 border-b border-[#ff6347]/20 pb-4">
              <Sparkles className="h-5 w-5 text-[#ff6347]" />
              <h2 className="text-lg font-semibold text-[#111827]">AI Auto-Fill</h2>
            </div>
            
            <p className="text-xs text-[#4b5563] leading-relaxed">
              Provide sources below and let AI extract your positioning, audience, tone, and visual DNA automatically.
            </p>

            <div>
              <label htmlFor="website" className="flex items-center gap-2 text-sm font-semibold leading-6 text-[#111827]">
                <Globe className="h-4 w-4 text-[#ff8566]" />
                Website URL
              </label>
              <div className="mt-2">
                <input
                  type="url"
                  name="website"
                  id="website"
                  value={dna.website}
                  onChange={handleChange}
                  className="glass-input px-4 py-3"
                  placeholder="https://your-saas.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="description" className="flex items-center gap-2 text-sm font-semibold leading-6 text-[#111827]">
                <FileText className="h-4 w-4 text-[#ff8566]" />
                Description
              </label>
              <div className="mt-2">
                <textarea
                  name="description"
                  id="description"
                  rows={2}
                  value={dna.description || ""}
                  onChange={handleChange}
                  className="glass-input px-4 py-3"
                  placeholder="Briefly describe what you build..."
                />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-2 text-sm font-semibold leading-6 text-[#111827]">
                <Link className="h-4 w-4 text-[#ff8566]" />
                Document (PDF/TXT/MD)
              </label>
              <div className="mt-2">
                <input
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={handleDocumentUpload}
                  className="block w-full text-xs text-[#4b5563] file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-[#fafafa] file:text-[#111827] hover:file:bg-[#fafafa] transition-colors"
                />
                {productDocument && (
                  <p className="mt-2 text-xs text-green-600 font-medium truncate">
                    ✓ {productDocument.name}
                  </p>
                )}
              </div>
            </div>

            <button
              type="button"
              onClick={handleResearch}
              disabled={isResearching || (!dna.website && !dna.description && !productDocument)}
              className="w-full glass-button-primary px-5 py-3 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-[#ff6347]/20"
            >
              {isResearching ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="mr-2 h-4 w-4" />
              )}
              Extract Brand DNA
            </button>
          </div>

          {/* Brand Voice */}
          <div className="lg:col-span-1 glass-panel p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2 border-b border-white/20 pb-4">
              <MessageSquare className="h-5 w-5 text-violet-500" />
              <h2 className="text-lg font-semibold text-[#111827]">Brand Voice</h2>
            </div>

            <div>
              <label htmlFor="tone" className="block text-sm font-semibold leading-6 text-[#111827]">
                Tone of Voice
              </label>
              <div className="mt-2">
                <input
                  type="text"
                  name="tone"
                  id="tone"
                  value={dna.tone}
                  onChange={handleChange}
                  className="glass-input px-4 py-3"
                  placeholder="e.g., Professional, insight-driven"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="stage" className="block text-sm font-semibold leading-6 text-[#111827]">
                Company Stage
              </label>
              <div className="mt-2">
                <select
                  name="stage"
                  id="stage"
                  value={dna.stage}
                  onChange={handleChange}
                  className="glass-input px-4 py-3 appearance-none bg-white/20"
                >
                  <option value="" className="text-[#111827]">Select stage...</option>
                  <option value="MVP" className="text-[#111827]">MVP / Pre-revenue</option>
                  <option value="Early Growth" className="text-[#111827]">Early Growth (10-100 customers)</option>
                  <option value="Scaling" className="text-[#111827]">Scaling ($1M+ ARR)</option>
                  <option value="Enterprise" className="text-[#111827]">Enterprise</option>
                </select>
              </div>
            </div>
          </div>

          {/* Visual DNA */}
          <div className="lg:col-span-2 glass-panel p-6 space-y-6">
            <div className="flex items-center gap-2 mb-2 border-b border-white/20 pb-4">
              <Palette className="h-5 w-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-[#111827]">Visual DNA</h2>
            </div>

            <div>
              <label htmlFor="visualStyle" className="block text-sm font-semibold leading-6 text-[#111827]">
                Overall Aesthetic / Mood Board
              </label>
              <div className="mt-2">
                <textarea
                  name="visualStyle"
                  id="visualStyle"
                  rows={2}
                  value={dna.visualStyle || ""}
                  onChange={handleChange}
                  className="glass-input px-4 py-3"
                  placeholder="e.g., Minimalist, dark mode, neon green accents..."
                />
              </div>
            </div>

            {dna.visualData && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4">
                {/* Colors */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[#4b5563] uppercase tracking-wider flex items-center gap-1.5">
                    <Palette className="h-3.5 w-3.5" /> Color Palette
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {dna.visualData.colors.map((color, idx) => (
                      <div key={idx} className="group relative">
                        <div 
                          className="w-10 h-10 rounded-full shadow-sm border border-black/10 transition-transform group-hover:scale-110"
                          style={{ backgroundColor: color }}
                        />
                        <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono bg-black/80 text-white px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          {color}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Fonts */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-[#4b5563] uppercase tracking-wider flex items-center gap-1.5">
                    <Type className="h-3.5 w-3.5" /> Typography
                  </h3>
                  {dna.visualData.fonts.primary && (
                    <style>
                      {`@import url('https://fonts.googleapis.com/css2?family=${dna.visualData.fonts.primary.replace(/ /g, '+')}&display=swap');`}
                    </style>
                  )}
                  {dna.visualData.fonts.secondary && (
                    <style>
                      {`@import url('https://fonts.googleapis.com/css2?family=${dna.visualData.fonts.secondary.replace(/ /g, '+')}&display=swap');`}
                    </style>
                  )}
                  <div className="space-y-3">
                    <div className="bg-white/40 rounded-xl p-3 border border-white/50 flex items-center gap-4 shadow-sm">
                      <div 
                        className="flex items-center justify-center w-12 h-12 rounded-lg bg-white shadow-sm text-2xl border border-gray-100 text-[#111827]"
                        style={{ fontFamily: `"${dna.visualData.fonts.primary}", sans-serif` }}
                      >
                        Aa
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block mb-0.5 font-semibold">Primary (Headings)</span>
                        <span className="text-base font-medium text-[#111827]">{dna.visualData.fonts.primary}</span>
                      </div>
                    </div>
                    <div className="bg-white/40 rounded-xl p-3 border border-white/50 flex items-center gap-4 shadow-sm">
                      <div 
                        className="flex items-center justify-center w-12 h-12 rounded-lg bg-white shadow-sm text-2xl border border-gray-100 text-[#111827]"
                        style={{ fontFamily: `"${dna.visualData.fonts.secondary}", sans-serif` }}
                      >
                        Aa
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6b7280] uppercase tracking-wider block mb-0.5 font-semibold">Secondary (Body)</span>
                        <span className="text-base font-medium text-[#111827]">{dna.visualData.fonts.secondary}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Hierarchy & Style */}
                <div className="sm:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-white/30 rounded-lg p-3 border border-white/40">
                    <h4 className="text-[10px] font-bold text-[#4b5563] uppercase tracking-wider mb-1">Hierarchy</h4>
                    <p className="text-xs text-[#111827]/80 leading-relaxed">{dna.visualData.typographyHierarchy}</p>
                  </div>
                  <div className="bg-white/30 rounded-lg p-3 border border-white/40">
                    <h4 className="text-[10px] font-bold text-[#4b5563] uppercase tracking-wider mb-1 flex items-center gap-1">
                      <ImageIcon className="h-3 w-3" /> Image Style
                    </h4>
                    <p className="text-xs text-[#111827]/80 leading-relaxed">{dna.visualData.imageStyle}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel p-4 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50/50 px-4 py-2 rounded-lg transition-colors border border-transparent hover:border-red-200/50"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Product
          </button>
          
          <div className="flex items-center gap-x-4">
            {saved && <span className="text-sm text-[#ff6347] font-semibold animate-in fade-in">Saved successfully!</span>}
            <button
              type="submit"
              disabled={isSaving}
              className="glass-button-primary px-6 py-2.5 text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save DNA
            </button>
          </div>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 border border-red-100">
            <div className="flex items-center gap-3 text-red-600 mb-4">
              <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold text-[#111827]">Delete Product</h3>
            </div>
            
            <p className="text-sm text-[#4b5563] mb-4">
              You are about to delete <strong>{activeProduct?.name}</strong>. This will permanently erase all associated Brand Position data and generated campaigns. This action cannot be undone.
            </p>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-[#111827] mb-2">
                Type <span className="font-bold text-red-600 select-all">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="w-full px-4 py-2 border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none transition-all"
                placeholder="DELETE"
              />
            </div>
            
            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteModalOpen(false);
                  setDeleteConfirmation("");
                }}
                className="px-4 py-2 text-sm font-medium text-[#4b5563] hover:bg-gray-100 rounded-lg transition-colors"
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteProduct}
                disabled={deleteConfirmation !== "DELETE" || isDeleting}
                className="flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
