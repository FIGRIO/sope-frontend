"use client";

import Script from "next/script";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  AuthResponse,
  GOOGLE_CLIENT_ID,
  getApiErrorMessage,
  getGoogleClientId,
  loginWithGoogle,
  saveAuth,
} from "@/lib/auth";

type GoogleCredentialResponse = {
  credential?: string;
  select_by?: string;
};

type GoogleButtonConfig = {
  type?: "standard" | "icon";
  theme?: "outline" | "filled_blue" | "filled_black";
  size?: "large" | "medium" | "small";
  text?: "signin_with" | "signup_with" | "continue_with" | "signin";
  shape?: "rectangular" | "pill" | "circle" | "square";
  logo_alignment?: "left" | "center";
  width?: number;
};

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
            ux_mode?: "popup" | "redirect";
            use_fedcm_for_button?: boolean;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: GoogleButtonConfig
          ) => void;
          disableAutoSelect: () => void;
        };
      };
    };
  }
}

type Props = {
  text?: "signin_with" | "signup_with" | "continue_with";
  onSuccess: (auth: AuthResponse) => void;
  onError: (message: string) => void;
};

export default function GoogleSignInButton({
  text = "signin_with",
  onSuccess,
  onError,
}: Props) {
  const buttonRef = useRef<HTMLDivElement | null>(null);
  const [clientId, setClientId] = useState(GOOGLE_CLIENT_ID);
  const [scriptReady, setScriptReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const isConfigured = Boolean(clientId);

  const handleCredential = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (!response.credential) {
        onError("Không nhận được credential từ Google.");
        return;
      }

      setIsLoading(true);
      try {
        const auth = await loginWithGoogle(response.credential);
        saveAuth(auth);
        onSuccess(auth);
      } catch (error) {
        onError(getApiErrorMessage(error));
      } finally {
        setIsLoading(false);
      }
    },
    [onError, onSuccess]
  );

  useEffect(() => {
    if (GOOGLE_CLIENT_ID) return;

    let cancelled = false;

    async function loadClientId() {
      try {
        const runtimeClientId = await getGoogleClientId();
        if (!cancelled) {
          setClientId(runtimeClientId);
        }
      } catch {
        if (!cancelled) {
          setClientId("");
        }
      }
    }

    loadClientId();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!scriptReady || !clientId || !window.google || !buttonRef.current) {
      return;
    }

    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: handleCredential,
      ux_mode: "popup",
      use_fedcm_for_button: false,
    });

    buttonRef.current.innerHTML = "";
    window.google.accounts.id.renderButton(buttonRef.current, {
      theme: "outline",
      size: "large",
      text,
      shape: "rectangular",
      logo_alignment: "left",
      width: Math.min(buttonRef.current.offsetWidth || 360, 400),
    });
  }, [clientId, handleCredential, scriptReady, text]);

  if (!isConfigured) {
    return (
      <button
        type="button"
        onClick={() =>
          onError(
            "Google chưa cấu hình. Hãy thêm GOOGLE_CLIENT_ID cho backend hoặc NEXT_PUBLIC_GOOGLE_CLIENT_ID cho frontend, rồi khởi động lại server."
          )
        }
        className="flex w-full items-center justify-center rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
      >
        Đăng nhập với Google
      </button>
    );
  }

  return (
    <div className="relative min-h-11 w-full">
      <Script
        src="https://accounts.google.com/gsi/client"
        strategy="afterInteractive"
        onReady={() => setScriptReady(true)}
        onError={() => onError("Không tải được Google Sign-In.")}
      />
      <div
        ref={buttonRef}
        className={isLoading ? "pointer-events-none opacity-60" : undefined}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-white/70 text-sm font-semibold text-gray-600">
          Đang xử lý...
        </div>
      )}
    </div>
  );
}
