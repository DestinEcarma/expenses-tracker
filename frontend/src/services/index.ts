import { refresh, type AuthResponse } from "./auth";
import { clearAuth, getAuth, setAuth } from "./auth-service";
import type { Nullable } from "@/lib/defs";
import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

interface ApiError<T = unknown> {
	title: string;
	details: string;
	status: number;
	error?: T;
}

type RetriableConfig = InternalAxiosRequestConfig & { _retry?: boolean };
type OnRefreshedResolve = (auth: AuthResponse) => void;
type OnRefreshedReject = (error: ApiError) => void;

const BASE_URL = "/api";
const TIMEOUT_MS = 10_000;

const apiAuthLess = axios.create({ baseURL: BASE_URL, timeout: TIMEOUT_MS });
const api = axios.create({ baseURL: BASE_URL, timeout: TIMEOUT_MS });

let isRefreshing = false;
let subscribers: Array<[OnRefreshedResolve, OnRefreshedReject]> = [];

const onRefreshedResolve = (auth: AuthResponse) => {
	subscribers.forEach((cb) => cb[0](auth));
	subscribers = [];
};

const onRefreshedReject = (error: ApiError) => {
	subscribers.forEach((cb) => cb[1](error));
	subscribers = [];
};

const addSubscriber = (resolve: OnRefreshedResolve, reject: OnRefreshedReject) => {
	subscribers.push([resolve, reject]);
};

const attachAuthHeader = (config: InternalAxiosRequestConfig) => {
	const { tokenType, accessToken } = getAuth() || {};

	if (tokenType && accessToken) {
		config.headers = config.headers ?? {};
		config.headers.Authorization = `${tokenType} ${accessToken}`;
	}

	return config;
};

const normalizeError = async (error: AxiosError<ApiError>): Promise<ApiError | undefined> => {
	if (!error.response) {
		const description = error.message || "Request failed. Check your connection.";

		throw {
			title: "Network Error",
			details: description,
			status: 500,
		};
	}

	if (error.response?.data) {
		throw error.response.data;
	}

	const description = error.message || "Request failed.";

	throw {
		title: "Error",
		details: description,
		status: 500,
	};
};

const authRetryError = async (error: AxiosError<ApiError>) => {
	const original = error.config as RetriableConfig | undefined;

	if (error.response?.status === 401) {
		const alreadyRetried = Boolean(original?._retry);
		const authRoute = original?.url?.includes("/auth/refresh");

		if (!alreadyRetried && !authRoute) {
			try {
				if (!isRefreshing) {
					isRefreshing = true;

					const newAuth = await refresh();

					setAuth(newAuth);
					onRefreshedResolve(newAuth);
				}

				const auth = await new Promise<Nullable<AuthResponse>>((resolve, reject) => {
					if (!isRefreshing) {
						return resolve(getAuth());
					}

					addSubscriber(
						(auth) => resolve(auth),
						(err) => reject(err),
					);
				});

				if (!auth) {
					throw {
						title: "Unauthorized",
						details: "Session expired. Please sign in again.",
						status: 401,
					};
				}

				const retry: RetriableConfig = { ...(original as RetriableConfig), _retry: true };

				retry.headers = retry.headers ?? {};
				retry.headers.Authorization = `${auth.tokenType} ${auth.accessToken}`;

				return api.request(retry);
			} catch (e) {
				clearAuth();
				return Promise.reject<ApiError>(e);
			} finally {
				isRefreshing = false;
			}
		}
	}

	return normalizeError(error);
};

api.interceptors.request.use(async (config) => {
	config = attachAuthHeader(config);

	const { expiresAt } = getAuth() || {};
	const now = Date.now();
	const exp = expiresAt ? new Date(expiresAt).getTime() : 0;

	if (now < exp) {
		return config;
	}

	const configPromise = new Promise<InternalAxiosRequestConfig>((resolve) => {
		addSubscriber(
			(auth) => {
				const cfg = { ...config };

				cfg.headers = cfg.headers ?? {};
				cfg.headers.Authorization = `${auth.tokenType} ${auth.accessToken}`;

				resolve(cfg);
			},
			// Just let the request continue without auth header, it will just fail with 401
			() => resolve(config),
		);
	});

	if (!isRefreshing) {
		isRefreshing = true;

		try {
			const newAuth = await refresh();

			setAuth(newAuth);
			onRefreshedResolve(newAuth);
		} catch (e) {
			clearAuth();
			onRefreshedReject(e as ApiError);
		} finally {
			isRefreshing = false;
		}
	}

	return configPromise;
});

api.interceptors.response.use((res) => res, authRetryError);
apiAuthLess.interceptors.response.use((res) => res, normalizeError);

export { api, apiAuthLess, type ApiError };
