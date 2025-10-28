import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useData } from '../hooks/useDataContext';
import { InventoryItem } from '../types';

interface EditInventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: InventoryItem | null;
}

const EditInventoryItemModal: React.FC<EditInventoryItemModalProps> = ({ isOpen, onClose, item }) => {
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [cost, setCost] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const { updateInventoryItem } = useData();

  useEffect(() => {
    if (item) {
        setName(item.name);
        setUnit(item.unit);
        setCost(item.cost?.toString() || '');
        setLowStockThreshold(item.lowStockThreshold?.toString() || '');
    }
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!item || !name || !unit) {
      alert('Please fill in all required fields.');
      return;
    }
    updateInventoryItem(item.id, { 
        name, 
        unit,
        cost: cost ? Number(cost) : undefined,
        lowStockThreshold: lowStockThreshold ? Number(lowStockThreshold) : undefined 
    });
    onClose();
  };
  
  if (!item) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Inventory Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="editItemName" className="block text-sm font-medium text-gray-700">Item Name</label>
          <input
            type="text"
            id="editItemName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            required
          />
        </div>
        <div>
          <label htmlFor="editItemQuantity" className="block text-sm font-medium text-gray-700">Current Quantity</label>
          <input
            type="number"
            id="editItemQuantity"
            value={item.quantity}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm bg-slate-50 text-gray-500 sm:text-sm"
            disabled
          />
        </div>
        <div>
            <label htmlFor="editUnit" className="block text-sm font-medium text-gray-700">Unit</label>
             <input
                type="text"
                id="editUnit"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                required
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="editCost" className="block text-sm font-medium text-gray-700">Cost per Unit (Optional)</label>
                 <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                        type="number"
                        id="editCost"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        className="block w-full rounded-md border-slate-300 pl-7 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                    />
                </div>
            </div>
            <div>
                <label htmlFor="editLowStockThreshold" className="block text-sm font-medium text-gray-700">Low Stock Threshold (Optional)</label>
                <input
                    type="number"
                    id="editLowStockThreshold"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="e.g., 10"
                    min="0"
                />
            </div>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit">Save Changes</Button>
        </div>
      </form>
    </Modal>
  );
};

export default EditInventoryItemModal;