import React, { useState, useMemo } from 'react';
import { Subject } from '../types';
import { DEPARTMENT_COLOR_PALETTE } from '../constants';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import SparklesIcon from './icons/SparklesIcon';
import EditIcon from './icons/EditIcon';
import EditSubjectModal from './EditSubjectModal';
import BulkImportModal from './BulkImportModal';
import UploadIcon from './icons/UploadIcon';

interface SubjectInputProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  onGenerate: () => void;
  isLoading: boolean;
  departmentColorMap: Record<string, typeof DEPARTMENT_COLOR_PALETTE[0]>;
  onClearAllData: () => void;
}

const SubjectInput: React.FC<SubjectInputProps> = ({ subjects, setSubjects, onGenerate, isLoading, departmentColorMap, onClearAllData }) => {
  const [workingDepartment, setWorkingDepartment] = useState('');
  const [workingSemester, setWorkingSemester] = useState('');
  const [newDepartmentValue, setNewDepartmentValue] = useState('');
  const [newSemesterValue, setNewSemesterValue] = useState('');

  const [newSubject, setNewSubject] = useState('');
  const [newTeacher, setNewTeacher] = useState('');
  const [newPeriodsPerWeek, setNewPeriodsPerWeek] = useState('3');
  const [newCapacity, setNewCapacity] = useState('');
  const [isLab, setIsLab] = useState(false);

  const [recentlyDeletedSubject, setRecentlyDeletedSubject] = useState<Subject | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<number | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [subjectToEdit, setSubjectToEdit] = useState<Subject | null>(null);
  
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  const uniqueDepartments = useMemo(() => [...new Set(subjects.map(s => s.department))].sort(), [subjects]);
  const uniqueSemesters = useMemo(() => [...new Set(subjects.map(s => s.semester))].sort(), [subjects]);

  const isCreatingNewDepartment = workingDepartment === '__CREATE_NEW__';
  const isCreatingNewSemester = workingSemester === '__CREATE_NEW__';

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    const finalDepartment = (isCreatingNewDepartment ? newDepartmentValue.trim() : workingDepartment.trim());
    const finalSemester = (isCreatingNewSemester ? newSemesterValue.trim() : workingSemester.trim());

    if (newSubject.trim() && newTeacher.trim() && finalDepartment && finalSemester && newPeriodsPerWeek) {
      setSubjects([...subjects, { 
        id: Date.now(),
        name: newSubject.trim(), 
        teacher: newTeacher.trim(), 
        department: finalDepartment,
        semester: finalSemester,
        isLab,
        periodsPerWeek: parseInt(newPeriodsPerWeek, 10),
        capacity: newCapacity ? parseInt(newCapacity, 10) : undefined
      }]);
      setNewSubject('');
      setNewTeacher('');
      setNewPeriodsPerWeek('3');
      setNewCapacity('');
      setIsLab(false);
      
      if (isCreatingNewDepartment) {
        setWorkingDepartment(finalDepartment);
        setNewDepartmentValue('');
      }
      if (isCreatingNewSemester) {
        setWorkingSemester(finalSemester);
        setNewSemesterValue('');
      }
    }
  };

  const handleEditSubjectClick = (subject: Subject) => {
    setSubjectToEdit(subject);
    setIsEditModalOpen(true);
  };

  const handleUpdateSubject = (updatedSubject: Subject) => {
    setSubjects(subjects.map(s => s.id === updatedSubject.id ? updatedSubject : s));
    setIsEditModalOpen(false);
    setSubjectToEdit(null);
  };

  const handleRemoveSubject = (subjectToRemove: Subject) => {
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
    }
    setRecentlyDeletedSubject(subjectToRemove);
    setSubjects(prevSubjects => prevSubjects.filter(subject => subject.id !== subjectToRemove.id));
    const newTimeoutId = window.setTimeout(() => {
      setRecentlyDeletedSubject(null);
    }, 5000);
    setUndoTimeoutId(newTimeoutId);
  };

  const handleUndoRemove = () => {
    if (recentlyDeletedSubject) {
      setSubjects(prevSubjects => [...prevSubjects, recentlyDeletedSubject]);
      setRecentlyDeletedSubject(null);
      if (undoTimeoutId) {
        clearTimeout(undoTimeoutId);
        setUndoTimeoutId(null);
      }
    }
  };

  const handleBulkImport = (newSubjects: Omit<Subject, 'id'>[]) => {
    const subjectsWithIds = newSubjects.map((sub, index) => ({
      ...sub,
      id: Date.now() + index,
    }));
    setSubjects(prev => [...prev, ...subjectsWithIds]);
    setIsImportModalOpen(false);
  };

  const groupedSubjects = useMemo(() => {
    return subjects.reduce<Record<string, Record<string, Subject[]>>>((acc, subject) => {
      const { department, semester } = subject;
      if (!acc[department]) acc[department] = {};
      if (!acc[department][semester]) acc[department][semester] = [];
      acc[department][semester].push(subject);
      return acc;
    }, {});
  }, [subjects]);

  return (
    <>
      <EditSubjectModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        subject={subjectToEdit}
        onSave={handleUpdateSubject}
        uniqueDepartments={uniqueDepartments}
        uniqueSemesters={uniqueSemesters}
      />
      <BulkImportModal 
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleBulkImport}
      />
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg space-y-6">
        <div className="flex justify-between items-center gap-4">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">College Manager</h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsImportModalOpen(true)} 
              className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-200 text-sm font-semibold rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              title="Bulk import subjects"
              aria-label="Bulk import subjects"
            >
              <UploadIcon className="w-5 h-5" />
              Import
            </button>
             <button
              onClick={onClearAllData}
              disabled={subjects.length === 0}
              className="flex-shrink-0 flex items-center justify-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 text-sm font-semibold rounded-md hover:bg-red-200 dark:hover:bg-red-900/70 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear all subjects and timetable"
              aria-label="Clear all data"
            >
              <TrashIcon className="w-5 h-5" />
              Clear
            </button>
          </div>
        </div>
        
        <div className="space-y-4 border-b border-slate-200 dark:border-slate-700 pb-6">
          <h3 className="text-md font-semibold text-slate-800 dark:text-slate-200">1. Set Working Context</h3>
          <div>
            <label htmlFor="departmentName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
            <select 
              id="departmentName"
              value={workingDepartment}
              onChange={(e) => setWorkingDepartment(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>Select a department</option>
              {uniqueDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              <option value="__CREATE_NEW__" className="font-bold text-indigo-500 dark:text-indigo-400">-- Add New Department --</option>
            </select>
            {isCreatingNewDepartment && (
               <input 
                id="newDepartmentName" 
                type="text" 
                value={newDepartmentValue} 
                onChange={(e) => setNewDepartmentValue(e.target.value)} 
                placeholder="Enter new department name" 
                className="mt-2 w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                required
              />
            )}
          </div>
          <div>
            <label htmlFor="semesterName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Semester</label>
            <select 
              id="semesterName"
              value={workingSemester}
              onChange={(e) => setWorkingSemester(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="" disabled>Select a semester</option>
              {uniqueSemesters.map(sem => <option key={sem} value={sem}>{sem}</option>)}
              <option value="__CREATE_NEW__" className="font-bold text-indigo-500 dark:text-indigo-400">-- Add New Semester --</option>
            </select>
            {isCreatingNewSemester && (
               <input 
                id="newSemesterName" 
                type="text" 
                value={newSemesterValue} 
                onChange={(e) => setNewSemesterValue(e.target.value)} 
                placeholder="Enter new semester name" 
                className="mt-2 w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                required
              />
            )}
          </div>
        </div>

        {workingDepartment && workingSemester && (
          <div>
              <h3 className="text-md font-semibold text-slate-800 dark:text-slate-200 mb-4">
                2. Add Subjects to <span className="text-indigo-500">{isCreatingNewDepartment ? 'New Department' : workingDepartment} / {isCreatingNewSemester ? 'New Semester' : workingSemester}</span>
              </h3>
              <form onSubmit={handleAddSubject} className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                  <div>
                    <label htmlFor="subjectName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject Name</label>
                    <input id="subjectName" type="text" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="e.g., Quantum Physics" className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                  <div>
                    <label htmlFor="teacherName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teacher Name</label>
                    <input id="teacherName" type="text" value={newTeacher} onChange={(e) => setNewTeacher(e.target.value)} placeholder="e.g., Dr. Evelyn Reed" className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                  </div>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <label htmlFor="periodsPerWeek" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                        {isLab ? 'Continuous Periods for Lab' : 'Periods Per Week'}
                      </label>
                      <input id="periodsPerWeek" type="number" min="1" value={newPeriodsPerWeek} onChange={(e) => setNewPeriodsPerWeek(e.target.value)} className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                      {isLab && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enter total consecutive periods (e.g., 3 for a 3-period lab).</p>}
                    </div>
                    <div className="flex-1">
                      <label htmlFor="capacity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Capacity (Opt.)</label>
                      <input id="capacity" type="number" min="1" value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)} placeholder="e.g., 50" className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                  </div>
                  <div className="flex items-center">
                    <input id="isLab" name="isLab" type="checkbox" checked={isLab} onChange={(e) => setIsLab(e.target.checked)} className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500" />
                    <label htmlFor="isLab" className="ml-3 block text-sm text-slate-700 dark:text-slate-300">This is a lab session</label>
                  </div>
                  <button type="submit" className="w-full flex items-center justify-center px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 transition-colors duration-200">
                    <PlusIcon className="w-5 h-5 mr-2" />
                    Add Subject
                  </button>
              </form>
          </div>
        )}

        <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
          {Object.entries(groupedSubjects).map(([department, semesters]) => {
              const color = departmentColorMap[department];
              const borderClass = color ? color.borderClassName : 'border-slate-300 dark:border-slate-600';
              return (
                <div key={department} className={`p-3 rounded-lg border-l-4 ${borderClass} bg-slate-100 dark:bg-slate-700/50`}>
                  <h3 className="font-bold text-slate-800 dark:text-slate-200">{department}</h3>
                  {Object.entries(semesters).map(([semester, subjectList]) => (
                    <div key={semester} className="mt-2 pl-3">
                      <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-300">{semester}</h4>
                      <div className="space-y-2 mt-2">
                        {subjectList.map((subject) => (
                          <div key={subject.id} className="flex items-center justify-between bg-white dark:bg-slate-700 p-2 rounded-md shadow-sm">
                             <div className="flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{subject.name}</p>
                                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300">{subject.periodsPerWeek}{subject.isLab ? ' periods/lab' : 'x/week'}</span>
                                  {subject.isLab && (
                                    <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">Lab</span>
                                  )}
                                  {subject.capacity && (
                                     <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300">{subject.capacity} seats</span>
                                  )}
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subject.teacher}</p>
                              </div>
                            <div className="flex items-center">
                                <button onClick={() => handleEditSubjectClick(subject)} className="p-1 text-slate-400 hover:text-indigo-500 dark:hover:text-indigo-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                  <EditIcon className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleRemoveSubject(subject)} className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )
          })}
          {subjects.length === 0 && !recentlyDeletedSubject && (
            <div className="text-center py-4">
              <p className="text-sm text-slate-500 dark:text-slate-400">No departments or subjects added yet.</p>
            </div>
          )}
        </div>
        
        {recentlyDeletedSubject && (
          <div className="bg-slate-200 dark:bg-slate-700 p-3 rounded-lg flex items-center justify-between transition-all">
            <p className="text-sm text-slate-700 dark:text-slate-300">
              <span className="font-semibold">{recentlyDeletedSubject.name}</span> removed.
            </p>
            <button 
              onClick={handleUndoRemove} 
              className="font-bold text-sm text-indigo-600 dark:text-indigo-400 hover:underline"
            >
              Undo
            </button>
          </div>
        )}

        <button 
          onClick={onGenerate} 
          disabled={isLoading || subjects.length === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-green-500 to-teal-500 text-white font-bold rounded-lg hover:from-green-600 hover:to-teal-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500 dark:focus:ring-offset-slate-800 transition-all duration-300 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100"
        >
          <SparklesIcon className="w-6 h-6" />
          {isLoading ? 'Generating...' : 'Generate Timetable'}
        </button>
      </div>
    </>
  );
};

export default SubjectInput;
