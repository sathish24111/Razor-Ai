import React, { useState } from 'react';
import { useRecovery } from '../context/RecoveryContext';
import { Header } from '../components/common/Header';
import { KPICard } from '../components/common/KPICard';
import { StatusBadge } from '../components/common/StatusBadge';
import { simulationService, auditService } from '../services/api';
import { 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw, 
  TrendingUp, 
  Bot, 
  Sparkles, 
  ArrowRight, 
  CreditCard, 
  ShoppingCart, 
  RotateCcw,
  Zap,
  PlayCircle,
  ShieldCheck,
  Download,
  Layers
} from 'lucide-react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const MainDashboard: React.FC = () => {
  const { kpiStats, events, navigateTo, runRecoveryScan, isScanning, addToast, refreshBackendData } = useRecovery();
  const [scanResultVisible, setScanResultVisible] = useState(false);
  const [isSimulatingQuick, setIsSimulatingQuick] = useState(false);

  const chartData = [
    { day: 'Day 1', risk: 35000, recovered: 12000 },
    { day: 'Day 2', risk: 42000, recovered: 21000 },
    { day: 'Day 3', risk: 28000, recovered: 18000 },
    { day: 'Day 4', risk: 54000, recovered: 32000 },
    { day: 'Day 5', risk: 38000, recovered: 24000 },
    { day: 'Day 6', risk: 49000, recovered: 31000 },
    { day: 'Day 7', risk: Math.round(kpiStats.revenueAtRisk / 2.5), recovered: Math.round(kpiStats.revenueRecovered / 2) },
  ];

  const handleScanClick = async () => {
    await runRecoveryScan();
    setScanResultVisible(true);
  };

  const handleQuickSimulate = async (amount: number, reason: string) => {
    setIsSimulatingQuick(true);
    try {
      const res = await simulationService.createSingle({ amount, failureReason: reason });
      if (res.data?.success || res.success) {
        await refreshBackendData();
        addToast(
          amount > 10000 ? 'High-Value Risk Logged' : 'Simulated Failure Logged',
          `Created ₹${amount.toLocaleString()} failure (${reason}). Policy status updated!`,
          amount > 10000 ? 'warning' : 'info'
        );
      }
    } catch (err) {
      addToast('Simulation Error', 'Failed to generate simulation scenario.', 'error');
    } finally {
      setIsSimulatingQuick(false);
    }
  };

  const handleExportAuditCSV = async () => {
    try {
      const csv = await auditService.exportCSV();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `razorrecover_audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addToast('Export Successful', 'SOC2 Audit Trail CSV downloaded.', 'success');
    } catch (err) {
      addToast('Export Failed', 'Unable to generate CSV export.', 'error');
    }
  };

  // Derive breakdown values that sum cleanly to total revenue at risk
  const paymentFailuresAmount = Math.round(kpiStats.revenueAtRisk * 0.60);
  const checkoutAbandonmentAmount = Math.round(kpiStats.revenueAtRisk * 0.26);
  const subscriptionFailuresAmount = kpiStats.revenueAtRisk - paymentFailuresAmount - checkoutAbandonmentAmount;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header 
        title="Revenue Recovery Dashboard" 
        subtitle="Real-time monitoring, AI diagnosis, and payment recovery control center" 
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* Sandbox Simulation Safety Banner */}
        <div className="bg-emerald-950 text-white p-3.5 rounded-xl border border-emerald-800 flex items-center justify-between shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shrink-0"></div>
            <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
              SIMULATION MODE ACTIVE — Razorpay TEST API / Local Sandbox Only (No real payments processed)
            </span>
          </div>
          <button 
            onClick={() => navigateTo('simulation')} 
            className="text-[11px] font-bold bg-emerald-800 hover:bg-emerald-700 text-white px-3 py-1 rounded-lg border border-emerald-600 transition-colors"
          >
            Launch Demo Sandbox
          </button>
        </div>

        {/* Guided Demo Quick Action Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Interactive Hackathon Demo Controls:
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
            <button
              onClick={() => handleQuickSimulate(4999, '3DS_OTP_TIMEOUT')}
              disabled={isSimulatingQuick}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-bold border border-indigo-200 transition-all flex items-center gap-1.5"
            >
              <Zap className="w-3.5 h-3.5 text-indigo-600" />
              <span>Simulate OTP Failure (₹4,999)</span>
            </button>

            <button
              onClick={() => handleQuickSimulate(24999, 'CARD_LIMIT_EXCEEDED')}
              disabled={isSimulatingQuick}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-lg text-xs font-bold border border-amber-200 transition-all flex items-center gap-1.5"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              <span>Simulate High-Value (₹24,999)</span>
            </button>

            <button
              onClick={handleScanClick}
              disabled={isScanning}
              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-lg text-xs font-bold border border-emerald-200 transition-all flex items-center gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${isScanning ? 'animate-spin' : ''}`} />
              <span>Run Recovery Scan</span>
            </button>

            <button
              onClick={handleExportAuditCSV}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold border border-slate-300 transition-all flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Export Audit CSV</span>
            </button>
          </div>
        </div>

        {/* Top 5 KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <KPICard 
            title="Revenue at Risk"
            value={`₹${kpiStats.revenueAtRisk.toLocaleString()}`}
            change="+8.4%"
            isPositive={false}
            subtitle="Active unrecovered risks"
            icon={AlertTriangle}
            variant="amber"
          />
          <KPICard 
            title="Revenue Recovered"
            value={`₹${kpiStats.revenueRecovered.toLocaleString()}`}
            change="+14.2%"
            isPositive={true}
            subtitle="Successfully captured"
            icon={CheckCircle2}
            variant="emerald"
          />
          <KPICard 
            title="Recovery Attempts"
            value={kpiStats.recoveryAttempts}
            subtitle="Total actions executed"
            icon={RefreshCw}
            variant="navy"
          />
          <KPICard 
            title="Recovery Success Rate"
            value={`${kpiStats.recoveryRate}%`}
            change="+3.1%"
            isPositive={true}
            subtitle={`${kpiStats.successfulRecoveries} of ${kpiStats.recoveryAttempts} attempts successful`}
            icon={TrendingUp}
            variant="indigo"
          />
          <KPICard 
            title="Successful Recoveries"
            value={kpiStats.successfulRecoveries}
            subtitle="Completed payments"
            icon={Zap}
            variant="emerald"
          />
        </div>

        {/* Scan Result Summary Banner (Visible upon running scan) */}
        {scanResultVisible && (
          <div className="bg-indigo-950 text-white p-5 rounded-xl border border-indigo-800 shadow-xl space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between border-b border-indigo-800 pb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-indigo-200">
                  Autonomous Recovery Agent Scan Completed
                </h4>
              </div>
              <button onClick={() => setScanResultVisible(false)} className="text-slate-400 hover:text-white text-xs">
                ✕ Dismiss
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-center text-xs">
              <div className="bg-indigo-900/60 p-2.5 rounded-lg border border-indigo-700">
                <p className="text-[10px] text-indigo-300 font-bold uppercase">Scanned Events</p>
                <p className="text-base font-black text-white mt-0.5">124</p>
              </div>
              <div className="bg-indigo-900/60 p-2.5 rounded-lg border border-indigo-700">
                <p className="text-[10px] text-indigo-300 font-bold uppercase">Eligible Events</p>
                <p className="text-base font-black text-indigo-200 mt-0.5">98</p>
              </div>
              <div className="bg-emerald-950 p-2.5 rounded-lg border border-emerald-800">
                <p className="text-[10px] text-emerald-300 font-bold uppercase">Recovered</p>
                <p className="text-base font-black text-emerald-400 mt-0.5">27</p>
              </div>
              <div className="bg-amber-950 p-2.5 rounded-lg border border-amber-800">
                <p className="text-[10px] text-amber-300 font-bold uppercase">Policy Blocked</p>
                <p className="text-base font-black text-amber-400 mt-0.5">5</p>
              </div>
              <div className="bg-slate-900 p-2.5 rounded-lg border border-slate-700">
                <p className="text-[10px] text-slate-300 font-bold uppercase">Escalated</p>
                <p className="text-base font-black text-slate-200 mt-0.5">3</p>
              </div>
            </div>
          </div>
        )}

        {/* Middle Section: Chart + AI Agent Status & Policy Guardrails */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Revenue Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-slate-200 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-slate-900">7-Day Detected Revenue at Risk vs Recovered</h3>
                <p className="text-xs text-slate-500">Daily trend of detected risk volume vs successful AI recoveries</p>
              </div>
              <div className="flex items-center gap-4 text-xs font-semibold">
                <span className="flex items-center gap-1.5 text-amber-600">
                  <span className="w-3 h-3 rounded bg-amber-400"></span> Detected Risk
                </span>
                <span className="flex items-center gap-1.5 text-emerald-600">
                  <span className="w-3 h-3 rounded bg-emerald-500"></span> Recovered Revenue
                </span>
              </div>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRisk" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#F59E0B" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.4}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: '#64748B' }} />
                  <YAxis tick={{ fontSize: 11, fill: '#64748B' }} tickFormatter={(v: number) => `₹${v/1000}k`} />
                  <Tooltip 
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, '']}
                    contentStyle={{ backgroundColor: '#0B1220', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="risk" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#colorRisk)" name="Detected Risk" />
                  <Area type="monotone" dataKey="recovered" stroke="#10B981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRec)" name="Recovered" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Recovery Agent & Policy Guardrails Card */}
          <div className="bg-[#0B1220] text-white p-6 rounded-xl border border-slate-800 shadow-xl flex flex-col justify-between relative overflow-hidden">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-indigo-600 rounded-lg text-white">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">AI Recovery Agent</h3>
                    <p className="text-[11px] text-slate-400">Autonomous Policy Orchestrator</p>
                  </div>
                </div>
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse mr-1.5"></span>
                  MONITORING (READY)
                </span>
              </div>

              {/* Policy Status Guardrail Widget */}
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2 my-3">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    Policy Guardrails Verdicts
                  </span>
                  <span className="text-slate-400 font-mono">100% Authority</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-emerald-950/80 p-2 rounded border border-emerald-800/80">
                    <p className="text-[10px] text-emerald-300 font-bold">🟢 Allowed</p>
                    <p className="text-base font-black text-emerald-400 mt-0.5">27</p>
                  </div>
                  <div className="bg-amber-950/80 p-2 rounded border border-amber-800/80">
                    <p className="text-[10px] text-amber-300 font-bold">🟡 Approval Req.</p>
                    <p className="text-base font-black text-amber-400 mt-0.5">5</p>
                  </div>
                  <div className="bg-red-950/80 p-2 rounded border border-red-800/80">
                    <p className="text-[10px] text-red-300 font-bold">🔴 Blocked</p>
                    <p className="text-base font-black text-red-400 mt-0.5">3</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 my-2 text-xs">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Events Monitored</p>
                  <p className="text-base font-black text-white">124</p>
                </div>
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">AI Diagnoses</p>
                  <p className="text-base font-black text-indigo-300">98</p>
                </div>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <button
                onClick={handleScanClick}
                disabled={isScanning}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-950"
              >
                <Sparkles className={`w-4 h-4 ${isScanning ? 'animate-spin' : ''}`} />
                <span>{isScanning ? 'Scanning Telemetry...' : 'Run Recovery Scan'}</span>
              </button>

              <button
                onClick={() => navigateTo('simulation')}
                className="w-full bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold py-2 px-4 rounded-lg text-xs transition-all flex items-center justify-center gap-2 border border-slate-700"
              >
                <PlayCircle className="w-4 h-4 text-indigo-400" />
                <span>Launch Interactive Sandbox Demo</span>
              </button>
            </div>
          </div>

        </div>

        {/* Visual End-to-End Recovery Lifecycle Flowchart */}
        <div className="bg-slate-900 text-white p-5 rounded-xl border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-400" />
              Complete System Recovery Architecture Workflow
            </h3>
            <span className="text-[10px] font-mono bg-slate-800 text-slate-400 px-2.5 py-0.5 rounded border border-slate-700">
              AI Analyst → Policy Engine Authority → Recovery Agent
            </span>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-7 gap-2 text-center text-xs py-1">
            <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
              <span className="text-[9px] font-bold text-slate-400 uppercase">1. Failure</span>
              <p className="font-bold text-amber-400 text-[11px] mt-0.5">Payment Failed</p>
            </div>
            <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
              <span className="text-[9px] font-bold text-slate-400 uppercase">2. Telemetry</span>
              <p className="font-bold text-amber-300 text-[11px] mt-0.5">Revenue Risk</p>
            </div>
            <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
              <span className="text-[9px] font-bold text-slate-400 uppercase">3. AI Diagnosis</span>
              <p className="font-bold text-indigo-300 text-[11px] mt-0.5">LLM Analyst</p>
            </div>
            <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
              <span className="text-[9px] font-bold text-slate-400 uppercase">4. Policy Check</span>
              <p className="font-bold text-emerald-400 text-[11px] mt-0.5">Rules Authority</p>
            </div>
            <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
              <span className="text-[9px] font-bold text-slate-400 uppercase">5. Verdict</span>
              <p className="font-bold text-indigo-200 text-[11px] mt-0.5">Allowed / Review</p>
            </div>
            <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
              <span className="text-[9px] font-bold text-slate-400 uppercase">6. Agent</span>
              <p className="font-bold text-emerald-300 text-[11px] mt-0.5">Razorpay TEST</p>
            </div>
            <div className="bg-slate-800 p-2.5 rounded-lg border border-slate-700">
              <span className="text-[9px] font-bold text-slate-400 uppercase">7. Outcome</span>
              <p className="font-bold text-emerald-400 text-[11px] mt-0.5">Recovered & Audit</p>
            </div>
          </div>
        </div>

        {/* Revenue at Risk Breakdown Cards (Summing cleanly to Revenue at Risk) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-slate-900">Active Revenue at Risk Breakdown</h3>
            <span className="text-xs font-semibold text-slate-500">
              Total Active Risk: ₹{kpiStats.revenueAtRisk.toLocaleString()}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
                <CreditCard className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">Payment Failures (60%)</p>
                <p className="text-lg font-extrabold text-slate-900">₹{paymentFailuresAmount.toLocaleString()}</p>
                <p className="text-[11px] text-slate-400">3D-Secure & Bank gateway timeouts</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
                <ShoppingCart className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">Checkout Abandonment (26%)</p>
                <p className="text-lg font-extrabold text-slate-900">₹{checkoutAbandonmentAmount.toLocaleString()}</p>
                <p className="text-[11px] text-slate-400">Cart drop after soft balance error</p>
              </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 flex items-center gap-4">
              <div className="p-3 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
                <RotateCcw className="w-6 h-6" />
              </div>
              <div>
                <p className="text-xs text-slate-500 font-semibold">Subscription Failures (14%)</p>
                <p className="text-lg font-extrabold text-slate-900">₹{subscriptionFailuresAmount.toLocaleString()}</p>
                <p className="text-[11px] text-slate-400">Recurring billing card declines</p>
              </div>
            </div>

          </div>
        </div>

        {/* Recent Recovery Events Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-5 border-b border-slate-200 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Recent Recovery Events</h3>
              <p className="text-xs text-slate-500">Live payment failure events detected by AI agent</p>
            </div>
            <button
              onClick={() => navigateTo('recovery-events')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              <span>View All Events</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Problem</th>
                  <th className="py-3 px-4">AI Recommendation</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Revenue Recovered</th>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {events.slice(0, 5).map((evt) => (
                  <tr 
                    key={evt.id} 
                    onClick={() => navigateTo('event-details', { eventId: evt.id })}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{evt.orderId}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{evt.customerName}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{evt.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{evt.failureReason}</td>
                    <td className="py-3 px-4 font-semibold text-indigo-700">{evt.aiRecommendation}</td>
                    <td className="py-3 px-4"><StatusBadge status={evt.status} /></td>
                    <td className="py-3 px-4 font-bold text-emerald-600">
                      {evt.revenueRecovered > 0 ? `₹${evt.revenueRecovered.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-slate-400">{evt.createdAt}</td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateTo('event-details', { eventId: evt.id });
                        }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-600 text-slate-700 rounded font-semibold text-[11px]"
                      >
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </main>
    </div>
  );
};
