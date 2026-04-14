import { useState, useEffect } from "react";
import { WeeklyCampaign } from "../types";
import { Link } from "react-router-dom";
import { Megaphone, ArrowRight, Zap, Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useProducts } from "../contexts/ProductContext";
import { db } from "../firebase";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { handleFirestoreError, OperationType } from "../lib/firestore-error";

export function Dashboard() {
  const { user } = useAuth();
  const { activeProduct, products, setActiveProductId } = useProducts();
  const [campaigns, setCampaigns] = useState<WeeklyCampaign[]>([]);

  useEffect(() => {
    if (!user || !activeProduct) {
      setCampaigns([]);
      return;
    }

    const q = query(
      collection(db, 'campaigns'), 
      where('userId', '==', user.uid),
      where('productId', '==', activeProduct.id)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedCampaigns = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WeeklyCampaign));
      fetchedCampaigns.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setCampaigns(fetchedCampaigns);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'campaigns');
    });

    return () => unsubscribe();
  }, [user, activeProduct]);

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-[#111827] font-display">Dashboard</h1>
          <p className="mt-3 text-lg text-[#111827]/70 font-light">
            Welcome to BrandToPost. Turn your brand's Position into Outreach, Signal, and Traction.
          </p>
        </div>
        
        {/* Product Selector for Dashboard */}
        <div className="flex items-center gap-3 bg-white/40 px-4 py-3 rounded-xl border border-white/50 shadow-sm backdrop-blur-md">
          <span className="text-sm font-medium text-[#4b5563]">Viewing:</span>
          <select
            value={activeProduct?.id || ''}
            onChange={(e) => setActiveProductId(e.target.value)}
            className="glass-input py-1.5 px-3 text-sm font-semibold text-[#111827] bg-white/60 border-none focus:ring-0 cursor-pointer rounded-lg outline-none"
          >
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <div className="glass-card p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff6347] to-[#ffe066] text-white shadow-sm">
              <Megaphone className="h-7 w-7 text-[#111827]" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#111827]/60 uppercase tracking-wider">
                Campaigns for {activeProduct?.name || 'Product'}
              </p>
              <p className="text-3xl font-bold text-[#111827] font-display mt-1">{campaigns.length}</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 sm:col-span-1 lg:col-span-2 bg-gradient-to-br from-white/40 to-white/10">
          <h3 className="text-sm font-bold text-[#111827] uppercase tracking-wider mb-3">The POST Framework</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-bold text-[#ff6347] mb-1">P — Position</p>
              <p className="text-xs text-[#111827]/70 leading-relaxed">Define what the brand stands for and who it serves.</p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#ff6347] mb-1">O — Outreach</p>
              <p className="text-xs text-[#111827]/70 leading-relaxed">Put the message in front of the right audience.</p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#ff6347] mb-1">S — Signal</p>
              <p className="text-xs text-[#111827]/70 leading-relaxed">Create consistent content that builds trust.</p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#ff6347] mb-1">T — Traction</p>
              <p className="text-xs text-[#111827]/70 leading-relaxed">Turn attention into leads and business growth.</p>
            </div>
          </div>
        </div>
      </div>

      <div className="glass-panel overflow-hidden">
        <div className="border-b border-white/30 px-8 py-6 flex items-center justify-between bg-white/10">
          <h3 className="text-lg font-semibold leading-6 text-[#111827] flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#ff6347]" />
            Recent Campaigns
          </h3>
          <Link to="/dashboard/campaigns" className="text-sm font-medium text-[#ff6347] hover:text-[#ffe066] flex items-center gap-1 transition-colors">
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="divide-y divide-white/20">
          {campaigns.length === 0 ? (
            <div className="px-8 py-20 text-center">
              <div className="mx-auto h-20 w-20 rounded-full bg-white/30 flex items-center justify-center mb-6 shadow-sm border border-white/50">
                <Zap className="h-10 w-10 text-[#ff6347]" />
              </div>
              <h3 className="text-lg font-semibold text-[#111827]">No campaigns yet</h3>
              <p className="mt-2 text-[#111827]/60">Get started by defining your brand's Position (The 'P' in POST).</p>
              <div className="mt-8">
                <Link
                  to="/dashboard/dna"
                  className="glass-button-primary px-6 py-3 text-sm font-semibold"
                >
                  Define Brand Position
                </Link>
              </div>
            </div>
          ) : (
            campaigns.slice(0, 5).map((campaign) => (
              <div key={campaign.id} className="px-8 py-6 hover:bg-white/20 transition-all duration-300">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-[#111827]">{campaign.theme}</p>
                    <p className="text-sm text-[#111827]/70 mt-1.5">{campaign.coreMessage}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-[#111827]/50 mt-3 font-medium">{new Date(campaign.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
