import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types';
import { authAPI } from '../services/api';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    if (token) {
      validateToken();
    } else {
      setIsLoading(false);
    }
  }, []);

  const validateToken = async () => {
    try {
      const response = await authAPI.validateToken();
      setUser(response.data);
    } catch (error) {
      localStorage.removeItem('token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      // Mock authentication - In real app, would call actual API
      if (username === 'admin' && password === 'admin123') {
        const mockUser: User = {
          id: '1',
          name: 'Lucas Silva',
          email: 'lucas@empresa.com',
          role: 'admin'
        };
        const mockToken = 'mock-jwt-token-' + Date.now();
        
        localStorage.setItem('token', mockToken);
        setUser(mockUser);
        return true;
      } else if (username === 'analyst' && password === 'analyst123') {
        const mockUser: User = {
          id: '2',
          name: 'Ana Costa',
          email: 'ana@empresa.com',
          role: 'analyst'
        };
        const mockToken = 'mock-jwt-token-' + Date.now();
        
        localStorage.setItem('token', mockToken);
        setUser(mockUser);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const value = {
    user,
    isLoading,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};