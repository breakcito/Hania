import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { apiRequest } from "../api/client";
import { useAuth } from "./AuthContext";

export interface Company {
  id: number;
  ruc: string;
  business_name: string;
  address: string | null;
  ubigeo: string | null;
  department: string | null;
  province: string | null;
  district: string | null;
  establishment_code: string;
  sol_user: string | null;
  is_matrix: boolean;
  is_production: boolean;
  is_active: boolean;
  detraction_percent_default?: number | null;
  facturador_company_id?: string | null;
  factos_company_id?: string | null;
  email?: string | null;
  phone?: string | null;
}

interface AppContextType {
  companies: Company[];
  visibleCompanies: Company[];
  activeCompany: Company | null;
  setActiveCompany: (company: Company) => void;
  isTestMode: boolean;
  setIsTestMode: (val: boolean) => void;
  startDate: string;
  setStartDate: (val: string) => void;
  endDate: string;
  setEndDate: (val: string) => void;
  isLoadingCompanies: boolean;
  refreshCompanies: () => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// Calcula primer y último día del mes corriente
const getDefaultDateRange = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const format = (d: Date) => {
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  return {
    start: format(firstDay),
    end: format(lastDay),
  };
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAuth();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [activeCompany, setActiveCompany] = useState<Company | null>(null);
  const [isLoadingCompanies, setIsLoadingCompanies] = useState<boolean>(false);
  const [isTestMode, setIsTestModeState] = useState<boolean>(() => {
    return localStorage.getItem("hania_test_mode") === "true";
  });

  const defaultRange = useMemo(() => getDefaultDateRange(), []);
  const [startDate, setStartDate] = useState<string>(defaultRange.start);
  const [endDate, setEndDate] = useState<string>(defaultRange.end);

  const loadCompanies = async () => {
    if (!isAuthenticated) return;
    setIsLoadingCompanies(true);
    try {
      const data = await apiRequest<Company[]>("/companies");
      setCompanies(data);
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

  // Filtro de empresas visibles según Modo de Prueba o Producción
  const visibleCompanies = useMemo(() => {
    if (isTestMode) {
      // Solo empresas de prueba (is_production === false o ruc 20000000001)
      const testList = companies.filter((c) => c.is_production === false || c.ruc === "20000000001" || c.business_name.toUpperCase().includes("PRUEBA"));
      return testList.length > 0 ? testList : companies;
    } else {
      // Modo producción: excluir empresa de prueba
      return companies.filter((c) => c.is_production !== false && c.ruc !== "20000000001" && !c.business_name.toUpperCase().includes("PRUEBA"));
    }
  }, [companies, isTestMode]);

  // Selección automática de empresa al cambiar de modo o al cargar
  useEffect(() => {
    if (visibleCompanies.length === 0) return;

    if (isTestMode) {
      // Autoseleccionar la empresa de prueba
      const testCompany = visibleCompanies.find((c) => c.is_production === false || c.ruc === "20000000001") || visibleCompanies[0];
      setActiveCompany(testCompany);
    } else {
      // Autoseleccionar empresa matriz o primera real
      const currentStillValid = activeCompany && visibleCompanies.some((c) => c.id === activeCompany.id);
      if (!currentStillValid) {
        const matrix = visibleCompanies.find((c) => c.is_matrix) || visibleCompanies[0];
        setActiveCompany(matrix);
      }
    }
  }, [isTestMode, visibleCompanies]);

  const handleSetTestMode = (val: boolean) => {
    setIsTestModeState(val);
    localStorage.setItem("hania_test_mode", val ? "true" : "false");
  };

  return (
    <AppContext.Provider
      value={{
        companies,
        visibleCompanies,
        activeCompany,
        setActiveCompany,
        isTestMode,
        setIsTestMode: handleSetTestMode,
        startDate,
        setStartDate,
        endDate,
        setEndDate,
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
