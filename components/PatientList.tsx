'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Search,
  Edit,
  Trash2,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  UserPlus,
  AlertCircle,
  Upload,
  FileSpreadsheet,
  CheckCircle,
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { patientAPI } from '@/lib/api';

interface Patient {
  id: string;
  idCard: string;
  name: string;
  charges: number;
  visitCount: number;
  createdAt: string;
  type?: 'child' | 'man' | 'woman';
  dateOfBirth?: string;
}

// Helper function to calculate age from date of birth
const calculateAge = (dateOfBirth: string | undefined): string => {
  if (!dateOfBirth) return '-';
  
  try {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age.toString();
  } catch (error) {
    return '-';
  }
};

// Helper function to format type display
const formatType = (type: string | undefined): string => {
  if (!type) return '-';
  return type.charAt(0).toUpperCase() + type.slice(1);
};

interface PatientListProps {
  onViewPatient: (patientId: string) => void;
  onEditPatient: (patient: Patient) => void;
  onCreatePatient: () => void;
  refreshTrigger: number;
}

export default function PatientList({
  onViewPatient,
  onEditPatient,
  onCreatePatient,
  refreshTrigger,
}: PatientListProps) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [isExportingCsv, setIsExportingCsv] = useState(false);
  const [isExportingExcel, setIsExportingExcel] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const [selectedPatients, setSelectedPatients] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const limit = 10;

  const fetchPatients = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await patientAPI.getAll(currentPage, limit, searchTerm);
      setPatients(data.patients || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotal(data.pagination?.total || 0);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch patients');
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
    // Clear selection when page changes or search changes
    setSelectedPatients(new Set());
  }, [currentPage, searchTerm, refreshTrigger]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPatients();
  };

  const handleDelete = async (patientId: string, patientName: string) => {
    if (!confirm(`Are you sure you want to delete ${patientName}? This will also delete all associated visits.`)) {
      return;
    }

    try {
      await patientAPI.delete(patientId);
      setSelectedPatients((prev) => {
        const newSet = new Set(prev);
        newSet.delete(patientId);
        return newSet;
      });
      fetchPatients();
    } catch (err: any) {
      alert(err.message || 'Failed to delete patient');
    }
  };

  // Handle select/deselect individual patient
  const handleSelectPatient = (patientId: string) => {
    setSelectedPatients((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(patientId)) {
        newSet.delete(patientId);
      } else {
        newSet.add(patientId);
      }
      return newSet;
    });
  };

  // Handle select all patients on current page
  const handleSelectAll = () => {
    if (selectedPatients.size === patients.length && patients.length > 0) {
      // Deselect all
      setSelectedPatients(new Set());
    } else {
      // Select all on current page
      const allIds = new Set(patients.map((p) => p.id));
      setSelectedPatients(allIds);
    }
  };

  // Handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedPatients.size === 0) {
      alert('Please select at least one patient to delete.');
      return;
    }

    const selectedCount = selectedPatients.size;
    const patientNames = patients
      .filter((p) => selectedPatients.has(p.id))
      .map((p) => p.name)
      .join(', ');

    if (
      !confirm(
        `Are you sure you want to delete ${selectedCount} patient(s)?\n\nThis will also delete all associated visits.\n\nSelected: ${patientNames}`
      )
    ) {
      return;
    }

    setIsDeleting(true);
    try {
      // Delete all selected patients
      const deletePromises = Array.from(selectedPatients).map((id) =>
        patientAPI.delete(id).catch((err) => {
          console.error(`Failed to delete patient ${id}:`, err);
          return { error: err.message, id };
        })
      );

      const results = await Promise.allSettled(deletePromises);
      const failed = results.filter((r) => r.status === 'rejected').length;

      if (failed > 0) {
        alert(
          `Deleted ${selectedCount - failed} patient(s) successfully. ${failed} patient(s) failed to delete.`
        );
      } else {
        alert(`Successfully deleted ${selectedCount} patient(s).`);
      }

      // Clear selection and refresh
      setSelectedPatients(new Set());
      fetchPatients();
    } catch (err: any) {
      alert(err.message || 'Failed to delete patients');
    } finally {
      setIsDeleting(false);
    }
  };

  const getExportData = async (): Promise<Patient[]> => {
    const data = await patientAPI.getAll(1, 1000, '');
    return data.patients || [];
  };

  const handleExportCsv = async () => {
    try {
      setIsExportingCsv(true);
      setImportMessage(null);

      // Fetch a large page of patients for export
      const items = await getExportData();

      if (!items.length) {
        alert('No patients to export.');
        return;
      }

      const header = ['idCard', 'name', 'type', 'dateOfBirth', 'charges', 'visitCount', 'createdAt'];
      const rows = items.map((p) => [
        p.idCard,
        p.name,
        p.type || '',
        p.dateOfBirth || '',
        (p.charges ?? 0).toString(),
        (p.visitCount ?? 0).toString(),
        p.createdAt,
      ]);

      const toCsvValue = (value: string) => {
        const needsQuotes = /[",\n]/.test(value);
        let escaped = value.replace(/"/g, '""');
        if (needsQuotes) {
          escaped = `"${escaped}"`;
        }
        return escaped;
      };

      const csv = [header, ...rows]
        .map((row) => row.map((cell) => toCsvValue(String(cell ?? ''))).join(','))
        .join('\n');

      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'patients.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export patients error:', err);
      alert(err.message || 'Failed to export patients');
    } finally {
      setIsExportingCsv(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      setIsExportingExcel(true);
      setImportMessage(null);

      const items = await getExportData();

      if (!items.length) {
        alert('No patients to export.');
        return;
      }

      const rows = items.map((p) => ({
        'CNIC Number': p.idCard,
        'Total Visits': p.visitCount ?? 0,
        'Registered On': new Date(p.createdAt).toLocaleString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        }),
      }));

      const worksheet = XLSX.utils.json_to_sheet(rows);

      // Auto column width
      worksheet['!cols'] = [
        { wch: 20 }, // CNIC Number
        { wch: 14 }, // Total Visits
        { wch: 24 }, // Registered On
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Patients');

      const wbout = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
      const blob = new Blob([wbout], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `patients_${new Date().toISOString().split('T')[0]}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Export patients (Excel) error:', err);
      alert(err.message || 'Failed to export patients to Excel');
    } finally {
      setIsExportingExcel(false);
    }
  };

  const handleImportClick = () => {
    setImportMessage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setImportMessage(null);

    try {
      const fileName = file.name.toLowerCase();
      const isExcel =
        fileName.endsWith('.xlsx') ||
        fileName.endsWith('.xls') ||
        file.type ===
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

      let rows: Array<Record<string, any>> = [];

      if (isExcel) {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as Array<
          Record<string, any>
        >;
      } else {
        // Fallback to CSV parsing
        const text = await file.text();
        const lines = text
          .split(/\r?\n/)
          .map((l) => l.trim())
          .filter((l) => l.length > 0);

        if (lines.length < 2) {
          throw new Error('CSV must contain a header and at least one row.');
        }

        const header = lines[0].split(',').map((h) => h.trim());

        for (let i = 1; i < lines.length; i++) {
          const rawRow = lines[i];
          if (!rawRow) continue;

          const cols = rawRow.split(',').map((c) => c.trim());
          const row: Record<string, string> = {};
          header.forEach((key, idx) => {
            row[key] = cols[idx] ?? '';
          });
          rows.push(row);
        }
      }

      if (!rows.length) {
        throw new Error('File does not contain any data rows.');
      }

      const normalizeKey = (k: string) =>
        k.toLowerCase().replace(/[\s_\-]+/g, '');

      const sample = rows[0];
      const keys = Object.keys(sample);

      // Support both our exported format ("CNIC Number") and raw formats ("idCard", "id_card", etc.)
      const idCardKey =
        keys.find((k) => normalizeKey(k) === 'cnicnumber') ||
        keys.find((k) => normalizeKey(k) === 'idcard') ||
        keys.find((k) => normalizeKey(k) === 'cnic') ||
        keys.find((k) => normalizeKey(k) === 'id');

      const visitCountKey =
        keys.find((k) => normalizeKey(k) === 'totalvisits') ||
        keys.find((k) => normalizeKey(k) === 'visitcount') ||
        keys.find((k) => normalizeKey(k) === 'visits');

      if (!idCardKey) {
        throw new Error(
          'File must have a CNIC column. Expected header: "CNIC Number" (from export) or "idCard".'
        );
      }

      // Prepare patients array for bulk import
      const patientsToImport: Array<{
        idCard: string;
        name: string;
        visitCount?: number;
      }> = [];

      for (const row of rows) {
        const idCard = String(row[idCardKey] ?? '').trim();

        // Skip empty rows
        if (!idCard) continue;

        const visitCountRaw =
          visitCountKey && row[visitCountKey] !== undefined
            ? String(row[visitCountKey])
            : '';
        const visitCountValue = visitCountRaw ? Number(visitCountRaw) : undefined;

        patientsToImport.push({
          idCard,
          name: idCard, // name not collected — use CNIC as fallback
          ...(visitCountValue !== undefined &&
            !isNaN(visitCountValue) &&
            Number.isInteger(visitCountValue) && { visitCount: visitCountValue }),
        });
      }

      if (patientsToImport.length === 0) {
        throw new Error('No valid patients found in the file. Each row must have idCard and name.');
      }

      // Call bulk import API
      const result = await patientAPI.bulkImport(patientsToImport);

      // Format import message with detailed results
      const { successCount, failedCount, success, failed } = result.results;
      
      let message = `Import completed: ${successCount} succeeded`;
      if (failedCount > 0) {
        message += `, ${failedCount} failed`;
      }

      // Add details about failed imports if any
      if (failed && failed.length > 0) {
        const failedDetails = failed.slice(0, 5).map((f: any) => 
          `Row ${f.index + 1} (${f.idCard || 'N/A'}): ${f.error}`
        ).join('; ');
        message += failed.length > 5 
          ? `. First 5 errors: ${failedDetails}...` 
          : `. Errors: ${failedDetails}`;
      }

      setImportMessage(message);
      // Refresh list after import
      fetchPatients();
    } catch (err: any) {
      console.error('Import patients error:', err);
      const errorMessage = err.message || 'Failed to import patients';
      setImportMessage(`Import failed: ${errorMessage}`);
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".csv,.xlsx,.xls"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Patients</h2>
          <p className="text-gray-600 mt-1 text-sm sm:text-base">
            Manage your clinic patients.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {selectedPatients.size > 0 && (
            <button
              type="button"
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 bg-red-500 text-white rounded-lg sm:rounded-xl text-xs sm:text-sm hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              {isDeleting ? (
                <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
              <span className="hidden sm:inline">Delete Selected ({selectedPatients.size})</span>
              <span className="sm:hidden">Delete ({selectedPatients.size})</span>
            </button>
          )}
          <button
            type="button"
            onClick={handleImportClick}
            disabled={isImporting}
            className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg sm:rounded-xl text-xs sm:text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isImporting ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <Upload className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
            <span className="hidden sm:inline">Import Excel</span>
            <span className="sm:hidden">Import</span>
          </button>
          
          <button
            type="button"
            onClick={handleExportExcel}
            disabled={isExportingExcel}
            className="flex items-center space-x-1 sm:space-x-2 px-2 sm:px-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg sm:rounded-xl text-xs sm:text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {isExportingExcel ? (
              <Loader2 className="h-3 w-3 sm:h-4 sm:w-4 animate-spin" />
            ) : (
              <FileSpreadsheet className="h-3 w-3 sm:h-4 sm:w-4" />
            )}
            <span className="hidden sm:inline">Export Excel</span>
            <span className="sm:hidden">Export</span>
          </button>
          <button
            onClick={onCreatePatient}
            className="flex items-center space-x-1 sm:space-x-2 px-3 sm:px-4 py-1.5 sm:py-2 bg-gradient-to-r from-teal-500 to-blue-500 text-white rounded-lg sm:rounded-xl hover:from-teal-600 hover:to-blue-600 transition-all duration-200 shadow-lg hover:shadow-xl text-xs sm:text-sm"
          >
            <UserPlus className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Add Patient</span>
            <span className="sm:hidden">Add</span>
          </button>
        </div>
      </div>

      {importMessage && (
        <div className={`text-sm rounded-xl px-4 py-3 border ${
          importMessage.includes('failed') || importMessage.includes('error')
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          <div className="flex items-start space-x-2">
            {importMessage.includes('failed') || importMessage.includes('error') ? (
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            ) : (
              <CheckCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            )}
            <div className="flex-1">
              <p className="font-medium">{importMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-2 sm:pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name or ID card..."
            className="block w-full text-black pl-8 sm:pl-10 pr-2 sm:pr-3 py-1.5 sm:py-2 border border-gray-300 rounded-lg sm:rounded-xl bg-white text-sm sm:text-base text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>
        <button
          type="submit"
          className="px-3 sm:px-6 py-1.5 sm:py-2 bg-teal-500 text-white rounded-lg sm:rounded-xl hover:bg-teal-600 transition-colors text-xs sm:text-sm"
        >
          <span className="hidden sm:inline">Search</span>
          <span className="sm:hidden">🔍</span>
        </button>
      </form>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
        </div>
      ) : (
        <>
          {/* Patients table */}
          {patients.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 rounded-xl">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No patients found</p>
              <button
                onClick={onCreatePatient}
                className="mt-4 text-teal-600 hover:text-teal-700 font-medium"
              >
                Add your first patient
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                          <input
                            type="checkbox"
                            checked={patients.length > 0 && selectedPatients.size === patients.length}
                            onChange={handleSelectAll}
                            className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                          />
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          ID Card
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Visits
                        </th>
                        <th className="px-4 lg:px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {patients.map((patient) => (
                        <tr key={patient.id} className="hover:bg-gray-50">
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={selectedPatients.has(patient.id)}
                              onChange={() => handleSelectPatient(patient.id)}
                              className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                            />
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {patient.idCard}
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {patient.name}
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <span className="px-2 py-1 bg-teal-100 text-teal-800 rounded-full text-xs font-medium">
                              {patient.visitCount || 0}
                            </span>
                          </td>
                          <td className="px-4 lg:px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => onViewPatient(patient.id)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => onEditPatient(patient)}
                                className="p-2 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                                title="Edit CNIC"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(patient.id, patient.name)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {patients.map((patient) => (
                  <div key={patient.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={selectedPatients.has(patient.id)}
                          onChange={() => handleSelectPatient(patient.id)}
                          className="rounded border-gray-300 text-teal-600 focus:ring-teal-500 mt-1"
                        />
                        <div>
                          <h3 className="font-semibold text-gray-900 text-sm">{patient.name}</h3>
                          <p className="text-xs text-gray-500">ID: {patient.idCard}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onViewPatient(patient.id)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => onEditPatient(patient)}
                          className="p-1.5 text-teal-600 hover:bg-teal-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(patient.id, patient.name)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Visits:</span>
                        <span className="ml-1 px-2 py-0.5 bg-teal-100 text-teal-800 rounded-full font-medium">
                          {patient.visitCount || 0}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Pagination - Desktop */}
              {totalPages > 1 && (
                <div className="hidden md:flex px-4 lg:px-6 py-4 border-t border-gray-200 items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Showing {(currentPage - 1) * limit + 1} to{' '}
                    {Math.min(currentPage * limit, total)} of {total} patients
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <span className="px-4 py-2 text-sm text-gray-700">
                      Page {currentPage} of {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Pagination - Mobile */}
              {totalPages > 1 && (
                <div className="md:hidden px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                  <div className="text-xs text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

