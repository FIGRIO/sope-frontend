export type AuthResponse = {
  accessToken: string;
  tokenType?: string;
  username?: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
  role?: string;
};

export type RegisterPayload = {
  username: string;
  email: string;
  password: string;
};

export type PasswordResetResponse = {
  message: string;
  resetLink?: string;
  expiresAt?: string;
};

const AUTH_STORAGE_KEY = "sope_auth";
const TOKEN_STORAGE_KEY = "sope_token";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8080";

export const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? "";

export async function login(username: string, password: string) {
  return postJson<AuthResponse>("/api/auth/login", { username, password });
}

export async function register(payload: RegisterPayload) {
  return postText("/api/auth/register", payload);
}

export async function loginWithGoogle(credential: string) {
  return postJson<AuthResponse>("/api/auth/google", { credential });
}

export async function requestPasswordReset(email: string) {
  return postJson<PasswordResetResponse>("/api/auth/forgot-password", { email });
}

export async function resetPassword(token: string, password: string, confirmPassword: string) {
  return postText("/api/auth/reset-password", { token, password, confirmPassword });
}

export async function getGoogleClientId() {
  const response = await fetch(`${API_BASE_URL}/api/auth/google/client-id`);
  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  const payload = (await response.json()) as { clientId?: string };
  return payload.clientId?.trim() ?? "";
}

export function saveAuth(auth: AuthResponse) {
  if (typeof window === "undefined") return;

  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
  window.localStorage.setItem(TOKEN_STORAGE_KEY, auth.accessToken);
}

export function getStoredAuth(): AuthResponse | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthResponse;
  } catch {
    clearAuth();
    return null;
  }
}

export function getAccessToken() {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function clearAuth() {
  if (typeof window === "undefined") return;

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export function getApiErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  return "Da co loi xay ra. Vui long thu lai.";
}

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.json() as Promise<T>;
}

async function postText(path: string, body: unknown): Promise<string> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return response.text();
}

async function readErrorMessage(response: Response) {
  const fallback = `Request failed with status ${response.status}`;
  const text = await response.text();
  if (!text) return fallback;

  try {
    const payload = JSON.parse(text) as { message?: string; error?: string };
    return payload.message || payload.error || fallback;
  } catch {
    return text;
  }
}
