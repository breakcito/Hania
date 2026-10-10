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
  Modal,
  Badge,
  Loader,
  Center,
  Box,
  ActionIcon,
  Card,
  SimpleGrid,
  Tooltip,
  Switch,
  Checkbox,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  Plus,
  Trash2,
  Users,
  Search,
  Truck,
  UserCheck,
  ShieldCheck,
  KeyRound,
  CheckCheck,
  X,
  Edit2,
} from "lucide-react";
import { apiRequest } from "../api/client";

// Módulos disponibles para control de accesos del sistema
export const AVAILABLE_MODULES = [
  {
    key: "dashboard",
    label: "Dashboard y Métricas",
    description: "Vista de KPIs y gráficos",
  },
  {
    key: "issue_doc",
    label: "Emitir Factura / Boleta",
    description: "Emisión de comprobantes de pago",
  },
  {
    key: "documents",
    label: "Historial de Comprobantes",
    description: "Listado, PDF, XML y CDR",
  },
  {
    key: "notes",
    label: "Notas de Crédito / Débito",
    description: "Emisión y anulación tributaria",
  },
  {
    key: "despatches",
    label: "Guías de Remisión (GRE)",
    description: "Traslado de mercancías",
  },
  {
    key: "reports",
    label: "Centro de Reportes Excel",
    description: "Reportes oficiales de ventas",
  },
  {
    key: "clients",
    label: "Clientes Frecuentes",
    description: "Directorio de compradores",
  },
  {
    key: "products",
    label: "Catálogo de Productos",
    description: "Bienes y servicios",
  },
  {
    key: "banks",
    label: "Cuentas Bancarias",
    description: "Cuentas corrientes y detracciones",
  },
  {
    key: "series",
    label: "Series y Correlativos",
    description: "Configuración de numeración",
  },
  {
    key: "employees",
    label: "Trabajadores y Accesos",
    description: "Personal y permisos del sistema",
  },
  {
    key: "vehicles",
    label: "Vehículos y Flota",
    description: "Registro de transporte y MTC",
  },
  {
    key: "companies",
    label: "Gestión de Empresas",
    description: "Datos fiscales y multiempresa",
  },
];

export const ROLE_PRESETS = [
  {
    value: "ADMIN",
    label: "Administrador",
    description: "Acceso a todos los módulos",
    modules: AVAILABLE_MODULES.map((m) => m.key),
  },
  {
    value: "CONTADOR",
    label: "Contabilidad",
    description: "Dashboard, comprobantes, guías y centro de reportes",
    modules: [
      "dashboard",
      "documents",
      "notes",
      "despatches",
      "reports",
      "clients",
      "products",
      "issue_doc",
    ],
  },
  {
    value: "LOGISTICA",
    label: "Logística",
    description: "Guías de Remisión (GRE), vehículos, productos y clientes",
    modules: ["despatches", "vehicles", "products", "clients"],
  },
  {
    value: "CUSTOM",
    label: "Personalizado",
    description: "Configuración manual",
    modules: [],
  },
];

