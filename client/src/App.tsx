import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { ExperimentsPage } from './pages/ExperimentsPage';
import { ExperimentDetail } from './pages/ExperimentDetail';
import { FormulationsPage } from './pages/FormulationsPage';
import { ApprovalsPage } from './pages/ApprovalsPage';
import { AuditLogPage } from './pages/AuditLogPage';
import { apiRequest } from './api/client';

const AppContent: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [activeExperimentId, setActiveExperimentId] = useState<string | null>(null);
  const [activeFormulationId, setActiveFormulationId] = useState<string | null>(null);
  const [isNewExpModalOpen, setIsNewExpModalOpen] = useState<boolean>(false);
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState<number>(0);

  useEffect(() => {
    const fetchPending = async () => {
      try {
        const res = await apiRequest<{ approvals: any[] }>('/approvals?status=pending');
        setPendingApprovalsCount(res.approvals.length);
      } catch {
        // Ignore
      }
    };

    fetchPending();
    const interval = setInterval(fetchPending, 10000);
    return () => clearInterval(interval);
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-10 h-10 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          <div className="text-center">
            <h3 className="font-bold text-white text-base">BioScribe ELN</h3>
            <p className="text-xs text-slate-500 mt-1">Initializing Secure Research Workspace...</p>
          </div>
        </div>
      </div>
    );
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
  };

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-slate-100 overflow-hidden select-none">
      {/* Top Navbar */}
      <Navbar />

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
        />

        {/* Dynamic Center Stage */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950">
          {activeTab === 'dashboard' && (
            <Dashboard
              setActiveTab={setActiveTab}
              onOpenExperiment={handleOpenExperiment}
              onNewExperiment={handleNewExperiment}
              onNewFormulation={handleNewFormulation}
            />
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
            <FormulationsPage initialFormulationId={activeFormulationId || undefined} />
          )}

          {activeTab === 'approvals' && (
            <ApprovalsPage onOpenExperiment={handleOpenExperiment} />
          )}

          {activeTab === 'audit' && (
            <AuditLogPage />
          )}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <NotificationProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </NotificationProvider>
  );
}
