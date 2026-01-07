// src/auth/microsoftAuth.ts
import { PublicClientApplication } from "@azure/msal-browser";

export const msalInstance = new PublicClientApplication({
    auth: {
        clientId: import.meta.env.VITE_MICROSOFT_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${import.meta.env.VITE_MICROSOFT_TENANT_ID}`,
        redirectUri: window.location.origin,
    },
    cache: {
        cacheLocation: "sessionStorage",
    },
});

let initialized = false;

export const initMsal = async () => {
    console.log("MS Client ID:", import.meta.env.VITE_MICROSOFT_CLIENT_ID);

    if (!initialized) {
        await msalInstance.initialize();
        initialized = true;
    }
};
