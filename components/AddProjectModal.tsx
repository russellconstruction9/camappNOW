import React, { useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useData } from '../hooks/useDataContext';
import { ProjectType } from '../types';

interface AddProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const AddProjectModal: React.FC<AddProjectModalProps> = ({ isOpen, onClose }) => {
  const { addProject } = useData();
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [type, setType] = useState<ProjectType>(ProjectType.NewConstruction);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [status, setStatus] = useState<'In Progress' | 'On Hold'>('In Progress');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !address || !startDate || !endDate || !budget) {
      alert('Please fill in all fields.');
      return;
    }
    addProject({
      name,
      address,
      type,
      status,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      budget: Number(budget),
    });
    // Reset form
    setName('');
    setAddress('');
    setType(ProjectType.NewConstruction);
    setStartDate('');
    setEndDate('');
    setBudget('');
    setStatus('In Progress');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Project">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="projectName" className="block text-sm font-medium text-gray-700">Project Name</label>
          <input type="text" id="projectName" value={name} onChange={e => setName(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required />
        </div>
        <div>
          <label htmlFor="projectAddress" className="block text-sm font-medium text-gray-700">Address</label>
          <input type="text" id="projectAddress" value={address} onChange={e => setAddress(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required />
        </div>
        <div>
            <label htmlFor="projectType" className="block text-sm font-medium text-gray-700">Project Type</label>
            <select id="projectType" value={type} onChange={e => setType(e.target.value as ProjectType)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required>
                {Object.values(ProjectType).map(type => <option key={type} value={type}>{type}</option>)}
            </select>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">Start Date</label>
            <input type="date" id="startDate" value={startDate} onChange={e => setStartDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">End Date</label>
            <input type="date" id="endDate" value={endDate} onChange={e => setEndDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required />
          </div>
        </div>
        <div>
          <label htmlFor="projectBudget" className="block text-sm font-medium text-gray-700">Budget ($)</label>
          <input type="number" id="projectBudget" value={budget} onChange={e => setBudget(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" placeholder="e.g., 500000" required />
        </div>
         <div>
            <label htmlFor="projectStatus" className="block text-sm font-medium text-gray-700">Initial Status</label>
            <select id="projectStatus" value={status} onChange={e => setStatus(e.target.value as 'In Progress' | 'On Hold')} className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm" required>
                <option>In Progress</option>
                <option>On Hold</option>
            </select>
        </div>
        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit">Add Project</Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddProjectModal;