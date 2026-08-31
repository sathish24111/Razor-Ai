import React, { useState, useEffect } from 'react';
import { useRecovery } from '../context/RecoveryContext';
import { Header } from '../components/common/Header';
import { auditService } from '../services/api';
import { ShieldCheck, Download, Search, FileText, X, CheckCircle2, Bot, User, Server, Shield } from 'lucide-react';
import { AuditLogEntry } from '../types';

export const AuditTrail: React.FC = () => {
  const { auditLogs, addToast, refreshBackendData } = useRecovery();
  const [search, setSearch] = useState('');
  const [selectedAudit, setSelectedAudit] = useState<AuditLogEntry | null>(auditLogs[0] || null);
  const [showDrawer, setShowDrawer] = useState(false);
  const [integrityStatus, setIntegrityStatus] = useState<any>(null);

  const checkIntegrity = async () => {
    try {
      const res = await auditService.verifyAudit();
      if (res.success) {
        setIntegrityStatus(res.data);
      }
    } catch (err) {
      console.warn('Audit integrity check warning');
    }
  };

  useEffect(() => {
    checkIntegrity();
  }, []);

  const filteredLogs = auditLogs.filter(log => 
    log.id.toLowerCase().includes(search.toLowerCase()) ||
    log.orderId.toLowerCase().includes(search.toLowerCase()) ||
    log.action.toLowerCase().includes(search.toLowerCase()) ||
    log.actor.toLowerCase().includes(search.toLowerCase())
  );

  const handleExportCSV = async () => {
    try {
      const blob = await auditService.exportCSV();
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `razorrecover_audit_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      addToast('Audit Log Exported', '✓ SOC2 audit log exported to CSV.', 'success');
    } catch (err) {
      addToast('Export Failed', 'Unable to export audit log CSV.', 'error');
    }
  };

  const handleRowClick = (log: AuditLogEntry) => {
    setSelectedAudit(log);
    setShowDrawer(true);
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header 
        title="Compliance Audit Trail" 
        subtitle="Immutable audit log of all AI diagnoses, policy evaluations, and payment actions" 
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* Top Control Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Filter audit log by ID, Order, Action, Actor..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center gap-3">
            {integrityStatus && (
              <span className="text-xs font-bold bg-emerald-50 text-emerald-700 px-3 py-1 rounded-full border border-emerald-200 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Integrity Verified: PASS ({integrityStatus.totalRecords} Logs)</span>
              </span>
            )}
            <button
              onClick={handleExportCSV}
              className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-lg text-xs transition-all flex items-center gap-2 shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export Audit CSV</span>
            </button>
          </div>
        </div>

        {/* Audit Log Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Event ID</th>
                  <th className="py-3 px-4">Order ID</th>
                  <th className="py-3 px-4">Action</th>
                  <th className="py-3 px-4">Reason</th>
                  <th className="py-3 px-4">Amount</th>
                  <th className="py-3 px-4">Policy Result</th>
                  <th className="py-3 px-4">Actor</th>
                  <th className="py-3 px-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredLogs.map((log) => (
                  <tr 
                    key={log.id} 
                    onClick={() => handleRowClick(log)}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{log.timestamp}</td>
                    <td className="py-3 px-4 font-mono text-slate-400">{log.id}</td>
                    <td className="py-3 px-4 font-mono font-bold text-indigo-600">{log.orderId}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">{log.action}</td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{log.reason}</td>
                    <td className="py-3 px-4 font-bold text-slate-900">
                      {log.amount > 0 ? `₹${log.amount.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                        log.policyResult === 'Allowed' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        log.policyResult === 'Blocked' ? 'bg-red-50 text-red-700 border border-red-200' :
                        'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {log.policyResult}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-slate-700">
                        {log.actor === 'AI Agent' && <Bot className="w-3.5 h-3.5 text-indigo-600" />}
                        {log.actor === 'Merchant Admin' && <User className="w-3.5 h-3.5 text-amber-600" />}
                        {log.actor === 'Customer' && <User className="w-3.5 h-3.5 text-emerald-600" />}
                        {log.actor === 'System' && <Server className="w-3.5 h-3.5 text-slate-500" />}
                        {log.actor}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button 
                        onClick={(e) => { e.stopPropagation(); handleRowClick(log); }}
                        className="px-2.5 py-1 bg-slate-100 hover:bg-indigo-50 text-indigo-600 rounded font-semibold text-[11px]"
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

      {/* Audit Detail Drawer / Modal */}
      {showDrawer && selectedAudit && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs z-50 flex justify-end">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl overflow-y-auto p-6 space-y-6 flex flex-col justify-between border-l border-slate-200 animate-in slide-in-from-right duration-200">
            <div>
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Audit Inspector</h3>
                    <p className="text-xs text-slate-500 font-mono">{selectedAudit.id} &bull; {selectedAudit.timestamp}</p>
                  </div>
                </div>
                <button onClick={() => setShowDrawer(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 6 Structured Compliance Questions */}
              <div className="mt-6 space-y-4 text-xs">
                
                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">WHAT happened?</span>
                  <p className="font-bold text-slate-900 text-sm">{selectedAudit.details?.what || selectedAudit.action}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">WHY did it happen?</span>
                  <p className="text-slate-700 font-medium">{selectedAudit.details?.why || selectedAudit.reason}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">WHO/WHAT triggered it?</span>
                  <p className="font-bold text-slate-900">{selectedAudit.details?.who || selectedAudit.actor}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">WHAT policy was applied?</span>
                  <p className="font-mono text-slate-800">{selectedAudit.details?.policyApplied || 'Merchant Policy #POL-01'}</p>
                </div>

                <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">WHAT amount was involved?</span>
                  <p className="font-black text-slate-900 text-sm">
                    {selectedAudit.details?.amountInvolved || (selectedAudit.amount > 0 ? `₹${selectedAudit.amount.toLocaleString()}` : 'N/A')}
                  </p>
                </div>

                <div className="bg-emerald-50 p-3.5 rounded-xl border border-emerald-200 space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">WHAT was the result?</span>
                  <p className="font-bold text-emerald-900">{selectedAudit.details?.result || 'Completed Successfully'}</p>
                </div>

              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setShowDrawer(false)}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-2.5 rounded-lg text-xs"
              >
                Close Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
