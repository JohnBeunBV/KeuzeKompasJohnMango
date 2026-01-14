import React from "react";
import {Outlet, useNavigate, Link} from "react-router-dom";
import {useAppDispatch, useAppSelector} from "../../application/store/hooks";
import {logout} from "../../application/Slices/authSlice";
import "../index.css";
import "../accountpage.css";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { Modal } from "react-bootstrap";


const Layout: React.FC = () => {
    const navigate = useNavigate();
    const dispatch = useAppDispatch();

    const {isAuthenticated, user} = useAppSelector((state) => state.auth);

    const roles = user?.roles ?? [];
    const userName = user?.username ?? user?.email ?? null;

    const location = useLocation();
    const [showForceModal, setShowForceModal] = useState(false);

    const interests = user?.profile?.interests ?? [];
    const values = user?.profile?.values ?? [];
    const goals = user?.profile?.goals ?? [];

    const isProfileComplete =
        interests.length > 0 &&
        values.length > 0 &&
        goals.length > 0;

    const token = useAppSelector((state) => state.auth.token);

    const isTokenExpired = (token?: string | null): boolean => {
        if (!token) return true;
        try {
            const payload = JSON.parse(atob(token.split(".")[1]));
            return payload.exp * 1000 < Date.now();
        } catch {
            return true;
        }
    };

    const isPublicRoute =
    location.pathname.startsWith("/login") ||
    location.pathname.startsWith("/register") ||
    location.pathname.startsWith("/error");
   

    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    useEffect(() => {
        const shouldForceProfile =
            isAuthenticated &&
            !isTokenExpired(token) &&
            !isProfileComplete &&
            !isPublicRoute &&
            location.pathname !== "/studentenprofiel";

        setShowForceModal(shouldForceProfile);
    }, [
        isAuthenticated,
        token,
        isProfileComplete,
        location.pathname
    ]);


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

            <Modal
                show={showForceModal}
                backdrop="static"
                keyboard={false}
                centered
                className="intro-modal"
            >
                <Modal.Header>
                    <Modal.Title>Profiel nog niet compleet</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Om John Mango te gebruiken moet je eerst
                    minimaal één interesse, waarde en leerdoel invullen.
                    <br /><br />
                    Dit kost maar een paar seconden.
                </Modal.Body>
                <Modal.Footer>
                    <button
                        className="btn btn-primary"
                        onClick={() => navigate("/studentenprofiel")}
                    >
                        Ga naar mijn profiel
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default Layout;
