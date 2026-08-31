import React, { useState } from 'react';
import { useRecovery } from '../context/RecoveryContext';
import { Header } from '../components/common/Header';
import { StatusBadge } from '../components/common/StatusBadge';
import { Clock, Search, ArrowRight, CheckCircle2, AlertTriangle, RefreshCw, Zap } from 'lucide-react';

export const RecoveryEvents: React.FC = () => {
  const { events, navigateTo } = useRecovery();
  const [search, setSearch] = useState('');
  const [viewMode, setViewMode] = useState<'timeline' | 'table'>('timeline');

  const filtered = events.filter(e => 
    e.orderId.toLowerCase().includes(search.toLowerCase()) ||
    e.customerName.toLowerCase().includes(search.toLowerCase()) ||
    e.productName.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header 
        title="Recovery Events Feed" 
        subtitle="Chronological audit timeline of all detected payment failures and recovery progressions" 
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* Top Control Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search timeline by Order, Customer, Product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button
              onClick={() => setViewMode('timeline')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                viewMode === 'timeline' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Timeline View
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                viewMode === 'table' ? 'bg-white text-indigo-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Table View
            </button>
          </div>
        </div>

        {viewMode === 'timeline' ? (
          /* Timeline Hybrid UI */
          <div className="space-y-6">
            {filtered.map((evt) => (
              <div 
                key={evt.id} 
                className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 hover:border-indigo-300 transition-all cursor-pointer"
                onClick={() => navigateTo('event-details', { eventId: evt.id })}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg font-bold font-mono text-sm border border-indigo-100">
                      {evt.orderId}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{evt.customerName} &bull; {evt.productName}</h4>
                      <p className="text-xs text-slate-500">{evt.createdAt} &bull; Risk Level: <span className="font-semibold text-amber-600">{evt.riskLevel}</span></p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-semibold">Transaction Amount</p>
                      <p className="text-base font-extrabold text-slate-900">₹{evt.amount.toLocaleString()}</p>
                    </div>
                    <StatusBadge status={evt.status} />
                  </div>
                </div>

                {/* Timeline Stepper for this Event */}
                <div className="mt-4 pt-2">
                  <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-3">Event Progression History</p>
                  <div className="relative pl-6 space-y-3 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                    {evt.timeline.map((step, idx) => (
                      <div key={idx} className="relative flex items-start justify-between text-xs">
                        <span className={`absolute -left-6 top-0.5 w-4 h-4 rounded-full border-2 border-white flex items-center justify-center text-[10px] ${
                          step.type === 'recovered' ? 'bg-emerald-500 text-white' :
                          step.type === 'failed' ? 'bg-red-500 text-white' :
                          step.type === 'diagnosis' ? 'bg-indigo-600 text-white' :
                          'bg-amber-500 text-white'
                        }`}>
                          ✓
                        </span>
                        <div>
                          <span className="font-bold text-slate-900">{step.title}</span>
                          <p className="text-[11px] text-slate-500">{step.description}</p>
                        </div>
                        <span className="text-[10px] font-mono text-slate-400 shrink-0">{step.time}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex justify-end">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigateTo('event-details', { eventId: evt.id });
                    }}
                    className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                  >
                    <span>Open Event Details & AI Reasoning</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

              </div>
            ))}
          </div>
        ) : (
          /* Table View */
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">AI Diagnosis</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((evt) => (
                  <tr 
                    key={evt.id}
                    onClick={() => navigateTo('event-details', { eventId: evt.id })}
                    className="hover:bg-slate-50 cursor-pointer"
                  >
                    <td className="py-3 px-4 font-mono text-slate-400">{evt.id}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{evt.orderId}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{evt.customerName}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{evt.amount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-600">{evt.failureReason}</td>
                    <td className="py-3 px-4 font-bold text-indigo-600">{evt.aiConfidence}%</td>
                    <td className="py-3 px-4"><StatusBadge status={evt.status} /></td>
                    <td className="py-3 px-4 text-right">
                      <button className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-600 rounded font-semibold text-[11px]">
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </main>
    </div>
  );
};
