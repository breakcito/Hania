import React, { createContext, useContext, useState, useEffect } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "./AuthContext";

export interface Company {
  id: number;
  ruc: string;
  business_name: string;
  trademark_name: string | null;
  address: string | null;
  ubigeo: string | null;
  department: string | null;
  province: string | null;
  district: string | null;
  establishment_code: string;
  sol_user: string | null;
  is_matrix: boolean;
  is_active: boolean;
  bn_account?: string | null;
  factos_company_id?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface AppContextType {
  companies: Company[];
  activeCompany: Company | null;
  setActiveCompany: (company: Company) => void;
  isTestMode: boolean;
  setIsTestMode: (val: boolean) => void;
  isLoadingCompanies: boolean;
  refreshCompanies: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState<boolean>(false);
  const [isTestMode, setIsTestMode] = useState<boolean>(() => {
    return localStorage.getItem("hania_test_mode") === "true";
  });

  const handleSetTestMode = (val: boolean) => {
    setIsTestMode(val);
    localStorage.setItem("hania_test_mode", val ? "true" : "false");
  };

  const loadCompanies = async () => {
    if (!isAuthenticated) return;
    setIsLoadingCompanies(true);
    try {
      const data = await apiRequest<Company[]>("/companies");
      setCompanies(data);
      if (data.length > 0) {
        // Seleccionar por defecto la empresa matriz (Cupper) o la primera
        const matrix = data.find((c) => c.is_matrix) || data[0];
        setActiveCompany((prev) => (prev ? data.find((c) => c.id === prev.id) || matrix : matrix));
      }
    } catch (err) {
      console.error("Error loading companies:", err);
    } finally {
      setIsLoadingCompanies(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadCompanies();
    } else {
      setCompanies([]);
      setActiveCompany(null);
    }
  }, [isAuthenticated]);

  return (
    <AppContext.Provider
      value={{
        companies,
        activeCompany,
        setActiveCompany,
        isTestMode,
        setIsTestMode: handleSetTestMode,
        isLoadingCompanies,
        refreshCompanies: loadCompanies,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within an AppProvider");
  }
  return context;
};
