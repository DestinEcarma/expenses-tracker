import type { Nullable } from "@/lib/defs";
import type { AuthResponse } from "@/services/auth";
import {
	getAuth,
	getStorageType,
	setAuth as setAuthService,
	setStoragePreference,
	subscribe,
	StorageType,
} from "@/services/auth-service";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

interface AuthProviderState {
	auth: Nullable<AuthResponse>;
	storeAt: Nullable<StorageType>;
	setAuth: (auth: Nullable<AuthResponse>) => void;
	setStoreAt: (where: Nullable<StorageType>) => void;
}

const AuthContext = createContext<AuthProviderState | undefined>(undefined);

function AuthProvider({ children }: React.PropsWithChildren) {
	const [auth, setAuth] = useState<Nullable<AuthResponse>>(() => getAuth());
	const [storeAt, setStoreAtState] = useState<Nullable<StorageType>>(() => getStorageType());

	useEffect(() => {
		if (auth) {
			setAuthService(auth, storeAt);
		}
	}, [auth, storeAt]);

	useEffect(() => {
		return subscribe(setAuth);
	}, []);

	const setStoreAt = (where: Nullable<StorageType>) => {
		setStoreAtState(where);
		setStoragePreference(where);
	};

	const value = useMemo(() => ({ auth, setAuth, setStoreAt, storeAt }), [auth, storeAt]);

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

function useAuth() {
	const ctx = useContext(AuthContext);

	if (!ctx) throw new Error("useAuth must be used within an AuthProvider");

	return ctx;
}

export { AuthProvider, useAuth };
