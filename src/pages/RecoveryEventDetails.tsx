import React from 'react';
import { useRecovery } from '../context/RecoveryContext';
import { Header } from '../components/common/Header';
import { StatusBadge } from '../components/common/StatusBadge';
import { 
  Bot, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  ArrowLeft, 
  Check, 
  X, 
  AlertTriangle,
  PlayCircle,
  Shield,
  Zap,
  Clock,
  UserCheck
} from 'lucide-react';

export const RecoveryEventDetails: React.FC = () => {
  const { selectedEvent, approveRecovery, rejectRecovery, escalateRecovery, navigateTo, policy } = useRecovery();

  if (!selectedEvent) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col justify-center items-center p-6">
        <p className="text-slate-500 mb-4">No event selected</p>
        <button onClick={() => navigateTo('dashboard')} className="px-4 py-2 bg-indigo-600 text-white font-bold rounded-lg text-xs">
          Return to Dashboard
        </button>
      </div>
    );
  }

  const maxAutoAmount = policy?.maxAutoRecoveryAmount || 10000;
  const maxRetries = policy?.maxRetries || 2;
  const isAmountValid = selectedEvent.amount <= maxAutoAmount;
  const isAttemptsValid = selectedEvent.attempts < maxRetries;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header 
        title={`Recovery Event Details: ${selectedEvent.orderId}`} 
        subtitle="Complete AI diagnosis, policy engine validation, and execution controls" 
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* Back Link & Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => navigateTo('revenue-at-risk')}
            className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Revenue at Risk</span>
          </button>

          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold text-slate-500">Event Status:</span>
            <StatusBadge status={selectedEvent.status} />
          </div>
        </div>

        {/* Order Information & Revenue Status Overview Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Order Identifier</span>
            <h3 className="text-xl font-extrabold text-indigo-600 font-mono mt-0.5">{selectedEvent.orderId}</h3>
            <p className="text-xs text-slate-500 mt-1">{selectedEvent.createdAt}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Customer Profile</span>
            <h3 className="text-base font-bold text-slate-900 mt-0.5">{selectedEvent.customerName}</h3>
            <p className="text-xs text-slate-500">{selectedEvent.customerEmail}</p>
            <p className="text-xs font-semibold text-indigo-600 mt-1">{selectedEvent.productName}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Revenue at Risk</span>
            <h3 className="text-2xl font-black text-amber-600 mt-0.5">₹{selectedEvent.amount.toLocaleString()}</h3>
            <p className="text-xs text-slate-500">Currency: {selectedEvent.currency}</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Revenue Recovered</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">
              ₹{selectedEvent.revenueRecovered.toLocaleString()}
            </h3>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Attempts: {selectedEvent.attempts}/{maxRetries}
            </p>
          </div>
        </div>

        {/* Complete Lifecycle Stepper Timeline */}
        <div className="bg-slate-900 text-white rounded-xl p-6 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Complete Recovery Lifecycle Audit Timeline
            </h3>
            <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
              Policy Engine Guardrails Enforced
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-6 gap-3 py-2 text-xs">
            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase">1. Failure Logged</span>
              <p className="font-bold text-white mt-1">Payment Failed</p>
              <p className="text-[11px] text-amber-400 mt-0.5">{selectedEvent.failureReason}</p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase">2. AI Diagnosis</span>
              <p className="font-bold text-white mt-1">Telemetry Analyzed</p>
              <p className="text-[11px] text-indigo-300 mt-0.5">{selectedEvent.aiConfidence}% Confidence</p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase">3. Policy Check</span>
              <p className="font-bold text-white mt-1">Rules Validated</p>
              <p className="text-[11px] text-emerald-400 mt-0.5">{isAmountValid ? 'Ceiling OK' : 'Over Ceiling'}</p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase">4. Approval State</span>
              <p className="font-bold text-white mt-1">{isAmountValid ? 'ALLOWED' : 'APPROVAL REQUIRED'}</p>
              <p className="text-[11px] text-slate-300 mt-0.5">{isAmountValid ? 'Auto Eligible' : 'Merchant Review'}</p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase">5. Execution</span>
              <p className="font-bold text-white mt-1">Razorpay TEST Mode</p>
              <p className="text-[11px] text-slate-300 mt-0.5">Attempt #{selectedEvent.attempts + 1}</p>
            </div>

            <div className="bg-slate-800/80 p-3 rounded-lg border border-slate-700">
              <span className="text-[10px] font-bold text-slate-400 uppercase">6. Final Status</span>
              <p className="font-bold text-emerald-400 mt-1">{selectedEvent.status}</p>
              <p className="text-[11px] text-slate-300 mt-0.5">Audit Logged</p>
            </div>
          </div>
        </div>

        {/* AI Diagnosis Card & Policy Validation Card Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* AI Diagnosis Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">AI Telemetry Diagnosis</h3>
                  <p className="text-xs text-slate-500">Root cause detection & machine reasoning</p>
                </div>
              </div>
              <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 border border-indigo-200 font-extrabold text-xs rounded-full">
                {selectedEvent.aiConfidence}% Confidence
              </span>
            </div>

            <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <span className="text-[10px] font-bold uppercase text-slate-500">Diagnosed Problem</span>
              <p className="text-sm font-bold text-slate-900 mt-0.5">{selectedEvent.failureReason}</p>
            </div>

            <div>
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">AI Reasoning Signals:</span>
              <ul className="mt-2 space-y-2 text-xs text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  Customer has 5 previous successful order payments.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  No recent failed attempts registered in last 30 days.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-500 font-bold">✓</span>
                  Transaction amount (₹{selectedEvent.amount.toLocaleString()}) checked against policy ceiling.
                </li>
              </ul>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <span className="text-[10px] font-bold uppercase text-slate-400">AI Recommended Action</span>
              <p className="text-base font-extrabold text-indigo-600 mt-0.5">{selectedEvent.aiRecommendation}</p>
              <p className="text-xs text-slate-500 mt-1 italic">"{selectedEvent.aiReasoning}"</p>
            </div>
          </div>

          {/* Policy Validation Card */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Policy Engine Check</h3>
                  <p className="text-xs text-slate-500">Financial rule validation checklist</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 font-bold text-xs rounded-full border ${
                isAmountValid && isAttemptsValid ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}>
                {isAmountValid && isAttemptsValid ? 'ALLOWED' : 'APPROVAL REQUIRED'}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className="font-semibold text-slate-900">Maximum Automatic Retries Cap</p>
                  <p className="text-slate-500">Current: {selectedEvent.attempts} / Limit: {maxRetries}</p>
                </div>
                {isAttemptsValid ? (
                  <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                    <Check className="w-4 h-4" /> PASSED
                  </span>
                ) : (
                  <span className="text-red-600 font-extrabold flex items-center gap-1">
                    <X className="w-4 h-4" /> EXCEEDED
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className="font-semibold text-slate-900">Transaction Amount Limit Check</p>
                  <p className="text-slate-500">Amount: ₹{selectedEvent.amount.toLocaleString()} / Ceiling: ₹{maxAutoAmount.toLocaleString()}</p>
                </div>
                {isAmountValid ? (
                  <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                    <Check className="w-4 h-4" /> PASSED
                  </span>
                ) : (
                  <span className="text-amber-600 font-extrabold flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" /> REQUIRES APPROVAL
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className="font-semibold text-slate-900">Recovery Window Active</p>
                  <p className="text-slate-500">Max window: {policy?.recoveryWindowHours || 24}h</p>
                </div>
                <span className="text-emerald-600 font-extrabold flex items-center gap-1">
                  <Check className="w-4 h-4" /> PASSED
                </span>
              </div>
            </div>

            {/* Final Policy Engine Verdict */}
            <div className={`p-4 rounded-xl border flex items-center gap-3 ${
              isAmountValid && isAttemptsValid ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'
            }`}>
              {isAmountValid && isAttemptsValid ? (
                <>
                  <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
                  <div>
                    <p className="font-bold text-emerald-900 text-xs uppercase">Policy Engine Verdict</p>
                    <p className="text-xs text-emerald-700 font-semibold">✓ TRANSACTION COMPLIES WITH ALL POLICY RULES</p>
                  </div>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-6 h-6 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-bold text-amber-900 text-xs uppercase">Policy Engine Verdict</p>
                    <p className="text-xs text-amber-700 font-semibold">⚠ EXCEEDS AUTO RECOVERY CEILING — MERCHANT APPROVAL REQUIRED</p>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>

        {/* Action Controls Bar */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h4 className="text-sm font-bold text-slate-900">Execute Financial Safeguard Action</h4>
            <p className="text-xs text-slate-500">Approve AI recommendation to launch customer checkout recovery flow</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <button
              onClick={() => escalateRecovery(selectedEvent.id)}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-all"
            >
              Escalate to Support
            </button>

            <button
              onClick={() => rejectRecovery(selectedEvent.id)}
              className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 font-bold rounded-lg text-xs transition-all"
            >
              Stop Recovery
            </button>

            <button
              onClick={() => approveRecovery(selectedEvent.id)}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg text-xs transition-all flex items-center gap-2 shadow-md shadow-indigo-900/20"
            >
              <Zap className="w-4 h-4 text-white" />
              <span>Approve & Launch Recovery</span>
            </button>
          </div>
        </div>

      </main>
    </div>
  );
};
