import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';

interface ReceiptConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: { vendor: string, amount: number, description: string }) => void;
  initialData: { vendor: string, total: number, description: string } | null;
  isProcessing: boolean;
}

const ReceiptConfirmationModal: React.FC<ReceiptConfirmationModalProps> = ({ isOpen, onClose, onConfirm, initialData, isProcessing }) => {
  const [vendor, setVendor] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');

  useEffect(() => {
    if (initialData) {
      setVendor(initialData.vendor || '');
      setAmount(initialData.total?.toString() || '');
      setDescription(initialData.description || '');
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) {
        alert("Amount is a required field.");
        return;
    }
    onConfirm({
      vendor,
      amount: parseFloat(amount),
      description,
    });
  };
  
  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Confirm Scanned Receipt">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="vendor" className="block text-sm font-medium text-gray-700">Vendor</label>
          <input
            type="text"
            id="vendor"
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="e.g., Home Depot"
          />
        </div>
        <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Total Amount ($)</label>
            <div className="mt-1 relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <span className="text-gray-500 sm:text-sm">$</span>
                </div>
                <input
                    type="number"
                    id="amount"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="block w-full rounded-md border-slate-300 pl-7 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                />
            </div>
        </div>
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Brief description of items..."
          />
        </div>
        <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isProcessing}>Cancel</Button>
            <Button type="submit" disabled={isProcessing}>
                {isProcessing ? 'Adding...' : 'Add Expense'}
            </Button>
        </div>
      </form>
    </Modal>
  );
};

export default ReceiptConfirmationModal;
