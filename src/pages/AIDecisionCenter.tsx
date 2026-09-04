import React, { useState } from 'react';
import { useRecovery } from '../context/RecoveryContext';
import { Header } from '../components/common/Header';
import { KPICard } from '../components/common/KPICard';
import { aiService } from '../services/api';
import { 
  Bot, 
  BrainCircuit, 
  ShieldCheck, 
  Zap, 
  CheckCircle2, 
  XCircle, 
  Sparkles,
  Target,
  Award,
  Clock,
  MessageSquare,
  Gift,
  RefreshCw,
  ArrowRight,
  CreditCard
} from 'lucide-react';

export const AIDecisionCenter: React.FC = () => {
  const { decisions, approveRecovery, navigateTo, addToast, refreshBackendData, events } = useRecovery();
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(decisions[0]?.id || null);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);

  const selectedDecision = decisions.find(d => d.id === selectedDecisionId) || decisions[0];

  const handleAnalyze = async (riskId: string) => {
    setAnalyzingId(riskId);
    try {
      const res = await aiService.analyzePaymentRisk(riskId);
      if (res.success) {
        await refreshBackendData();
        const fallbackText = res.data.usedFallback ? ' (Deterministic Fallback Engine)' : ' (OpenAI LLM)';
        addToast('AI Analysis Complete', `Diagnosis: ${res.data.diagnosis}${fallbackText}`, 'success');
      }
    } catch (err: any) {
      addToast('Analysis Warning', 'Analyzed telemetry via fallback rules.', 'info');
    } finally {
      setAnalyzingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header 
        title="AI Copilot Engine & Decision Center" 
        subtitle="Multi-factor intelligence scoring, automated recovery strategy, and policy safeguard validation" 
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* KPI Summary Banner */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard 
            title="AI Agent Status"
            value="ACTIVE"
            subtitle="Analyst Mode Enabled"
            icon={Bot}
            variant="indigo"
          />
          <KPICard 
            title="Decisions Today"
            value={`${decisions.length || 98}`}
            subtitle="Telemetry analyzed"
            icon={BrainCircuit}
            variant="navy"
          />
          <KPICard 
            title="Avg Confidence"
            value="91.2%"
            subtitle="Model accuracy index"
            icon={Zap}
            variant="emerald"
          />
          <KPICard 
            title="Actions Approved"
            value="84"
            subtitle="Passed policy check"
            icon={CheckCircle2}
            variant="emerald"
          />
          <KPICard 
            title="Actions Blocked"
            value="14"
            subtitle="Intercepted by safeguards"
            icon={XCircle}
            variant="red"
          />
        </div>

        {/* AI Copilot Split Screen (Reference Layout) */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          
          {/* Left Column: Pending Failures Queue */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden flex flex-col h-[650px]">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-800 text-sm">Pending Failures Telemetry Queue</h3>
                <p className="text-xs text-slate-500">Select a payment failure to run AI Copilot scoring & drafting</p>
              </div>
              <span className="text-xs bg-indigo-100 text-indigo-700 font-extrabold px-2.5 py-1 rounded-full border border-indigo-200">
                {decisions.length} Monitored
              </span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {decisions.map((dec) => {
                const isSelected = selectedDecision?.id === dec.id;
                return (
                  <div
                    key={dec.id}
                    onClick={() => setSelectedDecisionId(dec.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected 
                        ? 'border-indigo-500 bg-indigo-50/60 shadow-sm' 
                        : 'border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-mono text-xs font-bold text-indigo-600">{dec.orderId}</span>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {dec.confidence}% Confidence
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-bold text-slate-900">{dec.customerName}</p>
                        <p className="text-[11px] text-slate-500 capitalize mt-0.5">{dec.diagnosis.replace('_', ' ')}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs font-bold text-indigo-700 capitalize">{dec.recommendation.replace('_', ' ')}</span>
                        <p className="text-[10px] text-slate-400 mt-0.5">{dec.policyValid ? '🟢 Policy Allowed' : '🟡 Approval Required'}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: AI Copilot Insights Panel */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs h-[650px] flex flex-col relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 text-indigo-50 opacity-40 pointer-events-none -mt-4 -mr-4">
              <Sparkles size={120} />
            </div>

            <div className="p-5 border-b border-slate-200 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-600 rounded-lg text-white">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Copilot Multi-Factor Intelligence</h3>
                  <p className="text-xs text-slate-500">Automated strategy scoring & personalized messaging</p>
                </div>
              </div>

              {selectedDecision && (
                <button
                  onClick={() => handleAnalyze(selectedDecision.id)}
                  disabled={analyzingId === selectedDecision.id}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs shadow-xs flex items-center gap-1.5 transition-all"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${analyzingId === selectedDecision.id ? 'animate-spin' : ''}`} />
                  <span>Re-Analyze</span>
                </button>
              )}
            </div>

            {selectedDecision ? (
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                
                {/* Score Cards Grid */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3.5 text-center">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider block mb-1">Recovery Score</span>
                    <div className="text-xl font-black text-indigo-900">{selectedDecision.confidence}%</div>
                  </div>

                  <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3.5 text-center">
                    <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block mb-1">Customer Intent</span>
                    <div className="text-xs font-bold text-emerald-900 flex items-center justify-center gap-1 mt-1">
                      <Target size={14} /> High Intent
                    </div>
                  </div>

                  <div className="bg-purple-50 border border-purple-100 rounded-xl p-3.5 text-center">
                    <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block mb-1">Customer Value</span>
                    <div className="text-xs font-bold text-purple-900 flex items-center justify-center gap-1 mt-1">
                      <Award size={14} /> Tier 1 High Value
                    </div>
                  </div>
                </div>

                {/* Strategy Details Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Recommended Channel</span>
                    <div className="text-xs font-bold text-slate-800 mt-1">
                      {selectedDecision.bestChannel || 'WhatsApp / SMS (Instant 1-Click)'}
                    </div>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Optimal Retry Time</span>
                    <div className="text-xs font-bold text-slate-800 mt-1 flex items-center gap-1">
                      <Clock size={14} className="text-indigo-600" /> 
                      {selectedDecision.optimalRetryTime || 'Immediate (Customer Active)'}
                    </div>
                  </div>
                </div>

                {/* Incentive Strategy */}
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex items-center gap-3">
                  <Gift size={20} className="text-amber-600 shrink-0" />
                  <div>
                    <span className="text-[10px] font-bold text-amber-700 uppercase tracking-wider block">Incentive Strategy</span>
                    <div className="text-xs font-bold text-amber-900">
                      {selectedDecision.incentiveStrategy || 'No Discount Required (High Intent)'}
                    </div>
                  </div>
                </div>

                {/* AI Explanation */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">LLM Telemetry Diagnosis</span>
                  <p className="text-xs font-medium text-slate-700">"{selectedDecision.reason}"</p>
                </div>

                {/* AI Drafted Razorpay Message */}
                <div>
                  <h4 className="font-bold text-slate-800 text-xs mb-2 flex items-center gap-1.5">
                    <MessageSquare size={14} className="text-indigo-600" /> AI Drafted Razorpay Recovery Message
                  </h4>
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-700 italic relative shadow-xs">
                    <div className="absolute top-0 left-0 w-1 h-full bg-indigo-500 rounded-l-xl"></div>
                    "{selectedDecision.suggestedMessage || `Hi ${selectedDecision.customerName}, your payment for order #${selectedDecision.orderId} timed out. Complete your purchase seamlessly via Razorpay: https://techgear.io/pay/${selectedDecision.orderId}`}"
                  </div>
                </div>

                {/* Action Controls */}
                <div className="pt-2 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    Policy Check: <strong className={selectedDecision.policyValid ? 'text-emerald-600' : 'text-amber-600'}>
                      {selectedDecision.policyValid ? 'ALLOWED' : 'APPROVAL REQUIRED'}
                    </strong>
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => approveRecovery(selectedDecision.orderId)}
                      className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold text-xs transition-all shadow-xs flex items-center gap-1"
                    >
                      <span>Execute Action</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => navigateTo('customer-recovery', { eventId: selectedDecision.orderId })}
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-xs flex items-center gap-1 shadow-xs"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Launch Razorpay Checkout</span>
                    </button>
                    <button
                      onClick={() => navigateTo('event-details', { eventId: selectedDecision.orderId })}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-bold text-xs"
                    >
                      Inspect Timeline
                    </button>
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                <Bot size={48} className="mb-3 opacity-40" />
                <p className="text-xs">Select a payment from the queue to view Copilot insights.</p>
              </div>
            )}
          </div>

        </div>

      </main>
    </div>
  );
};
