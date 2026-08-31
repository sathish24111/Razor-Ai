import React from 'react';

interface StatusBadgeProps {
  status: string;
  tooltip?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, tooltip }) => {
  const normalized = status.toLowerCase();

  const defaultTooltips: Record<string, string> = {
    recovered: 'Payment successfully captured via Razorpay TEST API',
    allowed: 'Transaction complies with all 7 merchant policy rules',
    'approval required': 'Amount exceeds auto-recovery limit (₹10,000). Requires merchant admin click.',
    blocked: 'Action blocked by policy rules (e.g. max retries reached or window expired)',
    recoverable: 'Soft failure eligible for automated AI retry',
    escalated: 'Requires manual merchant support review',
  };

  const titleText = tooltip || defaultTooltips[normalized] || status;

  if (['recovered', 'allowed', 'healthy', 'success', 'paid', 'completed', 'active'].includes(normalized)) {
    return (
      <span title={titleText} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 cursor-help">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-1.5"></span>
        {status}
      </span>
    );
  }

  if (['pending', 'recoverable', 'medium risk', 'approval required', 'scanning', 'in progress'].includes(normalized)) {
    return (
      <span title={titleText} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 cursor-help">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mr-1.5"></span>
        {status}
      </span>
    );
  }

  if (['failed', 'escalated', 'blocked', 'high risk', 'unsuccessful', 'rejected'].includes(normalized)) {
    return (
      <span title={titleText} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 cursor-help">
        <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-1.5"></span>
        {status}
      </span>
    );
  }

  return (
    <span title={titleText} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 cursor-help">
      <span className="w-1.5 h-1.5 rounded-full bg-slate-400 mr-1.5"></span>
      {status}
    </span>
  );
};
