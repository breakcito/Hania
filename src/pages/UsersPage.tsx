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
  Modal,
  Badge,
  Loader,
  Center,
  Box,
  ActionIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { UserPlus, Trash2 } from "lucide-react";
import { apiRequest } from "../api/client";
import { useAuth } from "../context/AuthContext";

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const [opened, setOpened] = useState(false);
  const [userToDelete, setUserToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

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
        }),
      });
      notifications.show({ title: "Usuario Creado", message: `Usuario ${username} registrado correctamente`, color: "teal" });
      setOpened(false);
      setUsername("");
      setPassword("");
      setFullName("");
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
        message: `El usuario ${userToDelete.username} fue desactivado lógicamente (se preserva la autoría de sus documentos)`,
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

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2} style={{ color: "#0F172A", fontWeight: 700 }}>
            Usuarios del Sistema
          </Title>
          <Text size="sm" c="dimmed">
            Cuentas con acceso para emitir y consultar comprobantes de la empresa
          </Text>
        </div>

        <Button
          leftSection={<UserPlus size={16} />}
          color="amber"
          style={{ backgroundColor: "#D97706" }}
          onClick={() => setOpened(true)}
        >
          Crear Nueva Cuenta
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
                <Table.Th>ID</Table.Th>
                <Table.Th>Nombre de Usuario</Table.Th>
                <Table.Th>Nombre / Rol</Table.Th>
                <Table.Th>Estado</Table.Th>
                <Table.Th>Fecha Creación</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Acción</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {users.map((u) => {
                const isSuperAdmin = u.username === "admin";
                const isSelf = currentUser?.id === u.id;
                const canDeactivate = u.is_active && !isSuperAdmin && !isSelf;

                return (
                  <Table.Tr key={u.id}>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        #{u.id}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm" fw={700}>
                        {u.username}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{u.full_name || "-"}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge color={u.is_active ? "teal" : "red"} size="sm">
                        {u.is_active ? "Activo" : "Inactivo"}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Text size="xs" c="dimmed">
                        {new Date(u.created_at).toLocaleDateString("es-PE")}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      {canDeactivate && (
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          title="Desactivar cuenta (eliminación lógica)"
                          onClick={() => setUserToDelete(u)}
                        >
                          <Trash2 size={16} />
                        </ActionIcon>
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
      <Modal opened={opened} onClose={() => setOpened(false)} title="Registrar Nueva Cuenta de Usuario" centered size="md">
        <Box p="xs">
          <Text size="xs" c="dimmed" mb="md">
            Solo se requiere nombre de usuario y contraseña para dar acceso a un colaborador del negocio.
          </Text>

          <TextInput
            label="Nombre de Usuario (Para iniciar sesión)"
            placeholder="Ej. operador1, contador, supervisor"
            value={username}
            onChange={(e) => setUsername(e.currentTarget.value)}
            mb="xs"
            required
          />

          <PasswordInput
            label="Contraseña"
            placeholder="Ingrese una contraseña segura"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            mb="xs"
            required
          />

          <TextInput
            label="Nombre Completo / Cargo (Opcional)"
            placeholder="Ej. Juan Pérez - Operador de Balanza"
            value={fullName}
            onChange={(e) => setFullName(e.currentTarget.value)}
            mb="md"
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setOpened(false)}>
              Cancelar
            </Button>
            <Button color="amber" loading={isSaving} onClick={handleCreate} style={{ backgroundColor: "#D97706" }}>
              Guardar Usuario
            </Button>
          </Group>
        </Box>
      </Modal>

      {/* Modal Confirmación de Eliminación Lógica */}
      <Modal
        opened={!!userToDelete}
        onClose={() => setUserToDelete(null)}
        title="Confirmar Desactivación de Cuenta"
        centered
        size="sm"
      >
        <Box p="xs">
          <Text size="sm" mb="sm">
            ¿Está seguro de desactivar la cuenta de <b>{userToDelete?.username}</b>?
          </Text>
          <Text size="xs" c="dimmed" mb="lg">
            El usuario no podrá volver a iniciar sesión, pero la autoría de todos los comprobantes y guías que haya generado permanecerá intacta en el sistema para auditoría contable.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setUserToDelete(null)}>
              Cancelar
            </Button>
            <Button color="red" loading={isDeleting} onClick={handleConfirmDelete}>
              Desactivar Cuenta
            </Button>
          </Group>
        </Box>
      </Modal>
    </Box>
  );
};
