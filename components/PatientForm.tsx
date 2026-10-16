'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, AlertCircle } from 'lucide-react';
import { patientAPI } from '@/lib/api';

interface Patient {
  id?: string;
  idCard: string;
}

interface PatientFormProps {
  patient?: Patient | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function PatientForm({
  patient,
  isOpen,
  onClose,
  onSuccess,
}: PatientFormProps) {
  const [idCard, setIdCard] = useState('');
  const [idCardError, setIdCardError] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const isEditMode = !!patient?.id;

  useEffect(() => {
    setIdCard(patient?.idCard || '');
    setIdCardError('');
    setError('');
  }, [patient, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!idCard.trim()) {
      setIdCardError('CNIC Number is required');
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isEditMode && patient?.id) {
        // Update existing patient's CNIC
        await patientAPI.updateCnic(patient.id, idCard.trim());
      } else {
        // Create new patient
        await patientAPI.create({
          idCard: idCard.trim(),
          name: idCard.trim(),
          dateOfBirth: new Date().toISOString().split('T')[0],
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to save patient');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-bold text-gray-800">
            {isEditMode ? 'Edit CNIC' : 'Add New Patient'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5 text-gray-600" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center space-x-2">
              <AlertCircle className="h-4 w-4 text-red-600 flex-shrink-0" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          )}

          {/* CNIC Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              CNIC Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={idCard}
              onChange={(e) => {
                setIdCard(e.target.value);
                setIdCardError('');
                setError('');
              }}
              className={`w-full px-4 py-2.5 border text-black rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 text-sm transition-colors ${
                idCardError ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
              }`}
              placeholder="e.g. 3520112345671"
              autoFocus
            />
            {idCardError && (
              <p className="mt-1 text-xs text-red-600">{idCardError}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-xl hover:from-teal-600 hover:to-blue-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2 text-sm"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" />}
              <span>{isEditMode ? 'Update' : 'Add Patient'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
