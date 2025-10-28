import React, { useEffect } from 'react';
import { User, TimeLog, Project, Location } from '../types';
import { format } from 'date-fns';
import { SccLogoIcon } from './icons/Icons';

interface PayrollReportProps {
    user: User;
    logs: TimeLog[];
    projects: Project[];
    weekStart: Date;
    weekEnd: Date;
    totalHours: number;
    totalPay: number;
    onRendered: () => void;
}


const PayrollReport: React.FC<PayrollReportProps> = ({ user, logs, projects, weekStart, weekEnd, totalHours, totalPay, onRendered }) => {
    
    useEffect(() => {
        // This effect waits for all map images to load before calling the onRendered callback
        // to ensure they are captured in the PDF.
        const images = document.querySelectorAll<HTMLImageElement>('.report-map-image');
        if (images.length === 0) {
            // If there are no images, we can signal readiness right away.
            requestAnimationFrame(() => onRendered());
            return;
        }

        const promises = Array.from(images).map(img => {
            return new Promise<void>(resolve => {
                if (img.complete) {
                    resolve();
                } else {
                    img.addEventListener('load', () => resolve(), { once: true });
                    img.addEventListener('error', () => resolve(), { once: true }); // Also resolve on error to not block PDF generation
                }
            });
        });

        Promise.all(promises).then(() => {
            // Use requestAnimationFrame to wait for the browser to paint the final layout
            requestAnimationFrame(() => {
                onRendered();
            });
        });
    }, [onRendered]);

    const getProjectName = (id: number) => projects.find(p => p.id === id)?.name || 'N/A';
    
    const msToHours = (ms?: number) => {
        if (!ms) return '0.00';
        return (ms / (1000 * 60 * 60)).toFixed(2);
    }

    const renderPunchInfo = (
        time?: Date,
        location?: Location,
        imageUrl?: string
    ) => {
        if (!time) {
            return <span className="text-gray-500">N/A</span>;
        }

        return (
            <div className="flex items-start gap-2">
                {imageUrl && location ? (
                     <a
                        href={`https://www.google.com/maps?q=${location.lat},${location.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0"
                    >
                        <img 
                            src={imageUrl} 
                            alt="Map of location" 
                            crossOrigin="anonymous"
                            className="w-20 h-14 object-cover rounded-md border border-gray-200 report-map-image" 
                        />
                    </a>
                ) : (
                    <div className="w-20 h-14 bg-gray-100 rounded-md flex items-center justify-center text-xs text-gray-400 flex-shrink-0">
                        No Map
                    </div>
                )}
                <div>
                    <p className="font-semibold">{format(time, 'p')}</p>
                    {location && (
                        <p className="text-xs text-gray-500">
                            {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                        </p>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white text-gray-800 font-sans p-8" style={{ width: '210mm' }}>
            <header className="flex justify-between items-center border-b-4 border-primary-navy pb-4 mb-8">
                <div>
                    <h1 className="text-4xl font-bold text-primary-navy">Weekly Hours Report</h1>
                    <p className="text-lg text-gray-600">For Payroll Processing</p>
                </div>
                 <div className="text-right">
                    <SccLogoIcon className="w-16 h-16 text-primary-navy" />
                    <p className="font-bold text-primary-navy mt-1">SCC</p>
                </div>
            </header>

            <section className="mb-8 grid grid-cols-3 gap-6 text-center">
                <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-600">Employee</h3>
                    <p className="text-lg font-semibold text-primary-navy">{user.name}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-lg">
                    <h3 className="font-bold text-gray-600">Pay Period</h3>
                    <p className="text-lg font-semibold text-primary-navy">
                        {format(weekStart, 'MMM d, yyyy')} - {format(weekEnd, 'MMM d, yyyy')}
                    </p>
                </div>
                 <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h3 className="font-bold text-green-800">Total Pay</h3>
                    <p className="text-2xl font-bold text-green-700">${totalPay.toFixed(2)}</p>
                </div>
            </section>

            <section>
                <h2 className="text-2xl font-bold border-b-2 border-gray-200 pb-2 mb-4 text-primary-navy">Time Log Details</h2>
                 <table className="w-full text-sm text-left">
                    <thead className="bg-slate-100 text-gray-600">
                        <tr>
                            <th className="p-2">Date</th>
                            <th className="p-2">Project</th>
                            <th className="p-2">Clock In Details</th>
                            <th className="p-2">Clock Out Details</th>
                            <th className="p-2 text-right">Duration (Hrs)</th>
                            <th className="p-2 text-right">Line Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {logs.sort((a,b) => a.clockIn.getTime() - b.clockIn.getTime()).map(log => (
                            <tr key={log.id} className="border-b align-top">
                                <td className="p-2 font-medium">{format(log.clockIn, 'E, MMM d')}</td>
                                <td className="p-2">{getProjectName(log.projectId)}</td>
                                <td className="p-2">
                                    {renderPunchInfo(log.clockIn, log.clockInLocation, log.clockInMapImage)}
                                </td>
                                <td className="p-2">
                                    {renderPunchInfo(log.clockOut, log.clockOutLocation, log.clockOutMapImage)}
                                </td>
                                <td className="p-2 text-right font-mono">{msToHours(log.durationMs)}</td>
                                <td className="p-2 text-right font-mono font-semibold">${log.cost?.toFixed(2) || '0.00'}</td>
                            </tr>
                        ))}
                    </tbody>
                    <tfoot className="font-bold bg-slate-100">
                        <tr>
                            <td colSpan={4} className="p-2 text-right">Weekly Totals:</td>
                            <td className="p-2 text-right font-mono text-base">{totalHours.toFixed(2)}</td>
                            <td className="p-2 text-right font-mono text-base">${totalPay.toFixed(2)}</td>
                        </tr>
                    </tfoot>
                </table>
            </section>
        </div>
    );
}

export default PayrollReport;