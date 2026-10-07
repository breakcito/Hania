import React, { useState } from "react";
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
  Box,
  ActionIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Plus, Search, CheckCircle, Trash2, RotateCw } from "lucide-react";
import { apiRequest } from "../api/client";
import { useApp } from "../context/AppContext";

export const CompaniesPage: React.FC = () => {
  const { companies, activeCompany, setActiveCompany, refreshCompanies } =
    useApp();

  const [opened, setOpened] = useState(false);
  const [companyToDelete, setCompanyToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [ruc, setRuc] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [trademarkName, setTrademarkName] = useState("");
  const [address, setAddress] = useState("");
  const [ubigeo, setUbigeo] = useState("");
  const [department, setDepartment] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleLookup = async () => {
    if (ruc.trim().length !== 11) {
      notifications.show({
        title: "Atención",
        message: "El RUC debe tener 11 dígitos",
        color: "orange",
      });
      return;
    }
    setIsSearching(true);
    try {
      const res = await apiRequest(`/services/ruc/${ruc.trim()}`);
      if (res.data) {
        setBusinessName(res.data.razon_social || "");
        setTrademarkName(
          res.data.nombre_comercial || res.data.razon_social || "",
        );
        setAddress(res.data.direccion || "");
        setUbigeo(res.data.ubigeo || "");
        setDepartment(res.data.departamento || "");
        setProvince(res.data.provincia || "");
        setDistrict(res.data.distrito || "");
        notifications.show({
          title: "SUNAT",
          message: "Empresa identificada",
          color: "teal",
        });
      }
    } catch (err: any) {
      notifications.show({
        title: "Error",
        message: err.message,
        color: "red",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleSave = async () => {
    if (!ruc || !businessName) return;
    setIsSaving(true);
    try {
      await apiRequest("/companies", {
        method: "POST",
        body: JSON.stringify({
          ruc: ruc.trim(),
          business_name: businessName.trim(),
          trademark_name: trademarkName.trim() || undefined,
          address: address.trim() || undefined,
          ubigeo: ubigeo.trim() || undefined,
          department: department.trim() || undefined,
          province: province.trim() || undefined,
          district: district.trim() || undefined,
          is_matrix: false,
        }),
      });
      notifications.show({
        title: "Empresa Registrada",
        message: "La empresa se agregó al sistema multiempresa",
        color: "teal",
      });
      setOpened(false);
      setRuc("");
      setBusinessName("");
      setAddress("");
      await refreshCompanies();
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
    if (!companyToDelete) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/companies/${companyToDelete.id}`, {
        method: "DELETE",
      });
      notifications.show({
        title: "Empresa Desactivada",
        message: `La empresa ${companyToDelete.business_name} fue eliminada lógicamente (se preserva su historial)`,
        color: "teal",
      });
      setCompanyToDelete(null);
      await refreshCompanies();
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

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2} style={{ color: "#0F172A", fontWeight: 700 }}>
            Gestión Multiempresa
          </Title>
          <Text size="sm" c="dimmed">
            Administre a <b>Corporación de Servicios Cupper & Hannia E.I.R.L</b>{" "}
            y las empresas vinculadas del grupo
          </Text>
        </div>

        <Button
          leftSection={<Plus size={16} />}
          color="amber"
          style={{ backgroundColor: "#D97706" }}
          onClick={() => setOpened(true)}
        >
          Registrar Nueva Empresa
        </Button>
      </Group>

      <Paper
        withBorder
        radius="md"
        style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}
      >
        <Table verticalSpacing="md" striped highlightOnHover>
          <Table.Thead>
            <Table.Tr style={{ backgroundColor: "#F8FAFC" }}>
              <Table.Th>RUC</Table.Th>
              <Table.Th>Razón Social / Comercial</Table.Th>
              <Table.Th>Dirección Fiscal / Ubicación</Table.Th>
              <Table.Th>Rol en el Grupo</Table.Th>
              <Table.Th style={{ textAlign: "right" }}>Acción</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {companies.map((comp) => {
              const isSelected = activeCompany?.id === comp.id;
              return (
                <Table.Tr
                  key={comp.id}
                  style={{
                    backgroundColor: isSelected ? "#FEF3C7" : undefined,
                  }}
                >
                  <Table.Td>
                    <Text
                      size="sm"
                      fw={700}
                      style={{ fontFamily: "monospace" }}
                    >
                      {comp.ruc}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={700}>
                      {comp.business_name}
                    </Text>
                    {comp.trademark_name &&
                      comp.trademark_name !== comp.business_name && (
                        <Text size="xs" c="dimmed">
                          Comercial: {comp.trademark_name}
                        </Text>
                      )}
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs">{comp.address || "-"}</Text>
                    <Text size="11px" c="dimmed">
                      {comp.district} - {comp.province} - {comp.department}{" "}
                      (Ubigeo: {comp.ubigeo})
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    {comp.is_matrix ? (
                      <Badge color="indigo" variant="filled">
                        Empresa Matriz
                      </Badge>
                    ) : (
                      <Badge color="gray" variant="light">
                        Empresa Filial
                      </Badge>
                    )}
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <Group justify="flex-end" gap="xs">
                      {isSelected ? (
                        <Badge
                          color="teal"
                          leftSection={<CheckCircle size={12} />}
                        >
                          Empresa Activa
                        </Badge>
                      ) : (
                        <Button
                          size="xs"
                          variant="default"
                          onClick={() => setActiveCompany(comp)}
                        >
                          Seleccionar
                        </Button>
                      )}
                      {!comp.is_matrix && (
                        <ActionIcon
                          variant="subtle"
                          color="red"
                          title="Eliminar lógicamente empresa filial"
                          onClick={() => setCompanyToDelete(comp)}
                        >
                          <Trash2 size={16} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Modal Registrar Nueva Empresa */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title="Registrar Empresa Filial en el Sistema"
        centered
        size="md"
      >
        <Box p="xs">
          <TextInput
            label="RUC de la Empresa (11 dígitos)"
            placeholder="Ej. 20612345678"
            value={ruc}
            onChange={(e) => setRuc(e.currentTarget.value)}
            maxLength={11}
            mb="xs"
            rightSection={
              <ActionIcon
                variant="filled"
                color="amber"
                onClick={handleLookup}
                loading={isSearching}
                size="sm"
              >
                <Search size={14} />
              </ActionIcon>
            }
          />
          <TextInput
            label="Razón Social"
            value={businessName}
            onChange={(e) => setBusinessName(e.currentTarget.value)}
            mb="xs"
            required
          />
          <TextInput
            label="Nombre Comercial"
            value={trademarkName}
            onChange={(e) => setTrademarkName(e.currentTarget.value)}
            mb="xs"
          />
          <TextInput
            label="Dirección Fiscal"
            value={address}
            onChange={(e) => setAddress(e.currentTarget.value)}
            mb="xs"
          />
          <Group grow mb="md">
            <TextInput
              label="Departamento"
              value={department}
              onChange={(e) => setDepartment(e.currentTarget.value)}
            />
            <TextInput
              label="Provincia"
              value={province}
              onChange={(e) => setProvince(e.currentTarget.value)}
            />
            <TextInput
              label="Distrito"
              value={district}
              onChange={(e) => setDistrict(e.currentTarget.value)}
            />
          </Group>

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setOpened(false)}>
              Cancelar
            </Button>
            <Button
              color="amber"
              loading={isSaving}
              onClick={handleSave}
              style={{ backgroundColor: "#D97706" }}
            >
              Registrar Empresa
            </Button>
          </Group>
        </Box>
      </Modal>

      {/* Modal Confirmación de Eliminación Lógica */}
      <Modal
        opened={!!companyToDelete}
        onClose={() => setCompanyToDelete(null)}
        title="Confirmar Eliminación Lógica"
        centered
        size="sm"
      >
        <Box p="xs">
          <Text size="sm" mb="sm">
            ¿Está seguro de desactivar la empresa{" "}
            <b>{companyToDelete?.business_name}</b>?
          </Text>
          <Text size="xs" c="dimmed" mb="lg">
            La empresa será dada de baja del listado activo, pero todos los
            comprobantes emitidos y movimientos históricos se mantendrán
            almacenados de forma inmutable para SUNAT.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setCompanyToDelete(null)}>
              Cancelar
            </Button>
            <Button
              color="red"
              loading={isDeleting}
              onClick={handleConfirmDelete}
            >
              Desactivar Empresa
            </Button>
          </Group>
        </Box>
      </Modal>
    </Box>
  );
};
