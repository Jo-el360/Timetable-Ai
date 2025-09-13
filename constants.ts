import { TimeSlot } from './types';

export const DAYS: string[] = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

export const TIME_SLOTS: TimeSlot[] = [
  { time: '9:00 AM – 9:45 AM', type: 'PERIOD', label: '1st Period' },
  { time: '9:45 AM – 10:35 AM', type: 'PERIOD', label: '2nd Period' },
  { time: '10:35 AM – 10:50 AM', type: 'BREAK', label: 'Break' },
  { time: '10:50 AM – 11:35 AM', type: 'PERIOD', label: '3rd Period' },
  { time: '11:35 AM – 12:20 PM', type: 'PERIOD', label: '4th Period' },
  { time: '12:20 PM – 1:05 PM', type: 'PERIOD', label: '5th Period' },
  { time: '1:05 PM – 2:00 PM', type: 'LUNCH', label: 'Lunch' },
  { time: '2:00 PM – 2:45 PM', type: 'PERIOD', label: '6th Period' },
  { time: '2:45 PM – 3:30 PM', type: 'PERIOD', label: '7th Period' },
  { time: '3:30 PM – 3:45 PM', type: 'BREAK', label: 'Break' },
  { time: '3:45 PM – 4:30 PM', type: 'PERIOD', label: '8th Period' },
];

interface ColorPalette {
  name: string;
  className: string;
  borderClassName: string;
}

export const DEPARTMENT_COLOR_PALETTE: ColorPalette[] = [
  { name: 'Rose', className: 'bg-rose-100 text-rose-800 dark:bg-rose-900/50 dark:text-rose-300', borderClassName: 'border-rose-500' },
  { name: 'Pink', className: 'bg-pink-100 text-pink-800 dark:bg-pink-900/50 dark:text-pink-300', borderClassName: 'border-pink-500' },
  { name: 'Fuchsia', className: 'bg-fuchsia-100 text-fuchsia-800 dark:bg-fuchsia-900/50 dark:text-fuchsia-300', borderClassName: 'border-fuchsia-500' },
  { name: 'Purple', className: 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300', borderClassName: 'border-purple-500' },
  { name: 'Violet', className: 'bg-violet-100 text-violet-800 dark:bg-violet-900/50 dark:text-violet-300', borderClassName: 'border-violet-500' },
  { name: 'Indigo', className: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/50 dark:text-indigo-300', borderClassName: 'border-indigo-500' },
  { name: 'Blue', className: 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300', borderClassName: 'border-blue-500' },
  { name: 'Sky', className: 'bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-300', borderClassName: 'border-sky-500' },
  { name: 'Cyan', className: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300', borderClassName: 'border-cyan-500' },
  { name: 'Teal', className: 'bg-teal-100 text-teal-800 dark:bg-teal-900/50 dark:text-teal-300', borderClassName: 'border-teal-500' },
  { name: 'Emerald', className: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300', borderClassName: 'border-emerald-500' },
  { name: 'Green', className: 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300', borderClassName: 'border-green-500' },
  { name: 'Lime', className: 'bg-lime-100 text-lime-800 dark:bg-lime-900/50 dark:text-lime-300', borderClassName: 'border-lime-500' },
  { name: 'Yellow', className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300', borderClassName: 'border-yellow-500' },
  { name: 'Amber', className: 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300', borderClassName: 'border-amber-500' },
  { name: 'Orange', className: 'bg-orange-100 text-orange-800 dark:bg-orange-900/50 dark:text-orange-300', borderClassName: 'border-orange-500' },
];