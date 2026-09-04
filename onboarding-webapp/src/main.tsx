import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "@astryxdesign/core/reset.css";
import "@astryxdesign/theme-neutral/theme.css";
import { Theme } from "@astryxdesign/core/theme";
import { neutralTheme } from "@astryxdesign/theme-neutral/built";
import { App } from "./App";

// Dev-only, dynamic-import-guarded. `import.meta.env.DEV` is statically false
// in a production build, so this branch and the msw chunk are both eliminated.
async function enableMocking(): Promise<void> {
  if (!import.meta.env.DEV || import.meta.env.MODE !== "mock") return;
  const { startMockWorker } = await import("../mock/browser");
  await startMockWorker();
}

void enableMocking().then(() => {
  createRoot(document.getElementById("root")!).render(
    <StrictMode>
      <Theme theme={neutralTheme}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </Theme>
    </StrictMode>,
  );
});
