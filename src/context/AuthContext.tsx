
import React, { createContext, useContext, useState, useEffect } from 'react';
import db from '../data/database';
import { User } from '../data/database';
import { toast } from '../components/ui/use-toast';

interface AuthContextType {
  currentUser: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  register: (user: Omit<User, 'id' | 'createdAt'>) => Promise<boolean>;
  logout: () => void;
  updateUserProfile: (userId: number, updates: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check for stored session on app load
    const checkStoredSession = async () => {
      try {
        const storedUserId = localStorage.getItem('elevate360_user_id');
        if (storedUserId) {
          const userId = parseInt(storedUserId, 10);
          const user = await db.users.get(userId);
          if (user) {
            setCurrentUser(user);
          } else {
            localStorage.removeItem('elevate360_user_id');
          }
        }
      } catch (error) {
        console.error('Error checking stored session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkStoredSession();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      // Find the user by username
      const user = await db.users.where('username').equals(username).first();
      
      if (user && user.password === password) { // In a real app, use proper password hashing
        setCurrentUser(user);
        localStorage.setItem('elevate360_user_id', user.id!.toString());
        toast({
          title: "Login Successful",
          description: `Welcome back, ${user.fullName}!`,
        });
        return true;
      } else {
        toast({
          title: "Login Failed",
          description: "Invalid username or password. Please try again.",
          variant: "destructive"
        });
        return false;
      }
    } catch (error) {
      console.error('Login error:', error);
      toast({
        title: "Login Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: Omit<User, 'id' | 'createdAt'>): Promise<boolean> => {
    try {
      setIsLoading(true);
      
      // Check if username or email already exists
      const existingUser = await db.users
        .where('username').equals(userData.username)
        .or('email').equals(userData.email)
        .first();
      
      if (existingUser) {
        toast({
          title: "Registration Failed",
          description: "Username or email already exists",
          variant: "destructive"
        });
        return false;
      }

      // Create new user
      const newUser: User = {
        ...userData,
        createdAt: new Date()
      };
      
      const userId = await db.users.add(newUser);
      
      // Initialize user streak
      await db.userStreaks.add({
        userId,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: new Date(0) // Set to epoch time as initial value
      });
      
      toast({
        title: "Registration Successful",
        description: "Your account has been created!",
      });
      
      // Auto login after registration
      const user = await db.users.get(userId);
      if (user) {
        setCurrentUser(user);
        localStorage.setItem('elevate360_user_id', userId.toString());
      }
      
      return true;
    } catch (error) {
      console.error('Registration error:', error);
      toast({
        title: "Registration Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('elevate360_user_id');
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out",
    });
  };

  const updateUserProfile = async (userId: number, updates: Partial<User>): Promise<boolean> => {
    try {
      setIsLoading(true);
      await db.users.update(userId, updates);
      
      // Refresh current user data
      const updatedUser = await db.users.get(userId);
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
      
      toast({
        title: "Profile Updated",
        description: "Your profile has been successfully updated",
      });
      return true;
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: "Update Error",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive"
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    currentUser,
    isLoading,
    login,
    register,
    logout,
    updateUserProfile
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
