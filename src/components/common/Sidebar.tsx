import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  Receipt, 
  BrainCircuit, 
  Activity, 
  BarChart3, 
  LogOut, 
  X, 
  Menu
} from 'lucide-react';
import { useRecovery } from '../../context/RecoveryContext';
import { PageRoute } from '../../types';

interface NavItem {
  id: PageRoute;
  label: string;
  icon: React.ElementType;
  badge?: string;
}

export const Sidebar: React.FC = () => {
  const { currentPage, navigateTo } = useRecovery();
  const [mobileOpen, setMobileOpen] = useState(false);

  const mainNav: NavItem[] = [
    { id: 'dashboard', label: 'Overview Dashboard', icon: LayoutDashboard },
    { id: 'revenue-at-risk', label: 'Failed Transactions', icon: Receipt },
    { id: 'ai-decision-center', label: 'AI Copilot Engine', icon: BrainCircuit, badge: 'Gemini' },
    { id: 'recovery-actions', label: 'Recovery Workflow', icon: Activity },
    { id: 'analytics', label: 'Revenue Analytics', icon: BarChart3 },
  ];

  const handleNavClick = (page: PageRoute) => {
    navigateTo(page);
    setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <div className="lg:hidden bg-[#071A2F] text-white flex items-center justify-between px-4 py-3 border-b border-slate-800 sticky top-0 z-40">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center font-bold text-white text-base shadow-lg shadow-blue-500/20">
            R
          </div>
          <span className="font-bold text-lg tracking-tight">Recover<span className="text-blue-400 font-black">AI</span></span>
        </div>
        <button 
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-slate-300 hover:text-white rounded-md hover:bg-slate-800 focus:outline-none"
        >
          {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {/* Sidebar Container */}
      <aside className={`
        fixed lg:sticky top-0 left-0 z-50 h-screen w-64 bg-[#071A2F] text-slate-300 flex flex-col justify-between border-r border-slate-800/80 transition-transform duration-200 ease-in-out shadow-2xl
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="flex flex-col flex-1 overflow-y-auto">
          {/* Brand Header */}
          <div className="p-6 flex items-center justify-between border-b border-slate-800/80">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
              <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-xl flex items-center justify-center font-bold text-white text-lg shadow-lg shadow-blue-500/20">
                R
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-black tracking-tight text-white">RecoverAI</span>
                  <span className="text-[9px] bg-blue-500/20 text-blue-400 font-bold px-1.5 py-0.5 rounded border border-blue-500/30">COPILOT</span>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Razorpay Revenue Guard</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3 py-6 space-y-1.5">
            <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Navigation</div>
            {mainNav.map((item) => {
              const Icon = item.icon;
              const isActive = currentPage === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`
                    w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group
                    ${isActive 
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold' 
                      : 'text-slate-400 hover:bg-slate-800/60 hover:text-slate-100'
                    }
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={18} className={isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-400 transition-colors'} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isActive ? 'bg-white/20 text-white' : 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'}`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Environment Status & User Footer */}
        <div className="p-4 border-t border-slate-800/80 space-y-3 bg-[#051323]">
          <div className="p-3 bg-slate-800/40 rounded-xl border border-slate-700/50 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300 font-medium">Razorpay Webhook</span>
            </div>
            <span className="text-[10px] text-emerald-400 font-mono font-bold">ONLINE</span>
          </div>

          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-8 h-8 rounded-full bg-slate-700 text-white flex items-center justify-center font-bold text-xs shrink-0 border border-slate-600">
                A
              </div>
              <div className="text-xs truncate">
                <p className="font-semibold text-white truncate">TechGear Store</p>
                <p className="text-slate-400 text-[10px] truncate">Razorpay Merchant</p>
              </div>
            </div>

            <button
              onClick={() => handleNavClick('login')}
              title="Sign Out"
              className="p-1.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for Mobile */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)} 
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-40 lg:hidden"
        />
      )}
    </>
  );
};
