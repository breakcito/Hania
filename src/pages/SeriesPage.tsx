import React, { useState, useEffect } from "react";
import {
  Paper,
  Title,
  Text,
  Group,
  Button,
  Table,
  Badge,
  Modal,
  TextInput,
  Select,
  NumberInput,
  Loader,
  Center,
  Box,
  SimpleGrid,
  Card,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  Hash,
  Plus,
  Layers,
  FileCheck,
  Truck,
  RotateCw,
} from "lucide-react";
import { apiRequest } from "../api/client";
import { useApp } from "../context/AppContext";

export const SeriesPage: React.FC = () => {
  const { activeCompany } = useApp();
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Crear Serie
  const [modalOpened, setModalOpened] = useState(false);
  const [docType, setDocType] = useState<string>("01");
  const [seriesCode, setSeriesCode] = useState<string>("");
  const [correlativeStart, setCorrelativeStart] = useState<number>(0);
  const [description, setDescription] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadSeries = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const data = await apiRequest(`/series?company_id=${activeCompany.id}`);
      setSeriesList(data);
    } catch (err: any) {
      notifications.show({
        title: "Error al cargar",
        message: err.message || "No se pudieron obtener las series",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSeries();
  }, [activeCompany]);

  const handleCreateSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !seriesCode.trim()) {
      notifications.show({
        title: "Campo requerido",
        message: "Ingrese el código de la serie (Ej. F002, B002, T002)",
        color: "orange",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await apiRequest("/series", {
        method: "POST",
        body: JSON.stringify({
          company_id: activeCompany.id,
          document_type: docType,
          series: seriesCode.trim().toUpperCase(),
          correlative_current: Number(correlativeStart) || 0,
          description: description.trim() || null,
          is_active: true,
        }),
      });

      notifications.show({
        title: "Serie Registrada",
        message: `La serie ${seriesCode.toUpperCase()} fue creada correctamente`,
        color: "teal",
      });

      setModalOpened(false);
      setSeriesCode("");
      setCorrelativeStart(0);
      setDescription("");
      loadSeries();
    } catch (err: any) {
      notifications.show({
        title: "Error al registrar",
        message: err.message,
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const docTypeLabels: Record<string, { label: string; color: string }> = {
    "01": { label: "Factura Electrónica", color: "blue" },
    "03": { label: "Boleta de Venta", color: "green" },
    "07": { label: "Nota de Crédito", color: "orange" },
    "08": { label: "Nota de Débito", color: "grape" },
    "09": { label: "Guía Remitente", color: "teal" },
    "31": { label: "Guía Transportista", color: "cyan" },
  };

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2} style={{ color: "#0F172A", fontWeight: 700 }}>
            Series y Correlativos de Comprobantes
          </Title>
          <Text size="sm" c="dimmed">
            Control de numeración oficial para{" "}
            <strong>{activeCompany?.trademark_name || activeCompany?.business_name}</strong>
          </Text>
        </div>

        <Group>
          <Button
            leftSection={<RotateCw size={16} />}
            variant="default"
            onClick={loadSeries}
            loading={loading}
          >
            Actualizar
          </Button>
          <Button
            leftSection={<Plus size={16} />}
            color="amber"
            style={{ backgroundColor: "#D97706" }}
            onClick={() => setModalOpened(true)}
          >
            Nueva Serie
          </Button>
        </Group>
      </Group>

      {/* Resumen por tipo de comprobante */}
      <SimpleGrid cols={{ base: 1, sm: 2, md: 4 }} mb="xl">
        <Card withBorder padding="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="blue.8">
              FACTURAS (01)
            </Text>
            <FileCheck size={18} color="#2563EB" />
          </Group>
          <Text size="xl" fw={700}>
            {seriesList.find((s) => s.document_type === "01")?.series || "F001"}
          </Text>
          <Text size="xs" c="dimmed">
            Último N°: {seriesList.find((s) => s.document_type === "01")?.correlative_current || 0}
          </Text>
        </Card>

        <Card withBorder padding="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="green.8">
              BOLETAS (03)
            </Text>
            <FileCheck size={18} color="#059669" />
          </Group>
          <Text size="xl" fw={700}>
            {seriesList.find((s) => s.document_type === "03")?.series || "B001"}
          </Text>
          <Text size="xs" c="dimmed">
            Último N°: {seriesList.find((s) => s.document_type === "03")?.correlative_current || 0}
          </Text>
        </Card>

        <Card withBorder padding="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="orange.8">
              NOTAS DE CRÉDITO (07)
            </Text>
            <Layers size={18} color="#D97706" />
          </Group>
          <Text size="xl" fw={700}>
            {seriesList.filter((s) => s.document_type === "07").map((s) => s.series).join(", ") || "FC01"}
          </Text>
          <Text size="xs" c="dimmed">
            Series para Facturas y Boletas
          </Text>
        </Card>

        <Card withBorder padding="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="teal.8">
              GUÍAS DE REMISIÓN (09)
            </Text>
            <Truck size={18} color="#0D9488" />
          </Group>
          <Text size="xl" fw={700}>
            {seriesList.find((s) => s.document_type === "09")?.series || "T001"}
          </Text>
          <Text size="xs" c="dimmed">
            Último N°: {seriesList.find((s) => s.document_type === "09")?.correlative_current || 0}
          </Text>
        </Card>
      </SimpleGrid>

      {/* Tabla de Series */}
      <Paper withBorder radius="md" p="md" style={{ backgroundColor: "#FFFFFF" }}>
        <Group justify="space-between" mb="md">
          <Title order={4} style={{ color: "#1E293B" }}>
            Listado de Series Autorizadas
          </Title>
          <Badge color="gray" variant="light">
            {seriesList.length} Series registradas
          </Badge>
        </Group>

        {loading ? (
          <Center p="xl">
            <Loader size="md" color="amber" />
          </Center>
        ) : (
          <Table verticalSpacing="sm" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Tipo de Comprobante</Table.Th>
                <Table.Th>Código Serie</Table.Th>
                <Table.Th>Último Correlativo Emitido</Table.Th>
                <Table.Th>Próximo Correlativo</Table.Th>
                <Table.Th>Descripción / Uso</Table.Th>
                <Table.Th>Estado</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {seriesList.map((ser) => {
                const typeMeta = docTypeLabels[ser.document_type] || {
                  label: `Tipo ${ser.document_type}`,
                  color: "gray",
                };
                const nextCorr = (ser.correlative_current || 0) + 1;
                return (
                  <Table.Tr key={ser.id}>
                    <Table.Td>
                      <Badge color={typeMeta.color} variant="light" size="sm">
                        {typeMeta.label} ({ser.document_type})
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Hash size={16} color="#475569" />
                        <Text fw={700} size="md" style={{ fontFamily: "monospace" }}>
                          {ser.series}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={600} style={{ fontFamily: "monospace" }}>
                        {ser.correlative_current}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color="teal" variant="filled" size="sm">
                        {ser.series}-{String(nextCorr).padStart(8, "0")}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {ser.description || "Serie estándar"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      {ser.is_active ? (
                        <Badge color="green" size="xs">
                          Activa
                        </Badge>
                      ) : (
                        <Badge color="gray" size="xs">
                          Inactiva
                        </Badge>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* Modal Registrar Serie */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={
          <Group gap="xs">
            <Hash size={20} color="#D97706" />
            <Text fw={700}>Crear Nueva Serie de Comprobante</Text>
          </Group>
        }
        radius="md"
      >
        <form onSubmit={handleCreateSeries}>
          <Select
            label="Tipo de Comprobante"
            data={[
              { value: "01", label: "Factura Electrónica (01)" },
              { value: "03", label: "Boleta de Venta (03)" },
              { value: "07", label: "Nota de Crédito (07)" },
              { value: "08", label: "Nota de Débito (08)" },
              { value: "09", label: "Guía de Remisión Remitente (09)" },
              { value: "31", label: "Guía de Remisión Transportista (31)" },
            ]}
            value={docType}
            onChange={(val) => setDocType(val || "01")}
            required
            mb="sm"
          />

          <TextInput
            label="Código de Serie (4 caracteres)"
            placeholder="Ej. F002, B002, T002"
            description="Debe iniciar con F (Factura), B (Boleta), FC/BC (Notas), T (Guía)"
            value={seriesCode}
            onChange={(e) => setSeriesCode(e.currentTarget.value)}
            maxLength={4}
            required
            mb="sm"
          />

          <NumberInput
            label="Correlativo Inicial (Base)"
            description="Si ya tiene numeración previa, especifique el último número"
            value={correlativeStart}
            onChange={(val) => setCorrelativeStart(Number(val) || 0)}
            min={0}
            mb="sm"
          />

          <TextInput
            label="Descripción / Sucursal"
            placeholder="Ej. Serie para Sucursal Callao o Punto de Venta 2"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            mb="lg"
          />

          <Divider mb="lg" />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModalOpened(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              color="amber"
              style={{ backgroundColor: "#D97706" }}
              loading={isSubmitting}
            >
              Guardar Serie
            </Button>
          </Group>
        </form>
      </Modal>
    </Box>
  );
};
