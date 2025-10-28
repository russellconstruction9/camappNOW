import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useDataContext';
import Card from './Card';
import Button from './Button';
import { ChevronLeftIcon, DownloadIcon, PencilIcon, Trash2Icon } from './icons/Icons';
import { format } from 'date-fns';
import { InvoiceStatus } from '../types';
import { generateInvoicePdf } from '../utils/invoiceGenerator';

const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
        case InvoiceStatus.Paid: return 'bg-green-100 text-green-800 border-green-200';
        case InvoiceStatus.Sent: return 'bg-blue-100 text-blue-800 border-blue-200';
        case InvoiceStatus.Overdue: return 'bg-red-100 text-red-800 border-red-200';
        case InvoiceStatus.Draft:
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const InvoiceDetails: React.FC = () => {
    const { invoiceId } = useParams<{ invoiceId: string }>();
    const { invoices, projects, deleteInvoice, updateInvoice } = useData();
    const navigate = useNavigate();
    const [isGenerating, setIsGenerating] = useState(false);

    const invoice = invoices.find(inv => inv.id === Number(invoiceId));
    const project = invoice ? projects.find(p => p.id === invoice.projectId) : null;

    if (!invoice || !project) {
        return (
            <div className="text-center py-10">
                <h1 className="text-2xl font-bold text-gray-800">Invoice not found</h1>
                <Link to="/invoicing" className="mt-4 inline-block text-blue-600 hover:underline">
                    &larr; Back to all invoices
                </Link>
            </div>
        );
    }

    const handleDelete = () => {
        if (window.confirm('Are you sure you want to delete this invoice? This action cannot be undone.')) {
            deleteInvoice(invoice.id);
            navigate('/invoicing');
        }
    };
    
    const handleGeneratePdf = async () => {
        setIsGenerating(true);
        try {
            await generateInvoicePdf(invoice, project);
        } catch(error) {
            console.error("Failed to generate PDF", error);
            alert("An error occurred while generating the PDF.");
        } finally {
            setIsGenerating(false);
        }
    };

    const handleStatusChange = (newStatus: InvoiceStatus) => {
        const updatedInvoice = { ...invoice, status: newStatus };
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, ...data } = updatedInvoice;
        updateInvoice(id, data);
    }

    return (
        <div className="space-y-6">
            <Link to="/invoicing" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                Back to Invoices
            </Link>

            <Card>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-800">Invoice #{invoice.invoiceNumber}</h1>
                        <p className="text-gray-500 mt-1">For project: {project.name}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                        {invoice.status === InvoiceStatus.Draft && (
                            <Link to={`/invoices/${invoice.id}/edit`}>
                                <Button variant="secondary"><PencilIcon className="w-4 h-4 mr-2" /> Edit</Button>
                            </Link>
                        )}
                        <Button onClick={handleGeneratePdf} disabled={isGenerating}>
                            <DownloadIcon className="w-4 h-4 mr-2" /> {isGenerating ? 'Generating...' : 'Download PDF'}
                        </Button>
                        <Button variant="destructive" onClick={handleDelete}><Trash2Icon className="w-4 h-4" /></Button>
                    </div>
                </div>

                <div className={`mt-6 p-4 rounded-lg border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${getStatusColor(invoice.status)}`}>
                    <div className="font-bold text-lg">Status: {invoice.status}</div>
                     <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">Change status:</span>
                        {invoice.status !== InvoiceStatus.Sent && <Button variant="secondary" className="!text-xs" onClick={() => handleStatusChange(InvoiceStatus.Sent)}>Mark as Sent</Button>}
                        {invoice.status !== InvoiceStatus.Paid && <Button variant="secondary" className="!text-xs" onClick={() => handleStatusChange(InvoiceStatus.Paid)}>Mark as Paid</Button>}
                    </div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 text-sm">
                    <div className="bg-gray-50 p-3 rounded-md">
                        <p className="font-semibold text-gray-500">Billed To</p>
                        <p className="font-bold text-gray-800">{project.name}</p>
                        <p className="text-gray-700">{project.address}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                        <p className="font-semibold text-gray-500">Date of Issue</p>
                        <p className="font-bold text-gray-800">{format(invoice.dateIssued, 'MMMM d, yyyy')}</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-md">
                        <p className="font-semibold text-gray-500">Due Date</p>
                        <p className="font-bold text-gray-800">{format(invoice.dueDate, 'MMMM d, yyyy')}</p>
                    </div>
                </div>

                <div className="mt-6 overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-3 text-left font-semibold text-gray-600">Description</th>
                                <th className="p-3 text-right font-semibold text-gray-600">Quantity</th>
                                <th className="p-3 text-right font-semibold text-gray-600">Rate</th>
                                <th className="p-3 text-right font-semibold text-gray-600">Amount</th>
                            </tr>
                        </thead>
                        <tbody>
                            {invoice.lineItems.map(item => (
                                <tr key={item.id} className="border-b">
                                    <td className="p-3">{item.description}</td>
                                    <td className="p-3 text-right">{item.quantity.toFixed(2)}</td>
                                    <td className="p-3 text-right">${item.rate.toFixed(2)}</td>
                                    <td className="p-3 text-right">${item.amount.toFixed(2)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="flex justify-end mt-4">
                    <div className="w-full max-w-xs space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="font-semibold text-gray-600">Subtotal:</span>
                            <span>${invoice.subtotal.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="font-semibold text-gray-600">Tax ({invoice.taxRate}%):</span>
                            <span>${invoice.taxAmount.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-lg pt-2 border-t text-gray-800">
                            <span>Total:</span>
                            <span>${invoice.total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
                {invoice.notes && (
                    <div className="mt-6 pt-4 border-t">
                        <h4 className="font-semibold text-gray-600">Notes:</h4>
                        <p className="text-sm text-gray-500 whitespace-pre-wrap">{invoice.notes}</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default InvoiceDetails;
