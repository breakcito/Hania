import React, { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
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
  Box,
  Switch,
  Divider,
  Alert,
  Badge,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Send, Info, ArrowLeft } from "lucide-react";
import { apiRequest } from "../api/client";
import { useApp } from "../context/AppContext";

export const CreditDebitNotePage: React.FC = () => {
  const { activeCompany, isTestMode, setIsTestMode } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [noteType, setNoteType] = useState<string>("07"); // 07=Nota de Crédito, 08=Nota de Débito
  const [series, setSeries] = useState<string>("FC01");
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Documento afectado
  const [affectedType, setAffectedType] = useState<string>("01"); // 01=Factura, 03=Boleta
  const [affectedSeries, setAffectedSeries] = useState<string>("F001");
  const [affectedCorrelative, setAffectedCorrelative] = useState<number>(1);
  const [reasonCode, setReasonCode] = useState<string>("01");
  const [reasonDesc, setReasonDesc] = useState<string>("Anulación de la operación");

  // Catálogos SUNAT
  const [creditReasons, setCreditReasons] = useState<any[]>([]);
  const [debitReasons, setDebitReasons] = useState<any[]>([]);

  // Cliente
  const [clientDocType, setClientDocType] = useState<string>("6");
  const [clientDocNumber, setClientDocNumber] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");

  // Monto ajustado
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>("Por anulación del comprobante");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Cargar catálogos SUNAT
  useEffect(() => {
    async function loadCatalogs() {
      try {
        const cat = await apiRequest("/catalogs/sunat");
        setCreditReasons(cat.credit_note_reasons || []);
        setDebitReasons(cat.debit_note_reasons || []);
      } catch (err) {
        console.error("Error loading catalogs:", err);
      }
    }
    loadCatalogs();
  }, []);

  // Cargar parámetros de URL si viene desde el listado de comprobantes
  useEffect(() => {
    const aType = searchParams.get("affectedType");
    const aSeries = searchParams.get("affectedSeries");
    const aCorr = searchParams.get("affectedCorr");
    const cDoc = searchParams.get("clientDoc");
    const cName = searchParams.get("clientName");
    const amt = searchParams.get("amount");

    if (aType) {
      setAffectedType(aType);
      setClientDocType(aType === "01" ? "6" : "1");
    }
    if (aSeries) setAffectedSeries(aSeries);
    if (aCorr) setAffectedCorrelative(Number(aCorr));
    if (cDoc) setClientDocNumber(cDoc);
    if (cName) setClientName(cName);
    if (amt) {
      setAmount(Number(amt));
      setDescription(`Ajuste de operación correspondiente a ${aSeries || 'F001'}-${String(aCorr || '1').padStart(8, '0')}`);
    }
  }, [searchParams]);

  useEffect(() => {
    if (noteType === "07") {
      setSeries(affectedType === "01" ? "FC01" : "BC01");
    } else {
      setSeries(affectedType === "01" ? "FD01" : "BD01");
    }
  }, [noteType, affectedType]);

  const currentReasonsList = noteType === "07" ? creditReasons : debitReasons;

  const handleReasonChange = (codeVal: string | null) => {
    if (!codeVal) return;
    setReasonCode(codeVal);
    const found = currentReasonsList.find((r) => r.code === codeVal);
    if (found) setReasonDesc(found.name);
  };

  const handleSubmit = async () => {
    if (!activeCompany) return;
    if (!clientDocNumber || !clientName) {
      notifications.show({
        title: "Datos incompletos",
        message: "Complete la información del cliente receptor",
        color: "orange",
      });
      return;
    }
    if (amount <= 0) {
      notifications.show({
        title: "Monto inválido",
        message: "El monto ajustado debe ser mayor a 0",
        color: "orange",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const igv = Number((amount * 0.18).toFixed(2));
      const total = Number((amount * 1.18).toFixed(2));

      const payload = {
        company_id: activeCompany.id,
        is_test_mode: isTestMode,
        type_code: noteType,
        series: series,
        issue_date: issueDate,
        currency: "PEN",
        payment_method: "contado",
        note: {
          affected_type: affectedType,
          affected_series: affectedSeries,
          affected_correlative: Number(affectedCorrelative),
          code: reasonCode,
          reason: reasonDesc,
        },
        client: {
          doc_type: clientDocType,
          doc_number: clientDocNumber.trim(),
          name: clientName.trim(),
        },
        items: [
          {
            description: description || reasonDesc,
            unit_code: "ZZ",
            quantity: 1,
            unit_value: amount,
            unit_price: Number((amount * 1.18).toFixed(4)),
            igv_type: "10",
            igv_amount: igv,
            total: total,
          },
        ],
      };

      const res = await apiRequest("/documents", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      notifications.show({
        title: "Nota Emitida",
        message: `La ${noteType === "07" ? "Nota de Crédito" : "Nota de Débito"} ${res.series}-${res.correlative} fue emitida con éxito`,
        color: "teal",
      });

      navigate("/comprobantes");
    } catch (err: any) {
      notifications.show({
        title: "Error al emitir",
        message: err.message,
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <Group>
          <Button
            variant="subtle"
            leftSection={<ArrowLeft size={16} />}
            onClick={() => navigate("/comprobantes")}
          >
            Volver al Historial
          </Button>
          <div>
            <Title order={2} style={{ color: "#0F172A", fontWeight: 700 }}>
              Emisión de Notas de Crédito / Débito
            </Title>
            <Text size="sm" c="dimmed">
              Ajustes, anulaciones y correcciones a comprobantes tributarios SUNAT
            </Text>
          </div>
        </Group>

        <Group>
          <Badge size="lg" color={isTestMode ? "orange" : "green"} variant="filled">
            {isTestMode ? "Modo Prueba" : "Producción Real"}
          </Badge>
          <Switch
            checked={isTestMode}
            onChange={(e) => setIsTestMode(e.currentTarget.checked)}
            label="Modo Prueba"
            color="orange"
          />
        </Group>
      </Group>

      <Alert
        icon={<Info size={18} />}
        color="amber"
        title="Normativa SUNAT para Notas Electrónicas"
        mb="md"
        radius="md"
      >
        <Text size="xs">
          La Nota de Crédito anula o descuenta el comprobante original. La serie debe corresponder
          al tipo de comprobante que modifica (FC para Facturas, BC para Boletas).
        </Text>
      </Alert>

      <Grid>
        {/* Panel Izquierdo: Configuración de la Nota y Documento Afectado */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
            <Title order={4} mb="md" style={{ color: "#1E293B" }}>
              1. Datos de la Nota y Comprobante de Referencia
            </Title>

            <Group grow mb="sm">
              <Select
                label="Tipo de Nota"
                data={[
                  { value: "07", label: "Nota de Crédito Electrónica (07)" },
                  { value: "08", label: "Nota de Débito Electrónica (08)" },
                ]}
                value={noteType}
                onChange={(val) => setNoteType(val || "07")}
                required
              />
              <TextInput
                label="Serie Asignada"
                value={series}
                readOnly
                styles={{ input: { fontWeight: 700, backgroundColor: "#F8FAFC" } }}
              />
            </Group>

            <Divider my="sm" label="Comprobante que se Modifica" labelPosition="center" />

            <Group grow mb="sm">
              <Select
                label="Tipo Comprobante Afectado"
                data={[
                  { value: "01", label: "Factura (01)" },
                  { value: "03", label: "Boleta (03)" },
                ]}
                value={affectedType}
                onChange={(val) => {
                  setAffectedType(val || "01");
                  setAffectedSeries(val === "01" ? "F001" : "B001");
                  setClientDocType(val === "01" ? "6" : "1");
                }}
                required
              />
              <TextInput
                label="Serie Afectada"
                placeholder="F001 o B001"
                value={affectedSeries}
                onChange={(e) => setAffectedSeries(e.currentTarget.value.toUpperCase())}
                required
              />
              <NumberInput
                label="Correlativo Afectado"
                placeholder="Ej. 101"
                value={affectedCorrelative}
                onChange={(val) => setAffectedCorrelative(Number(val) || 1)}
                min={1}
                required
              />
            </Group>

            <Select
              label="Motivo SUNAT (Catálogo Oficial)"
              placeholder="Seleccione el motivo normativo"
              data={currentReasonsList.map((r) => ({
                value: r.code,
                label: `${r.code} - ${r.name}`,
              }))}
              value={reasonCode}
              onChange={handleReasonChange}
              required
              mb="sm"
            />

            <TextInput
              label="Sustento / Descripción del Motivo"
              placeholder="Detalle la razón de la nota"
              value={reasonDesc}
              onChange={(e) => setReasonDesc(e.currentTarget.value)}
              required
              mb="sm"
            />

            <TextInput
              label="Fecha de Emisión"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.currentTarget.value)}
              required
            />
          </Paper>
        </Grid.Col>

        {/* Panel Derecho: Receptor y Montos */}
        <Grid.Col span={{ base: 12, md: 6 }}>
          <Paper withBorder p="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
            <Title order={4} mb="md" style={{ color: "#1E293B" }}>
              2. Cliente Receptor y Monto a Ajustar
            </Title>

            <Group grow mb="sm">
              <Select
                label="Doc. Identidad"
                data={[
                  { value: "6", label: "RUC (6)" },
                  { value: "1", label: "DNI (1)" },
                ]}
                value={clientDocType}
                onChange={(val) => setClientDocType(val || "6")}
                required
              />
              <TextInput
                label="Número de Documento"
                placeholder="20XXXXXXXXX"
                value={clientDocNumber}
                onChange={(e) => setClientDocNumber(e.currentTarget.value)}
                required
              />
            </Group>

            <TextInput
              label="Razón Social / Nombre Completo"
              placeholder="Nombre del cliente"
              value={clientName}
              onChange={(e) => setClientName(e.currentTarget.value)}
              required
              mb="md"
            />

            <Divider my="sm" label="Valores Monetarios" labelPosition="center" />

            <NumberInput
              label="Base Imponible / Monto sin IGV (S/)"
              placeholder="0.00"
              value={amount}
              onChange={(val) => setAmount(Number(val) || 0)}
              decimalScale={2}
              min={0}
              required
              mb="sm"
            />

            <TextInput
              label="Descripción del Ítem a Ajustar"
              placeholder="Ej. Anulación total de la venta de carbón"
              value={description}
              onChange={(e) => setDescription(e.currentTarget.value)}
              mb="md"
            />

            <Paper p="sm" radius="sm" style={{ backgroundColor: "#F8FAFC", border: "1px solid #E2E8F0" }}>
              <Group justify="space-between" mb={4}>
                <Text size="xs" c="dimmed">
                  Base Gravada:
                </Text>
                <Text size="sm" fw={600}>
                  S/ {amount.toFixed(2)}
                </Text>
              </Group>
              <Group justify="space-between" mb={4}>
                <Text size="xs" c="dimmed">
                  I.G.V. (18%):
                </Text>
                <Text size="sm" fw={600}>
                  S/ {(amount * 0.18).toFixed(2)}
                </Text>
              </Group>
              <Divider my={4} />
              <Group justify="space-between">
                <Text size="sm" fw={700} c="dark.8">
                  Importe Total de la Nota:
                </Text>
                <Text size="lg" fw={800} c="amber.9">
                  S/ {(amount * 1.18).toFixed(2)}
                </Text>
              </Group>
            </Paper>

            <Button
              fullWidth
              size="md"
              mt="lg"
              leftSection={<Send size={18} />}
              color="amber"
              style={{ backgroundColor: "#D97706" }}
              onClick={handleSubmit}
              loading={isSubmitting}
            >
              Emitir {noteType === "07" ? "Nota de Crédito" : "Nota de Débito"}
            </Button>
          </Paper>
        </Grid.Col>
      </Grid>
    </Box>
  );
};
