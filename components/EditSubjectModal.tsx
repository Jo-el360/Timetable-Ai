import React, { useState, useEffect } from 'react';
import { Subject } from '../types';

interface EditSubjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (subject: Subject) => void;
  subject: Subject | null;
  uniqueDepartments: string[];
  uniqueSemesters: string[];
}

const EditSubjectModal: React.FC<EditSubjectModalProps> = ({ isOpen, onClose, onSave, subject, uniqueDepartments, uniqueSemesters }) => {
  const [name, setName] = useState('');
  const [teacher, setTeacher] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [periodsPerWeek, setPeriodsPerWeek] = useState('3');
  const [capacity, setCapacity] = useState('');
  const [isLab, setIsLab] = useState(false);

  const [newDepartmentValue, setNewDepartmentValue] = useState('');
  const [newSemesterValue, setNewSemesterValue] = useState('');

  const isCreatingNewDepartment = department === '__CREATE_NEW__';
  const isCreatingNewSemester = semester === '__CREATE_NEW__';

  useEffect(() => {
    if (subject) {
      setName(subject.name);
      setTeacher(subject.teacher);
      setDepartment(subject.department);
      setSemester(subject.semester);
      setPeriodsPerWeek(String(subject.periodsPerWeek));
      setCapacity(subject.capacity ? String(subject.capacity) : '');
      setIsLab(subject.isLab);
      setNewDepartmentValue('');
      setNewSemesterValue('');
    }
  }, [subject]);

  if (!isOpen || !subject) {
    return null;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const finalDepartment = isCreatingNewDepartment ? newDepartmentValue.trim() : department.trim();
    const finalSemester = isCreatingNewSemester ? newSemesterValue.trim() : semester.trim();

    if (name.trim() && teacher.trim() && finalDepartment && finalSemester && periodsPerWeek) {
      onSave({
        ...subject,
        name: name.trim(),
        teacher: teacher.trim(),
        department: finalDepartment,
        semester: finalSemester,
        periodsPerWeek: parseInt(periodsPerWeek, 10),
        capacity: capacity ? parseInt(capacity, 10) : undefined,
        isLab,
      });
    }
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
      aria-modal="true"
      role="dialog"
    >
      <div 
        className="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Edit Subject</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="editSubjectName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Subject Name</label>
              <input id="editSubjectName" type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Quantum Physics" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
             <div>
              <label htmlFor="editTeacherName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Teacher Name</label>
              <input id="editTeacherName" type="text" value={teacher} onChange={(e) => setTeacher(e.target.value)} placeholder="e.g., Dr. Evelyn Reed" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
            </div>
             <div>
              <label htmlFor="editDepartmentName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Department</label>
              <select id="editDepartmentName" value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {uniqueDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                <option value="__CREATE_NEW__" className="font-bold text-indigo-500 dark:text-indigo-400">-- Add New Department --</option>
              </select>
              {isCreatingNewDepartment && (
                 <input type="text" value={newDepartmentValue} onChange={(e) => setNewDepartmentValue(e.target.value)} placeholder="Enter new department name" className="mt-2 w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              )}
            </div>
            <div>
              <label htmlFor="editSemesterName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Semester</label>
              <select id="editSemesterName" value={semester} onChange={(e) => setSemester(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {uniqueSemesters.map(sem => <option key={sem} value={sem}>{sem}</option>)}
                 <option value="__CREATE_NEW__" className="font-bold text-indigo-500 dark:text-indigo-400">-- Add New Semester --</option>
              </select>
              {isCreatingNewSemester && (
                 <input type="text" value={newSemesterValue} onChange={(e) => setNewSemesterValue(e.target.value)} placeholder="Enter new semester name" className="mt-2 w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required/>
              )}
            </div>
             <div className="flex gap-4">
              <div className="flex-1">
                <label htmlFor="editPeriodsPerWeek" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  {isLab ? 'Continuous Periods for Lab' : 'Periods Per Week'}
                </label>
                <input id="editPeriodsPerWeek" type="number" min="1" value={periodsPerWeek} onChange={(e) => setPeriodsPerWeek(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                {isLab && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Enter total consecutive periods (e.g., 3 for a 3-period lab).</p>}
              </div>
              <div className="flex-1">
                <label htmlFor="editCapacity" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Capacity (Opt.)</label>
                <input id="editCapacity" type="number" min="1" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="e.g., 50" className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
            </div>
            <div className="flex items-center">
              <input id="editIsLab" name="isLab" type="checkbox" checked={isLab} onChange={(e) => setIsLab(e.target.checked)} className="h-4 w-4 rounded border-slate-300 dark:border-slate-600 text-indigo-600 focus:ring-indigo-500" />
              <label htmlFor="editIsLab" className="ml-3 block text-sm text-slate-700 dark:text-slate-300">This is a lab session</label>
            </div>
            <div className="flex justify-end gap-4 pt-4">
                <button type="button" onClick={onClose} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-800 dark:text-slate-200 font-semibold rounded-md hover:bg-slate-300 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-800 transition-colors duration-200">
                    Cancel
                </button>
                <button type="submit" className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-800 transition-colors duration-200">
                    Save Changes
                </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditSubjectModal;