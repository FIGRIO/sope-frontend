"use client";

import { useEffect } from "react";
import { Toaster, toast } from "react-hot-toast";

export default function PwaRegistration() {
    useEffect(() => {
        if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
            return;
        }

        const isSecureContext =
            window.location.protocol === "https:" || window.location.hostname === "localhost";

        if (!isSecureContext) {
            return;
        }

        const showUpdateToast = () => {
            // Notify users when a new worker has been installed and is waiting to activate.
            toast.custom(
                (t) => (
                    <div className="flex items-center gap-3 rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-sm text-white shadow-lg">
                        <span>Đã có bản cập nhật mới cho SOPE.</span>
                        <button
                            type="button"
                            onClick={() => {
                                toast.dismiss(t.id);
                                window.location.reload();
                            }}
                            className="rounded bg-orange-500 px-2 py-1 font-medium text-white transition hover:bg-orange-400"
                        >
                            Tải lại
                        </button>
                    </div>
                ),
                {
                    duration: 10000,
                    position: "bottom-right",
                }
            );
        };

        const registerServiceWorker = async () => {
            try {
                const registration = await navigator.serviceWorker.register("/sw.js", {
                    scope: "/",
                });

                if (registration.waiting) {
                    showUpdateToast();
                }

                registration.addEventListener("updatefound", () => {
                    const installingWorker = registration.installing;

                    if (!installingWorker) {
                        return;
                    }

                    installingWorker.addEventListener("statechange", () => {
                        if (
                            installingWorker.state === "installed" &&
                            navigator.serviceWorker.controller
                        ) {
                            showUpdateToast();
                        }
                    });
                });
            } catch (error) {
                console.error("Service worker registration failed:", error);
            }
        };

        void registerServiceWorker();
    }, []);

    return <Toaster />;
}
