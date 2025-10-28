import React, { useState } from 'react';
import { useData } from '../hooks/useDataContext';
import Button from './Button';
import { PlusIcon } from './icons/Icons';
import AddProjectModal from './AddProjectModal';
import EmptyState from './EmptyState';
import ProjectListItem from './ProjectListItem'; // Import the new reusable component

const Projects: React.FC = () => {
    const { projects } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Projects</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                    New Project
                </Button>
            </div>

            {projects.length > 0 ? (
                <div className="space-y-4">
                    {projects.map(project => (
                        <ProjectListItem key={project.id} project={project} />
                    ))}
                </div>
            ) : (
                <EmptyState
                    title="No Projects Yet"
                    message="Get started by creating your first project."
                    buttonText="New Project"
                    onButtonClick={() => setIsModalOpen(true)}
                />
            )}

            <AddProjectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

export default Projects;