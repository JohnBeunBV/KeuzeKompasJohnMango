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

    if (!initialized) {
        await msalInstance.initialize();
        initialized = true;
    }
};
export const isMicrosoftOAuthEnabled = Boolean(
    import.meta.env.VITE_MICROSOFT_CLIENT_ID &&
    import.meta.env.VITE_MICROSOFT_TENANT_ID
);

