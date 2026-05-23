"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { checkAuthValidity } from "../../_utils/authValidator";

export const AuthGuard = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/auth/login" || pathname.startsWith("/auth/")) {
      return;
    }

    if (!checkAuthValidity()) {
      localStorage.clear();
      router.push("/");
    }
  }, [pathname, router]);

  useEffect(() => {
    const handleFocus = () => {
      if (pathname !== "/auth/login" && !pathname.startsWith("/auth/")) {
        if (!checkAuthValidity()) {
          localStorage.clear();
          router.push("/");
        }
      }
    };

    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, [pathname, router]);

  return <>{children}</>;
};
