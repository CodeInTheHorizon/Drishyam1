import { useState, useEffect } from "react";
import { Outlet, useLocation, NavLink } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";
import FloatingChatWidget from "../assistant/FloatingChatWidget";
import ShapeGrid from "../backgrounds/ShapeGrid";
import { recordService } from "../../services/recordService";
import { useAuth } from "../../context/AuthContext";

import {
  RiDashboardLine,
  RiBrainLine,
  RiSettings4Line,
  RiCloseLine,
  RiNodeTree,
  RiTimeLine
} from "react-icons/ri";
import { TbMapSearch } from "react-icons/tb";
import { MdOutlineAdminPanelSettings } from "react-icons/md";
import { HiOutlineDocumentChartBar, HiOutlineDocumentText } from "react-icons/hi2";
import kspLogo from "../../assets/images/ksp-emblem.png";

const menuCategories = [
  {
    category: "OVERVIEW",
    items: [
      { name: "Dashboard", path: "/", icon: RiDashboardLine },
    ],
  },
  {
    category: "ANALYSIS",
    items: [
      { name: "Crime Map", path: "/map", icon: TbMapSearch },
      { name: "Link & Network Analysis", path: "/network-analysis", icon: RiNodeTree },
      { name: "Diurnal Heat & Red-Zones", path: "/spatiotemporal", icon: RiTimeLine },
    ],
  },
  {
    category: "INTELLIGENCE & OPERATIONS",
    items: [
      { name: "AI Insights & Forecast", path: "/insights-forecast", icon: RiBrainLine },
      { name: "Officer Performance", path: "/officers", icon: MdOutlineAdminPanelSettings },
      { name: "Manage Records", path: "/records", icon: HiOutlineDocumentText },
      { name: "Reports", path: "/reports", icon: HiOutlineDocumentChartBar },
    ],
  },
  {
    category: "SYSTEM",
    items: [
      { name: "Settings", path: "/settings", icon: RiSettings4Line },
    ],
  },
];

