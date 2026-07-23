import { API_BASE_URL, getAccessToken } from "./auth";
import { parseJsonResponse } from "./api-response";

export type AdminUserRole = "ROLE_USER" | "ROLE_ADMIN";

export type AdminUserResponse = {
  id: number;
  username: string;
  email: string;
  role: AdminUserRole;
  enabled: boolean;
};

const ADMIN_USERS_PATH = "/api/admin/users";

export async function getAdminUsers() {
  return requestJson<AdminUserResponse[]>(ADMIN_USERS_PATH);
}

export async function updateAdminUserRole(userId: number, role: AdminUserRole) {
  return requestJson<AdminUserResponse>(`${ADMIN_USERS_PATH}/${userId}/role`, {
    method: "PUT",
    body: JSON.stringify({ role }),
  });
}

export async function lockAdminUser(userId: number) {
  return requestJson<AdminUserResponse>(`${ADMIN_USERS_PATH}/${userId}/lock`, {
    method: "PUT",
  });
}

export async function unlockAdminUser(userId: number) {
  return requestJson<AdminUserResponse>(`${ADMIN_USERS_PATH}/${userId}/unlock`, {
    method: "PUT",
  });
}

async function requestJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAccessToken();

  if (!token) {
    throw new Error("Không tìm thấy phiên đăng nhập Admin.");
  }

  const headers = new Headers(init.headers);
  headers.set("Content-Type", "application/json");
  headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return parseJsonResponse<T>(response);
}

async function readErrorMessage(response: Response) {
  const fallback = `Request failed with status ${response.status}`;
  const text = await response.text();

  if (!text) return fallback;

  try {
    const payload = JSON.parse(text) as {
      message?: string;
      error?: string;
    };

    return payload.message || payload.error || fallback;
  } catch {
    return text;
  }
}
