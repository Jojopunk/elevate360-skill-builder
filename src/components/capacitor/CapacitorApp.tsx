
import React, { useEffect } from 'react';
import { App } from '@capacitor/app';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

const CapacitorApp: React.FC<{children: React.ReactNode}> = ({ children }) => {
  useEffect(() => {
    const handleAppStateChange = () => {
      if (Capacitor.isPluginAvailable('SplashScreen')) {
        SplashScreen.hide();
      }
    };

    // Set up event listener for app ready
    if (Capacitor.isPluginAvailable('App')) {
      App.addListener('appStateChange', handleAppStateChange);
    }

    return () => {
      if (Capacitor.isPluginAvailable('App')) {
        App.removeAllListeners();
      }
    };
  }, []);

  return <>{children}</>;
};

export default CapacitorApp;
