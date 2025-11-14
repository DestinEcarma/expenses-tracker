import { api, apiAuthLess } from ".";
import { clearAuth, getAuth } from "./auth-service";

interface AuthResponse {
	accessToken: string;
	refreshToken: string;
	tokenType: string;
	expiresAt: string;
}

async function signIn(username: string, password: string): Promise<AuthResponse> {
	return apiAuthLess.post("/auth/sign-in", { username, password }).then((response) => response.data);
}

async function signUp(email: string, username: string, password: string): Promise<AuthResponse> {
	return apiAuthLess.post("/auth/sign-up", { email, username, password }).then((response) => response.data);
}

function signOut() {
	clearAuth();
}

async function refresh(): Promise<AuthResponse> {
	const { tokenType, refreshToken } = getAuth() || {};

	if (!tokenType || !refreshToken) {
		throw {
			title: "Unauthorized",
			details: "No refresh token available. Please sign in again.",
			status: 401,
		};
	}

	return apiAuthLess
		.post("/auth/refresh", null, {
			headers: { Authorization: `${tokenType} ${refreshToken}` },
		})
		.then((response) => response.data);
}

async function me(): Promise<null> {
	return api.get("/auth/me").then((response) => response.data);
}

export { signIn, signUp, signOut, refresh, me, type AuthResponse };
