import React, { useState } from 'react';
import Card from './Card';
import { useData } from '../hooks/useDataContext';
import { Task, TaskStatus } from '../types';
import Button from './Button';
import { PlusIcon, ChevronLeftIcon } from './icons/Icons';
import { format } from 'date-fns';
import AddTaskModal from './AddTaskModal';
import EmptyState from './EmptyState';
import { useParams, Link } from 'react-router-dom';


const TaskCard: React.FC<{ task: Task }> = React.memo(({ task }) => {
    const { users, projects, updateTaskStatus } = useData();
    const assignee = users.find(u => u.id === task.assigneeId);
    const project = projects.find(p => p.id === task.projectId);

    return (
        <Card>
            <div className="flex justify-between items-start">
                <h3 className="text-lg font-bold">{task.title}</h3>
                {assignee && (
                    <div className="flex items-center">
                        <img src={assignee.avatarUrl} alt={assignee.name} title={assignee.name} className="w-8 h-8 rounded-full -ml-2 border-2 border-white" />
                    </div>
                )}
            </div>
            <p className="text-sm text-gray-500 mt-1">{project?.name || 'No Project'}</p>
            <p className="text-sm text-gray-700 mt-2">{task.description}</p>
            <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-200">
                <p className="text-sm font-medium text-gray-500">Due: {format(task.dueDate, 'MMM d, yyyy')}</p>
                <select 
                  value={task.status} 
                  onChange={(e) => updateTaskStatus(task.id, e.target.value as TaskStatus)}
                  className="text-sm font-semibold rounded-md border-slate-300 focus:ring-blue-600 focus:border-blue-600"
                >
                  <option>{TaskStatus.ToDo}</option>
                  <option>{TaskStatus.InProgress}</option>
                  <option>{TaskStatus.Done}</option>
                </select>
            </div>
        </Card>
    );
});

const Tasks: React.FC = () => {
    const { tasks, projects } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { projectId } = useParams<{ projectId: string }>();

    const project = projectId ? projects.find(p => p.id === Number(projectId)) : null;
    
    const filteredTasks = projectId 
        ? tasks.filter(t => t.projectId === Number(projectId))
        : tasks;

    const todoTasks = filteredTasks.filter(t => t.status === TaskStatus.ToDo);
    const inProgressTasks = filteredTasks.filter(t => t.status === TaskStatus.InProgress);
    const doneTasks = filteredTasks.filter(t => t.status === TaskStatus.Done);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                 <div>
                    {project && (
                        <Link to={`/projects/${projectId}`} className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-1">
                           <ChevronLeftIcon className="w-5 h-5 mr-2" />
                           Back to {project.name}
                        </Link>
                    )}
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                         {project ? `Tasks` : 'All Tasks'}
                    </h1>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                    New Task
                </Button>
            </div>
            {filteredTasks.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <h2 className="text-xl font-bold text-slate-700">To Do ({todoTasks.length})</h2>
                        {todoTasks.length > 0 ? todoTasks.map(task => <TaskCard key={task.id} task={task} />) : <p className="text-sm text-gray-500">No tasks to do.</p>}
                    </div>
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <h2 className="text-xl font-bold text-slate-700">In Progress ({inProgressTasks.length})</h2>
                        {inProgressTasks.length > 0 ? inProgressTasks.map(task => <TaskCard key={task.id} task={task} />) : <p className="text-sm text-gray-500">No tasks in progress.</p>}
                    </div>
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                        <h2 className="text-xl font-bold text-slate-700">Done ({doneTasks.length})</h2>
                        {doneTasks.length > 0 ? doneTasks.map(task => <TaskCard key={task.id} task={task} />) : <p className="text-sm text-gray-500">No tasks are done.</p>}
                    </div>
                </div>
            ) : (
                <EmptyState
                    title={project ? "No Tasks For This Project" : "No Tasks Yet"}
                    message="Get started by creating your first task."
                    buttonText="New Task"
                    onButtonClick={() => setIsModalOpen(true)}
                />
            )}
            <AddTaskModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                projectId={projectId ? Number(projectId) : undefined} 
            />
        </div>
    );
};

export default Tasks;