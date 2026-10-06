import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MantineProvider, createTheme } from "@mantine/core";
import "@mantine/core/styles.css";
import "./index.css";
import { App } from "./App";

const theme = createTheme({
  fontFamily: "Roboto, Google Sans, sans-serif",
  fontFamilyMonospace: "JetBrains Mono, Courier, monospace",
  headings: { fontFamily: "Inter, Outfit, sans-serif" },
  primaryColor: "teal",
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <MantineProvider defaultColorScheme="light" theme={theme}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MantineProvider>
  </StrictMode>,
);
