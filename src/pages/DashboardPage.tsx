import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Grid,
  Paper,
  Text,
  Title,
  Group,
  Badge,
  Table,
  Button,
  Loader,
  Center,
  Box,
} from "@mantine/core";
import {
  TrendingUp,
  Receipt,
  Truck,
  Landmark,
  FilePlus,
  ArrowRight,
  CheckCircle,
  Clock,
  XCircle,
  Ban,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { apiRequest } from "../api/client";
import { useApp } from "../context/AppContext";

export const DashboardPage: React.FC = () => {
  const { activeCompany, isTestMode, startDate, endDate } = useApp();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadStats() {
      setLoading(true);
      try {
        const queryParams = new URLSearchParams();
        if (activeCompany) queryParams.set("company_id", activeCompany.id.toString());
        if (isTestMode) queryParams.set("is_test_mode", "true");
        if (startDate) queryParams.set("start_date", startDate);
        if (endDate) queryParams.set("end_date", endDate);
        const res = await apiRequest(`/dashboard/stats?${queryParams.toString()}`);
        setStats(res);
      } catch (err) {
        console.error("Error loading dashboard stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, [activeCompany, isTestMode, startDate, endDate]);

  if (loading || !stats) {
    return (
      <Center style={{ minHeight: "60vh" }}>
        <Loader size="lg" color="amber" />
      </Center>
    );
  }

  const kpis = [
    {
      title: "Ventas del Mes (Soles)",
      value: `S/ ${Number(stats.month_sales_pen || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`,
      subtitle: stats.current_month_name,
      icon: TrendingUp,
      color: "teal",
    },
    {
      title: "Ventas en Dólares (USD)",
      value: `$ ${Number(stats.month_sales_usd || 0).toLocaleString("en-US", { minimumFractionDigits: 2 })}`,
      subtitle: "Divisa Extranjera",
      icon: Landmark,
      color: "blue",
    },
    {
      title: "Operaciones Emitidas",
      value: stats.month_operations_count,
      subtitle: "Facturas, Boletas y Notas",
      icon: Receipt,
      color: "orange",
    },
    {
      title: "Guías de Remisión (GRE)",
      value: stats.month_despatches_count,
      subtitle: "Traslados",
      icon: Truck,
      color: "indigo",
    },
    {
      title: "Detracciones Retenidas",
      value: `S/ ${Number(stats.month_detraction_pen || 0).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`,
      subtitle: "Banco de la Nación",
      icon: Landmark,
      color: "grape",
    },
  ];

  return (
    <Box>
      {/* Encabezado del Dashboard */}
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2} style={{ color: "#0F172A", fontWeight: 700 }}>
            Panel de Operaciones & Indicadores
          </Title>
          <Text c="dimmed" size="sm">
            Empresa: <b>{activeCompany?.business_name}</b> • Período actual:{" "}
            <b>{stats.current_month_name}</b>
          </Text>
        </div>

        <Group>
          <Button
            component={Link}
            to="/emitir-comprobante"
            leftSection={<FilePlus size={16} />}
            color="amber"
            style={{ backgroundColor: "#D97706" }}
          >
            Emitir Nueva Factura / Boleta
          </Button>
          <Button
            component={Link}
            to="/guias-remision"
            leftSection={<Truck size={16} />}
            variant="default"
          >
            Emitir Guía de Remisión (GRE)
          </Button>
        </Group>
      </Group>

      {/* Tarjetas KPI */}
      <Grid mb="lg">
        {kpis.map((kpi, idx) => {
          const Icon = kpi.icon;
          return (
            <Grid.Col key={idx} span={{ base: 12, sm: 6, md: 2.4 }}>
              <Paper withBorder p="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
                <Group justify="space-between" mb="xs">
                  <Text size="xs" fw={700} c="dimmed" tt="uppercase">
                    {kpi.title}
                  </Text>
                  <Icon size={18} color="#D97706" />
                </Group>
                <Title order={3} style={{ color: "#0F172A" }}>
                  {kpi.value}
                </Title>
                <Text size="xs" c="dimmed" mt={4}>
                  {kpi.subtitle}
                </Text>
              </Paper>
            </Grid.Col>
          );
        })}
      </Grid>

      {/* Gráficos Mensuales Recharts */}
      <Grid mb="lg">
        {/* Gráfico 1: Evolución Mensual de Ventas en Soles */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper withBorder p="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
            <Group justify="space-between" mb="md">
              <div>
                <Title order={4} style={{ color: "#0F172A" }}>
                  Evolución Mensual de Facturación (Soles)
                </Title>
                <Text size="xs" c="dimmed">
                  Tendencia de ingresos de los últimos 6 meses en operaciones comerciales
                </Text>
              </div>
              <Badge color="orange" variant="light">
                Últimos 6 meses
              </Badge>
            </Group>

            <Box style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={stats.monthly_trend} margin={{ top: 10, right: 30, left: 10, bottom: 0 }}>
                  <defs>
                    <linearGradient id="salesPenGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#D97706" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#D97706" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month_name" stroke="#64748B" fontSize={12} tickLine={false} />
                  <YAxis
                    stroke="#64748B"
                    fontSize={12}
                    tickLine={false}
                    tickFormatter={(val) => `S/ ${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <RechartsTooltip
                    formatter={(value: any) => [
                      `S/ ${Number(value).toLocaleString("es-PE", { minimumFractionDigits: 2 })}`,
                      "Facturación",
                    ]}
                  />
                  <Area
                    type="monotone"
                    dataKey="total_sales_pen"
                    stroke="#D97706"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#salesPenGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid.Col>

        {/* Gráfico 2: Composición de Operaciones y Traslados */}
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
            <Title order={4} mb="xs" style={{ color: "#0F172A" }}>
              Actividad Operativa Mensual
            </Title>
            <Text size="xs" c="dimmed" mb="md">
              Comprobantes y Guías de Remisión por mes
            </Text>

            <Box style={{ width: "100%", height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthly_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="month" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748B" fontSize={11} tickLine={false} />
                  <RechartsTooltip />
                  <Legend />
                  <Bar dataKey="total_operations" name="Comprobantes" fill="#0F172A" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="total_despatches" name="Guías (GRE)" fill="#D97706" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Distribución por Estado y Tipo + Últimas Operaciones */}
      <Grid>
        <Grid.Col span={{ base: 12, md: 4 }}>
          <Paper withBorder p="md" radius="md" mb="md" style={{ backgroundColor: "#FFFFFF" }}>
            <Title order={4} mb="sm" style={{ color: "#0F172A" }}>
              Estado ante SUNAT
            </Title>
            {stats.status_distribution?.map((st: any, idx: number) => {
              const icons: any = {
                accepted: CheckCircle,
                pending: Clock,
                rejected: XCircle,
                voided: Ban,
              };
              const StatusIcon = icons[st.status] || CheckCircle;
              return (
                <Group key={idx} justify="space-between" py="xs" style={{ borderBottom: "1px solid #F1F5F9" }}>
                  <Group gap="xs">
                    <StatusIcon size={16} color={st.color} />
                    <Text size="sm">{st.label}</Text>
                  </Group>
                  <Badge color={st.status === "accepted" ? "teal" : st.status === "pending" ? "orange" : "gray"}>
                    {st.count}
                  </Badge>
                </Group>
              );
            })}
          </Paper>

          <Paper withBorder p="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
            <Title order={4} mb="sm" style={{ color: "#0F172A" }}>
              Tipos de Comprobantes Emitidos
            </Title>
            {stats.type_distribution?.map((tp: any, idx: number) => (
              <Group key={idx} justify="space-between" py="xs" style={{ borderBottom: "1px solid #F1F5F9" }}>
                <div>
                  <Text size="sm" fw={600}>
                    {tp.label}
                  </Text>
                  <Text size="xs" c="dimmed">
                    Total: S/ {Number(tp.total_amount_pen).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                  </Text>
                </div>
                <Badge variant="outline" color="dark">
                  {tp.count} docs
                </Badge>
              </Group>
            ))}
          </Paper>
        </Grid.Col>

        {/* Tabla de Operaciones Recientes */}
        <Grid.Col span={{ base: 12, md: 8 }}>
          <Paper withBorder p="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
            <Group justify="space-between" mb="md">
              <div>
                <Title order={4} style={{ color: "#0F172A" }}>
                  Últimas Operaciones Realizadas
                </Title>
                <Text size="xs" c="dimmed">
                  Comprobantes generados recientemente en el sistema
                </Text>
              </div>
              <Button
                component={Link}
                to="/comprobantes"
                variant="subtle"
                color="orange"
                size="xs"
                rightSection={<ArrowRight size={14} />}
              >
                Ver todos
              </Button>
            </Group>

            <Table verticalSpacing="sm" striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Tipo / Número</Table.Th>
                  <Table.Th>Fecha</Table.Th>
                  <Table.Th>Cliente</Table.Th>
                  <Table.Th>Total</Table.Th>
                  <Table.Th>Estado</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {stats.recent_operations?.map((op: any) => (
                  <Table.Tr key={op.id}>
                    <Table.Td>
                      <Text size="xs" fw={700}>
                        {op.type_label}
                      </Text>
                      <Text size="11px" c="dimmed" style={{ fontFamily: "monospace" }}>
                        {op.document_number}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs">{op.date}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" fw={500} lineClamp={1}>
                        {op.client_name}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" fw={700}>
                        {op.currency === "PEN" ? "S/" : "$"} {Number(op.total).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        size="xs"
                        color={op.status === "accepted" ? "teal" : op.status === "pending" ? "orange" : "gray"}
                      >
                        {op.status === "accepted" ? "Aceptado" : op.status}
                      </Badge>
                      {op.is_test_mode && (
                        <Badge size="xs" color="yellow" variant="outline" ml={4}>
                          Test
                        </Badge>
                      )}
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
};
