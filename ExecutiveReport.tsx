import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './components/Login';
import { Layout } from './components/Layout';
import { DepartmentDashboard } from './components/DepartmentDashboard';
import { DepartmentDataEntry } from './components/DepartmentDataEntry';
import { Master1Report } from './components/Master1Report';
import { ExecutiveReport } from './components/ExecutiveReport';
import { ComplianceScoring } from './components/ComplianceScoring';
import { ComplianceOverview } from './components/ComplianceOverview';
import { AdminDashboard } from './components/AdminDashboard';
import { AdminDepartments } from './components/AdminDepartments';
import { AdminSettings } from './components/AdminSettings';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const handlePageChange = (page: string) => {
    setCurrentPage(page);
    if (page !== 'department-detail') {
      setSelectedDepartmentId(null);
    }
  };

  const renderContent = () => {
    if (user.role === 'admin') {
      if (currentPage === 'dashboard') {
        return <AdminDashboard onNavigate={handlePageChange} />;
      }
      if (currentPage === 'departments') {
        return (
          <AdminDepartments
            onViewDepartment={(id) => {
              setSelectedDepartmentId(id);
              setCurrentPage('department-detail');
            }}
          />
        );
      }
      if (currentPage === 'department-detail' && selectedDepartmentId) {
        return (
          <DepartmentDataEntry
            departmentId={selectedDepartmentId}
            departmentName={`Department`}
          />
        );
      }
      if (currentPage === 'master1') {
        return <Master1Report />;
      }
      if (currentPage === 'executive-report') {
        return <ExecutiveReport />;
      }
      if (currentPage === 'compliance-overview') {
        return <ComplianceOverview />;
      }
      if (currentPage === 'settings') {
        return <AdminSettings />;
      }
    }

    if (user.role === 'department') {
      if (currentPage === 'dashboard') {
        return (
          <DepartmentDashboard
            departmentId={user.departmentId!}
            departmentName={user.name}
            onViewDataEntry={() => setCurrentPage('data-entry')}
          />
        );
      }
      if (currentPage === 'data-entry') {
        return (
          <DepartmentDataEntry
            departmentId={user.departmentId!}
            departmentName={user.name}
          />
        );
      }
      if (currentPage === 'executive-summary') {
        return (
          <DepartmentDataEntry
            departmentId={user.departmentId!}
            departmentName={user.name}
          />
        );
      }
    }

    if (user.role === 'monitor') {
      if (currentPage === 'dashboard') {
        return (
          <div className="p-6">
            <h1 className="text-3xl font-bold text-white">{user.name}</h1>
            <p className="text-slate-400 mt-1">Monitoring Head Dashboard</p>
            <div className="mt-8 grid grid-cols-2 gap-4">
              <div
                className="p-6 bg-slate-800/30 border border-slate-700/50 rounded-xl cursor-pointer hover:border-blue-500/50"
                onClick={() => setCurrentPage('compliance')}
              >
                <h3 className="text-xl font-bold text-white">Compliance Scoring</h3>
                <p className="text-slate-400 mt-2">Score departments on compliance metrics</p>
              </div>
            </div>
          </div>
        );
      }
      if (currentPage === 'compliance') {
        return (
          <ComplianceScoring
            monitorId={user.monitorId!}
            monitorName={user.name}
          />
        );
      }
    }

    return <div className="p-6 text-white">Page not found</div>;
  };

  return (
    <Layout currentPage={currentPage} onPageChange={handlePageChange}>
      {renderContent()}
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
