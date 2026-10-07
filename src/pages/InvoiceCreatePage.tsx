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
  Badge,
  Switch,
  Alert,
  Divider,
  Modal,
  Box,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  Search,
  Plus,
  Trash2,
  Send,
  AlertTriangle,
  Info,
  UserPlus,
  PackagePlus,
} from "lucide-react";
import { apiRequest } from "../api/client";
import { useApp } from "../context/AppContext";

export const InvoiceCreatePage: React.FC = () => {
  const { activeCompany, isTestMode, setIsTestMode } = useApp();
  const navigate = useNavigate();

  // Encabezado
  const [typeCode, setTypeCode] = useState<string>("01"); // 01=Factura, 03=Boleta
  const [series, setSeries] = useState<string>("F001");
  const [currency, setCurrency] = useState<string>("PEN");
  const [issueDate, setIssueDate] = useState<string>(new Date().toISOString().split("T")[0]);
  const [paymentMethod, setPaymentMethod] = useState<string>("contado");
  const [creditDueDate, setCreditDueDate] = useState<string>(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0]
  );

  // Cliente
  const [clientDocType, setClientDocType] = useState<string>("6"); // 6=RUC, 1=DNI
  const [clientDocNumber, setClientDocNumber] = useState<string>("");
  const [clientName, setClientName] = useState<string>("");
  const [clientAddress, setClientAddress] = useState<string>("");
  const [clientEmail, setClientEmail] = useState<string>("");
  const [isSearchingClient, setIsSearchingClient] = useState<boolean>(false);

  // Ítems
  const [items, setItems] = useState<any[]>([
    {
      description: "Carbón Antracita en Grano Seleccionado (TNE)",
      unit_code: "TNE",
      quantity: 30,
      unit_value: 550, // Sin IGV
      unit_price: 649, // Con IGV
      igv_type: "10",
      igv_amount: 2970,
      total: 19470,
    },
  ]);

  // Catálogo de productos disponibles
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);

  // Detracción (Minera y Carbón)
  const [hasDetraction, setHasDetraction] = useState<boolean>(true);
  const [detractionCode, setDetractionCode] = useState<string>("023"); // 023 = Minerales no metálicos / Carbón
  const [detractionAccount, setDetractionAccount] = useState<string>(() => import.meta.env.VITE_DEFAULT_BN_ACCOUNT || "");
  const [detractionPercent, setDetractionPercent] = useState<number>(10);

  // Modal confirmación
  const [confirmOpened, setConfirmOpened] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Series y Correlativos dinámicos
  const [availableSeries, setAvailableSeries] = useState<any[]>([]);
  const [nextCorrelativePreview, setNextCorrelativePreview] = useState<string>("");

  // Catálogos SUNAT y Cuentas Bancarias
  const [detractionServices, setDetractionServices] = useState<any[]>([]);

  // Vendedores y Personal
  const [sellers, setSellers] = useState<any[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);

  // Clientes frecuentes
  const [catalogClients, setCatalogClients] = useState<any[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);

  // Modales Rápidos
  const [quickClientModal, setQuickClientModal] = useState<boolean>(false);
  const [qcDocType, setQcDocType] = useState<string>("6");
  const [qcDocNumber, setQcDocNumber] = useState<string>("");
  const [qcName, setQcName] = useState<string>("");
  const [qcAddress, setQcAddress] = useState<string>("");
  const [qcEmail, setQcEmail] = useState<string>("");
  const [qcSearching, setQcSearching] = useState<boolean>(false);
  const [qcSaving, setQcSaving] = useState<boolean>(false);

  const [quickProductModal, setQuickProductModal] = useState<boolean>(false);
  const [qpCode, setQpCode] = useState<string>("");
  const [qpDesc, setQpDesc] = useState<string>("");
  const [qpUnit, setQpUnit] = useState<string>("NIU");
  const [qpValue, setQpValue] = useState<number>(100);
  const [qpPrice, setQpPrice] = useState<number>(118);
  const [qpHasDetraction, setQpHasDetraction] = useState<boolean>(false);
  const [qpDetractionCode, setQpDetractionCode] = useState<string>("019");
  const [qpDetractionPercent, setQpDetractionPercent] = useState<number>(10);
  const [qpSaving, setQpSaving] = useState<boolean>(false);

  // Cargar catálogo de productos de la empresa
  useEffect(() => {
    async function loadCatalog() {
      if (!activeCompany) return;
      try {
        const prods = await apiRequest(`/products?company_id=${activeCompany.id}`);
        setCatalogProducts(prods);
      } catch (err) {
        console.error("Error loading products:", err);
      }
    }
    loadCatalog();
  }, [activeCompany]);

  // Cargar series, catálogos, cuentas bancarias, clientes y vendedores
  useEffect(() => {
    async function loadInitialData() {
      if (!activeCompany) return;
      try {
        const [seriesData, catData, bankData, clientsData, employeesData] = await Promise.all([
          apiRequest(`/series?company_id=${activeCompany.id}&document_type=${typeCode}`),
          apiRequest("/catalogs/sunat"),
          apiRequest(`/bank-accounts?company_id=${activeCompany.id}`),
          apiRequest(`/clients?company_id=${activeCompany.id}`),
          apiRequest(`/employees?company_id=${activeCompany.id}`),
        ]);
        setAvailableSeries(seriesData);
        if (seriesData.length > 0) {
          setSeries(seriesData[0].series);
        } else {
          setSeries(typeCode === "01" ? "F001" : "B001");
        }
        setDetractionServices(catData.detraction_services || []);
        setCatalogClients(clientsData || []);
        setSellers(employeesData || []);

        const bnAcc = bankData.find((b: any) => b.account_type === "detraccion");
        if (bnAcc) {
          setDetractionAccount(bnAcc.account_number);
        } else if (activeCompany.bn_account) {
          setDetractionAccount(activeCompany.bn_account);
        }

        if (typeCode === "01") {
          setClientDocType("6");
        } else {
          setClientDocType("1");
        }
      } catch (err) {
        console.error("Error loading series/catalogs:", err);
      }
    }
    loadInitialData();
  }, [activeCompany, typeCode]);

  // Consultar próximo correlativo en tiempo real
  useEffect(() => {
    async function fetchNextCorrelative() {
      if (!activeCompany || !series) return;
      try {
        const res = await apiRequest(
          `/series/next-correlative?company_id=${activeCompany.id}&document_type=${typeCode}&series=${series}`
        );
        if (res && res.formatted_number) {
          setNextCorrelativePreview(res.formatted_number);
        }
      } catch {
        setNextCorrelativePreview(`${series}-????????`);
      }
    }
    fetchNextCorrelative();
  }, [activeCompany, typeCode, series]);

  // Búsqueda en SUNAT / RENIEC
  const handleLookupClient = async () => {
    const doc = clientDocNumber.trim();
    if (!doc) {
      notifications.show({ title: "Atención", message: "Ingrese un número de documento", color: "orange" });
      return;
    }

    setIsSearchingClient(true);
    try {
      if (clientDocType === "6") {
        const res = await apiRequest(`/services/ruc/${doc}`);
        if (res.data) {
          setClientName(res.data.razon_social || "");
          setClientAddress(res.data.direccion || "");
          notifications.show({
            title: "SUNAT",
            message: `RUC verificado: ${res.data.razon_social}`,
            color: "teal",
          });
        }
      } else if (clientDocType === "1") {
        const res = await apiRequest(`/services/dni/${doc}`);
        if (res.data) {
          const fullName = `${res.data.nombres || ""} ${res.data.apellido_paterno || ""} ${res.data.apellido_materno || ""}`.trim();
          setClientName(fullName);
          notifications.show({
            title: "RENIEC",
            message: `DNI verificado: ${fullName}`,
            color: "teal",
          });
        }
      }
    } catch (err: any) {
      notifications.show({
        title: "Consulta no encontrada",
        message: err.message || "No se pudo consultar el documento en el padrón",
        color: "red",
      });
    } finally {
      setIsSearchingClient(false);
    }
  };

  // Seleccionar cliente frecuente
  const handleSelectClient = (clientId: string | null) => {
    setSelectedClientId(clientId);
    if (!clientId) return;
    const c = catalogClients.find((x) => x.id.toString() === clientId);
    if (!c) return;
    setClientDocType(c.doc_type);
    setClientDocNumber(c.doc_number);
    setClientName(c.name);
    setClientAddress(c.address || "");
    setClientEmail(c.email || "");
    if (c.credit_days_default && c.credit_days_default > 0) {
      setPaymentMethod("credito");
      const d = new Date();
      d.setDate(d.getDate() + c.credit_days_default);
      setCreditDueDate(d.toISOString().split("T")[0]);
      notifications.show({
        title: "Condición a Crédito",
        message: `Aplicado plazo de ${c.credit_days_default} días registrado para ${c.name}`,
        color: "cyan",
      });
    }
  };

  // Guardado rápido de cliente desde modal
  const handleQuickClientSave = async () => {
    if (!qcDocNumber.trim() || !qcName.trim() || !activeCompany) return;
    setQcSaving(true);
    try {
      const saved = await apiRequest("/clients", {
        method: "POST",
        body: JSON.stringify({
          company_id: activeCompany.id,
          doc_type: qcDocType,
          doc_number: qcDocNumber.trim(),
          name: qcName.trim(),
          address: qcAddress.trim() || undefined,
          email: qcEmail.trim() || undefined,
        }),
      });
      setCatalogClients((prev) => [...prev, saved]);
      setSelectedClientId(saved.id.toString());
      setClientDocType(saved.doc_type);
      setClientDocNumber(saved.doc_number);
      setClientName(saved.name);
      setClientAddress(saved.address || "");
      setClientEmail(saved.email || "");
      setQuickClientModal(false);
      notifications.show({ title: "Cliente Registrado", message: `${saved.name} listo para facturar`, color: "teal" });
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setQcSaving(false);
    }
  };

  // Guardado rápido de producto desde modal
  const handleQuickProductSave = async () => {
    if (!qpDesc.trim() || !activeCompany) return;
    setQpSaving(true);
    try {
      const saved = await apiRequest("/products", {
        method: "POST",
        body: JSON.stringify({
          company_id: activeCompany.id,
          internal_code: qpCode.trim() || undefined,
          description: qpDesc.trim(),
          unit_code: qpUnit,
          unit_value: qpValue,
          unit_price: qpPrice,
          has_detraction: qpHasDetraction,
          detraction_code: qpHasDetraction ? qpDetractionCode : undefined,
          detraction_percent: qpHasDetraction ? qpDetractionPercent : undefined,
        }),
      });
      setCatalogProducts((prev) => [...prev, saved]);
      handleAddFromCatalog(saved.id.toString());
      setQuickProductModal(false);
      notifications.show({ title: "Producto Creado", message: `${saved.description} agregado a la factura`, color: "teal" });
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setQpSaving(false);
    }
  };

  // Agregar ítem desde el catálogo
  const handleAddFromCatalog = (productId: string) => {
    const prod = catalogProducts.find((p) => p.id.toString() === productId);
    if (!prod) return;

    if (prod.has_detraction) {
      setHasDetraction(true);
      if (prod.detraction_code) setDetractionCode(prod.detraction_code);
      if (prod.detraction_percent) setDetractionPercent(Number(prod.detraction_percent));
      notifications.show({
        title: "Detracción Automática",
        message: `El producto ${prod.description} tiene detracción del ${prod.detraction_percent}%`,
        color: "orange",
      });
    }

    const qty = 1;
    const unitVal = Number(prod.unit_value);
    const unitPrice = Number(prod.unit_price) || unitVal * 1.18;
    const total = unitPrice * qty;
    const igvAmt = (unitVal * 0.18) * qty;

    setItems([
      ...items,
      {
        internal_code: prod.internal_code,
        description: prod.description,
        unit_code: prod.unit_code,
        quantity: qty,
        unit_value: unitVal,
        unit_price: unitPrice,
        igv_type: prod.igv_type,
        igv_amount: igvAmt,
        total: total,
      },
    ]);
  };

  // Agregar fila libre
  const handleAddBlankItem = () => {
    setItems([
      ...items,
      {
        description: "",
        unit_code: "TNE",
        quantity: 1,
        unit_value: 0,
        unit_price: 0,
        igv_type: "10",
        igv_amount: 0,
        total: 0,
      },
    ]);
  };

  // Actualizar ítem
  const handleItemChange = (index: number, field: string, val: any) => {
    const updated = [...items];
    const item = { ...updated[index], [field]: val };

    if (field === "quantity" || field === "unit_value") {
      const q = Number(field === "quantity" ? val : item.quantity) || 0;
      const v = Number(field === "unit_value" ? val : item.unit_value) || 0;
      item.unit_price = Number((v * 1.18).toFixed(4));
      item.igv_amount = Number((v * 0.18 * q).toFixed(2));
      item.total = Number((v * 1.18 * q).toFixed(2));
    }

    updated[index] = item;
    setItems(updated);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Cálculos de Totales
  const subtotal = items.reduce((acc, it) => acc + (Number(it.unit_value) * Number(it.quantity) || 0), 0);
  const totalIgv = items.reduce((acc, it) => acc + (Number(it.igv_amount) || 0), 0);
  const total = items.reduce((acc, it) => acc + (Number(it.total) || 0), 0);
  const detractionAmount = hasDetraction ? (total * (detractionPercent / 100)) : 0;
  const netToPay = total - detractionAmount;

  // Emisión final
  const handleEmit = async () => {
    if (!activeCompany) return;
    if (!clientDocNumber || !clientName) {
      notifications.show({ title: "Faltan datos", message: "Complete los datos del cliente", color: "red" });
      return;
    }
    if (items.length === 0) {
      notifications.show({ title: "Faltan ítems", message: "Debe agregar al menos un producto o servicio", color: "red" });
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        company_id: activeCompany.id,
        is_test_mode: isTestMode,
        type_code: typeCode,
        operation_type: "0101",
        series: series,
        issue_date: issueDate,
        currency: currency,
        payment_method: paymentMethod,
        client: {
          doc_type: clientDocType,
          doc_number: clientDocNumber.trim(),
          name: clientName.trim(),
          address: clientAddress.trim() || undefined,
          email: clientEmail.trim() || undefined,
        },
        seller_name: sellers.find((s) => s.id.toString() === selectedSellerId)?.full_name || undefined,
        employee_id: selectedSellerId ? Number(selectedSellerId) : undefined,
        items: items.map((it) => ({
          internal_code: it.internal_code || undefined,
          description: it.description,
          unit_code: it.unit_code,
          quantity: Number(it.quantity),
          unit_value: Number(it.unit_value),
          unit_price: Number(it.unit_price),
          igv_type: it.igv_type,
          igv_amount: Number(it.igv_amount),
          total: Number(it.total),
        })),
      };

      if (paymentMethod === "credito") {
        payload.installments = [
          {
            due_date: creditDueDate,
            amount: Number(total.toFixed(2)),
          },
        ];
      }

      if (hasDetraction && detractionAmount > 0) {
        payload.detraction = {
          payment_method_code: "001",
          bank_account: detractionAccount,
          service_code: detractionCode,
          percent: detractionPercent,
          amount: Number(detractionAmount.toFixed(2)),
        };
      }

      const res = await apiRequest("/documents", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      notifications.show({
        title: isTestMode ? "Comprobante Simulado" : "Comprobante Emitido",
        message: `${res.series}-${res.correlative} generado exitosamente`,
        color: "teal",
      });

      setConfirmOpened(false);
      navigate("/comprobantes");
    } catch (err: any) {
      notifications.show({
        title: "Error al emitir",
        message: err.message || "Ocurrió un error al procesar el comprobante",
        color: "red",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box>
      <Group justify="space-between" mb="md">
        <div>
          <Title order={2} style={{ color: "#0F172A", fontWeight: 700 }}>
            Emitir {typeCode === "01" ? "Factura Electrónica" : "Boleta de Venta"}
          </Title>
          <Text size="sm" c="dimmed">
            Emisión de comprobante tributario • Empresa: <b>{activeCompany?.business_name}</b>
          </Text>
        </div>

        {/* Toggle de Modo de Prueba en Formulario */}
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
                {isTestMode ? "Operación simulada sin efecto tributario" : "Se declarará formalmente a SUNAT"}
              </Text>
            </div>
            <Switch
              checked={isTestMode}
              onChange={(e) => setIsTestMode(e.currentTarget.checked)}
              color="orange"
            />
          </Group>
        </Box>
      </Group>

      {/* Tarjeta 1: Datos Generales */}
      <Paper withBorder p="md" radius="md" mb="md" style={{ backgroundColor: "#FFFFFF" }}>
        <Title order={5} mb="sm" style={{ color: "#0F172A" }}>
          1. Datos del Comprobante
        </Title>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Select
              label="Tipo de Comprobante"
              value={typeCode}
              onChange={(val) => val && setTypeCode(val)}
              data={[
                { value: "01", label: "Factura Electrónica (01)" },
                { value: "03", label: "Boleta de Venta (03)" },
              ]}
              allowDeselect={false}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, sm: 2 }}>
            <Select
              label="Serie"
              value={series}
              onChange={(val) => val && setSeries(val.toUpperCase())}
              data={
                availableSeries.length > 0
                  ? availableSeries.map((s) => ({ value: s.series, label: `${s.series} (${s.description || 'Principal'})` }))
                  : [{ value: typeCode === "01" ? "F001" : "B001", label: typeCode === "01" ? "F001" : "B001" }]
              }
              allowDeselect={false}
            />
            {nextCorrelativePreview && (
              <Text size="10px" c="teal.7" fw={700} mt={2}>
                Próximo: {nextCorrelativePreview}
              </Text>
            )}
          </Grid.Col>
          <Grid.Col span={{ base: 6, sm: 2 }}>
            <Select
              label="Moneda"
              value={currency}
              onChange={(val) => val && setCurrency(val)}
              data={[
                { value: "PEN", label: "Soles (PEN)" },
                { value: "USD", label: "Dólares (USD)" },
              ]}
              allowDeselect={false}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, sm: 2.5 }}>
            <TextInput
              label="Fecha de Emisión"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 6, sm: 2 }}>
            <Select
              label="Condición de Pago"
              value={paymentMethod}
              onChange={(val) => val && setPaymentMethod(val)}
              data={[
                { value: "contado", label: "Al Contado" },
                { value: "credito", label: "Al Crédito" },
              ]}
              allowDeselect={false}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 2.5 }}>
            <Select
              label="Responsable"
              placeholder="Asignar responsable"
              clearable
              data={sellers.map((s) => ({
                value: s.id.toString(),
                label: s.full_name,
              }))}
              value={selectedSellerId}
              onChange={setSelectedSellerId}
            />
          </Grid.Col>
        </Grid>

        {paymentMethod === "credito" && (
          <Box mt="sm" p="xs" style={{ backgroundColor: "#F8FAFC", borderRadius: 8 }}>
            <Group>
              <Text size="xs" fw={600}>
                Vencimiento de la Cuota única al Crédito:
              </Text>
              <TextInput
                type="date"
                size="xs"
                value={creditDueDate}
                onChange={(e) => setCreditDueDate(e.currentTarget.value)}
              />
              <Text size="xs" c="dimmed">
                Monto cuota: {currency === "PEN" ? "S/" : "$"} {total.toFixed(2)}
              </Text>
            </Group>
          </Box>
        )}
      </Paper>

      {/* Tarjeta 2: Cliente */}
      <Paper withBorder p="md" radius="md" mb="md" style={{ backgroundColor: "#FFFFFF" }}>
        <Group justify="space-between" mb="sm">
          <Title order={5} style={{ color: "#0F172A" }}>
            2. Datos del Cliente / Comprador
          </Title>
          <Group>
            {catalogClients.length > 0 && (
              <Select
                placeholder="Seleccionar cliente..."
                size="xs"
                clearable
                searchable
                data={catalogClients.map((c) => ({
                  value: c.id.toString(),
                  label: `${c.doc_number} - ${c.name}`,
                }))}
                value={selectedClientId}
                onChange={handleSelectClient}
                style={{ width: 280 }}
              />
            )}
            <Button
              size="xs"
              variant="light"
              color="blue"
              leftSection={<UserPlus size={14} />}
              onClick={() => setQuickClientModal(true)}
            >
              + Nuevo Cliente
            </Button>
          </Group>
        </Group>
        <Grid>
          <Grid.Col span={{ base: 12, sm: 3 }}>
            <Select
              label="Tipo Documento"
              value={clientDocType}
              onChange={(val) => val && setClientDocType(val)}
              data={[
                { value: "6", label: "RUC (Empresa)" },
                { value: "1", label: "DNI (Persona Natural)" },
                { value: "4", label: "Carnet de Extranjería" },
                { value: "0", label: "Sin Documento" },
              ]}
              allowDeselect={false}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <TextInput
              label="Número de Documento"
              placeholder={clientDocType === "6" ? "Ej. 20100070970" : "Ej. 45892314"}
              value={clientDocNumber}
              onChange={(e) => setClientDocNumber(e.currentTarget.value)}
              rightSection={
                <Tooltip label="Consultar en Padrón SUNAT / RENIEC">
                  <ActionIcon
                    variant="filled"
                    color="amber"
                    onClick={handleLookupClient}
                    loading={isSearchingClient}
                    size="sm"
                    style={{ backgroundColor: "#D97706" }}
                  >
                    <Search size={14} />
                  </ActionIcon>
                </Tooltip>
              }
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 5 }}>
            <TextInput
              label="Razón Social o Nombre Completo"
              placeholder="Nombre del cliente"
              value={clientName}
              onChange={(e) => setClientName(e.currentTarget.value)}
              required
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 8 }}>
            <TextInput
              label="Dirección Fiscal"
              placeholder="Dirección del cliente"
              value={clientAddress}
              onChange={(e) => setClientAddress(e.currentTarget.value)}
            />
          </Grid.Col>
          <Grid.Col span={{ base: 12, sm: 4 }}>
            <TextInput
              label="Correo Electrónico (Para envío de PDF y XML)"
              placeholder="facturacion@cliente.com"
              value={clientEmail}
              onChange={(e) => setClientEmail(e.currentTarget.value)}
            />
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Tarjeta 3: Ítems del comprobante */}
      <Paper withBorder p="md" radius="md" mb="md" style={{ backgroundColor: "#FFFFFF" }}>
        <Group justify="space-between" mb="sm">
          <div>
            <Title order={5} style={{ color: "#0F172A" }}>
              3. Detalle de Bienes y Servicios
            </Title>
            <Text size="xs" c="dimmed">
              Agregue los productos o servicios que forman parte de la operación
            </Text>
          </div>
          <Group>
            {catalogProducts.length > 0 && (
              <Select
                placeholder="Catálogo de productos..."
                size="xs"
                searchable
                clearable
                data={catalogProducts.map((p) => ({
                  value: p.id.toString(),
                  label: `${p.internal_code ? `[${p.internal_code}] ` : ""}${p.description} (${p.unit_code})`,
                }))}
                onChange={(val) => val && handleAddFromCatalog(val)}
                style={{ width: 280 }}
              />
            )}
            <Button
              size="xs"
              variant="light"
              color="indigo"
              leftSection={<PackagePlus size={14} />}
              onClick={() => setQuickProductModal(true)}
            >
              + Nuevo Producto
            </Button>
            <Button
              size="xs"
              variant="light"
              color="amber"
              leftSection={<Plus size={14} />}
              onClick={handleAddBlankItem}
            >
              Fila Vacía
            </Button>
          </Group>
        </Group>

        <Table verticalSpacing="xs" striped withTableBorder withColumnBorders>
          <Table.Thead>
            <Table.Tr style={{ backgroundColor: "#F8FAFC" }}>
              <Table.Th style={{ width: "40%" }}>Descripción del Ítem</Table.Th>
              <Table.Th style={{ width: "12%" }}>Unidad</Table.Th>
              <Table.Th style={{ width: "12%" }}>Cantidad</Table.Th>
              <Table.Th style={{ width: "16%" }}>Valor Unit. (Sin IGV)</Table.Th>
              <Table.Th style={{ width: "16%" }}>Importe Total</Table.Th>
              <Table.Th style={{ width: "4%" }}></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {items.map((item, idx) => (
              <Table.Tr key={idx}>
                <Table.Td>
                  <TextInput
                    size="xs"
                    value={item.description}
                    onChange={(e) => handleItemChange(idx, "description", e.currentTarget.value)}
                    placeholder="Ej. Carbón Antracita en Grano"
                  />
                </Table.Td>
                <Table.Td>
                  <Select
                    size="xs"
                    value={item.unit_code}
                    onChange={(val) => handleItemChange(idx, "unit_code", val)}
                    data={[
                      { value: "TNE", label: "TNE (Toneladas)" },
                      { value: "KGM", label: "KGM (Kilos)" },
                      { value: "NIU", label: "NIU (Unidades)" },
                      { value: "ZZ", label: "ZZ (Servicios)" },
                    ]}
                    allowDeselect={false}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    size="xs"
                    min={0.001}
                    value={item.quantity}
                    onChange={(val) => handleItemChange(idx, "quantity", val)}
                  />
                </Table.Td>
                <Table.Td>
                  <NumberInput
                    size="xs"
                    min={0}
                    decimalScale={2}
                    value={item.unit_value}
                    onChange={(val) => handleItemChange(idx, "unit_value", val)}
                  />
                </Table.Td>
                <Table.Td>
                  <Text size="xs" fw={700}>
                    {currency === "PEN" ? "S/" : "$"} {Number(item.total).toFixed(2)}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <ActionIcon
                    color="red"
                    variant="subtle"
                    size="sm"
                    onClick={() => handleRemoveItem(idx)}
                    disabled={items.length === 1}
                  >
                    <Trash2 size={14} />
                  </ActionIcon>
                </Table.Td>
              </Table.Tr>
            ))}
          </Table.Tbody>
        </Table>
      </Paper>

      {/* Tarjeta 4: Detracción Minera y Carbón */}
      <Paper withBorder p="md" radius="md" mb="md" style={{ backgroundColor: "#FFFFFF" }}>
        <Group justify="space-between" mb="xs">
          <div>
            <Group gap="xs">
              <Title order={5} style={{ color: "#0F172A" }}>
                4. Régimen de Detracción
              </Title>
            </Group>
            <Text size="xs" c="dimmed">
              Obligatorio en ventas de carbón y recursos minerales que superen S/ 700.00 (Tasa habitual 10%)
            </Text>
          </div>
          <Switch
            checked={hasDetraction}
            onChange={(e) => setHasDetraction(e.currentTarget.checked)}
            label="Aplica Detracción"
            color="orange"
          />
        </Group>

        {hasDetraction && (
          <Box p="sm" style={{ backgroundColor: "#FFFBEB", borderRadius: 8, border: "1px solid #FDE68A" }}>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <Select
                  label="Código de Bien Sujeto a Detracción"
                  value={detractionCode}
                  onChange={(val) => {
                    if (val) {
                      setDetractionCode(val);
                      const svc = detractionServices.find((s) => s.code === val);
                      if (svc && svc.default_percent) {
                        setDetractionPercent(svc.default_percent);
                      }
                    }
                  }}
                  data={
                    detractionServices.length > 0
                      ? detractionServices.map((s) => ({
                          value: s.code,
                          label: `${s.code} - ${s.name} (${s.default_percent}%)`,
                        }))
                      : [
                          { value: "023", label: "023 - Recursos hidrobiológicos (4%)" },
                          { value: "025", label: "025 - Minerales y carbón (10%)" },
                          { value: "024", label: "024 - Mantenimiento y servicios (12%)" },
                          { value: "037", label: "037 - Transporte terrestre (4%)" },
                        ]
                  }
                  allowDeselect={false}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 4 }}>
                <TextInput
                  label="Cuenta Banco de la Nación"
                  placeholder="00-123-123456"
                  value={detractionAccount}
                  onChange={(e) => setDetractionAccount(e.currentTarget.value)}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 2 }}>
                <NumberInput
                  label="Porcentaje (%)"
                  value={detractionPercent}
                  onChange={(val) => setDetractionPercent(Number(val))}
                  min={1}
                  max={20}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 2 }}>
                <Text size="xs" fw={700} c="dimmed" mt={4}>
                  Monto Detraído
                </Text>
                <Title order={4} style={{ color: "#B45309" }}>
                  S/ {detractionAmount.toFixed(2)}
                </Title>
              </Grid.Col>
            </Grid>
          </Box>
        )}
      </Paper>

      {/* Resumen de Totales y Botón de Emisión */}
      <Paper withBorder p="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
        <Grid justify="space-between" align="center">
          <Grid.Col span={{ base: 12, md: 6 }}>
            {isTestMode ? (
              <Alert icon={<AlertTriangle size={18} />} color="yellow" title="Modo de Prueba Activado">
                Este comprobante será simulado sin valor fiscal para que compruebes el funcionamiento.
              </Alert>
            ) : (
              <Alert icon={<Info size={18} />} color="teal" title="Emisión Real a SUNAT">
                Este comprobante será firmado digitalmente y enviado a los servidores oficiales de SUNAT.
              </Alert>
            )}
          </Grid.Col>

          <Grid.Col span={{ base: 12, md: 5 }}>
            <Box style={{ textAlign: "right" }}>
              <Group justify="flex-end" gap="xl" mb={4}>
                <Text size="sm" c="dimmed">
                  Op. Gravada:
                </Text>
                <Text size="sm" fw={600} style={{ width: 120 }}>
                  {currency === "PEN" ? "S/" : "$"} {subtotal.toFixed(2)}
                </Text>
              </Group>
              <Group justify="flex-end" gap="xl" mb={4}>
                <Text size="sm" c="dimmed">
                  IGV (18%):
                </Text>
                <Text size="sm" fw={600} style={{ width: 120 }}>
                  {currency === "PEN" ? "S/" : "$"} {totalIgv.toFixed(2)}
                </Text>
              </Group>
              {hasDetraction && (
                <Group justify="flex-end" gap="xl" mb={4}>
                  <Text size="sm" c="orange.8">
                    Detracción ({detractionPercent}%):
                  </Text>
                  <Text size="sm" fw={600} c="orange.8" style={{ width: 120 }}>
                    - S/ {detractionAmount.toFixed(2)}
                  </Text>
                </Group>
              )}
              <Divider my="xs" />
              <Group justify="flex-end" gap="xl" mb="md">
                <Title order={4}>TOTAL FACTURA:</Title>
                <Title order={3} style={{ color: "#D97706", width: 140 }}>
                  {currency === "PEN" ? "S/" : "$"} {total.toFixed(2)}
                </Title>
              </Group>

              {hasDetraction && (
                <Text size="xs" c="dimmed" mb="md">
                  Neto a pagar en cuenta comercial: <b>S/ {netToPay.toFixed(2)}</b>
                </Text>
              )}

              <Button
                size="md"
                color="amber"
                leftSection={<Send size={18} />}
                onClick={() => setConfirmOpened(true)}
                style={{ backgroundColor: "#D97706", fontWeight: 700 }}
              >
                Emitir {typeCode === "01" ? "Factura" : "Boleta"} Electrónica
              </Button>
            </Box>
          </Grid.Col>
        </Grid>
      </Paper>

      {/* Modal de Confirmación Previa */}
      <Modal
        opened={confirmOpened}
        onClose={() => setConfirmOpened(false)}
        title="Confirmar Emisión de Comprobante"
        centered
        size="md"
      >
        <Box p="xs">
          <Text size="sm" mb="xs">
            ¿Está seguro de emitir el comprobante con los siguientes datos?
          </Text>
          <Box p="sm" mb="md" style={{ backgroundColor: "#F8FAFC", borderRadius: 8 }}>
            <Text size="xs">
              <b>Tipo:</b> {typeCode === "01" ? "Factura Electrónica" : "Boleta de Venta"} ({series})
            </Text>
            <Text size="xs">
              <b>Cliente:</b> {clientName} ({clientDocNumber})
            </Text>
            <Text size="xs">
              <b>Total:</b> {currency === "PEN" ? "S/" : "$"} {total.toFixed(2)}
            </Text>
            {hasDetraction && (
              <Text size="xs" c="orange.8">
                <b>Detracción SPOT:</b> S/ {detractionAmount.toFixed(2)}
              </Text>
            )}
            <Text size="xs" c={isTestMode ? "orange.8" : "teal.8"}>
              <b>Modo:</b> {isTestMode ? "Modo Prueba (Simulado)" : "Producción Real SUNAT"}
            </Text>
          </Box>

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setConfirmOpened(false)}>
              Revisar de nuevo
            </Button>
            <Button
              color="amber"
              loading={isSubmitting}
              onClick={handleEmit}
              style={{ backgroundColor: "#D97706" }}
            >
              Sí, emitir ahora
            </Button>
          </Group>
        </Box>
      </Modal>

      {/* Modal Rápido: Nuevo Cliente */}
      <Modal
        opened={quickClientModal}
        onClose={() => setQuickClientModal(false)}
        title={
          <Group>
            <UserPlus size={18} color="#2563EB" />
            <Text fw={700} size="sm">
              Agregar Cliente
            </Text>
          </Group>
        }
        size="md"
        centered
      >
        <Box>
          <Group grow mb="sm">
            <Select
              label="Tipo Documento"
              size="xs"
              data={[
                { value: "6", label: "RUC" },
                { value: "1", label: "DNI" },
              ]}
              value={qcDocType}
              onChange={(val) => setQcDocType(val || "6")}
            />
            <TextInput
              label="Número de Documento"
              size="xs"
              placeholder="Ej. 20123456789"
              value={qcDocNumber}
              onChange={(e) => setQcDocNumber(e.currentTarget.value)}
              rightSection={
                <ActionIcon
                  size="xs"
                  variant="subtle"
                  color="blue"
                  loading={qcSearching}
                  onClick={async () => {
                    if (!qcDocNumber.trim()) return;
                    setQcSearching(true);
                    try {
                      if (qcDocType === "6") {
                        const r = await apiRequest(`/services/ruc/${qcDocNumber.trim()}`);
                        if (r.data) {
                          setQcName(r.data.razon_social || "");
                          setQcAddress(r.data.direccion || "");
                        }
                      } else {
                        const r = await apiRequest(`/services/dni/${qcDocNumber.trim()}`);
                        if (r.data) {
                          setQcName(`${r.data.nombres || ""} ${r.data.apellido_paterno || ""}`.trim());
                        }
                      }
                    } catch {
                      notifications.show({ title: "No encontrado", message: "Complete los datos manualmente", color: "orange" });
                    } finally {
                      setQcSearching(false);
                    }
                  }}
                >
                  <Search size={14} />
                </ActionIcon>
              }
            />
          </Group>
          <TextInput
            label="Razón Social / Nombre"
            size="xs"
            placeholder="Nombre completo"
            value={qcName}
            onChange={(e) => setQcName(e.currentTarget.value)}
            mb="sm"
            required
          />
          <TextInput
            label="Dirección Fiscal"
            size="xs"
            placeholder="Dirección fiscal"
            value={qcAddress}
            onChange={(e) => setQcAddress(e.currentTarget.value)}
            mb="sm"
          />
          <TextInput
            label="Correo de Facturación (Opcional)"
            size="xs"
            placeholder="correo@cliente.com"
            value={qcEmail}
            onChange={(e) => setQcEmail(e.currentTarget.value)}
            mb="md"
          />
          <Group justify="flex-end">
            <Button size="xs" variant="default" onClick={() => setQuickClientModal(false)}>
              Cancelar
            </Button>
            <Button size="xs" color="blue" loading={qcSaving} onClick={handleQuickClientSave}>
              Guardar y Usar
            </Button>
          </Group>
        </Box>
      </Modal>

      {/* Modal Rápido: Nuevo Producto */}
      <Modal
        opened={quickProductModal}
        onClose={() => setQuickProductModal(false)}
        title={
          <Group>
            <PackagePlus size={18} color="#4F46E5" />
            <Text fw={700} size="sm">
              Agregar Producto o Servicio
            </Text>
          </Group>
        }
        size="md"
        centered
      >
        <Box>
          <Group grow mb="sm">
            <TextInput
              label="Código Interno (Opcional)"
              size="xs"
              placeholder="Ej. CARB-002"
              value={qpCode}
              onChange={(e) => setQpCode(e.currentTarget.value)}
            />
            <Select
              label="Unidad de Medida"
              size="xs"
              data={[
                { value: "NIU", label: "NIU - Unidades" },
                { value: "ZZ", label: "ZZ - Servicios" },
                { value: "TNE", label: "TNE - Toneladas" },
                { value: "KGM", label: "KGM - Kilos" },
                { value: "LTR", label: "LTR - Litros" },
              ]}
              value={qpUnit}
              onChange={(val) => setQpUnit(val || "NIU")}
            />
          </Group>
          <TextInput
            label="Descripción"
            size="xs"
            placeholder="Descripción del bien o servicio"
            value={qpDesc}
            onChange={(e) => setQpDesc(e.currentTarget.value)}
            mb="sm"
            required
          />
          <Group grow mb="sm">
            <NumberInput
              label="Valor Unit. (Sin IGV)"
              size="xs"
              decimalScale={4}
              value={qpValue}
              onChange={(val) => {
                const v = Number(val) || 0;
                setQpValue(v);
                setQpPrice(Number((v * 1.18).toFixed(4)));
              }}
            />
            <NumberInput
              label="Precio Unit. (Con IGV)"
              size="xs"
              decimalScale={4}
              value={qpPrice}
              onChange={(val) => {
                const p = Number(val) || 0;
                setQpPrice(p);
                setQpValue(Number((p / 1.18).toFixed(4)));
              }}
            />
          </Group>
          <Paper withBorder p="xs" radius="md" mb="md" style={{ backgroundColor: "#F8FAFC" }}>
            <Switch
              label="¿Sujeto a Detracción SUNAT?"
              size="xs"
              checked={qpHasDetraction}
              onChange={(e) => setQpHasDetraction(e.currentTarget.checked)}
              mb={qpHasDetraction ? "xs" : 0}
            />
            {qpHasDetraction && (
              <Group grow mt="xs">
                <Select
                  label="Código Servicio"
                  size="xs"
                  data={detractionServices.map((d) => ({
                    value: d.code,
                    label: `${d.code} - ${d.description}`,
                  }))}
                  value={qpDetractionCode}
                  onChange={(val) => {
                    setQpDetractionCode(val || "019");
                    const found = detractionServices.find((s) => s.code === val);
                    if (found) setQpDetractionPercent(found.percent);
                  }}
                />
                <NumberInput
                  label="% Detracción"
                  size="xs"
                  value={qpDetractionPercent}
                  onChange={(val) => setQpDetractionPercent(Number(val) || 10)}
                />
              </Group>
            )}
          </Paper>
          <Group justify="flex-end">
            <Button size="xs" variant="default" onClick={() => setQuickProductModal(false)}>
              Cancelar
            </Button>
            <Button size="xs" color="indigo" loading={qpSaving} onClick={handleQuickProductSave}>
              Guardar y Agregar
            </Button>
          </Group>
        </Box>
      </Modal>
    </Box>
  );
};
