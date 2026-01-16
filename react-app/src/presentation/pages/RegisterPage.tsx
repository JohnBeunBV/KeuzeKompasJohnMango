import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import apiClient from "../../infrastructure/ApiClient";
import "../accountdetails.css";

const RegisterPage: React.FC = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
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

    // 🔹 Wachtwoorden matchen
    if (password !== confirmPassword) {
      setError("Wachtwoorden komen niet overeen!");
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

          <div className="password-input-wrapper">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Wachtwoord"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="register-input password-input"
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

          <div className="password-input-wrapper">
            <input
              type={showConfirmPassword ? "text" : "password"}
              placeholder="Bevestig wachtwoord"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="register-input password-input"
              required
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="password-toggle-btn"
              tabIndex={-1}
            >
              {showConfirmPassword ? (
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
