import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../infrastructure/ApiClient";

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const navigate = useNavigate();

  // 🔹 Username validatie
  const validateUsername = (username: string) => {
    if (username.length < 3) {
      return "Gebruikersnaam moet minstens 3 tekens bevatten.";
    }
    return null;
  };

  // 🔹 E-mail validatie
  const validateEmail = (email: string) => {
    const emailRegex = /^\S+@\S+\.\S+$/;
    if (!emailRegex.test(email)) {
      return "Ongeldig e-mailadres.";
    }
    return null;
  };

  // 🔹 Wachtwoord validatie
  const validatePassword = (password: string) => {
    const minLength = /.{8,}/;
    const hasUppercase = /[A-Z]/;
    const hasNumber = /\d/;
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/;

    if (!minLength.test(password)) {
      return "Het wachtwoord moet minimaal 8 tekens lang zijn.";
    }
    if (!hasUppercase.test(password)) {
      return "Het wachtwoord moet minstens één hoofdletter bevatten.";
    }
    if (!hasNumber.test(password)) {
      return "Het wachtwoord moet minstens één cijfer bevatten.";
    }
    if (!hasSymbol.test(password)) {
      return "Het wachtwoord moet minstens één symbool bevatten.";
    }
    return null;
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();

    // 🔹 Frontend validatie
    const usernameError = validateUsername(username);
    if (usernameError) {
      setError(usernameError);
      setSuccess("");
      return;
    }

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      setSuccess("");
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      setSuccess("");
      return;
    }

    // 🔹 API request
    try {
      await apiClient.post("/auth/register", { username, email, password });
      setSuccess("Registratie succesvol! Je kan nu inloggen.");
      setError("");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err: any) {
      setError(err.response?.data?.error || "Registratie mislukt");
      setSuccess("");
    }
  };

  return (
    <div className="login-container">
      <div className="register-card">
        <h2 className="register-title">Maak een account aan 🚀</h2>
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}
        <form onSubmit={handleRegister} className="register-form">
          <input
            type="text"
            placeholder="Gebruikersnaam"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="register-input"
            required
          />

          <input
            type="email"
            placeholder="E-mailadres"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="register-input"
            required
          />

          <input
            type="password"
            placeholder="Wachtwoord"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="register-input"
            required
          />

          <button type="submit" className="register-button">
            Registreren
          </button>
        </form>

        <div className="register-footer">
          <p>
            Al een account?{" "}
            <span className="register-link" onClick={() => navigate("/login")}>
              Log hier in
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
