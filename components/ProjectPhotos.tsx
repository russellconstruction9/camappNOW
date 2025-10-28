import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useData } from '../hooks/useDataContext';
import Card from './Card';
import Button from './Button';
import { ChevronLeftIcon, PlusIcon, CameraIcon } from './icons/Icons';
import { format } from 'date-fns';
import AddPhotoModal from './AddPhotoModal';
import PhotoItem from './PhotoItem';

const ProjectPhotos: React.FC = () => {
    const { projectId } = useParams<{ projectId: string }>();
    const { projects } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const project = projects.find(p => p.id === Number(projectId));

    if (!project) {
        return (
            <div className="text-center py-10">
                <h1 className="text-2xl font-bold text-gray-800">Project not found</h1>
                <Link to="/projects" className="mt-4 inline-block text-blue-600 hover:underline">
                    &larr; Back to all projects
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                <div>
                    <Link to={`/projects/${project.id}`} className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-2">
                        <ChevronLeftIcon className="w-5 h-5 mr-2" />
                        Back to Project Details
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-800">Project Photos</h1>
                    <p className="text-gray-500 mt-1">For project: {project.name}</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                    Add Photo Log
                </Button>
            </div>
            
            {project.photos.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {project.photos.map(photo => (
                        <Card key={photo.id} className="p-0 overflow-hidden">
                            <PhotoItem projectId={project.id} photo={photo} className="w-full h-56 object-cover" />
                            <div className="p-4">
                                <p className="text-sm text-gray-700">{photo.description}</p>
                                <p className="text-xs text-gray-400 mt-2">{format(photo.dateAdded, "MMM d, yyyy 'at' p")}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <div className="text-center bg-white border-2 border-dashed border-gray-300 rounded-xl p-12">
                     <CameraIcon className="w-16 h-16 mx-auto text-gray-400" />
                    <h3 className="mt-4 text-xl font-bold text-gray-900">No Photos Yet</h3>
                    <p className="mt-2 text-sm text-gray-500">Add your first photo to create a visual log for this project.</p>
                    <div className="mt-6">
                        <Button onClick={() => setIsModalOpen(true)}>
                            <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                            Add Photo Log
                        </Button>
                    </div>
                </div>
            )}

            <AddPhotoModal 
                isOpen={isModalOpen} 
                onClose={() => setIsModalOpen(false)} 
                projectId={project.id}
            />
        </div>
    );
};

export default ProjectPhotos;
