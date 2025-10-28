import React from 'react';
import ReactDOM from 'react-dom/client';
import { GoogleGenAI } from '@google/genai';
import { Project, Task, TimeLog, User } from '../types';
import ProjectReport from '../components/ProjectReport';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

interface ReportData {
    project: Project & { currentSpend: number }; // Require currentSpend to be passed in
    tasks: Task[];
    timeLogs: TimeLog[];
    photos: { id: number; url: string; description: string; dateAdded: Date; }[];
    users: User[];
}

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


// 1. Call Gemini for a summary
const getExecutiveSummary = async (data: Omit<ReportData, 'photos' | 'users'>): Promise<string> => {
    const { project, tasks, timeLogs } = data;

    const completedTasks = tasks.filter(t => t.status === 'Done').length;
    const totalLaborCost = timeLogs.reduce((acc, log) => acc + (log.cost || 0), 0);
    const totalHours = timeLogs.reduce((acc, log) => acc + (log.durationMs || 0), 0) / (1000 * 60 * 60);

    const prompt = `
        You are a professional construction project manager. Based on the following data for the project "${project.name}", write a concise and professional executive summary for a project status report.
        The summary should be positive in tone but realistic, highlighting key achievements, financial status, and overall progress.
        Format the output as clean HTML using paragraphs (<p>) and bold tags (<b>) for emphasis where appropriate. Do not include markdown or a title.

        **Project Details:**
        - Name: ${project.name}
        - Address: ${project.address}
        - Status: ${project.status}
        - Type: ${project.type}
        - Start Date: ${project.startDate.toLocaleDateString()}
        - End Date: ${project.endDate.toLocaleDateString()}

        **Financials:**
        - Budget: $${project.budget.toFixed(2)}
        - Spent: $${project.currentSpend.toFixed(2)}
        - Remaining: $${(project.budget - project.currentSpend).toFixed(2)}

        **Tasks:**
        - Total Tasks: ${tasks.length}
        - Completed: ${completedTasks} (${tasks.length > 0 ? Math.round(completedTasks/tasks.length * 100) : 0}%)
        
        **Time & Labor:**
        - Total Hours Logged: ${totalHours.toFixed(2)}
        - Total Labor Cost: $${totalLaborCost.toFixed(2)}

        Now, write the executive summary.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [{ parts: [{ text: prompt }] }],
        });
        
        if (response.text && response.candidates?.[0]?.finishReason === 'STOP') {
             return response.text;
        } else {
            const reason = response.candidates?.[0]?.finishReason || 'Unknown Reason';
            console.warn(`Gemini response was not 'STOP'. Reason: ${reason}`);
            return `<p>The AI summary could not be generated because the model's response was incomplete. Reason: ${reason}</p>`;
        }
    } catch (error) {
        console.error("Error calling Gemini API:", error);
        return "<p>Could not generate AI summary due to an API error. Please check the console for details.</p>";
    }
}

// 2. Main function to orchestrate PDF generation
export const generatePdfReport = async (data: ReportData) => {
    const { project } = data;

    try {
        await checkPdfLibraries();
    } catch (error) {
        console.error(error);
        alert((error as Error).message || "PDF generation libraries are not available. Please check your internet connection and try again.");
        return;
    }

    const summary = await getExecutiveSummary(data);

    // Create a hidden container to render the report component
    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm'; // A4 width
    document.body.appendChild(container);

    const root = ReactDOM.createRoot(container);
    
    // Use a promise to wait for the component to render and images to load
    await new Promise<void>(resolve => {
        // FIX: Replaced JSX with React.createElement to prevent TSX parsing errors in a .ts file
        // and resolve related linter confusion.
        root.render(React.createElement(ProjectReport, { ...data, summary, onRendered: resolve }));
    });
    
    // @ts-ignore
    const { jsPDF } = window.jspdf;
    // @ts-ignore
    const canvas = await window.html2canvas(container, {
        scale: 2, // Higher scale for better quality
        useCORS: true,
        logging: false,
    });

    // Cleanup the hidden container
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
    const canvasWidth = canvas.width;
    const canvasHeight = canvas.height;
    const ratio = canvasWidth / pdfWidth;
    const totalPdfPages = Math.ceil(canvasHeight / (ratio * pdfHeight));

    for (let i = 0; i < totalPdfPages; i++) {
        if (i > 0) pdf.addPage();
        const yPos = -(i * pdfHeight * ratio);
        pdf.addImage(imgData, 'PNG', 0, yPos / ratio, pdfWidth, canvasHeight / ratio);
    }

    // Sanitize filename
    const filename = `Project_Report_${project.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    pdf.save(filename);
};
