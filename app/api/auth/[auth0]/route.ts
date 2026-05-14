import { handleAuth, handleLogin, handleLogout } from "@auth0/nextjs-auth0";

export const GET = handleAuth({
  login: handleLogin({
    authorizationParams: {
      prompt: "login",
      scope: "openid profile email",
    },

    returnTo: "https://gtrac.in:8080",
  }),

  logout: handleLogout((req) => {
    return { returnTo: process.env.AUTH0_BASE_URL };
  }),
});
