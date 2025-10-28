import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useDataContext';
import Card from './Card';
import Button from './Button';
import { PlusIcon } from './icons/Icons';
import EmptyState from './EmptyState';
import { format } from 'date-fns';
import { InvoiceStatus } from '../types';

const getStatusColor = (status: InvoiceStatus) => {
    switch (status) {
        case InvoiceStatus.Paid: return 'bg-green-100 text-green-800';
        case InvoiceStatus.Sent: return 'bg-blue-100 text-blue-800';
        case InvoiceStatus.Overdue: return 'bg-red-100 text-red-800';
        case InvoiceStatus.Draft:
        default: return 'bg-gray-100 text-gray-800';
    }
};

const Invoices: React.FC = () => {
    const { invoices, projects } = useData();
    const navigate = useNavigate();

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Invoicing</h1>
                <Link to="/invoices/new">
                    <Button>
                        <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                        New Invoice
                    </Button>
                </Link>
            </div>

            {invoices.length > 0 ? (
                <div className="space-y-4">
                    {invoices.map(invoice => {
                        const project = projects.find(p => p.id === invoice.projectId);
                        return (
                            <Link to={`/invoices/${invoice.id}`} key={invoice.id}>
                                <Card className="hover:shadow-lg transition-shadow duration-200">
                                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                                        <div>
                                            <p className="text-lg font-bold text-gray-800">{`Invoice #${invoice.invoiceNumber}`}</p>
                                            <p className="text-sm text-gray-600">{project?.name || 'Unknown Project'}</p>
                                        </div>
                                        <div className="text-left sm:text-right">
                                            <p className="text-xl font-semibold">${invoice.total.toFixed(2)}</p>
                                            <p className="text-sm text-gray-500">Due: {format(invoice.dueDate, 'MMM d, yyyy')}</p>
                                        </div>
                                        <div className="flex items-center sm:flex-col sm:items-end justify-between">
                                             <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                                {invoice.status}
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <EmptyState
                    title="No Invoices Yet"
                    message="Get started by creating your first invoice."
                    buttonText="New Invoice"
                    onButtonClick={() => navigate('/invoices/new')}
                />
            )}
        </div>
    );
};

export default Invoices;
