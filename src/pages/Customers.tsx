import React, { useState } from 'react';
import { useRecovery } from '../context/RecoveryContext';
import { Header } from '../components/common/Header';
import { StatusBadge } from '../components/common/StatusBadge';
import { Search, Users, ArrowRight } from 'lucide-react';

export const Customers: React.FC = () => {
  const { customers, navigateTo } = useRecovery();
  const [search, setSearch] = useState('');

  const filtered = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header 
        title="Customer Directory" 
        subtitle="Customer payment health profiles, risk scores, and lifetime recovery history" 
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        
        {/* Search */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Search customer name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-lg border border-slate-200 text-xs focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>
          <span className="text-xs text-slate-500 font-semibold">{filtered.length} Customers Enrolled</span>
        </div>

        {/* Customer Table */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Orders</th>
                  <th className="py-3 px-4">Total Spend</th>
                  <th className="py-3 px-4">Failed Payments</th>
                  <th className="py-3 px-4">Recovery Attempts</th>
                  <th className="py-3 px-4">Recovered Revenue</th>
                  <th className="py-3 px-4">Risk Status</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filtered.map((cust) => (
                  <tr 
                    key={cust.id} 
                    onClick={() => navigateTo('customer-details', { customerId: cust.id })}
                    className="hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-bold text-slate-900">{cust.name}</p>
                        <p className="text-[11px] text-slate-500">{cust.email}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-700">{cust.ordersCount} orders</td>
                    <td className="py-3 px-4 font-bold text-slate-900">₹{cust.totalSpend.toLocaleString()}</td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">{cust.failedPaymentsCount} failed</td>
                    <td className="py-3 px-4 text-slate-700 font-semibold">{cust.recoveryAttempts} attempts</td>
                    <td className="py-3 px-4 font-bold text-emerald-600">
                      {cust.recoveredRevenue > 0 ? `₹${cust.recoveredRevenue.toLocaleString()}` : '—'}
                    </td>
                    <td className="py-3 px-4"><StatusBadge status={cust.status} /></td>
                    <td className="py-3 px-4 text-right">
                      <button className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded text-[11px] flex items-center gap-1 ml-auto">
                        <span>Profile</span>
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
