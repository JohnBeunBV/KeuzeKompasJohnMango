import React from "react";
import {Outlet, useNavigate, Link} from "react-router-dom";
import {useAppDispatch, useAppSelector} from "../../application/store/hooks";
import {logout} from "../../application/Slices/authSlice";
import "../index.css";
import "../accountpage.css";

const Layout: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const {isAuthenticated, user} = useAppSelector((state) => state.auth);

    const roles = user?.roles ?? [];
    const userName = user?.username ?? user?.email ?? null;

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    return (
        <>
            <header className="navbar layout-navbar">
                <div className="nav-left">
                    <div className="logo-wrapper" onClick={() => navigate("/")}>
                        <img src="/john-mango.png" alt="John Mango" className="nav-logo-image"/>
                        <span className="logo-text">John Mango</span>
                    </div>

                    <nav className="nav-links">
                        <Link to="/" className="nav-link">Home</Link>
                        <Link to="/vkms" className="nav-link">VKM Lijst</Link>
                        <Link to="/swipe" className="nav-link">Swipe</Link>
                        <Link to="/about" className="nav-link">About</Link>

                        <Link to="/studentenprofiel" className="nav-link">
                            Studentenprofiel
                        </Link>
                        {roles.includes("teacher") && (
                            <Link to="/teacher" className="nav-link role-link teacher">
                                Teacher
                            </Link>
                        )}

                        {roles.includes("admin") && (
                            <Link to="/admin" className="nav-link role-link admin">
                                Admin
                            </Link>
                        )}
                    </nav>
                </div>

                <div className="nav-right">
                    {isAuthenticated && userName ? (
                        <>
              <span className="welcome-text">
                Welkom:&nbsp;
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

            <main className="container my-4">
                <Outlet/>
            </main>

            <footer className="footer text-center p-3">
                <p>© {new Date().getFullYear()} John Mango. Alle rechten voorbehouden.</p>
            </footer>
        </>
    );
};

export default Layout;
