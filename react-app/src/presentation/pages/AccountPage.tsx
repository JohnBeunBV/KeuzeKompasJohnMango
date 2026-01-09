import React, { useEffect, useState } from "react";
import apiClient from "../../infrastructure/ApiClient";
import { useNavigate } from "react-router-dom";
import { Modal, Button, Form, Alert, Fade, Spinner } from "react-bootstrap";
import "../index.css";

interface VkmFavorite {
  id: string;
  name: string;
  studycredit: number;
}

interface VkmRecommendation {
  id: string;
  name: string;
  studycredit: number;
}

interface UserData {
  username: string;
  email: string;
  favorites: VkmFavorite[];
}

const AccountPage: React.FC = () => {
  const [userData, setUserData] = useState<UserData>({
    username: "",
    email: "",
    favorites: [],
  });
  const [usernameInput, setUsernameInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [recommendations, setRecommendations] = useState<VkmRecommendation[]>([]);
  const [originalUsername, setOriginalUsername] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState<{ text: string; type: "success" | "danger" } | null>(null);
  const [showMessage, setShowMessage] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingRecs, setLoadingRecs] = useState(true);

  const navigate = useNavigate();

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

  // 🔹 Haal gebruiker en favorieten op
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await apiClient.get("/auth/me");
        const data: UserData = res.data;

        setUserData({
          username: data.username || "",
          email: data.email || "",
          favorites: data.favorites || [],
        });

        setOriginalUsername(data.username || "");
        setOriginalEmail(data.email || "");
        setUsernameInput(data.username || "");
        setEmailInput(data.email || "");
      } catch (err: any) {
        if (err.response?.status === 401) {
          localStorage.removeItem("token");
          navigate("/error", { state: { status: 401, message: "Je bent niet ingelogd." } });
        } else {
          navigate("/error", { state: { status: 500, message: err.response?.data?.error || "Er is iets misgegaan" } });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [navigate]);

  // 🔹 Haal aanbevelingen op
  useEffect(() => {
    if (!userData.favorites.length) {
      setLoadingRecs(false);
      return;
    }

    const fetchRecommendations = async () => {
      try {
        const res = await apiClient.get("/auth/recommendations");
        setRecommendations(res.data.recommendations || []);
      } catch (err) {
        console.error("Kon recommendations niet ophalen:", err);
      } finally {
        setLoadingRecs(false);
      }
    };
    fetchRecommendations();
  }, [userData.favorites]);

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
      setMessage({ text: usernameError, type: "danger" });
      return;
    }

    if (emailError) {
      setMessage({ text: emailError, type: "danger" });
      return;
    }

    if (newPassword && newPassword !== confirmPassword) {
      setMessage({ text: "Wachtwoorden komen niet overeen!", type: "danger" });
      return;
    }

    if (newPassword) {
      const validationError = validatePassword(newPassword);
      if (validationError) {
        setMessage({ text: validationError, type: "danger" });
        return;
      }
    }

    const nothingChanged =
      usernameInput === originalUsername &&
      emailInput === originalEmail &&
      newPassword === "";
    if (nothingChanged) {
      setMessage({ text: "Er zijn geen wijzigingen om op te slaan.", type: "danger" });
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

      setUserData({
        username: updatedData.username || "",
        email: updatedData.email || "",
        favorites: updatedData.favorites || [],
      });

      setOriginalUsername(updatedData.username || "");
      setOriginalEmail(updatedData.email || "");
      setUsernameInput(updatedData.username || "");
      setEmailInput(updatedData.email || "");
      setNewPassword("");
      setConfirmPassword("");
      setMessage({ text: "Gegevens succesvol bijgewerkt!", type: "success" });

    localStorage.setItem("user", JSON.stringify({ username: updatedData.username }));
    window.dispatchEvent(new Event("loginSuccess"));
    } catch (err: any) {
      if (err.response?.status === 401) {
        localStorage.removeItem("token");
        navigate("/error", { state: { status: 401, message: "Je bent niet ingelogd." } });
      } else {
        setMessage({ text: err.response?.data?.error || "Er ging iets mis bij het bijwerken.", type: "danger" });
      }
    }
  };

const handleDelete = async () => {
  try {
    await apiClient.delete("/auth/me");
    localStorage.removeItem("token");

    // Event dispatchen zodat navbar kan luisteren en updaten
    window.dispatchEvent(new Event("logout"));

    // Navigeren naar error page met custom message
    navigate("/error", { 
      state: { 
        status: 401, 
        message: "Je account is permanent verwijderd." 
      } 
    });
  } catch (err: any) {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      window.dispatchEvent(new Event("logout"));
      navigate("/error", { state: { status: 401, message: "Je bent niet ingelogd." } });
    } else {
      setMessage({ text: err.response?.data?.error || "Verwijderen mislukt.", type: "danger" });
    }
  } finally {
    setShowDeleteModal(false);
  }
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

        <div className="favorites-card">
          <h3 className="terminal-title mb-3">Je favorieten</h3>
          <hr />
          {loading ? (
            <Spinner animation="border" role="status" className="d-block mx-auto mt-3" />
          ) : userData.favorites.length === 0 ? (
            <p className="text-white mt-3">Hier komen uw favorieten te staan!</p>
          ) : (
            <div className="favorites-list">
              {userData.favorites.map((fav) => (
                <div
                  key={fav.id}
                  className="favorite-item"
                  onClick={() => navigate(`/vkms/${fav.id}`)}
                >
                  <span>{fav.name}</span>
                  <span>{fav.studycredit} SP</span>
                </div>
              ))}
            </div>
          )}

          <h3 className="terminal-title mt-4 mb-3">Aanbevolen VKM’s</h3>
          <hr />
          {loadingRecs ? (
            <Spinner animation="border" className="d-block mx-auto mt-3" />
          ) : recommendations.length === 0 ? (
            <p className="text mt-3">Geen aanbevelingen beschikbaar.</p>
          ) : (
            <div className="card-container">
              {recommendations.map((rec) => (
                <div
                  key={rec.id}
                  className="terminal-vkm-card"
                  onClick={() => navigate(`/vkms/${rec.id}`)}
                >
                  <h4>{rec.name}</h4>
                  <p className="mb-0">{rec.studycredit} SP</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Verwijder account</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Weet je zeker dat je dit account wilt verwijderen?  
          <br />Dit kan <strong>niet ongedaan</strong> worden gemaakt.
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Annuleren
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Verwijder account
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default AccountPage;
