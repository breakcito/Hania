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
  ActionIcon,
  Modal,
  Textarea,
  Loader,
  Center,
  Box,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Truck, Plus, FileText, FileCode, Ban, Trash2 } from "lucide-react";
import { apiRequest } from "../api/client";
import { useApp } from "../context/AppContext";

export const DespatchesListPage: React.FC = () => {
  const { activeCompany, isTestMode, startDate, endDate } = useApp();
  const [despatches, setDespatches] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [voidGre, setVoidGre] = useState<any | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [isVoiding, setIsVoiding] = useState(false);

  const [greToDelete, setGreToDelete] = useState<any | null>(null);
  const [isDeletingGre, setIsDeletingGre] = useState(false);

  const loadDespatches = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (activeCompany) q.set("company_id", activeCompany.id.toString());
      if (isTestMode) q.set("is_test_mode", "true");
      if (startDate) q.set("start_date", startDate);
      if (endDate) q.set("end_date", endDate);
      const data = await apiRequest(`/despatches?${q.toString()}`);
      setDespatches(data);
    } catch (err) {
      console.error("Error loading despatches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDespatches();
  }, [activeCompany, isTestMode, startDate, endDate]);

  const handleVoid = async () => {
    if (!voidGre || voidReason.trim().length < 5) {
      notifications.show({ title: "Atención", message: "Ingrese un motivo de anulación válido", color: "orange" });
      return;
    }
    setIsVoiding(true);
    try {
      await apiRequest(`/despatches/${voidGre.id}/void`, {
        method: "POST",
        body: JSON.stringify({ reason: voidReason.trim() }),
      });
      notifications.show({ title: "GRE Anulada", message: "La guía fue anulada correctamente", color: "teal" });
      setVoidGre(null);
      setVoidReason("");
      loadDespatches();
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setIsVoiding(false);
    }
  };

  const handleConfirmDeleteGre = async () => {
    if (!greToDelete) return;
    setIsDeletingGre(true);
    try {
      await apiRequest(`/despatches/${greToDelete.id}`, { method: "DELETE" });
      notifications.show({
        title: "Guía Archivada",
        message: `${greToDelete.despatch_number} fue archivada lógicamente (se preserva en base de datos)`,
        color: "teal",
      });
      setGreToDelete(null);
      loadDespatches();
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setIsDeletingGre(false);
    }
  };

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2} style={{ color: "#0F172A", fontWeight: 700 }}>
            Guías de Remisión Electrónica
          </Title>
          <Text size="sm" c="dimmed">
            Control de traslados de carbón, minerales y carga pesada • Empresa: <b>{activeCompany?.business_name}</b>
          </Text>
        </div>

        <Button
          component={Link}
          to="/guias-remision/nueva"
          leftSection={<Plus size={16} />}
          color="amber"
          style={{ backgroundColor: "#D97706" }}
        >
          Emitir Nueva GRE
        </Button>
      </Group>

      <Paper withBorder radius="md" style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}>
        {loading ? (
          <Center p="xl">
            <Loader color="amber" />
          </Center>
        ) : despatches.length === 0 ? (
          <Center p="xl">
            <Box ta="center">
              <Truck size={48} color="#94A3B8" />
              <Text c="dimmed" mt="xs">
                No hay guías de remisión registradas
              </Text>
            </Box>
          </Center>
        ) : (
          <Table verticalSpacing="sm" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr style={{ backgroundColor: "#F8FAFC" }}>
                <Table.Th>Número GRE</Table.Th>
                <Table.Th>Fecha Traslado</Table.Th>
                <Table.Th>Destinatario</Table.Th>
                <Table.Th>Modalidad</Table.Th>
                <Table.Th>Peso Carga</Table.Th>
                <Table.Th>Estado SUNAT</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Archivos & Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {despatches.map((gre) => (
                <Table.Tr key={gre.id}>
                  <Table.Td>
                    <Text size="sm" fw={700} style={{ fontFamily: "monospace" }}>
                      {gre.despatch_number}
                    </Text>
                    {gre.is_test_mode && (
                      <Badge size="xs" color="yellow" variant="filled">
                        Modo Prueba
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs">{gre.transfer_date}</Text>
                    <Text size="10px" c="dimmed">
                      Emisión: {gre.issue_date}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" fw={600} lineClamp={1}>
                      {gre.recipient?.name}
                    </Text>
                    <Text size="11px" c="dimmed">
                      RUC: {gre.recipient?.doc_number}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="xs" variant="outline" color={gre.transport_mode === "01" ? "blue" : "indigo"}>
                      {gre.transport_mode === "01" ? "Público" : "Privado"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" fw={700}>
                      {gre.total_weight} {gre.weight_unit}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      color={gre.status === "accepted" ? "teal" : gre.status === "pending" ? "orange" : "gray"}
                    >
                      {gre.status === "accepted" ? "Aceptado" : gre.status}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Group gap="xs" justify="flex-end">
                      {gre.status === "pending" && (
                        <Tooltip label="Guía en procesamiento ante SUNAT">
                          <Badge size="xs" color="yellow" variant="light">
                            Procesando
                          </Badge>
                        </Tooltip>
                      )}
                      {gre.pdf_url && gre.status !== "pending" && gre.status !== "failed" && (
                        <Tooltip label="Ver PDF">
                          <ActionIcon
                            component="a"
                            href={gre.pdf_url}
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
                      {gre.xml_url && gre.status !== "pending" && gre.status !== "failed" && (
                        <Tooltip label="Descargar XML">
                          <ActionIcon
                            component="a"
                            href={gre.xml_url}
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
                      {gre.status !== "voided" && (
                        <Tooltip label="Anular Guía">
                          <ActionIcon
                            variant="light"
                            color="red"
                            size="sm"
                            onClick={() => {
                              setVoidGre(gre);
                              setVoidReason("");
                            }}
                          >
                            <Ban size={14} />
                          </ActionIcon>
                        </Tooltip>
                      )}

                      <Tooltip label="Archivar guía (eliminación lógica)">
                        <ActionIcon
                          variant="subtle"
                          color="gray"
                          size="sm"
                          onClick={() => setGreToDelete(gre)}
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

      {/* Modal de Anulación GRE */}
      <Modal opened={!!voidGre} onClose={() => setVoidGre(null)} title="Anular Guía de Remisión" centered size="md">
        <Box p="xs">
          <Text size="sm" mb="xs">
            ¿Está seguro de anular la guía <b>{voidGre?.despatch_number}</b>?
          </Text>
          <Textarea
            label="Motivo de Anulación"
            placeholder="Ej. Suspensión de viaje o cambio de unidad de transporte"
            required
            minRows={3}
            value={voidReason}
            onChange={(e) => setVoidReason(e.currentTarget.value)}
            mb="md"
          />
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setVoidGre(null)}>
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
        opened={!!greToDelete}
        onClose={() => setGreToDelete(null)}
        title="Confirmar Eliminación Lógica"
        centered
        size="sm"
      >
        <Box p="xs">
          <Text size="sm" mb="sm">
            ¿Desea archivar la guía de remisión <b>{greToDelete?.despatch_number}</b>?
          </Text>
          <Text size="xs" c="dimmed" mb="lg">
            Se aplicará eliminación lógica. La guía no aparecerá en el listado activo pero su registro y puntos de partida/llegada se mantendrán archivados en la base de datos para auditoría fiscal.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setGreToDelete(null)}>
              Cancelar
            </Button>
            <Button color="red" loading={isDeletingGre} onClick={handleConfirmDeleteGre}>
              Archivar Guía
            </Button>
          </Group>
        </Box>
      </Modal>
    </Box>
  );
};
