import React, { useState, useMemo } from 'react';
import { Subject } from '../types';
import PlusIcon from './icons/PlusIcon';
import TrashIcon from './icons/TrashIcon';
import SparklesIcon from './icons/SparklesIcon';

interface SubjectInputProps {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  onGenerate: () => void;
  isLoading: boolean;
}

const SubjectInput: React.FC<SubjectInputProps> = ({ subjects, setSubjects, onGenerate, isLoading }) => {
  const [workingDepartment, setWorkingDepartment] = useState('');
  const [workingSemester, setWorkingSemester] = useState('');

  const [newSubject, setNewSubject] = useState('');
  const [newTeacher, setNewTeacher] = useState('');
  const [newCapacity, setNewCapacity] = useState('');
  const [isLab, setIsLab] = useState(false);

  const [recentlyDeletedSubject, setRecentlyDeletedSubject] = useState<Subject | null>(null);
  const [undoTimeoutId, setUndoTimeoutId] = useState<number | null>(null);

  const uniqueDepartments = useMemo(() => [...new Set(subjects.map(s => s.department))], [subjects]);
  const uniqueSemesters = useMemo(() => [...new Set(subjects.map(s => s.semester))], [subjects]);

  const handleAddSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (newSubject.trim() && newTeacher.trim() && workingDepartment.trim() && workingSemester.trim()) {
      setSubjects([...subjects, { 
        name: newSubject.trim(), 
        teacher: newTeacher.trim(), 
        department: workingDepartment.trim(),
        semester: workingSemester.trim(),
        isLab,
        capacity: newCapacity ? parseInt(newCapacity, 10) : undefined
      }]);
      setNewSubject('');
      setNewTeacher('');
      setNewCapacity('');
      setIsLab(false);
    }
  };

  const handleRemoveSubject = (subjectToRemove: Subject) => {
    if (undoTimeoutId) {
      clearTimeout(undoTimeoutId);
    }
    setRecentlyDeletedSubject(subjectToRemove);
    setSubjects(prevSubjects => prevSubjects.filter(subject => subject !== subjectToRemove));
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
    <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-lg space-y-6">
      <h2 className="text-xl font-bold text-slate-900 dark:text-white">College Manager</h2>
      
      <div className="space-y-4 border-b border-slate-200 dark:border-slate-700 pb-6">
        <h3 className="text-md font-semibold text-slate-800 dark:text-slate-200">1. Set Working Context</h3>
        <div>
          <label htmlFor="departmentName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
          <input id="departmentName" type="text" list="departments-list" value={workingDepartment} onChange={(e) => setWorkingDepartment(e.target.value)} placeholder="e.g., Physics" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          <datalist id="departments-list">
            {uniqueDepartments.map(dept => <option key={dept} value={dept} />)}
          </datalist>
        </div>
        <div>
          <label htmlFor="semesterName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Semester</label>
          <input id="semesterName" type="text" list="semesters-list" value={workingSemester} onChange={(e) => setWorkingSemester(e.target.value)} placeholder="e.g., 1st Semester" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
           <datalist id="semesters-list">
            {uniqueSemesters.map(sem => <option key={sem} value={sem} />)}
          </datalist>
        </div>
      </div>

      {workingDepartment && workingSemester && (
        <div>
            <h3 className="text-md font-semibold text-slate-800 dark:text-slate-200 mb-4">2. Add Subjects to <span className="text-indigo-500">{workingDepartment} / {workingSemester}</span></h3>
            <form onSubmit={handleAddSubject} className="space-y-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                <div>
                <label htmlFor="subjectName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject Name</label>
                <input id="subjectName" type="text" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="e.g., Quantum Physics" className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div>
                <label htmlFor="teacherName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teacher Name</label>
                <input id="teacherName" type="text" value={newTeacher} onChange={(e) => setNewTeacher(e.target.value)} placeholder="e.g., Dr. Evelyn Reed" className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
                 <div>
                  <label htmlFor="capacity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Capacity (Optional)</label>
                  <input id="capacity" type="number" min="1" value={newCapacity} onChange={(e) => setNewCapacity(e.target.value)} placeholder="e.g., 50" className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
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
        {Object.entries(groupedSubjects).map(([department, semesters]) => (
          <div key={department} className="bg-slate-100 dark:bg-slate-700/50 p-3 rounded-lg">
            <h3 className="font-bold text-slate-800 dark:text-slate-200">{department}</h3>
            {Object.entries(semesters).map(([semester, subjectList]) => (
              <div key={semester} className="mt-2 pl-3 border-l-2 border-slate-300 dark:border-slate-600">
                <h4 className="font-semibold text-sm text-slate-600 dark:text-slate-300">{semester}</h4>
                <div className="space-y-2 mt-2">
                  {subjectList.map((subject, index) => (
                    <div key={index} className="flex items-center justify-between bg-white dark:bg-slate-700 p-2 rounded-md shadow-sm">
                       <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-semibold text-sm text-slate-800 dark:text-slate-200">{subject.name}</p>
                            {subject.isLab && (
                              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300">Lab</span>
                            )}
                            {subject.capacity && (
                               <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-200 text-slate-600 dark:bg-slate-600 dark:text-slate-300">{subject.capacity} seats</span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{subject.teacher}</p>
                        </div>
                      <button onClick={() => handleRemoveSubject(subject)} className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-red-400 rounded-full hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ))}
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
  );
};

export default SubjectInput;