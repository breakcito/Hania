import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Paper,
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Container,
  Alert,
  Box,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { Flame, Lock, User as UserIcon, Info } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appName = import.meta.env.VITE_APP_NAME || "Cupper & Hannia";
  const companyName = import.meta.env.VITE_COMPANY_NAME || "Corporación de Servicios Cupper & Hannia E.I.R.L";
  const companyRuc = import.meta.env.VITE_COMPANY_RUC || "";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await login(username.trim(), password);
      notifications.show({
        title: "Bienvenido",
        message: "Sesión iniciada correctamente",
        color: "teal",
      });
      navigate("/");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err?.message || "Credenciales incorrectas");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#0F172A",
        padding: "20px",
      }}
    >
      <Container size={420} style={{ width: "100%" }}>
        <Box style={{ textAlign: "center", marginBottom: 24 }}>
          <Box
            mx="auto"
            mb="sm"
            style={{
              width: 52,
              height: 52,
              borderRadius: 12,
              backgroundColor: "#D97706",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFF",
              boxShadow: "0 10px 15px -3px rgba(217, 119, 6, 0.4)",
            }}
          >
            <Flame size={32} />
          </Box>
          <Title order={2} style={{ color: "#FFFFFF", fontWeight: 700 }}>
            {appName}
          </Title>
          <Text c="gray.4" size="sm">
            {companyName}
          </Text>
          {companyRuc && (
            <Text c="gray.5" size="xs">
              RUC: {companyRuc}
            </Text>
          )}
        </Box>

        <Paper
          withBorder
          shadow="md"
          p={30}
          radius="md"
          style={{ backgroundColor: "#FFFFFF" }}
        >
          {error && (
            <Alert color="red" title="Error de Acceso" mb="md" radius="sm">
              {error}
            </Alert>
          )}

          <Alert
            icon={<Info size={16} />}
            color="amber"
            title="Acceso al Sistema"
            mb="md"
            variant="light"
            radius="sm"
          >
            <Text size="xs">
              Ingrese con sus credenciales de usuario y contraseña autorizadas.
            </Text>
          </Alert>

          <form onSubmit={handleSubmit}>
            <TextInput
              label="Nombre de Usuario"
              placeholder="Ej. admin"
              leftSection={<UserIcon size={16} />}
              required
              value={username}
              onChange={(e) => setUsername(e.currentTarget.value)}
              mb="md"
            />
            <PasswordInput
              label="Contraseña"
              placeholder="Su contraseña"
              leftSection={<Lock size={16} />}
              required
              value={password}
              onChange={(e) => setPassword(e.currentTarget.value)}
              mb="xl"
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
              color="amber"
              size="md"
              style={{
                backgroundColor: "#D97706",
                color: "#FFFFFF",
                fontWeight: 600,
              }}
            >
              Ingresar al Sistema
            </Button>
          </form>
        </Paper>

        <Text c="gray.5" size="xs" ta="center" mt="md">
          Conectado con Factos API • Facturación Electrónica SUNAT
        </Text>
      </Container>
    </Box>
  );
};
