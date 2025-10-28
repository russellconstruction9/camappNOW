import React, { Suspense } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import ProfileMenu from './ProfileMenu';
import { Link } from 'react-router-dom';
import { SccLogoIcon } from './icons/Icons';
import PWAFeatures from './PWAFeatures';
import ChatAgent from './ChatAgent';
import DataLoadingFallback from './DataLoadingFallback';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <Suspense fallback={<DataLoadingFallback />}>
      <div className="flex h-screen font-sans text-gray-900 bg-gray-100">
      <div className="hidden md:flex">
        <Sidebar />
      </div>
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex-shrink-0 bg-white border-b-4 border-primary-navy">
            <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
                {/* Mobile Logo - hidden on medium screens and up */}
                <Link to="/" className="flex items-center gap-2 md:hidden">
                    <SccLogoIcon className="w-8 h-8 text-blue-600" />
                    <span className="font-bold text-lg text-primary-navy">SCC</span>
                </Link>

                {/* Spacer for desktop layout to push user switcher right */}
                <div className="hidden md:flex flex-1"></div>
                
                <div className="flex items-center gap-4">
                    <ChatAgent />
                    <ProfileMenu />
                </div>
            </div>
        </header>
        <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            <div className="p-4 sm:p-6 lg:p-8">
            {children}
            </div>
        </main>
      </div>
      <div className="md:hidden">
        <BottomNav />
      </div>
      <PWAFeatures />
    </div>
    </Suspense>
  );
};

export default Layout;