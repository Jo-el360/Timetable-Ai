import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Subject } from '../types';
import UploadIcon from './icons/UploadIcon';

type NewSubject = Omit<Subject, 'id'>;

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (subjects: NewSubject[]) => void;
}

interface ParsedRow {
  data: Partial<NewSubject>;
  isValid: boolean;
  error?: string;
}

const BulkImportModal: React.FC<BulkImportModalProps> = ({ isOpen, onClose, onImport }) => {
  const [inputText, setInputText] = useState('');
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!inputText) {
      setParsedRows([]);
      return;
    }

    const lines = inputText.split('\n').filter(line => line.trim() !== '');
    
    const newParsedRows: ParsedRow[] = lines.map(line => {
      const columns = line.split(',').map(c => c.trim());
      
      if (columns.length < 6 || columns.length > 7) {
        return { data: {}, isValid: false, error: `Expected 6 or 7 columns, found ${columns.length}.` };
      }

      const [name, teacher, department, semester, periodsStr, isLabStr, capacityStr] = columns;

      if (!name || !teacher || !department || !semester || !periodsStr || !isLabStr) {
        return { data: { name, teacher, department, semester }, isValid: false, error: 'One or more required fields are empty.' };
      }

      const periodsPerWeek = parseInt(periodsStr, 10);
      if (isNaN(periodsPerWeek) || periodsPerWeek < 1) {
        return { data: { name }, isValid: false, error: 'Periods Per Week must be a number greater than 0.' };
      }
      
      const isLab = isLabStr.toLowerCase() === 'true';

      let capacity: number | undefined = undefined;
      if (capacityStr) {
        capacity = parseInt(capacityStr, 10);
        if (isNaN(capacity) || capacity < 1) {
          return { data: { name }, isValid: false, error: 'Capacity must be a number greater than 0.' };
        }
      }

      const subject: NewSubject = { name, teacher, department, semester, periodsPerWeek, isLab, capacity };
      return { data: subject, isValid: true };
    });

    setParsedRows(newParsedRows);
  }, [inputText]);

  const validSubjectsCount = useMemo(() => parsedRows.filter(r => r.isValid).length, [parsedRows]);

  const handleImport = () => {
    const validSubjects = parsedRows
      .filter(row => row.isValid)
      .map(row => row.data as NewSubject);
    if (validSubjects.length > 0) {
      onImport(validSubjects);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result;
        setInputText(typeof text === 'string' ? text : '');
      };
      reader.readAsText(file);
    }
    // Reset file input value to allow re-uploading the same file
    if (event.target) {
      event.target.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Bulk Import Subjects</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Import from CSV text. Each line should contain one subject.</p>
        </div>
        <div className="p-6 flex-grow overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Instructions & Input</h3>
            <div className="mt-2 p-3 bg-slate-100 dark:bg-slate-900/50 rounded-md text-xs text-slate-600 dark:text-slate-400">
              <p className="font-bold">Required Format (CSV):</p>
              <code className="block whitespace-pre-wrap">Subject Name,Teacher Name,Department,Semester,Periods Per Week,Is Lab,Capacity (optional)</code>
              <ul className="list-disc list-inside mt-1 pl-2 space-y-1">
                <li>For regular classes (<code className="text-xs">Is Lab = false</code>), "Periods Per Week" is the total number of single-period classes.</li>
                <li>For labs (<code className="text-xs">Is Lab = true</code>), "Periods Per Week" is the total number of <strong>continuous periods</strong> for that one lab session (e.g., 3 for a single 3-period lab).</li>
              </ul>
              <p className="font-bold mt-2">Example:</p>
              <code className="block whitespace-pre-wrap">Quantum Physics,Dr. Reed,Physics,3rd Sem,4,false,50{"\n"}Electronics Lab,Dr. Singh,Electronics,5th Sem,3,true,20</code>
            </div>
            <textarea
              className="mt-4 w-full h-48 p-3 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono text-sm"
              placeholder="Paste CSV data here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              aria-label="Paste CSV data for subjects"
            />
             <input type="file" accept=".csv, .txt" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
             <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors"
             >
                <UploadIcon className="w-5 h-5" />
                Upload File (.csv, .txt)
             </button>
          </div>
          <div className="flex flex-col">
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Preview ({validSubjectsCount} valid)</h3>
            <div className="mt-2 flex-grow overflow-y-auto border border-slate-200 dark:border-slate-700 rounded-md">
              {parsedRows.length > 0 ? (
                <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                  {parsedRows.map((row, index) => (
                    <li key={index} className={`p-3 text-sm ${!row.isValid ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                      <div className="flex items-start">
                        <span className={`mr-3 mt-0.5 w-4 h-4 flex-shrink-0 font-bold ${row.isValid ? 'text-green-500' : 'text-red-500'}`}>
                          {row.isValid ? '✓' : '✗'}
                        </span>
                        <div>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{row.data.name || <span className="italic text-slate-500">No Name</span>}</p>
                          <p className="text-xs text-slate-500 dark:text-slate-400">
                            {row.data.teacher || 'N/A'} &bull; {row.data.department || 'N/A'} &bull; {row.data.semester || 'N/A'}
                          </p>
                          {!row.isValid && <p className="mt-1 text-xs font-semibold text-red-600 dark:text-red-400">{row.error}</p>}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center justify-center h-full text-sm text-slate-500 dark:text-slate-400">
                  <p>Preview will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end gap-4">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-700 transition-colors">
            Cancel
          </button>
          <button 
            type="button" 
            onClick={handleImport}
            disabled={validSubjectsCount === 0}
            className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Import {validSubjectsCount} Subjects
          </button>
        </div>
      </div>
    </div>
  );
};

export default BulkImportModal;