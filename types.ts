export interface Subject {
  name: string;
  teacher: string;
  department: string;
  semester: string;
  isLab: boolean;
  capacity?: number;
}

export interface TimeSlot {
  time: string;
  type: 'PERIOD' | 'BREAK' | 'LUNCH';
  label: string;
}

export interface TimetablePeriod {
  subject: string;
  teacher: string;
  department: string;
  semester: string;
  capacity?: number;
}

export type DaySchedule = TimetablePeriod[];

export type Timetable = Record<string, DaySchedule>;