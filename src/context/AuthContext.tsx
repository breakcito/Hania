import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "../api/client";

export interface User {
  id: number;
  username: string;
  full_name: string | null;
  role?: string | null;
  permissions?: string | null;
  is_active: boolean;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const saved = localStorage.getItem("hania_user");
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("hania_token"));
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    const savedToken = localStorage.getItem("hania_token");
    const savedUser = localStorage.getItem("hania_user");
    return !!savedToken && !savedUser;
  });

  useEffect(() => {
    async function loadUser() {
      if (!token) {
        setIsLoading(false);
        return;
      }
      try {
        const userData = await apiRequest<User>("/auth/me");
        setUser(userData);
        localStorage.setItem("hania_user", JSON.stringify(userData));
      } catch (err: any) {
        console.warn("Token verification check notice:", err);
        // Only clear credentials if backend explicitly responds with 401 Unauthorized
        // Do NOT log out on connection timeouts, network blips, or server restarts
        if (err?.status === 401) {
          localStorage.removeItem("hania_token");
          localStorage.removeItem("hania_user");
          setToken(null);
          setUser(null);
        }
      } finally {
        setIsLoading(false);
      }
    }
    loadUser();
  }, [token]);

  const login = async (username: string, password: string) => {
    const res = await apiRequest<{ access_token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    });
    localStorage.setItem("hania_token", res.access_token);
    localStorage.setItem("hania_user", JSON.stringify(res.user));
    setToken(res.access_token);
    setUser(res.user);
  };

  const logout = () => {
    localStorage.removeItem("hania_token");
    localStorage.removeItem("hania_user");
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
