import "./styles/index.css";
import "./i18n";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import { MotionConfig } from "motion/react";
import { Toaster, TooltipProvider } from "@app/ui";
import { createKickoffApp } from "@kickoff/kit";

import { config } from "./kickoff/config";
import { scenarios } from "./kickoff/scenarios";
import { screens } from "./kickoff/screens";
import { queryClient } from "./lib/query";

const { App } = createKickoffApp({
  config,
  screens,
  scenarios,
  screenModules: import.meta.glob("./screens/*.tsx"),
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
        <TooltipProvider>
          <App />
          <Toaster position="top-center" richColors closeButton />
        </TooltipProvider>
      </MotionConfig>
    </QueryClientProvider>
  </StrictMode>,
);
