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

    const handleMicrosoftLogin = async () => {
        try {

            await initMsal();

            const loginResponse = await msalInstance.loginPopup({
                scopes: ["openid", "profile", "email"],
            });

            const idToken = loginResponse.idToken;

            const res = await apiClient.post(
                "/auth/login/oauth/microsoft",
                {idToken}
            );

            dispatch(loginSuccess({
                token: res.data.token,
                user: res.data.user,
            }));

            navigate("/vkms");
        } catch (err) {
            setError("Microsoft login mislukt");
            console.error(err);
        }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await apiClient.post("/auth/login", {
                email,
                password,
            });

            dispatch(
                loginSuccess({
                    token: res.data.token,
                    user: res.data.user,
                })
            );

            navigate("/vkms");
        } catch (err: any) {
            setError(err.response?.data?.error || "Login mislukt");
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
