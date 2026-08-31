import React, { useState } from 'react';
import { useRecovery } from '../context/RecoveryContext';
import { Header } from '../components/common/Header';
import { simulationService } from '../services/api';
import { 
  Bot, 
  PlayCircle, 
  CheckCircle2, 
  Sparkles, 
  Layers,
  RefreshCw
} from 'lucide-react';

export const SimulationCenter: React.FC = () => {
  const { runSimulation, isSimulating, simulationStep, navigateTo, addToast, refreshBackendData } = useRecovery();
  const [batchCount, setBatchCount] = useState(10);
  const [isBatchRunning, setIsBatchRunning] = useState(false);

  const steps = [
    { step: 1, title: 'EVENT DETECTED', desc: 'Webhook listener captured payment failure telemetry (ORD-1031)' },
    { step: 2, title: 'ANALYZING', desc: 'Parsing transaction headers, 3DS error code, customer payment history' },
    { step: 3, title: 'AI DIAGNOSIS', desc: 'Model classified failure as soft OTP authentication timeout (94% confidence)' },
    { step: 4, title: 'CHECKING POLICY', desc: 'Policy Engine validated retry against ₹10,000 cap & retry limit (0/2)' },
    { step: 5, title: 'RECOVERY ACTION', desc: 'Initiated Smart Retry flow with 1-click UPI backup link' },
    { step: 6, title: 'RAZORPAY TEST PAYMENT', desc: 'Executing API transaction call to Razorpay Test Gateway' },
    { step: 7, title: 'VERIFYING RESULT', desc: 'Captured payment.authorized webhook signature' },
    { step: 8, title: 'REVENUE RECOVERED', desc: '₹4,999 credited to merchant balance & audit trail logged' },
  ];

  const handleRunBatchSimulation = async () => {
    setIsBatchRunning(true);
    try {
      const res = await simulationService.simulateBatch(batchCount);
      if (res.success) {
        await refreshBackendData();
        addToast('Batch Simulation Executed', `✓ Generated ${res.created} payment failure scenarios in MySQL.`, 'success');
      }
    } catch (err: any) {
      addToast('Batch Failed', err.response?.data?.message || 'Simulation mode disabled.', 'error');
    } finally {
      setIsBatchRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header 
        title="Recovery Simulation Center" 
        subtitle="Real-time interactive AI agent sandbox & payment failure scenario generator" 
      />

      <main className="p-6 space-y-6 max-w-5xl mx-auto">
        
        {/* Banner 1: Interactive Stepper */}
        <div className="bg-[#0B1220] text-white p-6 rounded-xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-black tracking-tight text-white">Live AI Agent Simulation Room</h3>
            </div>
            <p className="text-xs text-slate-300 max-w-xl">
              Simulate end-to-end payment failures, AI telemetry diagnosis, policy engine validation, and Razorpay test payment recovery in real-time.
            </p>
          </div>

          <button
            onClick={runSimulation}
            disabled={isSimulating}
            className="w-full md:w-auto bg-[#4F46E5] hover:bg-indigo-700 text-white font-extrabold px-8 py-4 rounded-xl text-sm transition-all flex items-center justify-center gap-3 shadow-xl shadow-indigo-950/50 disabled:opacity-75 shrink-0"
          >
            <PlayCircle className={`w-5 h-5 ${isSimulating ? 'animate-spin' : ''}`} />
            <span>{isSimulating ? 'Executing Agent Workflow...' : 'Run Single Simulation'}</span>
          </button>
        </div>

        {/* Banner 2: Batch Generator Control */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl">
              <Layers className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900">Batch Payment Failure Generator</h4>
              <p className="text-xs text-slate-500">Generates deterministic telemetry scenarios (Insufficient Funds, 3DS Timeout, Gateway Error)</p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold text-slate-600">Count:</label>
              <select 
                value={batchCount} 
                onChange={(e) => setBatchCount(Number(e.target.value))}
                className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-bold bg-white text-slate-900"
              >
                <option value={5}>5 Events</option>
                <option value={10}>10 Events</option>
                <option value={20}>20 Events</option>
                <option value={30}>30 Events</option>
              </select>
            </div>

            <button
              onClick={handleRunBatchSimulation}
              disabled={isBatchRunning}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-lg text-xs transition-all flex items-center gap-2 shadow-sm disabled:opacity-75"
            >
              <RefreshCw className={`w-4 h-4 ${isBatchRunning ? 'animate-spin' : ''}`} />
              <span>{isBatchRunning ? 'Generating Batch...' : 'Generate Batch Scenarios'}</span>
            </button>
          </div>
        </div>

        {/* Real-time Stepper Diagram */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-600" />
              Real-Time AI Execution Stepper
            </h4>
            <span className="text-xs font-mono font-semibold text-slate-500">
              {isSimulating ? `Step ${simulationStep} of 8 Running...` : simulationStep === 8 ? 'Completed 8/8' : 'Ready'}
            </span>
          </div>

          <div className="space-y-3">
            {steps.map((s) => {
              const isPassed = simulationStep > s.step || simulationStep === 8;
              const isCurrent = simulationStep === s.step && isSimulating;

              return (
                <div 
                  key={s.step}
                  className={`p-4 rounded-xl border transition-all flex items-start gap-4 ${
                    isPassed 
                      ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950' :
                    isCurrent 
                      ? 'bg-indigo-50 border-indigo-300 text-indigo-950 ring-2 ring-indigo-200 animate-pulse' :
                      'bg-slate-50 border-slate-200 text-slate-400 opacity-60'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs shrink-0 ${
                    isPassed ? 'bg-emerald-500 text-white' :
                    isCurrent ? 'bg-indigo-600 text-white' :
                    'bg-slate-200 text-slate-500'
                  }`}>
                    {isPassed ? '✓' : s.step}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-black tracking-wider uppercase">{s.title}</p>
                      {isCurrent && (
                        <span className="text-[10px] font-bold bg-indigo-600 text-white px-2 py-0.5 rounded">PROCESSING</span>
                      )}
                      {isPassed && (
                        <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded">VERIFIED</span>
                      )}
                    </div>
                    <p className="text-xs mt-0.5 font-medium">{s.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Simulation Outcome Card */}
          {simulationStep === 8 && !isSimulating && (
            <div className="bg-emerald-500 text-white p-6 rounded-xl shadow-lg space-y-4 animate-in fade-in duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                  <div>
                    <h3 className="text-lg font-black">Simulation Recovery Success!</h3>
                    <p className="text-xs text-emerald-100">Live platform metrics & audit logs updated automatically.</p>
                  </div>
                </div>
                <span className="bg-white text-emerald-800 font-extrabold text-xs px-3 py-1 rounded-full">
                  ₹4,999 RECOVERED
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 bg-emerald-600/60 p-3 rounded-lg text-center text-xs">
                <div>
                  <p className="text-[10px] text-emerald-200 uppercase font-semibold">Revenue at Risk</p>
                  <p className="font-bold text-white">₹4,999</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-200 uppercase font-semibold">Recovered Amount</p>
                  <p className="font-bold text-white">₹4,999</p>
                </div>
                <div>
                  <p className="text-[10px] text-emerald-200 uppercase font-semibold">Recovery Status</p>
                  <p className="font-bold text-white">SUCCESS</p>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={() => navigateTo('dashboard')}
                  className="bg-white text-slate-900 font-bold px-4 py-2 rounded-lg text-xs hover:bg-slate-100 transition-colors"
                >
                  View Updated Dashboard
                </button>
                <button
                  onClick={() => navigateTo('audit-trail')}
                  className="bg-emerald-900 text-white font-bold px-4 py-2 rounded-lg text-xs hover:bg-emerald-950 transition-colors"
                >
                  Inspect Audit Trail Log
                </button>
              </div>
            </div>
          )}

        </div>

      </main>
    </div>
  );
};
