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
  Boxes,
  Zap,
  Edit,
} from "lucide-react";
import { apiRequest } from "../api/client";

export const ProductsPage: React.FC = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Filtros
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string | null>(null); // "service", "goods"

  // Catálogos SUNAT para detracciones
  const [detractionServices, setDetractionServices] = useState<any[]>([]);

  // Modal
  const [opened, setOpened] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [sunatCode, setSunatCode] = useState("");
  const [description, setDescription] = useState("");
  const [unitCode, setUnitCode] = useState("NIU");
  const [currency, setCurrency] = useState("PEN");
  const [isService, setIsService] = useState(false);
  const [unitValue, setUnitValue] = useState<number>(100); // Sin IGV
  const [unitPrice, setUnitPrice] = useState<number>(118); // Con IGV
  const [igvType, setIgvType] = useState("10");

  const [hasDetraction, setHasDetraction] = useState(false);
  const [detractionCode, setDetractionCode] = useState("019");
  const [detractionPercent, setDetractionPercent] = useState<number>(10);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [prods, cats] = await Promise.all([
        apiRequest("/products"),
        apiRequest("/catalogs/sunat"),
      ]);
      setProducts(prods || []);
      setDetractionServices(cats.detraction_services || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleOpenCreate = () => {
    resetForm();
    setEditingProduct(null);
    setOpened(true);
  };

  const handleOpenEdit = (p: any) => {
    setEditingProduct(p);
    setSunatCode(p.sunat_code || "");
    setDescription(p.description);
    setUnitCode(p.unit_code || "NIU");
    setCurrency(p.currency || "PEN");
    setIsService(Boolean(p.is_service));
    setUnitValue(Number(p.unit_value) || 0);
    setUnitPrice(Number(p.unit_price) || 0);
    setIgvType(p.igv_type || "10");
    setHasDetraction(Boolean(p.has_detraction));
    setDetractionCode(p.detraction_code || "019");
    setDetractionPercent(Number(p.detraction_percent) || 10);
    setOpened(true);
  };

  const handleSave = async () => {
    if (!description.trim()) {
      notifications.show({ title: "Atención", message: "La descripción del producto es obligatoria", color: "orange" });
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        sunat_code: sunatCode.trim() || undefined,
        description: description.trim(),
        unit_code: unitCode,
        currency: currency,
        unit_value: unitValue,
        unit_price: unitPrice,
        igv_type: igvType,
        has_detraction: hasDetraction,
        detraction_code: hasDetraction ? detractionCode : undefined,
        detraction_percent: hasDetraction ? detractionPercent : undefined,
        is_service: isService,
      };

      if (editingProduct) {
        await apiRequest(`/products/${editingProduct.id}`, {
          method: "PUT",
          body: JSON.stringify(payload),
        });
        notifications.show({ title: "Producto Actualizado", message: "Catálogo actualizado con éxito", color: "teal" });
      } else {
        await apiRequest("/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        notifications.show({ title: "Guardado", message: "Producto registrado exitosamente en catálogo", color: "teal" });
      }

      setOpened(false);
      setEditingProduct(null);
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
    setEditingProduct(null);
    setSunatCode("");
    setDescription("");
    setUnitCode("NIU");
    setCurrency("PEN");
    setIsService(false);
    setUnitValue(100);
    setUnitPrice(118);
    setIgvType("10");
    setHasDetraction(false);
    setDetractionCode("019");
    setDetractionPercent(10);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      searchQuery === "" ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.sunat_code && p.sunat_code.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesType =
      !filterType ||
      (filterType === "service" && p.is_service) ||
      (filterType === "goods" && !p.is_service);

    return matchesSearch && matchesType;
  });

  const totalGoods = products.filter((p) => !p.is_service).length;
  const totalServices = products.filter((p) => p.is_service).length;

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2} style={{ color: "#0F172A", fontWeight: 700 }}>
            Catálogo de Productos y Servicios
          </Title>
          <Text size="sm" c="dimmed">
            Maestro corporativo compartido entre todas las empresas • Precios y reglas tributarias SUNAT
          </Text>
        </div>
        <Group>
          <Button
            leftSection={<Plus size={16} />}
            color="indigo"
            style={{ backgroundColor: "#1E3A8A" }}
            onClick={handleOpenCreate}
          >
            Nuevo Producto / Servicio
          </Button>
        </Group>
      </Group>

      {/* Tarjetas de Resumen */}
      <SimpleGrid cols={{ base: 1, sm: 2 }} mb="xl">
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
      </SimpleGrid>

      {/* Filtros y Búsqueda */}
      <Paper withBorder p="md" radius="md" mb="lg" style={{ backgroundColor: "#FFFFFF" }}>
        <Group>
          <TextInput
            placeholder="Buscar por descripción o código SUNAT..."
            leftSection={<Search size={16} />}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.currentTarget.value)}
            style={{ flex: 1 }}
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
                <Table.Th>DESCRIPCIÓN</Table.Th>
                <Table.Th>CÓDIGO SUNAT</Table.Th>
                <Table.Th>UNIDAD</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>PRECIO (CON IGV)</Table.Th>
                <Table.Th style={{ textAlign: "center" }}>DETRACCIÓN</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>ACCIONES</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {filteredProducts.map((p) => {
                return (
                  <Table.Tr key={p.id}>
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
                      <Text size="xs" c="dimmed" style={{ fontFamily: "monospace" }}>
                        {p.sunat_code || "-"}
                      </Text>
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" color="blue" size="sm">
                        {p.unit_code}
                      </Badge>
                    </Table.Td>
                    <Table.Td style={{ textAlign: "right" }}>
                      <Text size="sm" fw={700} c="green.9">
                        {p.currency === "USD" ? "$ " : "S/ "}
                        {Number(p.unit_price).toFixed(2)}
                      </Text>
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
                      <Group gap="xs" justify="flex-end">
                        <Tooltip label="Editar producto o servicio">
                          <ActionIcon
                            color="blue"
                            variant="subtle"
                            onClick={() => handleOpenEdit(p)}
                          >
                            <Edit size={16} />
                          </ActionIcon>
                        </Tooltip>
                        <Tooltip label="Desactivar producto">
                          <ActionIcon
                            color="red"
                            variant="subtle"
                            onClick={() => setProductToDelete(p)}
                          >
                            <Trash2 size={16} />
                          </ActionIcon>
                        </Tooltip>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                );
              })}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* Modal Crear / Editar Producto */}
      <Modal
        opened={opened}
        onClose={() => setOpened(false)}
        title={
          <Group>
            <Package size={20} color="#1E3A8A" />
            <Text fw={700} size="md">
              {editingProduct ? "Editar Producto o Servicio" : "Registrar Nuevo Producto o Servicio"}
            </Text>
          </Group>
        }
        size="lg"
        centered
      >
        <Box>
          <TextInput
            label={
              <Group gap={6}>
                <span>Código SUNAT (Opcional)</span>
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
            mb="sm"
          />

          <TextInput
            label="Descripción del Producto o Servicio"
            placeholder="Ej. Carbón Antracita en Grano Seleccionado"
            value={description}
            onChange={(e) => setDescription(e.currentTarget.value)}
            mb="sm"
            required
          />

          <Group grow mb="sm">
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

          <Group grow mb="sm">
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
            <NumberInput
              label="Valor Unit. (Sin IGV)"
              decimalScale={4}
              min={0}
              value={unitValue}
              onChange={(val) => {
                const v = Number(val) || 0;
                setUnitValue(v);
                setUnitPrice(Number((v * 1.18).toFixed(4)));
              }}
              required
            />
            <NumberInput
              label="Precio de Venta (Con IGV)"
              decimalScale={4}
              min={0}
              value={unitPrice}
              onChange={(val) => {
                const p = Number(val) || 0;
                setUnitPrice(p);
                setUnitValue(Number((p / 1.18).toFixed(4)));
              }}
              required
            />
          </Group>

          {/* Toggle Es Servicio vs Bien */}
          <Group mb="md" mt="xs">
            <Switch
              label="¿Es un servicio intangible? (No es bien físico)"
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
                  label="Código de Detracción"
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
