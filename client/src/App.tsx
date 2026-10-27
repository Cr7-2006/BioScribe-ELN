import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { ThemeProvider } from './context/ThemeContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { ExperimentsPage } from './pages/ExperimentsPage';
import { ExperimentDetail } from './pages/ExperimentDetail';
import { FormulationsPage } from './pages/FormulationsPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { AdminUsersPage } from './pages/AdminUsersPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { LoginPage } from './pages/LoginPage';
import { SessionLockModal } from './components/security/SessionLockModal';
import { GlobalSearchModal } from './components/search/GlobalSearchModal';
import { ReagentBarcodeModal, ScannedReagent } from './components/reagents/ReagentBarcodeModal';
import { apiRequest } from './api/client';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [activeExperimentId, setActiveExperimentId] = useState<string | null>(null);
  const [activeFormulationId, setActiveFormulationId] = useState<string | null>(null);
  const [isNewExpModalOpen, setIsNewExpModalOpen] = useState<boolean>(false);
  const [isNewFormModalOpen, setIsNewFormModalOpen] = useState<boolean>(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);
  const [pendingUsersCount, setPendingUsersCount] = useState<number>(0);
  const [isTerminalLocked, setIsTerminalLocked] = useState<boolean>(false);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState<boolean>(false);
  const [isReagentScannerOpen, setIsReagentScannerOpen] = useState<boolean>(false);

  // Global Ctrl+K / Cmd+K Keyboard Shortcut for Universal Search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsGlobalSearchOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (!user) return;

    const fetchPending = async () => {
      try {
        const res = await apiRequest<{ approvals: any[] }>('/approvals?status=pending');
        setPendingApprovalsCount(res.approvals.length);
      } catch {
        // Ignore
      }

      if (user.role === 'admin' || user.role === 'qa_manager') {
        try {
          const userRes = await apiRequest<{ count: number }>('/admin/users/pending-count');
          setPendingUsersCount(userRes.count);
        } catch {
          // Ignore
        }
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, 10000);
    return () => clearInterval(interval);
  }, [user]);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-100 dark:bg-slate-950 flex items-center justify-center text-slate-500 dark:text-slate-400">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <h3 className="font-bold text-slate-900 dark:text-white text-base">BioScribe ELN</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Initializing Secure Research Workspace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const handleOpenExperiment = (id: string) => {
    setActiveExperimentId(id);
    setActiveTab('experiments');
  };

  const handleOpenFormulation = (id: string) => {
    setActiveFormulationId(id);
    setActiveTab('formulations');
  };

  const handleNewExperiment = () => {
    setActiveExperimentId(null);
    setActiveTab('experiments');
    setIsNewExpModalOpen(true);
  };

  const handleNewFormulation = () => {
    setActiveFormulationId(null);
    setActiveTab('formulations');
    setIsNewFormModalOpen(true);
  };

  return (
    <div className="h-screen flex flex-col bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden select-none transition-colors duration-200">
      {/* Top Navbar */}
      <Navbar
        onLockTerminal={() => setIsTerminalLocked(true)}
        onOpenSearch={() => setIsGlobalSearchOpen(true)}
        onOpenReagentScanner={() => setIsReagentScannerOpen(true)}
      />

      {/* Main Workspace Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          setActiveTab={(tab) => {
            setActiveTab(tab);
            if (tab !== 'experiments') {
              setActiveExperimentId(null);
            }
          }}
          pendingApprovalsCount={pendingApprovalsCount}
          pendingUsersCount={pendingUsersCount}
        />

        {/* Dynamic Center Stage */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-50 via-slate-100/60 to-slate-50 dark:from-slate-950 dark:via-slate-900/30 dark:to-slate-950 transition-colors duration-200">
          {activeTab === 'dashboard' && (
            user.role === 'admin' ? (
              <AdminDashboard setActiveTab={setActiveTab} />
            ) : (
              <Dashboard
                setActiveTab={setActiveTab}
                onOpenExperiment={handleOpenExperiment}
                onNewExperiment={handleNewExperiment}
                onNewFormulation={handleNewFormulation}
              />
            )
          )}

          {activeTab === 'experiments' && (
            activeExperimentId ? (
              <ExperimentDetail
                experimentId={activeExperimentId}
                onBack={() => setActiveExperimentId(null)}
                onOpenFormulation={handleOpenFormulation}
              />
            ) : (
              <ExperimentsPage
                onOpenExperiment={handleOpenExperiment}
                isCreateModalOpen={isNewExpModalOpen}
                setIsCreateModalOpen={setIsNewExpModalOpen}
              />
            )
          )}

          {activeTab === 'formulations' && (
            <FormulationsPage
              initialFormulationId={activeFormulationId || undefined}
              isCreateModalOpen={isNewFormModalOpen}
              setIsCreateModalOpen={setIsNewFormModalOpen}
            />
          )}

          {activeTab === 'approvals' && (
            <ApprovalsPage onOpenExperiment={handleOpenExperiment} />
          )}

          {activeTab === 'audit' && (
            <AuditLogPage />
          )}

          {activeTab === 'users' && (
            <AdminUsersPage />
          )}
        </main>
      </div>

      {/* Workstation Session Security Lock Modal */}
      <SessionLockModal
        isLocked={isTerminalLocked}
        onUnlock={() => setIsTerminalLocked(false)}
        onLock={() => setIsTerminalLocked(true)}
      />

      {/* Global Universal Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
        onOpenExperiment={handleOpenExperiment}
        onOpenFormulation={handleOpenFormulation}
        onOpenAuditLog={() => setActiveTab('audit')}
      />

      {/* 2D Barcode & QR Code Reagent Station */}
      <ReagentBarcodeModal
        isOpen={isReagentScannerOpen}
        onClose={() => setIsReagentScannerOpen(false)}
        onImportReagent={(reagent: ScannedReagent) => {
          handleOpenFormulation(''); // Switch to formulations tab
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <NotificationProvider>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </NotificationProvider>
    </ThemeProvider>
  );
}
