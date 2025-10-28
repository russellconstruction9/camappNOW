import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, formatDistanceToNow } from 'date-fns';
import { useData } from '../hooks/useDataContext';
import { Project, User } from '../types';
import Card from './Card';
import PhotoItem from './PhotoItem';
import { Building2Icon } from './icons/Icons';

interface ProjectListItemProps {
    project: Project;
}

const ProjectListItem: React.FC<ProjectListItemProps> = ({ project }) => {
    const { users, timeLogs } = useData();
    const latestPhoto = project.photos.length > 0 ? project.photos[0] : null;
    const lastUpdated = latestPhoto ? formatDistanceToNow(latestPhoto.dateAdded, { addSuffix: true }) : `Created ${format(project.startDate, 'MMM d, yyyy')}`;

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'In Progress': return 'bg-blue-100 text-blue-800';
            case 'Completed': return 'bg-green-100 text-green-800';
            case 'On Hold': return 'bg-amber-100 text-amber-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const recentUsers = useMemo(() => {
        const projectTimeLogs = timeLogs
            .filter(log => log.projectId === project.id)
            .sort((a, b) => b.clockIn.getTime() - a.clockIn.getTime());
        
        const uniqueUserIds = [...new Set(projectTimeLogs.map(log => log.userId))];
        
        return uniqueUserIds
            .slice(0, 4)
            .map(id => users.find(u => u.id === id))
            .filter((u): u is User => !!u);
    }, [timeLogs, users, project.id]);

    const getUserInitials = (name: string) => {
        const parts = name.split(' ');
        if (parts.length > 1) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <Card className="p-0 overflow-hidden">
            <Link to={`/projects/${project.id}`} className="block hover:bg-gray-50/50 transition-colors duration-200">
                <div className="flex flex-col md:flex-row items-start p-4">
                    {/* Thumbnail */}
                    <div className="flex-shrink-0 w-full md:w-28 h-28 mb-4 md:mb-0 md:mr-4">
                        {latestPhoto ? (
                            <PhotoItem projectId={project.id} photo={latestPhoto} className="w-full h-full object-cover rounded-md" />
                        ) : (
                            <div className="w-full h-full bg-gray-200 rounded-md flex items-center justify-center">
                                <Building2Icon className="w-10 h-10 text-gray-400" />
                            </div>
                        )}
                    </div>

                    {/* Project Info */}
                    <div className="flex-grow">
                        <h3 className="text-xl font-bold text-gray-800">{project.name}</h3>
                        <p className="text-sm text-gray-500 mt-1">{project.address}</p>
                        <p className="text-xs text-gray-400 mt-2">Last updated {lastUpdated}</p>
                        <div className="mt-2 flex items-center gap-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(project.status)}`}>
                                {project.status}
                            </span>
                        </div>
                    </div>

                    {/* Stats & Photos */}
                    <div className="w-full md:w-auto flex flex-col md:flex-row items-start md:items-center gap-4 mt-4 md:mt-0 md:pl-4">
                        {/* Stats */}
                        <div className="flex items-center md:items-start gap-4 md:gap-2 text-sm text-center md:text-left md:flex-col">
                            <div>
                                <div className="font-bold text-lg">{project.photos.length}</div>
                                <div className="text-xs text-gray-500">Photos</div>
                            </div>
                            {recentUsers.length > 0 && (
                                <div>
                                    <div className="text-xs text-gray-500 mb-1">Recent Users</div>
                                    <div className="flex -space-x-2">
                                        {recentUsers.map(user => (
                                            <div key={user.id} title={user.name} className="w-7 h-7 bg-gray-400 ring-2 ring-white rounded-full flex items-center justify-center text-xs font-bold text-white">
                                                {getUserInitials(user.name)}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Photo Gallery */}
                        <div className="flex-grow flex items-center justify-end ml-4">
                            {project.photos.length > 0 ? (
                                <div className="flex items-center gap-2">
                                    {project.photos.slice(0, 4).map(photo => (
                                        <div key={photo.id} className="w-20 h-20 flex-shrink-0">
                                            <PhotoItem projectId={project.id} photo={photo} className="w-full h-full object-cover rounded-md" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="w-full md:w-80 h-20 flex items-center justify-center bg-gray-50 rounded-md border text-xs text-gray-400 p-2 text-center">
                                    No photos have been added to this project yet.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </Link>
        </Card>
    );
};

export default ProjectListItem;