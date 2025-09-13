import React, { useState, useMemo, useEffect } from 'react';
import { Subject } from '../types';

interface AddPeriodModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onAddPeriod: (subject: Subject) => void;
}

const AddPeriodModal: React.FC<AddPeriodModalProps> = ({ isOpen, onClose, subjects, onAddPeriod }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredAndGroupedSubjects = useMemo(() => {
    const filtered = subjects.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.teacher.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return filtered.reduce<Record<string, Record<string, Subject[]>>>((acc, subject) => {
      const { department, semester } = subject;
      if (!acc[department]) acc[department] = {};
      if (!acc[department][semester]) acc[department][semester] = [];
      acc[department][semester].push(subject);
      return acc;
    }, {});
  }, [subjects, searchTerm]);

  // Fix: Imported useEffect from React to resolve reference error.
  useEffect(() => {
    // Reset search term when modal opens
    if (isOpen) {
      setSearchTerm('');
    }
  }, [isOpen]);

  if (!isOpen) {
    return null;
  }

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 border-b border-slate-200 dark:border-slate-700">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Period</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Select a subject to add to the timetable.</p>
          <input 
            type="text"
            placeholder="Search by subject name or teacher..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mt-4 w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        <div className="p-6 flex-grow overflow-y-auto">
          {Object.keys(filteredAndGroupedSubjects).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(filteredAndGroupedSubjects).map(([department, semesters]) => (
                <div key={department}>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">{department}</h3>
                  {Object.entries(semesters).map(([semester, subjectList]) => (
                    <div key={semester} className="mt-2 pl-3">
                      <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-300">{semester}</h4>
                      <div className="space-y-2 mt-2">
                        {subjectList.map((subject) => (
                          <button 
                            key={subject.id} 
                            onClick={() => onAddPeriod(subject)}
                            className="w-full flex items-center justify-between bg-slate-50 dark:bg-slate-700/50 p-3 rounded-md shadow-sm text-left hover:bg-indigo-50 dark:hover:bg-indigo-900/50 hover:ring-2 hover:ring-indigo-500 transition-all"
                          >
                             <div className="flex-1">
                                <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{subject.name}</p>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subject.teacher}</p>
                              </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">{subject.periodsPerWeek}{subject.isLab ? ' periods/lab' : 'x/week'}</span>
                                  {subject.isLab && (
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">Lab</span>
                                  )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          ) : (
             <div className="text-center py-10">
              <p className="text-sm text-slate-500 dark:text-slate-400">No matching subjects found.</p>
            </div>
          )}
        </div>
        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-200 dark:border-slate-700 flex justify-end">
            <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-800 transition-colors duration-200">
                Cancel
            </button>
        </div>
      </div>
    </div>
  );
};

export default AddPeriodModal;
