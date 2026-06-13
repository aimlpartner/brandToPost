import { useState, useEffect } from "react";
import { WeeklyCampaign } from "../types";
import { Link, useSearchParams } from "react-router-dom";
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
  const [isLoadingCampaigns, setIsLoadingCampaigns] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const [showTour, setShowTour] = useState(false);

  useEffect(() => {
    if (searchParams.get("tour") === "true") {
      setShowTour(true);
      const newParams = new URLSearchParams(searchParams);
      newParams.delete("tour");
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    if (!user || !activeProduct) {
      setCampaigns([]);
      setIsLoadingCampaigns(false);
      return;
    }

    setIsLoadingCampaigns(true);

    const q = query(
      collection(db, "campaigns"),
      where("userId", "==", user.uid),
      where("productId", "==", activeProduct.id)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const fetchedCampaigns = snapshot.docs.map(
          (doc) => ({ id: doc.id, ...doc.data() } as WeeklyCampaign)
        );
        fetchedCampaigns.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setCampaigns(fetchedCampaigns);
        setIsLoadingCampaigns(false);
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, "campaigns");
        setIsLoadingCampaigns(false);
      }
    );

    return () => unsubscribe();
  }, [user, activeProduct]);

  return (
    <div className="space-y-4 sm:space-y-8 px-4 sm:px-0">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-800 font-display">
            Dashboard
          </h1>
          <p className="mt-3 text-lg text-slate-600 font-light">
            Welcome to BrandToPost. Turn your brand's Position into Outreach,
            Signal, and Traction.
          </p>
        </div>

        {/* Product Selector for Dashboard */}
        <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-[#7C3AED]/15 shadow-sm">
          <span className="text-sm font-medium text-slate-500">Viewing:</span>
          <select
            value={activeProduct?.id || ""}
            onChange={(e) => setActiveProductId(e.target.value)}
            className="bg-transparent text-sm font-semibold text-slate-800 border-none focus:ring-0 cursor-pointer outline-none placeholder-gray-500"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Tror Assistant Welcome Card */}
        <div className="tour-welcome-card glass-card p-4 sm:p-6 sm:col-span-2 lg:col-span-3 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden bg-gradient-to-br from-white to-slate-50 border-[#7C3AED]/15 shadow-sm">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#7C3AED]/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-[#2583EB]/10 blur-[60px] rounded-full pointer-events-none" />

          <div className="relative shrink-0 z-10 w-32 h-32 md:w-40 md:h-40 rounded-full border border-[#7C3AED]/15 bg-white flex items-center justify-center p-2 shadow-[0_0_30px_rgba(124,58,237,0.15)]">
            <img
              src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2P-AVATAR.png"
              alt="Tror"
              className="w-full h-full object-contain drop-shadow-xl"
            />
          </div>

          <div className="flex-1 relative z-10 text-center md:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#10B981]/10 border border-[#10B981]/20 text-[#10B981] text-xs font-bold mb-3">
              <div className="w-1.5 h-1.5 rounded-full bg-[#10B981] animate-pulse" />
              Tror is Online
            </div>
            <h2 className="text-2xl font-bold font-display text-slate-800 mb-2">
              Sup,{" "}
              {user?.displayName
                ? user.displayName.split(" ")[0]
                : "there"}{" "}
              I've got my eyes on the signals.
            </h2>
            <p className="text-slate-600 font-medium">
              Let's build more momentum today. Generate a new campaign, or
              refine your brand's core positioning.
            </p>
          </div>
        </div>

        <div className="tour-campaigns-stat glass-card p-4 sm:p-6 bg-white/95 border-[#7C3AED]/15 hover:border-[#7C3AED]/35 transition-colors">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#2583EB] text-white shadow-sm">
              <Megaphone className="h-7 w-7 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-slate-500 uppercase tracking-wider">
                Campaigns for {activeProduct?.name || "Product"}
              </p>
              {isLoadingCampaigns ? (
                <div className="h-8 w-12 bg-slate-100 rounded animate-pulse mt-1" />
              ) : (
                <p className="text-3xl font-bold text-slate-800 font-display mt-1">
                  {campaigns.length}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="glass-card p-4 sm:p-6 sm:col-span-1 lg:col-span-2 bg-white/80 border-[#7C3AED]/10 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-3">
            The POST Framework
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-bold text-[#7C3AED] mb-1">
                P — Position
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Define what the brand stands for and who it serves.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-700 mb-1">
                O — Outreach
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Put the message in front of the right audience.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#FF7778] mb-1">
                S — Signal
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Create consistent content that builds trust.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-[#10B981] mb-1">
                T — Traction
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Turn attention into leads and business growth.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="tour-recent-campaigns glass-panel overflow-hidden bg-white border-[#7C3AED]/15 shadow-sm">
        <div className="border-b border-slate-100 px-8 py-6 flex items-center justify-between bg-slate-50/50">
          <h3 className="text-lg font-semibold leading-6 text-slate-800 flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[#7C3AED]" />
            Recent Campaigns
          </h3>
          <Link
            to="/dashboard/campaigns"
            className="text-sm font-medium text-[#7C3AED] hover:text-[#7C3AED]/80 flex items-center gap-1 transition-colors"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="divide-y divide-slate-100">
          {isLoadingCampaigns ? (
            Array.from({ length: 3 }).map((_, idx) => (
              <div
                key={idx}
                className="px-8 py-6 animate-pulse"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 space-y-3">
                    <div className="h-4 bg-slate-100 rounded w-1/4" />
                    <div className="h-3 bg-slate-100 rounded w-1/2" />
                  </div>
                  <div className="w-16 h-3 bg-slate-100 rounded mt-3 shrink-0" />
                </div>
              </div>
            ))
          ) : campaigns.length === 0 ? (
            <div className="px-8 py-20 text-center flex flex-col items-center">
              <img
                src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2P-AVATAR.png"
                alt="Tror"
                className="h-44 w-auto mb-6 drop-shadow-[0_0_20px_rgba(124,58,237,0.4)]"
              />
              <h3 className="text-xl font-bold text-slate-800 font-display">
                No campaigns yet
              </h3>
              <p className="mt-2 text-slate-500">
                Tror is waiting for your Brand Position to start generating
                campaigns!
              </p>
              <div className="mt-8">
                <Link
                  to="/dashboard/dna"
                  className="glass-button-primary rounded-xl px-6 py-3 text-sm font-semibold inline-flex items-center justify-center"
                >
                  Define Brand Position
                </Link>
              </div>
            </div>
          ) : (
            campaigns.slice(0, 5).map((campaign) => (
              <Link
                key={campaign.id}
                to={`/dashboard/campaigns?id=${campaign.id}`}
                className="block px-8 py-6 hover:bg-[#7C3AED]/5 transition-all duration-300 group cursor-pointer border-l-2 border-transparent hover:border-[#7C3AED]"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold text-slate-800 group-hover:text-[#7C3AED] transition-colors">
                      {campaign.theme}
                    </p>
                    <p className="text-sm text-slate-500 mt-1.5">
                      {campaign.coreMessage}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-slate-400 mt-3 font-medium">
                      {new Date(campaign.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>

      {showTour && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
          <div className="relative w-full max-w-lg bg-slate-900 border border-slate-800 rounded-3xl p-8 overflow-hidden text-slate-100 shadow-2xl">
            {/* Glows */}
            <div className="absolute top-[-20%] left-[-10%] w-60 h-60 bg-[#7C3AED]/20 rounded-full blur-[60px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-48 h-48 bg-[#2583EB]/20 rounded-full blur-[50px] pointer-events-none" />

            <div className="relative z-10 flex flex-col items-center text-center space-y-6">
              <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#2583EB] p-1 shadow-lg shadow-[#7C3AED]/20 relative">
                <div className="w-full h-full rounded-full bg-[#0A0A0F] flex items-center justify-center overflow-hidden">
                  <img
                    src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2P-AVATAR.png"
                    alt="Tror"
                    className="w-24 h-24 object-contain drop-shadow-lg"
                  />
                </div>
                {/* Status dot */}
                <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-slate-900" />
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-mono tracking-widest text-[#7C3AED] uppercase font-bold bg-[#7C3AED]/10 px-3 py-1 rounded-full">
                  Agent Tror Initialized
                </span>
                <h3 className="text-2xl font-bold font-display text-white tracking-tight">
                  Welcome to your Workspace! 🚀
                </h3>
                <p className="text-slate-400 text-sm font-light leading-relaxed max-w-sm">
                  Hey there! I'm <strong className="text-white font-semibold">Tror</strong>, your AI growth strategist. I've successfully compiled your brand identity and generated your first campaign.
                </p>
              </div>

              <div className="w-full border-t border-slate-800 py-1" />

              <div className="space-y-2 w-full text-left bg-slate-950/40 border border-slate-800 p-4 rounded-2xl">
                <h4 className="text-xs font-mono font-bold text-slate-500 uppercase tracking-widest">
                  Ready to Explore:
                </h4>
                <ul className="text-xs text-slate-350 space-y-2 list-none font-medium">
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                    Browse your first <strong className="text-white">Generated Campaign</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                    Verify your extracted <strong className="text-white">Brand DNA</strong>
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#7C3AED]" />
                    Design marketing assets in <strong className="text-white">Creatives</strong>
                  </li>
                </ul>
              </div>

              <button
                onClick={() => setShowTour(false)}
                className="w-full py-3.5 bg-gradient-to-r from-[#7C3AED] to-[#2583EB] text-white font-bold rounded-xl shadow-lg hover:shadow-[#7C3AED]/20 active:scale-[0.98] transition-all text-sm uppercase tracking-wider"
              >
                Let's Go!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
