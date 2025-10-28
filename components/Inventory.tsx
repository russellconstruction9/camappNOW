import React, { useState, useMemo } from 'react';
import Card from './Card';
import { useData } from '../hooks/useDataContext';
import Button from './Button';
import { PlusIcon, Trash2Icon, CopyIcon } from './icons/Icons';
import AddInventoryItemModal from './AddInventoryItemModal';
import EmptyState from './EmptyState';
import { InventoryItem } from '../types';
import InventoryItemCard from './InventoryItemCard';
import EditInventoryItemModal from './EditInventoryItemModal';

const Inventory: React.FC = () => {
    const { inventory, orderList, removeFromOrderList, clearOrderList, addManualItemToOrderList } = useData();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [copied, setCopied] = useState(false);
    const [manualItemName, setManualItemName] = useState('');
    const [manualItemCost, setManualItemCost] = useState('');

    const handleManualAdd = (e: React.FormEvent) => {
        e.preventDefault();
        if (manualItemName.trim()) {
            addManualItemToOrderList(manualItemName.trim(), manualItemCost ? parseFloat(manualItemCost) : undefined);
            setManualItemName('');
            setManualItemCost('');
        }
    };
    
    const totalInventoryValue = useMemo(() => {
        return inventory.reduce((total, item) => total + (item.cost || 0) * item.quantity, 0);
    }, [inventory]);

    const totalOrderCost = useMemo(() => {
        return orderList.reduce((total, orderItem) => {
            if (orderItem.type === 'inventory') {
                const item = inventory.find(i => i.id === orderItem.itemId);
                return total + (item?.cost || 0);
            }
            return total + (orderItem.cost || 0);
        }, 0);
    }, [orderList, inventory]);


    const handleCopy = () => {
        const text = orderList.map(orderItem => {
            if (orderItem.type === 'inventory') {
                const item = inventory.find(i => i.id === orderItem.itemId);
                return item ? `- ${item.name} (Cost: $${item.cost?.toFixed(2) || '0.00'})` : '';
            }
            return `- ${orderItem.name} (Cost: $${orderItem.cost?.toFixed(2) || '0.00'})`;
        }).filter(Boolean).join('\n');
        
        const totalText = `\n\nTotal Estimated Cost: $${totalOrderCost.toFixed(2)}`;
        navigator.clipboard.writeText(`Inventory Order List:\n${text}${totalText}`);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };


    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Inventory</h1>
                <Button onClick={() => setIsAddModalOpen(true)}>
                    <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                    New Item
                </Button>
            </div>

            <Card>
                <h2 className="text-lg font-bold text-gray-800">Inventory Overview</h2>
                <p className="mt-2 text-4xl font-semibold text-blue-600">${totalInventoryValue.toFixed(2)}</p>
                <p className="text-sm font-medium text-gray-500">Total value of all items in stock</p>
            </Card>

            {orderList.length > 0 && (
                <Card>
                    <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-3">
                        <h2 className="text-xl font-bold">Order List ({orderList.length})</h2>
                        <div className="flex gap-2">
                            <Button onClick={handleCopy} variant="secondary" className="text-sm">
                                <CopyIcon className="w-4 h-4 mr-2"/> {copied ? 'Copied!' : 'Copy List'}
                            </Button>
                            <Button onClick={clearOrderList} variant="destructive" className="text-sm">Clear List</Button>
                        </div>
                    </div>
                    <ul className="space-y-2 mb-4">
                        {orderList.map(orderItem => {
                            if (orderItem.type === 'inventory') {
                                const item = inventory.find(i => i.id === orderItem.itemId);
                                if (!item) return null;
                                return (
                                     <li key={`inv-${item.id}`} className="flex justify-between items-center p-2 bg-gray-50 rounded-md">
                                        <div>
                                            <p className="font-medium">{item.name}</p>
                                            <p className="text-sm text-gray-500">Cost: ${item.cost?.toFixed(2) || 'N/A'}</p>
                                        </div>
                                        <Button onClick={() => removeFromOrderList(orderItem)} variant="secondary" className="!p-2 !shadow-none bg-transparent hover:bg-red-50">
                                            <Trash2Icon className="w-4 h-4 text-red-600"/>
                                        </Button>
                                    </li>
                                );
                            } else {
                                return (
                                    <li key={`man-${orderItem.id}`} className="flex justify-between items-center p-2 bg-blue-50 rounded-md">
                                        <div>
                                            <p className="font-medium">{orderItem.name}</p>
                                            <p className="text-sm text-blue-700">Manual Add - Cost: ${orderItem.cost?.toFixed(2) || 'N/A'}</p>
                                        </div>
                                        <Button onClick={() => removeFromOrderList(orderItem)} variant="secondary" className="!p-2 !shadow-none bg-transparent hover:bg-red-50">
                                            <Trash2Icon className="w-4 h-4 text-red-600"/>
                                        </Button>
                                    </li>
                                )
                            }
                        })}
                    </ul>
                     <form onSubmit={handleManualAdd} className="flex flex-col sm:flex-row gap-2 pt-4 border-t border-slate-200">
                        <input
                            type="text"
                            value={manualItemName}
                            onChange={(e) => setManualItemName(e.target.value)}
                            placeholder="Add a one-off item name..."
                            className="flex-grow block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        />
                         <input
                            type="number"
                            value={manualItemCost}
                            onChange={(e) => setManualItemCost(e.target.value)}
                            placeholder="Cost ($)"
                            className="block w-full sm:w-28 rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            step="0.01"
                        />
                        <Button type="submit">
                            <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                            Add
                        </Button>
                    </form>
                    <div className="mt-4 pt-4 border-t border-slate-200 text-right">
                        <span className="text-lg font-bold">Total Order Cost: ${totalOrderCost.toFixed(2)}</span>
                    </div>
                </Card>
            )}

            {inventory.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inventory.map(item => (
                        <InventoryItemCard key={item.id} item={item} onEdit={setEditingItem} />
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="No Inventory Items"
                    message="Get started by adding your first inventory item."
                    buttonText="New Item"
                    onButtonClick={() => setIsAddModalOpen(true)}
                />
            )}

            <AddInventoryItemModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} />
            <EditInventoryItemModal isOpen={!!editingItem} onClose={() => setEditingItem(null)} item={editingItem} />
        </div>
    );
};

export default Inventory;