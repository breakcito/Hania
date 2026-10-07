import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Paper,
  Title,
  Text,
  Group,
  Table,
  Badge,
  Button,
  TextInput,
  Select,
  ActionIcon,
  Modal,
  Textarea,
  Loader,
  Center,
  Box,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  Search,
  FilePlus,
  FileText,
  FileCode,
  CheckSquare,
  Ban,
  FileSpreadsheet,
  Trash2,
  Download,
  FileDiff,
} from "lucide-react";
import { apiRequest } from "../api/client";
import { useApp } from "../context/AppContext";

export const DocumentsListPage: React.FC = () => {
  const { activeCompany, isTestMode } = useApp();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Filtros
  const [search, setSearch] = useState("");
  const [typeCode, setTypeCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  // Modal de Anulación
  const [voidDoc, setVoidDoc] = useState<any | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [isVoiding, setIsVoiding] = useState(false);

  // Modal de Eliminación Lógica
  const [docToDelete, setDocToDelete] = useState<any | null>(null);
  const [isDeletingDoc, setIsDeletingDoc] = useState(false);
  const [isDownloadingExcel, setIsDownloadingExcel] = useState(false);

  const handleDownloadExcel = async () => {
    if (!activeCompany) return;
    setIsDownloadingExcel(true);
    try {
      const q = new URLSearchParams({
        company_id: activeCompany.id.toString(),
        include_test: isTestMode ? "true" : "false",
      });
      if (typeCode) q.set("type_code", typeCode);
      if (status) q.set("status", status);

      const token = localStorage.getItem("hania_token");
      const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:8000/api";
      const res = await fetch(`${baseUrl}/reports/sales-excel?${q.toString()}`, {
        headers: { Authorization: token ? `Bearer ${token}` : "" },
      });
      if (!res.ok) throw new Error("Fallo al generar el reporte en Excel");

      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = `Registro_Ventas_${activeCompany.ruc}_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(blobUrl);

      notifications.show({
        title: "Excel Descargado",
        message: "El Registro de Ventas ha sido descargado en formato oficial .xlsx",
        color: "teal",
      });
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message || "No se pudo descargar el archivo Excel",
        color: "red",
      });
    } finally {
      setIsDownloadingExcel(false);
    }
  };

  const loadDocs = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (activeCompany) q.set("company_id", activeCompany.id.toString());
      if (isTestMode) q.set("is_test_mode", "true");
      if (typeCode) q.set("type_code", typeCode);
      if (status) q.set("status", status);
      if (search.trim()) q.set("search", search.trim());

      const data = await apiRequest(`/documents?${q.toString()}`);
      setDocuments(data);
    } catch (err) {
      console.error("Error loading documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDocs();
  }, [activeCompany, isTestMode, typeCode, status]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadDocs();
  };

  const handleVoid = async () => {
    if (!voidDoc || voidReason.trim().length < 5) {
      notifications.show({ title: "Atención", message: "Ingrese un motivo de anulación detallado", color: "orange" });
      return;
    }

    setIsVoiding(true);
    try {
      await apiRequest(`/documents/${voidDoc.id}/void`, {
        method: "POST",
        body: JSON.stringify({ reason: voidReason.trim() }),
      });
      notifications.show({
        title: "Comprobante Anulado",
        message: `${voidDoc.series}-${voidDoc.correlative} fue dado de baja correctamente`,
        color: "teal",
      });
      setVoidDoc(null);
      setVoidReason("");
      loadDocs();
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setIsVoiding(false);
    }
  };

  const handleConfirmDeleteDoc = async () => {
    if (!docToDelete) return;
    setIsDeletingDoc(true);
    try {
      await apiRequest(`/documents/${docToDelete.id}`, { method: "DELETE" });
      notifications.show({
        title: "Comprobante Archivado",
        message: `${docToDelete.series}-${docToDelete.correlative} fue archivado lógicamente (se mantiene en base de datos)`,
        color: "teal",
      });
      setDocToDelete(null);
      loadDocs();
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setIsDeletingDoc(false);
    }
  };

  const typeLabels: Record<string, string> = {
    "01": "Factura",
    "03": "Boleta",
    "07": "Nota Crédito",
    "08": "Nota Débito",
  };

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2} style={{ color: "#0F172A", fontWeight: 700 }}>
            Historial de Comprobantes Electrónicos
          </Title>
          <Text size="sm" c="dimmed">
            Registro oficial de Facturas, Boletas y Notas emitidas ante SUNAT
          </Text>
        </div>

        <Group>
          <Button
            leftSection={<Download size={16} />}
            color="teal"
            style={{ backgroundColor: "#059669" }}
            onClick={handleDownloadExcel}
            loading={isDownloadingExcel}
          >
            Exportar Excel (RVIE)
          </Button>

          <Button
            component={Link}
            to="/emitir-comprobante"
            leftSection={<FilePlus size={16} />}
            color="amber"
            style={{ backgroundColor: "#D97706" }}
          >
            Nueva Factura / Boleta
          </Button>
        </Group>
      </Group>

      {/* Barra de Filtros y Búsqueda */}
      <Paper withBorder p="md" radius="md" mb="md" style={{ backgroundColor: "#FFFFFF" }}>
        <form onSubmit={handleSearchSubmit}>
          <Group justify="space-between">
            <Group style={{ flex: 1 }}>
              <TextInput
                placeholder="Buscar por cliente, RUC o número de comprobante..."
                value={search}
                onChange={(e) => setSearch(e.currentTarget.value)}
                leftSection={<Search size={14} />}
                style={{ width: 340 }}
              />
              <Select
                placeholder="Tipo de documento"
                value={typeCode}
                onChange={setTypeCode}
                clearable
                data={[
                  { value: "01", label: "Facturas (01)" },
                  { value: "03", label: "Boletas (03)" },
                  { value: "07", label: "Notas de Crédito (07)" },
                  { value: "08", label: "Notas de Débito (08)" },
                ]}
                style={{ width: 180 }}
              />
              <Select
                placeholder="Estado SUNAT"
                value={status}
                onChange={setStatus}
                clearable
                data={[
                  { value: "accepted", label: "Aceptados" },
                  { value: "pending", label: "Pendientes" },
                  { value: "rejected", label: "Rechazados" },
                  { value: "voided", label: "Anulados" },
                ]}
                style={{ width: 160 }}
              />
              <Button type="submit" variant="default">
                Filtrar
              </Button>
            </Group>
          </Group>
        </form>
      </Paper>

      {/* Tabla de Documentos */}
      <Paper withBorder radius="md" style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}>
        {loading ? (
          <Center p="xl">
            <Loader color="amber" />
          </Center>
        ) : documents.length === 0 ? (
          <Center p="xl">
            <Box ta="center">
              <FileSpreadsheet size={48} color="#94A3B8" />
              <Text c="dimmed" mt="xs">
                No se encontraron comprobantes con los filtros seleccionados
              </Text>
            </Box>
          </Center>
        ) : (
          <Table verticalSpacing="sm" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr style={{ backgroundColor: "#F8FAFC" }}>
                <Table.Th>Comprobante</Table.Th>
                <Table.Th>Fecha Emisión</Table.Th>
                <Table.Th>Cliente / Destinatario</Table.Th>
                <Table.Th>Importe Total</Table.Th>
                <Table.Th>Estado SUNAT</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Descargas & Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {documents.map((doc) => (
                <Table.Tr key={doc.id}>
                  <Table.Td>
                    <Group gap={6}>
                      <Badge size="xs" variant="light" color={doc.type_code === "01" ? "blue" : doc.type_code === "03" ? "green" : "orange"}>
                        {typeLabels[doc.type_code] || doc.type_code}
                      </Badge>
                      <Text size="sm" fw={700} style={{ fontFamily: "monospace" }}>
                        {doc.document_number}
                      </Text>
                    </Group>
                    {doc.is_test_mode && (
                      <Badge size="xs" color="yellow" variant="filled" mt={2}>
                        Modo Prueba
                      </Badge>
                    )}
                  </Table.Td>

                  <Table.Td>
                    <Text size="xs">{doc.issue_date}</Text>
                    <Text size="10px" c="dimmed">
                      {doc.payment_method === "credito" ? "Al Crédito" : "Contado"}
                    </Text>
                  </Table.Td>

                  <Table.Td>
                    <Text size="xs" fw={600} lineClamp={1}>
                      {doc.client_name}
                    </Text>
                    <Text size="11px" c="dimmed">
                      RUC/DNI: {doc.client_doc_number}
                    </Text>
                  </Table.Td>

                  <Table.Td>
                    <Text size="sm" fw={700}>
                      {doc.currency === "PEN" ? "S/" : "$"} {Number(doc.total).toLocaleString("es-PE", { minimumFractionDigits: 2 })}
                    </Text>
                    {doc.detraction && (
                      <Text size="10px" c="orange.8">
                        Detracción: S/ {Number(doc.detraction.amount || 0).toFixed(2)}
                      </Text>
                    )}
                  </Table.Td>

                  <Table.Td>
                    <Badge
                      size="sm"
                      color={
                        doc.status === "accepted"
                          ? "teal"
                          : doc.status === "pending"
                          ? "orange"
                          : doc.status === "voided"
                          ? "gray"
                          : "red"
                      }
                    >
                      {doc.status === "accepted"
                        ? "Aceptado"
                        : doc.status === "pending"
                        ? "Pendiente"
                        : doc.status === "voided"
                        ? "Anulado"
                        : "Rechazado"}
                    </Badge>
                    {doc.sunat_description && (
                      <Text size="10px" c="dimmed" lineClamp={1} mt={2}>
                        {doc.sunat_description}
                      </Text>
                    )}
                  </Table.Td>

                  <Table.Td style={{ textAlign: "right" }}>
                    <Group gap="xs" justify="flex-end">
                      {doc.pdf_url && (
                        <Tooltip label="Ver / Descargar PDF">
                          <ActionIcon
                            component="a"
                            href={doc.pdf_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="light"
                            color="blue"
                            size="sm"
                          >
                            <FileText size={14} />
                          </ActionIcon>
                        </Tooltip>
                      )}

                      {doc.xml_url && (
                        <Tooltip label="Descargar XML">
                          <ActionIcon
                            component="a"
                            href={doc.xml_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="light"
                            color="teal"
                            size="sm"
                          >
                            <FileCode size={14} />
                          </ActionIcon>
                        </Tooltip>
                      )}

                      {doc.cdr_url && (
                        <Tooltip label="Descargar CDR (Constancia SUNAT)">
                          <ActionIcon
                            component="a"
                            href={doc.cdr_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            variant="light"
                            color="grape"
                            size="sm"
                          >
                            <CheckSquare size={14} />
                          </ActionIcon>
                        </Tooltip>
                      )}

                      {doc.status !== "voided" && (
                        <Tooltip label="Anular Comprobante (Baja SUNAT)">
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="sm"
                            onClick={() => {
                              setVoidDoc(doc);
                              setVoidReason("");
                            }}
                          >
                            <Ban size={14} />
                          </ActionIcon>
                        </Tooltip>
                      )}

                      {(doc.type_code === "01" || doc.type_code === "03") && doc.status === "accepted" && (
                        <Tooltip label="Emitir Nota de Crédito / Débito">
                          <ActionIcon
                            component={Link}
                            to={`/notas-credito-debito?affectedType=${doc.type_code}&affectedSeries=${doc.series}&affectedCorr=${doc.correlative}&clientDoc=${doc.client_doc_number}&clientName=${encodeURIComponent(doc.client_name)}&amount=${doc.total_taxable}`}
                            variant="light"
                            color="orange"
                            size="sm"
                          >
                            <FileDiff size={14} />
                          </ActionIcon>
                        </Tooltip>
                      )}

                      <Tooltip label="Archivar comprobante (eliminación lógica)">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          onClick={() => setDocToDelete(doc)}
                        >
                          <Trash2 size={14} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* Modal de Anulación / Baja SUNAT */}
      <Modal
        opened={!!voidDoc}
        onClose={() => setVoidDoc(null)}
        title="Anular Comprobante Electrónico (Baja SUNAT)"
        centered
        size="md"
      >
        <Box p="xs">
          <Text size="sm" mb="xs">
            Está a punto de dar de baja el comprobante{" "}
            <b>
              {voidDoc?.series}-{voidDoc?.correlative}
            </b>
            .
          </Text>
          <Textarea
            label="Motivo de Anulación (Requerido por SUNAT)"
            placeholder="Ej. Error en RUC, anulación de la operación comercial, etc."
            required
            minRows={3}
            value={voidReason}
            onChange={(e) => setVoidReason(e.currentTarget.value)}
            mb="md"
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setVoidDoc(null)}>
              Cancelar
            </Button>
            <Button color="red" loading={isVoiding} onClick={handleVoid}>
              Confirmar Anulación
            </Button>
          </Group>
        </Box>
      </Modal>

      {/* Modal Confirmación de Eliminación Lógica */}
      <Modal
        opened={!!docToDelete}
        onClose={() => setDocToDelete(null)}
        title="Confirmar Eliminación Lógica"
        centered
        size="sm"
      >
        <Box p="xs">
          <Text size="sm" mb="sm">
            ¿Desea archivar el comprobante <b>{docToDelete?.series}-{docToDelete?.correlative}</b>?
          </Text>
          <Text size="xs" c="dimmed" mb="lg">
            Se aplicará eliminación lógica. El comprobante dejará de mostrarse en la bandeja activa, pero se preservará íntegramente en la base de datos para cumplimiento tributario y fiscalizaciones de SUNAT.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setDocToDelete(null)}>
              Cancelar
            </Button>
            <Button color="red" loading={isDeletingDoc} onClick={handleConfirmDeleteDoc}>
              Archivar Comprobante
            </Button>
          </Group>
        </Box>
      </Modal>
    </Box>
  );
};
