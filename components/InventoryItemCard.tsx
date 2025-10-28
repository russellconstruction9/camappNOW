import React, { memo } from 'react';
import Card from './Card';
import { useData } from '../hooks/useDataContext';
import Button from './Button';
import { InventoryItem } from '../types';
import { PencilIcon, AlertTriangleIcon, CheckIcon } from './icons/Icons';

interface InventoryItemCardProps {
    item: InventoryItem;
    onEdit: (item: InventoryItem) => void;
}

const InventoryItemCard: React.FC<InventoryItemCardProps> = ({ item, onEdit }) => {
    const { updateInventoryItemQuantity, orderList, addToOrderList } = useData();
    
    const handleIncrement = () => updateInventoryItemQuantity(item.id, item.quantity + 1);
    const handleDecrement = () => updateInventoryItemQuantity(item.id, item.quantity - 1);

    const isLowStock = typeof item.lowStockThreshold === 'number' && item.quantity <= item.lowStockThreshold;
    const isInOrderList = orderList.some(o => o.type === 'inventory' && o.itemId === item.id);
    const totalValue = (item.cost || 0) * item.quantity;

    return (
        <Card className="flex flex-col justify-between h-full">
            <div>
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="text-lg font-bold text-gray-800 break-all">{item.name}</h3>
                        <p className="text-sm font-medium text-gray-500">{item.quantity} {item.unit}</p>
                    </div>
                    <Button onClick={() => onEdit(item)} variant="secondary" className="!p-2 !shadow-none bg-transparent hover:bg-slate-200">
                        <PencilIcon className="w-4 h-4" />
                    </Button>
                </div>
                {typeof item.cost === 'number' && (
                    <div className="mt-2 text-xs text-gray-500 border-t pt-2">
                        <div className="flex justify-between">
                            <span>Cost per unit:</span>
                            <span className="font-semibold text-gray-700">${item.cost.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span>Total Value:</span>
                            <span className="font-semibold text-gray-700">${totalValue.toFixed(2)}</span>
                        </div>
                    </div>
                )}
            </div>
            <div className="mt-4 pt-4 border-t border-slate-200 flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Button onClick={handleDecrement} className="px-3 py-1 text-lg font-bold" variant="secondary">-</Button>
                    <Button onClick={handleIncrement} className="px-3 py-1 text-lg font-bold" variant="secondary">+</Button>
                </div>
                {isLowStock && (
                    <div className="flex items-center gap-2" title={`Low stock warning: threshold is ${item.lowStockThreshold}`}>
                        <AlertTriangleIcon className="w-5 h-5 text-amber-500" />
                        {!isInOrderList ? (
                             <Button onClick={() => addToOrderList(item.id)} className="px-3 py-1 text-xs font-semibold bg-amber-500 text-white hover:bg-amber-600 focus:ring-amber-400">
                                Add to Order
                            </Button>
                        ) : (
                            <Button className="px-3 py-1 text-xs font-semibold" disabled>
                                <CheckIcon className="w-4 h-4 mr-1"/>
                                Added
                            </Button>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default memo(InventoryItemCard);