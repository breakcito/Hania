import React, { useState } from "react";
import {
  Title,
  Text,
  Group,
  Button,
  Grid,
  Select,
  Card,
  Badge,
  Box,
  Divider,
  SimpleGrid,
  ThemeIcon,
  Alert,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  FileSpreadsheet,
  Download,
  Truck,
  Info,
} from "lucide-react";
import { useApp } from "../context/AppContext";

export const ReportsPage: React.FC = () => {
  const { activeCompany, isTestMode, startDate, endDate } = useApp();

  // Filtros Registro de Ventas
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split("T")[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split("T")[0];

  const [salesStartDate, setSalesStartDate] = useState<string>(startDate || firstDayOfMonth);
  const [salesEndDate, setSalesEndDate] = useState<string>(endDate || lastDayOfMonth);
  const [salesType, setSalesType] = useState<string | null>(null);
  const [salesStatus, setSalesStatus] = useState<string | null>(null);
  const [isDownloadingSales, setIsDownloadingSales] = useState(false);

  // Filtros Guías
  const [greStartDate, setGreStartDate] = useState<string>(startDate || firstDayOfMonth);
  const [greEndDate, setGreEndDate] = useState<string>(endDate || lastDayOfMonth);
  const [isDownloadingGre, setIsDownloadingGre] = useState(false);

  const downloadFile = async (url: string, defaultFilename: string) => {
    const token = localStorage.getItem("hania_token");
    const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
    const fullUrl = `${baseUrl}${url.startsWith("/") ? url : `/${url}`}`;

    const res = await fetch(fullUrl, {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    });

    if (!res.ok) {
      throw new Error(`Error en servidor al generar Excel (${res.status})`);
    }

    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = defaultFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(blobUrl);
  };

  const handleDownloadSales = async () => {
    if (!activeCompany) return;
    setIsDownloadingSales(true);
    try {
      const q = new URLSearchParams({
        company_id: activeCompany.id.toString(),
        include_test: isTestMode ? "true" : "false",
      });
      if (salesStartDate) q.set("start_date", salesStartDate);
      if (salesEndDate) q.set("end_date", salesEndDate);
      if (salesType) q.set("type_code", salesType);
      if (salesStatus) q.set("status", salesStatus);

      const filename = `Registro_Ventas_${activeCompany.ruc}_${salesStartDate}_al_${salesEndDate}.xlsx`;
      await downloadFile(`/reports/sales-excel?${q.toString()}`, filename);

      notifications.show({
        title: "Reporte Descargado",
        message: "El archivo Excel del Registro de Ventas se generó con éxito",
        color: "teal",
      });
    } catch (err: any) {
      notifications.show({
        title: "Error al descargar",
        message: err.message,
        color: "red",
      });
    } finally {
      setIsDownloadingSales(false);
    }
  };

  const handleDownloadGre = async () => {
    if (!activeCompany) return;
    setIsDownloadingGre(true);
    try {
      const q = new URLSearchParams({
        company_id: activeCompany.id.toString(),
        include_test: isTestMode ? "true" : "false",
      });
      if (greStartDate) q.set("start_date", greStartDate);
      if (greEndDate) q.set("end_date", greEndDate);

      const filename = `Guias_Remision_${activeCompany.ruc}_${greStartDate}_al_${greEndDate}.xlsx`;
      await downloadFile(`/reports/despatches-excel?${q.toString()}`, filename);

      notifications.show({
        title: "Reporte Descargado",
        message: "El archivo Excel de Guías de Remisión se generó con éxito",
        color: "teal",
      });
    } catch (err: any) {
      notifications.show({
        title: "Error al descargar",
        message: err.message,
        color: "red",
      });
    } finally {
      setIsDownloadingGre(false);
    }
  };

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2} style={{ color: "#0F172A", fontWeight: 700 }}>
            Centro de Reportes Oficiales en Excel
          </Title>
          <Text size="sm" c="dimmed">
            Exportación contable oficial y análisis operativo para{" "}
            <strong>{activeCompany?.business_name}</strong>
          </Text>
        </div>

        <Badge size="lg" color={isTestMode ? "orange" : "green"} variant="light">
          {isTestMode ? "Reportes Modo Prueba" : "Reportes Modo Real SUNAT"}
        </Badge>
      </Group>

      <Alert
        icon={<Info size={18} />}
        color="blue"
        title="Formato Oficial para Contabilidad y Auditoría"
        mb="xl"
        radius="md"
        variant="light"
      >
        <Text size="xs">
          Los reportes generados cuentan con estructura de Registro de Ventas e Ingresos,
          cabeceras empresariales, fórmulas automáticas de sumatoria, desglose de detracciones y
          validación de estado tributario ante SUNAT.
        </Text>
      </Alert>

      <Grid>
        {/* Tarjeta 1: Registro de Ventas e Ingresos */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" p="lg" style={{ backgroundColor: "#FFFFFF", height: "100%" }}>
            <Group justify="space-between" mb="md">
              <Group gap="sm">
                <ThemeIcon size={44} radius="md" color="emerald" style={{ backgroundColor: "#059669" }}>
                  <FileSpreadsheet size={24} color="#FFFFFF" />
                </ThemeIcon>
                <div>
                  <Title order={4} style={{ color: "#0F172A" }}>
                    Registro de Ventas e Ingresos
                  </Title>
                  <Text size="xs" c="dimmed">
                    Formato estándar para declaración mensual SUNAT
                  </Text>
                </div>
              </Group>
              <Badge color="green" variant="light">
                Excel .XLSX
              </Badge>
            </Group>

            <Divider mb="md" />

            <SimpleGrid cols={2} mb="md">
              <div>
                <Text size="xs" fw={500} mb={4}>
                  Fecha Inicio:
                </Text>
                <input
                  type="date"
                  value={salesStartDate}
                  onChange={(e) => setSalesStartDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    fontSize: 13,
                  }}
                />
              </div>
              <div>
                <Text size="xs" fw={500} mb={4}>
                  Fecha Fin:
                </Text>
                <input
                  type="date"
                  value={salesEndDate}
                  onChange={(e) => setSalesEndDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    fontSize: 13,
                  }}
                />
              </div>
            </SimpleGrid>

            <SimpleGrid cols={2} mb="lg">
              <Select
                label="Tipo de Comprobante"
                placeholder="Todos los comprobantes"
                value={salesType}
                onChange={setSalesType}
                clearable
                data={[
                  { value: "01", label: "Solo Facturas (01)" },
                  { value: "03", label: "Solo Boletas (03)" },
                  { value: "07", label: "Solo Notas de Crédito (07)" },
                  { value: "08", label: "Solo Notas de Débito (08)" },
                ]}
              />
              <Select
                label="Estado Fiscal"
                placeholder="Todos los estados"
                value={salesStatus}
                onChange={setSalesStatus}
                clearable
                data={[
                  { value: "accepted", label: "Aceptados SUNAT" },
                  { value: "voided", label: "Anulados / Bajas" },
                  { value: "rejected", label: "Rechazados" },
                ]}
              />
            </SimpleGrid>

            <Box mt="auto">
              <Button
                fullWidth
                size="md"
                leftSection={<Download size={18} />}
                color="teal"
                style={{ backgroundColor: "#059669" }}
                onClick={handleDownloadSales}
                loading={isDownloadingSales}
              >
                Descargar Registro de Ventas (.xlsx)
              </Button>
            </Box>
          </Card>
        </Grid.Col>

        {/* Tarjeta 2: Reporte Logístico de Guías de Remisión */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Card withBorder radius="md" p="lg" style={{ backgroundColor: "#FFFFFF", height: "100%" }}>
            <Group justify="space-between" mb="md">
              <Group gap="sm">
                <ThemeIcon size={44} radius="md" color="blue" style={{ backgroundColor: "#1D4ED8" }}>
                  <Truck size={24} color="#FFFFFF" />
                </ThemeIcon>
                <div>
                  <Title order={4} style={{ color: "#0F172A" }}>
                    Reporte Logístico de Guías de Remisión
                  </Title>
                  <Text size="xs" c="dimmed">
                    Control de traslados, destinatarios, carga y placas
                  </Text>
                </div>
              </Group>
              <Badge color="blue" variant="light">
                Excel .XLSX
              </Badge>
            </Group>

            <Divider mb="md" />

            <SimpleGrid cols={2} mb="md">
              <div>
                <Text size="xs" fw={500} mb={4}>
                  Fecha Inicio de Traslado:
                </Text>
                <input
                  type="date"
                  value={greStartDate}
                  onChange={(e) => setGreStartDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    fontSize: 13,
                  }}
                />
              </div>
              <div>
                <Text size="xs" fw={500} mb={4}>
                  Fecha Fin de Traslado:
                </Text>
                <input
                  type="date"
                  value={greEndDate}
                  onChange={(e) => setGreEndDate(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 12px",
                    borderRadius: 6,
                    border: "1px solid #CBD5E1",
                    fontSize: 13,
                  }}
                />
              </div>
            </SimpleGrid>

            <Text size="xs" c="dimmed" mb="xl">
              Incluye trazabilidad de puntos de partida y llegada, modalidad de transporte público
              o privado, RUC transportista, chofer, placa de tolva y peso métrico transportado.
            </Text>

            <Box mt="auto">
              <Button
                fullWidth
                size="md"
                leftSection={<Download size={18} />}
                color="blue"
                style={{ backgroundColor: "#1D4ED8" }}
                onClick={handleDownloadGre}
                loading={isDownloadingGre}
              >
                Descargar Guías de Remisión (.xlsx)
              </Button>
            </Box>
          </Card>
        </Grid.Col>
      </Grid>
    </Box>
  );
};
