import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import "../index.css";
import "../accountpage.css";

const Layout: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const navigate = useNavigate();

  // 🔹 Helperfunctie om gebruiker uit token of localStorage te halen
  const loadUserFromToken = () => {
    const token = localStorage.getItem("token");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserName(
          payload.username ||
            JSON.parse(localStorage.getItem("user") || "{}").username ||
            null
        );
      } catch {
        setUserName(null);
      }
    } else {
      setUserName(null);
    }
  };

  useEffect(() => {
    // Bij mount
    loadUserFromToken();

    // Event listeners voor login/logout
    const onLogin = () => loadUserFromToken();
    const onLogout = () => setUserName(null);

    window.addEventListener("loginSuccess", onLogin);
    window.addEventListener("logout", onLogout);

    return () => {
      window.removeEventListener("loginSuccess", onLogin);
      window.removeEventListener("logout", onLogout);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUserName(null);
    window.dispatchEvent(new Event("logout"));
    navigate("/login");
  };

  return (
    <>
      {/* Navbar */}
      <header className="navbar layout-navbar">
        <div className="nav-left">
          <div className="logo-wrapper" onClick={() => navigate("/")}>
            <img
              src="/john-mango.png"
              alt="John Mango"
              className="nav-logo-image"
            />
            <span className="logo-text">John Mango</span>
          </div>

          <nav className="nav-links">
            <Link to="/" className="nav-link">
              Home
            </Link>
            <Link to="/vkms" className="nav-link">
              VKM Lijst
            </Link>
            <Link to="/about" className="nav-link">
              About
            </Link>
          </nav>
        </div>

        <div className="nav-right">
          {userName ? (
            <>
              <span className="welcome-text">
                Welkom!:{" "}
                <span
                  className="user-name-link"
                  onClick={() => navigate("/account")}
                >
                  {userName}
                </span>
              </span>
              <button className="nav-btn logout" onClick={handleLogout}>
                Uitloggen
              </button>
            </>
          ) : (
            <>
              <button className="nav-btn" onClick={() => navigate("/login")}>
                Inloggen
              </button>
              <button
                className="nav-btn register"
                onClick={() => navigate("/register")}
              >
                Registreren
              </button>
            </>
          )}
        </div>
      </header>

      {/* Pagina content */}
      <main className="container my-4">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="footer text-center p-3">
        <p>© {new Date().getFullYear()} John Mango. Alle rechten voorbehouden.</p>
      </footer>
    </>
  );
};

export default Layout;
