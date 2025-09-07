import React, { useState, useCallback, useMemo } from 'react';
import { Subject, Timetable } from './types';
import { DEPARTMENT_COLORS, DAYS, TIME_SLOTS } from './constants';
import { generateTimetable } from './services/geminiService';
import Header from './components/Header';
import SubjectInput from './components/SubjectInput';
import TimetableDisplay from './components/TimetableDisplay';

const App: React.FC = () => {
  const [subjects, setSubjects] = useState<Subject[]>([
    { name: 'Quantum Physics', teacher: 'Dr. Evelyn Reed', department: 'Physics', semester: '3rd Semester', isLab: true, capacity: 25 },
    { name: 'Classical Mechanics', teacher: 'Dr. Evelyn Reed', department: 'Physics', semester: '1st Semester', isLab: false, capacity: 50 },
    { name: 'Organic Chemistry', teacher: 'Prof. Samuel Chen', department: 'Chemistry', semester: '3rd Semester', isLab: true, capacity: 20 },
    { name: 'Intro to Chemistry', teacher: 'Prof. Samuel Chen', department: 'Chemistry', semester: '1st Semester', isLab: false, capacity: 60 },
    { name: 'British Literature', teacher: 'Dr. Isabelle Grant', department: 'Literature', semester: '1st Semester', isLab: false, capacity: 40 },
    { name: 'Advanced Calculus', teacher: 'Prof. Marcus Thorne', department: 'Mathematics', semester: '3rd Semester', isLab: false, capacity: 45 },
    { name: 'Linear Algebra', teacher: 'Prof. Marcus Thorne', department: 'Mathematics', semester: '1st Semester', isLab: false, capacity: 45 },
  ]);

  const [timetable, setTimetable] = useState<Timetable | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [departmentColorMap, setDepartmentColorMap] = useState<Record<string, string>>({});
  
  const [departmentFilter, setDepartmentFilter] = useState<string>('All');
  const [semesterFilter, setSemesterFilter] = useState<string>('All');

  const uniqueDepartments = useMemo(() => ['All', ...Array.from(new Set(subjects.map(s => s.department)))], [subjects]);
  const uniqueSemesters = useMemo(() => ['All', ...Array.from(new Set(subjects.map(s => s.semester)))], [subjects]);

  const generateDepartmentColorMap = (newTimetable: Timetable): Record<string, string> => {
    const uniqueDepts = new Set<string>();
    Object.values(newTimetable).forEach(daySchedule => {
      daySchedule.forEach(period => {
        if (period.department) uniqueDepts.add(period.department);
      });
    });

    const newColorMap: Record<string, string> = {};
    Array.from(uniqueDepts).forEach((dept, index) => {
      newColorMap[dept] = DEPARTMENT_COLORS[index % DEPARTMENT_COLORS.length];
    });
    return newColorMap;
  };

  const handleGenerateTimetable = useCallback(async () => {
    if (subjects.length < 5) {
      setError("Please add at least 5 subjects to generate a meaningful timetable.");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setTimetable(null);

    try {
      const resultJsonString = await generateTimetable(subjects);
      
      try {
        const newTimetable: Timetable = JSON.parse(resultJsonString);
        
        // Basic validation of the timetable structure
        const hasAllDays = DAYS.every(day => newTimetable.hasOwnProperty(day) && Array.isArray(newTimetable[day]));
        if (!hasAllDays) {
          throw new Error("The generated timetable is incomplete or malformed.");
        }

        const newColorMap = generateDepartmentColorMap(newTimetable);
        setDepartmentColorMap(newColorMap);
        setTimetable(newTimetable);
        setDepartmentFilter('All');
        setSemesterFilter('All');

      } catch (parseError) {
        console.error("JSON parsing or validation error:", parseError);
        setError("The AI returned a response in an unexpected format. This can sometimes happen with complex schedules. Please try generating again.");
      }

    } catch (e) {
      console.error(e);
       if (e instanceof Error) {
        setError(e.message);
      } else {
        setError("An unknown error occurred while generating the timetable.");
      }
    } finally {
      setIsLoading(false);
    }
  }, [subjects]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-sans">
      <Header />
      <main className="container mx-auto p-4 md:p-8">
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="lg:w-1/3 xl:w-1/4">
            <SubjectInput 
              subjects={subjects} 
              setSubjects={setSubjects} 
              onGenerate={handleGenerateTimetable}
              isLoading={isLoading}
            />
          </div>
          <div className="lg:w-2/3 xl:w-3/4">
            <div className="bg-white dark:bg-slate-800 p-4 sm:p-6 rounded-xl shadow-lg">
              <div className="flex flex-col sm:flex-row gap-4 mb-4">
                  <div className="flex-1">
                    <label htmlFor="departmentFilter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Filter by Department</label>
                    <select 
                      id="departmentFilter"
                      value={departmentFilter}
                      onChange={(e) => setDepartmentFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={!timetable}
                    >
                      {uniqueDepartments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
                    </select>
                  </div>
                  <div className="flex-1">
                    <label htmlFor="semesterFilter" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Filter by Semester</label>
                    <select 
                      id="semesterFilter"
                      value={semesterFilter}
                      onChange={(e) => setSemesterFilter(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      disabled={!timetable}
                    >
                      {uniqueSemesters.map(sem => <option key={sem} value={sem}>{sem}</option>)}
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
                filter={{ department: departmentFilter, semester: semesterFilter }}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;