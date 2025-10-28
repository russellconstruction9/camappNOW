import React, { useMemo } from 'react';
import Card from './Card';
import { useData } from '../hooks/useDataContext';
import { TaskStatus } from '../types';
import { isThisWeek } from 'date-fns';
import { Link } from 'react-router-dom';
import ProjectListItem from './ProjectListItem'; // Import the new detailed component

const Dashboard: React.FC = () => {
    const { projects, tasks, users, currentUser, timeLogs } = useData();

    if (!currentUser && users.length === 0) {
        return (
            <div className="text-center py-10">
                <h1 className="text-2xl font-bold text-gray-800">Welcome to ConstructTrack Pro</h1>
                <p className="mt-2 text-gray-600">Get started by adding your first team member.</p>
            </div>
        )
    }

    // Time tracking data
    const userTimeLogsThisWeek = useMemo(() => timeLogs.filter(log => 
        log.userId === currentUser?.id && 
        log.clockOut && 
        isThisWeek(new Date(log.clockIn), { weekStartsOn: 1 })
    ), [timeLogs, currentUser]);

    const totalMsThisWeek = useMemo(() => userTimeLogsThisWeek.reduce((acc, log) => acc + (log.durationMs || 0), 0), [userTimeLogsThisWeek]);
    
    const hoursThisWeek = useMemo(() => (totalMsThisWeek / (1000 * 60 * 60)).toFixed(1), [totalMsThisWeek]);

    const weeklyCost = useMemo(() => userTimeLogsThisWeek.reduce((acc, log) => acc + (log.cost || 0), 0), [userTimeLogsThisWeek]);
    
    // Task status counts
    const { todoTasks, inProgressTasks, doneTasks } = useMemo(() => ({
        todoTasks: tasks.filter(t => t.status === TaskStatus.ToDo).length,
        inProgressTasks: tasks.filter(t => t.status === TaskStatus.InProgress).length,
        doneTasks: tasks.filter(t => t.status === TaskStatus.Done).length,
    }), [tasks]);

    // Team status
    const teamClockedIn = useMemo(() => users.filter(u => u.isClockedIn).length, [users]);
    
    const projectsInProgress = useMemo(() => projects.filter(p => p.status === 'In Progress'), [projects]);

    return (
        <div className="space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
                {currentUser ? `Welcome back, ${currentUser.name.split(' ')[0]}!` : "Dashboard"}
            </h1>
            
            {/* Main stats at the top */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Link to="/time-tracking" className="block hover:shadow-lg transition-shadow duration-200 rounded-xl">
                    <Card className="h-full">
                        <h3 className="text-lg font-bold text-gray-800">Hours This Week</h3>
                        <p className="mt-2 text-4xl font-semibold text-blue-600">{hoursThisWeek}</p>
                        <p className="text-sm font-medium text-gray-500">Total Cost: ${weeklyCost.toFixed(2)}</p>
                    </Card>
                </Link>
                 <Link to="/tasks" className="block hover:shadow-lg transition-shadow duration-200 rounded-xl">
                    <Card className="h-full">
                        <h3 className="text-lg font-bold text-gray-800">Task Status</h3>
                        <div className="mt-2 space-y-2">
                           <div className="flex justify-between items-center">
                                <span className="flex items-center text-sm font-medium text-gray-600">
                                    <span className="w-2 h-2 rounded-full bg-slate-400 mr-2"></span> To Do
                                </span>
                                <span className="font-semibold text-gray-800">{todoTasks}</span>
                           </div>
                            <div className="flex justify-between items-center">
                                <span className="flex items-center text-sm font-medium text-amber-600">
                                    <span className="w-2 h-2 rounded-full bg-amber-400 mr-2"></span> In Progress
                                </span>
                                <span className="font-semibold text-gray-800">{inProgressTasks}</span>
                           </div>
                           <div className="flex justify-between items-center">
                                <span className="flex items-center text-sm font-medium text-green-600">
                                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> Done
                                </span>
                                <span className="font-semibold text-gray-800">{doneTasks}</span>
                           </div>
                        </div>
                    </Card>
                </Link>
                <Link to="/team" className="block hover:shadow-lg transition-shadow duration-200 rounded-xl">
                    <Card className="h-full">
                        <h3 className="text-lg font-bold text-gray-800">Active Team</h3>
                        <p className="mt-2 text-4xl font-semibold text-blue-600">
                            {teamClockedIn} <span className="text-2xl text-gray-500">/ {users.length}</span>
                        </p>
                        <p className={`text-sm font-semibold ${currentUser?.isClockedIn ? 'text-green-600' : 'text-gray-500'}`}>
                           You are {currentUser?.isClockedIn ? 'Clocked In' : 'Clocked Out'}
                        </p>
                    </Card>
                </Link>
            </div>

            <Card>
                <h2 className="text-xl font-bold mb-4">Projects Overview ({projectsInProgress.length})</h2>
                {projectsInProgress.length > 0 ? (
                    <div className="space-y-4">
                        {projectsInProgress.slice(0, 5).map(project => (
                           <ProjectListItem key={project.id} project={project} />
                        ))}
                    </div>
                ) : <p className="text-gray-500">No projects are currently in progress.</p>}
            </Card>
        </div>
    );
}

export default Dashboard;