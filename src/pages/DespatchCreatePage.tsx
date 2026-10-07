import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  Title,
  Text,
  Group,
  Grid,
  Select,
  TextInput,
  NumberInput,
  Button,
  Table,
  ActionIcon,
  Switch,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Truck, Plus, Trash2, AlertTriangle, Search, Info } from "lucide-react";
import { apiRequest } from "../api/client";
import { useApp } from "../context/AppContext";

export const DespatchCreatePage: React.FC = () => {
  const { activeCompany, isTestMode, setIsTestMode } = useApp();
  const navigate = useNavigate();

  const [series, setSeries] = useState("T001");
  const [issueDate, setIssueDate] = useState(new Date().toISOString().split("T")[0]);
  const [transferDate, setTransferDate] = useState(new Date().toISOString().split("T")[0]);
  const [transferReason, setTransferReason] = useState("01"); // 01=Venta, 04=Traslado entre canteras
  const [transportMode, setTransportMode] = useState("01"); // 01=Público, 02=Privado

  // Peso y bultos
  const [totalWeight, setTotalWeight] = useState<number>(30); // 30 TNE
  const [weightUnit, setWeightUnit] = useState("TNE");

  // Destinatario
  const [recipientRuc, setRecipientRuc] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isSearchingRecipient, setIsSearchingRecipient] = useState(false);

  // Partida y Llegada
  const [originUbigeo, setOriginUbigeo] = useState(() => activeCompany?.ubigeo || "");
  const [originAddress, setOriginAddress] = useState(() => activeCompany?.address || "");

  const [destUbigeo, setDestUbigeo] = useState("");
  const [destAddress, setDestAddress] = useState("");

  // Datos Transporte Público
  const [carrierRuc, setCarrierRuc] = useState("");
  const [carrierName, setCarrierName] = useState("");
  const [carrierMtc, setCarrierMtc] = useState("");

  // Datos Transporte Privado
  const [driverDni, setDriverDni] = useState("");
  const [driverName, setDriverName] = useState("");
  const [driverLicense, setDriverLicense] = useState("");
  const [vehiclePlate, setVehiclePlate] = useState("");
  const [secondaryPlate, setSecondaryPlate] = useState("");

  // Maestros frecuentes para jalar en 1 clic
  const [clients, setClients] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);

  // Cargar clientes, trabajadores/choferes y vehículos de la empresa
  useEffect(() => {
    async function loadData() {
      if (!activeCompany) return;
      try {
        const [cList, eList, vList] = await Promise.all([
          apiRequest(`/clients?company_id=${activeCompany.id}`),
          apiRequest(`/employees?company_id=${activeCompany.id}`),
          apiRequest(`/vehicles?company_id=${activeCompany.id}`),
        ]);
        setClients(cList || []);
        setDrivers(eList || []);
        setVehicles(vList || []);
      } catch (e) {
        console.error("Error loading master data for GRE:", e);
      }
    }
    loadData();
  }, [activeCompany]);

  // Jalar destinatario
  const handleSelectRecipient = (clientId: string | null) => {
    setSelectedClientId(clientId);
    if (!clientId) return;
    const c = clients.find((x) => x.id.toString() === clientId);
    if (!c) return;
    setRecipientRuc(c.doc_number);
    setRecipientName(c.name);
    if (c.address) setDestAddress(c.address);
    if (c.ubigeo) setDestUbigeo(c.ubigeo);
    notifications.show({
      title: "Destinatario Cargado",
      message: `${c.name} asignado con su dirección fiscal`,
      color: "teal",
    });
  };

  // Jalar chofer
  const handleSelectDriver = (driverId: string | null) => {
    setSelectedDriverId(driverId);
    if (!driverId) return;
    const d = drivers.find((x) => x.id.toString() === driverId);
    if (!d) return;
    setDriverDni(d.document_number);
    setDriverName(d.full_name);
    if (d.license_number) setDriverLicense(d.license_number);
    notifications.show({
      title: "Conductor Asignado",
      message: `${d.full_name} (${d.license_number || "Sin brevete"})`,
      color: "teal",
    });
  };

  // Jalar vehículo
  const handleSelectVehicle = (vehicleId: string | null) => {
    setSelectedVehicleId(vehicleId);
    if (!vehicleId) return;
    const v = vehicles.find((x) => x.id.toString() === vehicleId);
    if (!v) return;
    setVehiclePlate(v.plate_number);
    if (v.secondary_plate) setSecondaryPlate(v.secondary_plate);
    notifications.show({
      title: "Vehículo Asignado",
      message: `Placa ${v.plate_number} ${v.secondary_plate ? `+ Carreta ${v.secondary_plate}` : ""}`,
      color: "teal",
    });
  };

  // Ítems trasladados
  const [items, setItems] = useState([
    {
      description: "",
      unit_code: "TNE",
      quantity: 1,
    },
  ]);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleLookupRecipient = async () => {
    if (!recipientRuc.trim()) return;
    setIsSearchingRecipient(true);
    try {
      const res = await apiRequest(`/services/ruc/${recipientRuc.trim()}`);
      if (res.data) {
        setRecipientName(res.data.razon_social || "");
        setRecipientAddress(res.data.direccion || "");
        if (res.data.ubigeo) setDestUbigeo(res.data.ubigeo);
        notifications.show({ title: "SUNAT", message: "Destinatario verificado", color: "teal" });
      }
    } catch (err: any) {
      notifications.show({ title: "No encontrado", message: err.message, color: "red" });
    } finally {
      setIsSearchingRecipient(false);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { description: "", unit_code: "TNE", quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = async () => {
    if (!activeCompany) return;
    if (!recipientRuc || !recipientName) {
      notifications.show({ title: "Faltan datos", message: "Ingrese el destinatario", color: "red" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        company_id: activeCompany.id,
        is_test_mode: isTestMode,
        type_code: "09", // GRE Remitente
        series: series,
        issue_date: issueDate,
        transfer_date: transferDate,
        transport_mode: transportMode,
        transfer_reason: transferReason,
        total_weight: totalWeight,
        weight_unit: weightUnit,
        packages_count: 1,
        recipient: {
          doc_type: "6",
          doc_number: recipientRuc.trim(),
          name: recipientName.trim(),
          address: recipientAddress.trim(),
        },
        origin: {
          ubigeo: originUbigeo.trim(),
          address: originAddress.trim(),
        },
        destination: {
          ubigeo: destUbigeo.trim(),
          address: destAddress.trim(),
        },
        items: items.map((it) => ({
          description: it.description,
          unit_code: it.unit_code,
          quantity: Number(it.quantity),
        })),
      };

      if (transportMode === "01") {
        payload.carrier = {
          doc_type: "6",
          doc_number: carrierRuc.trim(),
          name: carrierName.trim(),
          mtc: carrierMtc.trim(),
        };
      } else {
        payload.driver = {
          doc_type: "1",
          doc_number: driverDni.trim(),
          name: driverName.trim(),
          license: driverLicense.trim(),
        };
        payload.vehicle = {
          plate_number: vehiclePlate.trim(),
          secondary_plate: secondaryPlate.trim() || undefined,
        };
      }

      const res = await apiRequest("/despatches", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      notifications.show({
        title: "GRE Emitida",
        message: `Guía ${res.series}-${res.correlative} emitida con éxito`,
        color: "teal",
      });

      navigate("/guias-remision");
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <div>
          <Title order={2} style={{ color: "#0F172A", fontWeight: 700 }}>
            Guía de Remisión Electrónica (GRE Remitente)
          </Title>
          <Text size="sm" c="dimmed">
            Traslado de carbón, minerales y maquinaria • Empresa: <b>{activeCompany?.business_name}</b>
          </Text>
        </div>

        <Box
          p="xs"
          style={{
            backgroundColor: isTestMode ? "#FEF3C7" : "#F8FAFC",
            borderRadius: 8,
            border: isTestMode ? "1px solid #F59E0B" : "1px solid #E2E8F0",
          }}
        >
          <Group gap="xs">
            {isTestMode ? <AlertTriangle size={18} color="#D97706" /> : <Info size={18} color="#64748B" />}
            <div>
              <Text size="xs" fw={700} c={isTestMode ? "orange.9" : "dark.8"}>
                {isTestMode ? "MODO DE PRUEBA ACTIVO" : "MODO PRODUCCIÓN REAL"}
              </Text>
              <Text size="10px" c="dimmed">
                {isTestMode ? "GRE simulada sin validez SUTRAN/SUNAT" : "Declaración formal a SUNAT y SUTRAN"}
              </Text>
            </div>
            <Switch checked={isTestMode} onChange={(e) => setIsTestMode(e.currentTarget.checked)} color="orange" />
          </Group>
        </Box>
      </Group>

      {/* Datos del Traslado */}
      <Paper withBorder p="md" radius="md" mb="md" style={{ backgroundColor: "#FFFFFF" }}>
        <Title order={5} mb="sm" style={{ color: "#0F172A" }}>
          1. Datos de la Operación y Traslado
        </Title>
        <Grid>
          <Grid.Col span={{ base: 6, sm: 2 }}>
            <TextInput label="Serie GRE" value={series} onChange={(e) => setSeries(e.currentTarget.value.toUpperCase())} maxLength={4} />
          </Grid.Col>
          <Grid.Col span={{ base: 6, sm: 2.5 }}>
            <TextInput label="Fecha Emisión" type="date" value={issueDate} onChange={(e) => setIssueDate(e.currentTarget.value)} />
          </Grid.Col>
          <Grid.Col span={{ base: 6, sm: 2.5 }}>
            <TextInput label="Fecha Inicio Traslado" type="date" value={transferDate} onChange={(e) => setTransferDate(e.currentTarget.value)} />
          </Grid.Col>
          <Grid.Col span={{ base: 6, sm: 2.5 }}>
            <Select
              label="Modalidad de Transporte"
              value={transportMode}
              onChange={(val) => val && setTransportMode(val)}
              data={[
                { value: "01", label: "01 - Transporte Público" },
                { value: "02", label: "02 - Transporte Privado" },
              ]}
              allowDeselect={false}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, sm: 2.5 }}>
            <Select
              label="Motivo del Traslado"
              value={transferReason}
              onChange={(val) => val && setTransferReason(val)}
              data={[
                { value: "01", label: "01 - Venta" },
                { value: "04", label: "04 - Traslado entre canteras/plantas" },
                { value: "13", label: "13 - Otros" },
              ]}
              allowDeselect={false}
            />
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Puntos de Partida y Llegada */}
      <Paper withBorder p="md" radius="md" mb="md" style={{ backgroundColor: "#FFFFFF" }}>
        <Title order={5} mb="sm" style={{ color: "#0F172A" }}>
          2. Ruta: Puntos de Partida y Llegada
        </Title>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <TextInput label="Ubigeo Partida (6 dígitos)" value={originUbigeo} onChange={(e) => setOriginUbigeo(e.currentTarget.value)} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 9 }}>
            <TextInput label="Dirección del Punto de Partida (Cantera / Almacén)" value={originAddress} onChange={(e) => setOriginAddress(e.currentTarget.value)} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <TextInput label="Ubigeo Llegada (6 dígitos)" value={destUbigeo} onChange={(e) => setDestUbigeo(e.currentTarget.value)} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 9 }}>
            <TextInput label="Dirección del Punto de Llegada (Planta / Destino)" value={destAddress} onChange={(e) => setDestAddress(e.currentTarget.value)} />
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Destinatario */}
      <Paper withBorder p="md" radius="md" mb="md" style={{ backgroundColor: "#FFFFFF" }}>
        <Group justify="space-between" mb="sm">
          <Title order={5} style={{ color: "#0F172A" }}>
            3. Datos del Destinatario
          </Title>
          {clients.length > 0 && (
            <Select
              placeholder="⚡ Jalar cliente frecuente..."
              size="xs"
              clearable
              searchable
              data={clients.map((c) => ({
                value: c.id.toString(),
                label: `${c.doc_number} - ${c.name}`,
              }))}
              value={selectedClientId}
              onChange={handleSelectRecipient}
              style={{ width: 280 }}
            />
          )}
        </Group>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <TextInput
              label="RUC Destinatario"
              value={recipientRuc}
              onChange={(e) => setRecipientRuc(e.currentTarget.value)}
              rightSection={
                <ActionIcon variant="filled" color="amber" onClick={handleLookupRecipient} loading={isSearchingRecipient} size="sm">
                  <Search size={14} />
                </ActionIcon>
              }
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <TextInput label="Razón Social Destinatario" value={recipientName} onChange={(e) => setRecipientName(e.currentTarget.value)} />
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Datos del Transporte */}
      <Paper withBorder p="md" radius="md" mb="md" style={{ backgroundColor: "#FFFFFF" }}>
        <Group justify="space-between" mb="sm">
          <Title order={5} style={{ color: "#0F172A" }}>
            4. Datos del {transportMode === "01" ? "Transportista Público" : "Vehículo y Conductor (Transporte Privado)"}
          </Title>
          {transportMode === "02" && (
            <Group>
              {drivers.length > 0 && (
                <Select
                  placeholder="⚡ Jalar Chofer..."
                  size="xs"
                  clearable
                  searchable
                  data={drivers.map((d) => ({
                    value: d.id.toString(),
                    label: `${d.full_name} (${d.job_title})`,
                  }))}
                  value={selectedDriverId}
                  onChange={handleSelectDriver}
                  style={{ width: 220 }}
                />
              )}
              {vehicles.length > 0 && (
                <Select
                  placeholder="⚡ Jalar Vehículo..."
                  size="xs"
                  clearable
                  searchable
                  data={vehicles.map((v) => ({
                    value: v.id.toString(),
                    label: `Placa: ${v.plate_number} ${v.brand ? `(${v.brand})` : ""}`,
                  }))}
                  value={selectedVehicleId}
                  onChange={handleSelectVehicle}
                  style={{ width: 220 }}
                />
              )}
            </Group>
          )}
        </Group>
        {transportMode === "01" ? (
          <Grid>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput label="RUC Empresa de Transportes" value={carrierRuc} onChange={(e) => setCarrierRuc(e.currentTarget.value)} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 5 }}>
              <TextInput label="Razón Social del Transportista" value={carrierName} onChange={(e) => setCarrierName(e.currentTarget.value)} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput label="Registro MTC" value={carrierMtc} onChange={(e) => setCarrierMtc(e.currentTarget.value)} />
            </Grid.Col>
          </Grid>
        ) : (
          <Grid>
            <Grid.Col span={{ base: 12, sm: 3 }}>
              <TextInput label="DNI Conductor" value={driverDni} onChange={(e) => setDriverDni(e.currentTarget.value)} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 4 }}>
              <TextInput label="Nombres del Conductor" value={driverName} onChange={(e) => setDriverName(e.currentTarget.value)} />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 2.5 }}>
              <TextInput label="Licencia de Conducir (Brevete)" value={driverLicense} onChange={(e) => setDriverLicense(e.currentTarget.value)} />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 1.25 }}>
              <TextInput label="Placa Tracto" value={vehiclePlate} onChange={(e) => setVehiclePlate(e.currentTarget.value)} />
            </Grid.Col>
            <Grid.Col span={{ base: 6, sm: 1.25 }}>
              <TextInput label="Placa Carreta" value={secondaryPlate} onChange={(e) => setSecondaryPlate(e.currentTarget.value)} />
            </Grid.Col>
          </Grid>
        )}
      </Paper>

      {/* Ítems y Peso Total */}
      <Paper withBorder p="md" radius="md" mb="md" style={{ backgroundColor: "#FFFFFF" }}>
        <Group justify="space-between" mb="sm">
          <Title order={5} style={{ color: "#0F172A" }}>
            5. Bienes Transportados & Carga
          </Title>
          <Group>
            <NumberInput
              label="Peso Bruto Total"
              value={totalWeight}
              onChange={(val) => setTotalWeight(Number(val))}
              min={0.1}
              size="xs"
              style={{ width: 140 }}
            />
            <Select
              label="Unidad Peso"
              value={weightUnit}
              onChange={(val) => val && setWeightUnit(val)}
              data={[
                { value: "TNE", label: "TNE (Toneladas Métricas)" },
                { value: "KGM", label: "KGM (Kilogramos)" },
              ]}
              size="xs"
              style={{ width: 140 }}
              allowDeselect={false}
            />
            <Button size="xs" variant="light" color="amber" leftSection={<Plus size={14} />} onClick={handleAddItem} mt={22}>
              Agregar Bien
            </Button>
          </Group>
        </Group>

        <Table verticalSpacing="xs" striped withTableBorder>
          <Table.Thead>
            <Table.Tr>
              <Table.Th style={{ width: "65%" }}>Descripción del Mineral / Carbón</Table.Th>
              <Table.Th style={{ width: "15%" }}>Unidad</Table.Th>
              <Table.Th style={{ width: "15%" }}>Cantidad</Table.Th>
              <Table.Th style={{ width: "5%" }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((it, idx) => (
              <Table.Tr key={idx}>
                <Table.Td>
                  <TextInput
                    size="xs"
                    value={it.description}
                    onChange={(e) => {
                      const updated = [...items];
                      updated[idx].description = e.currentTarget.value;
                      setItems(updated);
                    }}
                  />
                </Table.Td>
                <Table.Td>
                  <Select
                    size="xs"
                    value={it.unit_code}
                    onChange={(val) => {
                      const updated = [...items];
                      updated[idx].unit_code = val || "TNE";
                      setItems(updated);
                    }}
                    data={[{ value: "TNE", label: "Toneladas" }, { value: "KGM", label: "Kilos" }]}
                    allowDeselect={false}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    size="xs"
                    value={it.quantity}
                    onChange={(val) => {
                      const updated = [...items];
                      updated[idx].quantity = Number(val);
                      setItems(updated);
                    }}
                  />
                </Table.Td>
                <Table.Td>
                  <ActionIcon color="red" variant="subtle" size="sm" onClick={() => handleRemoveItem(idx)} disabled={items.length === 1}>
                    <Trash2 size={14} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Botón de Emisión */}
      <Group justify="flex-end">
        <Button size="lg" color="amber" leftSection={<Truck size={18} />} onClick={handleSubmit} loading={isSubmitting} style={{ backgroundColor: "#D97706" }}>
          Emitir Guía de Remisión (GRE)
        </Button>
      </Group>
    </Box>
  );
};
