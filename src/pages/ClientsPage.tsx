import React, { useEffect, useState } from "react";
import {
  Paper,
  Title,
  Text,
  Group,
  Table,
  Button,
  TextInput,
  Modal,
  Select,
  Loader,
  Center,
  Box,
  ActionIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Plus, Search, Trash2 } from "lucide-react";
import { apiRequest } from "../api/client";
import { useApp } from "../context/AppContext";

export const ClientsPage: React.FC = () => {
  const { activeCompany } = useApp();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientToDelete, setClientToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal
  const [opened, setOpened] = useState(false);
  const [docType, setDocType] = useState("6");
  const [docNumber, setDocNumber] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadClients = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const data = await apiRequest(`/clients?company_id=${activeCompany.id}`);
      setClients(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [activeCompany]);

  const handleLookup = async () => {
    if (!docNumber.trim()) return;
    setIsSearching(true);
    try {
      if (docType === "6") {
        const res = await apiRequest(`/services/ruc/${docNumber.trim()}`);
        if (res.data) {
          setName(res.data.razon_social || "");
          setAddress(res.data.direccion || "");
        }
      } else {
        const res = await apiRequest(`/services/dni/${docNumber.trim()}`);
        if (res.data) {
          setName(`${res.data.nombres || ""} ${res.data.apellido_paterno || ""}`.trim());
        }
      }
    } catch (err: any) {
      notifications.show({ title: "No encontrado", message: err.message, color: "red" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    if (!docNumber || !name || !activeCompany) return;
    setIsSaving(true);
    try {
      await apiRequest("/clients", {
        method: "POST",
        body: JSON.stringify({
          company_id: activeCompany.id,
          doc_type: docType,
          doc_number: docNumber.trim(),
          name: name.trim(),
          address: address.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
        }),
      });
      notifications.show({ title: "Guardado", message: "Cliente registrado con éxito", color: "teal" });
      setOpened(false);
      setDocNumber("");
      setName("");
      setAddress("");
      setPhone("");
      loadClients();
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!clientToDelete) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/clients/${clientToDelete.id}`, { method: "DELETE" });
      notifications.show({
        title: "Cliente Desactivado",
        message: `El cliente ${clientToDelete.name} fue eliminado lógicamente (se preserva su historial)`,
        color: "teal",
      });
      setClientToDelete(null);
      loadClients();
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2} style={{ color: "#0F172A", fontWeight: 700 }}>
            Directorio de Clientes
          </Title>
          <Text size="sm" c="dimmed">
            Compradores frecuentes y destinatarios de carga de <b>{activeCompany?.business_name}</b>
          </Text>
        </div>

        <Button
          leftSection={<Plus size={16} />}
          color="amber"
          style={{ backgroundColor: "#D97706" }}
          onClick={() => setOpened(true)}
        >
          Nuevo Cliente
        </Button>
      </Group>

      <Paper withBorder radius="md" style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}>
        {loading ? (
          <Center p="xl">
            <Loader color="amber" />
          </Center>
        ) : (
          <Table verticalSpacing="sm" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr style={{ backgroundColor: "#F8FAFC" }}>
                <Table.Th>RUC / Documento</Table.Th>
                <Table.Th>Razón Social / Nombre</Table.Th>
                <Table.Th>Dirección Fiscal</Table.Th>
                <Table.Th>Correo Electrónico</Table.Th>
                <Table.Th>Teléfono</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Acción</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {clients.map((c) => (
                <Table.Tr key={c.id}>
                  <Table.Td>
                    <Text size="sm" fw={700} style={{ fontFamily: "monospace" }}>
                      {c.doc_number}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={600}>
                      {c.name}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed">
                      {c.address || "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs">{c.email || "-"}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs">{c.phone || "-"}</Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      title="Eliminar lógicamente (desactivar cliente)"
                      onClick={() => setClientToDelete(c)}
                    >
                      <Trash2 size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* Modal Nuevo Cliente */}
      <Modal opened={opened} onClose={() => setOpened(false)} title="Registrar Nuevo Cliente" centered size="md">
        <Box p="xs">
          <Select
            label="Tipo de Documento"
            value={docType}
            onChange={(val) => val && setDocType(val)}
            data={[
              { value: "6", label: "RUC" },
              { value: "1", label: "DNI" },
            ]}
            mb="xs"
            allowDeselect={false}
          />
          <TextInput
            label="Número de Documento"
            placeholder="Ingrese RUC o DNI"
            value={docNumber}
            onChange={(e) => setDocNumber(e.currentTarget.value)}
            mb="xs"
            rightSection={
              <ActionIcon variant="filled" color="amber" onClick={handleLookup} loading={isSearching} size="sm">
                <Search size={14} />
              </ActionIcon>
            }
          />
          <TextInput label="Razón Social / Nombre" value={name} onChange={(e) => setName(e.currentTarget.value)} mb="xs" required />
          <TextInput label="Dirección Fiscal" value={address} onChange={(e) => setAddress(e.currentTarget.value)} mb="xs" />
          <TextInput label="Correo Electrónico" value={email} onChange={(e) => setEmail(e.currentTarget.value)} mb="xs" />
          <TextInput label="Teléfono de Contacto" value={phone} onChange={(e) => setPhone(e.currentTarget.value)} mb="md" />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setOpened(false)}>
              Cancelar
            </Button>
            <Button color="amber" loading={isSaving} onClick={handleSave} style={{ backgroundColor: "#D97706" }}>
              Guardar Cliente
            </Button>
          </Group>
        </Box>
      </Modal>

      {/* Modal Confirmación de Eliminación Lógica */}
      <Modal
        opened={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        title="Confirmar Eliminación Lógica"
        centered
        size="sm"
      >
        <Box p="xs">
          <Text size="sm" mb="sm">
            ¿Está seguro de desactivar a <b>{clientToDelete?.name}</b>?
          </Text>
          <Text size="xs" c="dimmed" mb="lg">
            El cliente será dado de baja del directorio activo. Su historial de facturas y guías previas se preservará intacto para efectos tributarios y SUNAT.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setClientToDelete(null)}>
              Cancelar
            </Button>
            <Button color="red" loading={isDeleting} onClick={handleConfirmDelete}>
              Desactivar Cliente
            </Button>
          </Group>
        </Box>
      </Modal>
    </Box>
  );
};
