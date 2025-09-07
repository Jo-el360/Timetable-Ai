import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="bg-white dark:bg-slate-800/50 shadow-md backdrop-blur-sm sticky top-0 z-10">
      <div className="container mx-auto px-4 md:px-8 py-4 flex items-center">
        <div className="w-12 h-12 bg-gradient-to-br from-sky-400 to-indigo-500 rounded-lg flex items-center justify-center mr-4 shadow-lg">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white">
            AI College-Wide Timetable Generator
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Manage departments and semesters to create a unified schedule
          </p>
        </div>
      </div>
    </header>
  );
};

export default Header;