function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [time, setTime] = useState(() => new Date());
  const location = useLocation();
  const { currentUser, isAdmin } = useAuth();

  // Clock ticker for mobile drawer
  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Format 24-hour time string HH:mm:ss
  const hours = String(time.getHours()).padStart(2, "0");
  const minutes = String(time.getMinutes()).padStart(2, "0");
  const seconds = String(time.getSeconds()).padStart(2, "0");

  const dateFormatted = time.toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

  // Close mobile drawer automatically when navigating to any page
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileMenuOpen]);

  // Fetch remote records from backend on app startup so all pages have data
  useEffect(() => {
    recordService.fetchRemoteRecords().then((records) => {
      console.log(`[Layout] Fetched ${records?.length || 0} records from backend into localStorage.`);
    }).catch((err) => {
      console.warn("[Layout] fetchRemoteRecords failed:", err);
    });
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)] overflow-x-hidden relative">
      {/* Dynamic Animated ShapeGrid Background (React Bits) */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-75">
        <ShapeGrid 
          speed={0.18}
          squareSize={36}
          size={36}
          direction="diagonal"
          borderColor="#1c0c3b"
          hoverFillColor="#222"
          shape="square"
          hoverTrailAmount={5}
        />
      </div>

      <div className="relative z-10">
        <Navbar onToggleMobileMenu={() => setMobileMenuOpen((prev) => !prev)} />

      {/* Mobile & Tablet Navigation Drawer Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Dark Backdrop with fade */}
          <div
            className="fixed inset-0 bg-slate-950/85 backdrop-blur-md transition-opacity duration-300"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Slide-over Drawer Panel */}
          <div className="relative flex-1 max-w-[310px] w-full bg-[#060b18] border-r border-slate-800 flex flex-col z-10 font-inter shadow-2xl animate-in slide-in-from-left duration-200">
            
            {/* Drawer Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/90 bg-[#040711]">
              <div className="flex items-center gap-3">
                <img src={kspLogo} alt="KSP Emblem" className="w-9 h-9 object-contain flex-shrink-0" />
                <div>
                  <h2 className="text-xs font-bold text-white uppercase tracking-wider font-sans leading-tight">
                    Karnataka Police
                  </h2>
                  <p className="text-[10px] font-mono text-cyan-400 font-bold">
                    Command Navigation
                  </p>
                </div>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-700/60 bg-slate-900/60 transition-all cursor-pointer"
                title="Close Menu"
              >
                <RiCloseLine className="text-xl" />
              </button>
            </div>

            {/* Categorized Navigation items */}
            <nav className="flex-1 px-4 py-5 space-y-6 overflow-y-auto custom-scrollbar">
              {menuCategories.map((group) => (
                <div key={group.category} className="space-y-2">
                  {/* Category Header */}
                  <div className="flex items-center gap-2.5 px-3 py-1 text-[10px] font-bold tracking-wider text-cyan-400 uppercase font-mono border-b border-slate-800/60">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 flex-shrink-0" />
                    <span>{group.category}</span>
                  </div>

                  {/* Subcategory Items */}
                  <div className="space-y-1 pl-1">
                    {group.items.map((item) => {
                      const Icon = item.icon;
                      return (
                        <NavLink
                          key={item.path}
                          to={item.path}
                          onClick={() => setMobileMenuOpen(false)}
                          className={({ isActive }) =>
                            `flex h-[42px] items-center gap-3 rounded-lg px-3.5 text-xs font-medium transition-all duration-150 group ${
                              isActive
                                ? "bg-blue-600/25 text-white font-bold border-l-4 border-blue-500 shadow-sm shadow-blue-500/20"
                                : "text-slate-300 hover:bg-slate-800/60 hover:text-white"
                            }`
                          }
                        >
                          {({ isActive }) => (
                            <>
                              <span className="flex items-center justify-center flex-shrink-0 w-5 h-5">
                                <Icon className={`text-lg transition-colors ${isActive ? "text-blue-400" : "text-slate-400 group-hover:text-blue-300"}`} />
                              </span>
                              <span className="truncate tracking-wide">{item.name}</span>
                            </>
                          )}
                        </NavLink>
                      );
                    })}
                  </div>
                </div>
              ))}
            </nav>

            {/* Drawer User Profile Section */}
            {currentUser && (
              <div className="border-t border-slate-800/80 p-3.5 bg-slate-950/60">
                <div className="flex items-center gap-3 bg-slate-900/90 border border-slate-700/70 rounded-xl p-2.5 text-xs">
                  <div className="h-8 w-8 rounded-lg flex items-center justify-center font-bold bg-blue-600 text-white flex-shrink-0">
                    {isAdmin ? "A" : "O"}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-white truncate text-xs">{currentUser.name}</p>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                      {currentUser.rank} • <span className="text-blue-400 font-bold">{currentUser.role}</span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Operational Clock & Status Footer */}
            <div className="border-t border-slate-800/80 px-4 py-3 font-mono text-[10.5px] space-y-1.5 bg-[#040711]">
              <div className="flex items-center justify-between font-semibold tracking-wider">
                <div className="flex items-center gap-2 text-emerald-400">
                  <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE</span>
                  <span className="text-slate-600">|</span>
                  <span className="text-slate-200 tabular-nums font-bold">{hours}:{minutes}:{seconds}</span>
                </div>
                <span className="text-slate-400 text-[9.5px]">{dateFormatted}</span>
              </div>
              <div className="flex items-center justify-between text-[9px] text-slate-500 tracking-wider uppercase border-t border-slate-800/40 pt-1.5 font-bold">
                <span>CCTNS SDK ONLINE</span>
                <span className="text-cyan-400">ZOHO CATALYST</span>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Main App Body */}
      <div className="flex">
        {/* Desktop Sidebar (hidden on mobile, fixed at 280px on desktop) */}
        <Sidebar />

        {/* Dynamic Main Workspace Container */}
        <main className="main-workspace-layout bg-blueprint">
          <div className="main-content-boundary">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Floating AI Copilot Widget */}
      <FloatingChatWidget />
      </div>
    </div>
  );
}

export default Layout;