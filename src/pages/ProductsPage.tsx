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
  Loader,
  Center,
  Box,
  ActionIcon,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Plus, Trash2 } from "lucide-react";
import { apiRequest } from "../api/client";
import { useApp } from "../context/AppContext";

export const ProductsPage: React.FC = () => {
  const { activeCompany } = useApp();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [productToDelete, setProductToDelete] = useState<any | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Modal
  const [opened, setOpened] = useState(false);
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [unitCode, setUnitCode] = useState("TNE");
  const [unitValue, setUnitValue] = useState<number>(500);
  const [isSaving, setIsSaving] = useState(false);

  const loadProducts = async () => {
    if (!activeCompany) return;
    setLoading(true);
    try {
      const data = await apiRequest(`/products?company_id=${activeCompany.id}`);
      setProducts(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [activeCompany]);

  const handleSave = async () => {
    if (!description.trim() || !activeCompany) return;
    setIsSaving(true);
    try {
      const price = Number((unitValue * 1.18).toFixed(4));
      await apiRequest("/products", {
        method: "POST",
        body: JSON.stringify({
          company_id: activeCompany.id,
          internal_code: code.trim() || undefined,
          description: description.trim(),
          unit_code: unitCode,
          unit_value: unitValue,
          unit_price: price,
          igv_type: "10",
        }),
      });
      notifications.show({ title: "Guardado", message: "Producto registrado en catálogo", color: "teal" });
      setOpened(false);
      setCode("");
      setDescription("");
      loadProducts();
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
        message: `El producto ${productToDelete.description} fue eliminado lógicamente (se preserva su historial)`,
        color: "teal",
      });
      setProductToDelete(null);
      loadProducts();
    } catch (err: any) {
      notifications.show({ title: "Error", message: err.message, color: "red" });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Box>
      <Group justify="space-between" mb="lg">
        <div>
          <Title order={2} style={{ color: "#0F172A", fontWeight: 700 }}>
            Catálogo de Productos y Servicios
          </Title>
          <Text size="sm" c="dimmed">
            Minerales, tipos de carbón y servicios mineros de <b>{activeCompany?.business_name}</b>
          </Text>
        </div>

        <Button
          leftSection={<Plus size={16} />}
          color="amber"
          style={{ backgroundColor: "#D97706" }}
          onClick={() => setOpened(true)}
        >
          Nuevo Producto / Servicio
        </Button>
      </Group>

      <Paper withBorder radius="md" style={{ backgroundColor: "#FFFFFF", overflow: "hidden" }}>
        {loading ? (
          <Center p="xl">
            <Loader color="amber" />
          </Center>
        ) : (
          <Table verticalSpacing="sm" striped highlightOnHover>
            <Table.Thead>
              <Table.Tr style={{ backgroundColor: "#F8FAFC" }}>
                <Table.Th>Código</Table.Th>
                <Table.Th>Descripción</Table.Th>
                <Table.Th>Unidad SUNAT</Table.Th>
                <Table.Th>Valor Unit. (Sin IGV)</Table.Th>
                <Table.Th>Precio Unit. (Con IGV)</Table.Th>
                <Table.Th style={{ textAlign: "right" }}>Acción</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {products.map((p) => (
                <Table.Tr key={p.id}>
                  <Table.Td>
                    <Text size="xs" fw={700} style={{ fontFamily: "monospace" }}>
                      {p.internal_code || "-"}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={600}>
                      {p.description}
                    </Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="xs">{p.unit_code}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm">S/ {Number(p.unit_value).toFixed(2)}</Text>
                  </Table.Td>
                  <Table.Td>
                    <Text size="sm" fw={700} c="orange.9">
                      S/ {Number(p.unit_price).toFixed(2)}
                    </Text>
                  </Table.Td>
                  <Table.Td style={{ textAlign: "right" }}>
                    <ActionIcon
                      variant="subtle"
                      color="red"
                      title="Eliminar lógicamente (desactivar del catálogo)"
                      onClick={() => setProductToDelete(p)}
                    >
                      <Trash2 size={16} />
                    </ActionIcon>
                  </Table.Td>
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        )}
      </Paper>

      {/* Modal Nuevo Producto */}
      <Modal opened={opened} onClose={() => setOpened(false)} title="Registrar Producto o Servicio" centered size="md">
        <Box p="xs">
          <TextInput label="Código Interno" placeholder="Ej. CARB-ANT-01" value={code} onChange={(e) => setCode(e.currentTarget.value)} mb="xs" />
          <TextInput label="Descripción del Bien / Servicio" placeholder="Ej. Carbón Antracita en Granel" value={description} onChange={(e) => setDescription(e.currentTarget.value)} mb="xs" required />
          <Select
            label="Unidad de Medida"
            value={unitCode}
            onChange={(val) => val && setUnitCode(val)}
            data={[
              { value: "TNE", label: "TNE - Toneladas Métricas" },
              { value: "KGM", label: "KGM - Kilogramos" },
              { value: "NIU", label: "NIU - Unidades" },
              { value: "ZZ", label: "ZZ - Servicios" },
            ]}
            mb="xs"
            allowDeselect={false}
          />
          <NumberInput
            label="Valor Unitario (Sin IGV)"
            value={unitValue}
            onChange={(val) => setUnitValue(Number(val))}
            min={0}
            decimalScale={2}
            mb="md"
          />

          <Group justify="flex-end">
            <Button variant="default" onClick={() => setOpened(false)}>
              Cancelar
            </Button>
            <Button color="amber" loading={isSaving} onClick={handleSave} style={{ backgroundColor: "#D97706" }}>
              Guardar en Catálogo
            </Button>
          </Group>
        </Box>
      </Modal>

      {/* Modal Confirmación de Eliminación Lógica */}
      <Modal
        opened={!!productToDelete}
        onClose={() => setProductToDelete(null)}
        title="Confirmar Eliminación Lógica"
        centered
        size="sm"
      >
        <Box p="xs">
          <Text size="sm" mb="sm">
            ¿Está seguro de desactivar <b>{productToDelete?.description}</b>?
          </Text>
          <Text size="xs" c="dimmed" mb="lg">
            El ítem no aparecerá en el selector para nuevas facturas, pero su historial de ventas anteriores se preservará intacto en los reportes contables.
          </Text>
          <Group justify="flex-end">
            <Button variant="default" onClick={() => setProductToDelete(null)}>
              Cancelar
            </Button>
            <Button color="red" loading={isDeleting} onClick={handleConfirmDelete}>
              Desactivar Ítem
            </Button>
          </Group>
        </Box>
      </Modal>
    </Box>
  );
};
