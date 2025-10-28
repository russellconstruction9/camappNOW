import React from 'react';
import { Link } from 'react-router-dom';
import { useData } from '../hooks/useDataContext';
import Card from './Card';
import Button from './Button';
import { PlusIcon } from './icons/Icons';

const PunchLists: React.FC = () => {
    const { projects } = useData();

    return (
        <div className="space-y-6">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Punch Lists</h1>

            {projects.length === 0 ? (
                <div className="text-center bg-white border border-slate-200 rounded-xl p-8 sm:p-12">
                    <h3 className="text-xl font-bold text-gray-900">No Projects Yet</h3>
                    <p className="mt-2 text-sm text-gray-500">You need to create a project before you can add punch list items.</p>
                    <div className="mt-6">
                        <Link to="/projects">
                            <Button>
                                <PlusIcon className="w-5 h-5 mr-2 -ml-1" />
                                Create a Project
                            </Button>
                        </Link>
                    </div>
                </div>
             ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(project => {
                         const completedItems = project.punchList.filter(item => item.isComplete).length;
                         const totalItems = project.punchList.length;
                         const progress = totalItems > 0 ? Math.round((completedItems / totalItems) * 100) : 0;
                        return (
                            <Link to={`/punch-lists/${project.id}`} key={project.id}>
                                <Card className="hover:shadow-lg transition-shadow duration-200 h-full flex flex-col">
                                    <h3 className="text-lg font-bold text-gray-800">{project.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1">{completedItems} / {totalItems} items completed</p>
                                    <div className="flex-grow"></div>
                                    <div className="mt-4 pt-4 border-t border-slate-200">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm font-medium text-gray-700">Completion</span>
                                            <span className="text-sm font-medium text-gray-700">{progress}%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-green-600 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

export default PunchLists;