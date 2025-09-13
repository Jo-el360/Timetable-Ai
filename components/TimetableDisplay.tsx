import React from 'react';
import { Timetable, TimeSlot } from '../types';
import LoadingSpinner from './LoadingSpinner';
import DownloadIcon from './icons/DownloadIcon';
import RefreshIcon from './icons/RefreshIcon';
import { DEPARTMENT_COLOR_PALETTE } from '../constants';

interface TimetableDisplayProps {
  timetable: Timetable | null;
  timeSlots: TimeSlot[];
  days: string[];
  departmentColorMap: Record<string, typeof DEPARTMENT_COLOR_PALETTE[0]>;
  isLoading: boolean;
  error: string | null;
  filter: { department: string; semester: string; teacher: string; };
  onRegenerate: () => void;
}

const TimetableDisplay: React.FC<TimetableDisplayProps> = ({ timetable, timeSlots, days, departmentColorMap, isLoading, error, filter, onRegenerate }) => {
  
  const handleExportCSV = () => {
    if (!timetable) return;

    const headers = ['Day', ...timeSlots.map(slot => `"${slot.label} (${slot.time})"`)]
    let csvContent = headers.join(',') + '\n';

    days.forEach(day => {
        const row = [`"${day}"`];
        let periodIndex = 0;
        timeSlots.forEach(slot => {
            if (slot.type !== 'PERIOD') {
                row.push(`"${slot.label}"`);
            } else {
                const entry = timetable[day]?.[periodIndex];
                if (entry) {
                    const cellContent = `${entry.subject}\n${entry.teacher}\n${entry.semester}\nDept: ${entry.department}${entry.capacity ? `\nSeats: ${entry.capacity}` : ''}`;
                    row.push(`"${cellContent.replace(/"/g, '""')}"`); // Escape double quotes
                } else {
                    row.push('""'); // Empty period
                }
                periodIndex++;
            }
        });
        csvContent += row.join(',') + '\n';
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'college-timetable.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (!timetable) return;

    // The jsPDF and autoTable libraries are loaded via script tags and attached to the window object.
    const jspdf = (window as any).jspdf;
    if (!jspdf || !jspdf.jsPDF || !jspdf.autoTable) {
      console.error("jsPDF or jsPDF-AutoTable is not loaded correctly.");
      alert("Error: PDF generation library failed to load. Please try refreshing the page.");
      return;
    }

    const { jsPDF, autoTable } = jspdf;

    const doc = new jsPDF({
        orientation: 'landscape',
        unit: 'px',
        format: 'a3'
    });

    const head = [['Day', ...timeSlots.map(slot => `${slot.label}\n${slot.time}`)]];
    const body: string[][] = [];

    days.forEach(day => {
        const row = [day];
        let periodIndex = 0;
        timeSlots.forEach(slot => {
            if (slot.type !== 'PERIOD') {
                row.push(slot.label);
            } else {
                const entry = timetable[day]?.[periodIndex];
                if (entry) {
                    const cellContent = `${entry.subject}\n${entry.teacher}\n${entry.semester}\n${entry.department}`;
                    row.push(cellContent);
                } else {
                    row.push(''); // Empty period
                }
                periodIndex++;
            }
        });
        body.push(row);
    });

    // Call autoTable as a function, passing the jsPDF doc instance as the first argument.
    // This is the correct usage for the UMD version of the plugin.
    autoTable(doc, {
        head: head,
        body: body,
        startY: 60,
        styles: {
            fontSize: 7,
            cellPadding: 4,
            halign: 'center',
            valign: 'middle'
        },
        headStyles: {
            fillColor: [37, 99, 235], // indigo-600
            textColor: 255,
            fontStyle: 'bold',
            fontSize: 8,
        },
        alternateRowStyles: {
            fillColor: [241, 245, 249] // slate-100
        },
        didDrawPage: (data: any) => {
            doc.setFontSize(20);
            doc.setTextColor(40);
            doc.text('College-Wide Timetable', data.settings.margin.left, 40);
        }
    });

    doc.save('college-timetable.pdf');
  };

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
      <>
        <div className="flex flex-col sm:flex-row gap-2 justify-end mb-4">
          <button
            onClick={onRegenerate}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 dark:focus:ring-offset-slate-900 transition-colors duration-200 disabled:opacity-50"
            disabled={isLoading || !timetable}
            aria-label="Regenerate timetable"
          >
            <RefreshIcon className="w-4 h-4" />
            Regenerate
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-600 text-white text-sm font-semibold rounded-md hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:focus:ring-offset-slate-900 transition-colors duration-200 disabled:opacity-50"
            disabled={isLoading || !timetable}
            aria-label="Export timetable as CSV"
          >
            <DownloadIcon className="w-4 h-4" />
            CSV
          </button>
          <button
            onClick={handleExportPDF}
            className="flex items-center justify-center gap-2 px-3 py-2 bg-red-600 text-white text-sm font-semibold rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 dark:focus:ring-offset-slate-900 transition-colors duration-200 disabled:opacity-50"
            disabled={isLoading || !timetable}
            aria-label="Export timetable as PDF"
          >
            <DownloadIcon className="w-4 h-4" />
            PDF
          </button>
        </div>
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
                const daySchedule = timetable[day] || [];
                const cells: React.ReactNode[] = [];
                let periodIndex = -1;
                
                for (let slotIndex = 0; slotIndex < timeSlots.length; slotIndex++) {
                  const slot = timeSlots[slotIndex];

                  if (slot.type !== 'PERIOD') {
                    cells.push(
                      <td key={`slot-${slotIndex}`} className="p-2 font-semibold text-sm text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 align-middle">
                        {slot.label}
                      </td>
                    );
                    continue;
                  }

                  periodIndex++;
                  const entry = daySchedule[periodIndex];

                  if (!entry) {
                    cells.push(<td key={`slot-${slotIndex}`} className="p-2 border-l border-slate-200 dark:border-slate-700"></td>);
                    continue;
                  }

                  const departmentMatch = filter.department === 'All' || entry.department === filter.department;
                  const semesterMatch = filter.semester === 'All' || entry.semester === filter.semester;
                  const teacherMatch = filter.teacher === 'All' || entry.teacher === filter.teacher;

                  if (!departmentMatch || !semesterMatch || !teacherMatch) {
                    cells.push(<td key={`slot-${slotIndex}`} className="p-2 border-l border-slate-200 dark:border-slate-700"></td>);
                    continue;
                  }
                  
                  const colorClasses = departmentColorMap[entry.department]?.className || 'bg-slate-100 text-slate-800';

                  let mergeCount = 1;
                  if (entry.isLab) {
                    for (let j = 1; (slotIndex + j) < timeSlots.length; j++) {
                      const nextSlot = timeSlots[slotIndex + j];
                      const nextPeriodIndex = periodIndex + j;

                      if (nextSlot.type !== 'PERIOD' || nextPeriodIndex >= daySchedule.length) {
                        break;
                      }

                      const nextEntry = daySchedule[nextPeriodIndex];
                      if (
                        nextEntry.isLab &&
                        nextEntry.subject === entry.subject &&
                        nextEntry.teacher === entry.teacher &&
                        nextEntry.semester === entry.semester
                      ) {
                        mergeCount++;
                      } else {
                        break;
                      }
                    }
                  }
                  
                  const startTime = timeSlots[slotIndex].time.split('–')[0].trim();
                  const endSlotIndex = slotIndex + mergeCount - 1;
                  const endTime = timeSlots[endSlotIndex].time.split('–')[1].trim();
                  const combinedTime = `${startTime} – ${endTime}`;

                  cells.push(
                    <td key={`slot-${slotIndex}`} colSpan={mergeCount} className="p-2 border-l border-slate-200 dark:border-slate-700">
                      <div className={`w-full h-full rounded-md p-2 flex flex-col justify-center items-center ${colorClasses} transition-colors duration-300`}>
                        <p className="font-bold text-sm leading-tight">{entry.subject}</p>
                        <p className="text-xs opacity-80 mt-1">{entry.teacher}</p>
                        {mergeCount > 1 && (
                          <p className="text-xs opacity-90 mt-1 font-semibold">{combinedTime}</p>
                        )}
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

                  slotIndex += mergeCount - 1;
                  periodIndex += mergeCount - 1;
                }

                return (
                  <tr key={day} className="border-t border-slate-200 dark:border-slate-700 h-28">
                    <td className="p-2 font-bold text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800 sticky left-0 z-10">
                      {day}
                    </td>
                    {cells}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </>
    );
  };

  return (
    <div className="bg-white dark:bg-slate-800/50 rounded-xl">
      {renderContent()}
    </div>
  );
};

export default TimetableDisplay;