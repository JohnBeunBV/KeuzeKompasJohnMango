import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAppDispatch} from "../../application/store/hooks";
import {loginSuccess} from "../../application/Slices/authSlice";
import apiClient from "../../infrastructure/ApiClient";
import {initMsal, isMicrosoftOAuthEnabled, msalInstance} from "../../auth/microsoftAuth";
import "../index.css";

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");

    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const redirectAfterLogin = (user: any) => {
    console.log("✅ redirectAfterLogin called");
    console.log("User profiel:", user.profile);

    if (!user.profile?.interests || user.profile.interests.length === 0) {
        console.log("Interests leeg → ga naar /studentenprofiel");
        navigate("/studentenprofiel");
    } else {
        console.log("Interests aanwezig → ga naar /vkms");
        navigate("/vkms");
    }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log("🔹 handleLogin gestart met email:", email);

        try {
            const res = await apiClient.post("/auth/login", { email, password });
            console.log("Login response:", res.data);

            dispatch(
                loginSuccess({
                    token: res.data.token,
                    user: res.data.user,
                })
            );

            console.log("LoginSuccess dispatched, haal full profile op via /auth/me");

            const profileRes = await apiClient.get("/auth/me", {
                headers: {
                    Authorization: `Bearer ${res.data.token}`,
                },
            });

            console.log("/auth/me response:", profileRes.data);
            const fullUser = profileRes.data;

            dispatch(
                loginSuccess({
                    token: res.data.token,
                    user: fullUser,
                })
            );

            redirectAfterLogin(fullUser);
        } catch (err: any) {
            console.error("Login error:", err);
            setError(err.response?.data?.error || "Login mislukt");
        }
    };

    const handleMicrosoftLogin = async () => {
        console.log("🔹 handleMicrosoftLogin gestart");
        try {
            await initMsal();
            const loginResponse = await msalInstance.loginPopup({
                scopes: ["openid", "profile", "email"],
            });

            const idToken = loginResponse.idToken;
            console.log("MSAL login token:", idToken);

            const res = await apiClient.post("/auth/login/oauth/microsoft", { idToken });
            console.log("Microsoft login response:", res.data);

            dispatch(
                loginSuccess({
                    token: res.data.token,
                    user: res.data.user,
                })
            );

            console.log("LoginSuccess dispatched, haal full profile op via /auth/me");

            const profileRes = await apiClient.get("/auth/me", {
                headers: {
                    Authorization: `Bearer ${res.data.token}`,
                },
            });

            console.log("/auth/me response:", profileRes.data);
            const fullUser = profileRes.data;

            dispatch(
                loginSuccess({
                    token: res.data.token,
                    user: fullUser,
                })
            );

            redirectAfterLogin(fullUser);
        } catch (err) {
            console.error("Microsoft login error:", err);
            setError("Microsoft login mislukt");
        }
    };




    return (
        <div className="login-container">
            <div className="login-card">
                <h2 className="login-title">Welkom terug 👋</h2>
                <p className="login-subtitle">Log in om verder te gaan</p>

                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleLogin} className="login-form">
                    <input
                        type="email"
                        placeholder="E-mailadres"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="login-input"
                        required
                    />
                    <input
                        type="password"
                        placeholder="Wachtwoord"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="login-input"
                        required
                    />
                    <button type="submit" className="login-button">
                        Inloggen
                    </button>
                    <button
                        type="button"
                        className="login-button-microsoft"
                        onClick={handleMicrosoftLogin}
                        disabled={!isMicrosoftOAuthEnabled}
                        title={!isMicrosoftOAuthEnabled ? "OAuth niet geconfigureerd" : ""}
                    >
                        Inloggen met Microsoft
                    </button>

                </form>
            </div>
        </div>
    );
};

export default LoginPage;
