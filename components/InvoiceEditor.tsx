import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useData } from '../hooks/useDataContext';
import { Invoice, InvoiceLineItem, InvoiceStatus, TimeLog } from '../types';
import Card from './Card';
import Button from './Button';
import { ChevronLeftIcon, Trash2Icon } from './icons/Icons';
import { format } from 'date-fns';

const InvoiceEditor: React.FC = () => {
    const { invoiceId } = useParams<{ invoiceId?: string }>();
    const navigate = useNavigate();
    const location = useLocation();
    const { projects, users, timeLogs, addInvoice, updateInvoice, invoices } = useData();

    const isEditMode = !!invoiceId;
    const existingInvoice = useMemo(() => isEditMode ? invoices.find(inv => inv.id === Number(invoiceId)) : null, [invoices, invoiceId, isEditMode]);

    const [projectId, setProjectId] = useState<number | ''>('');
    const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([]);
    const [dateIssued, setDateIssued] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [dueDate, setDueDate] = useState('');
    const [notes, setNotes] = useState('');
    const [taxRate, setTaxRate] = useState('0');

    useEffect(() => {
        const defaultProjectId = location.state?.defaultProjectId;
        if (defaultProjectId) {
            setProjectId(defaultProjectId);
        }

        if (isEditMode && existingInvoice) {
            setProjectId(existingInvoice.projectId);
            setLineItems(existingInvoice.lineItems);
            setDateIssued(format(existingInvoice.dateIssued, 'yyyy-MM-dd'));
            setDueDate(format(existingInvoice.dueDate, 'yyyy-MM-dd'));
            setNotes(existingInvoice.notes || '');
            setTaxRate(existingInvoice.taxRate.toString());
        }
    }, [isEditMode, existingInvoice, location.state]);

    const unbilledTimeLogs = useMemo(() => {
        if (!projectId) return [];
        return timeLogs.filter(log => log.projectId === projectId && !log.invoiceId && log.clockOut);
    }, [timeLogs, projectId]);

    const handleAddTimeLogs = (logs: TimeLog[]) => {
        const newItems: InvoiceLineItem[] = logs.map(log => {
            const user = users.find(u => u.id === log.userId);
            const hours = (log.durationMs || 0) / (1000 * 60 * 60);
            const rate = user?.hourlyRate || 0;
            return {
                id: `time-${log.id}`,
                description: `Labor: ${user?.name} on ${format(log.clockIn, 'MMM d, yyyy')}`,
                quantity: hours,
                rate: rate,
                amount: hours * rate,
                timeLogIds: [log.id]
            };
        });
        setLineItems(prev => [...prev, ...newItems]);
    };

    const handleAddManualItem = () => {
        setLineItems(prev => [...prev, {
            id: `manual-${Date.now()}`,
            description: '',
            quantity: 1,
            rate: 0,
            amount: 0
        }]);
    };

    const handleLineItemChange = (index: number, field: keyof InvoiceLineItem, value: any) => {
        const newItems = [...lineItems];
        const item = { ...newItems[index], [field]: value };
        if (field === 'quantity' || field === 'rate') {
            item.amount = (item.quantity || 0) * (item.rate || 0);
        }
        newItems[index] = item;
        setLineItems(newItems);
    };

    const handleRemoveLineItem = (id: string) => {
        setLineItems(prev => prev.filter(item => item.id !== id));
    };
    
    const { subtotal, taxAmount, total } = useMemo(() => {
        const subtotal = lineItems.reduce((acc, item) => acc + item.amount, 0);
        const tax = subtotal * (parseFloat(taxRate) / 100 || 0);
        const total = subtotal + tax;
        return { subtotal, taxAmount: tax, total };
    }, [lineItems, taxRate]);

    const handleSubmit = (status: InvoiceStatus) => {
        if (!projectId || !dateIssued || !dueDate) {
            alert('Please fill out all required fields.');
            return;
        }
        const invoiceData: Omit<Invoice, 'id'> = {
            invoiceNumber: existingInvoice?.invoiceNumber || Date.now().toString().slice(-6),
            projectId: Number(projectId),
            dateIssued: new Date(dateIssued),
            dueDate: new Date(dueDate),
            status,
            lineItems,
            notes,
            subtotal,
            taxRate: parseFloat(taxRate) || 0,
            taxAmount,
            total
        };
        
        const savedInvoice = isEditMode ? updateInvoice(Number(invoiceId), invoiceData) : addInvoice(invoiceData);
        navigate(`/invoices/${savedInvoice.id}`);
    };

    return (
        <div className="space-y-6">
            <Link to={isEditMode ? `/invoices/${invoiceId}` : "/invoicing"} className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900">
                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                Back to {isEditMode ? 'Invoice' : 'Invoices'}
            </Link>
            <h1 className="text-3xl font-bold text-gray-800">{isEditMode ? `Edit Invoice #${existingInvoice?.invoiceNumber}` : 'Create New Invoice'}</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {/* Project & Dates */}
                    <Card>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Project</label>
                                <select value={projectId} onChange={e => setProjectId(Number(e.target.value))} className="mt-1 block w-full rounded-md border-slate-300" required disabled={isEditMode}>
                                    <option value="" disabled>Select a project</option>
                                    {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Date Issued</label>
                                <input type="date" value={dateIssued} onChange={e => setDateIssued(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300" required />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700">Due Date</label>
                                <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300" required />
                            </div>
                        </div>
                    </Card>

                    {/* Unbilled Time */}
                    {unbilledTimeLogs.length > 0 && (
                        <Card>
                            <h2 className="text-xl font-bold mb-4">Unbilled Time Logs</h2>
                            <Button onClick={() => handleAddTimeLogs(unbilledTimeLogs)}>Add All Unbilled Time</Button>
                            {/* Can add a more granular selection here in the future */}
                        </Card>
                    )}

                    {/* Line Items */}
                    <Card>
                        <h2 className="text-xl font-bold mb-4">Line Items</h2>
                        <div className="space-y-3">
                            {lineItems.map((item, index) => (
                                <div key={item.id} className="grid grid-cols-12 gap-2 items-center p-2 bg-gray-50 rounded-md">
                                    <input type="text" placeholder="Description" value={item.description} onChange={e => handleLineItemChange(index, 'description', e.target.value)} className="col-span-12 md:col-span-5 rounded-md border-slate-300" />
                                    <input type="number" placeholder="Qty" value={item.quantity} onChange={e => handleLineItemChange(index, 'quantity', parseFloat(e.target.value))} className="col-span-4 md:col-span-2 rounded-md border-slate-300" />
                                    <input type="number" placeholder="Rate" value={item.rate} onChange={e => handleLineItemChange(index, 'rate', parseFloat(e.target.value))} className="col-span-4 md:col-span-2 rounded-md border-slate-300" />
                                    <span className="col-span-3 md:col-span-2 text-right font-medium">${item.amount.toFixed(2)}</span>
                                    <Button variant="destructive" className="!p-2 col-span-1" onClick={() => handleRemoveLineItem(item.id)}><Trash2Icon className="w-4 h-4" /></Button>
                                </div>
                            ))}
                        </div>
                        <Button onClick={handleAddManualItem} variant="secondary" className="mt-4">Add Manual Item</Button>
                    </Card>
                     <Card>
                        <h2 className="text-xl font-bold mb-2">Notes</h2>
                        <textarea value={notes} onChange={e => setNotes(e.target.value)} rows={3} className="block w-full rounded-md border-slate-300" placeholder="Add any notes for the client..."></textarea>
                    </Card>
                </div>

                {/* Summary & Actions */}
                <div className="lg:col-span-1">
                    <Card className="sticky top-6">
                        <h2 className="text-xl font-bold mb-4">Summary</h2>
                        <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                                <span>Subtotal</span>
                                <span className="font-medium">${subtotal.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span>Tax Rate (%)</span>
                                <input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="w-20 text-right rounded-md border-slate-300" />
                            </div>
                             <div className="flex justify-between">
                                <span>Tax Amount</span>
                                <span className="font-medium">${taxAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-lg font-bold pt-2 border-t">
                                <span>Total</span>
                                <span>${total.toFixed(2)}</span>
                            </div>
                        </div>
                        <div className="mt-6 space-y-2">
                            <Button onClick={() => handleSubmit(InvoiceStatus.Draft)} className="w-full" variant="secondary">Save as Draft</Button>
                            <Button onClick={() => handleSubmit(InvoiceStatus.Sent)} className="w-full">Save and Finalize</Button>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
};

export default InvoiceEditor;
