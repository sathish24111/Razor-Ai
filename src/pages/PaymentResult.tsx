import React from 'react';
import { useRecovery } from '../context/RecoveryContext';
import { CheckCircle2, XCircle, ArrowLeft, RefreshCw, HelpCircle, ShieldCheck } from 'lucide-react';

export const PaymentResult: React.FC = () => {
  const { selectedEvent, lastResultEvent, navigateTo } = useRecovery();
  const event = lastResultEvent || selectedEvent || {
    id: 'EVT-1024',
    orderId: 'ORD-1024',
    customerName: 'Arjun Kumar',
    amount: 4999,
    status: 'Recovered',
    attempts: 1,
    maxAttempts: 2,
    revenueRecovered: 4999,
  };

  const isSuccess = ['Recovered', 'success', 'paid', 'Completed', 'Approved'].includes(event.status) || (event.revenueRecovered !== undefined && event.revenueRecovered > 0);

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden text-center p-8 space-y-6">
        
        {isSuccess ? (
          /* SUCCESS STATE */
          <>
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                Payment Recovered
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">Payment Successful</h2>
              <p className="text-xs text-slate-500 mt-1">Your order has been confirmed and is being processed.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Order ID:</span>
                <span className="font-mono font-bold text-slate-900">{event.orderId}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Razorpay Test Payment ID:</span>
                <span className="font-mono font-bold text-indigo-600">pay_rzp_test_{Math.floor(100000 + Math.random() * 900000)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Amount Paid:</span>
                <span className="font-bold text-slate-900">₹{event.amount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Status:</span>
                <span className="font-bold text-emerald-600">CONFIRMED & RECOVERED</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => navigateTo('dashboard')}
                className="w-full bg-[#0B1220] hover:bg-slate-800 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md"
              >
                Return to Merchant Control Console
              </button>
              
              <button
                onClick={() => navigateTo('audit-trail')}
                className="w-full bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all border border-indigo-200"
              >
                Inspect Updated Audit Trail
              </button>
            </div>
          </>
        ) : (
          /* FAILURE STATE */
          <>
            <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <XCircle className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-red-600 bg-red-50 px-2.5 py-1 rounded-full border border-red-200">
                Payment Unsuccessful
              </span>
              <h2 className="text-2xl font-black text-slate-900 mt-2">Payment Was Not Completed</h2>
              <p className="text-xs text-slate-500 mt-1">Your payment was not completed. You have not been charged.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Order ID:</span>
                <span className="font-mono font-bold text-slate-900">{event.orderId}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Recovery Attempts:</span>
                <span className="font-bold text-slate-900">{event.attempts} of {event.maxAttempts}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Status:</span>
                <span className="font-bold text-amber-600">ESCALATED TO MERCHANT</span>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              <button
                onClick={() => navigateTo('customer-recovery')}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Try Payment Again</span>
              </button>

              <button
                onClick={() => navigateTo('dashboard')}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-2.5 px-4 rounded-xl text-xs transition-all"
              >
                Return to Dashboard
              </button>
            </div>
          </>
        )}

      </div>
    </div>
  );
};
