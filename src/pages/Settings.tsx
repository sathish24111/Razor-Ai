import React, { useState } from 'react';
import { useRecovery } from '../context/RecoveryContext';
import { Header } from '../components/common/Header';
import { Settings as SettingsIcon, Bot, Key, Shield, Bell, Save, CheckCircle2 } from 'lucide-react';

export const Settings: React.FC = () => {
  const { addToast } = useRecovery();
  const [activeTab, setActiveTab] = useState<'agent' | 'razorpay' | 'profile' | 'security'>('agent');

  const [agentEnabled, setAgentEnabled] = useState(true);
  const [confidence, setConfidence] = useState(85);
  const [autoRecovery, setAutoRecovery] = useState(true);

  const [testMode, setTestMode] = useState(true);
  const [apiKey, setApiKey] = useState('rzp_test_9k8x7w6v5u4t3s');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    addToast('Settings Saved', 'Platform configuration successfully updated.', 'success');
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header 
        title="Platform Settings" 
        subtitle="Configure AI Agent parameters, Razorpay API webhooks, and merchant security" 
      />

      <main className="p-6 space-y-6 max-w-5xl mx-auto">
        
        {/* Navigation Tabs */}
        <div className="flex border-b border-slate-200 gap-2">
          {[
            { id: 'agent', label: 'AI Agent Config', icon: Bot },
            { id: 'razorpay', label: 'Razorpay Integration', icon: Key },
            { id: 'profile', label: 'Business Profile', icon: SettingsIcon },
            { id: 'security', label: 'Security & Access', icon: Shield },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2.5 text-xs font-bold flex items-center gap-2 border-b-2 transition-all ${
                  isActive ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab Content */}
        <form onSubmit={handleSave} className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          
          {activeTab === 'agent' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">AI Recovery Agent Settings</h3>
              
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-900">Enable Autonomous AI Agent</p>
                  <p className="text-[11px] text-slate-500">Allow agent to analyze telemetry & submit recovery recommendations</p>
                </div>
                <input
                  type="checkbox"
                  checked={agentEnabled}
                  onChange={(e) => setAgentEnabled(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Confidence Threshold for Auto Execution ({confidence}%)
                </label>
                <input
                  type="range"
                  min="70"
                  max="98"
                  value={confidence}
                  onChange={(e) => setConfidence(Number(e.target.value))}
                  className="w-full accent-indigo-600"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-900">Require Human Approval Above Threshold</p>
                  <p className="text-[11px] text-slate-500">Flags decisions for merchant manual review</p>
                </div>
                <input
                  type="checkbox"
                  checked={autoRecovery}
                  onChange={(e) => setAutoRecovery(e.target.checked)}
                  className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
              </div>
            </div>
          )}

          {activeTab === 'razorpay' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Razorpay Gateway Integration</h3>

              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse"></span>
                  <span className="font-bold text-amber-900">Razorpay Test Mode Active</span>
                </div>
                <span className="font-mono text-amber-700">Sandbox API Connected</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Razorpay Key ID</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-xs font-mono"
                />
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center justify-between">
                <span>Webhook Telemetry: <strong className="font-mono">https://api.razorrecover.ai/v1/webhook</strong></span>
                <span className="font-bold text-emerald-700">✓ CONNECTED</span>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Business Profile</h3>
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Store Name</label>
                  <input type="text" defaultValue="TechGear Store" className="w-full p-2.5 rounded border border-slate-300" />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Email</label>
                  <input type="email" defaultValue="merchant@techgear.io" className="w-full p-2.5 rounded border border-slate-300" />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-2">Security & Audit Compliance</h3>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-1">
                <p className="font-bold text-slate-900">SOC2 Type II Audit Compliance</p>
                <p className="text-slate-500">All payment telemetry data encrypted with AES-256 at rest and TLS 1.3 in transit.</p>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2.5 px-6 rounded-lg text-xs shadow-xs flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>

        </form>

      </main>
    </div>
  );
};
