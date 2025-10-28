import React, { useEffect } from 'react';
import { Project, Task, TimeLog, User } from '../types';
import { format } from 'date-fns';
import { SccLogoIcon } from './icons/Icons';

interface ReportData {
    project: Project & { currentSpend: number };
    tasks: Task[];
    timeLogs: TimeLog[];
    photos: { id: number; url: string; description: string; dateAdded: Date; }[];
    users: User[];
    summary: string;
    onRendered: () => void; // Callback to signal rendering and image loading is complete
}

const ProjectReport: React.FC<ReportData> = ({ project, tasks, timeLogs, photos, users, summary, onRendered }) => {
    
    useEffect(() => {
        // This effect waits for all images to load before calling the onRendered callback
        // FIX: Cast querySelectorAll result to HTMLImageElement to access the 'complete' property.
        const images = document.querySelectorAll<HTMLImageElement>('.report-photo');
        const promises = Array.from(images).map(img => {
            return new Promise<void>(resolve => {
                if (img.complete) {
                    resolve();
                } else {
                    img.addEventListener('load', () => resolve(), { once: true });
                    img.addEventListener('error', () => resolve(), { once: true }); // Also resolve on error
                }
            });
        });

        Promise.all(promises).then(() => {
            // Use requestAnimationFrame to wait for the browser to paint the final layout
            // before signaling that rendering is complete. This is more reliable than setTimeout.
            requestAnimationFrame(() => {
                onRendered();
            });
        });
    }, [photos, onRendered]);

    const getUserName = (id: number) => users.find(u => u.id === id)?.name || 'Unknown User';

    const totalLaborCost = timeLogs.reduce((acc, log) => acc + (log.cost || 0), 0);
    const totalHours = timeLogs.reduce((acc, log) => acc + (log.durationMs || 0), 0) / (1000 * 60 * 60);
    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0;
    const budgetUsedPercentage = project.budget > 0 ? Math.round((project.currentSpend / project.budget) * 100) : 0;

    return (
        <div className="bg-white text-gray-800 font-sans p-8" style={{ width: '210mm' }}>
            {/* Page 1: Title and Summary */}
            <header className="flex justify-between items-center border-b-4 border-primary-navy pb-4">
                <div>
                    <h1 className="text-4xl font-bold text-primary-navy">{project.name}</h1>
                    <p className="text-lg text-gray-600">Project Status Report</p>
                </div>
                <div className="text-right">
                    <SccLogoIcon className="w-16 h-16 text-primary-navy" />
                    <p className="font-bold text-primary-navy mt-1">SCC</p>
                </div>
            </header>
            <div className="flex justify-between text-sm mt-2 mb-8 text-gray-500">
                <span>{project.address}</span>
                <span>Report Date: {format(new Date(), 'MMMM d, yyyy')}</span>
            </div>

            <section className="mb-8">
                <h2 className="text-2xl font-bold border-b-2 border-gray-200 pb-2 mb-4 text-primary-navy">Executive Summary</h2>
                <div className="text-gray-700 space-y-3" dangerouslySetInnerHTML={{ __html: summary }}></div>
            </section>
            
            <section className="mb-8 grid grid-cols-3 gap-6">
                <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-600">Timeline</h3>
                    <p className="text-lg font-semibold text-primary-navy">{format(project.startDate, 'MMM d, yyyy')} - {format(project.endDate, 'MMM d, yyyy')}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-600">Total Labor Cost</h3>
                    <p className="text-lg font-semibold text-primary-navy">${totalLaborCost.toFixed(2)}</p>
                </div>
                 <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-600">Total Hours</h3>
                    <p className="text-lg font-semibold text-primary-navy">{totalHours.toFixed(2)}</p>
                </div>
            </section>

            {/* Financial Summary */}
            <section className="mb-8">
                <h2 className="text-2xl font-bold border-b-2 border-gray-200 pb-2 mb-4 text-primary-navy">Financial Summary</h2>
                <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex justify-between font-medium">
                        <span>Spent: <span className="font-bold">${project.currentSpend.toFixed(2)}</span></span>
                        <span>Budget: <span className="font-bold">${project.budget.toFixed(2)}</span></span>
                    </div>
                    <div className="w-full bg-gray-300 rounded-full h-4 mt-2">
                        <div className={`h-4 rounded-full ${budgetUsedPercentage > 100 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${Math.min(budgetUsedPercentage, 100)}%` }}></div>
                    </div>
                    <div className={`text-right mt-1 font-bold ${project.currentSpend > project.budget ? 'text-red-600' : 'text-green-700'}`}>
                        {project.currentSpend > project.budget 
                            ? `$${(project.currentSpend - project.budget).toFixed(2)} Over Budget`
                            : `$${(project.budget - project.currentSpend).toFixed(2)} Remaining`
                        }
                    </div>
                </div>
            </section>

            {/* Task Summary */}
            <section className="mb-8 break-inside-avoid">
                <h2 className="text-2xl font-bold border-b-2 border-gray-200 pb-2 mb-4 text-primary-navy">Task Summary ({completedTasks}/{tasks.length} Complete)</h2>
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-gray-600">
                        <tr>
                            <th className="p-2">Task</th>
                            <th className="p-2">Assignee</th>
                            <th className="p-2">Due Date</th>
                            <th className="p-2">Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {tasks.map(task => (
                            <tr key={task.id} className="border-b">
                                <td className="p-2 font-medium">{task.title}</td>
                                <td className="p-2">{getUserName(task.assigneeId)}</td>
                                <td className="p-2">{format(task.dueDate, 'MMM d, yyyy')}</td>
                                <td className="p-2 font-semibold">{task.status}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

             {/* Time Log Summary */}
            <section className="mb-8 break-inside-avoid">
                <h2 className="text-2xl font-bold border-b-2 border-gray-200 pb-2 mb-4 text-primary-navy">Time Log Summary</h2>
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-gray-600">
                        <tr>
                            <th className="p-2">Date</th>
                            <th className="p-2">Team Member</th>
                            <th className="p-2">Duration</th>
                            <th className="p-2">Cost</th>
                        </tr>
                    </thead>
                    <tbody>
                        {timeLogs.map(log => (
                            <tr key={log.id} className="border-b">
                                <td className="p-2">{format(log.clockIn, 'MMM d, yyyy')}</td>
                                <td className="p-2 font-medium">{getUserName(log.userId)}</td>
                                <td className="p-2">{log.durationMs ? `${(log.durationMs / (1000 * 60 * 60)).toFixed(2)} hrs` : '-'}</td>
                                <td className="p-2 font-semibold">${log.cost?.toFixed(2) || '0.00'}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            {/* Photo Gallery */}
            {photos.length > 0 && (
                <section className="break-before-page">
                    <h2 className="text-2xl font-bold border-b-2 border-gray-200 pb-2 mb-4 text-primary-navy">Photo Log</h2>
                    <div className="grid grid-cols-2 gap-4">
                        {photos.map(photo => (
                            <div key={photo.id} className="border rounded-lg p-2 break-inside-avoid">
                                <img src={photo.url} alt={photo.description} className="w-full h-auto rounded report-photo" />
                                <p className="text-sm mt-2 text-gray-700">{photo.description}</p>
                                <p className="text-xs text-gray-500 mt-1">{format(photo.dateAdded, 'MMM d, yyyy')}</p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

        </div>
    );
}

export default ProjectReport;
