import React, { useState, useEffect } from 'react';
import { useRecovery } from '../context/RecoveryContext';
import { Header } from '../components/common/Header';
import { KPICard } from '../components/common/KPICard';
import { analyticsService } from '../services/api';
import { BarChart3, TrendingUp, Download, CheckCircle2, Clock, Zap, Layers, RefreshCw } from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';

export const AnalyticsReports: React.FC = () => {
  const { kpiStats, addToast } = useRecovery();
  const [funnelData, setFunnelData] = useState<any>(null);
  const [reasonsData, setReasonsData] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const [funnelRes, reasonsRes] = await Promise.all([
        analyticsService.getFunnel(),
        analyticsService.getReasons(),
      ]);

      if (funnelRes.success) setFunnelData(funnelRes.data);
      if (reasonsRes.success) setReasonsData(reasonsRes.data);
    } catch (err) {
      console.warn('Analytics loading warning');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAnalytics();
  }, []);

  const handleExportCSV = async () => {
    try {
      const blob = await analyticsService.exportCSV();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `razorrecover_analytics_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      addToast('Analytics Exported', '✓ CSV financial report downloaded.', 'success');
    } catch (err) {
      addToast('Export Failed', 'Unable to generate CSV export.', 'error');
    }
  };

  const pieColors = ['#4F46E5', '#F59E0B', '#10B981', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'];
  const formattedReasons = reasonsData.map((r, i) => ({
    name: r.reason.replace('_', ' '),
    value: r.count,
    amount: r.amount,
    color: pieColors[i % pieColors.length],
  }));

  const funnelList = funnelData ? [
    { step: 'Failed Payments', count: funnelData.failedPayments, fill: '#EF4444' },
    { step: 'Revenue Risks', count: funnelData.revenueRisks, fill: '#F59E0B' },
    { step: 'AI Analyzed', count: funnelData.aiAnalyzed, fill: '#6366F1' },
    { step: 'Policy Approved', count: funnelData.policyApproved, fill: '#3B82F6' },
    { step: 'Recovery Attempts', count: funnelData.recoveryAttempts, fill: '#8B5CF6' },
    { step: 'Successful Recoveries', count: funnelData.successfulRecoveries, fill: '#10B981' },
  ] : [];

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header 
        title="Analytics & Financial Reports" 
        subtitle="Deep analytics on recovery performance, failure causes, and merchant revenue ROI" 
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* Top Control */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">Executive Summary KPIs</h3>
            <button onClick={loadAnalytics} className="p-1 text-slate-400 hover:text-slate-600">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
          <button
            onClick={handleExportCSV}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-2 shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Analytics CSV</span>
          </button>
        </div>

        {/* 6 Top Analytics KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          <KPICard title="Revenue Risk" value={`₹${((kpiStats.revenueAtRisk || 0)/1000).toFixed(0)}k`} icon={BarChart3} variant="amber" />
          <KPICard title="Recovered" value={`₹${((kpiStats.revenueRecovered || 0)/1000).toFixed(1)}k`} icon={CheckCircle2} variant="emerald" />
          <KPICard title="Recovery Rate" value={`${kpiStats.recoveryRate || 0}%`} icon={TrendingUp} variant="indigo" />
          <KPICard title="Failed Payments" value={kpiStats.failedPayments || 50} icon={BarChart3} variant="red" />
          <KPICard title="Success Count" value={kpiStats.successfulRecoveries || 0} icon={Zap} variant="emerald" />
          <KPICard title="Avg Time" value="4.2 mins" icon={Clock} variant="navy" />
        </div>

        {/* Recovery Funnel Card */}
        {funnelData && (
          <div className="bg-[#0B1220] text-white p-6 rounded-xl border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-indigo-300">
                  End-to-End Recovery Funnel Conversion
                </h3>
              </div>
              <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950 px-3 py-1 rounded-full border border-emerald-800">
                {kpiStats.recoveryRate}% Total Conversion Rate
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-6 gap-3 text-center py-2">
              {funnelList.map((step, idx) => (
                <div key={idx} className="bg-slate-900/90 p-3 rounded-lg border border-slate-800">
                  <p className="text-[10px] font-bold uppercase text-slate-400">Step {idx + 1}</p>
                  <p className="text-lg font-black text-white my-0.5">{step.count}</p>
                  <p className="text-xs font-semibold text-slate-300">{step.step}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Chart 1: Failure Reasons Pie Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-900">Payment Failure Reasons Breakdown</h4>
              <p className="text-xs text-slate-500">Database-derived failure telemetry distribution</p>
            </div>
            <div className="h-64 w-full flex items-center justify-center">
              {formattedReasons.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={formattedReasons}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {formattedReasons.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#0B1220', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-400">No failed payments recorded yet</p>
              )}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4 text-xs font-semibold">
              {formattedReasons.map((item, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></span>
                  <span className="text-slate-700">{item.name} ({item.value})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Chart 2: Funnel Bar Chart */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs">
            <div className="mb-4">
              <h4 className="text-sm font-bold text-slate-900">Recovery Stage Funnel Conversion</h4>
              <p className="text-xs text-slate-500">Volume drop-off across recovery pipeline</p>
            </div>
            <div className="h-64 w-full">
              {funnelList.length > 0 && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={funnelList} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="step" tick={{ fontSize: 10, fill: '#64748B' }} />
                    <YAxis tick={{ fontSize: 11, fill: '#64748B' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#0B1220', borderRadius: '8px', color: '#fff', fontSize: '12px' }} />
                    <Bar dataKey="count" fill="#4F46E5" radius={[4, 4, 0, 0]} name="Volume" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};
