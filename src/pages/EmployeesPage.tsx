import React, { useEffect, useState } from "react";
import {
  Paper,
  Title,
  Text,
  Group,
  Table,
  Button,
  TextInput,
  Select,
  NumberInput,
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
import { Plus, Trash2, Users, Search, Award, Truck, UserCheck } from "lucide-react";
import { apiRequest } from "../api/client";
import { useApp } from "../context/AppContext";

export const EmployeesPage: React.FC = () => {
  const { activeCompany } = useApp();
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterJob, setFilterJob] = useState<string | null>(null);

  // Modal
  const [opened, setOpened] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [documentType, setDocumentType] = useState("1");
  const [documentNumber, setDocumentNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [jobTitle, setJobTitle] = useState("Vendedor");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [commissionRate, setCommissionRate] = useState<number>(0.0);
  const [isSearchingDoc, setIsSearchingDoc] = useState(false);

  const loadEmployees = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const data = await apiRequest(`/employees?company_id=${activeCompany.id}`);
      setEmployees(data);
    } catch (err) {
      console.error("Error loading employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, [activeCompany]);

  // Consulta automática DNI ante RENIEC
  const handleLookupDni = async () => {
    if (!documentNumber.trim() || documentType !== "1") return;
    setIsSearchingDoc(true);
    try {
      const res = await apiRequest(`/services/dni/${documentNumber.trim()}`);
      if (res.data) {
        setFirstName(res.data.nombres || "");
        setLastName(`${res.data.apellido_paterno || ""} ${res.data.apellido_materno || ""}`.trim());
        notifications.show({
          title: "DNI Identificado",
          message: `${res.data.nombres} ${res.data.apellido_paterno} verificado en RENIEC`,
          color: "teal",
        });
      }
    } catch (err: any) {
      notifications.show({ title: "No encontrado", message: err.message, color: "orange" });
    } finally {
      setIsSearchingDoc(false);
    }
  };

  const handleSave = async () => {
    if (!documentNumber.trim() || !firstName.trim() || !lastName.trim() || !activeCompany) {
      notifications.show({ title: "Atención", message: "Complete los nombres y documento del trabajador", color: "orange" });
      return;
    }

    setIsSaving(true);
    try {
      await apiRequest("/employees", {
        method: "POST",
        body: JSON.stringify({
          company_id: activeCompany.id,
          document_type: documentType,
          document_number: documentNumber.trim(),
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          job_title: jobTitle,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          license_number: licenseNumber.trim() || undefined,
          commission_rate: commissionRate,
        }),
      });

      notifications.show({
        title: "Trabajador Registrado",
        message: `${firstName} ${lastName} fue guardado correctamente`,
        color: "teal",
      });
      setOpened(false);
      resetForm();
      loadEmployees();
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/employees/${employeeToDelete.id}`, { method: "DELETE" });
      notifications.show({
        title: "Trabajador Desactivado",
        message: `${employeeToDelete.full_name} fue desactivado lógicamente`,
        color: "teal",
      });
      setEmployeeToDelete(null);
      loadEmployees();
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setDocumentType("1");
    setDocumentNumber("");
    setFirstName("");
    setLastName("");
    setJobTitle("Vendedor");
    setEmail("");
    setPhone("");
    setLicenseNumber("");
    setCommissionRate(0.0);
  };

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      searchQuery === "" ||
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.document_number.includes(searchQuery);
    const matchesJob = !filterJob || emp.job_title === filterJob;
    return matchesSearch && matchesJob;
  });

  const sellersCount = employees.filter((e) => e.job_title.toLowerCase().includes("vendedor")).length;
  const driversCount = employees.filter((e) => e.job_title.toLowerCase().includes("chofer") || e.job_title.toLowerCase().includes("conductor")).length;

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2} style={{ color: "#0F172A", fontWeight: 700 }}>
            Trabajadores y Personal
          </Title>
          <Text size="sm" c="dimmed">
            Equipo de ventas, choferes y personal operativo • Empresa: <strong>{activeCompany?.trademark_name || activeCompany?.business_name}</strong>
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
          Nuevo Trabajador
        </Button>
      </Group>

      {/* Tarjetas de Resumen de Personal */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card withBorder padding="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed">
              TOTAL DE PERSONAL ACTIVO
            </Text>
            <Users size={20} color="#3B82F6" />
          </Group>
          <Text size="xl" fw={700} c="blue.9">
            {employees.length} Colaboradores
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Registrados en el sistema
          </Text>
        </Card>

        <Card withBorder padding="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed">
              FUERZA DE VENTAS (VENDEDORES)
            </Text>
            <Award size={20} color="#059669" />
          </Group>
          <Text size="xl" fw={700} c="green.9">
            {sellersCount} Vendedores
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Disponibles para asignación en facturas
          </Text>
        </Card>

        <Card withBorder padding="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed">
              CHOFERES Y TRANSPORTISTAS
            </Text>
            <Truck size={20} color="#D97706" />
          </Group>
          <Text size="xl" fw={700} c="orange.9">
            {driversCount} Choferes
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Con licencia MTC para Guías de Remisión
          </Text>
        </Card>
      </SimpleGrid>

      {/* Barra de Filtros */}
      <Paper withBorder p="md" radius="md" mb="lg" style={{ backgroundColor: "#FFFFFF" }}>
        <Group>
          <TextInput
            placeholder="Buscar por nombre o DNI..."
            leftSection={<Search size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filtrar por cargo"
            clearable
            data={[
              { value: "Vendedor", label: "Vendedores" },
              { value: "Conductor / Chofer", label: "Choferes / Conductores" },
              { value: "Cajero", label: "Cajeros" },
              { value: "Administrador", label: "Administradores" },
            ]}
            value={filterJob}
            onChange={setFilterJob}
            style={{ width: 220 }}
          />
        </Group>
      </Paper>

      {/* Tabla de Trabajadores */}
      <Paper withBorder radius="md" p="md" style={{ backgroundColor: "#FFFFFF" }}>
        {loading ? (
          <Center p="xl">
            <Loader color="indigo" />
          </Center>
        ) : filteredEmployees.length === 0 ? (
          <Center p="xl">
            <Text c="dimmed">No se encontraron trabajadores registrados</Text>
          </Center>
        ) : (
          <Table verticalSpacing="sm" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>DOCUMENTO</Table.Th>
                <Table.Th>NOMBRES COMPLETOS</Table.Th>
                <Table.Th>CARGO / FUNCIÓN</Table.Th>
                <Table.Th>DATOS DE CONTACTO</Table.Th>
                <Table.Th>LICENCIA MTC</Table.Th>
                <Table.Th>COMISIÓN</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>ACCIONES</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredEmployees.map((emp) => (
                <Table.Tr key={emp.id}>
                  <Table.Td>
                    <Badge variant="outline" color="gray" size="sm">
                      {emp.document_type === "1" ? "DNI" : "CE"}: {emp.document_number}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={600} size="sm" c="blue.9">
                      {emp.full_name}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      color={
                        emp.job_title.toLowerCase().includes("vendedor")
                          ? "green"
                          : emp.job_title.toLowerCase().includes("chofer")
                          ? "orange"
                          : "blue"
                      }
                      variant="light"
                      size="sm"
                    >
                      {emp.job_title}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs">{emp.phone || "Sin teléfono"}</Text>
                    {emp.email && (
                      <Text size="xs" c="dimmed">
                        {emp.email}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {emp.license_number ? (
                      <Badge color="violet" variant="outline" size="sm">
                        {emp.license_number}
                      </Badge>
                    ) : (
                      <Text size="xs" c="dimmed">
                        N/A
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={500}>
                      {Number(emp.commission_rate) > 0 ? `${emp.commission_rate}%` : "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Tooltip label="Desactivar trabajador">
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => setEmployeeToDelete(emp)}
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

      {/* Modal Crear Trabajador */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          <Group>
            <UserCheck size={20} color="#1E3A8A" />
            <Text fw={700} size="md">
              Registrar Nuevo Colaborador
            </Text>
          </Group>
        }
        size="lg"
        centered
      >
        <Box>
          <Group grow mb="sm">
            <Select
              label="Tipo Documento"
              data={[
                { value: "1", label: "DNI (Doc. Nacional de Identidad)" },
                { value: "4", label: "Carnet de Extranjería" },
              ]}
              value={documentType}
              onChange={(val) => setDocumentType(val || "1")}
              required
            />
            <TextInput
              label="Número de Documento"
              placeholder="Ej. 45892144"
              value={documentNumber}
              onChange={(e) => setDocumentNumber(e.currentTarget.value)}
              rightSection={
                documentType === "1" && (
                  <ActionIcon
                    variant="subtle"
                    color="blue"
                    loading={isSearchingDoc}
                    onClick={handleLookupDni}
                    title="Consultar RENIEC"
                  >
                    <Search size={16} />
                  </ActionIcon>
                )
              }
              required
            />
          </Group>

          <Group grow mb="sm">
            <TextInput
              label="Nombres"
              placeholder="Ej. Carlos Alberto"
              value={firstName}
              onChange={(e) => setFirstName(e.currentTarget.value)}
              required
            />
            <TextInput
              label="Apellidos"
              placeholder="Ej. Mendoza Vega"
              value={lastName}
              onChange={(e) => setLastName(e.currentTarget.value)}
              required
            />
          </Group>

          <Group grow mb="sm">
            <Select
              label="Cargo / Función"
              data={[
                { value: "Vendedor", label: "Vendedor / Asesor Comercial" },
                { value: "Conductor / Chofer", label: "Conductor / Chofer de Transporte" },
                { value: "Cajero", label: "Cajero / Punto de Venta" },
                { value: "Administrador", label: "Administrador / Operaciones" },
                { value: "Operario", label: "Operario / Almacenero" },
              ]}
              value={jobTitle}
              onChange={(val) => setJobTitle(val || "Vendedor")}
              required
            />
            <NumberInput
              label="Comisión de Venta (%)"
              placeholder="0.00"
              decimalScale={2}
              min={0}
              max={100}
              value={commissionRate}
              onChange={(val) => setCommissionRate(Number(val) || 0)}
            />
          </Group>

          {jobTitle.toLowerCase().includes("chofer") && (
            <TextInput
              label="Número de Licencia de Conducir (MTC)"
              placeholder="Ej. Q45892144 (Requerido para Guías de Remisión)"
              value={licenseNumber}
              onChange={(e) => setLicenseNumber(e.currentTarget.value)}
              mb="sm"
            />
          )}

          <Group grow mb="lg">
            <TextInput
              label="Teléfono Celular"
              placeholder="Ej. 987654321"
              value={phone}
              onChange={(e) => setPhone(e.currentTarget.value)}
            />
            <TextInput
              label="Correo Electrónico"
              placeholder="carlos@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
          </Group>

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
              Guardar Trabajador
            </Button>
          </Group>
        </Box>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal
        opened={!!employeeToDelete}
        onClose={() => setEmployeeToDelete(null)}
        title="Confirmar Desactivación"
        centered
      >
        <Text size="sm" mb="lg">
          ¿Está seguro de que desea desactivar al trabajador{" "}
          <strong>{employeeToDelete?.full_name}</strong>? Sus registros históricos en
          comprobantes anteriores se mantendrán intactos.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setEmployeeToDelete(null)}>
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
