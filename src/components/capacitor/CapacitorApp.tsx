
import React, { useEffect } from 'react';
import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import { SplashScreen } from '@capacitor/splash-screen';
import { Capacitor } from '@capacitor/core';

const CapacitorApp: React.FC<{children: React.ReactNode}> = ({ children }) => {
  useEffect(() => {
    if (Capacitor.isPluginAvailable('StatusBar')) {
      StatusBar.setStyle({ style: Style.Dark });
      StatusBar.setBackgroundColor({ color: '#1E3A8A' });
    }

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
