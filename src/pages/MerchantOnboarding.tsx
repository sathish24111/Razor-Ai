import React, { useState } from 'react';
import { useRecovery } from '../context/RecoveryContext';
import { CheckCircle2, Building, Key, Sliders, Bot, ArrowRight, ArrowLeft, ShieldCheck } from 'lucide-react';

export const MerchantOnboarding: React.FC = () => {
  const { navigateTo, setOnboardingComplete, addToast } = useRecovery();
  const [currentStep, setCurrentStep] = useState(1);

  // Form states
  const [businessName, setBusinessName] = useState('TechGear Store');
  const [website, setWebsite] = useState('https://techgear.io');
  const [category, setCategory] = useState('Consumer Electronics & Hardware');
  const [currency, setCurrency] = useState('INR (₹)');

  const [apiKey, setApiKey] = useState('rzp_test_9k8x7w6v5u4t3s');
  const [secretKey, setSecretKey] = useState('••••••••••••••••••••••••');
  const [isConnected, setIsConnected] = useState(true);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  const [maxRetries, setMaxRetries] = useState(2);
  const [maxAmount, setMaxAmount] = useState(10000);
  const [recoveryWindow, setRecoveryWindow] = useState(24);
  const [approvalAmount, setApprovalAmount] = useState(5000);

  const handleTestConnection = () => {
    setIsTestingConnection(true);
    setTimeout(() => {
      setIsTestingConnection(false);
      setIsConnected(true);
      addToast('Razorpay Connected', 'Test mode API key & webhooks verified successfully.', 'success');
    }, 1200);
  };

  const handleComplete = () => {
    setOnboardingComplete(true);
    addToast('Onboarding Completed', 'RazorRecover AI active for TechGear Store.', 'success');
    navigateTo('dashboard');
  };

  const steps = [
    { number: 1, title: 'Business Info', icon: Building },
    { number: 2, title: 'Razorpay Test Setup', icon: Key },
    { number: 3, title: 'Recovery Policies', icon: Sliders },
    { number: 4, title: 'AI Agent Config', icon: Bot },
    { number: 5, title: 'Complete', icon: CheckCircle2 },
  ];

  return (
    <div className="min-h-screen bg-[#F8FAFC] py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        
        {/* Onboarding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-indigo-600 rounded-2xl text-white shadow-lg mb-3">
            <Bot className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Merchant Onboarding Wizard</h1>
          <p className="text-xs text-slate-500 mt-1">Configure your AI revenue recovery agent and financial policies</p>
        </div>

        {/* Stepper Progress Indicator */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs mb-6">
          <div className="flex items-center justify-between">
            {steps.map((step, idx) => {
              const Icon = step.icon;
              const isDone = currentStep > step.number;
              const isCurrent = currentStep === step.number;
              return (
                <React.Fragment key={step.number}>
                  <div className="flex flex-col items-center">
                    <div className={`
                      w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all
                      ${isDone 
                        ? 'bg-emerald-500 text-white' 
                        : isCurrent 
                          ? 'bg-indigo-600 text-white ring-4 ring-indigo-100' 
                          : 'bg-slate-100 text-slate-400'
                      }
                    `}>
                      {isDone ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-4 h-4" />}
                    </div>
                    <span className={`text-[11px] font-semibold mt-1.5 hidden md:block ${isCurrent ? 'text-indigo-600' : 'text-slate-500'}`}>
                      {step.title}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-2 ${currentStep > step.number ? 'bg-emerald-500' : 'bg-slate-200'}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Step Card Content */}
        <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-xs">
          {currentStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Step 1: Business Details</h3>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Business / Store Name</label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => setBusinessName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Website URL</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Business Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>Consumer Electronics & Hardware</option>
                    <option>SaaS & Digital Subscriptions</option>
                    <option>Fashion & Apparel</option>
                    <option>Services & Consulting</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Default Store Currency</label>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm focus:ring-2 focus:ring-indigo-500"
                  >
                    <option>INR (₹)</option>
                    <option>USD ($)</option>
                    <option>EUR (€)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
                <span>Step 2: Razorpay Test Mode Setup</span>
                <span className="text-xs px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 font-bold rounded-full">Test Mode Active</span>
              </h3>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
                Connect your Razorpay test credentials to simulate automated payment retries and customer recovery checkout flows safely.
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Razorpay Key ID (Test)</label>
                <input
                  type="text"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Key Secret (Test)</label>
                <input
                  type="password"
                  value={secretKey}
                  onChange={(e) => setSecretKey(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm font-mono focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="font-bold text-emerald-900">Webhook Telemetry Listener</p>
                    <p className="text-emerald-700">Listening to payment.failed & checkout.abandoned events</p>
                  </div>
                </div>
                <button
                  onClick={handleTestConnection}
                  disabled={isTestingConnection}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold px-3 py-1.5 rounded text-xs transition-colors"
                >
                  {isTestingConnection ? 'Testing...' : 'Test Connection'}
                </button>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Step 3: Recovery Policy Rules</h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Max Automatic Retries</label>
                  <input
                    type="number"
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Max Auto Recovery Amount (₹)</label>
                  <input
                    type="number"
                    value={maxAmount}
                    onChange={(e) => setMaxAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Recovery Window (Hours)</label>
                  <input
                    type="number"
                    value={recoveryWindow}
                    onChange={(e) => setRecoveryWindow(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Require Approval Above (₹)</label>
                  <input
                    type="number"
                    value={approvalAmount}
                    onChange={(e) => setApprovalAmount(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-lg border border-slate-300 text-sm"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center text-xs font-medium text-slate-700">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600 mr-2" />
                  Enable automatic payment retry on soft bank declines
                </label>
                <label className="flex items-center text-xs font-medium text-slate-700">
                  <input type="checkbox" defaultChecked className="rounded border-slate-300 text-indigo-600 mr-2" />
                  Enable customer SMS & WhatsApp payment reminders
                </label>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Step 4: AI Agent Configuration</h3>

              <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2">
                  <Bot className="w-5 h-5 text-indigo-600" />
                  <span className="font-bold text-indigo-900 text-sm">AI Autonomous Mode</span>
                </div>
                <p className="text-xs text-indigo-700">
                  The AI agent will analyze telemetry, diagnose root causes, and submit valid recommendations to the Policy Engine automatically.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">Confidence Threshold for Auto Execution</label>
                <div className="flex items-center gap-4">
                  <input type="range" min="70" max="98" defaultValue="85" className="flex-1 accent-indigo-600" />
                  <span className="text-sm font-bold text-indigo-600">85% Confidence</span>
                </div>
              </div>
            </div>
          )}

          {currentStep === 5 && (
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-black text-slate-900">Setup Complete & Verified!</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto">
                TechGear Store is connected. RazorRecover AI is now actively monitoring failed payment webhooks and revenue at risk.
              </p>
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="mt-8 pt-6 border-t border-slate-100 flex items-center justify-between">
            {currentStep > 1 && currentStep < 5 ? (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : <div />}

            {currentStep < 5 ? (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold transition-all flex items-center gap-2 shadow-xs"
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleComplete}
                className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <span>Launch Revenue Recovery Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};
