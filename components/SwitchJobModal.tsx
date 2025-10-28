import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useData } from '../hooks/useDataContext';
import { SwitchIcon } from './icons/Icons';

interface SwitchJobModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SwitchJobModal: React.FC<SwitchJobModalProps> = ({ isOpen, onClose }) => {
  const { switchJob, projects, currentUser } = useData();
  const [selectedProjectId, setSelectedProjectId] = useState<number | ''>('');

  const availableProjects = projects.filter(p => 
      p.id !== currentUser?.currentProjectId
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProjectId) {
        alert('Please select a project to switch to.');
        return;
    }
    switchJob(Number(selectedProjectId));
    setSelectedProjectId('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Switch Active Job">
      <form onSubmit={handleSubmit} className="space-y-4">
        {availableProjects.length > 0 ? (
            <div>
                <label htmlFor="project" className="block text-sm font-medium text-gray-700">
                    Select a new project to clock into:
                </label>
                <select 
                    id="project" 
                    value={selectedProjectId} 
                    onChange={e => setSelectedProjectId(Number(e.target.value))} 
                    className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                    required
                >
                    <option value="" disabled>Choose a project...</option>
                    {availableProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
            </div>
        ) : (
             <div className="p-4 text-center text-sm text-gray-700 rounded-lg bg-gray-50">
                <p className="font-medium">No other projects available to switch to.</p>
                <p className="mt-1 text-xs text-gray-500">You must have more than one project to use this feature.</p>
            </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!selectedProjectId}>
                <SwitchIcon className="w-4 h-4 mr-2" />
                Confirm Switch
            </Button>
        </div>
      </form>
    </Modal>
  );
};

export default SwitchJobModal;