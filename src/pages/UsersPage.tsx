import React, { useEffect, useState } from "react";
import {
  Paper,
  Title,
  Text,
  Group,
  Table,
  Button,
  TextInput,
  PasswordInput,
  Select,
  Modal,
  Badge,
  Loader,
  Center,
  Box,
  ActionIcon,
  SimpleGrid,
  Card,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { UserPlus, Trash2, Shield, UserCheck, Key, Lock } from "lucide-react";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { useApp } from "../context/AppContext";

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { companies } = useApp();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [opened, setOpened] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [role, setRole] = useState("FACTURADOR");
  const [defaultCompanyId, setDefaultCompanyId] = useState<string | null>(null);
  const [assignedSeries, setAssignedSeries] = useState("F001");

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest("/auth/users");
      setUsers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const handleCreate = async () => {
    if (!username.trim() || !password.trim()) {
      notifications.show({ title: "Atención", message: "Usuario y contraseña son requeridos", color: "orange" });
      return;
    }

    setIsSaving(true);
    try {
      await apiRequest("/auth/users", {
        method: "POST",
        body: JSON.stringify({
          username: username.trim(),
          password: password,
          full_name: fullName.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          role: role,
          default_company_id: defaultCompanyId ? Number(defaultCompanyId) : undefined,
          assigned_series: assignedSeries.trim() || undefined,
        }),
      });
      notifications.show({ title: "Usuario Creado", message: `Usuario ${username} registrado correctamente`, color: "teal" });
      setOpened(false);
      resetForm();
      loadUsers();
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/auth/users/${userToDelete.id}`, { method: "DELETE" });
      notifications.show({
        title: "Cuenta Desactivada",
        message: `El usuario ${userToDelete.username} fue desactivado lógicamente`,
        color: "teal",
      });
      setUserToDelete(null);
      loadUsers();
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setUsername("");
    setPassword("");
    setFullName("");
    setEmail("");
    setPhone("");
    setRole("FACTURADOR");
    setDefaultCompanyId(null);
    setAssignedSeries("F001");
  };

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2} style={{ color: "#0F172A", fontWeight: 700 }}>
            Usuarios y Permisos del Sistema
          </Title>
          <Text size="sm" c="dimmed">
            Cuentas de acceso, roles operativos y asignación de series para facturación
          </Text>
        </div>
        <Button
          leftSection={<UserPlus size={16} />}
          color="indigo"
          style={{ backgroundColor: "#1E3A8A" }}
          onClick={() => {
            resetForm();
            setOpened(true);
          }}
        >
          Nuevo Usuario
        </Button>
      </Group>

      {/* Tarjetas de Resumen de Roles */}
      <SimpleGrid cols={{ base: 1, sm: 4 }} mb="xl">
        <Card withBorder padding="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed">
              ADMINISTRADORES
            </Text>
            <Shield size={20} color="#7C3AED" />
          </Group>
          <Text size="xl" fw={700} c="violet.9">
            {users.filter((u) => u.role === "ADMIN").length} Cuentas
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Acceso total al sistema
          </Text>
        </Card>

        <Card withBorder padding="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed">
              FACTURADORES
            </Text>
            <UserCheck size={20} color="#2563EB" />
          </Group>
          <Text size="xl" fw={700} c="blue.9">
            {users.filter((u) => u.role === "FACTURADOR").length} Cuentas
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Emisión de comprobantes y guías
          </Text>
        </Card>

        <Card withBorder padding="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed">
              VENDEDORES / POS
            </Text>
            <Key size={20} color="#059669" />
          </Group>
          <Text size="xl" fw={700} c="green.9">
            {users.filter((u) => u.role === "VENDEDOR").length} Cuentas
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Caja y ventas de mostrador
          </Text>
        </Card>

        <Card withBorder padding="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed">
              CONTADORES
            </Text>
            <Lock size={20} color="#D97706" />
          </Group>
          <Text size="xl" fw={700} c="orange.9">
            {users.filter((u) => u.role === "CONTADOR").length} Cuentas
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Descarga de reportes contables
          </Text>
        </Card>
      </SimpleGrid>

      {/* Tabla de Usuarios */}
      <Paper withBorder radius="md" p="md" style={{ backgroundColor: "#FFFFFF" }}>
        {loading ? (
          <Center p="xl">
            <Loader color="indigo" />
          </Center>
        ) : (
          <Table verticalSpacing="sm" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>USUARIO</Table.Th>
                <Table.Th>NOMBRE COMPLETO</Table.Th>
                <Table.Th>ROL</Table.Th>
                <Table.Th>SERIE ASIGNADA</Table.Th>
                <Table.Th>CONTACTO</Table.Th>
                <Table.Th>ESTADO</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>ACCIONES</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.map((u) => {
                const isCurrent = currentUser?.id === u.id;
                return (
                  <Table.Tr key={u.id}>
                    <Table.Td>
                      <Group gap="xs">
                        <Text fw={700} size="sm" c="blue.9">
                          {u.username}
                        </Text>
                        {isCurrent && (
                          <Badge color="blue" size="xs" variant="filled">
                            Tú
                          </Badge>
                        )}
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{u.full_name || "-"}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge
                        color={
                          u.role === "ADMIN"
                            ? "violet"
                            : u.role === "FACTURADOR"
                            ? "blue"
                            : u.role === "VENDEDOR"
                            ? "green"
                            : "orange"
                        }
                        variant="light"
                        size="sm"
                      >
                        {u.role || "ADMIN"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {u.assigned_series ? (
                        <Badge color="gray" variant="outline" size="sm" style={{ fontFamily: "monospace" }}>
                          {u.assigned_series}
                        </Badge>
                      ) : (
                        <Text size="xs" c="dimmed">
                          Auto
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {u.email && <Text size="xs">{u.email}</Text>}
                      {u.phone && (
                        <Text size="xs" c="dimmed">
                          {u.phone}
                        </Text>
                      )}
                      {!u.email && !u.phone && (
                        <Text size="xs" c="dimmed">
                          -
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge color={u.is_active ? "green" : "red"} size="sm" variant="dot">
                        {u.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      {!isCurrent && u.username !== "admin" && (
                        <Tooltip label="Desactivar usuario">
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => setUserToDelete(u)}
                          >
                            <Trash2 size={16} />
                          </ActionIcon>
                        </Tooltip>
                      )}
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* Modal Crear Usuario */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          <Group>
            <UserPlus size={20} color="#1E3A8A" />
            <Text fw={700} size="md">
              Crear Nuevo Usuario de Acceso
            </Text>
          </Group>
        }
        size="md"
        centered
      >
        <Box>
          <Group grow mb="sm">
            <TextInput
              label="Nombre de Usuario (Login)"
              placeholder="Ej. c.mendoza"
              value={username}
              onChange={(e) => setUsername(e.currentTarget.value)}
              required
            />
            <PasswordInput
              label="Contraseña Temporal"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              required
            />
          </Group>

          <TextInput
            label="Nombre Completo"
            placeholder="Ej. Carlos Alberto Mendoza"
            value={fullName}
            onChange={(e) => setFullName(e.currentTarget.value)}
            mb="sm"
          />

          <Group grow mb="sm">
            <Select
              label="Rol / Nivel de Acceso"
              data={[
                { value: "ADMIN", label: "Administrador (Control Total)" },
                { value: "FACTURADOR", label: "Facturador (Emisión y Guías)" },
                { value: "VENDEDOR", label: "Vendedor / POS (Caja)" },
                { value: "CONTADOR", label: "Contador (Reportes y RVIE)" },
              ]}
              value={role}
              onChange={(val) => setRole(val || "FACTURADOR")}
              required
            />
            <TextInput
              label="Serie Predeterminada"
              placeholder="Ej. F001, B001"
              value={assignedSeries}
              onChange={(e) => setAssignedSeries(e.currentTarget.value.toUpperCase())}
            />
          </Group>

          <Group grow mb="sm">
            <Select
              label="Empresa Predeterminada (Opcional)"
              placeholder="Cualquiera"
              clearable
              data={companies.map((c) => ({
                value: String(c.id),
                label: c.trademark_name || c.business_name,
              }))}
              value={defaultCompanyId}
              onChange={setDefaultCompanyId}
            />
            <TextInput
              label="Teléfono Móvil"
              placeholder="Ej. 987654321"
              value={phone}
              onChange={(e) => setPhone(e.currentTarget.value)}
            />
          </Group>

          <TextInput
            label="Correo Electrónico"
            placeholder="carlos@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
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
              onClick={handleCreate}
            >
              Crear Usuario
            </Button>
          </Group>
        </Box>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal
        opened={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Confirmar Desactivación"
        centered
      >
        <Text size="sm" mb="lg">
          ¿Está seguro de que desea desactivar al usuario{" "}
          <strong>{userToDelete?.username}</strong>? La auditoría de documentos
          emitidos por este usuario se mantendrá intacta.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setUserToDelete(null)}>
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
