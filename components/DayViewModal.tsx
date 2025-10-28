import React, { useState } from 'react';
import Modal from './Modal';
import { Task, Project } from '../types';
import { format } from 'date-fns';
import Button from './Button';
import { PlusIcon } from './icons/Icons';
import AddTaskModal from './AddTaskModal';

interface DayViewModalProps {
  date: Date;
  onClose: () => void;
  events: {
      tasks: Task[];
      projects: Project[];
  };
}

const DayViewModal: React.FC<DayViewModalProps> = ({ date, onClose, events }) => {
    const [isAddTaskModalOpen, setIsAddTaskModalOpen] = useState(false);

    return (
        <>
            <Modal isOpen={true} onClose={onClose} title={format(date, 'EEEE, MMMM d, yyyy')}>
                <div className="space-y-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Projects Active Today</h3>
                        {events.projects.length > 0 ? (
                            <ul className="space-y-2">
                                {events.projects.map(project => (
                                    <li key={project.id} className="p-2 bg-blue-50 rounded-md text-sm font-medium text-blue-800">
                                        {project.name}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">No projects active today.</p>
                        )}
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-2">Tasks Due Today</h3>
                        {events.tasks.length > 0 ? (
                            <ul className="space-y-2">
                                {events.tasks.map(task => (
                                    <li key={task.id} className="p-2 bg-gray-100 rounded-md text-sm font-medium text-gray-800">
                                        {task.title}
                                    </li>
                                ))}
                            </ul>
                        ) : (
                            <p className="text-sm text-gray-500">No tasks due today.</p>
                        )}
                    </div>
                    <div className="flex justify-end pt-4 border-t">
                        <Button onClick={() => setIsAddTaskModalOpen(true)}>
                            <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                            Add Task for this Day
                        </Button>
                    </div>
                </div>
            </Modal>
            {/* 
                NOTE: A more advanced implementation could pass the selected date 
                to AddTaskModal to pre-fill the due date. For now, it opens the standard modal.
            */}
            <AddTaskModal isOpen={isAddTaskModalOpen} onClose={() => setIsAddTaskModalOpen(false)} />
        </>
    );
};

export default DayViewModal;
