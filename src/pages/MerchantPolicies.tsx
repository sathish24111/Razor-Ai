import React, { useState, useEffect } from 'react';
import { useRecovery } from '../context/RecoveryContext';
import { Header } from '../components/common/Header';
import { policyService } from '../services/api';
import { Sliders, ShieldCheck, AlertTriangle, Save, OctagonAlert, CheckCircle2, X } from 'lucide-react';

const SUPPORTED_ACTIONS = [
  { id: 'retry_payment', label: 'Retry Payment Automatically' },
  { id: 'customer_recheckout', label: 'Customer Recheckout Link' },
  { id: 'send_reminder', label: 'Send Customer Payment Reminder' },
  { id: 'escalate', label: 'Escalate to Support' },
  { id: 'stop', label: 'Stop Recovery' },
];

export const MerchantPolicies: React.FC = () => {
  const { policy, updatePolicy, addToast, refreshBackendData } = useRecovery();

  const [maxRetries, setMaxRetries] = useState(policy.maxRetries || 2);
  const [maxAmount, setMaxAmount] = useState(policy.maxAutoRecoveryAmount || 10000);
  const [highValue, setHighValue] = useState(policy.highValueThreshold || 10000);
  const [recoveryWindow, setRecoveryWindow] = useState(policy.recoveryWindowHours || 24);
  const [autoEnabled, setAutoEnabled] = useState(policy.automaticRecoveryEnabled ?? true);
  
  const [selectedActions, setSelectedActions] = useState<string[]>(
    Array.isArray(policy.allowedActions) 
      ? (policy.allowedActions as string[]) 
      : ['retry_payment', 'customer_recheckout', 'send_reminder', 'escalate', 'stop']
  );

  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (policy) {
      setMaxRetries(policy.maxRetries || 2);
      setMaxAmount(policy.maxAutoRecoveryAmount || 10000);
      setHighValue(policy.highValueThreshold || 10000);
      setRecoveryWindow(policy.recoveryWindowHours || 24);
      setAutoEnabled(policy.automaticRecoveryEnabled ?? true);
      if (Array.isArray(policy.allowedActions)) {
        setSelectedActions(policy.allowedActions as string[]);
      }
    }
  }, [policy]);

  const toggleAction = (actionId: string) => {
    setSelectedActions(prev =>
      prev.includes(actionId)
        ? prev.filter(a => a !== actionId)
        : [...prev, actionId]
    );
  };

  const handleSaveClick = (e: React.FormEvent) => {
    e.preventDefault();
    setShowConfirmModal(true);
  };

  const handleConfirmSave = async () => {
    setIsSaving(true);
    try {
      const updatedData = {
        maxRetries: Number(maxRetries),
        maxAutoRecoveryAmount: Number(maxAmount),
        highValueThreshold: Number(highValue),
        recoveryWindowHours: Number(recoveryWindow),
        automaticRecoveryEnabled: Boolean(autoEnabled),
        allowedActions: selectedActions,
      };

      const res = await policyService.updatePolicies(updatedData);
      if (res.success) {
        updatePolicy(res.data);
        await refreshBackendData();
        addToast('Policy Rules Updated', '✓ Merchant policy updated successfully in MySQL.', 'success');
      }
    } catch (err: any) {
      addToast('Update Failed', err.response?.data?.message || 'Failed to update policy.', 'error');
    } finally {
      setIsSaving(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header 
        title="Merchant Policy Engine" 
        subtitle="Configure strict financial safeguards, retry caps, and automated execution thresholds" 
      />

      <main className="p-6 space-y-6 max-w-4xl mx-auto">
        
        {/* Banner */}
        <div className="bg-indigo-950 text-white p-5 rounded-xl border border-indigo-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-indigo-600 rounded-lg text-white">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Financial Safeguard Guardrails</h3>
              <p className="text-xs text-indigo-200">The Policy Engine validates every AI recommendation before execution.</p>
            </div>
          </div>
          <span className={`text-xs font-bold px-3 py-1 rounded-full border ${
            autoEnabled ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'
          }`}>
            {autoEnabled ? 'ENFORCEMENT ACTIVE' : 'AUTOMATED RECOVERY PAUSED'}
          </span>
        </div>

        <form onSubmit={handleSaveClick} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          
          {/* Section 1: Quantitative Limits */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2 uppercase tracking-wider">
              Automatic Recovery Limits
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Maximum Automatic Retries Per Order
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={maxRetries}
                  onChange={(e) => setMaxRetries(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Recommended: 2 retries to prevent card issuer blocklists</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Maximum Transaction Amount for Auto Recovery (₹)
                </label>
                <input
                  type="number"
                  step="500"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Transactions above this ceiling require manual merchant approval</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Recovery Window (Hours)
                </label>
                <input
                  type="number"
                  min="1"
                  max="168"
                  value={recoveryWindow}
                  onChange={(e) => setRecoveryWindow(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">Events older than this window will be blocked</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  High Value Threshold (₹)
                </label>
                <input
                  type="number"
                  step="500"
                  value={highValue}
                  onChange={(e) => setHighValue(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-indigo-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">High-value ceiling requiring merchant authorization</p>
              </div>
            </div>
          </div>

          {/* Section 2: Automated Action Toggles */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
              Allowed Recovery Actions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {SUPPORTED_ACTIONS.map((action) => (
                <label key={action.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-800">{action.label}</span>
                  <input
                    type="checkbox"
                    checked={selectedActions.includes(action.id)}
                    onChange={() => toggleAction(action.id)}
                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Section 3: Danger Zone */}
          <div className="pt-4 border-t border-slate-100">
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <OctagonAlert className="w-5 h-5 text-red-600 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-red-900">Automatic Recovery Engine Toggle</p>
                  <p className="text-[11px] text-red-700">Pauses all automated AI retries. Manual approval will be required for all events.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoEnabled(!autoEnabled)}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold border transition-colors ${
                  autoEnabled ? 'bg-white text-red-600 border-red-300 hover:bg-red-100' : 'bg-red-600 text-white border-red-700'
                }`}
              >
                {autoEnabled ? 'Disable Engine' : 'Re-Enable Engine'}
              </button>
            </div>
          </div>

          {/* Submit Action */}
          <div className="pt-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg text-xs transition-all flex items-center gap-2 shadow-md disabled:opacity-75"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Policy Rules'}</span>
            </button>
          </div>

        </form>

      </main>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4 border border-slate-200 animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-amber-600 font-bold text-sm">
                <AlertTriangle className="w-5 h-5" />
                <span>Confirm Policy Rule Change</span>
              </div>
              <button onClick={() => setShowConfirmModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              You are updating merchant financial safeguards. The Policy Engine will immediately enforce:
            </p>

            <ul className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-xs space-y-1 font-mono text-slate-800">
              <li>&bull; Max Auto Retries: {maxRetries}</li>
              <li>&bull; Auto Recovery Ceiling: ₹{maxAmount.toLocaleString()}</li>
              <li>&bull; High Value Threshold: ₹{highValue.toLocaleString()}</li>
              <li>&bull; Recovery Window: {recoveryWindow} hours</li>
              <li>&bull; Auto Engine: {autoEnabled ? 'ACTIVE' : 'DISABLED'}</li>
            </ul>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfirmModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSave}
                disabled={isSaving}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-md"
              >
                {isSaving ? 'Saving...' : 'Confirm & Save Policy'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
