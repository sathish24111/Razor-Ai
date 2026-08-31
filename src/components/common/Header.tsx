import React, { useState } from 'react';
import { 
  Bell, 
  Search, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle,
  Sparkles,
  X
} from 'lucide-react';
import { useRecovery } from '../../context/RecoveryContext';

interface HeaderProps {
  title?: string;
  subtitle?: string;
}

export const Header: React.FC<HeaderProps> = () => {
  const { 
    notifications, 
    removeToast 
  } = useRecovery();

  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="h-16 bg-white/90 backdrop-blur-md border-b border-slate-200/80 flex items-center justify-between px-8 sticky top-0 z-40 shadow-xs font-sans">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 text-slate-400 bg-slate-100/80 px-3.5 py-1.5 rounded-xl border border-slate-200 w-80 focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 transition-all">
          <Search size={16} />
          <input type="text" placeholder="Search payments, customers, Payment IDs..." className="bg-transparent border-none outline-none w-full text-xs text-slate-700 placeholder-slate-400" />
        </div>
      </div>

      <div className="flex items-center gap-4 text-slate-600">
        <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-3 py-1 bg-blue-50 text-blue-700 rounded-lg border border-blue-100">
          <ShieldCheck size={14} className="text-blue-600" /> Razorpay Test Environment
        </div>
        
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="hover:text-blue-600 transition-colors p-2 rounded-xl hover:bg-slate-100 relative"
          >
            <Bell size={18} />
            {notifications.length > 0 && (
              <span className="w-2 h-2 bg-blue-600 rounded-full absolute top-1.5 right-1.5 animate-ping"></span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-xl z-50 overflow-hidden">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-800">Notifications</h4>
                <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500">
                    No new alerts. All systems operational.
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className="p-3 hover:bg-slate-50 flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        {n.type === 'success' && <CheckCircle2 className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />}
                        {n.type === 'warning' && <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />}
                        {n.type === 'info' && <Sparkles className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />}
                        <div>
                          <p className="text-xs font-semibold text-slate-900">{n.title}</p>
                          <p className="text-[11px] text-slate-500">{n.message}</p>
                        </div>
                      </div>
                      <button onClick={() => removeToast(n.id)} className="text-slate-400 hover:text-slate-600">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-slate-200"></div>

        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
            A
          </div>
          <span className="text-xs font-semibold text-slate-700 hidden md:block">Razorpay Merchant</span>
        </div>
      </div>
    </header>
  );
};
