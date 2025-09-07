import React from 'react';
import { Timetable, TimeSlot } from '../types';
import LoadingSpinner from './LoadingSpinner';

interface TimetableDisplayProps {
  timetable: Timetable | null;
  timeSlots: TimeSlot[];
  days: string[];
  departmentColorMap: Record<string, string>;
  isLoading: boolean;
  error: string | null;
  filter: { department: string; semester: string; };
}

const TimetableDisplay: React.FC<TimetableDisplayProps> = ({ timetable, timeSlots, days, departmentColorMap, isLoading, error, filter }) => {
  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
          <LoadingSpinner />
          <p className="mt-4 text-lg font-semibold text-slate-600 dark:text-slate-300">AI is crafting your schedule...</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">This may take a moment.</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] bg-red-50 dark:bg-red-900/20 p-8 rounded-lg">
           <div className="w-16 h-16 text-red-500 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
           </div>
          <p className="text-lg font-bold text-red-700 dark:text-red-300">An Error Occurred</p>
          <p className="text-center text-red-600 dark:text-red-400 mt-2">{error}</p>
        </div>
      );
    }

    if (!timetable) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg p-8">
            <div className="w-16 h-16 text-slate-400 bg-slate-100 dark:bg-slate-700/50 rounded-full flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
            </div>
          <p className="text-lg font-semibold text-slate-600 dark:text-slate-300">Your timetable will appear here.</p>
          <p className="text-sm text-center text-slate-500 dark:text-slate-400 mt-1">Manage your college structure and click "Generate Timetable".</p>
        </div>
      );
    }
    
    return (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[1800px] border-collapse text-center">
          <thead>
            <tr className="bg-slate-100 dark:bg-slate-700">
              <th className="p-3 font-semibold text-sm text-slate-600 dark:text-slate-300 w-32 sticky left-0 bg-slate-100 dark:bg-slate-700 z-10">Day</th>
              {timeSlots.map((slot, index) => (
                <th key={index} className="p-2 font-semibold text-sm text-slate-600 dark:text-slate-300 min-w-[140px]">
                  <div className="text-xs">{slot.time}</div>
                  <div className="font-semibold">{slot.label}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {days.map(day => {
              let periodIndex = 0;
              return (
                <tr key={day} className="border-t border-slate-200 dark:border-slate-700 h-28">
                  <td className="p-2 font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 sticky left-0 z-10">
                    {day}
                  </td>
                  {timeSlots.map((slot, slotIndex) => {
                    if (slot.type !== 'PERIOD') {
                      return (
                        <td key={slotIndex} className="p-2 font-semibold text-sm text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 align-middle">
                          {slot.label}
                        </td>
                      );
                    }
                    
                    const currentPeriodIndex = periodIndex;
                    periodIndex++;

                    const entry = timetable[day]?.[currentPeriodIndex];
                    if (!entry) return <td key={slotIndex} className="p-2 border-l border-slate-200 dark:border-slate-700"></td>;

                    const departmentMatch = filter.department === 'All' || entry.department === filter.department;
                    const semesterMatch = filter.semester === 'All' || entry.semester === filter.semester;
                    
                    if (!departmentMatch || !semesterMatch) {
                      return <td key={slotIndex} className="p-2 border-l border-slate-200 dark:border-slate-700"></td>;
                    }
                    
                    const colorClasses = departmentColorMap[entry.department] || 'bg-slate-100 text-slate-800';
                    return (
                      <td key={slotIndex} className="p-2 border-l border-slate-200 dark:border-slate-700">
                        <div className={`w-full h-full rounded-md p-2 flex flex-col justify-center items-center ${colorClasses} transition-colors duration-300`}>
                          <p className="font-bold text-sm leading-tight">{entry.subject}</p>
                          <p className="text-xs opacity-80 mt-1">{entry.teacher}</p>
                          <div className="flex items-center gap-x-2 mt-1">
                            <p className="text-xs font-mono opacity-70">{entry.semester}</p>
                            {entry.capacity && (
                              <p className="text-xs font-mono opacity-70 border-l-2 border-current/30 pl-2">
                                {entry.capacity} seats
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl">
      {renderContent()}
    </div>
  );
};

export default TimetableDisplay;