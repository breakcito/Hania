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
  Box,
  Switch,
  Divider,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Send } from "lucide-react";
import { apiRequest } from "../api/client";
import { useApp } from "../context/AppContext";

export const CreditDebitNotePage: React.FC = () => {
  const { activeCompany, isTestMode, setIsTestMode } = useApp();
  const navigate = useNavigate();

  const [noteType, setNoteType] = useState<string>("07"); // 07=Nota de Crédito, 08=Nota de Débito
  const [series, setSeries] = useState<string>("FC01");
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split("T")[0]);

  // Documento afectado
  const [affectedType, setAffectedType] = useState<string>("01"); // 01=Factura, 03=Boleta
  const [affectedSeries, setAffectedSeries] = useState<string>("F001");
  const [affectedCorrelative, setAffectedCorrelative] = useState<number>(1);
  const [reasonCode, setReasonCode] = useState<string>("01");
  const [reasonDesc, setReasonDesc] = useState<string>("Anulación de la operación");

  // Cliente
  const [clientDocType] = useState<string>("6");
  const [clientDocNumber, setClientDocNumber] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");

  // Monto ajustado
  const [amount, setAmount] = useState<number>(0);
  const [description, setDescription] = useState<string>("");

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (noteType === "07") {
      setSeries(affectedType === "01" ? "FC01" : "BC01");
    } else {
      setSeries(affectedType === "01" ? "FD01" : "BD01");
    }
  }, [noteType, affectedType]);

  const handleSubmit = async () => {
    if (!activeCompany) return;
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
          affected_correlative: affectedCorrelative,
          code: reasonCode,
          reason: reasonDesc,
        },
        client: {
          doc_type: clientDocType,
          doc_number: clientDocNumber,
          name: clientName,
        },
        items: [
          {
            description: description,
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
        title: noteType === "07" ? "Nota de Crédito Emitida" : "Nota de Débito Emitida",
        message: `${res.series}-${res.correlative} generado con éxito`,
        color: "teal",
      });

      navigate("/comprobantes");
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
            Emitir {noteType === "07" ? "Nota de Crédito" : "Nota de Débito"}
          </Title>
          <Text size="sm" c="dimmed">
            Ajuste, anulación o corrección de comprobantes • Empresa: <b>{activeCompany?.business_name}</b>
          </Text>
        </div>

        <Box p="xs" style={{ backgroundColor: isTestMode ? "#FEF3C7" : "#F8FAFC", borderRadius: 8 }}>
          <Group gap="xs">
            <Text size="xs" fw={700}>
              {isTestMode ? "MODO DE PRUEBA ACTIVO" : "MODO PRODUCCIÓN"}
            </Text>
            <Switch checked={isTestMode} onChange={(e) => setIsTestMode(e.currentTarget.checked)} color="orange" />
          </Group>
        </Box>
      </Group>

      <Paper withBorder p="md" radius="md" mb="md" style={{ backgroundColor: "#FFFFFF" }}>
        <Title order={5} mb="sm" style={{ color: "#0F172A" }}>
          1. Tipo de Nota y Documento Afectado
        </Title>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <Select
              label="Tipo de Nota"
              value={noteType}
              onChange={(val) => val && setNoteType(val)}
              data={[
                { value: "07", label: "Nota de Crédito (07)" },
                { value: "08", label: "Nota de Débito (08)" },
              ]}
              allowDeselect={false}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, sm: 2 }}>
            <TextInput label="Serie de la Nota" value={series} onChange={(e) => setSeries(e.currentTarget.value.toUpperCase())} maxLength={4} />
          </Grid.Col>
          <Grid.Col span={{ base: 6, sm: 3 }}>
            <TextInput label="Fecha de Emisión" type="date" value={issueDate} onChange={(e) => setIssueDate(e.currentTarget.value)} />
          </Grid.Col>
        </Grid>

        <Divider my="md" />

        <Grid>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Select
              label="Tipo Doc. Modificado"
              value={affectedType}
              onChange={(val) => val && setAffectedType(val)}
              data={[
                { value: "01", label: "Factura (01)" },
                { value: "03", label: "Boleta (03)" },
              ]}
              allowDeselect={false}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, sm: 2 }}>
            <TextInput label="Serie Doc. Modificado" value={affectedSeries} onChange={(e) => setAffectedSeries(e.currentTarget.value.toUpperCase())} maxLength={4} />
          </Grid.Col>
          <Grid.Col span={{ base: 6, sm: 2 }}>
            <NumberInput label="Correlativo Modificado" value={affectedCorrelative} onChange={(val) => setAffectedCorrelative(Number(val))} min={1} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 5 }}>
            <Select
              label="Motivo o Sustento SUNAT"
              value={reasonCode}
              onChange={(val) => val && setReasonCode(val)}
              data={[
                { value: "01", label: "01 - Anulación de la operación" },
                { value: "04", label: "04 - Descuento global" },
                { value: "07", label: "07 - Devolución total" },
                { value: "09", label: "09 - Disminución en el valor" },
              ]}
              allowDeselect={false}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12 }}>
            <TextInput label="Descripción del Motivo" value={reasonDesc} onChange={(e) => setReasonDesc(e.currentTarget.value)} />
          </Grid.Col>
        </Grid>
      </Paper>

      <Paper withBorder p="md" radius="md" mb="md" style={{ backgroundColor: "#FFFFFF" }}>
        <Title order={5} mb="sm" style={{ color: "#0F172A" }}>
          2. Detalle y Monto del Ajuste
        </Title>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <TextInput label="RUC Cliente" value={clientDocNumber} onChange={(e) => setClientDocNumber(e.currentTarget.value)} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <TextInput label="Razón Social Cliente" value={clientName} onChange={(e) => setClientName(e.currentTarget.value)} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <TextInput label="Concepto de la Nota" value={description} onChange={(e) => setDescription(e.currentTarget.value)} />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <NumberInput label="Monto Base Imponible (Soles)" value={amount} onChange={(val) => setAmount(Number(val))} min={0.01} decimalScale={2} />
          </Grid.Col>
        </Grid>
        <Box mt="md" ta="right">
          <Text size="sm" c="dimmed">
            IGV (18%): S/ {(amount * 0.18).toFixed(2)}
          </Text>
          <Title order={3} style={{ color: "#D97706" }}>
            Total Nota: S/ {(amount * 1.18).toFixed(2)}
          </Title>
        </Box>
      </Paper>

      <Group justify="flex-end">
        <Button size="lg" color="amber" leftSection={<Send size={18} />} onClick={handleSubmit} loading={isSubmitting} style={{ backgroundColor: "#D97706" }}>
          Emitir {noteType === "07" ? "Nota de Crédito" : "Nota de Débito"}
        </Button>
      </Group>
    </Box>
  );
};
