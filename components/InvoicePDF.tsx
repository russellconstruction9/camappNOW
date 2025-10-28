import React, { useEffect } from 'react';
import { Invoice, Project } from '../types';
import { format } from 'date-fns';
import { SccLogoIcon } from './icons/Icons';

interface InvoicePDFProps {
    invoice: Invoice;
    project: Project;
    onRendered: () => void;
}

const InvoicePDF: React.FC<InvoicePDFProps> = ({ invoice, project, onRendered }) => {
    
    useEffect(() => {
        // Simple callback after first render. Assumes no external images need loading.
        requestAnimationFrame(() => {
            onRendered();
        });
    }, [onRendered]);

    return (
        <div className="bg-white text-gray-800 font-sans p-10" style={{ width: '210mm' }}>
            <header className="flex justify-between items-start pb-6 border-b-2 border-gray-200">
                <div className="text-left">
                    <SccLogoIcon className="w-20 h-20 text-primary-navy" />
                    <h1 className="text-2xl font-bold text-primary-navy mt-2">SCC</h1>
                    {/* Add Company Address Here if available */}
                </div>
                <div className="text-right">
                    <h2 className="text-5xl font-bold text-gray-400 uppercase tracking-wider">Invoice</h2>
                    <p className="mt-2"><b>Invoice #:</b> {invoice.invoiceNumber}</p>
                    <p><b>Date Issued:</b> {format(invoice.dateIssued, 'MMMM d, yyyy')}</p>
                </div>
            </header>

            <section className="grid grid-cols-2 gap-10 my-8">
                <div>
                    <h3 className="font-semibold text-gray-500 uppercase tracking-wide text-sm mb-2">Billed To</h3>
                    <p className="font-bold text-lg text-primary-navy">{project.name}</p>
                    <p className="text-gray-600">{project.address}</p>
                </div>
                <div className="text-right">
                    <h3 className="font-semibold text-gray-500 uppercase tracking-wide text-sm mb-2">Total Due</h3>
                    <p className="text-4xl font-bold text-primary-navy">${invoice.total.toFixed(2)}</p>
                    <p className="text-gray-600 mt-1"><b>Due Date:</b> {format(invoice.dueDate, 'MMMM d, yyyy')}</p>
                </div>
            </section>

            <section>
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-100 border-b-2 border-gray-300">
                        <tr>
                            <th className="p-3 font-semibold text-gray-600 uppercase">Description</th>
                            <th className="p-3 text-right font-semibold text-gray-600 uppercase">Quantity</th>
                            <th className="p-3 text-right font-semibold text-gray-600 uppercase">Rate</th>
                            <th className="p-3 text-right font-semibold text-gray-600 uppercase">Amount</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {invoice.lineItems.map(item => (
                            <tr key={item.id}>
                                <td className="p-3">{item.description}</td>
                                <td className="p-3 text-right">{item.quantity.toFixed(2)}</td>
                                <td className="p-3 text-right">${item.rate.toFixed(2)}</td>
                                <td className="p-3 text-right font-medium">${item.amount.toFixed(2)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </section>

            <section className="flex justify-end mt-6">
                <div className="w-full max-w-sm space-y-2">
                    <div className="flex justify-between">
                        <span className="font-semibold text-gray-600">Subtotal:</span>
                        <span className="text-gray-800">${invoice.subtotal.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="font-semibold text-gray-600">Tax ({invoice.taxRate}%):</span>
                        <span className="text-gray-800">${invoice.taxAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between font-bold text-2xl pt-2 border-t-2 border-gray-300 text-primary-navy">
                        <span>Total:</span>
                        <span>${invoice.total.toFixed(2)}</span>
                    </div>
                </div>
            </section>

            {invoice.notes && (
                <section className="mt-10 pt-6 border-t border-gray-200">
                    <h4 className="font-semibold text-gray-500 uppercase tracking-wide text-sm mb-2">Notes</h4>
                    <p className="text-sm text-gray-600 whitespace-pre-wrap">{invoice.notes}</p>
                </section>
            )}

            <footer className="text-center text-xs text-gray-400 mt-16 pt-6 border-t border-gray-200">
                <p>Thank you for your business!</p>
                <p>Please make all payments to SCC.</p>
            </footer>
        </div>
    );
};

export default InvoicePDF;
