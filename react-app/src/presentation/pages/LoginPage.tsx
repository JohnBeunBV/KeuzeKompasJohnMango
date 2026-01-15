import React, {useState} from "react";
import {useNavigate} from "react-router-dom";
import {useAppDispatch} from "../../application/store/hooks";
import {loginSuccess} from "../../application/Slices/authSlice";
import apiClient from "../../infrastructure/ApiClient";
import {initMsal, isMicrosoftOAuthEnabled, msalInstance} from "../../auth/microsoftAuth";
import "../index.css";
import "../accountdetails.css";

const LoginPage: React.FC = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");

    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const redirectAfterLogin = (user: any) => {
    if (!user.profile?.interests || user.profile.interests.length === 0) {
        navigate("/studentenprofiel");
    } else {
        navigate("/vkms");
    }
    };

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const res = await apiClient.post("/auth/login", { email, password });

            dispatch(
                loginSuccess({
                    token: res.data.token,
                    user: res.data.user,
                })
            );

            const profileRes = await apiClient.get("/auth/me", {
                headers: {
                    Authorization: `Bearer ${res.data.token}`,
                },
            });

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
        try {
            await initMsal();
            const loginResponse = await msalInstance.loginPopup({
                scopes: ["openid", "profile", "email"],
            });

            const idToken = loginResponse.idToken;

            const res = await apiClient.post("/auth/login/oauth/microsoft", { idToken });

            dispatch(
                loginSuccess({
                    token: res.data.token,
                    user: res.data.user,
                })
            );

            const profileRes = await apiClient.get("/auth/me", {
                headers: {
                    Authorization: `Bearer ${res.data.token}`,
                },
            });

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
                    <div className="password-input-wrapper">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Wachtwoord"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="login-input password-input"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="password-toggle-btn"
                            tabIndex={-1}
                        >
                            {showPassword ? (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="#ff8f00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <circle cx="12" cy="12" r="3" stroke="#ff8f00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            ) : (
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="#ff8f00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                    <line x1="1" y1="1" x2="23" y2="23" stroke="#ff8f00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                            )}
                        </button>
                    </div>
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
