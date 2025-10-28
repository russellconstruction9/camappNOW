import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { DataProvider, useData } from './hooks/useDataContext';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Projects from './components/Projects';
import ProjectDetails from './components/ProjectDetails';
import Tasks from './components/Tasks';
import Team from './components/Team';
import TimeTracking from './components/TimeTracking';
import PunchLists from './components/PunchLists';
import PunchListDetails from './components/PunchListDetails';
import ProjectPhotos from './components/ProjectPhotos';
import Inventory from './components/Inventory';
import Profile from './components/Profile';
import Schedule from './components/Schedule';
import MapView from './components/MapView';
import Invoices from './components/Invoices';
import InvoiceDetails from './components/InvoiceDetails';
import InvoiceEditor from './components/InvoiceEditor';


const App: React.FC = () => {
  // Wrap in error boundary to catch any initialization errors
  try {
    return (
      <DataProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<Projects />} />
          <Route path="/projects/:projectId" element={<ProjectDetails />} />
          <Route path="/projects/:projectId/photos" element={<ProjectPhotos />} />
          <Route path="/projects/:projectId/tasks" element={<Tasks />} />
          <Route path="/tasks" element={<Tasks />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/map" element={<MapView />} />
          <Route path="/team" element={<Team />} />
          <Route path="/time-tracking" element={<TimeTracking />} />
          <Route path="/punch-lists" element={<PunchLists />} />
          <Route path="/punch-lists/:projectId" element={<PunchListDetails />} />
          <Route path="/invoicing" element={<Invoices />} />
          <Route path="/invoices/new" element={<InvoiceEditor />} />
          <Route path="/invoices/:invoiceId" element={<InvoiceDetails />} />
          <Route path="/invoices/:invoiceId/edit" element={<InvoiceEditor />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/profile" element={<Profile />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Layout>
      </DataProvider>
    );
  } catch (error) {
    console.error('App initialization error:', error);
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error Loading App</h1>
          <p className="text-gray-600 mb-4">There was an error initializing ConstructTrack Pro</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Reload Page
          </button>
          <p className="text-sm text-gray-500 mt-4">Error: {error instanceof Error ? error.message : 'Unknown error'}</p>
        </div>
      </div>
    );
  }
};

export default App;