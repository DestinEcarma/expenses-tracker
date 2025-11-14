import type { AuthResponse } from "./auth";
import { isBrowser, type Nullable } from "@/lib/defs";

const AUTH_STORAGE = "auth";

enum StorageType {
	Local,
	Session,
}

type Subscriber = (auth: Nullable<AuthResponse>) => void;

const safeStorage = {
	get local() {
		try {
			return isBrowser ? window.localStorage : undefined;
		} catch {
			return undefined;
		}
	},
	get session() {
		try {
			return isBrowser ? window.sessionStorage : undefined;
		} catch {
			return undefined;
		}
	},
};

function readInitial(): { auth: Nullable<AuthResponse>; where: Nullable<StorageType> } {
	const parse = (raw: Nullable<string>) => {
		if (!raw) {
			return null;
		}

		try {
			return JSON.parse(raw) as AuthResponse;
		} catch {
			return null;
		}
	};

	const localAuth = parse(safeStorage.local?.getItem(AUTH_STORAGE) ?? null);

	if (localAuth) {
		return { auth: localAuth, where: StorageType.Local };
	}

	const sessionAuth = parse(safeStorage.session?.getItem(AUTH_STORAGE) ?? null);

	if (sessionAuth) {
		return { auth: sessionAuth, where: StorageType.Session };
	}

	return { auth: null, where: null };
}

let { auth: currentAuth, where: storageType }: { auth: Nullable<AuthResponse>; where: Nullable<StorageType> } =
	readInitial();

let subs: Subscriber[] = [];
const notify = () => subs.forEach((fn) => fn(currentAuth));

const bc = isBrowser && "BroadcastChannel" in window ? new BroadcastChannel("auth") : null;

bc?.addEventListener("message", (ev: MessageEvent) => {
	if (!ev?.data || typeof ev.data !== "object") {
		return;
	}

	const { type, payload } = ev.data as { type: "set" | "clear"; payload?: AuthResponse };

	if (type === "clear") {
		currentAuth = null;
		storageType = null;
		notify();
	} else if (type === "set" && payload) {
		currentAuth = payload;
		notify();
	}
});

if (isBrowser) {
	window.addEventListener("storage", (e) => {
		if (e.key !== AUTH_STORAGE) {
			return;
		}

		currentAuth = e.newValue ? (JSON.parse(e.newValue) as AuthResponse) : null;

		notify();
	});
}

function subscribe(fn: Subscriber): () => void {
	subs.push(fn);

	return () => {
		subs = subs.filter((s) => s !== fn);
	};
}

function setAuth(auth: AuthResponse, storeAt?: Nullable<StorageType>) {
	currentAuth = auth;
	storageType = storeAt ?? storageType ?? StorageType.Session;

	const raw = JSON.stringify(auth);

	if (storageType === StorageType.Local) {
		safeStorage.local?.setItem(AUTH_STORAGE, raw);
		safeStorage.session?.removeItem(AUTH_STORAGE);
	} else {
		safeStorage.session?.setItem(AUTH_STORAGE, raw);
		safeStorage.local?.removeItem(AUTH_STORAGE);
	}

	bc?.postMessage({ type: "set", payload: auth });
	notify();
}

function setStoragePreference(storeAt: Nullable<StorageType>) {
	storageType = storeAt;

	if (currentAuth) {
		setAuth(currentAuth, storeAt);
	}
}

function getAuth(): Nullable<AuthResponse> {
	return currentAuth;
}

function getStorageType(): Nullable<StorageType> {
	return storageType;
}

function clearAuth() {
	currentAuth = null;
	safeStorage.local?.removeItem(AUTH_STORAGE);
	safeStorage.session?.removeItem(AUTH_STORAGE);
	storageType = null;

	bc?.postMessage({ type: "clear" });
	notify();
}

export { getAuth, getStorageType, setAuth, setStoragePreference, clearAuth, subscribe, StorageType, AUTH_STORAGE };
