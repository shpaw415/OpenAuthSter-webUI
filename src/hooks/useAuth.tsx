import {
	createClient,
	type PrivateSessionData,
	type PublicSessionData,
} from "@auth";
import type { OpenAuthsterClient } from "openauth-webui-shared-types/client/user";
import {
	type Context,
	createContext,
	type JSX,
	useContext,
	useEffect,
	useRef,
	useState,
} from "react";

declare global {
	var __OPENAUTHSTER_CLIENT__: Context<
		OpenAuthsterClient<PublicSessionData, PrivateSessionData>
	>;
	var __OPENAUTHSTER_CLIENT_INSTANCE__: OpenAuthsterClient<
		PublicSessionData,
		PrivateSessionData
	>;
}

globalThis.__OPENAUTHSTER_CLIENT__ ??= createContext<
	OpenAuthsterClient<PublicSessionData, PrivateSessionData>
>(null as unknown as OpenAuthsterClient<PublicSessionData, PrivateSessionData>);

export function useAuth() {
	const ctx = useContext(globalThis.__OPENAUTHSTER_CLIENT__);
	const _key = useRef(crypto.randomUUID());
	const [, setState] = useState<string>("");
	useEffect(() => {
		ctx.addInitializationListener(_key.current, () => {
			setState(crypto.randomUUID());
		});
	}, [ctx]);

	return ctx || {};
}

export function AuthProvider({ children }: { children: JSX.Element }) {
	const client = useRef(createClient());

	useEffect(() => {
		globalThis.__OPENAUTHSTER_CLIENT_INSTANCE__ = client.current;

		client.current.addInitializationListener("auth-inited", (c) => {
			// c.setTokenToCookie();
		});
		client.current.init();
	}, []);

	return (
		<globalThis.__OPENAUTHSTER_CLIENT__.Provider value={client.current}>
			{children}
		</globalThis.__OPENAUTHSTER_CLIENT__.Provider>
	);
}
