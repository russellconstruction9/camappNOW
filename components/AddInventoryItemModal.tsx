import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useData } from '../hooks/useDataContext';

interface AddInventoryItemModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddInventoryItemModal: React.FC<AddInventoryItemModalProps> = ({ isOpen, onClose }) => {
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('');
  const [cost, setCost] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState('');
  const { addInventoryItem } = useData();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !quantity || !unit) {
      alert('Please fill in name, quantity, and unit.');
      return;
    }
    addInventoryItem({ 
      name, 
      quantity: Number(quantity), 
      unit,
      cost: cost ? Number(cost) : undefined,
      lowStockThreshold: lowStockThreshold ? Number(lowStockThreshold) : undefined
    });
    setName('');
    setQuantity('');
    setUnit('');
    setCost('');
    setLowStockThreshold('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Inventory Item">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="itemName" className="block text-sm font-medium text-gray-700">Item Name</label>
          <input
            type="text"
            id="itemName"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="e.g., 2x4 Lumber"
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">Initial Quantity</label>
              <input
                type="number"
                id="quantity"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                placeholder="e.g., 100"
                min="0"
                required
              />
            </div>
             <div>
                <label htmlFor="unit" className="block text-sm font-medium text-gray-700">Unit</label>
                 <input
                    type="text"
                    id="unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    placeholder="e.g., pieces, bags, ft"
                    required
                />
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
                <label htmlFor="cost" className="block text-sm font-medium text-gray-700">Cost per Unit (Optional)</label>
                <div className="mt-1 relative rounded-md shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 sm:text-sm">$</span>
                    </div>
                    <input
                        type="number"
                        id="cost"
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
                <label htmlFor="lowStockThreshold" className="block text-sm font-medium text-gray-700">Low Stock Threshold (Optional)</label>
                <input
                    type="number"
                    id="lowStockThreshold"
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
            <Button type="submit">Add Item</Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddInventoryItemModal;