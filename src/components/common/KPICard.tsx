import React from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  subtitle?: string;
  icon: React.ElementType;
  variant?: 'amber' | 'emerald' | 'indigo' | 'navy' | 'red';
}

export const KPICard: React.FC<KPICardProps> = ({
  title,
  value,
  change,
  isPositive = true,
  subtitle,
  icon: Icon,
  variant = 'indigo',
}) => {
  const iconBgMap = {
    amber: 'bg-amber-50 text-amber-600 border-amber-200',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-200',
    indigo: 'bg-indigo-50 text-indigo-600 border-indigo-200',
    navy: 'bg-slate-100 text-slate-800 border-slate-200',
    red: 'bg-red-50 text-red-600 border-red-200',
  };

  const accentBorderMap = {
    amber: 'border-l-4 border-l-amber-500',
    emerald: 'border-l-4 border-l-emerald-500',
    indigo: 'border-l-4 border-l-indigo-600',
    navy: 'border-l-4 border-l-slate-800',
    red: 'border-l-4 border-l-red-500',
  };

  return (
    <div className={`bg-white rounded-xl p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all ${accentBorderMap[variant]}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</span>
        <div className={`p-2.5 rounded-lg border ${iconBgMap[variant]}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between">
        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{value}</h3>
        {change && (
          <span className={`inline-flex items-center text-xs font-bold px-2 py-0.5 rounded-full ${
            isPositive ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}>
            {isPositive ? <TrendingUp className="w-3 h-3 mr-1" /> : <TrendingDown className="w-3 h-3 mr-1" />}
            {change}
          </span>
        )}
      </div>

      {subtitle && (
        <p className="mt-2 text-xs text-slate-500 font-medium">{subtitle}</p>
      )}
    </div>
  );
};
