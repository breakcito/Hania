import React, { useEffect, useState } from "react";
import {
  Paper,
  Title,
  Text,
  Group,
  Table,
  Button,
  TextInput,
  NumberInput,
  Select,
  Modal,
  Badge,
  Loader,
  Center,
  Box,
  ActionIcon,
  Switch,
  SimpleGrid,
  Card,
  Tooltip,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  Plus,
  Trash2,
  Package,
  Search,
  AlertTriangle,
  Boxes,
  Zap,
} from "lucide-react";
import { apiRequest } from "../api/client";
import { useApp } from "../context/AppContext";

export const ProductsPage: React.FC = () => {
  const { activeCompany } = useApp();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null); // "service", "goods"

  // Catálogos SUNAT para detracciones
  const [detractionServices, setDetractionServices] = useState<any[]>([]);

  // Modal
  const [opened, setOpened] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [internalCode, setInternalCode] = useState("");
  const [barcode, setBarcode] = useState("");
  const [sunatCode, setSunatCode] = useState("");
  const [description, setDescription] = useState("");
  const [categoryName, setCategoryName] = useState("General");
  const [unitCode, setUnitCode] = useState("NIU");
  const [currency, setCurrency] = useState("PEN");
  const [isService, setIsService] = useState(false);

  const [unitValue, setUnitValue] = useState<number>(100); // Sin IGV
  const [unitPrice, setUnitPrice] = useState<number>(118); // Con IGV
  const [costPrice, setCostPrice] = useState<number>(0);
  const [igvType, setIgvType] = useState("10");

  const [hasDetraction, setHasDetraction] = useState(false);
  const [detractionCode, setDetractionCode] = useState("019");
  const [detractionPercent, setDetractionPercent] = useState<number>(10);

  const [stock, setStock] = useState<number>(0);
  const [stockMin, setStockMin] = useState<number>(5);
  const [notes, setNotes] = useState("");

  const loadInitialData = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        apiRequest(`/products?company_id=${activeCompany.id}`),
        apiRequest("/catalogs/sunat"),
      ]);
      setProducts(prods);
      setDetractionServices(cats.detraction_services || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, [activeCompany]);

  // Recálculo de precio/valor con IGV
  const handleValueChange = (val: number) => {
    setUnitValue(val);
    if (igvType === "10") {
      setUnitPrice(Number((val * 1.18).toFixed(4)));
    } else {
      setUnitPrice(val);
    }
  };

  const handlePriceChange = (price: number) => {
    setUnitPrice(price);
    if (igvType === "10") {
      setUnitValue(Number((price / 1.18).toFixed(4)));
    } else {
      setUnitValue(price);
    }
  };

  const handleSave = async () => {
    if (!description.trim() || !activeCompany) {
      notifications.show({ title: "Atención", message: "La descripción del producto es obligatoria", color: "orange" });
      return;
    }
    setIsSaving(true);
    try {
      await apiRequest("/products", {
        method: "POST",
        body: JSON.stringify({
          company_id: activeCompany.id,
          internal_code: internalCode.trim() || undefined,
          barcode: barcode.trim() || undefined,
          sunat_code: sunatCode.trim() || undefined,
          description: description.trim(),
          category_name: categoryName.trim() || "General",
          unit_code: unitCode,
          currency: currency,
          unit_value: unitValue,
          unit_price: unitPrice,
          cost_price: costPrice,
          igv_type: igvType,
          has_detraction: hasDetraction,
          detraction_code: hasDetraction ? detractionCode : undefined,
          detraction_percent: hasDetraction ? detractionPercent : undefined,
          is_service: isService,
          stock: isService ? 0 : stock,
          stock_min: isService ? 0 : stockMin,
          notes: notes.trim() || undefined,
        }),
      });
      notifications.show({ title: "Guardado", message: "Producto registrado exitosamente en catálogo", color: "teal" });
      setOpened(false);
      resetForm();
      loadInitialData();
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await apiRequest(`/products/${productToDelete.id}`, { method: "DELETE" });
      notifications.show({
        title: "Producto Desactivado",
        message: `${productToDelete.description} fue desactivado lógicamente`,
        color: "teal",
      });
      setProductToDelete(null);
      loadInitialData();
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setIsDeleting(false);
    }
  };

  const resetForm = () => {
    setInternalCode("");
    setBarcode("");
    setSunatCode("");
    setDescription("");
    setCategoryName("General");
    setUnitCode("NIU");
    setCurrency("PEN");
    setIsService(false);
    setUnitValue(100);
    setUnitPrice(118);
    setCostPrice(0);
    setIgvType("10");
    setHasDetraction(false);
    setDetractionCode("019");
    setDetractionPercent(10);
    setStock(0);
    setStockMin(5);
    setNotes("");
  };

  // Filtrado de productos
  const categoriesList = Array.from(new Set(products.map((p) => p.category_name).filter(Boolean)));

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.internal_code && p.internal_code.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (p.barcode && p.barcode.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.category_name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCat = !filterCategory || p.category_name === filterCategory;
    const matchesType =
      !filterType ||
      (filterType === "service" && p.is_service) ||
      (filterType === "goods" && !p.is_service);

    return matchesSearch && matchesCat && matchesType;
  });

  const totalGoods = products.filter((p) => !p.is_service).length;
  const totalServices = products.filter((p) => p.is_service).length;
  const lowStockCount = products.filter((p) => !p.is_service && Number(p.stock) <= Number(p.stock_min)).length;

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2} style={{ color: "#0F172A", fontWeight: 700 }}>
            Catálogo de Productos y Servicios
          </Title>
          <Text size="sm" c="dimmed">
            Maestro de ítems, precios, inventario y reglas tributarias SUNAT • Empresa:{" "}
            <strong>{activeCompany?.trademark_name || activeCompany?.business_name}</strong>
          </Text>
        </div>
        <Group>
          <Button
            leftSection={<Plus size={16} />}
            color="indigo"
            style={{ backgroundColor: "#1E3A8A" }}
            onClick={() => {
              resetForm();
              setOpened(true);
            }}
          >
            Nuevo Producto / Servicio
          </Button>
        </Group>
      </Group>

      {/* Tarjetas de Resumen de Inventario y Catálogo */}
      <SimpleGrid cols={{ base: 1, sm: 3 }} mb="xl">
        <Card withBorder padding="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed">
              TOTAL ÍTEMS ACTIVOS
            </Text>
            <Boxes size={20} color="#2563EB" />
          </Group>
          <Text size="xl" fw={700} c="blue.9">
            {products.length} Registros
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            {totalGoods} Bienes físicos • {totalServices} Servicios
          </Text>
        </Card>

        <Card withBorder padding="md" radius="md" style={{ backgroundColor: "#FFFFFF" }}>
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c="dimmed">
              CON DETRACCIÓN SUNAT
            </Text>
            <Zap size={20} color="#D97706" />
          </Group>
          <Text size="xl" fw={700} c="orange.9">
            {products.filter((p) => p.has_detraction).length} Ítems
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Activan cálculo automático en factura
          </Text>
        </Card>

        <Card
          withBorder
          padding="md"
          radius="md"
          style={{
            backgroundColor: lowStockCount > 0 ? "#FEF2F2" : "#FFFFFF",
            borderLeft: lowStockCount > 0 ? "5px solid #EF4444" : undefined,
          }}
        >
          <Group justify="space-between" mb="xs">
            <Text size="xs" fw={700} c={lowStockCount > 0 ? "red.8" : "dimmed"}>
              ALERTAS DE STOCK MÍNIMO
            </Text>
            <AlertTriangle size={20} color={lowStockCount > 0 ? "#DC2626" : "#9CA3AF"} />
          </Group>
          <Text size="xl" fw={700} c={lowStockCount > 0 ? "red.9" : "gray.8"}>
            {lowStockCount} Productos
          </Text>
          <Text size="xs" c="dimmed" mt={4}>
            Existencias por debajo del umbral de reposición
          </Text>
        </Card>
      </SimpleGrid>

      {/* Filtros y Búsqueda */}
      <Paper withBorder p="md" radius="md" mb="lg" style={{ backgroundColor: "#FFFFFF" }}>
        <Group>
          <TextInput
            placeholder="Buscar por descripción, código interno, código de barras o categoría..."
            leftSection={<Search size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Todas las Categorías"
            clearable
            data={categoriesList.map((c) => ({ value: c, label: c }))}
            value={filterCategory}
            onChange={setFilterCategory}
            style={{ width: 200 }}
          />
          <Select
            placeholder="Tipo de Ítem"
            clearable
            data={[
              { value: "goods", label: "Bienes Físicos" },
              { value: "service", label: "Servicios" },
            ]}
            value={filterType}
            onChange={setFilterType}
            style={{ width: 170 }}
          />
        </Group>
      </Paper>

      {/* Tabla de Productos */}
      <Paper withBorder radius="md" p="md" style={{ backgroundColor: "#FFFFFF" }}>
        {loading ? (
          <Center p="xl">
            <Loader color="indigo" />
          </Center>
        ) : filteredProducts.length === 0 ? (
          <Center p="xl">
            <Text c="dimmed">No se encontraron productos registrados</Text>
          </Center>
        ) : (
          <Table verticalSpacing="sm" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>CÓDIGO / SKU</Table.Th>
                <Table.Th>DESCRIPCIÓN</Table.Th>
                <Table.Th>CATEGORÍA</Table.Th>
                <Table.Th>UNIDAD</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>VALOR (SIN IGV)</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>PRECIO (CON IGV)</Table.Th>
                <Table.Th style={{ textAlign: "center" }}>STOCK</Table.Th>
                <Table.Th style={{ textAlign: "center" }}>DETRACCIÓN</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>ACCIONES</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredProducts.map((p) => {
                const isLowStock = !p.is_service && Number(p.stock) <= Number(p.stock_min);
                return (
                  <Table.Tr key={p.id}>
                    <Table.Td>
                      <Text size="xs" fw={700} style={{ fontFamily: "monospace" }}>
                        {p.internal_code || "SIN-COD"}
                      </Text>
                      {p.barcode && (
                        <Text size="xs" c="dimmed">
                          SKU: {p.barcode}
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text fw={600} size="sm" c="blue.9">
                        {p.description}
                      </Text>
                      {p.is_service && (
                        <Badge size="xs" color="violet" variant="light" mt={2}>
                          Servicio Intangible
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="outline" color="gray" size="sm">
                        {p.category_name}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="blue" size="sm">
                        {p.unit_code}
                      </Badge>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Text size="sm">
                        {p.currency === "USD" ? "$ " : "S/ "}
                        {Number(p.unit_value).toFixed(2)}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Text size="sm" fw={700} c="green.9">
                        {p.currency === "USD" ? "$ " : "S/ "}
                        {Number(p.unit_price).toFixed(2)}
                      </Text>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "center" }}>
                      {p.is_service ? (
                        <Text size="xs" c="dimmed">
                          N/A
                        </Text>
                      ) : (
                        <Badge color={isLowStock ? "red" : "teal"} variant="light" size="sm">
                          {Number(p.stock).toFixed(2)}
                        </Badge>
                      )}
                    </Table.Td>
                    <Table.Td style={{ textAlign: "center" }}>
                      {p.has_detraction ? (
                        <Badge color="orange" size="xs" variant="filled">
                          {p.detraction_percent}% (Cod {p.detraction_code})
                        </Badge>
                      ) : (
                        <Text size="xs" c="dimmed">
                          No
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Tooltip label="Desactivar producto">
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => setProductToDelete(p)}
                        >
                          <Trash2 size={16} />
                        </ActionIcon>
                      </Tooltip>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* Modal Crear Producto */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          <Group>
            <Package size={20} color="#1E3A8A" />
            <Text fw={700} size="md">
              Registrar Nuevo Producto o Servicio
            </Text>
          </Group>
        }
        size="lg"
        centered
      >
        <Box>
          <Group grow mb="sm">
            <TextInput
              label="Código Interno / Referencia (Opcional)"
              placeholder="Ej. CARB-001, SERV-01"
              value={internalCode}
              onChange={(e) => setInternalCode(e.currentTarget.value)}
            />
            <TextInput
              label={
                <Group gap={6}>
                  <span>Código de Producto SUNAT (UNSPSC)</span>
                  <a
                    href="https://www.sergestec.com/codigos"
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: "11px", color: "#2563EB", textDecoration: "underline" }}
                  >
                    🔍 Buscar código
                  </a>
                </Group>
              }
              placeholder="Ej. 11111600 (Carbón y combustibles sólidos)"
              value={sunatCode}
              onChange={(e) => setSunatCode(e.currentTarget.value)}
            />
          </Group>

          <TextInput
            label="Descripción del Producto o Servicio"
            placeholder="Ej. Carbón Antracita en Grano Seleccionado"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            mb="sm"
            required
          />

          <Group grow mb="sm">
            <TextInput
              label="Categoría / Familia"
              placeholder="Ej. Carbón, Flete, Ferretería, Servicios"
              value={categoryName}
              onChange={(e) => setCategoryName(e.currentTarget.value)}
            />
            <Select
              label="Unidad de Medida"
              data={[
                { value: "NIU", label: "NIU - Unidades / Piezas" },
                { value: "ZZ", label: "ZZ - Servicios" },
                { value: "TNE", label: "TNE - Toneladas Métricas" },
                { value: "KGM", label: "KGM - Kilogramos" },
                { value: "LTR", label: "LTR - Litros" },
                { value: "MTR", label: "MTR - Metros" },
                { value: "BX", label: "BX - Cajas" },
                { value: "BG", label: "BG - Bolsas / Sacos" },
                { value: "GLI", label: "GLI - Galones" },
              ]}
              value={unitCode}
              onChange={(val) => {
                setUnitCode(val || "NIU");
                if (val === "ZZ") setIsService(true);
              }}
              required
            />
          </Group>

          <Group grow mb="sm">
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
            <Select
              label="Afectación del IGV"
              data={[
                { value: "10", label: "10 - Gravado - Operación Onerosa (18%)" },
                { value: "20", label: "20 - Exonerado - Operación Onerosa" },
                { value: "30", label: "30 - Inafecto - Operación Onerosa" },
              ]}
              value={igvType}
              onChange={(val) => setIgvType(val || "10")}
              required
            />
          </Group>

          <Group grow mb="sm">
            <NumberInput
              label="Valor Unitario (Sin IGV)"
              decimalScale={4}
              min={0}
              value={unitValue}
              onChange={(val) => handleValueChange(Number(val) || 0)}
              required
            />
            <NumberInput
              label="Precio de Venta (Con IGV)"
              decimalScale={4}
              min={0}
              value={unitPrice}
              onChange={(val) => handlePriceChange(Number(val) || 0)}
              required
            />
          </Group>

          {/* Toggle Es Servicio vs Bien */}
          <Group mb="md" mt="xs">
            <Switch
              label="¿Es un servicio intangible? (No maneja inventario físico)"
              checked={isService}
              onChange={(e) => setIsService(e.currentTarget.checked)}
            />
          </Group>

          {/* Sección de Detracción SUNAT */}
          <Paper withBorder p="sm" radius="md" mb="md" style={{ backgroundColor: "#F8FAFC" }}>
            <Switch
              label="¿Este producto o servicio está sujeto a Detracción SUNAT?"
              checked={hasDetraction}
              onChange={(e) => setHasDetraction(e.currentTarget.checked)}
              mb={hasDetraction ? "sm" : 0}
            />

            {hasDetraction && (
              <Group grow mt="xs">
                <Select
                  label="Código SUNAT de Servicio / Bien Sujeto a Detracción"
                  searchable
                  data={detractionServices.map((d) => ({
                    value: d.code,
                    label: `${d.code} - ${d.name || d.description} (${d.default_percent || d.percent || 10}%)`,
                  }))}
                  value={detractionCode}
                  onChange={(val) => {
                    setDetractionCode(val || "019");
                    const found = detractionServices.find((s) => s.code === val);
                    if (found) setDetractionPercent(found.default_percent || found.percent || 10);
                  }}
                  required
                />
                <NumberInput
                  label="Porcentaje de Detracción (%)"
                  decimalScale={2}
                  min={1}
                  max={30}
                  value={detractionPercent}
                  onChange={(val) => setDetractionPercent(Number(val) || 10)}
                  required
                />
              </Group>
            )}
          </Paper>

          <Group justify="flex-end" mt="lg">
            <Button variant="default" onClick={() => setOpened(false)}>
              Cancelar
            </Button>
            <Button
              color="indigo"
              style={{ backgroundColor: "#1E3A8A" }}
              loading={isSaving}
              onClick={handleSave}
            >
              Guardar en Catálogo
            </Button>
          </Group>
        </Box>
      </Modal>

      {/* Modal Confirmar Eliminación */}
      <Modal
        opened={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        title="Confirmar Desactivación"
        centered
      >
        <Text size="sm" mb="lg">
          ¿Está seguro de que desea desactivar el producto{" "}
          <strong>{productToDelete?.description}</strong>? Sus emisiones históricas
          no se verán afectadas.
        </Text>
        <Group justify="flex-end">
          <Button variant="default" onClick={() => setProductToDelete(null)}>
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
