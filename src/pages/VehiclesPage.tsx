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
  Badge,
  Loader,
  Center,
  Box,
  ActionIcon,
  Card,
  SimpleGrid,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Plus, Trash2, Truck, Search, ShieldCheck } from "lucide-react";
import { apiRequest } from "../api/client";
import { useApp } from "../context/AppContext";

export const VehiclesPage: React.FC = () => {
  const { activeCompany } = useApp();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal
  const [opened, setOpened] = useState(false);
  const [vehicleToDelete, setVehicleToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [plateNumber, setPlateNumber] = useState("");
  const [secondaryPlate, setSecondaryPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [mtcAuthorization, setMtcAuthorization] = useState("");

  const loadVehicles = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const data = await apiRequest(`/vehicles?company_id=${activeCompany.id}`);
      setVehicles(data);
    } catch (err) {
      console.error("Error loading vehicles:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [activeCompany]);

  const handleSave = async () => {
    if (!plateNumber.trim() || !activeCompany) {
      notifications.show({ title: "Atención", message: "La placa del vehículo es obligatoria", color: "orange" });
      return;
    }

    setIsSaving(true);
    try {
      await apiRequest("/vehicles", {
        method: "POST",
        body: JSON.stringify({
          company_id: activeCompany.id,
          plate_number: plateNumber.trim().toUpperCase(),
          secondary_plate: secondaryPlate.trim().toUpperCase() || undefined,
          brand: brand.trim() || undefined,
          model: model.trim() || undefined,
          mtc_authorization: mtcAuthorization.trim() || undefined,
        }),
      });

      notifications.show({
        title: "Vehículo Registrado",
        message: `Vehículo con placa ${plateNumber.toUpperCase()} registrado con éxito`,
        color: "teal",
      });
      setOpened(false);
      resetForm();
      loadVehicles();
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!vehicleToDelete) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/vehicles/${vehicleToDelete.id}`, { method: "DELETE" });
      notifications.show({
        title: "Vehículo Desactivado",
        message: `Placa ${vehicleToDelete.plate_number} desactivada`,
        color: "teal",
      });
      setVehicleToDelete(null);
      loadVehicles();
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setPlateNumber("");
    setSecondaryPlate("");
    setBrand("");
    setModel("");
    setMtcAuthorization("");
  };

  const filteredVehicles = vehicles.filter((v) => {
    return (
      searchQuery === "" ||
      v.plate_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.brand && v.brand.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  });

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2} style={{ color: "#0F172A", fontWeight: 700 }}>
            Flota Vehicular y Transporte
          </Title>
          <Text size="sm" c="dimmed">
            Vehículos para Guías de Remisión Electrónica (GRE) • Empresa:{" "}
            <strong>{activeCompany?.trademark_name || activeCompany?.business_name}</strong>
          </Text>
        </div>
        <Button
          leftSection={<Plus size={16} />}
          color="indigo"
          style={{ backgroundColor: "#1E3A8A" }}
          onClick={() => {
            resetForm();
            setOpened(true);
          }}
        >
          Nuevo Vehículo
        </Button>
      </Group>

      {/* Resumen */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card withBorder padding="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed">
              VEHÍCULOS ACTIVOS
            </Text>
            <Truck size={20} color="#2563EB" />
          </Group>
          <Text size="xl" fw={700} c="blue.9">
            {vehicles.length} Unidades
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Disponibles para emisión de GRE
          </Text>
        </Card>

        <Card withBorder padding="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed">
              CON AUTORIZACIÓN MTC
            </Text>
            <ShieldCheck size={20} color="#059669" />
          </Group>
          <Text size="xl" fw={700} c="green.9">
            {vehicles.filter((v) => !!v.mtc_authorization).length} Unidades
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Habilitación vehicular vigente
          </Text>
        </Card>

        <Card withBorder padding="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed">
              CON SEMIRREMOLQUE / CARRETA
            </Text>
            <Truck size={20} color="#D97706" />
          </Group>
          <Text size="xl" fw={700} c="orange.9">
            {vehicles.filter((v) => !!v.secondary_plate).length} Unidades
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Placa secundaria registrada
          </Text>
        </Card>
      </SimpleGrid>

      {/* Búsqueda */}
      <Paper withBorder p="md" radius="md" mb="lg" style={{ backgroundColor: "#FFFFFF" }}>
        <TextInput
          placeholder="Buscar vehículo por placa o marca..."
          leftSection={<Search size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />
      </Paper>

      {/* Tabla */}
      <Paper withBorder radius="md" p="md" style={{ backgroundColor: "#FFFFFF" }}>
        {loading ? (
          <Center p="xl">
            <Loader color="indigo" />
          </Center>
        ) : filteredVehicles.length === 0 ? (
          <Center p="xl">
            <Text c="dimmed">No se encontraron vehículos registrados</Text>
          </Center>
        ) : (
          <Table verticalSpacing="sm" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>PLACA PRINCIPAL</Table.Th>
                <Table.Th>PLACA SECUNDARIA (CARRETA)</Table.Th>
                <Table.Th>MARCA / MODELO</Table.Th>
                <Table.Th>HABILITACIÓN MTC</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>ACCIONES</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredVehicles.map((veh) => (
                <Table.Tr key={veh.id}>
                  <Table.Td>
                    <Badge color="blue" size="md" variant="filled" style={{ fontFamily: "monospace" }}>
                      {veh.plate_number}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    {veh.secondary_plate ? (
                      <Badge color="cyan" size="sm" variant="outline" style={{ fontFamily: "monospace" }}>
                        {veh.secondary_plate}
                      </Badge>
                    ) : (
                      <Text size="xs" c="dimmed">
                        Sin carreta
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={600}>
                      {veh.brand || "Genérico"} {veh.model || ""}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {veh.mtc_authorization ? (
                      <Badge color="teal" variant="light" size="sm">
                        {veh.mtc_authorization}
                      </Badge>
                    ) : (
                      <Text size="xs" c="dimmed">
                        Opcional
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Tooltip label="Desactivar vehículo">
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => setVehicleToDelete(veh)}
                      >
                        <Trash2 size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* Modal Crear Vehículo */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          <Group>
            <Truck size={20} color="#1E3A8A" />
            <Text fw={700} size="md">
              Registrar Vehículo de Carga
            </Text>
          </Group>
        }
        centered
      >
        <Box>
          <Group grow mb="sm">
            <TextInput
              label="Placa Principal"
              placeholder="Ej. T3B-892"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.currentTarget.value.toUpperCase())}
              required
            />
            <TextInput
              label="Placa Secundaria (Semirremolque)"
              placeholder="Ej. BC4-110 (Opcional)"
              value={secondaryPlate}
              onChange={(e) => setSecondaryPlate(e.currentTarget.value.toUpperCase())}
            />
          </Group>

          <Group grow mb="sm">
            <TextInput
              label="Marca"
              placeholder="Ej. Volvo, Scania, Mercedes-Benz"
              value={brand}
              onChange={(e) => setBrand(e.currentTarget.value)}
            />
            <TextInput
              label="Modelo"
              placeholder="Ej. FH540 Tolva"
              value={model}
              onChange={(e) => setModel(e.currentTarget.value)}
            />
          </Group>

          <TextInput
            label="Habilitación Vehicular MTC"
            placeholder="Ej. MTC-154879-PE"
            value={mtcAuthorization}
            onChange={(e) => setMtcAuthorization(e.currentTarget.value)}
            mb="lg"
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setOpened(false)}>
              Cancelar
            </Button>
            <Button
              color="indigo"
              style={{ backgroundColor: "#1E3A8A" }}
              loading={isSaving}
              onClick={handleSave}
            >
              Guardar Vehículo
            </Button>
          </Group>
        </Box>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal
        opened={!!vehicleToDelete}
        onClose={() => setVehicleToDelete(null)}
        title="Confirmar Desactivación"
        centered
      >
        <Text size="sm" mb="lg">
          ¿Está seguro de que desea desactivar el vehículo con placa{" "}
          <strong>{vehicleToDelete?.plate_number}</strong>?
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setVehicleToDelete(null)}>
            Cancelar
          </Button>
          <Button color="red" loading={isDeleting} onClick={handleConfirmDelete}>
            Desactivar
          </Button>
        </Group>
      </Modal>
    </Box>
  );
};
