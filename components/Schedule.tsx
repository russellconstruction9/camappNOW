import React, { useState, useMemo } from 'react';
import { useData } from '../hooks/useDataContext';
import { Project, Task } from '../types';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
  isWithinInterval as isWithin,
} from 'date-fns';
import { ChevronLeftIcon, ChevronRightIcon } from './icons/Icons';
import ProjectFilter from './ProjectFilter';
import DayViewModal from './DayViewModal';

const Schedule: React.FC = () => {
  const { projects, tasks } = useData();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedProjectIds, setSelectedProjectIds] = useState<number[]>(() => projects.map(p => p.id));
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const start = startOfWeek(startOfMonth(currentMonth));
  const end = endOfWeek(endOfMonth(currentMonth));
  const days = eachDayOfInterval({ start, end });

  const filteredProjects = useMemo(() => {
    return projects.filter(p => selectedProjectIds.includes(p.id));
  }, [projects, selectedProjectIds]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => selectedProjectIds.includes(t.projectId));
  }, [tasks, selectedProjectIds]);

  const getEventsForDay = (day: Date) => {
    const dailyProjects = filteredProjects.filter(p => isWithin(day, { start: p.startDate, end: p.endDate }));
    const dailyTasks = filteredTasks.filter(t => isSameDay(t.dueDate, day));
    return { projects: dailyProjects, tasks: dailyTasks };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Schedule</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        <div className="lg:col-span-1">
          <ProjectFilter selectedProjectIds={selectedProjectIds} onSelectionChange={setSelectedProjectIds} />
        </div>
        <div className="lg:col-span-3 bg-white p-4 sm:p-6 border border-slate-200 rounded-xl shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold">{format(currentMonth, 'MMMM yyyy')}</h2>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-full hover:bg-gray-100"
              aria-label="Next month"
            >
              <ChevronRightIcon className="w-6 h-6" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-px text-center text-xs font-semibold text-gray-500 border-t border-l border-gray-200 bg-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="py-2 bg-white">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-px bg-gray-200 border-l border-gray-200">
            {days.map(day => {
              const { projects: dailyProjects, tasks: dailyTasks } = getEventsForDay(day);
              return (
                <div
                  key={day.toString()}
                  onClick={() => setSelectedDate(day)}
                  className={`relative p-2 h-28 overflow-hidden cursor-pointer transition-colors bg-white border-r border-b border-gray-200 ${
                    isSameMonth(day, currentMonth) ? 'hover:bg-blue-50' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'
                  }`}
                >
                  <time
                    dateTime={format(day, 'yyyy-MM-dd')}
                    className={`font-semibold ${isSameDay(day, new Date()) ? 'bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center' : ''}`}
                  >
                    {format(day, 'd')}
                  </time>
                  <div className="mt-1 space-y-1 text-xs text-left">
                    {dailyProjects.slice(0, 1).map(p => (
                      <div key={`p-${p.id}`} className="px-1 py-0.5 bg-blue-100 text-blue-800 rounded truncate">{p.name}</div>
                    ))}
                    {dailyTasks.slice(0, 1).map(t => (
                      <div key={`t-${t.id}`} className="px-1 py-0.5 bg-amber-100 text-amber-800 rounded truncate">{t.title}</div>
                    ))}
                    {(dailyProjects.length + dailyTasks.length) > 2 && (
                       <div className="text-gray-500 font-medium">+ {dailyProjects.length + dailyTasks.length - 2} more</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {selectedDate && (
        <DayViewModal
          date={selectedDate}
          onClose={() => setSelectedDate(null)}
          events={getEventsForDay(selectedDate)}
        />
      )}
    </div>
  );
};

export default Schedule;