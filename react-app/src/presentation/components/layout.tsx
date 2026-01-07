import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, Link } from "react-router-dom";
import "../index.css";

const Layout: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const navigate = useNavigate();
  const [roles, setRoles] = useState<string[]>([]);

  // 🔹 Helperfunctie om gebruiker uit token of localStorage te halen
  const loadUserFromToken = () => {
    const token = localStorage.getItem("token");

    if (!token) {
      setUserName(null);
      setRoles([]);
      return;
    }

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));

      const storedUser = JSON.parse(localStorage.getItem("user") || "{}");

      setUserName(
          payload.username ||
          storedUser.username ||
          payload.email ||
          null
      );

      setRoles(Array.isArray(payload.roles) ? payload.roles : []);
    } catch {
      setUserName(null);
      setRoles([]);
    }
  };


  useEffect(() => {
    // Bij mount
    loadUserFromToken();

    // Event listeners voor login/logout
    const onLogin = () => loadUserFromToken();
    const onLogout = () => {
      setUserName(null);
      setRoles([]);
    };
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
    setRoles([]);
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
            <Link to="/" className="nav-link">Home</Link>
            <Link to="/vkms" className="nav-link">VKM Lijst</Link>
            <Link to="/swipe" className="nav-link">Swipe</Link>
            <Link to="/about" className="nav-link">About</Link>

            {userName && roles.includes("teacher") && (
                <Link to="/teacher" className="nav-link role-link teacher">
                  Teacher
                </Link>
            )}

            {userName && roles.includes("admin") && (
                <Link to="/admin" className="nav-link role-link admin">
                  Admin
                </Link>
            )}
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
