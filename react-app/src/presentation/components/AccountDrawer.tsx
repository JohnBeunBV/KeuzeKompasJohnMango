import React, {useEffect, useState} from "react";
import {Button, Fade, Spinner, Alert} from "react-bootstrap";
import {useNavigate} from "react-router-dom";
import apiClient from "../../infrastructure/ApiClient";
import "../index.css";
import {fetchUser} from "../../application/Slices/authSlice";
import {useAppDispatch, useAppSelector} from "../../application/store/hooks.ts";

interface AiRecommendation {
    _id: string;
    name: string;
    meta: {
        score: number; // 0–100
        explanation?: string;
    }
}

const AccountDrawer: React.FC = () => {


    const {user, status} = useAppSelector(s => s.auth);
    const favorites = Array.isArray(user?.favorites)
        ? user.favorites
        : [];
    const [localFavorites, setLocalFavorites] = useState<typeof favorites>([]);


    const [recommendations, setRecommendations] = useState<AiRecommendation[]>([]);
    const [expandedRec, setExpandedRec] = useState<string | null>(null);
    const [showXaiModal, setShowXaiModal] = useState(false);
    const [favoritesMessage, setFavoritesMessage] = useState<{ text: string; type: "success" | "danger" } | null>(null);
    const [showFavoritesMessage, setShowFavoritesMessage] = useState(false);
    const [loadingRecs, setLoadingRecs] = useState(true);

    const isMobile = window.matchMedia("(max-width: 500px)").matches;
    const refreshBtnRef = React.useRef<HTMLButtonElement | null>(null);
    const handleAnimationEnd = (e: React.AnimationEvent) => {
        e.currentTarget.classList.remove("animate");
    };
    const [isInitialLoad, setIsInitialLoad] = useState(true);

    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    useEffect(() => {
        if (favorites) {
            setLocalFavorites(favorites);
        }
    }, [favorites]);

    useEffect(() => {
        if (status === "authenticated" && isInitialLoad) {
            refreshRecommendations(false);
            setIsInitialLoad(false);
        }
    }, [status, isInitialLoad]);

    // Auto-hide favorites message
    useEffect(() => {
        if (favoritesMessage) {
            setShowFavoritesMessage(true);
            const timer = setTimeout(() => setShowFavoritesMessage(false), 2700);
            const clearTimer = setTimeout(() => setFavoritesMessage(null), 3000);
            return () => {
                clearTimeout(timer);
                clearTimeout(clearTimer);
            };
        }
    }, [favoritesMessage]);

    const refreshRecommendations = async (isManualClick = false) => {
        if (!user) return;

        // Only add the 'animate' class if it's a manual click
        const btn = refreshBtnRef.current;
        if (btn && isManualClick) {
            btn.classList.remove("animate");
            void btn.offsetWidth; 
            btn.classList.add("animate");
        }

        setLoadingRecs(true);
        try {
            const res = await apiClient.get("/auth/recommendations");
            setRecommendations(res.data.recommendations || []);
        } catch (err) {
            console.error("Refresh failed", err);
        } finally {
            setLoadingRecs(false);
        }
    };

    const handleRemoveFavorite = async (vkmId: string) => {
        setLocalFavorites(prev => prev.filter(f => f._id !== vkmId));

        try {
            await apiClient.delete(`/auth/users/favorites/${vkmId}`);
            setFavoritesMessage({ text: "Module verwijderd.", type: "success" });

            dispatch(fetchUser()); // sync with backend
            refreshRecommendations(false);
        } catch (err) {
            setLocalFavorites(favorites);
            setFavoritesMessage({ text: "Verwijderen mislukt.", type: "danger" });
            console.error(err);
        }
    };

    if (!user) return <Spinner animation="border" className="d-block mx-auto mt-3"/>;

    return (
        <div className="favorites-card">
            <h3 className="terminal-title mb-3">Je favorieten</h3>
            <hr/>
            <Fade in={showFavoritesMessage} mountOnEnter unmountOnExit>
                <div>{favoritesMessage && <Alert variant={favoritesMessage.type}>{favoritesMessage.text}</Alert>}</div>
            </Fade>

            {!localFavorites ? (
                <Spinner animation="border" role="status" className="d-block mx-auto mt-3"/>
            ) : localFavorites.length === 0 ? (
                <p className="text-white mt-3">Hier komen jouw favorieten te staan!</p>
            ) : (
                <div className="favorites-list">
                    {localFavorites.map((fav) => (
                        <div key={fav._id} className="favorite-item">
                  <span onClick={() => navigate(`/vkms/${fav._id}`)}>
                    {fav.name}
                  </span>

                            <div className="d-flex align-items-center gap-2">
                                <span>{fav.studycredit} SP</span>
                                <button
                                    className="unfavorite-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        handleRemoveFavorite(fav._id);
                                    }}
                                    style={{background: "none", border: "none", padding: 0, cursor: "pointer"}}
                                >
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        width="20px"
                                        height="20px"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                    >
                                        <path
                                            d="M1.24264 8.24264L8 15L14.7574 8.24264C15.553 7.44699 16 6.36786 16 5.24264V5.05234C16 2.8143 14.1857 1 11.9477 1C10.7166 1 9.55233 1.55959 8.78331 2.52086L8 3.5L7.21669 2.52086C6.44767 1.55959 5.28338 1 4.05234 1C1.8143 1 0 2.8143 0 5.05234V5.24264C0 6.36786 0.44699 7.44699 1.24264 8.24264Z"
                                            fill="#000000ff"
                                        />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Header Container */}
            <div className="d-flex align-items-center justify-content-between w-100 position-relative">
                
                {/* Left Side: Title and Info Icon */}
                <div className="d-flex align-items-center gap-2">
                    <h3 className="terminal-title mb-0">Aanbevolen VKM’s</h3>
                    
                    <div 
                        className="xai-interaction-wrapper"
                        onMouseLeave={() => !isMobile && setShowXaiModal(false)}
                    >
                        <button
                            className="info-btn"
                            onMouseEnter={() => !isMobile && setShowXaiModal(true)}
                            onClick={() => isMobile && setShowXaiModal(true)}
                            style={{ background: "none", border: "none", padding: 0, cursor: "pointer", display: "flex" }}
                        >
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                fill="#ffc43b"
                                width="20px"
                                height="20px"
                                viewBox="0 0 490.318 490.318"
                            >
                                <path d="M245.148,0C109.967,0,0.009,109.98,0.009,245.162c0,135.182,109.958,245.156,245.139,245.156 c135.186,0,245.162-109.978,245.162-245.156C490.31,109.98,380.333,0,245.148,0z M245.148,438.415 c-106.555,0-193.234-86.698-193.234-193.253 c0-106.555,86.68-193.258,193.234-193.258 c106.559,0,193.258,86.703,193.258,193.258 C438.406,351.717,351.706,438.415,245.148,438.415z" />
                                <path d="M270.036,221.352h-49.771c-8.351,0-15.131,6.78-15.131,15.118v147.566 c0,8.352,6.78,15.119,15.131,15.119h49.771 c8.351,0,15.131-6.77,15.131-15.119V236.471 C285.167,228.133,278.387,221.352,270.036,221.352z" />
                                <path d="M245.148,91.168c-24.48,0-44.336,19.855-44.336,44.336 c0,24.484,19.855,44.34,44.336,44.34 c24.485,0,44.342-19.855,44.342-44.34 C289.489,111.023,269.634,91.168,245.148,91.168z" />
                            </svg>
                        </button>

                        {/* Modal Logic stays inside the wrapper for hover context */}
                        {showXaiModal && (
                            <div
                                className={isMobile ? "xai-modal-overlay" : "xai-desktop-hover-box"}
                                onClick={() => isMobile && setShowXaiModal(false)}
                            >
                                <div className="xai-modal-card" onClick={(e) => e.stopPropagation()}>
                                    <div className="xai-header">
                                        <span className="xai-title">Hoe komen deze aanbevelingen tot stand?</span>
                                        {isMobile && (
                                            <button className="close-btn" onClick={() => setShowXaiModal(false)}>✕</button>
                                        )}
                                    </div>
                                    <div className="xai-body">
                                        <div className="xai-score-explanations mb-3">
                                            <div className="xai-score-item"><strong>85% en hoger:</strong> Sterke match met jouw interesses, sterk aanbevolen.</div>
                                            <div className="xai-score-item"><strong>70–84%:</strong> Overwegend matchend, maar het kan nuttig zijn eerst wat extra te onderzoeken.</div>
                                            <div className="xai-score-item"><strong>55–69%:</strong> Gedeeltelijk vergelijkbaar; bespreek dit bij voorkeur eerst met een studiecoach.</div>
                                            <div className="xai-score-item"><strong>Onder 55%:</strong> Niet aanbevolen om te kiezen.</div>
                                        </div>
                                        <hr />
                                        <div className="xai-section">
                                            <strong>Inhoudsovereenkomst (45%)</strong>
                                            <div className="xai-bar"><div className="xai-fill" style={{ width: "45%" }} /></div>
                                            <p>Vergelijkt de inhoud van VKM’s met jouw favorieten. Modules met vergelijkbare onderwerpen scoren hoger.</p>
                                        </div>
                                        <div className="xai-section">
                                            <strong>Gebruikersprofiel (50%)</strong>
                                            <div className="xai-bar"><div className="xai-fill" style={{ width: "50%" }} /></div>
                                            <p>Houdt rekening met jouw studiegedrag, voorkeuren en eerdere keuzes. Dit is de zwaarst meewegende factor.</p>
                                        </div>
                                        <div className="xai-section">
                                            <strong>Populariteit (5%)</strong>
                                            <div className="xai-bar"><div className="xai-fill" style={{ width: "5%" }} /></div>
                                            <p>Modules die vaker door andere studenten gekozen worden, krijgen een lichte voorkeur.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Side: Refresh Button */}
                <button
                    ref={refreshBtnRef}
                    onClick={() => refreshRecommendations(true)}
                    disabled={loadingRecs}
                    onAnimationEnd={handleAnimationEnd} // Clean up when done
                    className="refresh-btn" // Remove the conditional ${loadingRecs ? "animate" : ""}
                    style={{
                        background: "none",
                        border: "none",
                        padding: 0,
                        cursor: loadingRecs ? "default" : "pointer",
                        display: "flex",
                        alignItems: "center",
                    }}
                >
                    <svg width="30px" height="30px" viewBox="0 0 24 24" fill="none">
                        <path 
                            d="M21 12C21 16.9706 16.9706 21 12 21C9.69494 21 7.59227 20.1334 6 18.7083L3 16M3 12C3 7.02944 7.02944 3 12 3C14.3051 3 16.4077 3.86656 18 5.29168L21 8M3 21V16M3 16H8M21 3V8M21 8H16" 
                            stroke="#ffc43b" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                        />
                    </svg>
                </button>
            </div>

            <hr/>

            {loadingRecs ? (
                <Spinner animation="border" className="d-block mx-auto mt-3"/>
            ) : recommendations.length === 0 ? (
                <p className="text mt-3">Geen aanbevelingen beschikbaar.</p>
            ) : (
                <div className="recommendations-column-container">
                    {recommendations.map((rec) => {
                        const isExpanded = expandedRec === rec._id;

                        return (
                            <div key={rec._id} className="terminal-recommendation-item">
                                {/* Top Row: Clickable Header */}
                                <div
                                    className="recommendation-header"
                                    onClick={() => setExpandedRec(isExpanded ? null : rec._id)}
                                >
                                    <div className="header-info">
                                        <h4 className="m-0" onClick={(e) => {
                                            e.stopPropagation(); // Link clicks shouldn't toggle the accordion
                                            navigate(`/vkms/${rec._id}`);
                                        }} style={{cursor: 'pointer', textDecoration: 'underline'}}>
                                            {rec.name}
                                        </h4>
                                        <span className="match-score">{rec.meta.score}% match</span>
                                    </div>

                                    <button className={`expand-arrow-btn ${isExpanded ? "rotated" : ""}`}>
                                        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
                                             xmlns="http://www.w3.org/2000/svg">
                                            <path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" strokeWidth="2"
                                                  strokeLinecap="round" strokeLinejoin="round"/>
                                        </svg>
                                    </button>
                                </div>

                                {/* Expanded Content */}
                                {isExpanded && (
                                    <Fade in={isExpanded}>
                                        <div className="explanation-content">
                                            <hr className="explanation-divider"/>
                                            <p>{rec.meta.explanation}</p>
                                            <Button
                                                variant="outline-warning"
                                                size="sm"
                                                onClick={() => navigate(`/vkms/${rec._id}`)}
                                            >
                                                Bekijk volledige details
                                            </Button>
                                        </div>
                                    </Fade>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AccountDrawer;
