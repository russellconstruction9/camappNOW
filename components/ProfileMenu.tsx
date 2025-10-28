import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useData } from '../hooks/useDataContext';
import { UserCircleIcon, PlusIcon } from './icons/Icons';
import AddTeamMemberModal from './AddTeamMemberModal';

const ProfileMenu: React.FC = () => {
  const { users, currentUser, setCurrentUser, logout } = useData();
  const [isOpen, setIsOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedUserId = parseInt(e.target.value, 10);
    const selectedUser = users.find(u => u.id === selectedUserId) || null;
    setCurrentUser(selectedUser);
    setIsOpen(false);
  };
  
  const handleProfileClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsOpen(false);
    navigate('/profile');
  };

  const handleAddMemberClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
      e.preventDefault();
      setIsOpen(false);
      setIsModalOpen(true);
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        aria-label="Open user menu"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        {currentUser ? (
          <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-10 h-10 rounded-full" />
        ) : (
          <UserCircleIcon className="w-8 h-8 text-gray-600" />
        )}
      </button>

      {isOpen && (
        <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="user-menu-button">
            {currentUser && (
                <div className="px-4 py-2 border-b border-gray-200">
                    <p className="text-sm font-medium text-gray-900 truncate">{currentUser.name}</p>
                    <p className="text-sm text-gray-500 truncate">{currentUser.role}</p>
                </div>
            )}
            
            <a href="#" onClick={handleProfileClick} className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
              My Profile
            </a>

            {users.length > 0 && (
                <div className="px-4 py-2 border-t border-gray-100">
                     <label htmlFor="user-switcher" className="text-xs text-gray-500">Switch User</label>
                     <select
                        id="user-switcher"
                        value={currentUser?.id || ''}
                        onChange={handleUserChange}
                        className="mt-1 block w-full text-sm text-gray-700 bg-gray-50 border border-gray-200 rounded-md focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="" disabled>Select user...</option>
                        {users.map(user => (
                        <option key={user.id} value={user.id}>
                            {user.name}
                        </option>
                        ))}
                    </select>
                </div>
            )}

            <div className="border-t border-gray-100">
                <a href="#" onClick={handleAddMemberClick} className="flex items-center w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100" role="menuitem">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add New Member
                </a>
            </div>

            <div className="border-t border-gray-100">
                <button
                    onClick={() => {
                        logout();
                        setIsOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    role="menuitem"
                >
                    Sign Out
                </button>
            </div>
          </div>
        </div>
      )}
      <AddTeamMemberModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
};

export default ProfileMenu;