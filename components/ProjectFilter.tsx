import React from 'react';
import { useData } from '../hooks/useDataContext';

interface ProjectFilterProps {
  selectedProjectIds: number[];
  onSelectionChange: (ids: number[]) => void;
}

const ProjectFilter: React.FC<ProjectFilterProps> = ({ selectedProjectIds, onSelectionChange }) => {
  const { projects } = useData();

  const handleCheckboxChange = (projectId: number, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedProjectIds, projectId]);
    } else {
      onSelectionChange(selectedProjectIds.filter(id => id !== projectId));
    }
  };

  const handleSelectAll = () => {
    onSelectionChange(projects.map(p => p.id));
  };

  const handleClearAll = () => {
    onSelectionChange([]);
  };

  if (projects.length === 0) {
    return null;
  }

  return (
    <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm">
      <h3 className="text-lg font-bold text-gray-800 mb-3">Filter Projects</h3>
      <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
        {projects.map(project => (
          <label key={project.id} className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={selectedProjectIds.includes(project.id)}
              onChange={(e) => handleCheckboxChange(project.id, e.target.checked)}
            />
            <span className="text-sm font-medium text-gray-700">{project.name}</span>
          </label>
        ))}
      </div>
      <div className="flex justify-between mt-4 pt-4 border-t border-slate-200">
        <button onClick={handleSelectAll} className="text-sm font-medium text-blue-600 hover:underline">
          Select All
        </button>
        <button onClick={handleClearAll} className="text-sm font-medium text-blue-600 hover:underline">
          Clear All
        </button>
      </div>
    </div>
  );
};

export default ProjectFilter;
