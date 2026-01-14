import React, {useEffect, useState} from "react";
import apiClient from "../../infrastructure/ApiClient";
import {useNavigate} from "react-router-dom";
import {Modal, Button, Form, Alert, Fade} from "react-bootstrap";
import "../index.css";
import "../accountdetails.css";
import {fetchUser, logout} from "../../application/Slices/authSlice.ts";
import {useAppDispatch, useAppSelector} from "../../application/store/hooks.ts";
import {AccountSection} from "../components/AccountSection.tsx";
import AccountDrawer from "../components/AccountDrawer.tsx";

interface VkmFavorite {
    id: number;
    name: string;
    studycredit: number;
}

interface UserData {
    _id: string;
    username: string;
    email: string;
    favorites: VkmFavorite[];
}

const AccountPage: React.FC = () => {

    const {status, user} = useAppSelector((s) => s.auth);

    const [usernameInput, setUsernameInput] = useState("");
    const [emailInput, setEmailInput] = useState("");
    const [usernameError, setUsernameError] = useState<string | null>(null);
    const [emailError, setEmailError] = useState<string | null>(null);
    const [originalUsername, setOriginalUsername] = useState("");
    const [originalEmail, setOriginalEmail] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [message, setMessage] = useState<{ text: string; type: "success" | "danger" } | null>(null);
    const [showMessage, setShowMessage] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    // 🔹 Validatie functies
    const validateUsername = (username: string) => {
        if (username.length < 3) return "Gebruikersnaam moet minstens 3 tekens bevatten.";
        return null;
    };

    const validateEmail = (email: string) => {
        const emailRegex = /^\S+@\S+\.\S+$/;
        if (!emailRegex.test(email)) return "Ongeldig e-mailadres.";
        return null;
    };

    const validatePassword = (password: string) => {
        const minLength = /.{8,}/;
        const hasUppercase = /[A-Z]/;
        const hasNumber = /\d/;
        const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/;

        if (!minLength.test(password)) return "Het wachtwoord moet minimaal 8 tekens lang zijn.";
        if (!hasUppercase.test(password)) return "Het wachtwoord moet minstens één hoofdletter bevatten.";
        if (!hasNumber.test(password)) return "Het wachtwoord moet minstens één cijfer bevatten.";
        if (!hasSymbol.test(password)) return "Het wachtwoord moet minstens één symbool bevatten.";
        return null;
    };

    // Fetch user data
    useEffect(() => {
        if (status === "idle") {
            dispatch(fetchUser());
        }
    }, [status, dispatch]);

    useEffect(() => {
        if (status === "authenticated") {
            if(user) {
                setEmailInput(user.email);
                setUsernameInput(user.username);
            }
        }
    }, [status]);

    // 🔹 Toon melding en fade automatisch weg
    useEffect(() => {
        if (message) {
            setShowMessage(true);
            const timer = setTimeout(() => setShowMessage(false), 2700);
            const clearTimer = setTimeout(() => setMessage(null), 3000);
            return () => {
                clearTimeout(timer);
                clearTimeout(clearTimer);
            };
        }
    }, [message]);

    // 🔹 Live validatie tijdens typen
    useEffect(() => {
        setUsernameError(validateUsername(usernameInput));
    }, [usernameInput]);

    useEffect(() => {
        setEmailError(validateEmail(emailInput));
    }, [emailInput]);



    const handleUpdate = async () => {
        // 🔹 Frontend validatie
        if (usernameError) {
            setMessage({text: usernameError, type: "danger"});
            return;
        }

        if (emailError) {
            setMessage({text: emailError, type: "danger"});
            return;
        }

        if (newPassword && newPassword !== confirmPassword) {
            setMessage({text: "Wachtwoorden komen niet overeen!", type: "danger"});
            return;
        }

        if (newPassword) {
            const validationError = validatePassword(newPassword);
            if (validationError) {
                setMessage({text: validationError, type: "danger"});
                return;
            }
        }

        const nothingChanged =
            usernameInput === originalUsername &&
            emailInput === originalEmail &&
            newPassword === "";
        if (nothingChanged) {
            setMessage({text: "Er zijn geen wijzigingen om op te slaan.", type: "danger"});
            return;
        }

        // 🔹 API call en backend errors tonen
        try {
            await apiClient.put("/auth/me", {
                username: usernameInput,
                email: emailInput,
                password: newPassword || undefined,
            });

            const res = await apiClient.get("/auth/me");
            const updatedData: UserData = res.data;


            setOriginalUsername(updatedData.username || "");
            setOriginalEmail(updatedData.email || "");
            setUsernameInput(updatedData.username || "");
            setEmailInput(updatedData.email || "");
            setNewPassword("");
            setConfirmPassword("");
            setMessage({text: "Gegevens succesvol bijgewerkt!", type: "success"});

            localStorage.setItem("user", JSON.stringify({username: updatedData.username}));
            window.dispatchEvent(new Event("loginSuccess"));
        } catch (err: any) {
            if (err.response?.status === 401) {
                localStorage.removeItem("token");
                navigate("/error", {state: {status: 401, message: "Je bent niet ingelogd."}});
            } else {
                setMessage({text: err.response?.data?.error || "Er ging iets mis bij het bijwerken.", type: "danger"});
            }
        }
    };

    const handleDelete = async () => {
        await apiClient.delete("/auth/me");

        dispatch(logout());
        navigate("/login");
    };


    return (
        <div className="terminal-container text-light p-4">
            <div className="account-flex-container">
                <div className="account-card p-4">
                    <h2 className="terminal-title mb-3">Account Configurator</h2>
                    <p className="terminal-subtext">Beheer je gebruikersinstellingen hieronder.</p>

                    <Fade in={showMessage} mountOnEnter unmountOnExit>
                        <div>{message && <Alert variant={message.type}>{message.text}</Alert>}</div>
                    </Fade>

                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Gebruikersnaam</Form.Label>
                            <Form.Control
                                value={usernameInput}
                                onChange={(e) => setUsernameInput(e.target.value)}
                                placeholder="Voer je gebruikersnaam in"
                                className="terminal-input"
                            />
                            {usernameError && <small className="text-danger">{usernameError}</small>}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                placeholder="Voer je email in"
                                className="terminal-input"
                            />
                            {emailError && <small className="text-danger">{emailError}</small>}
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Nieuw wachtwoord</Form.Label>
                            <div className="password-input-wrapper">
                                <Form.Control
                                    type={showPassword ? "text" : "password"}
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Nieuw wachtwoord"
                                    className="terminal-input password-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="password-toggle-btn account-password-toggle"
                                    tabIndex={-1}
                                >
                                    {showPassword ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label>Bevestig wachtwoord</Form.Label>
                            <div className="password-input-wrapper">
                                <Form.Control
                                    type={showConfirmPassword ? "text" : "password"}
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Herhaal wachtwoord"
                                    className="terminal-input password-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    className="password-toggle-btn account-password-toggle"
                                    tabIndex={-1}
                                >
                                    {showConfirmPassword ? (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    ) : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                            <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                            <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    )}
                                </button>
                            </div>
                        </Form.Group>

                        <div className="d-flex justify-content-between">
                            <Button variant="warning" onClick={handleUpdate}>
                                Gegevens opslaan
                            </Button>
                            <Button variant="danger" onClick={() => setShowDeleteModal(true)}>
                                Account verwijderen
                            </Button>
                        </div>
                    </Form>
                </div>

                <AccountSection>
                    <AccountDrawer />
                </AccountSection>
                
            </div>
            {/* end account-flex-container */}

            <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Account verwijderen</Modal.Title>
                </Modal.Header>

                <Modal.Body>
                    <p>Weet je zeker dat je je account permanent wilt verwijderen? Deze actie kan niet ongedaan gemaakt
                        worden.</p>
                </Modal.Body>

                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
                        Annuleren
                    </Button>
                    <Button variant="danger" onClick={handleDelete}>
                        Verwijderen
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
};

export default AccountPage;