import React, { useState, useEffect } from 'react';
import Modal from './Modal';
import Button from './Button';
import { useData } from '../hooks/useDataContext';

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId?: number;
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ isOpen, onClose, projectId: defaultProjectId }) => {
    const { addTask, users, projects } = useData();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [projectId, setProjectId] = useState<number | ''>('');
    const [assigneeId, setAssigneeId] = useState<number | ''>('');
    const [dueDate, setDueDate] = useState('');

  useEffect(() => {
    if (isOpen) {
      setProjectId(defaultProjectId || '');
    }
  }, [isOpen, defaultProjectId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !projectId || !assigneeId || !dueDate) {
        alert('Please fill in all fields.');
        return;
    }
    addTask({
        title,
        description,
        projectId: Number(projectId),
        assigneeId: Number(assigneeId),
        dueDate: new Date(dueDate),
    });
    setTitle('');
    setDescription('');
    setProjectId(defaultProjectId || '');
    setAssigneeId('');
    setDueDate('');
    onClose();
  };
  
  const canSubmit = users.length > 0 && projects.length > 0;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Task">
      <form onSubmit={handleSubmit} className="space-y-4">
        {!canSubmit && (
            <div className="p-4 mb-4 text-sm text-amber-800 rounded-lg bg-amber-50" role="alert">
                <span className="font-medium">Prerequisite missing!</span> Please add at least one team member and one project before creating a task.
            </div>
        )}
        <div>
          <label htmlFor="taskTitle" className="block text-sm font-medium text-gray-700">Title</label>
          <input type="text" id="taskTitle" value={title} onChange={e => setTitle(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300" required disabled={!canSubmit} />
        </div>
        <div>
          <label htmlFor="taskDescription" className="block text-sm font-medium text-gray-700">Description</label>
          <textarea id="taskDescription" value={description} onChange={e => setDescription(e.target.value)} rows={3} className="mt-1 block w-full rounded-md border-slate-300" disabled={!canSubmit}></textarea>
        </div>
        <div>
            <label htmlFor="project" className="block text-sm font-medium text-gray-700">Project</label>
            <select id="project" value={projectId} onChange={e => setProjectId(Number(e.target.value))} className="mt-1 block w-full rounded-md border-slate-300" required disabled={!canSubmit || !!defaultProjectId}>
                <option value="" disabled>Select a project</option>
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
        </div>
        <div>
            <label htmlFor="assignee" className="block text-sm font-medium text-gray-700">Assignee</label>
            <select id="assignee" value={assigneeId} onChange={e => setAssigneeId(Number(e.target.value))} className="mt-1 block w-full rounded-md border-slate-300" required disabled={!canSubmit}>
                <option value="" disabled>Select an assignee</option>
                {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
        </div>
        <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700">Due Date</label>
            <input type="date" id="dueDate" value={dueDate} onChange={e => setDueDate(e.target.value)} className="mt-1 block w-full rounded-md border-slate-300" required disabled={!canSubmit} />
        </div>

        <div className="flex justify-end space-x-3 pt-4">
            <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={!canSubmit}>Add Task</Button>
        </div>
      </form>
    </Modal>
  );
};

export default AddTaskModal;