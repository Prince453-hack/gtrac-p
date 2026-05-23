import { useRouter } from "next/navigation";

export const checkAuthValidity = () => {
  if (typeof window === "undefined") return true;

  const passwordChangedAt = localStorage.getItem("password_changed_at");
  const userInfo = localStorage.getItem("userInfo");
  const authToken = localStorage.getItem("authToken");
  const usernamePassword = localStorage.getItem("username-password");

  if (passwordChangedAt) {
    localStorage.clear();
    return false;
  }

  if (!userInfo || !authToken || !usernamePassword) {
    return false;
  }

  return true;
};

export const forceLogoutIfInvalid = () => {
  if (!checkAuthValidity()) {
    localStorage.clear();
    window.location.href = "/auth/login";
  }
};

// Hook for components to check auth on mount/navigation
export const useAuthValidator = () => {
  const router = useRouter();

  const validateAndRedirect = () => {
    if (!checkAuthValidity()) {
      localStorage.clear();
      router.push("/");
    }
  };

  return validateAndRedirect;
};
