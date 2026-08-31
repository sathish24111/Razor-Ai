import React from 'react';
import { useRecovery } from '../../context/RecoveryContext';
import { CheckCircle2, AlertTriangle, Sparkles, AlertCircle, X } from 'lucide-react';

export const ToastNotificationStack: React.FC = () => {
  const { notifications, removeToast } = useRecovery();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2 max-w-sm w-full">
      {notifications.map((n) => (
        <div 
          key={n.id}
          className="bg-slate-900 text-white p-4 rounded-xl shadow-2xl border border-slate-700 flex items-start justify-between gap-3 animate-in slide-in-from-bottom-3 duration-200"
        >
          <div className="flex items-start gap-3">
            {n.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />}
            {n.type === 'warning' && <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />}
            {n.type === 'error' && <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />}
            {n.type === 'info' && <Sparkles className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />}
            <div>
              <h5 className="text-xs font-bold text-white">{n.title}</h5>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{n.message}</p>
            </div>
          </div>
          <button 
            onClick={() => removeToast(n.id)}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
