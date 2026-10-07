import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Center, Loader } from "@mantine/core";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { AppProvider } from "./context/AppContext";
import { AppLayout } from "./components/layout/AppLayout";
import { LoginPage } from "./pages/LoginPage";
import { DashboardPage } from "./pages/DashboardPage";
import { InvoiceCreatePage } from "./pages/InvoiceCreatePage";
import { DespatchCreatePage } from "./pages/DespatchCreatePage";
import { DespatchesListPage } from "./pages/DespatchesListPage";
import { DocumentsListPage } from "./pages/DocumentsListPage";
import { CreditDebitNotePage } from "./pages/CreditDebitNotePage";
import { ClientsPage } from "./pages/ClientsPage";
import { ProductsPage } from "./pages/ProductsPage";
import { CompaniesPage } from "./pages/CompaniesPage";
import { UsersPage } from "./pages/UsersPage";
import { BankAccountsPage } from "./pages/BankAccountsPage";
import { SeriesPage } from "./pages/SeriesPage";
import { ReportsPage } from "./pages/ReportsPage";
import { EmployeesPage } from "./pages/EmployeesPage";
import { VehiclesPage } from "./pages/VehiclesPage";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Center style={{ minHeight: "100vh" }}>
        <Loader size="lg" color="amber" />
      </Center>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

export function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/emitir-comprobante"
            element={
              <ProtectedRoute>
                <InvoiceCreatePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/guias-remision"
            element={
              <ProtectedRoute>
                <DespatchesListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/guias-remision/nueva"
            element={
              <ProtectedRoute>
                <DespatchCreatePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/notas-credito-debito"
            element={
              <ProtectedRoute>
                <CreditDebitNotePage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/comprobantes"
            element={
              <ProtectedRoute>
                <DocumentsListPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/clientes"
            element={
              <ProtectedRoute>
                <ClientsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/productos"
            element={
              <ProtectedRoute>
                <ProductsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/empresas"
            element={
              <ProtectedRoute>
                <CompaniesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/usuarios"
            element={
              <ProtectedRoute>
                <UsersPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/cuentas-bancarias"
            element={
              <ProtectedRoute>
                <BankAccountsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/series"
            element={
              <ProtectedRoute>
                <SeriesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/reportes"
            element={
              <ProtectedRoute>
                <ReportsPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/trabajadores"
            element={
              <ProtectedRoute>
                <EmployeesPage />
              </ProtectedRoute>
            }
          />

          <Route
            path="/vehiculos"
            element={
              <ProtectedRoute>
                <VehiclesPage />
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppProvider>
    </AuthProvider>
  );
}
