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
  NumberInput,
  Loader,
  Center,
  Box,
  ActionIcon,
  Badge,
  SimpleGrid,
  Card,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Plus, Search, Trash2, Users, Building, ShieldCheck, Phone, Mail } from "lucide-react";
import { apiRequest } from "../api/client";
import { useApp } from "../context/AppContext";

export const ClientsPage: React.FC = () => {
  const { activeCompany } = useApp();
  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientToDelete, setClientToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Form State
  const [opened, setOpened] = useState(false);
  const [docType, setDocType] = useState("6");
  const [docNumber, setDocNumber] = useState("");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [ubigeo, setUbigeo] = useState("");
  const [department, setDepartment] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactName, setContactName] = useState("");
  const [creditDaysDefault, setCreditDaysDefault] = useState<number>(0);
  const [conditionSunat, setConditionSunat] = useState("HABIDO");
  const [stateSunat, setStateSunat] = useState("ACTIVO");

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

  // Consulta en tiempo real de RUC o DNI
  const handleLookup = async () => {
    if (!docNumber.trim()) return;
    setIsSearching(true);
    try {
      if (docType === "6") {
        const res = await apiRequest(`/services/ruc/${docNumber.trim()}`);
        if (res.data) {
          setName(res.data.razon_social || "");
          setAddress(res.data.direccion || "");
          setUbigeo(res.data.ubigeo || "");
          setDepartment(res.data.departamento || "");
          setProvince(res.data.provincia || "");
          setDistrict(res.data.distrito || "");
          setConditionSunat(res.data.condicion || "HABIDO");
          setStateSunat(res.data.estado || "ACTIVO");
          notifications.show({
            title: "RUC Encontrado en SUNAT",
            message: `${res.data.razon_social} (${res.data.estado})`,
            color: "teal",
          });
        }
      } else {
        const res = await apiRequest(`/services/dni/${docNumber.trim()}`);
        if (res.data) {
          const fullName = `${res.data.nombres || ""} ${res.data.apellido_paterno || ""} ${res.data.apellido_materno || ""}`.trim();
          setName(fullName);
          notifications.show({
            title: "DNI Encontrado en RENIEC",
            message: fullName,
            color: "teal",
          });
        }
      }
    } catch (err: any) {
      notifications.show({ title: "No encontrado", message: err.message, color: "orange" });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    if (!docNumber.trim() || !name.trim() || !activeCompany) {
      notifications.show({ title: "Atención", message: "Documento y razón social/nombre son requeridos", color: "orange" });
      return;
    }
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
          ubigeo: ubigeo.trim() || undefined,
          department: department.trim() || undefined,
          province: province.trim() || undefined,
          district: district.trim() || undefined,
          email: email.trim() || undefined,
          phone: phone.trim() || undefined,
          contact_name: contactName.trim() || undefined,
          credit_days_default: creditDaysDefault,
          condition_sunat: conditionSunat,
          state_sunat: stateSunat,
        }),
      });
      notifications.show({ title: "Cliente Guardado", message: "Registrado con éxito para facturación rápida", color: "teal" });
      setOpened(false);
      resetForm();
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
        message: `${clientToDelete.name} fue desactivado lógicamente`,
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

  const resetForm = () => {
    setDocType("6");
    setDocNumber("");
    setName("");
    setAddress("");
    setUbigeo("");
    setDepartment("");
    setProvince("");
    setDistrict("");
    setEmail("");
    setPhone("");
    setContactName("");
    setCreditDaysDefault(0);
    setConditionSunat("HABIDO");
    setStateSunat("ACTIVO");
  };

  const filteredClients = clients.filter((c) => {
    return (
      searchQuery === "" ||
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.doc_number.includes(searchQuery)
    );
  });

  const companiesCount = clients.filter((c) => c.doc_type === "6").length;
  const personsCount = clients.filter((c) => c.doc_type === "1").length;

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2} style={{ color: "#0F172A", fontWeight: 700 }}>
            Directorio de Clientes
          </Title>
          <Text size="sm" c="dimmed">
            Maestro de clientes, datos tributarios SUNAT y condiciones comerciales • Empresa:{" "}
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
          Nuevo Cliente
        </Button>
      </Group>

      {/* Tarjetas de Resumen */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card withBorder padding="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed">
              TOTAL DE CLIENTES REGISTRADOS
            </Text>
            <Users size={20} color="#2563EB" />
          </Group>
          <Text size="xl" fw={700} c="blue.9">
            {clients.length} Clientes
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Disponibles para facturación instantánea
          </Text>
        </Card>

        <Card withBorder padding="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed">
              EMPRESAS Y ENTIDADES (RUC)
            </Text>
            <Building size={20} color="#059669" />
          </Group>
          <Text size="xl" fw={700} c="green.9">
            {companiesCount} Empresas
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Receptores de Facturas Electrónicas (01)
          </Text>
        </Card>

        <Card withBorder padding="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed">
              PERSONAS NATURALES (DNI)
            </Text>
            <ShieldCheck size={20} color="#D97706" />
          </Group>
          <Text size="xl" fw={700} c="orange.9">
            {personsCount} Personas
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Receptores de Boletas de Venta (03)
          </Text>
        </Card>
      </SimpleGrid>

      {/* Búsqueda */}
      <Paper withBorder p="md" radius="md" mb="lg" style={{ backgroundColor: "#FFFFFF" }}>
        <TextInput
          placeholder="Buscar cliente por RUC, DNI o razón social / nombre..."
          leftSection={<Search size={16} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
        />
      </Paper>

      {/* Tabla de Clientes */}
      <Paper withBorder radius="md" p="md" style={{ backgroundColor: "#FFFFFF" }}>
        {loading ? (
          <Center p="xl">
            <Loader color="indigo" />
          </Center>
        ) : filteredClients.length === 0 ? (
          <Center p="xl">
            <Text c="dimmed">No se encontraron clientes registrados</Text>
          </Center>
        ) : (
          <Table verticalSpacing="sm" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>DOCUMENTO</Table.Th>
                <Table.Th>RAZÓN SOCIAL / NOMBRE</Table.Th>
                <Table.Th>DIRECCIÓN FISCAL</Table.Th>
                <Table.Th>CONTACTO</Table.Th>
                <Table.Th style={{ textAlign: "center" }}>CRÉDITO</Table.Th>
                <Table.Th style={{ textAlign: "center" }}>ESTADO SUNAT</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>ACCIONES</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredClients.map((c) => (
                <Table.Tr key={c.id}>
                  <Table.Td>
                    <Badge variant="outline" color={c.doc_type === "6" ? "blue" : "teal"} size="sm">
                      {c.doc_type === "6" ? "RUC" : "DNI"}: {c.doc_number}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={600} size="sm" c="blue.9">
                      {c.name}
                    </Text>
                    {c.contact_name && (
                      <Text size="xs" c="dimmed">
                        Contacto: {c.contact_name}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs" lineClamp={2}>
                      {c.address || "Sin dirección registrada"}
                    </Text>
                    {c.department && (
                      <Text size="xs" c="dimmed">
                        {c.department} - {c.province}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {c.phone && (
                      <Group gap={4}>
                        <Phone size={12} color="#6B7280" />
                        <Text size="xs">{c.phone}</Text>
                      </Group>
                    )}
                    {c.email && (
                      <Group gap={4}>
                        <Mail size={12} color="#6B7280" />
                        <Text size="xs" c="dimmed">
                          {c.email}
                        </Text>
                      </Group>
                    )}
                  </Table.Td>
                  <Table.Td style={{ textAlign: "center" }}>
                    {c.credit_days_default > 0 ? (
                      <Badge color="cyan" size="sm" variant="light">
                        {c.credit_days_default} días
                      </Badge>
                    ) : (
                      <Badge color="gray" size="sm" variant="outline">
                        Contado
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td style={{ textAlign: "center" }}>
                    <Badge
                      color={c.state_sunat === "ACTIVO" ? "green" : "red"}
                      size="sm"
                      variant="light"
                    >
                      {c.condition_sunat === "HABIDO" ? "HABIDO" : c.condition_sunat || "ACTIVO"}
                    </Badge>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Tooltip label="Desactivar cliente">
                      <ActionIcon
                        color="red"
                        variant="subtle"
                        onClick={() => setClientToDelete(c)}
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

      {/* Modal Crear Cliente */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          <Group>
            <Building size={20} color="#1E3A8A" />
            <Text fw={700} size="md">
              Registrar Cliente
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
                { value: "6", label: "RUC (Registro Único de Contribuyentes)" },
                { value: "1", label: "DNI (Doc. Nacional de Identidad)" },
                { value: "4", label: "Carnet de Extranjería" },
                { value: "7", label: "Pasaporte" },
              ]}
              value={docType}
              onChange={(val) => setDocType(val || "6")}
              required
            />
            <TextInput
              label="Número de Documento"
              placeholder={docType === "6" ? "Ej. 20612955990" : "Ej. 45892144"}
              value={docNumber}
              onChange={(e) => setDocNumber(e.currentTarget.value)}
              rightSection={
                <ActionIcon
                  variant="subtle"
                  color="blue"
                  loading={isSearching}
                  onClick={handleLookup}
                  title="Consultar SUNAT / RENIEC"
                >
                  <Search size={16} />
                </ActionIcon>
              }
              required
            />
          </Group>

          <TextInput
            label="Razón Social o Nombre Completo"
            placeholder="Ej. CORPORACION ACEROS AREQUIPA S.A."
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            mb="sm"
            required
          />

          <TextInput
            label="Dirección Fiscal"
            placeholder="Ej. AV. SANTIAGO ANTUNEZ DE MAYOLO S/N"
            value={address}
            onChange={(e) => setAddress(e.currentTarget.value)}
            mb="sm"
          />

          <Group grow mb="sm">
            <TextInput
              label="Ubigeo"
              placeholder="Ej. 150101"
              value={ubigeo}
              onChange={(e) => setUbigeo(e.currentTarget.value)}
            />
            <TextInput
              label="Departamento"
              placeholder="Ej. LIMA"
              value={department}
              onChange={(e) => setDepartment(e.currentTarget.value)}
            />
            <TextInput
              label="Provincia"
              placeholder="Ej. LIMA"
              value={province}
              onChange={(e) => setProvince(e.currentTarget.value)}
            />
          </Group>

          <Group grow mb="sm">
            <TextInput
              label="Correo Electrónico (Facturación)"
              placeholder="facturacion@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
            />
            <TextInput
              label="Teléfono / Celular"
              placeholder="Ej. 01-3176000 / 987654321"
              value={phone}
              onChange={(e) => setPhone(e.currentTarget.value)}
            />
          </Group>

          <Group grow mb="lg">
            <TextInput
              label="Persona de Contacto"
              placeholder="Ej. Lic. Claudia Valdivia"
              value={contactName}
              onChange={(e) => setContactName(e.currentTarget.value)}
            />
            <NumberInput
              label="Días de Crédito Habituales"
              placeholder="0 = Contado, 15, 30 días"
              min={0}
              max={180}
              value={creditDaysDefault}
              onChange={(val) => setCreditDaysDefault(Number(val) || 0)}
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
              Guardar Cliente
            </Button>
          </Group>
        </Box>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal
        opened={!!clientToDelete}
        onClose={() => setClientToDelete(null)}
        title="Confirmar Desactivación"
        centered
      >
        <Text size="sm" mb="lg">
          ¿Está seguro de que desea desactivar al cliente{" "}
          <strong>{clientToDelete?.name}</strong>? Los comprobantes emitidos
          anteriormente conservarán su información intacta.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setClientToDelete(null)}>
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
