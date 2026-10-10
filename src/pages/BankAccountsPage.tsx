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
  Switch,
  ActionIcon,
  Tooltip,
  Card,
  SimpleGrid,
  Loader,
  Center,
  Box,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  Landmark,
  Plus,
  Trash2,
  ShieldCheck,
  Building,
  Edit,
} from "lucide-react";
import { apiRequest } from "../api/client";
import { useApp } from "../context/AppContext";

export const BankAccountsPage: React.FC = () => {
  const { activeCompany } = useApp();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [banks, setBanks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal Crear / Editar Cuenta
  const [modalOpened, setModalOpened] = useState(false);
  const [editingAccount, setEditingAccount] = useState<any | null>(null);
  const [bankId, setBankId] = useState<string | null>(null);
  const [accountType, setAccountType] = useState<string>("corriente");
  const [currency, setCurrency] = useState<string>("PEN");
  const [accountNumber, setAccountNumber] = useState("");
  const [cciNumber, setCciNumber] = useState("");
  const [alias, setAlias] = useState("");
  const [isDetraction, setIsDetraction] = useState(false);
  const [isDefault, setIsDefault] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedBank = banks.find((b) => b.id.toString() === bankId);
  const canBeDetraction = Boolean((selectedBank?.is_national || selectedBank?.code === "BN") && currency === "PEN");

  const loadData = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const [accsData, banksData] = await Promise.all([
        apiRequest(`/bank-accounts?company_id=${activeCompany.id}`),
        apiRequest("/banks"),
      ]);
      setAccounts(accsData || []);
      setBanks(banksData || []);
    } catch (err: any) {
      notifications.show({
        title: "Error al cargar",
        message: err.message || "No se pudieron obtener las cuentas bancarias",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeCompany]);

  const handleOpenCreate = () => {
    resetForm();
    setEditingAccount(null);
    setModalOpened(true);
  };

  const handleOpenEdit = (acc: any) => {
    setEditingAccount(acc);
    setBankId(acc.bank_id.toString());
    setAccountType(acc.account_type);
    setCurrency(acc.currency);
    setAccountNumber(acc.account_number);
    setCciNumber(acc.cci_number || "");
    setAlias(acc.alias || "");
    setIsDetraction(acc.is_detraction);
    setIsDefault(acc.is_default);
    setModalOpened(true);
  };

  const handleSaveAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCompany || !bankId || !accountNumber.trim()) {
      notifications.show({
        title: "Campos requeridos",
        message: "Seleccione un banco e ingrese el número de cuenta",
        color: "orange",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        company_id: activeCompany.id,
        bank_id: Number(bankId),
        account_type: isDetraction ? "detraccion" : accountType,
        currency: currency,
        account_number: accountNumber.trim(),
        cci_number: cciNumber.trim() || null,
        alias: alias.trim() || null,
        is_detraction: isDetraction,
        is_default: isDefault,
      };

      if (editingAccount) {
        await apiRequest(`/bank-accounts/${editingAccount.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        notifications.show({
          title: "Cuenta Actualizada",
          message: "Los datos de la cuenta bancaria fueron modificados",
          color: "teal",
        });
      } else {
        await apiRequest("/bank-accounts", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        notifications.show({
          title: "Cuenta Registrada",
          message: "La cuenta bancaria fue guardada exitosamente",
          color: "teal",
        });
      }

      setModalOpened(false);
      resetForm();
      loadData();
    } catch (err: any) {
      notifications.show({
        title: "Error al guardar",
        message: err.message,
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteAccount = async (id: number) => {
    if (!window.confirm("¿Seguro que deseas eliminar esta cuenta bancaria?")) return;
    try {
      await apiRequest(`/bank-accounts/${id}`, { method: "DELETE" });
      notifications.show({
        title: "Cuenta Eliminada",
        message: "La cuenta bancaria ha sido retirada",
        color: "teal",
      });
      loadData();
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    }
  };

  const resetForm = () => {
    setEditingAccount(null);
    setBankId(null);
    setAccountType("corriente");
    setCurrency("PEN");
    setAccountNumber("");
    setCciNumber("");
    setAlias("");
    setIsDetraction(false);
    setIsDefault(false);
  };

  const detractionAccount = accounts.find((a) => a.account_type === "detraccion");

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2} style={{ color: "#0F172A", fontWeight: 700 }}>
            Cuentas Bancarias Empresariales
          </Title>
          <Text size="sm" c="dimmed">
            Administración de cuentas corrientes, de ahorros y detracciones para{" "}
            <strong>{activeCompany?.business_name}</strong>
          </Text>
        </div>

        <Button
          leftSection={<Plus size={16} />}
          color="indigo"
          style={{ backgroundColor: "#1E3A8A" }}
          onClick={handleOpenCreate}
        >
          Nueva Cuenta Bancaria
        </Button>
      </Group>

      {/* Tarjeta Destacada de Cuenta de Detracción SUNAT */}
      <SimpleGrid cols={{ base: 1, md: 3 }} mb="xl">
        <Card
          withBorder
          padding="lg"
          radius="md"
          style={{
            backgroundColor: "#F8FAFC",
            borderLeft: "5px solid #2563EB",
          }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="blue.8">
              CUENTA DE DETRACCIONES (BANCO DE LA NACIÓN)
            </Text>
            <ShieldCheck size={20} color="#2563EB" />
          </Group>
          <Text size="xl" fw={700} style={{ fontFamily: "monospace" }}>
            {detractionAccount?.account_number || "No configurada"}
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            CCI: {detractionAccount?.cci_number || "Pendiente de registrar"}
          </Text>
          <Group mt="md">
            <Badge color="blue" size="sm" variant="light">
              Uso Obligatorio SUNAT
            </Badge>
            <Badge color="gray" size="sm" variant="outline">
              Moneda: Soles (PEN)
            </Badge>
          </Group>
        </Card>

        <Card withBorder padding="lg" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed">
              CUENTAS OPERATIVAS SOLES (PEN)
            </Text>
            <Landmark size={20} color="#059669" />
          </Group>
          <Text size="xl" fw={700} c="green.9">
            {accounts.filter((a) => a.currency === "PEN").length} Cuentas
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Para cobranzas y depósitos comerciales
          </Text>
          <Badge color="teal" size="sm" variant="light" mt="md">
            Soles peruanos
          </Badge>
        </Card>

        <Card withBorder padding="lg" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed">
              CUENTAS OPERATIVAS DÓLARES (USD)
            </Text>
            <Building size={20} color="#D97706" />
          </Group>
          <Text size="xl" fw={700} c="orange.9">
            {accounts.filter((a) => a.currency === "USD").length} Cuentas
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Para operaciones en moneda extranjera
          </Text>
          <Badge color="orange" size="sm" variant="light" mt="md">
            Dólares americanos
          </Badge>
        </Card>
      </SimpleGrid>

      {/* Tabla General de Cuentas */}
      <Paper withBorder radius="md" p="md" style={{ backgroundColor: "#FFFFFF" }}>
        <Group justify="space-between" mb="md">
          <Title order={4} style={{ color: "#1E293B" }}>
            Listado Completo de Cuentas Registradas
          </Title>
          <Badge color="indigo" variant="light">
            {accounts.length} Cuentas asociadas
          </Badge>
        </Group>

        {loading ? (
          <Center p="xl">
            <Loader size="md" color="indigo" />
          </Center>
        ) : accounts.length === 0 ? (
          <Center p="xl">
            <Text c="dimmed">No hay cuentas bancarias registradas para esta empresa.</Text>
          </Center>
        ) : (
          <Table verticalSpacing="sm" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Entidad Financiera</Table.Th>
                <Table.Th>Tipo de Cuenta</Table.Th>
                <Table.Th>Moneda</Table.Th>
                <Table.Th>Número de Cuenta</Table.Th>
                <Table.Th>Código Interbancario (CCI)</Table.Th>
                <Table.Th>Alias / Descripción</Table.Th>
                <Table.Th>En PDF</Table.Th>
                <Table.Th>Predeterminada</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Acciones</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {accounts.map((acc) => (
                <Table.Tr key={acc.id}>
                  <Table.Td>
                    <Group gap="xs">
                      <Landmark size={18} color="#1E3A8A" />
                      <div>
                        <Text size="sm" fw={600} style={{ color: "#0F172A" }}>
                          {acc.bank?.name || `Banco ID ${acc.bank_id}`}
                        </Text>
                        <Text size="xs" c="dimmed">
                          {acc.bank?.code}
                        </Text>
                      </div>
                    </Group>
                  </Table.Td>
                  <Table.Td>
                    <Badge
                      size="sm"
                      variant="light"
                      color={
                        acc.account_type === "detraccion"
                          ? "blue"
                          : acc.account_type === "corriente"
                          ? "cyan"
                          : "violet"
                      }
                    >
                      {acc.account_type === "detraccion"
                        ? "Detracciones BN"
                        : acc.account_type === "corriente"
                        ? "Cta. Corriente"
                        : "Cta. Ahorros"}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Badge size="xs" color={acc.currency === "PEN" ? "teal" : "orange"}>
                      {acc.currency}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={600} style={{ fontFamily: "monospace" }}>
                      {acc.account_number}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" c="dimmed" style={{ fontFamily: "monospace" }}>
                      {acc.cci_number || "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" fw={500}>
                      {acc.alias || "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {acc.show_in_pdf ? (
                      <Badge size="xs" color="green" variant="dot">
                        Visible
                      </Badge>
                    ) : (
                      <Badge size="xs" color="gray" variant="dot">
                        Oculta
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {acc.is_default && (
                      <Badge size="xs" color="indigo" variant="filled">
                        Principal
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Group gap="xs" justify="flex-end">
                      <Tooltip label="Editar cuenta">
                        <ActionIcon
                          color="blue"
                          variant="subtle"
                          onClick={() => handleOpenEdit(acc)}
                        >
                          <Edit size={16} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Eliminar cuenta">
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => handleDeleteAccount(acc.id)}
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

      {/* Modal Registrar / Editar Cuenta Bancaria */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={
          <Group gap="xs">
            <Landmark size={20} color="#1E3A8A" />
            <Text fw={700}>
              {editingAccount ? "Editar Cuenta Bancaria" : "Registrar Nueva Cuenta Bancaria"}
            </Text>
          </Group>
        }
        size="md"
        radius="md"
      >
        <form onSubmit={handleSaveAccount}>
          <Select
            label="Banco / Entidad Financiera"
            placeholder="Seleccione el banco"
            data={banks.map((b) => ({
              value: b.id.toString(),
              label: `${b.name} (${b.code})`,
            }))}
            value={bankId}
            onChange={setBankId}
            required
            mb="sm"
          />

          <Group grow mb="sm">
            <Select
              label="Tipo de Cuenta"
              data={[
                { value: "corriente", label: "Cuenta Corriente" },
                { value: "ahorros", label: "Cuenta de Ahorros" },
                { value: "detraccion", label: "Cuenta de Detracciones (BN)" },
              ]}
              value={accountType}
              onChange={(val) => setAccountType(val || "corriente")}
              required
            />
            <Select
              label="Moneda"
              data={[
                { value: "PEN", label: "Soles (PEN)" },
                { value: "USD", label: "Dólares Americanos (USD)" },
              ]}
              value={currency}
              onChange={(val) => setCurrency(val || "PEN")}
              required
            />
          </Group>

          <TextInput
            label="Número de Cuenta"
            placeholder="Ej. 191-2345678-0-12"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.currentTarget.value)}
            required
            mb="sm"
          />

          <TextInput
            label="Código de Cuenta Interbancaria (CCI)"
            placeholder="Ej. 002-191-002345678012-54 (20 dígitos)"
            value={cciNumber}
            onChange={(e) => setCciNumber(e.currentTarget.value)}
            mb="sm"
          />

          <TextInput
            label="Alias / Descripción Descriptiva"
            placeholder="Ej. Cuenta Recaudadora Principal BCP"
            value={alias}
            onChange={(e) => setAlias(e.currentTarget.value)}
            mb="md"
          />

          <Group justify="space-between" mb="lg">
            <div>
              <Text size="sm" fw={500}>
                ¿Es Cuenta de Detracción SUNAT?
              </Text>
              <Text size="xs" c="dimmed">
                {canBeDetraction
                  ? "Aplica para retención de detracciones del Banco de la Nación en Soles (PEN)"
                  : "Solo disponible para Banco de la Nación y moneda Soles (PEN)"}
              </Text>
            </div>
            <Switch
              checked={isDetraction}
              disabled={!canBeDetraction}
              onChange={(e) => setIsDetraction(e.currentTarget.checked)}
              color="orange"
            />
          </Group>

          <Group justify="space-between" mb="xl">
            <div>
              <Text size="sm" fw={500}>
                Cuenta Principal Predeterminada
              </Text>
              <Text size="xs" c="dimmed">
                Seleccionada por defecto en operaciones de esta moneda
              </Text>
            </div>
            <Switch
              checked={isDefault}
              onChange={(e) => setIsDefault(e.currentTarget.checked)}
              color="indigo"
            />
          </Group>

          <Divider mb="lg" />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setModalOpened(false)}>
              Cancelar
            </Button>
            <Button
              type="submit"
              color="indigo"
              style={{ backgroundColor: "#1E3A8A" }}
              loading={isSubmitting}
            >
              Guardar Cuenta
            </Button>
          </Group>
        </form>
      </Modal>
    </Box>
  );
};
