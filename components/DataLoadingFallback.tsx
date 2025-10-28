import React from 'react';

const DataLoadingFallback: React.FC = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading ConstructTrack Pro...</p>
      </div>
    </div>
  );
};

export default DataLoadingFallback;

