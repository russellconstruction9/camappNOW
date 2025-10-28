import React, { useState, useEffect } from 'react';
import Button from './Button';
import { DownloadIcon } from './icons/Icons';

// This interface is needed because the default Event type doesn't include
// properties specific to the BeforeInstallPromptEvent.
interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const PWAFeatures: React.FC = () => {
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault();
      // Stash the event so it can be triggered later.
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Detect if the app is already installed
    window.addEventListener('appinstalled', () => {
      // Hide the install button if the app is installed
      setInstallPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!installPrompt) {
      return;
    }
    // Show the install prompt
    await installPrompt.prompt();
    // Wait for the user to respond to the prompt
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the A2HS prompt');
    } else {
      console.log('User dismissed the A2HS prompt');
    }
    // We can only use the prompt once, so clear it.
    setInstallPrompt(null);
  };

  if (!installPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-4 z-50 md:bottom-6 md:right-6" role="alert" aria-live="polite">
      <Button 
        onClick={handleInstallClick} 
        className="bg-green-600 hover:bg-green-700 focus:ring-green-500 shadow-lg animate-bounce"
        aria-label="Install the application to your device"
      >
        <DownloadIcon className="w-5 h-5 mr-2 -ml-1" />
        Install App
      </Button>
    </div>
  );
};

export default PWAFeatures;
