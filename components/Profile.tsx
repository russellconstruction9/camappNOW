import React, { useState, useEffect } from 'react';
import { useData } from '../hooks/useDataContext';
import Card from './Card';
import Button from './Button';
import { Link } from 'react-router-dom';
import { ChevronLeftIcon } from './icons/Icons';

const Profile: React.FC = () => {
    const { currentUser, updateUser } = useData();
    const [name, setName] = useState('');
    const [role, setRole] = useState('');
    const [hourlyRate, setHourlyRate] = useState('');
    const [isSaved, setIsSaved] = useState(false);

    useEffect(() => {
        if (currentUser) {
            setName(currentUser.name);
            setRole(currentUser.role);
            setHourlyRate(currentUser.hourlyRate.toString());
        }
    }, [currentUser]);

    if (!currentUser) {
        return (
            <div className="text-center py-10">
                <h1 className="text-2xl font-bold text-gray-800">No User Selected</h1>
                <p className="mt-2 text-gray-600">Please select a user to view their profile.</p>
            </div>
        );
    }

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!name || !role || !hourlyRate) {
            alert('Please fill in all fields.');
            return;
        }
        updateUser(currentUser.id, {
            name,
            role,
            hourlyRate: Number(hourlyRate),
        });
        setIsSaved(true);
        setTimeout(() => setIsSaved(false), 3000); // Hide message after 3 seconds
    };
    
    const isFormChanged = currentUser.name !== name || currentUser.role !== role || currentUser.hourlyRate !== Number(hourlyRate);

    return (
        <div className="space-y-6 max-w-2xl mx-auto">
            <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-600 hover:text-gray-900 mb-4">
                <ChevronLeftIcon className="w-5 h-5 mr-2" />
                Back to Dashboard
            </Link>
            
            <div className="flex items-center space-x-4">
                 <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-20 h-20 rounded-full" />
                 <div>
                    <h1 className="text-3xl font-bold text-gray-800">My Profile</h1>
                    <p className="text-gray-500">Update your personal details here.</p>
                 </div>
            </div>

            <Card>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700">Full Name</label>
                        <input
                            type="text"
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="role" className="block text-sm font-medium text-gray-700">Role</label>
                        <input
                            type="text"
                            id="role"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            className="mt-1 block w-full rounded-md border-slate-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                            required
                        />
                    </div>
                    <div>
                        <label htmlFor="hourlyRate" className="block text-sm font-medium text-gray-700">Hourly Rate ($)</label>
                        <div className="mt-1 relative rounded-md shadow-sm">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <span className="text-gray-500 sm:text-sm">$</span>
                            </div>
                            <input
                                type="number"
                                id="hourlyRate"
                                value={hourlyRate}
                                onChange={(e) => setHourlyRate(e.target.value)}
                                className="block w-full rounded-md border-slate-300 pl-7 pr-12 focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                required
                            />
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3">
                                <span className="text-gray-500 sm:text-sm">USD</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end items-center space-x-4 pt-4">
                         {isSaved && (
                            <p className="text-sm font-medium text-green-600 transition-opacity duration-300">
                                Profile saved!
                            </p>
                        )}
                        <Button type="submit" disabled={!isFormChanged}>
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Card>
        </div>
    );
};

export default Profile;