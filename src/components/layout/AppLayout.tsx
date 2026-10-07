import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AppShell,
  Group,
  Title,
  Text,
  Badge,
  Select,
  Button,
  UnstyledButton,
  Box,
  Divider,
  Tooltip,
  Popover,
  Checkbox,
} from "@mantine/core";
import {
  LayoutDashboard,
  FilePlus,
  Truck,
  FileSpreadsheet,
  FileDiff,
  Users,
  Package,
  Building2,
  LogOut,
  Flame,
  Landmark,
  Hash,
  BarChart3,
  UserCheck,
  Calendar,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";
import { ExchangeRateWidget } from "./ExchangeRateWidget";

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const { user, logout } = useAuth();
  const {
    visibleCompanies,
    activeCompany,
    setActiveCompany,
    isTestMode,
    setIsTestMode,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
  } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const allNavItems = [
    { label: "Dashboard", path: "/", icon: LayoutDashboard, key: "dashboard" },
    {
      label: "Historial de Comprobantes",
      path: "/comprobantes",
      icon: FileSpreadsheet,
      key: "documents",
    },
    {
      label: "Emitir Factura / Boleta",
      path: "/emitir-comprobante",
      icon: FilePlus,
      key: "issue_doc",
    },
    { label: "Guías de Remisión", path: "/guias-remision", icon: Truck, key: "despatches" },
    {
      label: "Notas de Crédito / Débito",
      path: "/notas-credito-debito",
      icon: FileDiff,
      key: "notes",
    },
    { label: "Centro de Reportes Excel", path: "/reportes", icon: BarChart3, key: "reports" },
    { label: "Cuentas Bancarias", path: "/cuentas-bancarias", icon: Landmark, key: "banks" },
    { label: "Series y Correlativos", path: "/series", icon: Hash, key: "series" },
    { label: "Clientes Frecuentes", path: "/clientes", icon: Users, key: "clients" },
    { label: "Catálogo de Productos", path: "/productos", icon: Package, key: "products" },
    { label: "Trabajadores y Accesos", path: "/trabajadores", icon: UserCheck, key: "employees" },
    { label: "Vehículos / Flota", path: "/vehiculos", icon: Truck, key: "vehicles" },
    { label: "Empresas", path: "/empresas", icon: Building2, key: "companies" },
  ];

  const userPerms = user?.permissions
    ? user.permissions.split(",").map((p) => p.trim())
    : null;

  const navItems = allNavItems.filter((item) => {
    if (!user || user.role === "ADMIN" || !userPerms) return true;
    return userPerms.includes(item.key);
  });

  const handleCompanyChange = (val: string | null) => {
    if (!val) return;
    const comp = visibleCompanies.find((c) => c.id.toString() === val);
    if (comp) setActiveCompany(comp);
  };

  return (
    <AppShell
      header={{ height: 64 }}
      navbar={{ width: 260, breakpoint: "sm" }}
      padding="md"
      styles={{
        main: {
          backgroundColor: isTestMode ? "#FFFBEB" : "#F8FAFC",
          minHeight: "100vh",
          transition: "background-color 0.2s ease",
        },
      }}
    >
      <AppShell.Header
        px="md"
        style={{
          borderBottom: isTestMode ? "2px solid #F59E0B" : "1px solid #E2E8F0",
          backgroundColor: "#FFFFFF",
        }}
      >
        <Group justify="space-between" h="100%">
          {/* Lado Izquierdo: Logo + Switch Modo de Prueba Compacto */}
          <Group gap="sm">
            <Box
              p={6}
              style={{
                backgroundColor: isTestMode ? "#D97706" : "#0F172A",
                color: "#FFFFFF",
                borderRadius: 8,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Flame size={20} />
            </Box>
            <div>
              <Title
                order={5}
                style={{
                  color: "#0F172A",
                  fontWeight: 700,
                  lineHeight: 1.1,
                  letterSpacing: "-0.02em",
                }}
              >
                {import.meta.env.VITE_APP_NAME || "Hania System"}
              </Title>
              <Text size="11px" c="dimmed">
                Facturación Electrónica
              </Text>
            </div>

            <Divider orientation="vertical" mx={4} />

            {/* Selector de Empresa Activa */}
            {visibleCompanies.length > 0 && (
              <Box style={{ width: 220 }}>
                <Select
                  size="xs"
                  placeholder="Seleccionar Empresa"
                  value={activeCompany?.id.toString() || ""}
                  onChange={handleCompanyChange}
                  data={visibleCompanies.map((c) => ({
                    value: c.id.toString(),
                    label: `${c.trademark_name || c.business_name} (${c.ruc})`,
                  }))}
                  allowDeselect={false}
                  styles={{
                    input: {
                      fontSize: 11,
                      fontWeight: 600,
                    },
                  }}
                />
              </Box>
            )}

            {/* Switch Modo de Producción / Prueba Compacto en la Izquierda */}
            <Tooltip
              label={
                isTestMode
                  ? "Modo Prueba ACTIVO: Simulación con Empresa de Prueba SUNAT sin impacto tributario."
                  : "Modo Producción ACTIVO: Emisión real con validez fiscal ante SUNAT."
              }
              withArrow
            >
              <Checkbox
                size="xs"
                color="orange"
                checked={isTestMode}
                onChange={(e) => setIsTestMode(e.currentTarget.checked)}
                label="Modo prueba"
              />
            </Tooltip>
          </Group>

          {/* Lado Derecho: Empresa Activa, Tipo de Cambio, Rango de Fecha y Perfil */}
          <Group gap="sm">
            {/* Widget de Tipo de Cambio Interactivo */}
            <ExchangeRateWidget />

            {/* Filtro Global de Fechas Popover */}
            <Popover width={280} position="bottom-end" withArrow shadow="md">
              <Popover.Target>
                <UnstyledButton
                  style={{
                    padding: "4px 11px",
                    backgroundColor: "#F1F5F9",
                    borderRadius: 8,
                    border: "1px solid #CBD5E1",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                  }}
                >
                  <Calendar size={13} color="#475569" />
                  <Box style={{ lineHeight: 1 }}>
                    <Text size="11px" c="dimmed">
                      Periodo Mes
                    </Text>
                    <Text size="11px" fw={600} c="dark.8">
                      {startDate.slice(5)} al {endDate.slice(5)}
                    </Text>
                  </Box>
                </UnstyledButton>
              </Popover.Target>
              <Popover.Dropdown p="sm">
                <Text size="xs" fw={700} mb="xs">
                  Filtro de Fechas Global
                </Text>
                <Group grow mb="xs">
                  <div>
                    <Text size="11px" c="dimmed" mb={2}>
                      Desde
                    </Text>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "4px 8px",
                        fontSize: 12,
                        borderRadius: 6,
                        border: "1px solid #CBD5E1",
                      }}
                    />
                  </div>
                  <div>
                    <Text size="11px" c="dimmed" mb={2}>
                      Hasta
                    </Text>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "4px 8px",
                        fontSize: 12,
                        borderRadius: 6,
                        border: "1px solid #CBD5E1",
                      }}
                    />
                  </div>
                </Group>
                <Button
                  size="compact-xs"
                  variant="subtle"
                  fullWidth
                  onClick={() => {
                    const now = new Date();
                    const y = now.getFullYear();
                    const m = String(now.getMonth() + 1).padStart(2, "0");
                    const lastD = String(
                      new Date(y, now.getMonth() + 1, 0).getDate(),
                    ).padStart(2, "0");
                    setStartDate(`${y}-${m}-01`);
                    setEndDate(`${y}-${m}-${lastD}`);
                  }}
                >
                  Restablecer Mes Actual
                </Button>
              </Popover.Dropdown>
            </Popover>

            <Divider orientation="vertical" mx={2} />

            <Divider orientation="vertical" mx={2} />

            {/* Usuario y Cierre de Sesión */}
            <Group gap="xs">
              <Box style={{ textAlign: "right" }}>
                <Text size="xs" fw={600} c="dark.8">
                  {user?.full_name || user?.username}
                </Text>
                <Text size="11px" c="dimmed">
                  {user?.role || "Operador"}
                </Text>
              </Box>
              <Tooltip label="Cerrar Sesión">
                <Button
                  variant="subtle"
                  color="gray"
                  size="xs"
                  p={6}
                  onClick={() => {
                    logout();
                    navigate("/login");
                  }}
                >
                  <LogOut size={16} />
                </Button>
              </Tooltip>
            </Group>
          </Group>
        </Group>
      </AppShell.Header>

      {/* Barra de Navegación Lateral */}
      <AppShell.Navbar
        p="xs"
        style={{ backgroundColor: "#FFFFFF", borderRight: "1px solid #E2E8F0" }}
      >
        {activeCompany && (
          <Box
            p="xs"
            mb="xs"
            style={{
              backgroundColor: isTestMode ? "#FFFBEB" : "#F8FAFC",
              borderRadius: 8,
              border: isTestMode ? "1px solid #FDE68A" : "1px solid #E2E8F0",
            }}
          >
            <Group justify="space-between" mb={2}>
              <Text size="11px" fw={700} c="dimmed" tt="uppercase">
                Empresa
              </Text>
              {isTestMode && (
                <Badge size="xs" color="orange" variant="light">
                  Prueba
                </Badge>
              )}
            </Group>
            <Text size="xs" fw={700} lineClamp={1} c="dark.9">
              {activeCompany.business_name}
            </Text>
            <Text size="11px" c="dimmed">
              RUC:{" "}
              <span style={{ fontFamily: "monospace", fontWeight: 600 }}>
                {activeCompany.ruc}
              </span>
            </Text>
          </Box>
        )}

        <Box style={{ flex: 1, overflowY: "auto" }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <UnstyledButton
                key={item.path}
                component={Link}
                to={item.path}
                mb={3}
                p="xs"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  width: "100%",
                  borderRadius: 8,
                  backgroundColor: isActive ? "#F1F5F9" : "transparent",
                  color: isActive ? "#0F172A" : "#64748B",
                  fontWeight: isActive ? 600 : 500,
                  fontSize: 13,
                  transition: "background 0.15s ease",
                  borderLeft: isActive
                    ? "3px solid #D97706"
                    : "3px solid transparent",
                }}
              >
                <Icon size={17} color={isActive ? "#D97706" : "#64748B"} />
                <span>{item.label}</span>
              </UnstyledButton>
            );
          })}
        </Box>

        <Box
          p="xs"
          style={{ borderTop: "1px solid #E2E8F0", textAlign: "center" }}
        >
          <Text size="11px" c="dimmed">
            Factos API Conectado v1.0
          </Text>
          <Text size="11px" fw={600} c="teal.7">
            ● Facturación Homologada
          </Text>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
};
