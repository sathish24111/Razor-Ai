import React from 'react';
import { useRecovery } from '../context/RecoveryContext';
import { Header } from '../components/common/Header';
import { StatusBadge } from '../components/common/StatusBadge';
import { User, Mail, Phone, Calendar, ArrowLeft, ShieldCheck, ShoppingBag, Clock } from 'lucide-react';

export const CustomerDetails: React.FC = () => {
  const { selectedCustomer, navigateTo } = useRecovery();

  if (!selectedCustomer) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex justify-center items-center">
        <p className="text-slate-500">No customer selected</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <Header 
        title={`Customer Profile: ${selectedCustomer.name}`} 
        subtitle="Individual merchant lifetime value, transaction history, and AI recovery records" 
      />

      <main className="p-6 space-y-6 max-w-7xl mx-auto">
        
        <button
          onClick={() => navigateTo('customers')}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Customers Directory</span>
        </button>

        {/* Customer Header Info Card */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-xl shadow-md">
              {selectedCustomer.name.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900">{selectedCustomer.name}</h3>
              <p className="text-xs text-slate-500">{selectedCustomer.email}</p>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedCustomer.id}</p>
            </div>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Total Lifetime Spend</span>
            <h3 className="text-2xl font-black text-slate-900 mt-0.5">₹{selectedCustomer.totalSpend.toLocaleString()}</h3>
            <p className="text-xs text-slate-500">{selectedCustomer.ordersCount} total orders</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Revenue Recovered</span>
            <h3 className="text-2xl font-black text-emerald-600 mt-0.5">₹{selectedCustomer.recoveredRevenue.toLocaleString()}</h3>
            <p className="text-xs text-slate-500">{selectedCustomer.recoveryAttempts} recovery attempt executed</p>
          </div>

          <div>
            <span className="text-[10px] font-bold uppercase text-slate-400">Health / Risk Status</span>
            <div className="mt-2">
              <StatusBadge status={selectedCustomer.status} />
            </div>
          </div>
        </div>

        {/* Recent Orders & Recovery History Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Order History */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-indigo-600" />
              Recent Orders History
            </h3>

            <div className="divide-y divide-slate-100">
              {selectedCustomer.recentOrders.map((ord) => (
                <div key={ord.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-slate-900">{ord.product}</p>
                    <p className="text-slate-400 font-mono">{ord.id} &bull; {ord.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">₹{ord.amount.toLocaleString()}</p>
                    <StatusBadge status={ord.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Risk Profile */}
          <div className="bg-slate-900 text-white rounded-xl p-6 space-y-4 shadow-xl border border-slate-800">
            <h3 className="text-sm font-bold text-indigo-300 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              AI Customer Recovery Telemetry Profile
            </h3>

            <div className="space-y-3 text-xs text-slate-300">
              <div className="p-3 bg-slate-800/80 rounded-lg border border-slate-700">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Payment Reliability Rating</span>
                <p className="text-sm font-extrabold text-emerald-400 mt-0.5">94 / 100 (Low Risk)</p>
              </div>

              <p>
                Customer has strong purchasing history with zero chargeback flags. Payment failure on ORD-1024 was diagnosed as a soft 3DS OTP timeout.
              </p>

              <div className="pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Recommended Recovery Channel</span>
                <p className="text-xs font-bold text-indigo-300 mt-0.5">SMS & WhatsApp 1-Click Payment Link</p>
              </div>
            </div>
          </div>

        </div>

      </main>
    </div>
  );
};
