import React, { useState } from 'react';
import { useRecovery } from '../context/RecoveryContext';
import { Header } from '../components/common/Header';
import { KPICard } from '../components/common/KPICard';
import { StatusBadge } from '../components/common/StatusBadge';
import { AlertTriangle, ShieldAlert, ShieldCheck, Filter, Search, ArrowRight } from 'lucide-react';

export const RevenueAtRisk: React.FC = () => {
  const { events, kpiStats, navigateTo } = useRecovery();

  const [search, setSearch] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');

  const filteredEvents = events.filter((evt) => {
    const matchesSearch = 
      evt.orderId.toLowerCase().includes(search.toLowerCase()) ||
      evt.customerName.toLowerCase().includes(search.toLowerCase()) ||
      evt.failureReason.toLowerCase().includes(search.toLowerCase());
    
    const matchesRisk = riskFilter === 'All' || evt.riskLevel === riskFilter;
    const matchesStatus = statusFilter === 'All' || evt.status === statusFilter;

    return matchesSearch && matchesRisk && matchesStatus;
  });

  const highPriorityCount = events.filter(e => e.riskLevel === 'High').length;
  const mediumPriorityCount = events.filter(e => e.riskLevel === 'Medium').length;
  const lowPriorityCount = events.filter(e => e.riskLevel === 'Low').length;

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header 
        title="Revenue at Risk Monitoring" 
        subtitle="Prioritized queue of failed transactions and checkout abandonments requiring recovery" 
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KPICard 
            title="Total Revenue at Risk"
            value={`₹${kpiStats.revenueAtRisk.toLocaleString()}`}
            subtitle="Current risk pool"
            icon={AlertTriangle}
            variant="amber"
          />
          <KPICard 
            title="High Priority Risk"
            value={`${highPriorityCount} Orders`}
            subtitle="Requires manual policy approval"
            icon={ShieldAlert}
            variant="red"
          />
          <KPICard 
            title="Medium Priority Risk"
            value={`${mediumPriorityCount} Orders`}
            subtitle="Pending automated retry"
            icon={Filter}
            variant="indigo"
          />
          <KPICard 
            title="Low Risk (Recoverable)"
            value={`${lowPriorityCount} Orders`}
            subtitle="High probability auto-retry"
            icon={ShieldCheck}
            variant="emerald"
          />
        </div>

        {/* Filter Controls Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search by Order ID, Customer, Failure..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Risk Level:</span>
              <select
                value={riskFilter}
                onChange={(e) => setRiskFilter(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700"
              >
                <option value="All">All Risk Levels</option>
                <option value="High">High Risk</option>
                <option value="Medium">Medium Risk</option>
                <option value="Low">Low Risk</option>
              </select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-slate-100 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-700"
              >
                <option value="All">All Statuses</option>
                <option value="Recoverable">Recoverable</option>
                <option value="Pending">Pending</option>
                <option value="Recovered">Recovered</option>
                <option value="Failed">Failed</option>
                <option value="Escalated">Escalated</option>
              </select>
            </div>
          </div>
        </div>

        {/* Large Revenue at Risk Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900">Revenue at Risk Queue ({filteredEvents.length} Items)</h3>
            <span className="text-xs text-slate-500 font-medium">Click any row to inspect policy & AI diagnosis</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-100 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Risk Level</th>
                  <th className="py-3 px-4">Failure Reason</th>
                  <th className="py-3 px-4">Recommended Action</th>
                  <th className="py-3 px-4">Attempts</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredEvents.map((evt) => (
                  <tr 
                    key={evt.id}
                    onClick={() => navigateTo('event-details', { eventId: evt.id })}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{evt.orderId}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{evt.customerName}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{evt.amount.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        evt.riskLevel === 'High' ? 'bg-red-100 text-red-700' :
                        evt.riskLevel === 'Medium' ? 'bg-amber-100 text-amber-700' :
                        'bg-emerald-100 text-emerald-700'
                      }`}>
                        {evt.riskLevel}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{evt.failureReason}</td>
                    <td className="py-3 px-4 font-semibold text-indigo-700">{evt.aiRecommendation}</td>
                    <td className="py-3 px-4 font-mono text-slate-500">{evt.attempts}/{evt.maxAttempts}</td>
                    <td className="py-3 px-4"><StatusBadge status={evt.status} /></td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          navigateTo('event-details', { eventId: evt.id });
                        }}
                        className="px-3 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-[11px] shadow-xs flex items-center gap-1 ml-auto"
                      >
                        <span>Details</span>
                        <ArrowRight className="w-3 h-3" />
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
