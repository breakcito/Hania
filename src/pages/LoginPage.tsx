import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Title,
  Text,
  TextInput,
  PasswordInput,
  Button,
  Alert,
  Box,
  Stack,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import {
  Flame,
  Lock,
  User as UserIcon,
  ArrowRight,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import "./LoginPage.css";

import img1 from "../assets/1.jpg";
import img2 from "../assets/2.jpg";
import img3 from "../assets/3.jpg";
import img4 from "../assets/4.jpg";
import img5 from "../assets/5.jpg";
import img6 from "../assets/6.jpg";
import img7 from "../assets/7.jpg";

interface BackgroundSlide {
  src: string;
  animClass: string;
}

const SLIDES: BackgroundSlide[] = [
  { src: img1, animClass: "kb-anim-1" },
  { src: img2, animClass: "kb-anim-2" },
  { src: img3, animClass: "kb-anim-3" },
  { src: img4, animClass: "kb-anim-4" },
  { src: img5, animClass: "kb-anim-5" },
  { src: img6, animClass: "kb-anim-6" },
  { src: img7, animClass: "kb-anim-7" },
];

const SLIDE_DURATION_MS = 7500;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("admin");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeSlide, setActiveSlide] = useState(0);
  const [slideKeys, setSlideKeys] = useState<number[]>(() =>
    SLIDES.map((_, i) => (i === 0 ? 1 : 0))
  );

  const appName = import.meta.env.VITE_APP_NAME || "Hania System";

  // Cycle slides with smooth transitions and reset animation key on entry
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => {
        const next = (prev + 1) % SLIDES.length;
        setSlideKeys((keys) => {
          const updated = [...keys];
          updated[next] = (updated[next] || 0) + 1;
          return updated;
        });
        return next;
      });
    }, SLIDE_DURATION_MS);

    return () => clearInterval(timer);
  }, []);

  const handleSelectSlide = (index: number) => {
    setActiveSlide(index);
    setSlideKeys((keys) => {
      const updated = [...keys];
      updated[index] = (updated[index] || 0) + 1;
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      setError("Por favor complete su usuario y contraseña.");
      return;
    }

    setError(null);
    setLoading(true);

    try {
      await login(username.trim(), password);
      notifications.show({
        title: "¡Bienvenido de vuelta!",
        message: "Sesión iniciada correctamente.",
        color: "teal",
      });
      navigate("/");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(
        err?.message || "Credenciales incorrectas. Verifique su usuario y contraseña."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      style={{
        position: "relative",
        width: "100vw",
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
        backgroundColor: "#070b14",
      }}
    >
      {/* Background Slideshow with Smooth Crossfade and Distinct Motion */}
      {SLIDES.map((slide, index) => {
        const isActive = index === activeSlide;
        return (
          <Box
            key={index}
            style={{
              position: "absolute",
              inset: 0,
              opacity: isActive ? 1 : 0,
              transition: "opacity 1800ms ease-in-out",
              pointerEvents: "none",
              zIndex: 0,
            }}
          >
            <img
              key={slideKeys[index]}
              src={slide.src}
              alt=""
              className={isActive ? slide.animClass : ""}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transformOrigin: "center center",
                willChange: "transform",
              }}
            />
          </Box>
        );
      })}

      {/* Cinematic Dark Vignette & Backdrop Filter */}
      <Box
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(11, 17, 32, 0.45) 0%, rgba(8, 12, 22, 0.78) 60%, rgba(4, 7, 14, 0.94) 100%)",
          backdropFilter: "blur(2.5px)",
          WebkitBackdropFilter: "blur(2.5px)",
          zIndex: 1,
          pointerEvents: "none",
        }}
      />

      {/* Elegant Centered Glassmorphic Login Card */}
      <Box
        style={{
          position: "relative",
          zIndex: 2,
          width: "100%",
          maxWidth: 440,
          margin: "0 20px",
          padding: "40px 36px",
          borderRadius: 24,
          background: "rgba(15, 23, 42, 0.72)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow:
            "0 25px 60px -15px rgba(0, 0, 0, 0.7), 0 0 45px rgba(245, 158, 11, 0.08)",
        }}
      >
        {/* Brand Header */}
        <Box style={{ textAlign: "center", marginBottom: 30 }}>
          <Box
            style={{
              width: 52,
              height: 52,
              borderRadius: 16,
              background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF",
              boxShadow: "0 10px 25px -5px rgba(245, 158, 11, 0.45)",
              marginBottom: 16,
            }}
          >
            <Flame size={30} />
          </Box>

          <Title
            order={2}
            style={{
              color: "#FFFFFF",
              fontWeight: 800,
              fontSize: "1.75rem",
              letterSpacing: "-0.03em",
              marginBottom: 6,
            }}
          >
            {appName}
          </Title>

          <Text size="sm" style={{ color: "#94A3B8" }}>
            Ingresa tus credenciales para acceder al sistema
          </Text>
        </Box>

        {/* Error Alert */}
        {error && (
          <Alert
            icon={<AlertCircle size={18} />}
            color="red"
            variant="filled"
            radius="md"
            mb="lg"
            styles={{
              root: {
                backgroundColor: "rgba(239, 68, 68, 0.15)",
                border: "1px solid rgba(239, 68, 68, 0.3)",
                color: "#FCA5A5",
              },
              message: { color: "#FCA5A5", fontSize: "0.875rem" },
            }}
          >
            {error}
          </Alert>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <Stack gap="md">
            <TextInput
              label="Usuario"
              placeholder="Ingresa tu usuario"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              leftSection={<UserIcon size={18} style={{ color: "#94A3B8" }} />}
              required
              autoFocus
              styles={{
                label: {
                  color: "#E2E8F0",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  marginBottom: 6,
                },
                input: {
                  backgroundColor: "rgba(30, 41, 59, 0.65)",
                  borderColor: "rgba(255, 255, 255, 0.12)",
                  color: "#FFFFFF",
                  borderRadius: 12,
                  height: 46,
                  transition: "all 0.2s ease",
                  "&:focus": {
                    borderColor: "#F59E0B",
                    boxShadow: "0 0 0 2px rgba(245, 158, 11, 0.2)",
                  },
                },
              }}
            />

            <PasswordInput
              label="Contraseña"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftSection={<Lock size={18} style={{ color: "#94A3B8" }} />}
              required
              styles={{
                label: {
                  color: "#E2E8F0",
                  fontWeight: 600,
                  fontSize: "0.85rem",
                  marginBottom: 6,
                },
                input: {
                  backgroundColor: "rgba(30, 41, 59, 0.65)",
                  borderColor: "rgba(255, 255, 255, 0.12)",
                  color: "#FFFFFF",
                  borderRadius: 12,
                  height: 46,
                  transition: "all 0.2s ease",
                  "&:focus": {
                    borderColor: "#F59E0B",
                    boxShadow: "0 0 0 2px rgba(245, 158, 11, 0.2)",
                  },
                },
              }}
            />

            <Button
              type="submit"
              fullWidth
              loading={loading}
              rightSection={!loading && <ArrowRight size={18} />}
              style={{
                marginTop: 8,
                height: 46,
                borderRadius: 12,
                background: "linear-gradient(135deg, #F59E0B 0%, #D97706 100%)",
                fontWeight: 700,
                fontSize: "0.95rem",
                boxShadow: "0 10px 20px -5px rgba(245, 158, 11, 0.4)",
                transition: "transform 0.15s ease, box-shadow 0.15s ease",
              }}
            >
              Iniciar Sesión
            </Button>
          </Stack>
        </form>

        {/* Minimal slide dots navigation */}
        <Box
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 8,
            marginTop: 28,
          }}
        >
          {SLIDES.map((_, idx) => (
            <Box
              key={idx}
              onClick={() => handleSelectSlide(idx)}
              style={{
                width: activeSlide === idx ? 22 : 6,
                height: 6,
                borderRadius: 3,
                backgroundColor:
                  activeSlide === idx
                    ? "#F59E0B"
                    : "rgba(255, 255, 255, 0.25)",
                transition: "all 0.4s ease",
                cursor: "pointer",
              }}
            />
          ))}
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
