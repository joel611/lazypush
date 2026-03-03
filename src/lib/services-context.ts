// src/lib/services-context.ts
import { createContext, useContext } from "solid-js";
import type { ConfigProvider, SendProvider } from "./config-provider";

export interface AppServices {
  config: ConfigProvider;
  send: SendProvider;
}

export const ServicesContext = createContext<AppServices | undefined>(
  undefined
);

export function useServices(): AppServices {
  const ctx = useContext(ServicesContext);
  if (!ctx) {
    throw new Error(
      "useServices must be called inside ServicesContext.Provider"
    );
  }
  return ctx;
}
