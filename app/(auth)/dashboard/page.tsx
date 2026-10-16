'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import PatientList from '@/components/PatientList';
import PatientForm from '@/components/PatientForm';
import PatientDetails from '@/components/PatientDetails';
import { authAPI } from '@/lib/api';
import { Loader2 } from 'lucide-react';

interface Patient {
  id: string;
  idCard: string;
  name: string;
  charges?: number;
}

export default function DashboardPage() {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showPatientForm, setShowPatientForm] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!authAPI.isAuthenticated()) {
        router.push('/signin');
      } else {
        setIsCheckingAuth(false);
      }
    }
  }, [router]);

  const handleCreatePatient = useCallback(() => {
    setSelectedPatient(null);
    setShowPatientForm(true);
  }, []);

  const handleEditPatient = useCallback((patient: Patient) => {
    setSelectedPatient(patient);
    setShowPatientForm(true);
  }, []);

  const handleViewPatient = useCallback((patientId: string) => {
    setSelectedPatientId(patientId);
  }, []);

  // Called after any create/update — increments trigger so PatientList re-fetches
  const handleFormSuccess = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1);
  }, []);

  const handleCloseForm = useCallback(() => {
    setShowPatientForm(false);
    setSelectedPatient(null);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setSelectedPatientId(null);
  }, []);

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onToggle={() => setSidebarOpen(!sidebarOpen)} />
      <div className="lg:pl-64">
        <TopBar onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
        <main className="p-4 lg:p-6">
          <PatientList
            onViewPatient={handleViewPatient}
            onEditPatient={handleEditPatient}
            onCreatePatient={handleCreatePatient}
            refreshTrigger={refreshTrigger}
          />
        </main>
      </div>

      {/* Patient Form Modal */}
      <PatientForm
        patient={selectedPatient}
        isOpen={showPatientForm}
        onClose={handleCloseForm}
        onSuccess={handleFormSuccess}
      />

      {/* Patient Details Modal */}
      <PatientDetails
        patientId={selectedPatientId}
        isOpen={!!selectedPatientId}
        onClose={handleCloseDetails}
        onRefresh={handleFormSuccess}
      />
    </div>
  );
}
