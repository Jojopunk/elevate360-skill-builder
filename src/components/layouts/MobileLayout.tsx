
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, User, BookOpen, Video, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileLayoutProps {
  children: React.ReactNode;
}

const MobileLayout: React.FC<MobileLayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: BookOpen, path: '/learn', label: 'Learn' },
    { icon: BarChart2, path: '/progress', label: 'Progress' },
    { icon: Video, path: '/videos', label: 'Videos' },
    { icon: User, path: '/profile', label: 'Profile' },
  ];

  return (
    <div className="flex flex-col h-screen bg-secondary">
      <main className="flex-1 overflow-y-auto pb-16">
        {children}
      </main>
      
      <nav className="fixed bottom-0 w-full bg-white border-t border-gray-200">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                "nav-item",
                currentPath === item.path && "nav-item-active"
              )}
              aria-label={item.label}
            >
              <item.icon className={cn(
                "h-5 w-5",
                currentPath === item.path ? "text-white" : "text-gray-500"
              )} />
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default MobileLayout;
