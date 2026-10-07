import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AppShell,
  Group,
  Title,
  Text,
  Badge,
  Switch,
  Select,
  Button,
  UnstyledButton,
  Box,
  Divider,
  Tooltip,
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
  UserPlus,
  LogOut,
  AlertTriangle,
  Flame,
  Landmark,
  Hash,
  BarChart3,
  UserCheck,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useApp } from "../../context/AppContext";

export const AppLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { companies, activeCompany, setActiveCompany, isTestMode, setIsTestMode } = useApp();
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { label: "Dashboard Indicadores", path: "/", icon: LayoutDashboard },
    { label: "Emitir Factura / Boleta", path: "/emitir-comprobante", icon: FilePlus },
    { label: "Guías de Remisión (GRE)", path: "/guias-remision", icon: Truck },
    { label: "Notas de Crédito / Débito", path: "/notas-credito-debito", icon: FileDiff },
    { label: "Historial de Comprobantes", path: "/comprobantes", icon: FileSpreadsheet },
    { label: "Centro de Reportes Excel", path: "/reportes", icon: BarChart3 },
    { label: "Cuentas Bancarias", path: "/cuentas-bancarias", icon: Landmark },
    { label: "Series y Correlativos", path: "/series", icon: Hash },
    { label: "Clientes Frecuentes", path: "/clientes", icon: Users },
    { label: "Catálogo de Productos", path: "/productos", icon: Package },
    { label: "Personal / Vendedores", path: "/trabajadores", icon: UserCheck },
    { label: "Vehículos / Flota GRE", path: "/vehiculos", icon: Truck },
    { label: "Empresas (Multiempresa)", path: "/empresas", icon: Building2 },
    { label: "Usuarios del Sistema", path: "/usuarios", icon: UserPlus },
  ];

  const handleCompanyChange = (val: string | null) => {
    if (!val) return;
    const comp = companies.find((c) => c.id.toString() === val);
    if (comp) setActiveCompany(comp);
  };

  return (
    <AppShell
      header={{ height: 68 }}
      navbar={{ width: 270, breakpoint: "sm" }}
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
        }}
      >
        <Group justify="space-between" h="100%">
          {/* Logo y Nombre de Empresa */}
          <Group gap="xs">
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
              <Flame size={22} />
            </Box>
            <div>
              <Title
                order={4}
                style={{
                  color: "#0F172A",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                }}
              >
                {import.meta.env.VITE_APP_NAME || "Cupper & Hannia"}
              </Title>
              <Text size="xs" c="dimmed">
                Facturación Electrónica
              </Text>
            </div>
          </Group>

          {/* Selectores del Header: Empresa Activa, Switch Modo de Prueba y Usuario */}
          <Group gap="md">
            {/* Selector Multiempresa */}
            {companies.length > 0 && (
              <Box style={{ width: 230 }}>
                <Select
                  size="xs"
                  label="Empresa emisora activa:"
                  value={activeCompany?.id.toString() || ""}
                  onChange={handleCompanyChange}
                  data={companies.map((c) => ({
                    value: c.id.toString(),
                    label: `${c.trademark_name || c.business_name} (${c.ruc})`,
                  }))}
                  allowDeselect={false}
                />
              </Box>
            )}

            <Divider orientation="vertical" />

            {/* Switch de Modo de Prueba Destacado */}
            <Tooltip
              label="Al activar el modo de prueba, puedes simular operaciones sin riesgo fiscal ni envíos reales que comprometan tributariamente a la empresa."
              multiline
              w={260}
              withArrow
            >
              <Box
                p="xs"
                style={{
                  backgroundColor: isTestMode ? "#FEF3C7" : "#F1F5F9",
                  borderRadius: 8,
                  border: isTestMode
                    ? "1px solid #F59E0B"
                    : "1px solid #CBD5E1",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                {isTestMode && <AlertTriangle size={18} color="#D97706" />}
                <div>
                  <Group gap={6}>
                    <Text
                      size="xs"
                      fw={700}
                      c={isTestMode ? "orange.9" : "gray.8"}
                    >
                      {isTestMode ? "MODO DE PRUEBA" : "MODO PRODUCCIÓN"}
                    </Text>
                    <Badge
                      size="xs"
                      color={isTestMode ? "orange" : "green"}
                      variant="filled"
                    >
                      {isTestMode ? "Simulación" : "SUNAT Real"}
                    </Badge>
                  </Group>
                  <Text size="10px" c={isTestMode ? "orange.8" : "dimmed"}>
                    {isTestMode
                      ? "Sin impacto tributario"
                      : "Con validez fiscal"}
                  </Text>
                </div>
                <Switch
                  checked={isTestMode}
                  onChange={(e) => setIsTestMode(e.currentTarget.checked)}
                  color="orange"
                  size="sm"
                />
              </Box>
            </Tooltip>

            <Divider orientation="vertical" />

            {/* Usuario y Cierre de Sesión */}
            <Group gap="xs">
              <Box style={{ textAlign: "right" }}>
                <Text size="xs" fw={600} c="dark.8">
                  {user?.full_name || user?.username}
                </Text>
                <Text size="10px" c="dimmed">
                  Usuario del sistema
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
              backgroundColor: "#F8FAFC",
              borderRadius: 8,
              border: "1px solid #E2E8F0",
            }}
          >
            <Text size="11px" fw={700} c="dimmed" tt="uppercase">
              Emisor en curso
            </Text>
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

        <Box style={{ flex: 1 }}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <UnstyledButton
                key={item.path}
                component={Link}
                to={item.path}
                mb={4}
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
                <Icon size={18} color={isActive ? "#D97706" : "#64748B"} />
                <span>{item.label}</span>
              </UnstyledButton>
            );
          })}
        </Box>

        <Box
          p="xs"
          style={{ borderTop: "1px solid #E2E8F0", textAlign: "center" }}
        >
          <Text size="10px" c="dimmed">
            Factos API Conectado v1.0
          </Text>
          <Text size="10px" fw={600} c="teal.7">
            ● Servicio Activo
          </Text>
        </Box>
      </AppShell.Navbar>

      <AppShell.Main>{children}</AppShell.Main>
    </AppShell>
  );
};