export const EmployeesPage: React.FC = () => {
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Crear / Editar
  const [opened, setOpened] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<any | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State Básico (sin cargo rígido ni comisión)
  const [documentType, setDocumentType] = useState("1");
  const [documentNumber, setDocumentNumber] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [isSearchingDoc, setIsSearchingDoc] = useState(false);

  // Cuenta de Usuario y Permisos
  const [createSystemAccess, setCreateSystemAccess] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedPreset, setSelectedPreset] = useState("ADMIN");
  const [selectedModules, setSelectedModules] = useState<string[]>(
    AVAILABLE_MODULES.map((m) => m.key),
  );

  const loadEmployees = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/employees");
      setEmployees(data);
    } catch (err) {
      console.error("Error loading employees:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  // Manejo de cambio de preset de roles
  const handlePresetChange = (presetVal: string | null) => {
    const val = presetVal || "CUSTOM";
    setSelectedPreset(val);
    const found = ROLE_PRESETS.find((p) => p.value === val);
    if (found && val !== "CUSTOM") {
      setSelectedModules(found.modules);
    }
  };

  // Manejo de cambio individual de módulo
  const handleToggleModule = (key: string, checked: boolean) => {
    let updated: string[];
    if (checked) {
      updated = [...selectedModules, key];
    } else {
      updated = selectedModules.filter((m) => m !== key);
    }
    setSelectedModules(updated);

    // Evaluar si coincide exactamente con algún preset
    const match = ROLE_PRESETS.find(
      (p) =>
        p.value !== "CUSTOM" &&
        p.modules.length === updated.length &&
        p.modules.every((m) => updated.includes(m)),
    );
    setSelectedPreset(match ? match.value : "CUSTOM");
  };

  // Seleccionar todos los módulos
  const handleSelectAllModules = () => {
    const allKeys = AVAILABLE_MODULES.map((m) => m.key);
    setSelectedModules(allKeys);
    setSelectedPreset("ADMIN");
  };

  // Limpiar todos los módulos
  const handleClearAllModules = () => {
    setSelectedModules([]);
    setSelectedPreset("CUSTOM");
  };

  // Consulta automática DNI ante RENIEC
  const handleLookupDni = async () => {
    if (!documentNumber.trim() || documentType !== "1") return;
    setIsSearchingDoc(true);
    try {
      const res = await apiRequest(`/services/dni/${documentNumber.trim()}`);
      if (res.data) {
        setFirstName(res.data.nombres || "");
        setLastName(
          `${res.data.apellido_paterno || ""} ${res.data.apellido_materno || ""}`.trim(),
        );
        if (!username) {
          const cleanName = (res.data.nombres || "")
            .split(" ")[0]
            .toLowerCase();
          const cleanLast = (res.data.apellido_paterno || "").toLowerCase();
          setUsername(`${cleanName.slice(0, 1)}${cleanLast}`);
        }
        notifications.show({
          title: "DNI Identificado",
          message: `${res.data.nombres} ${res.data.apellido_paterno} verificado en RENIEC`,
          color: "teal",
        });
      }
    } catch (err: any) {
      notifications.show({
        title: "No encontrado",
        message: err.message,
        color: "orange",
      });
    } finally {
      setIsSearchingDoc(false);
    }
  };

  const handleOpenCreate = () => {
    resetForm();
    setEditingEmployee(null);
    setOpened(true);
  };

  const handleOpenEdit = (emp: any) => {
    setEditingEmployee(emp);
    setDocumentType(emp.document_type || "1");
    setDocumentNumber(emp.document_number || "");
    setFirstName(emp.first_name || "");
    setLastName(emp.last_name || "");
    setEmail(emp.email || "");
    setPhone(emp.phone || "");
    setLicenseNumber(emp.license_number || "");

    const hasAcc = !!emp.has_account;
    setCreateSystemAccess(hasAcc);
    setUsername(emp.username || "");
    setPassword("");

    const currentPerms = Array.isArray(emp.permissions)
      ? emp.permissions
      : AVAILABLE_MODULES.map((m) => m.key);
    setSelectedModules(currentPerms);

    const match = ROLE_PRESETS.find(
      (p) =>
        p.value !== "CUSTOM" &&
        p.modules.length === currentPerms.length &&
        p.modules.every((m: string) => currentPerms.includes(m)),
    );
    setSelectedPreset(emp.system_role || (match ? match.value : "CUSTOM"));
    setOpened(true);
  };

  const handleSave = async () => {
    if (
      !documentNumber.trim() ||
      !firstName.trim() ||
      !lastName.trim()
    ) {
      notifications.show({
        title: "Atención",
        message: "Complete los nombres y el documento de identidad",
        color: "orange",
      });
      return;
    }

    if (
      createSystemAccess &&
      !editingEmployee &&
      (!username.trim() || !password)
    ) {
      notifications.show({
        title: "Atención",
        message: "Ingrese un nombre de usuario y contraseña para la cuenta",
        color: "orange",
      });
      return;
    }

    setIsSaving(true);
    try {
      const payload: any = {
        document_type: documentType,
        document_number: documentNumber.trim(),
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        license_number: licenseNumber.trim() || undefined,
        create_system_access: createSystemAccess,
        username: createSystemAccess ? username.trim() : undefined,
        password: createSystemAccess && password ? password : undefined,
        system_role: createSystemAccess ? selectedPreset : undefined,
        permissions: createSystemAccess ? selectedModules : undefined,
      };

      if (editingEmployee) {
        await apiRequest(`/employees/${editingEmployee.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        notifications.show({
          title: "Trabajador Actualizado",
          message: `${firstName} ${lastName} fue actualizado correctamente`,
          color: "teal",
        });
      } else {
        await apiRequest("/employees", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        notifications.show({
          title: "Trabajador Registrado",
          message: `${firstName} ${lastName} fue guardado correctamente`,
          color: "teal",
        });
      }

      setOpened(false);
      resetForm();
      loadEmployees();
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message,
        color: "red",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!employeeToDelete) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/employees/${employeeToDelete.id}`, {
        method: "DELETE",
      });
      notifications.show({
        title: "Trabajador Desactivado",
        message: `${employeeToDelete.full_name} fue desactivado lógicamente`,
        color: "teal",
      });
      setEmployeeToDelete(null);
      loadEmployees();
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message,
        color: "red",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setDocumentType("1");
    setDocumentNumber("");
    setFirstName("");
    setLastName("");
    setEmail("");
    setPhone("");
    setLicenseNumber("");
    setCreateSystemAccess(false);
    setUsername("");
    setPassword("");
    setSelectedPreset("ADMIN");
    setSelectedModules(AVAILABLE_MODULES.map((m) => m.key));
  };

  const filteredEmployees = employees.filter((emp) => {
    return (
      searchQuery === "" ||
      emp.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.document_number.includes(searchQuery)
    );
  });

  const activeAccountsCount = employees.filter((e) => e.has_account).length;
  const driversCount = employees.filter((e) => !!e.license_number).length;

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2} style={{ color: "#0F172A", fontWeight: 700 }}>
            Trabajadores y Accesos
          </Title>
          <Text size="sm" c="dimmed">
            Directorio corporativo de personal compartido entre todas las empresas y control de accesos al sistema
          </Text>
        </div>
        <Button
          leftSection={<Plus size={16} />}
          color="indigo"
          style={{ backgroundColor: "#1E3A8A" }}
          onClick={handleOpenCreate}
        >
          Nuevo Trabajador
        </Button>
      </Group>

      {/* Tarjetas de Resumen */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card
          withBorder
          padding="md"
          radius="md"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed">
              TOTAL DE PERSONAL
            </Text>
            <Users size={20} color="#3B82F6" />
          </Group>
          <Text size="xl" fw={700} c="blue.9">
            {employees.length} Colaboradores
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Registrados en la empresa
          </Text>
        </Card>

        <Card
          withBorder
          padding="md"
          radius="md"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed">
              CON ACCESO AL SISTEMA
            </Text>
            <ShieldCheck size={20} color="#059669" />
          </Group>
          <Text size="xl" fw={700} c="green.9">
            {activeAccountsCount} Usuarios Habilitados
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Con credenciales y permisos configurados
          </Text>
        </Card>

        <Card
          withBorder
          padding="md"
          radius="md"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed">
              CONDUCTORES / LICENCIA MTC
            </Text>
            <Truck size={20} color="#D97706" />
          </Group>
          <Text size="xl" fw={700} c="orange.9">
            {driversCount} Choferes
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Disponibles para Guías de Remisión
          </Text>
        </Card>
      </SimpleGrid>

      {/* Buscador Simple */}
      <Paper
        withBorder
        p="md"
        radius="md"
        mb="lg"
        style={{ backgroundColor: "#FFFFFF" }}
      >
        <TextInput
          placeholder="Buscar trabajador por nombre o número de documento..."
          leftSection={<Search size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />
      </Paper>

      {/* Tabla de Trabajadores */}
      <Paper
        withBorder
        radius="md"
        p="md"
        style={{ backgroundColor: "#FFFFFF" }}
      >
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
                <Table.Th>DATOS DE CONTACTO</Table.Th>
                <Table.Th>LICENCIA MTC</Table.Th>
                <Table.Th>ACCESO AL SISTEMA / PERMISOS</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>ACCIONES</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredEmployees.map((emp) => (
                <Table.Tr key={emp.id}>
                  <Table.Td>
                    <Badge variant="outline" color="gray" size="sm">
                      {emp.document_type === "1" ? "DNI" : "CE"}:{" "}
                      {emp.document_number}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={600} size="sm" c="blue.9">
                      {emp.full_name}
                    </Text>
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
                        -
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {emp.has_account ? (
                      <Group gap="xs">
                        <Badge color="teal" variant="light" size="sm">
                          @{emp.username}
                        </Badge>
                        <Badge color="indigo" variant="outline" size="sm">
                          {ROLE_PRESETS.find((p) => p.value === emp.system_role)
                            ?.label ||
                            emp.system_role ||
                            "Personalizado"}
                        </Badge>
                        {Array.isArray(emp.permissions) && (
                          <Badge color="gray" variant="dot" size="xs">
                            {emp.permissions.length} módulos
                          </Badge>
                        )}
                      </Group>
                    ) : (
                      <Badge color="gray" variant="dot" size="sm">
                        Sin acceso
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Group gap="xs" justify="flex-end">
                      <Tooltip label="Editar datos y accesos">
                        <ActionIcon
                          color="indigo"
                          variant="subtle"
                          onClick={() => handleOpenEdit(emp)}
                        >
                          <Edit2 size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Desactivar trabajador">
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => setEmployeeToDelete(emp)}
                        >
                          <Trash2 size={16} />
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

      {/* Modal Registrar / Editar Trabajador */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          <Group>
            <UserCheck size={20} color="#1E3A8A" />
            <Text fw={700} size="md">
              {editingEmployee
                ? "Editar Trabajador y Accesos"
                : "Registrar Nuevo Trabajador"}
            </Text>
          </Group>
        }
        size="lg"
        centered
      >
        <Box>
          {/* Identificación */}
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
            <TextInput
              label="Teléfono Celular (Opcional)"
              placeholder="Ej. 987654321"
              value={phone}
              onChange={(e) => setPhone(e.currentTarget.value)}
            />
            <TextInput
              label="Correo Electrónico (Opcional)"
              placeholder="carlos@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
          </Group>

          <TextInput
            label="Licencia de Conducir MTC (Opcional)"
            placeholder="Ej. Q45892144 (Para Guías de Remisión)"
            value={licenseNumber}
            onChange={(e) => setLicenseNumber(e.currentTarget.value)}
            mb="md"
          />

          {/* Sección de Cuenta de Acceso y Permisos */}
          <Paper
            withBorder
            p="md"
            radius="md"
            mb="md"
            style={{ backgroundColor: "#F8FAFC" }}
          >
            <Switch
              label="¿Habilitar cuenta de acceso al sistema para este trabajador?"
              checked={createSystemAccess}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                setCreateSystemAccess(e.currentTarget.checked)
              }
              mb={createSystemAccess ? "sm" : 0}
              color="orange"
            />

            {createSystemAccess && (
              <Box mt="sm">
                <Group grow mb="sm">
                  <TextInput
                    label="Usuario de Acceso"
                    placeholder="Ej. cmendoza"
                    value={username}
                    onChange={(e) => setUsername(e.currentTarget.value)}
                    leftSection={<KeyRound size={16} />}
                    required
                  />
                  <TextInput
                    label={
                      editingEmployee
                        ? "Nueva Contraseña (dejar en blanco para conservar)"
                        : "Contraseña"
                    }
                    placeholder="••••••••"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.currentTarget.value)}
                    required={!editingEmployee}
                  />
                </Group>

                <Divider
                  my="sm"
                  label="Perfil y Selección de Módulos"
                  labelPosition="center"
                />

                {/* Selector de Presets */}
                <Select
                  label="Permisos"
                  description="Selecciona un perfil rápido o personaliza los módulos abajo"
                  data={ROLE_PRESETS.map((p) => ({
                    value: p.value,
                    label: `${p.label} - ${p.description}`,
                  }))}
                  value={selectedPreset}
                  onChange={handlePresetChange}
                  mb="sm"
                />

                {/* Acciones de selección rápida */}
                <Group justify="space-between" mb="xs">
                  <Text size="xs" fw={700} c="dimmed">
                    MÓDULOS CON ACCESO PERMITIDO ({selectedModules.length} de{" "}
                    {AVAILABLE_MODULES.length})
                  </Text>
                  <Group gap="xs">
                    <Button
                      size="compact-xs"
                      variant="subtle"
                      leftSection={<CheckCheck size={14} />}
                      onClick={handleSelectAllModules}
                    >
                      Todos
                    </Button>
                    <Button
                      size="compact-xs"
                      variant="subtle"
                      color="gray"
                      leftSection={<X size={14} />}
                      onClick={handleClearAllModules}
                    >
                      Ninguno
                    </Button>
                  </Group>
                </Group>

                {/* Cuadrícula de checkboxes de módulos */}
                <Paper
                  withBorder
                  p="sm"
                  radius="sm"
                  style={{ backgroundColor: "#FFFFFF" }}
                >
                  <SimpleGrid cols={{ base: 1, sm: 2 }} spacing="xs">
                    {AVAILABLE_MODULES.map((mod) => {
                      const isChecked = selectedModules.includes(mod.key);
                      return (
                        <Checkbox
                          key={mod.key}
                          label={
                            <div>
                              <Text size="xs" fw={isChecked ? 600 : 400}>
                                {mod.label}
                              </Text>
                              <Text size="xs" c="dimmed">
                                {mod.description}
                              </Text>
                            </div>
                          }
                          checked={isChecked}
                          onChange={(e) =>
                            handleToggleModule(mod.key, e.currentTarget.checked)
                          }
                          color="indigo"
                        />
                      );
                    })}
                  </SimpleGrid>
                </Paper>
              </Box>
            )}
          </Paper>

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
              {editingEmployee ? "Guardar Cambios" : "Registrar Trabajador"}
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
          ¿Está seguro de desactivar al colaborador{" "}
          <strong>{employeeToDelete?.full_name}</strong>? Se conservarán sus
          registros históricos en comprobantes y guías.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setEmployeeToDelete(null)}>
            Cancelar
          </Button>
          <Button
            color="red"
            loading={isDeleting}
            onClick={handleConfirmDelete}
          >
            Desactivar
          </Button>
        </Group>
      </Modal>
    </Box>
  );
};
