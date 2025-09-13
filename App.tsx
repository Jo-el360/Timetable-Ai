import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Subject, Timetable, TimetablePeriod } from './types';
import { DEPARTMENT_COLOR_PALETTE, DAYS, TIME_SLOTS } from './constants';
import Header from './components/Header';
import SubjectInput from './components/SubjectInput';
import TimetableDisplay from './components/TimetableDisplay';
import AddPeriodModal from './components/AddPeriodModal';
import { generateTimetable as generateTimetableService } from './services/geminiService';

const App: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>(() => {
    try {
      const savedSubjects = localStorage.getItem('subjects');
      return savedSubjects ? JSON.parse(savedSubjects) : [];
    } catch (error) {
      console.error("Failed to parse subjects from localStorage", error);
      return [];
    }
  });

  const [timetable, setTimetable] = useState<Timetable | null>(() => {
    try {
      const savedTimetable = localStorage.getItem('timetable');
      return savedTimetable ? JSON.parse(savedTimetable) : null;
    } catch (error) {
      console.error("Failed to parse timetable from localStorage", error);
      return null;
    }
  });

  const [isAddPeriodModalOpen, setIsAddPeriodModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ day: string; periodIndex: number } | null>(null);
  
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [semesterFilter, setSemesterFilter] = useState<string>('All');
  const [teacherFilter, setTeacherFilter] = useState<string>('All');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSimulated, setIsSimulated] = useState(false);

  useEffect(() => {
    localStorage.setItem('subjects', JSON.stringify(subjects));
  }, [subjects]);

  useEffect(() => {
    localStorage.setItem('timetable', JSON.stringify(timetable));
  }, [timetable]);

  const uniqueDepartments = useMemo(() => ['All', ...Array.from(new Set(subjects.map(s => s.department)))], [subjects]);
  const uniqueSemesters = useMemo(() => ['All', ...Array.from(new Set(subjects.map(s => s.semester)))], [subjects]);
  const uniqueTeachers = useMemo(() => ['All', ...Array.from(new Set(subjects.map(s => s.teacher)))], [subjects]);

  const departmentColorMap = useMemo(() => {
    const uniqueDepts = [...new Set(subjects.map(s => s.department))];
    const newColorMap: Record<string, typeof DEPARTMENT_COLOR_PALETTE[0]> = {};
    uniqueDepts.forEach((dept, index) => {
      newColorMap[dept] = DEPARTMENT_COLOR_PALETTE[index % DEPARTMENT_COLOR_PALETTE.length];
    });
    return newColorMap;
  }, [subjects]);

  const handleGenerateTimetable = useCallback(async (isRegeneration = false) => {
    if (subjects.length === 0) {
        alert("Please add at least one subject before generating a timetable.");
        return;
    }
    if (!isRegeneration && timetable) {
        if (!window.confirm("This will replace your current timetable. Are you sure you want to proceed?")) {
            return;
        }
    }

    setIsLoading(true);
    setError(null);
    setIsSimulated(false);

    try {
        const result = await generateTimetableService(subjects);
        const generatedTimetable = JSON.parse(result.timetableJson);
        setTimetable(generatedTimetable);
        setIsSimulated(result.isSimulated);
    } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
        setError(errorMessage);
        setTimetable(null);
    } finally {
        setIsLoading(false);
    }
  }, [subjects, timetable]);


  const handleClearAllData = () => {
    if (window.confirm('Are you sure you want to clear all subjects and the entire timetable? This action cannot be undone.')) {
      setSubjects([]);
      setTimetable(null);
      localStorage.removeItem('subjects');
      localStorage.removeItem('timetable');
    }
  };

  const handleCellClick = (day: string, periodIndex: number) => {
    const existingEntry = timetable?.[day]?.[periodIndex];
    if (existingEntry) {
      handleRemovePeriod(day, periodIndex, existingEntry);
    } else {
      setSelectedCell({ day, periodIndex });
      setIsAddPeriodModalOpen(true);
    }
  };

  const handleAddPeriod = (subjectToAdd: Subject) => {
    if (!selectedCell) return;
    const { day, periodIndex } = selectedCell;

    setTimetable(prevTimetable => {
      const newTimetable: Timetable = { ...(prevTimetable || {}) };
      
      DAYS.forEach(d => {
        if (!newTimetable[d]) {
          newTimetable[d] = new Array(TIME_SLOTS.filter(s => s.type === 'PERIOD').length).fill(null);
        }
      });
      
      newTimetable[day] = [...newTimetable[day]];
      
      const newPeriod: TimetablePeriod = {
        subject: subjectToAdd.name,
        teacher: subjectToAdd.teacher,
        department: subjectToAdd.department,
        semester: subjectToAdd.semester,
        isLab: subjectToAdd.isLab,
        capacity: subjectToAdd.capacity
      };

      if (subjectToAdd.isLab) {
        for (let i = 0; i < subjectToAdd.periodsPerWeek; i++) {
          if (periodIndex + i < newTimetable[day].length) {
            newTimetable[day][periodIndex + i] = newPeriod;
          }
        }
      } else {
        newTimetable[day][periodIndex] = newPeriod;
      }

      return newTimetable;
    });
    setIsAddPeriodModalOpen(false);
    setSelectedCell(null);
  };
  
  const handleRemovePeriod = (day: string, periodIndex: number, periodToRemove: TimetablePeriod) => {
     setTimetable(prevTimetable => {
        if (!prevTimetable?.[day]) return prevTimetable;
        const newTimetable = { ...prevTimetable };
        const newDaySchedule = [...newTimetable[day]];

        if (periodToRemove.isLab) {
            for(let i = 0; i < newDaySchedule.length; i++) {
                const entry = newDaySchedule[i];
                if (entry && entry.isLab && entry.subject === periodToRemove.subject && entry.semester === periodToRemove.semester) {
                    newDaySchedule[i] = null;
                }
            }
        } else {
            newDaySchedule[periodIndex] = null;
        }

        newTimetable[day] = newDaySchedule;
        return newTimetable;
    });
  };

  return (
    <>
      <AddPeriodModal 
        isOpen={isAddPeriodModalOpen}
        onClose={() => setIsAddPeriodModalOpen(false)}
        subjects={subjects}
        onAddPeriod={handleAddPeriod}
      />
       <Header />
      <main className="container mx-auto p-4 md:p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 lg:sticky top-24 space-y-8">
           <SubjectInput
            subjects={subjects}
            setSubjects={setSubjects}
            onGenerate={handleGenerateTimetable}
            isLoading={isLoading}
            departmentColorMap={departmentColorMap}
            onClearAllData={handleClearAllData}
          />
        </div>
        <div className="lg:col-span-2 space-y-6">
           <div className="p-4 bg-white dark:bg-slate-800/50 rounded-xl grid grid-cols-1 sm:grid-cols-3 gap-4 shadow-sm">
            <div>
              <label htmlFor="filterDepartment" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Filter by Department</label>
              <select id="filterDepartment" value={departmentFilter} onChange={e => setDepartmentFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {uniqueDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="filterSemester" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Filter by Semester</label>
              <select id="filterSemester" value={semesterFilter} onChange={e => setSemesterFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {uniqueSemesters.map(sem => <option key={sem} value={sem}>{sem}</option>)}
              </select>
            </div>
             <div>
              <label htmlFor="filterTeacher" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Filter by Teacher</label>
              <select id="filterTeacher" value={teacherFilter} onChange={e => setTeacherFilter(e.target.value)} className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500">
                {uniqueTeachers.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>
          <TimetableDisplay
            timetable={timetable}
            timeSlots={TIME_SLOTS}
            days={DAYS}
            departmentColorMap={departmentColorMap}
            isLoading={isLoading}
            error={error}
            filter={{ department: departmentFilter, semester: semesterFilter, teacher: teacherFilter }}
            onRegenerate={() => handleGenerateTimetable(true)}
            onCellClick={handleCellClick}
            isSimulated={isSimulated}
          />
        </div>
      </main>
    </>
  );
};

export default App;