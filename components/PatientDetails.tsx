'use client';

import { useState, useEffect } from 'react';
import {
  X,
  Loader2,
  AlertCircle,
  Plus,
  CheckCircle,
  Clock,
  DollarSign,
  Calendar,
  FileText,
  AlertTriangle,
} from 'lucide-react';
import { patientAPI, visitAPI } from '@/lib/api';

interface Visit {
  id: string;
  visitNumber: number;
  isFreeVisit: boolean;
  charges: number;
  paid: boolean;
  notes: string;
  createdAt: string;
}

interface Patient {
  id: string;
  idCard: string;
  name: string;
  charges: number;
  visitCount: number;
  type?: 'child' | 'man' | 'woman';
  dateOfBirth?: string;
}

interface PatientDetailsProps {
  patientId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

// ─── Visit Limit Modal ────────────────────────────────────────────────────────
function VisitLimitModal({
  isOpen,
  patientName,
  onClose,
}: {
  isOpen: boolean;
  patientName: string;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-4">
        <div className="flex items-center justify-center w-14 h-14 bg-red-100 rounded-full mx-auto">
          <AlertTriangle className="h-7 w-7 text-red-600" />
        </div>
        <div className="text-center">
          <h3 className="text-lg font-bold text-gray-800">Visit Limit Reached</h3>
          <p className="mt-2 text-sm text-gray-600">
            <span className="font-semibold text-gray-800">{patientName}</span> has already
            used all <span className="font-semibold">2 allowed visits</span> this month.
          </p>
          <p className="mt-1 text-xs text-gray-500">
            No more visits can be recorded until next month.
          </p>
        </div>
        <button
          onClick={onClose}
          className="w-full px-4 py-2.5 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-xl hover:from-teal-600 hover:to-blue-600 transition-all duration-200 font-medium text-sm"
        >
          Got it
        </button>
      </div>
    </div>
  );
}
// ─────────────────────────────────────────────────────────────────────────────

const MAX_VISITS_PER_MONTH = 2;

export default function PatientDetails({
  patientId,
  isOpen,
  onClose,
  onRefresh,
}: PatientDetailsProps) {
  const [patient, setPatient] = useState<Patient | null>(null);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [remainingFreeVisits, setRemainingFreeVisits] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showVisitForm, setShowVisitForm] = useState(false);
  const [visitFormData, setVisitFormData] = useState({ notes: '', charges: 0 });
  const [submittingVisit, setSubmittingVisit] = useState(false);
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [monthlyVisitCount, setMonthlyVisitCount] = useState(0);

  useEffect(() => {
    if (isOpen && patientId) {
      fetchPatientDetails();
    }
    // Reset visit form when modal closes
    if (!isOpen) {
      setShowVisitForm(false);
      setVisitFormData({ notes: '', charges: 0 });
    }
  }, [isOpen, patientId]);

  const fetchPatientDetails = async () => {
    if (!patientId) return;
    setLoading(true);
    setError('');
    try {
      const data = await patientAPI.getById(patientId);
      setPatient(data.patient);
      setVisits(data.visits || []);
      setRemainingFreeVisits(data.remainingFreeVisitsThisMonth ?? 0);
      setMonthlyVisitCount(data.monthlyVisitCount ?? 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch patient details');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordVisitClick = () => {
    // Check monthly visit limit before showing form
    if (monthlyVisitCount >= MAX_VISITS_PER_MONTH) {
      setShowLimitModal(true);
      return;
    }
    setShowVisitForm(!showVisitForm);
  };

  const handleRecordVisit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!patientId) return;

    setSubmittingVisit(true);
    try {
      await visitAPI.record(patientId, visitFormData);
      setShowVisitForm(false);
      setVisitFormData({ notes: '', charges: 0 });
      fetchPatientDetails();
      onRefresh();
    } catch (err: any) {
      // Backend also enforces the limit — show modal instead of plain alert
      if (err.message?.toLowerCase().includes('limit')) {
        setShowVisitForm(false);
        setShowLimitModal(true);
      } else {
        setError(err.message || 'Failed to record visit');
      }
    } finally {
      setSubmittingVisit(false);
    }
  };

