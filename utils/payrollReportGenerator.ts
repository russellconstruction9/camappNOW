import React from 'react';
import ReactDOM from 'react-dom/client';
import { User, TimeLog, Project } from '../types';
import PayrollReport from '../components/PayrollReport';
import { startOfWeek, endOfWeek, isWithinInterval, format } from 'date-fns';

// Helper to dynamically load scripts and wait for them to be ready.
const scriptPromises = new Map<string, Promise<void>>();

const loadScript = (url: string): Promise<void> => {
    if (scriptPromises.has(url)) {
        return scriptPromises.get(url)!;
    }
    const promise = new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = url;
        script.async = true;
        script.crossOrigin = 'anonymous'; // Added for better cross-origin compatibility
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${url}`));
        document.head.appendChild(script);
    });
    scriptPromises.set(url, promise);
    return promise;
}

const checkPdfLibraries = async (): Promise<void> => {
    // @ts-ignore
    if (window.jspdf && window.html2canvas) {
        return;
    }
    try {
        await Promise.all([
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'),
            loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js')
        ]);
        // @ts-ignore
        if (!window.jspdf || !window.html2canvas) {
             throw new Error("Scripts loaded but were not found on the window object.");
        }
    } catch (error) {
        console.error("PDF library loading failed:", error);
        throw new Error("PDF libraries did not load correctly. Please check your network connection and ad-blockers.");
    }
};

export const generatePayrollReport = async (user: User, allLogs: TimeLog[], projects: Project[]) => {
    try {
        await checkPdfLibraries();
    } catch (error) {
        console.error(error);
        alert((error as Error).message || "PDF generation libraries are not available. Please check your internet connection and try again.");
        return;
    }

    const today = new Date();
    const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // Monday
    const weekEnd = endOfWeek(today, { weekStartsOn: 1 }); // Sunday

    const weeklyLogs = allLogs.filter(log => 
        log.userId === user.id && 
        log.clockOut && 
        isWithinInterval(new Date(log.clockIn), { start: weekStart, end: weekEnd })
    );

    if (weeklyLogs.length === 0) {
        alert("No completed time logs found for the current week. Cannot generate a report.");
        return;
    }

    const totalHours = weeklyLogs.reduce((acc, log) => acc + (log.durationMs || 0), 0) / (1000 * 60 * 60);
    const totalPay = weeklyLogs.reduce((acc, log) => acc + (log.cost || 0), 0);
    
    // Create a hidden container for rendering
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm'; // A4 width
    document.body.appendChild(container);

    const root = ReactDOM.createRoot(container);
    
    await new Promise<void>(resolve => {
        root.render(React.createElement(PayrollReport, {
            user,
            logs: weeklyLogs,
            projects,
            weekStart,
            weekEnd,
            totalHours,
            totalPay,
            onRendered: resolve,
        }));
    });
    
    // @ts-ignore
    const { jsPDF } = window.jspdf;
    // @ts-ignore
    const canvas = await window.html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
    });

    root.unmount();
    document.body.removeChild(container);

    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const ratio = canvas.width / pdfWidth;
    const totalPdfPages = Math.ceil(canvas.height / (ratio * pdfHeight));

    for (let i = 0; i < totalPdfPages; i++) {
        if (i > 0) pdf.addPage();
        const yPos = -(i * pdfHeight * ratio);
        pdf.addImage(imgData, 'PNG', 0, yPos / ratio, pdfWidth, canvas.height / ratio);
    }
    
    const filename = `Payroll_Report_${user.name.replace(/[^a-z0-9]/gi, '_')}_${format(weekStart, 'yyyy-MM-dd')}.pdf`;
    pdf.save(filename);
};