import React from 'react';
import ReactDOM from 'react-dom/client';
import { Invoice, Project } from '../types';
import InvoicePDF from '../components/InvoicePDF';

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
        script.crossOrigin = 'anonymous';
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

export const generateInvoicePdf = async (invoice: Invoice, project: Project) => {
    try {
        await checkPdfLibraries();
    } catch (error) {
        console.error(error);
        alert((error as Error).message || "PDF generation libraries are not available. Please check your internet connection and try again.");
        return;
    }

    const container = document.createElement('div');
    container.style.position = 'absolute';
    container.style.left = '-9999px';
    container.style.width = '210mm';
    document.body.appendChild(container);

    const root = ReactDOM.createRoot(container);
    
    await new Promise<void>(resolve => {
        root.render(React.createElement(InvoicePDF, { invoice, project, onRendered: resolve }));
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
    const pageContentHeight = canvas.height * (pdfWidth / canvas.width);
    const pdfHeight = pdf.internal.pageSize.getHeight();

    let position = 0;
    pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pageContentHeight);
    let heightLeft = pageContentHeight - pdfHeight;

    while (heightLeft > 0) {
      position = heightLeft - pageContentHeight;
      pdf.addPage();
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pageContentHeight);
      heightLeft -= pdfHeight;
    }

    const filename = `Invoice_${invoice.invoiceNumber}_${project.name.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    pdf.save(filename);
};
