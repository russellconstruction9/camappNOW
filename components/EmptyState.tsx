import React from 'react';
import Button from './Button';
import { PlusIcon } from './icons/Icons';

interface EmptyStateProps {
  title: string;
  message: string;
  buttonText: string;
  onButtonClick: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ title, message, buttonText, onButtonClick }) => {
  return (
    <div className="text-center bg-white border border-slate-200 rounded-xl p-8 sm:p-12">
      <h3 className="text-xl font-bold text-gray-900">{title}</h3>
      <p className="mt-2 text-sm text-gray-500">{message}</p>
      <div className="mt-6">
        <Button onClick={onButtonClick}>
          <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

export default EmptyState;
