import { NavLink } from "react-router-dom";
import { LayoutDashboard, Settings, FileText, Megaphone, CalendarClock, ChevronDown, Plus, LogOut, Image as ImageIcon } from "lucide-react";
import { cn } from "../lib/utils";
import { useProducts } from "../contexts/ProductContext";
import { useAuth } from "../contexts/AuthContext";
import { useState, useRef, useEffect } from "react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Brand Position", href: "/dashboard/dna", icon: FileText },
  { name: "Brand Creatives", href: "/dashboard/creatives", icon: ImageIcon },
  { name: "Campaigns", href: "/dashboard/campaigns", icon: Megaphone },
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
    <div className="flex h-full w-full md:w-64 flex-col glass-panel overflow-hidden">
      <div className="hidden md:flex h-16 shrink-0 items-center px-6 border-b border-white/20">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-[#ff6347] to-[#ffe066] flex items-center justify-center shadow-sm">
            <Megaphone className="h-4 w-4 text-[#111827]" />
          </div>
          <span className="text-xl tracking-tight font-display text-[#111827]">
            <span className="font-extrabold">Brand</span>
            <span className="font-light text-[#ff6347]">ToPost</span>
          </span>
        </div>
      </div>
      
      <div className="px-4 py-4 border-b border-white/20 relative" ref={dropdownRef}>
        <button 
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full flex items-center justify-between bg-white/30 hover:bg-white/40 px-3 py-2 rounded-xl border border-white/40 transition-all duration-300 shadow-sm"
        >
          <div className="flex flex-col items-start truncate">
            <span className="text-xs text-[#111827]/60 font-medium">Active Product</span>
            <span className="text-sm font-semibold text-[#111827] truncate w-full text-left">{activeProduct?.name || 'Select Product'}</span>
          </div>
          <ChevronDown className="h-4 w-4 text-[#111827]/60" />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full left-4 right-4 mt-2 bg-white/80 backdrop-blur-xl border border-white/50 rounded-xl shadow-xl z-50 overflow-hidden">
            <div className="max-h-48 overflow-y-auto py-1">
              {products.map(p => (
                <button
                  key={p.id}
                  onClick={() => {
                    setActiveProductId(p.id);
                    setIsDropdownOpen(false);
                  }}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm hover:bg-black/5 transition-colors",
                    activeProduct?.id === p.id ? "text-[#ff6347] font-semibold bg-black/5" : "text-[#111827]"
                  )}
                >
                  {p.name}
                </button>
              ))}
            </div>
            <div className="border-t border-black/5 p-1">
              {isAddingProduct ? (
                <form onSubmit={handleAddProductSubmit} className="p-2">
                  <input
                    type="text"
                    autoFocus
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="Product name..."
                    className="glass-input px-3 py-2 text-sm mb-2"
                  />
                  <div className="flex gap-2">
                    <button type="submit" className="flex-1 glass-button-primary text-xs py-1.5 rounded-lg">Add</button>
                    <button type="button" onClick={() => setIsAddingProduct(false)} className="flex-1 glass-button text-xs py-1.5 rounded-lg">Cancel</button>
                  </div>
                </form>
              ) : (
                <button
                  onClick={() => setIsAddingProduct(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[#111827]/70 hover:text-[#111827] hover:bg-black/5 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Add Product
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col overflow-y-auto">
        <nav className="flex-1 space-y-1.5 px-4 py-6">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              onClick={onClose}
              className={({ isActive }) =>
                cn(
                  isActive
                    ? "bg-white/40 text-[#111827] shadow-sm border border-white/50"
                    : "text-[#111827]/70 hover:bg-white/20 hover:text-[#111827] border border-transparent",
                  "group flex items-center rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-300"
                )
              }
            >
              <item.icon
                className={cn("mr-3 h-5 w-5 flex-shrink-0 transition-colors", 
                  "group-hover:text-[#ff6347]"
                )}
                aria-hidden="true"
              />
              {item.name}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="border-t border-white/20 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 overflow-hidden">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user.displayName || "User"} className="h-9 w-9 rounded-full bg-white/50 shadow-sm border border-white/50" referrerPolicy="no-referrer" />
            ) : (
              <div className="h-9 w-9 rounded-full bg-gradient-to-br from-[#ff6347] to-[#ffe066] flex items-center justify-center text-xs font-bold text-[#111827] shadow-sm border border-white/50">
                {user?.email?.[0].toUpperCase() || "U"}
              </div>
            )}
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-semibold text-[#111827] truncate">{user?.displayName || "User"}</span>
              <span className="text-xs text-[#111827]/60 truncate">{user?.email}</span>
            </div>
          </div>
          <button
            onClick={logout}
            className="p-2 text-[#111827]/50 hover:text-[#111827] hover:bg-white/30 rounded-xl transition-all duration-300"
            title="Logout"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