  const handleMarkPaid = async (visitId: string) => {
    try {
      await visitAPI.markPaid(visitId);
      fetchPatientDetails();
    } catch (err: any) {
      setError(err.message || 'Failed to mark visit as paid');
    }
  };

  const formatDate = (dateString: string) => {
    // Ensure UTC is parsed correctly — append Z if missing
    const normalized = dateString.endsWith('Z') || dateString.includes('+')
      ? dateString
      : dateString + 'Z';
    return new Date(normalized).toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZoneName: 'short',
    });
  };

  const isLimitReached = monthlyVisitCount >= MAX_VISITS_PER_MONTH;

  if (!isOpen) return null;

  return (
    <>
      {/* Visit Limit Modal */}
      <VisitLimitModal
        isOpen={showLimitModal}
        patientName={patient?.name || 'This patient'}
        onClose={() => setShowLimitModal(false)}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/50 overflow-y-auto">
        <div className="bg-white rounded-lg sm:rounded-xl md:rounded-2xl shadow-xl w-full max-w-4xl my-4 sm:my-8">
          {/* Header */}
          <div className="flex items-center justify-between p-4 sm:p-5 md:p-6 border-b border-gray-200">
            <div className="flex-1 min-w-0 pr-2">
              <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800 truncate">
                Patient Details
              </h2>
              {patient && (
                <p className="text-gray-600 mt-1 text-xs sm:text-sm truncate">
                  {patient.name} — CNIC: {patient.idCard}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-gray-100 transition-colors flex-shrink-0"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-600" />
            </button>
          </div>

          {/* Content */}
          <div className="p-4 sm:p-5 md:p-6">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
              </div>
            ) : error ? (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            ) : patient ? (
              <div className="space-y-4 sm:space-y-6">
                {/* Patient Info Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                  <div className="bg-gradient-to-br from-teal-50 to-blue-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="p-1.5 sm:p-2 bg-teal-500 rounded-lg">
                        <FileText className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">Total Visits</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-800">
                          {patient.visitCount || 0}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="p-1.5 sm:p-2 bg-green-500 rounded-lg">
                        <CheckCircle className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">This Month</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-800">
                          {monthlyVisitCount} / {MAX_VISITS_PER_MONTH}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg sm:rounded-xl p-3 sm:p-4">
                    <div className="flex items-center space-x-2 sm:space-x-3">
                      <div className="p-1.5 sm:p-2 bg-blue-500 rounded-lg">
                        <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                      </div>
                      <div>
                        <p className="text-xs sm:text-sm text-gray-600">Default Charges</p>
                        <p className="text-xl sm:text-2xl font-bold text-gray-800">
                          ${patient.charges || 0}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monthly limit warning banner */}
                {isLimitReached && (
                  <div className="flex items-center space-x-3 bg-red-50 border border-red-200 rounded-xl p-3 sm:p-4">
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <p className="text-red-700 text-xs sm:text-sm font-medium">
                      Monthly visit limit reached ({MAX_VISITS_PER_MONTH}/{MAX_VISITS_PER_MONTH}). No more visits this month.
                    </p>
                  </div>
                )}

                {/* Record Visit Button */}
                <div className="flex justify-end">
                  <button
                    onClick={handleRecordVisitClick}
                    className={`flex items-center justify-center space-x-2 px-4 py-2 rounded-lg sm:rounded-xl transition-all duration-200 text-sm font-medium ${
                      isLimitReached
                        ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-teal-500 to-blue-500 text-white hover:from-teal-600 hover:to-blue-600 shadow-sm hover:shadow-md'
                    }`}
                  >
                    <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                    <span>Record Visit</span>
                  </button>
                </div>

                {/* Visit Form */}
                {showVisitForm && !isLimitReached && (
                  <div className="bg-gray-50 rounded-lg sm:rounded-xl p-3 sm:p-4 border border-gray-200">
                    <h3 className="font-semibold text-gray-800 mb-3 sm:mb-4 text-sm sm:text-base">
                      Record New Visit
                    </h3>
                    <form onSubmit={handleRecordVisit} className="space-y-3 sm:space-y-4">
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Notes
                        </label>
                        <textarea
                          value={visitFormData.notes}
                          onChange={(e) =>
                            setVisitFormData({ ...visitFormData, notes: e.target.value })
                          }
                          className="w-full text-black px-3 sm:px-4 py-2 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                          rows={3}
                          placeholder="Visit notes..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-2">
                          Charges (if applicable)
                        </label>
                        <input
                          type="number"
                          value={visitFormData.charges}
                          onChange={(e) =>
                            setVisitFormData({
                              ...visitFormData,
                              charges: parseFloat(e.target.value) || 0,
                            })
                          }
                          min="0"
                          step="0.01"
                          className="w-full text-black px-3 sm:px-4 py-2 border border-gray-300 rounded-lg sm:rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setShowVisitForm(false);
                            setVisitFormData({ notes: '', charges: 0 });
                          }}
                          className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-lg sm:rounded-xl text-gray-700 hover:bg-gray-50 text-sm"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={submittingVisit}
                          className="w-full sm:w-auto px-3 sm:px-4 py-2 bg-teal-500 text-white rounded-lg sm:rounded-xl hover:bg-teal-600 disabled:opacity-50 flex items-center justify-center space-x-2 text-sm"
                        >
                          {submittingVisit && <Loader2 className="h-4 w-4 animate-spin" />}
                          <span>Record Visit</span>
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Visits List */}
                <div>
                  <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4">
                    Visit History
                  </h3>
                  {visits.length === 0 ? (
                    <div className="text-center py-6 sm:py-8 bg-gray-50 rounded-lg sm:rounded-xl">
                      <Calendar className="h-8 w-8 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-2" />
                      <p className="text-gray-600 text-sm sm:text-base">No visits recorded yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2 sm:space-y-3">
                      {visits.map((visit) => (
                        <div
                          key={visit.id}
                          className="bg-white border border-gray-200 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:shadow-md transition-shadow"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 sm:gap-0">
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-2">
                                <span className="px-2 sm:px-3 py-1 bg-teal-100 text-teal-800 rounded-full text-xs sm:text-sm font-medium">
                                  Visit #{visit.visitNumber}
                                </span>
                                {visit.isFreeVisit && (
                                  <span className="px-2 sm:px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs sm:text-sm font-medium">
                                    Free Visit
                                  </span>
                                )}
                                <span
                                  className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
                                    visit.paid
                                      ? 'bg-green-100 text-green-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {visit.paid ? (
                                    <span className="flex items-center space-x-1">
                                      <CheckCircle className="h-3 w-3" />
                                      <span>Paid</span>
                                    </span>
                                  ) : (
                                    <span className="flex items-center space-x-1">
                                      <Clock className="h-3 w-3" />
                                      <span>Unpaid</span>
                                    </span>
                                  )}
                                </span>
                              </div>
                              <p className="text-gray-600 mb-2 text-xs sm:text-sm">
                                {visit.notes || 'No notes'}
                              </p>
                              <div className="flex flex-col sm:flex-row sm:items-center sm:space-x-4 gap-1 sm:gap-0 text-xs sm:text-sm text-gray-500">
                                <span>Charges: ${visit.charges}</span>
                                <span>{formatDate(visit.createdAt)}</span>
                              </div>
                            </div>
                            {!visit.paid && !visit.isFreeVisit && (
                              <button
                                onClick={() => handleMarkPaid(visit.id)}
                                className="w-full sm:w-auto px-3 sm:px-4 py-1.5 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs sm:text-sm"
                              >
                                Mark Paid
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
