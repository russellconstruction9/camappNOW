import React, { useState } from 'react';
import Card from './Card';
import { useData } from '../hooks/useDataContext';
import { formatDistanceToNowStrict } from 'date-fns';
import Button from './Button';
import { PlusIcon } from './icons/Icons';
import AddTeamMemberModal from './AddTeamMemberModal';
import EmptyState from './EmptyState';

const Team: React.FC = () => {
    const { users } = useData();
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Team Members</h1>
                <Button onClick={() => setIsModalOpen(true)}>
                    <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                    New Member
                </Button>
            </div>

            {users.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    {users.map(user => (
                        <Card key={user.id} className="text-center">
                            <img src={user.avatarUrl} alt={user.name} className="w-24 h-24 rounded-full mx-auto" />
                            <h2 className="mt-4 text-lg font-bold">{user.name}</h2>
                            <p className="text-sm text-gray-500">{user.role}</p>
                            <p className="text-sm font-semibold text-gray-700 mt-1">${user.hourlyRate.toFixed(2)}/hr</p>
                            <div className="mt-4">
                                {user.isClockedIn ? (
                                    <div className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-green-100 text-green-800">
                                        <span className="w-2 h-2 mr-2 bg-green-500 rounded-full"></span>
                                        Clocked In
                                    </div>
                                ) : (
                                    <div className="inline-flex items-center px-3 py-1 text-sm font-medium rounded-full bg-gray-100 text-gray-800">
                                        <span className="w-2 h-2 mr-2 bg-gray-500 rounded-full"></span>
                                        Clocked Out
                                    </div>
                                )}
                            </div>
                            {user.isClockedIn && user.clockInTime && (
                                <p className="text-xs text-gray-500 mt-2">
                                    for {formatDistanceToNowStrict(user.clockInTime)}
                                </p>
                            )}
                        </Card>
                    ))}
                </div>
            ) : (
                <EmptyState 
                    title="No Team Members Yet"
                    message="Get started by adding your first team member."
                    buttonText="New Member"
                    onButtonClick={() => setIsModalOpen(true)}
                />
            )}
            <AddTeamMemberModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
        </div>
    );
};

export default Team;