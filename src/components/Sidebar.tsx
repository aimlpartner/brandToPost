import { NavLink } from "react-router-dom";
import { LayoutDashboard, Settings, FileText, Megaphone, CalendarClock, ChevronDown, Plus, LogOut, Image as ImageIcon, UserCircle, Clapperboard, Gauge, MessageSquare } from "lucide-react";
import { cn } from "../lib/utils";
import { useProducts } from "../contexts/ProductContext";
import { useAuth } from "../contexts/AuthContext";
import { useState, useRef, useEffect } from "react";

const navigation = [
 { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
 { name: "Brand Position", href: "/dashboard/dna", icon: FileText },
 { name: "Brand Creatives", href: "/dashboard/creatives", icon: ImageIcon },
 { name: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
 { name: "Script Studio", href: "/dashboard/scripts", icon: Clapperboard },
 { name: "Schedule", href: "/dashboard/schedule", icon: CalendarClock },
 { name: "Settings", href: "/dashboard/settings", icon: Settings },
 { name: "Profile", href: "/dashboard/profile", icon: UserCircle },
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
 <div className="tour-sidebar group/sidebar flex h-full w-full md:absolute md:top-0 md:bottom-0 md:left-0 md:h-full md:w-[80px] hover:md:w-[256px] flex-col bg-white/95 md:border-r border-[#7C3AED]/15 shadow-md z-50 transition-[width] duration-300 backdrop-blur-md overflow-x-hidden md:overflow-visible">
 <div className="flex h-20 shrink-0 items-center px-4 md:px-[22px] md:group-hover/sidebar:px-6 transition-all duration-300 border-b border-[#7C3AED]/20">
<div className="flex items-center gap-3 md:gap-0 md:group-hover/sidebar:gap-3">
 <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2PLOGO.png" alt="Logo" className="h-9 w-9 shrink-0 object-contain" />
 <span className="text-xl tracking-tight font-display text-slate-800 font-bold whitespace-nowrap opacity-100 md:opacity-0 group-hover/sidebar:opacity-100 transition-all duration-300 w-auto md:w-0 md:group-hover/sidebar:w-auto overflow-hidden">BrandToPost</span>
 </div>
 </div>
 
 <div className="px-4 py-4 border-b border-[#7C3AED]/20 relative" ref={dropdownRef}>
 <button 
  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
  className="tour-brand-switcher w-full flex items-center justify-center md:group-hover/sidebar:justify-between bg-slate-100/60 hover:bg-[#7C3AED]/10 p-2 md:p-1.5 md:group-hover/sidebar:px-3 md:group-hover/sidebar:py-2.5 rounded-xl border border-[#7C3AED]/15 transition-all duration-300 shadow-sm"
>
  <div className="hidden md:flex md:group-hover/sidebar:hidden h-8 w-8 items-center justify-center bg-gradient-to-br from-[#7C3AED] to-[#2583EB] rounded-lg text-xs font-bold text-white shrink-0">
    {activeProduct?.name?.[0]?.toUpperCase() || 'B'}
  </div>
  <div className="flex flex-col items-start opacity-100 md:opacity-0 group-hover/sidebar:opacity-100 transition-all duration-300 w-full md:w-0 md:group-hover/sidebar:w-full overflow-hidden">
    <span className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-0.5">Active Brand</span>
    <span className="text-sm font-semibold text-slate-800 truncate w-full text-left">{activeProduct?.name || 'Select Product'}</span>
  </div>
  <ChevronDown className="h-4 w-4 text-slate-600 opacity-100 md:opacity-0 md:group-hover/sidebar:opacity-100 transition-all duration-300 w-4 md:w-0 md:group-hover/sidebar:w-4 overflow-hidden shrink-0" />
</button>

 {isDropdownOpen && (
 <div className="absolute top-full left-4 bg-white border border-[#7C3AED]/15 rounded-xl shadow-xl z-50 overflow-hidden w-[220px]">
 <div className="max-h-48 overflow-y-auto overflow-x-hidden py-1 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
 {products.map(p => (
 <button
 key={p.id}
 onClick={() => {
 setActiveProductId(p.id);
 setIsDropdownOpen(false);
 }}
 className={cn(
 "w-full text-left px-3 py-2 text-sm hover:bg-[#7C3AED]/10 transition-colors",
 activeProduct?.id === p.id ? "text-[#10B981] font-semibold bg-[#7C3AED]/5" : "text-slate-600 hover:text-slate-900"
 )}
 >
 {p.name}
 </button>
 ))}
 </div>
 <div className="border-t border-[#7C3AED]/15 p-1">
 {isAddingProduct ? (
 <form onSubmit={handleAddProductSubmit} className="p-2">
 <input
 type="text"
 autoFocus
 value={newProductName}
 onChange={(e) => setNewProductName(e.target.value)}
 placeholder="Brand name..."
 className="w-full bg-slate-50 border border-[#7C3AED]/20 text-slate-800 rounded-lg px-3 py-2 text-sm mb-2 focus:outline-none focus:border-[#7C3AED]"
 />
 <div className="flex gap-2">
 <button type="submit" className="flex-1 text-white text-xs font-semibold py-1.5 rounded-lg transition-colors glass-button glass-button-primary inline-flex items-center justify-center">Add</button>
 <button type="button" onClick={() => setIsAddingProduct(false)} className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs py-1.5 rounded-lg transition-colors">Cancel</button>
 </div>
 </form>
 ) : (
 <button
 onClick={() => setIsAddingProduct(true)}
 className="w-full flex items-center justify-center gap-2 px-3 py-2 text-sm text-[#7C3AED] font-semibold hover:bg-[#7C3AED]/10 rounded-lg transition-colors"
 >
 <Plus className="h-4 w-4" />
 Add Brand
 </button>
 )}
 </div>
 </div>
 )}
 </div>

 <div className="flex flex-1 flex-col overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
 <nav className="tour-sidebar-nav flex-1 space-y-1.5 px-4 py-6">
 {navigation.map((item) => (
 <NavLink
 key={item.name}
 to={item.href}
 onClick={onClose}
 className={({ isActive }) =>
 cn(
 isActive
 ? "bg-[#7C3AED]/10 text-[#7C3AED] shadow-sm border border-[#7C3AED]/30"
 : "text-slate-600 hover:bg-[#7C3AED]/5 hover:text-slate-900 border border-transparent",
 "group items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300", 
 `tour-nav-${item.name.toLowerCase().replace(/\s+/g, "-")}`,
 !["Settings", "Profile"].includes(item.name) ? "hidden md:flex" : "flex"
 )
 }
 >
 <item.icon
 className={cn("mr-3 h-5 w-5 flex-shrink-0 transition-colors", 
 "group-hover:text-[#7C3AED]"
 )}
 aria-hidden="true"
  />
  <span className="whitespace-nowrap opacity-100 md:opacity-0 group-hover/sidebar:opacity-100 transition-all duration-300 w-auto md:w-0 md:group-hover/sidebar:w-auto overflow-hidden">{item.name}</span>
  </NavLink>
 ))}
 </nav>
 </div>

 <div className="border-t border-[#7C3AED]/15 px-3 md:px-4 md:py-4 py-4 mt-auto">
 {/* Tror Assistant Mini-Card */}
 <div className="tour-tror-assistant bg-blue-50/50 border border-[#2583EB]/15 rounded-xl p-1 md:p-2 md:group-hover/sidebar:p-3 mb-4 flex items-center gap-3 md:gap-0 md:group-hover/sidebar:gap-3 relative overflow-hidden group">
 <div className="absolute inset-0 bg-[#2583EB]/5 group-hover:bg-[#2583EB]/10 transition-colors pointer-events-none" />
 <img src="https://darkgray-finch-838850.hostingersite.com/wp-content/uploads/2026/04/B2P-AVATAR.png" alt="Tror" className="w-8 h-8 rounded-full border border-[#2583EB]/50 shrink-0 object-cover aspect-square md:mx-auto md:group-hover/sidebar:mx-0" />
 <div className="flex flex-col whitespace-nowrap opacity-100 md:opacity-0 group-hover/sidebar:opacity-100 transition-all duration-300 w-auto md:w-0 md:group-hover/sidebar:w-auto overflow-hidden">
 <span className="text-xs font-bold text-slate-800 flex items-center gap-1">Tror <span className="w-1.5 h-1.5 bg-[#18F07A] rounded-full inline-block animate-pulse" title="Online" /></span>
 <span className="text-[10px] text-slate-500">Brand Strategist</span>
 </div>
 </div>

 <div className="flex flex-col gap-2">
 <div className="flex items-center gap-3 md:gap-0 md:group-hover/sidebar:gap-3 overflow-hidden py-1 pl-1 md:pl-1.5 md:group-hover/sidebar:pl-1">
 {user?.photoURL ? (
 <img src={user.photoURL || undefined} alt={user.displayName || "User"} className="h-9 w-9 rounded-full border border-[#7C3AED]/50 shrink-0 object-cover aspect-square" referrerPolicy="no-referrer" />
 ) : (
 <div className="h-9 w-9 shrink-0 rounded-full bg-gradient-to-br from-[#7C3AED] to-[#2583EB] flex items-center justify-center text-xs font-bold text-white shadow-sm border border-[#7C3AED]/50 aspect-square">
 {user?.email?.[0].toUpperCase() || "U"}
 </div>
 )}
 <div className="flex flex-col overflow-hidden whitespace-nowrap opacity-100 md:opacity-0 group-hover/sidebar:opacity-100 transition-all duration-300 w-auto md:w-0 md:group-hover/sidebar:w-auto ml-0 md:group-hover/sidebar:ml-0">
 <span className="text-sm font-semibold text-slate-800 truncate">{user?.displayName || "User"}</span>
 <span className="text-xs text-slate-500 truncate">{user?.email}</span>
 </div>
 </div>

 <button
  onClick={logout}
  className="flex items-center w-full px-3 py-2.5 text-slate-500 hover:bg-[#FF7778]/8 hover:text-red-500 border border-transparent rounded-xl transition-all duration-300 group"
  title="Logout"
 >
  <LogOut className="mr-3 h-5 w-5 shrink-0 transition-colors group-hover:text-[#FF7778]" />
  <span className="whitespace-nowrap opacity-100 md:opacity-0 group-hover/sidebar:opacity-100 transition-all duration-300 w-auto md:w-0 md:group-hover/sidebar:w-auto overflow-hidden font-medium text-sm text-left">Logout</span>
 </button>
 </div>
 </div>
 </div>
 );
}
