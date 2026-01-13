import React, {useEffect, useState} from "react";
import apiClient from "../../infrastructure/ApiClient";
import {useNavigate} from "react-router-dom";
import {Modal, Button, Form, Alert, Fade} from "react-bootstrap";
import "../index.css";
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
                            <Form.Control
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                placeholder="Nieuw wachtwoord"
                                className="terminal-input"
                            />
                        </Form.Group>

                        <Form.Group className="mb-4">
                            <Form.Label>Bevestig wachtwoord</Form.Label>
                            <Form.Control
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder="Herhaal wachtwoord"
                                className="terminal-input"
                            />
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
                {/*<div className="favorites-card">*/}
                {/*    <h3 className="terminal-title mb-3">Je favorieten</h3>*/}
                {/*    <hr/>*/}
                {/*    <Fade in={showFavoritesMessage} mountOnEnter unmountOnExit>*/}
                {/*        <div>{favoritesMessage &&*/}
                {/*            <Alert variant={favoritesMessage.type}>{favoritesMessage.text}</Alert>}</div>*/}
                {/*    </Fade>*/}
                {/*    {loading ? (*/}
                {/*        <Spinner animation="border" role="status" className="d-block mx-auto mt-3"/>*/}
                {/*    ) : user.favorites.length === 0 ? (*/}
                {/*        <p className="text-white mt-3">Hier komen je favorieten te staan.</p>*/}
                {/*    ) : (*/}
                {/*        <div className="favorites-list">*/}
                {/*            {user.favorites.map((fav: Vkm) => (*/}
                {/*                <div key={fav._id} className="favorite-item">*/}
                {/*  <span onClick={() => navigate(`/vkms/${fav._id}`)}>*/}
                {/*    {fav.name}*/}
                {/*  </span>*/}

                {/*                    <div className="d-flex align-items-center gap-2">*/}
                {/*                        <span>{fav.studycredit} SP</span>*/}
                {/*                        <button*/}
                {/*                            className="unfavorite-btn"*/}
                {/*                            onClick={(e) => {*/}
                {/*                                e.stopPropagation();*/}
                {/*                                handleRemoveFavorite(fav._id);*/}
                {/*                            }}*/}
                {/*                            style={{background: "none", border: "none", padding: 0, cursor: "pointer"}}*/}
                {/*                        >*/}
                {/*                            <svg*/}
                {/*                                xmlns="http://www.w3.org/2000/svg"*/}
                {/*                                width="20px"*/}
                {/*                                height="20px"*/}
                {/*                                viewBox="0 0 16 16"*/}
                {/*                                fill="none"*/}
                {/*                            >*/}
                {/*                                <path*/}
                {/*                                    d="M1.24264 8.24264L8 15L14.7574 8.24264C15.553 7.44699 16 6.36786 16 5.24264V5.05234C16 2.8143 14.1857 1 11.9477 1C10.7166 1 9.55233 1.55959 8.78331 2.52086L8 3.5L7.21669 2.52086C6.44767 1.55959 5.28338 1 4.05234 1C1.8143 1 0 2.8143 0 5.05234V5.24264C0 6.36786 0.44699 7.44699 1.24264 8.24264Z"*/}
                {/*                                    fill="#000000ff"*/}
                {/*                                />*/}
                {/*                            </svg>*/}
                {/*                        </button>*/}
                {/*                    </div>*/}
                {/*                </div>*/}
                {/*            ))}*/}
                {/*        </div>*/}
                {/*    )}*/}

                {/*    <div className="d-flex align-items-center justify-content-between mt-4">*/}
                {/*        <div className="d-flex align-items-center gap-2 position-relative">*/}
                {/*            <h3 className="terminal-title mb-0">Aanbevolen VKM’s</h3>*/}

                {/*            <button*/}
                {/*                className="info-btn"*/}
                {/*                onMouseEnter={() => setShowXaiModal(true)}*/}
                {/*                onMouseLeave={() => setShowXaiModal(false)}*/}
                {/*                style={{background: "none", border: "none", padding: 0, cursor: "pointer"}}*/}
                {/*            >*/}
                {/*                <svg*/}
                {/*                    xmlns="http://www.w3.org/2000/svg"*/}
                {/*                    fill="#ffc43b"*/}
                {/*                    width="20px"*/}
                {/*                    height="20px"*/}
                {/*                    viewBox="0 0 490.318 490.318"*/}
                {/*                >*/}
                {/*                    <g>*/}
                {/*                        <g>*/}
                {/*                            <g>*/}
                {/*                                <path*/}
                {/*                                    d="M245.148,0C109.967,0,0.009,109.98,0.009,245.162c0,135.182,109.958,245.156,245.139,245.156     c135.186,0,245.162-109.978,245.162-245.156C490.31,109.98,380.333,0,245.148,0z M245.148,438.415     c-106.555,0-193.234-86.698-193.234-193.253c0-106.555,86.68-193.258,193.234-193.258c106.559,0,193.258,86.703,193.258,193.258     C438.406,351.717,351.706,438.415,245.148,438.415z"/>*/}
                {/*                                <path*/}
                {/*                                    d="M270.036,221.352h-49.771c-8.351,0-15.131,6.78-15.131,15.118v147.566c0,8.352,6.78,15.119,15.131,15.119h49.771     c8.351,0,15.131-6.77,15.131-15.119V236.471C285.167,228.133,278.387,221.352,270.036,221.352z"/>*/}
                {/*                                <path*/}
                {/*                                    d="M245.148,91.168c-24.48,0-44.336,19.855-44.336,44.336c0,24.484,19.855,44.34,44.336,44.34     c24.485,0,44.342-19.855,44.342-44.34C289.489,111.023,269.634,91.168,245.148,91.168z"/>*/}
                {/*                            </g>*/}
                {/*                        </g>*/}
                {/*                    </g>*/}
                {/*                </svg>*/}
                {/*            </button>*/}

                {/*            {showXaiModal && (*/}
                {/*                <div*/}
                {/*                    className="xai-hover-box"*/}
                {/*                    onMouseEnter={() => setShowXaiModal(true)}*/}
                {/*                    onMouseLeave={() => setShowXaiModal(false)}*/}
                {/*                >*/}
                {/*                    <div className="xai-header">*/}
                {/*                        <span className="xai-title">Hoe komen deze aanbevelingen tot stand?</span>*/}
                {/*                    </div>*/}

                {/*                    <div className="xai-body" style={{maxWidth: "700px"}}>*/}
                {/*                        /!* Score explanations *!/*/}
                {/*                        <div className="xai-score-explanations mb-3">*/}
                {/*                            <div className="xai-score-item">*/}
                {/*                                <strong>90% en hoger:</strong> Sterke match met jouw interesses, sterk*/}
                {/*                                aanbevolen.*/}
                {/*                            </div>*/}
                {/*                            <div className="xai-score-item">*/}
                {/*                                <strong>75–90%:</strong> Overwegend matchend, maar het kan nuttig zijn*/}
                {/*                                eerst wat extra te onderzoeken.*/}
                {/*                            </div>*/}
                {/*                            <div className="xai-score-item">*/}
                {/*                                <strong>50–75%:</strong> Gedeeltelijk vergelijkbaar; bespreek dit bij*/}
                {/*                                voorkeur eerst met een studiecoach.*/}
                {/*                            </div>*/}
                {/*                            <div className="xai-score-item">*/}
                {/*                                <strong>Onder 50%:</strong> Niet aanbevolen om te kiezen.*/}
                {/*                            </div>*/}
                {/*                        </div>*/}

                {/*                        <hr/>*/}

                {/*                        /!* Original AI weight bars *!/*/}
                {/*                        <div className="xai-section">*/}
                {/*                            <strong>Inhoudsovereenkomst (45%)</strong>*/}
                {/*                            <div className="xai-bar">*/}
                {/*                                <div className="xai-fill" style={{width: "45%"}}/>*/}
                {/*                            </div>*/}
                {/*                            <p>Vergelijkt de inhoud van VKM’s met jouw favorieten. Modules met*/}
                {/*                                vergelijkbare onderwerpen scoren hoger.</p>*/}
                {/*                        </div>*/}

                {/*                        <div className="xai-section">*/}
                {/*                            <strong>Gebruikersprofiel (50%)</strong>*/}
                {/*                            <div className="xai-bar">*/}
                {/*                                <div className="xai-fill" style={{width: "50%"}}/>*/}
                {/*                            </div>*/}
                {/*                            <p>Houdt rekening met jouw studiegedrag, voorkeuren en eerdere keuzes. Dit*/}
                {/*                                is de zwaarst meewegende factor.</p>*/}
                {/*                        </div>*/}

                {/*                        <div className="xai-section">*/}
                {/*                            <strong>Populariteit (5%)</strong>*/}
                {/*                            <div className="xai-bar">*/}
                {/*                                <div className="xai-fill" style={{width: "5%"}}/>*/}
                {/*                            </div>*/}
                {/*                            <p>Modules die vaker door andere studenten gekozen worden, krijgen een*/}
                {/*                                lichte voorkeur.</p>*/}
                {/*                        </div>*/}
                {/*                    </div>*/}
                {/*                </div>*/}
                {/*            )}*/}
                {/*        </div>*/}
                {/*        <button*/}
                {/*            onClick={refreshRecommendations}*/}
                {/*            style={{*/}
                {/*                background: "none",*/}
                {/*                border: "none",*/}
                {/*                padding: 0,*/}
                {/*                cursor: "pointer",*/}
                {/*                display: "flex",*/}
                {/*                alignItems: "center",*/}
                {/*                justifyContent: "center",*/}
                {/*            }}*/}
                {/*        >*/}
                {/*            <svg*/}
                {/*                xmlns="http://www.w3.org/2000/svg"*/}
                {/*                width="30px"*/}
                {/*                height="30px"*/}
                {/*                viewBox="0 0 24 24"*/}
                {/*                fill="none"*/}
                {/*            >*/}
                {/*                <path*/}
                {/*                    d="M21 12C21 16.9706 16.9706 21 12 21C9.69494 21 7.59227 20.1334 6 18.7083L3 16M3 12C3 7.02944 7.02944 3 12 3C14.3051 3 16.4077 3.86656 18 5.29168L21 8M3 21V16M3 16H8M21 3V8M21 8H16"*/}
                {/*                    stroke="#ffc43b" // Bootstrap secondary color, you can change*/}
                {/*                    strokeWidth="2"*/}
                {/*                    strokeLinecap="round"*/}
                {/*                    strokeLinejoin="round"*/}
                {/*                />*/}
                {/*            </svg>*/}
                {/*        </button>*/}
                {/*    </div>*/}

                {/*    <hr/>*/}

                {/*    {loadingRecs ? (*/}
                {/*        <Spinner animation="border" className="d-block mx-auto mt-3"/>*/}
                {/*    ) : recommendations.length === 0 ? (*/}
                {/*        <p className="text mt-3">Geen aanbevelingen beschikbaar.</p>*/}
                {/*    ) : (*/}
                {/*        <div className="recommendations-column-container">*/}
                {/*            {recommendations.map((rec) => {*/}
                {/*                const isExpanded = expandedRec === rec._id;*/}

                {/*                return (*/}
                {/*                    <div key={rec._id} className="terminal-recommendation-item">*/}
                {/*                        /!* Top Row: Clickable Header *!/*/}
                {/*                        <div*/}
                {/*                            className="recommendation-header"*/}
                {/*                            onClick={() => setExpandedRec(isExpanded ? null : rec._id)}*/}
                {/*                        >*/}
                {/*                            <div className="header-info">*/}
                {/*                                <h4 className="m-0" onClick={(e) => {*/}
                {/*                                    e.stopPropagation(); // Link clicks shouldn't toggle the accordion*/}
                {/*                                    navigate(`/vkms/${rec._id}`);*/}
                {/*                                }} style={{cursor: 'pointer', textDecoration: 'underline'}}>*/}
                {/*                                    {rec.name}*/}
                {/*                                </h4>*/}
                {/*                                <span className="match-score">{rec.meta.score}% match</span>*/}
                {/*                            </div>*/}

                {/*                            <button className={`expand-arrow-btn ${isExpanded ? "rotated" : ""}`}>*/}
                {/*                                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"*/}
                {/*                                     xmlns="http://www.w3.org/2000/svg">*/}
                {/*                                    <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor"*/}
                {/*                                          strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>*/}
                {/*                                </svg>*/}
                {/*                            </button>*/}
                {/*                        </div>*/}

                {/*                        /!* Expanded Content *!/*/}
                {/*                        {isExpanded && (*/}
                {/*                            <Fade in={isExpanded}>*/}
                {/*                                <div className="explanation-content">*/}
                {/*                                    <hr className="explanation-divider"/>*/}
                {/*                                    <p>{rec.meta.explanation}</p>*/}
                {/*                                    <Button*/}
                {/*                                        variant="outline-warning"*/}
                {/*                                        size="sm"*/}
                {/*                                        onClick={() => navigate(`/vkms/${rec._id}`)}*/}
                {/*                                    >*/}
                {/*                                        Bekijk volledige details*/}
                {/*                                    </Button>*/}
                {/*                                </div>*/}
                {/*                            </Fade>*/}
                {/*                        )}*/}
                {/*                    </div>*/}
                {/*                );*/}
                {/*            })}*/}
                {/*        </div>*/}
                {/*    )}*/}
                {/*</div>*/}
                {/* end favorites-card */}
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