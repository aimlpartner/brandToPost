import { NavLink } from "react-router-dom";
import { LayoutDashboard, Settings, FileText, Megaphone, CalendarClock, ChevronDown, Plus, LogOut, Image as ImageIcon, UserCircle, Clapperboard, Gauge, MessageSquare, Brain, Sparkles, Layout } from "lucide-react";
import { cn } from "../lib/utils";
import { useProducts } from "../contexts/ProductContext";
import { useAuth } from "../contexts/AuthContext";
import { useState, useRef, useEffect } from "react";

const navigation = [
 { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
 { name: "Brand Position", href: "/dashboard/dna", icon: FileText },
 { name: "Brand Assets", href: "/dashboard/creatives", icon: ImageIcon },
 { name: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
 { name: "Script Studio", href: "/dashboard/scripts", icon: Clapperboard },
 { name: "Schedule", href: "/dashboard/schedule", icon: CalendarClock },
 { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ onClose }: { onClose?: () => void }) {
 const { products, activeProduct, setActiveProductId, addProduct } = useProducts();
 const { user, logout } = useAuth();
 const [isDropdownOpen, setIsDropdownOpen] = useState(false);
 const [isAddingProduct, setIsAddingProduct] = useState(false);
 const [newProductName, setNewProductName] = useState("");
 const dropdownRef = useRef<HTMLDivElement>(null);

 useEffect(() => {
 function handleClickOutside(event: MouseEvent) {
 if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
 setIsDropdownOpen(false);
 setIsAddingProduct(false);
 }
 }
 document.addEventListener("mousedown", handleClickOutside);
 return () => document.removeEventListener("mousedown", handleClickOutside);
 }, []);

 const handleAddProductSubmit = (e: React.FormEvent) => {
 e.preventDefault();
 if (newProductName.trim()) {
 addProduct(newProductName.trim());
 setNewProductName("");
 setIsAddingProduct(false);
 setIsDropdownOpen(false);
 }
 };

 return (
 <div className="tour-sidebar flex h-full w-full flex-col bg-white border-r border-slate-200/80 overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
   {/* Brand Switcher */}
   <div className="px-4 py-5 relative" ref={dropdownRef}>
    <button 
     onClick={() => setIsDropdownOpen(!isDropdownOpen)}
     className="tour-brand-switcher w-full flex items-center gap-2.5 hover:bg-slate-50 p-2 rounded-xl transition-colors"
    >
     <img src="/B2PLOGO.png" alt="B2P" className="h-8 w-8 rounded-lg shrink-0 object-contain" />
     <div className="flex flex-col items-start flex-1 min-w-0">
       <span className="text-sm font-semibold text-slate-800 truncate w-full text-left">{activeProduct?.name || 'Select Brand'}</span>
     </div>
     <ChevronDown className={cn("h-4 w-4 text-slate-400 shrink-0 transition-transform", isDropdownOpen && "rotate-180")} />
    </button>

    {isDropdownOpen && (
    <div className="absolute top-full left-3 right-3 bg-white border border-slate-200 rounded-xl shadow-lg z-50 overflow-hidden mt-1">
    <div className="max-h-48 overflow-y-auto py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
    {products.map(p => (
    <button
    key={p.id}
    onClick={() => {
    setActiveProductId(p.id);
    setIsDropdownOpen(false);
    }}
    className={cn(
    "w-full text-left px-3 py-2 text-sm hover:bg-slate-50 transition-colors",
    activeProduct?.id === p.id ? "text-[#7C3AED] font-semibold bg-[#7C3AED]/5" : "text-slate-600"
    )}
    >
    {p.name}
    </button>
    ))}
    </div>
   <div className="border-t border-slate-100 p-1">
   {isAddingProduct ? (
   <form onSubmit={handleAddProductSubmit} className="p-2">
   <input
   type="text"
   autoFocus
   value={newProductName}
   onChange={(e) => setNewProductName(e.target.value)}
   placeholder="Brand name..."
   className="w-full bg-slate-50 border border-slate-200 text-slate-800 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-[#7C3AED]"
   />
   <div className="flex gap-2">
   <button type="submit" className="flex-1 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-semibold py-1.5 rounded-lg transition-colors">Add</button>
   <button type="button" onClick={() => setIsAddingProduct(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs py-1.5 rounded-lg transition-colors">Cancel</button>
   </div>
   </form>
   ) : (
   <button
   onClick={() => setIsAddingProduct(true)}
   className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-[#7C3AED] font-semibold hover:bg-[#7C3AED]/5 rounded-lg transition-colors"
   >
   <Plus className="h-4 w-4" />
   Add Brand
   </button>
   )}
   </div>
   </div>
   )}
   </div>

   {/* Navigation Links */}
   <nav className="tour-sidebar-nav flex-1 px-3 py-2">
    <div className="space-y-0.5">
    {navigation.map((item) => (
    <NavLink
    key={item.name}
    to={item.href}
    end={item.href === "/dashboard"}
    onClick={onClose}
    className={({ isActive }) =>
    cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-150",
    isActive
    ? "bg-[#7C3AED] text-white"
    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900",
    `tour-nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`
    )
    }
    >
    {({ isActive }) => (
      <>
      <item.icon
      className={cn("h-[18px] w-[18px] shrink-0", 
      isActive ? "text-white" : "text-slate-400"
      )}
      strokeWidth={1.8}
      />
       <span>{item.name}</span>
      </>
    )}
    </NavLink>
    ))}
    </div>

    {/* Separator / Master Control Label */}
    <div className="px-3 py-2 mt-4 border-t border-slate-100/60">
      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest block px-1">Master Controls</span>
    </div>

    {/* Master Founder Link - Styled uniquely and highlighted */}
    <div className="mt-1">
      <NavLink
        to="/dashboard/master-founder"
        onClick={onClose}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] font-semibold transition-all duration-200 relative overflow-hidden group",
            isActive
              ? "bg-gradient-to-r from-violet-600 to-indigo-650 text-white shadow-md shadow-violet-100"
              : "text-violet-700 bg-violet-50/50 hover:bg-violet-50 border border-violet-100 hover:border-violet-200 shadow-sm"
          )
        }
      >
        {({ isActive }) => (
          <>
            {isActive && (
              <span className="absolute inset-0 bg-gradient-to-r from-violet-600 to-indigo-650 opacity-95 animate-pulse" />
            )}
            <Brain
              className={cn("h-[18px] w-[18px] shrink-0 relative z-10 transition-colors duration-250", 
                isActive ? "text-white" : "text-violet-600"
              )}
              strokeWidth={2.2}
            />
            <span className="relative z-10 font-bold flex-1 min-w-0 truncate whitespace-nowrap text-[12px] sm:text-[13px]">Master Founder Agent</span>
            {!isActive && (
              <span className="ml-auto bg-violet-600 text-white text-[8px] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider scale-90 origin-right shrink-0">
                Master
              </span>
            )}
          </>
        )}
      </NavLink>
    </div>

    {/* DNA Visualizer Demo Link */}
    <div className="mt-2">
      <NavLink
        to="/templates"
        onClick={onClose}
        className={({ isActive }) =>
          cn(
            "flex items-center gap-3 rounded-xl px-3 py-2 text-[13px] font-semibold transition-all duration-200 shadow-sm border",
            isActive
              ? "bg-[#7C3AED] text-white border-[#7C3AED]"
              : "text-slate-600 bg-slate-50 border-slate-100 hover:bg-slate-100"
          )
        }
      >
        <Layout
          className="h-[18px] w-[18px] shrink-0 text-slate-400"
          strokeWidth={1.8}
        />
        <span className="font-bold flex-1 min-w-0 truncate text-[12px] sm:text-[13px]">Visual Template Library</span>
      </NavLink>
    </div>
   </nav>

   {/* Bottom: User Profile + Logout */}
   <div className="mt-auto border-t border-slate-100 px-3 py-4">
    <NavLink
     to="/dashboard/profile"
     onClick={onClose}
     className={({ isActive }) =>
      cn(
       "flex items-center gap-2.5 px-2 py-2 rounded-lg transition-all duration-150 mb-1 tour-nav-profile",
       isActive ? "bg-[#7C3AED]/5" : "hover:bg-slate-50"
      )
     }
    >
     {user?.photoURL ? (
      <img src={user.photoURL || undefined} alt={user.displayName || "User"} className="h-9 w-9 rounded-full border border-slate-200 shrink-0 object-cover" referrerPolicy="no-referrer" />
     ) : (
      <div className="h-9 w-9 shrink-0 rounded-full bg-[#7C3AED] flex items-center justify-center text-xs font-bold text-white">
       {user?.email?.[0].toUpperCase() || "U"}
      </div>
     )}
     <div className="flex flex-col min-w-0">
      <span className="text-sm font-semibold text-slate-800 truncate">{user?.displayName || "User"}</span>
      <span className="text-[10px] text-slate-400 truncate">{user?.email}</span>
     </div>
    </NavLink>

    <button
     onClick={logout}
     className="flex items-center gap-3 w-full px-3 py-2 text-slate-500 hover:bg-red-50 hover:text-red-600 rounded-lg transition-all text-[13px] font-medium"
     title="Logout"
    >
     <LogOut className="h-[18px] w-[18px] shrink-0" />
     <span>Logout</span>
    </button>
   </div>
 </div>
 );
}
