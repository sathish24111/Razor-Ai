import React from 'react';
import { RecoveryProvider, useRecovery } from './context/RecoveryContext';
import { Sidebar } from './components/common/Sidebar';
import { ToastNotificationStack } from './components/common/ToastNotification';

import { Login } from './pages/Login';
import { MerchantOnboarding } from './pages/MerchantOnboarding';
import { MainDashboard } from './pages/MainDashboard';
import { RevenueAtRisk } from './pages/RevenueAtRisk';
import { RecoveryEvents } from './pages/RecoveryEvents';
import { RecoveryEventDetails } from './pages/RecoveryEventDetails';
import { AIDecisionCenter } from './pages/AIDecisionCenter';
import { RecoveryActions } from './pages/RecoveryActions';
import { CustomerRecovery } from './pages/CustomerRecovery';
import { PaymentResult } from './pages/PaymentResult';
import { MerchantPolicies } from './pages/MerchantPolicies';
import { AuditTrail } from './pages/AuditTrail';
import { AnalyticsReports } from './pages/AnalyticsReports';
import { Customers } from './pages/Customers';
import { CustomerDetails } from './pages/CustomerDetails';
import { Settings } from './pages/Settings';
import { SimulationCenter } from './pages/SimulationCenter';

const AppContent: React.FC = () => {
  const { currentPage } = useRecovery();

  const isStandalonePage = ['login', 'onboarding', 'customer-recovery', 'payment-result'].includes(currentPage);

  const renderPage = () => {
    switch (currentPage) {
      case 'login':
        return <Login />;
      case 'onboarding':
        return <MerchantOnboarding />;
      case 'dashboard':
        return <MainDashboard />;
      case 'revenue-at-risk':
        return <RevenueAtRisk />;
      case 'recovery-events':
        return <RecoveryEvents />;
      case 'event-details':
        return <RecoveryEventDetails />;
      case 'ai-decision-center':
        return <AIDecisionCenter />;
      case 'recovery-actions':
        return <RecoveryActions />;
      case 'customer-recovery':
        return <CustomerRecovery />;
      case 'payment-result':
        return <PaymentResult />;
      case 'policies':
        return <MerchantPolicies />;
      case 'audit-trail':
        return <AuditTrail />;
      case 'analytics':
        return <AnalyticsReports />;
      case 'customers':
        return <Customers />;
      case 'customer-details':
        return <CustomerDetails />;
      case 'settings':
        return <Settings />;
      case 'simulation':
        return <SimulationCenter />;
      default:
        return <MainDashboard />;
    }
  };

  if (isStandalonePage) {
    return (
      <div className="min-h-screen bg-[#F8FAFC]">
        {renderPage()}
        <ToastNotificationStack />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar />
      <div className="flex-1 min-w-0">
        {renderPage()}
      </div>
      <ToastNotificationStack />
    </div>
  );
};

export function App() {
  return (
    <RecoveryProvider>
      <AppContent />
    </RecoveryProvider>
  );
}

export default App;
