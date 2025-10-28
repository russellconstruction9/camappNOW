import React, { useState, useEffect } from 'react';
import Card from './Card';
import Button from './Button';
import { useData } from '../hooks/useDataContext';
import { format, formatDistanceStrict } from 'date-fns';
import { Location } from '../types';
import { SwitchIcon, DollarSignIcon } from './icons/Icons';
import SwitchJobModal from './SwitchJobModal';
import { generatePayrollReport } from '../utils/payrollReportGenerator';


const MapImage: React.FC<{ location?: Location, imageUrl?: string }> = ({ location, imageUrl }) => {
    if (!location || !imageUrl) {
        return <span className="text-gray-400">N/A</span>;
    }
    return (
        <a
            href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
            target="_blank"
            rel="noopener noreferrer"
            title={`View location on map: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`}
        >
            <img src={imageUrl} alt="Map of location" className="w-24 h-16 object-cover rounded-md border border-gray-200 hover:opacity-80 transition-opacity" />
        </a>
    );
};

const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
};


const TimeTracking: React.FC = () => {
    const { currentUser, timeLogs, projects, toggleClockInOut } = useData();
    const [elapsedTime, setElapsedTime] = useState('0s');
    const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');
    const [isSwitchModalOpen, setIsSwitchModalOpen] = useState(false);
    const [isGeneratingReport, setIsGeneratingReport] = useState(false);
    
    useEffect(() => {
        let interval: number;
        if (currentUser?.isClockedIn && currentUser?.clockInTime) {
            interval = window.setInterval(() => {
                setElapsedTime(formatDistanceStrict(new Date(), currentUser.clockInTime!));
            }, 1000);
        } else {
            setElapsedTime('0s');
        }
        return () => window.clearInterval(interval);
    }, [currentUser?.isClockedIn, currentUser?.clockInTime]);
    
    const handleGenerateReport = async () => {
        if (!currentUser) return;
        setIsGeneratingReport(true);
        try {
            await generatePayrollReport(currentUser, timeLogs, projects);
        } catch (error) {
            console.error("Failed to generate payroll report:", error);
            alert("Sorry, there was an error generating the report. Please check the console for details.");
        } finally {
            setIsGeneratingReport(false);
        }
    };


    if (!currentUser) {
        return (
             <div className="space-y-6">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Time Tracking</h1>
                <Card className="text-center">
                    <h2 className="text-xl font-bold">No User Selected</h2>
                    <p className="mt-2 text-gray-600">Please add a team member and/or select a user from the top right to start tracking time.</p>
                </Card>
            </div>
        )
    }
    
    const activeProject = projects.find(p => p.id === currentUser?.currentProjectId);
    const completedLogs = timeLogs.filter(log => log.userId === currentUser.id && log.clockOut);

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Time Tracking for {currentUser.name}</h1>
                 <Button onClick={handleGenerateReport} disabled={isGeneratingReport}>
                    <DollarSignIcon className="w-5 h-5 mr-2 -ml-1" />
                    {isGeneratingReport ? 'Generating...' : 'Generate Weekly Report'}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-1">
                    <Card className="text-center">
                        <h2 className="text-xl font-bold">Your Status</h2>
                        <p className={`mt-2 text-lg font-semibold ${currentUser.isClockedIn ? 'text-green-600' : 'text-gray-500'}`}>
                            {currentUser.isClockedIn ? 'Clocked In' : 'Clocked Out'}
                        </p>
                        
                        {!currentUser.isClockedIn && (
                            <div className="mt-4 space-y-4">
                                <select 
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                                    className="block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                    disabled={projects.length === 0}
                                >
                                    <option value="" disabled>{projects.length > 0 ? 'Select a project...' : 'Add a project first'}</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                                <Button
                                    onClick={() => toggleClockInOut(Number(selectedProjectId))}
                                    className='w-full'
                                    disabled={!selectedProjectId}
                                >
                                    Clock In
                                </Button>
                            </div>
                        )}

                        {currentUser.isClockedIn && currentUser.clockInTime && (
                            <div className="my-4">
                                {activeProject && (
                                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center mb-4">
                                        <p className="text-sm text-gray-500">Currently on:</p>
                                        <p className="text-lg font-bold text-primary-navy">{activeProject.name}</p>
                                    </div>
                                )}
                                <p className="text-4xl font-mono font-bold">{elapsedTime}</p>
                                <p className="text-sm text-gray-500 mt-1">
                                    Clocked in at {format(currentUser.clockInTime, 'p')}
                                </p>
                                <div className="mt-6 flex flex-col sm:flex-row gap-2">
                                    <Button
                                        onClick={() => setIsSwitchModalOpen(true)}
                                        className="w-full"
                                        variant="secondary"
                                    >
                                        <SwitchIcon className="w-4 h-4 mr-2" />
                                        Switch Job
                                    </Button>
                                    <Button
                                        onClick={() => toggleClockInOut()}
                                        className="w-full bg-red-600 hover:bg-red-700"
                                    >
                                        Clock Out
                                    </Button>
                                </div>
                            </div>
                        )}
                    </Card>
                </div>
                <div className="lg:col-span-2">
                    <Card>
                        <h2 className="text-xl font-bold mb-4">Your Recent Logs</h2>
                         {completedLogs.length > 0 ? (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left text-gray-500">
                                    <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-4 py-3">Date</th>
                                            <th scope="col" className="px-4 py-3">Project</th>
                                            <th scope="col" className="px-4 py-3">Duration</th>
                                            <th scope="col" className="px-4 py-3">Cost</th>
                                            <th scope="col" className="px-4 py-3">Status</th>
                                            <th scope="col" className="px-4 py-3">In Map</th>
                                            <th scope="col" className="px-4 py-3">Out Map</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {completedLogs.map(log => {
                                            const project = projects.find(p => p.id === log.projectId);
                                            return (
                                                <tr key={log.id} className="bg-white border-b">
                                                    <td className="px-4 py-4 font-medium text-gray-900 whitespace-nowrap">{format(log.clockIn, 'MMM d, yyyy')}</td>
                                                    <td className="px-4 py-4 font-medium text-gray-900">{project?.name || 'N/A'}</td>
                                                    <td className="px-4 py-4">{log.durationMs ? formatDuration(log.durationMs) : '-'}</td>
                                                    <td className="px-4 py-4 font-medium text-gray-800">{log.cost ? `$${log.cost.toFixed(2)}` : '-'}</td>
                                                    <td className="px-4 py-4">
                                                        {log.invoiceId ? (
                                                             <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                Billed
                                                            </span> 
                                                        ) : (
                                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                                                                Unbilled
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="px-4 py-4"><MapImage location={log.clockInLocation} imageUrl={log.clockInMapImage} /></td>
                                                    <td className="px-4 py-4"><MapImage location={log.clockOutLocation} imageUrl={log.clockOutMapImage} /></td>
                                                </tr>
                                            )
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <p className="text-center text-gray-500 py-4">No time logs recorded for this user yet.</p>
                        )}
                    </Card>
                </div>
            </div>
            <SwitchJobModal isOpen={isSwitchModalOpen} onClose={() => setIsSwitchModalOpen(false)} />
        </div>
    );
};

export default TimeTracking;