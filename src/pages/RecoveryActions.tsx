import React from 'react';
import { useRecovery } from '../context/RecoveryContext';
import { Header } from '../components/common/Header';
import { Zap, MessageSquare, ShoppingCart, UserCheck, OctagonAlert, ShieldCheck } from 'lucide-react';

export const RecoveryActions: React.FC = () => {
  const { navigateTo } = useRecovery();

  const actions = [
    {
      id: 'ACT-1',
      title: '1. Smart Payment Retry',
      icon: Zap,
      color: 'indigo',
      description: 'Automatically retries payment using optimal acquiring bank routing and 3DS challenge refresh.',
      whenUsed: 'Transient bank timeouts, network gateway errors, 3DS authentication expiry.',
      policyRequirement: 'Max 2 retries per order. Amount ceiling: ₹10,000.',
      status: 'ACTIVE - AUTO',
    },
    {
      id: 'ACT-2',
      title: '2. Send Payment Reminder',
      icon: MessageSquare,
      color: 'emerald',
      description: 'Sends instant WhatsApp & SMS recovery links with 1-click UPI QR code payment options.',
      whenUsed: 'Insufficient funds on credit cards, customer OTP abandonment.',
      policyRequirement: 'Requires customer notification consent. Valid 24 hours.',
      status: 'ACTIVE - AUTO',
    },
    {
      id: 'ACT-3',
      title: '3. Customer Re-Checkout',
      icon: ShoppingCart,
      color: 'amber',
      description: 'Generates a clean, branded payment landing page with item reservation.',
      whenUsed: 'Checkout abandonment after payment errors.',
      policyRequirement: 'Item inventory reservation locked for 3 hours.',
      status: 'ACTIVE - AUTO',
    },
    {
      id: 'ACT-4',
      title: '4. Escalate to Merchant',
      icon: UserCheck,
      color: 'navy',
      description: 'Transfers high-risk or high-value orders directly to merchant support agents.',
      whenUsed: 'Transaction amount > ₹10,000 or multiple card decline flags.',
      policyRequirement: 'Requires manual admin approval button click.',
      status: 'ACTIVE - MANUAL QUEUE',
    },
    {
      id: 'ACT-5',
      title: '5. Stop Recovery',
      icon: OctagonAlert,
      color: 'red',
      description: 'Halts all automated outreach and retries to prevent customer friction or bank blocklisting.',
      whenUsed: 'Max retries exhausted (2/2) or fraud alert triggered.',
      policyRequirement: 'Automatic trigger upon retry limit reaching max threshold.',
      status: 'SAFEGUARD ACTIVE',
    },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header 
        title="Recovery Actions Library" 
        subtitle="Catalog of AI recovery strategies, execution criteria, and policy enforcement specs" 
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {actions.map((act) => {
            const Icon = act.icon;
            return (
              <div 
                key={act.id}
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 flex flex-col justify-between space-y-4 hover:shadow-md transition-all"
              >
                <div>
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Icon className="w-5 h-5" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900">{act.title}</h3>
                    </div>
                    <span className="text-[10px] font-extrabold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                      {act.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed font-medium mb-3">
                    {act.description}
                  </p>

                  <div className="space-y-2 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                      <span className="text-[10px] font-bold uppercase text-slate-400">Trigger Conditions</span>
                      <p className="text-xs text-slate-800 font-semibold mt-0.5">{act.whenUsed}</p>
                    </div>

                    <div className="bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100">
                      <span className="text-[10px] font-bold uppercase text-indigo-500">Policy Safeguards</span>
                      <p className="text-xs text-indigo-900 font-semibold mt-0.5">{act.policyRequirement}</p>
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button 
                    onClick={() => navigateTo('policies')}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Configure Policy Rules</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </main>
    </div>
  );
};
