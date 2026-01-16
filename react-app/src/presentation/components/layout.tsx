import {Outlet, useNavigate, Link} from "react-router-dom";
import {useAppDispatch, useAppSelector} from "../../application/store/hooks";
import {logout} from "../../application/Slices/authSlice";
import {Home, List, Heart, Info, Settings} from "lucide-react";
import "../index.css";
import "../accountpage.css";
import "../navbar.css";
import {useEffect, useState} from "react";
import {useLocation} from "react-router-dom";
import {Modal} from "react-bootstrap";
import {hideForceProfileModal} from "../../application/Slices/uiSlice.ts";


const Layout: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const dispatch = useAppDispatch();

    const {status, user} = useAppSelector((state) => state.auth);

    const roles = user?.roles ?? [];
    const userName = user?.username ?? user?.email ?? null;

    const showForceModal = useAppSelector(
        (state) => state.ui.forceProfileModal
    );


    const handleLogout = () => {
        dispatch(logout());
        navigate("/login");
    };

    const handleGoToProfile = () => {
        dispatch(hideForceProfileModal());
        navigate("/studentenprofiel");
    };
    const [isMobileNav, setIsMobileNav] = useState(false);

    useEffect(() => {
        const check = () => setIsMobileNav(window.innerWidth <= 1000);
        check();
        window.addEventListener("resize", check);
        return () => window.removeEventListener("resize", check);
    }, []);


    return (
        <>
            {/* ================= DESKTOP NAV (OLD, UNCHANGED) ================= */}
            {!isMobileNav && (
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
                            <Link to="/studentenprofiel" className="nav-link">
                                Studentenprofiel
                            </Link>

                            {roles.includes("teacher") && (
                                <Link to="/teacher" className="nav-link role-link teacher">
                                    Teacher
                                </Link>
                            )}

                            {roles.includes("admin") && (
                                <Link to="/admin" className="nav-link role-link teacher">
                                    Admin
                                </Link>
                            )}
                        </nav>
                    </div>

                    <div className="nav-right">
                        {status === "authenticated" && userName ? (
                            <>
                        <span className="welcome-text">
                            Welkom,&nbsp;
                            <span
                                className="user-name-link"
                                onClick={() => navigate("/account")}
                            >
                            {userName}
                            </span>
                            !
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
            )}

            {/* ================= MOBILE TOP NAV ================= */}
            {isMobileNav && (
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
                    </div>

                    <div className="nav-right">
                        {status === "authenticated" && userName ? (
                            <>
                                <span className="welcome-text">
                                    Welkom,&nbsp;
                                    <span
                                        className="user-name-link"
                                        onClick={() => navigate("/account")}
                                    >
                                    {userName}
                                    </span>
                                    !
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
            )}

            {/* ================= MAIN ================= */}
            <main
                className={`${location.pathname === "/swipe" ? "" : "container"}`}
                style={{
                    marginBottom: isMobileNav ? 0 : undefined, // removes my-4 margin on small screens
                    paddingBottom: isMobileNav ? 0 : undefined, // removes has-mobile-nav padding
                }}
            >
                <Outlet/>
            </main>

            {/* ================= MOBILE BOTTOM NAV ================= */}
            {isMobileNav && (
                <nav className="mobile-bottom-nav">
                    <Link to="/" className={location.pathname === "/" ? "active" : ""}>
                        <Home/>
                    </Link>
                    <Link
                        to="/vkms"
                        className={location.pathname.startsWith("/vkms") ? "active" : ""}
                    >
                        <List/>
                    </Link>
                    <Link
                        to="/swipe"
                        className={location.pathname === "/swipe" ? "active" : ""}
                    >
                        <Heart/>
                    </Link>
                    <Link
                        to="/about"
                        className={location.pathname === "/about" ? "active" : ""}
                    >
                        <Info/>
                    </Link>
                    <Link
                        to="/studentenprofiel"
                        className={location.pathname.startsWith("/studentenprofiel") ? "active" : ""}
                    >
                        <Settings/>
                    </Link>
                </nav>
            )}

            {/* ================= FOOTER ================= */}
            {!isMobileNav && (
                <footer className="footer text-center p-3">
                    <p>© {new Date().getFullYear()} John Mango. Alle rechten voorbehouden.</p>
                </footer>
            )}
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
                    <br/><br/>
                    Dit kost maar een paar seconden.
                </Modal.Body>
                <Modal.Footer>
                    <button
                        className="btn btn-primary"
                        onClick={() => handleGoToProfile()}
                    >
                        Ga naar mijn profiel
                    </button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default Layout;
