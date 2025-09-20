import { useState, createContext, useContext } from 'react';

// Tipo para el usuario autenticado
export interface User {
  id?: string;
  email: string;
  name?: string;
  role?: string;
}

// Tipos de retorno del hook useAuth
export interface UseAuthReturn {
  user: User | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Tipos para credenciales de login
interface LoginCredentials {
  email: string;
  password: string;
}

// Context para autenticación
const AuthContext = createContext<UseAuthReturn | undefined>(undefined);

// Hook useAuth
export const useAuth = (): UseAuthReturn => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Provider de autenticación (temporal)
export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const login = async (credentials: LoginCredentials) => {
    setIsLoading(true);
    try {
      // Aquí iría la lógica de login
      console.log('Login attempt with:', credentials);
      // Simular login exitoso
      setUser({ email: credentials.email });
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
  };

  const isAuthenticated = !!user;

  const value: UseAuthReturn = {
    user,
    login,
    logout,
    isAuthenticated,
    isLoading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};