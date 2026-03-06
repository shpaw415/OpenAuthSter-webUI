import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type Context,
  type JSX,
} from "react";
import { OpenAuthsterClient } from "openauth-webui-shared-types/client/user";
import { createClient } from "@auth";

declare global {
  var __OPENAUTHSTER_CLIENT__: Context<OpenAuthsterClient>;
}

globalThis.__OPENAUTHSTER_CLIENT__ ??= createContext<OpenAuthsterClient>(
  null as any,
);

export function useAuth() {
  const ctx = useContext(globalThis.__OPENAUTHSTER_CLIENT__);
  const _key = useRef(crypto.randomUUID());
  const [state, setState] = useState<string>("");
  useEffect(() => {
    ctx.addInitializationListener(_key.current, () => {
      setState(crypto.randomUUID());
    });
  }, []);

  return ctx || {};
}

export function AuthProvider({ children }: { children: JSX.Element }) {
  const client = useRef(createClient());

  useEffect(() => {
    client.current.addInitializationListener("auth-inited", (c) => {
      c.setTokenToCookie();
    });
    client.current.init();
  }, [client.current.fetch]);

  return (
    <globalThis.__OPENAUTHSTER_CLIENT__.Provider value={client.current}>
      {children}
    </globalThis.__OPENAUTHSTER_CLIENT__.Provider>
  );
}
