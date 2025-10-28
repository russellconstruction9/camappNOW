import React, { memo } from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-white border border-slate-200 rounded-xl shadow-sm p-4 sm:p-6 ${className}`}>
      {children}
    </div>
  );
};

export default memo(Card);