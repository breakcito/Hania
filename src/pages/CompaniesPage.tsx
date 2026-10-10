import React, { useState } from "react";
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
  Box,
  ActionIcon,
  FileInput,
  PasswordInput,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Plus, Search, Trash2, Edit, FileCode, CheckCircle2 } from "lucide-react";
import { apiRequest } from "../api/client";
import { useApp } from "../context/AppContext";

import departamentosData from "../ubigeo/departamentos.json";
import provinciasData from "../ubigeo/provincias.json";
import distritosData from "../ubigeo/distritos.json";

export const CompaniesPage: React.FC = () => {
  const { companies, activeCompany, refreshCompanies } =
    useApp();

  const [opened, setOpened] = useState(false);
  const [editingCompany, setEditingCompany] = useState<any | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [ruc, setRuc] = useState("");
  const [businessName, setBusinessName] = useState("");
  const [address, setAddress] = useState("");
  const [ubigeo, setUbigeo] = useState("");
  const [department, setDepartment] = useState("");
  const [province, setProvince] = useState("");
  const [district, setDistrict] = useState("");
  const [establishmentCode, setEstablishmentCode] = useState("0000");
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Modal para habilitar facturación en Factos con Certificado Digital
  const [certModalOpened, setCertModalOpened] = useState(false);
  const [certCompany, setCertCompany] = useState<any | null>(null);
  const [solUser, setSolUser] = useState("");
  const [solPass, setSolPass] = useState("");
  const [certPass, setCertPass] = useState("");
  const [certFile, setCertFile] = useState<File | null>(null);
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [isEnablingFactos, setIsEnablingFactos] = useState(false);

  const handleOpenEnableFacturador = (comp: any) => {
    setCertCompany(comp);
    setSolUser(comp.sol_user || "MODDATOS");
    setSolPass("");
    setCertPass("");
    setCertFile(null);
    setClientId("");
    setClientSecret("");
    setCertModalOpened(true);
  };

  const handleEnableFacturador = async () => {
    if (!certCompany) return;
    if (!solUser || !solPass || !certPass) {
      notifications.show({
        title: "Faltan datos",
        message: "Complete el usuario SOL, clave SOL y clave del certificado",
        color: "red",
      });
      return;
    }
    if (!certFile) {
      notifications.show({
        title: "Falta certificado",
        message: "Seleccione el archivo de certificado digital (.pfx, .p12 o .pem)",
        color: "red",
      });
      return;
    }

    setIsEnablingFactos(true);
    try {
      const formData = new FormData();
      formData.append("sol_user", solUser.trim());
      formData.append("sol_pass", solPass.trim());
      formData.append("certificate_pass", certPass.trim());
      formData.append("certificate", certFile);
      if (clientId.trim()) formData.append("client_id", clientId.trim());
      if (clientSecret.trim()) formData.append("client_secret", clientSecret.trim());

      await apiRequest(`/companies/${certCompany.id}/enable-facturador`, {
        method: "POST",
        body: formData,
      });

      notifications.show({
        title: "Facturación Habilitada",
        message: `La empresa ${certCompany.business_name} quedó registrada y lista para emitir con Factos.`,
        color: "teal",
      });

      setCertModalOpened(false);
      refreshCompanies();
    } catch (err: any) {
      notifications.show({
        title: "Error al habilitar",
        message: err.message,
        color: "red",
      });
    } finally {
      setIsEnablingFactos(false);
    }
  };

  // Ubigeo Cascading Logic
  const selectedDepObj = (departamentosData as any[]).find(
    (d) => d.nombre_ubigeo.toLowerCase() === department.toLowerCase()
  );
  const availableProvincias = selectedDepObj
    ? ((provinciasData as Record<string, any[]>)[selectedDepObj.id_ubigeo] || [])
    : [];

  const selectedProvObj = availableProvincias.find(
    (p) => p.nombre_ubigeo.toLowerCase() === province.toLowerCase()
  );
  const availableDistritos = selectedProvObj
    ? ((distritosData as Record<string, any[]>)[selectedProvObj.id_ubigeo] || [])
    : [];

  const handleOpenCreate = () => {
    setEditingCompany(null);
    setRuc("");
    setBusinessName("");
    setAddress("");
    setUbigeo("");
    setDepartment("");
    setProvince("");
    setDistrict("");
    setEstablishmentCode("0000");
    setOpened(true);
  };

  const handleOpenEdit = (comp: any) => {
    setEditingCompany(comp);
    setRuc(comp.ruc || "");
    setBusinessName(comp.business_name || "");
    setAddress(comp.address || "");
    setUbigeo(comp.ubigeo || "");
    setDepartment(comp.department || "");
    setProvince(comp.province || "");
    setDistrict(comp.district || "");
    setEstablishmentCode(comp.establishment_code || "0000");
    setOpened(true);
  };

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
      const payload = {
        ruc: ruc.trim(),
        business_name: businessName.trim(),
        address: address.trim() || undefined,
        ubigeo: ubigeo.trim() || undefined,
        department: department.trim() || undefined,
        province: province.trim() || undefined,
        district: district.trim() || undefined,
        establishment_code: establishmentCode.trim() || "0000",
      };

      if (editingCompany) {
        await apiRequest(`/companies/${editingCompany.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        notifications.show({
          title: "Empresa Actualizada",
          message: "Datos de la empresa actualizados correctamente",
          color: "teal",
        });
      } else {
        await apiRequest("/companies", {
          method: "POST",
          body: JSON.stringify({
            ...payload,
            is_matrix: false,
          }),
        });
        notifications.show({
          title: "Empresa Registrada",
          message: "La empresa se agregó al sistema multiempresa",
          color: "teal",
        });
      }
      setOpened(false);
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
          onClick={handleOpenCreate}
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
              <Table.Th style={{ textAlign: "center" }}>Acción</Table.Th>
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
                  <Table.Td style={{ textAlign: "center" }}>
                    <Group justify="center" gap="xs">
                      {comp.facturador_company_id ? (
                        <Tooltip label="Vinculada al facturador Factos para emitir CPE y GRE">
                          <Badge color="teal" variant="light" leftSection={<CheckCircle2 size={12} />}>
                            Facturador OK
                          </Badge>
                        </Tooltip>
                      ) : (
                        <Tooltip label="Habilitar en Factos con Certificado Digital y Usuario SOL">
                          <Button
                            size="compact-xs"
                            variant="light"
                            color="orange"
                            leftSection={<FileCode size={12} />}
                            onClick={() => handleOpenEnableFacturador(comp)}
                          >
                            Habilitar Facturador
                          </Button>
                        </Tooltip>
                      )}
                      <ActionIcon
                        variant="subtle"
                        color="blue"
                        title="Editar datos de empresa"
                        onClick={() => handleOpenEdit(comp)}
                      >
                        <Edit size={16} />
                      </ActionIcon>
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
                    {/* {isSelected ? (
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
                    )} */}
                  </Table.Td>
                </Table.Tr>
              );
            })}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Modal Registrar/Editar Empresa */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={editingCompany ? "Editar Empresa" : "Registrar Empresa Filial en el Sistema"}
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
            label="Dirección Fiscal"
            value={address}
            onChange={(e) => setAddress(e.currentTarget.value)}
            mb="xs"
          />
          <Group grow mb="xs">
            <Select
              label="Departamento"
              placeholder="Seleccionar departamento..."
              searchable
              clearable
              data={(departamentosData as any[]).map((d) => ({
                value: d.nombre_ubigeo,
                label: d.nombre_ubigeo,
              }))}
              value={department}
              onChange={(val) => {
                setDepartment(val || "");
                setProvince("");
                setDistrict("");
                setUbigeo("");
              }}
            />
            <Select
              label="Provincia"
              placeholder="Seleccionar provincia..."
              searchable
              clearable
              disabled={!department || availableProvincias.length === 0}
              data={availableProvincias.map((p) => ({
                value: p.nombre_ubigeo,
                label: p.nombre_ubigeo,
              }))}
              value={province}
              onChange={(val) => {
                setProvince(val || "");
                setDistrict("");
                setUbigeo("");
              }}
            />
            <Select
              label="Distrito"
              placeholder="Seleccionar distrito..."
              searchable
              clearable
              disabled={!province || availableDistritos.length === 0}
              data={availableDistritos.map((dist) => ({
                value: dist.nombre_ubigeo,
                label: dist.nombre_ubigeo,
              }))}
              value={district}
              onChange={(val) => {
                setDistrict(val || "");
                const matched = availableDistritos.find((d) => d.nombre_ubigeo === val);
                if (matched && matched.codigo_ubigeo && selectedDepObj && selectedProvObj) {
                  const fullUbigeo = `${selectedDepObj.codigo_ubigeo}${selectedProvObj.codigo_ubigeo}${matched.codigo_ubigeo}`;
                  setUbigeo(fullUbigeo);
                } else if (!val) {
                  setUbigeo("");
                }
              }}
            />
          </Group>
          <TextInput
            label="Código de Ubigeo SUNAT (6 dígitos)"
            placeholder="Ej. 130101"
            value={ubigeo}
            onChange={(e) => setUbigeo(e.currentTarget.value)}
            mb="md"
          />

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
              {editingCompany ? "Guardar Cambios" : "Registrar Empresa"}
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

      {/* Modal Habilitar Facturación en Factos */}
      <Modal
        opened={certModalOpened}
        onClose={() => setCertModalOpened(false)}
        title="Habilitar Facturación Electrónica (Factos - SUNAT)"
        centered
        size="md"
      >
        <Box p="xs">
          <Text size="sm" mb="xs">
            Configure las credenciales de <b>{certCompany?.business_name}</b> (RUC {certCompany?.ruc}) para emitir formalmente comprobantes (Facturas, Boletas, Guías):
          </Text>

          <TextInput
            label="Usuario SOL SUNAT"
            placeholder="Ej. MODDATOS o USUARIOSOL"
            value={solUser}
            onChange={(e) => setSolUser(e.currentTarget.value)}
            mb="sm"
            required
          />

          <PasswordInput
            label="Contraseña SOL SUNAT"
            placeholder="Clave SOL"
            value={solPass}
            onChange={(e) => setSolPass(e.currentTarget.value)}
            mb="sm"
            required
          />

          <FileInput
            label="Certificado Digital Tributario (.pfx, .p12, .pem)"
            placeholder="Seleccione su archivo de certificado"
            accept=".pfx,.p12,.pem"
            value={certFile}
            onChange={setCertFile}
            mb="sm"
            required
          />

          <PasswordInput
            label="Contraseña del Certificado Digital"
            placeholder="Contraseña del archivo de certificado"
            value={certPass}
            onChange={(e) => setCertPass(e.currentTarget.value)}
            mb="md"
            required
          />

          <Text size="xs" fw={700} c="dimmed" mb={4}>
            Credenciales API SUNAT GRE (Opcional - Requerido para Guías de Remisión en Producción):
          </Text>

          <TextInput
            label="Client ID (API SUNAT GRE)"
            placeholder="ID de cliente generado en SUNAT Operaciones en Línea"
            value={clientId}
            onChange={(e) => setClientId(e.currentTarget.value)}
            mb="xs"
          />

          <PasswordInput
            label="Client Secret (API SUNAT GRE)"
            placeholder="Clave secreta generada en SUNAT"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.currentTarget.value)}
            mb="lg"
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setCertModalOpened(false)}>
              Cancelar
            </Button>
            <Button
              color="amber"
              loading={isEnablingFactos}
              onClick={handleEnableFacturador}
              style={{ backgroundColor: "#D97706" }}
            >
              Habilitar y Guardar en Factos
            </Button>
          </Group>
        </Box>
      </Modal>
    </Box>
  );
};
