import "../swipe.css";
import {useEffect, useState} from "react";
import axios from "axios";
import type {Vkm} from "@domain/models/vkm.model";
import {useNavigate} from "react-router-dom";
import Modal from "react-bootstrap/Modal";
import Toast from "react-bootstrap/Toast";
import apiClient from "../../infrastructure/ApiClient";
import {
    useAppDispatch,
    useAppSelector,
} from "../../application/store/hooks.ts";
import {fetchUser} from "../../application/Slices/authSlice.ts";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_KEY;

export default function SwipePage() {
    
    const navigate = useNavigate();
    const token = localStorage.getItem("token");

    /* =========================
         State
      ========================= */
    const [vkms, setVkms] = useState<Vkm[]>([]);
    const [index, setIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    //user
    const {user} = useAppSelector((s) => s.auth);

    // 🔹 EXACT dezelfde structuur als VkmsPage
    const [pexelsImages, setPexelsImages] = useState<Record<string, string>>({});

    const [x, setX] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [startX, setStartX] = useState(0);

    const SWIPE_THRESHOLD = 120;

    const [showIntroModal, setShowIntroModal] = useState(false);
    const [showLikeToast, setShowLikeToast] = useState(false);

    const dispatch = useAppDispatch();

    useEffect(() => {
        // Show intro modal only the first time the user opens this page.
        // Persist a flag in localStorage so it won't appear again.
        try {
            const seen = localStorage.getItem("swipeIntroShown");
            if (seen !== "true") {
                setShowIntroModal(true);
            }
        } catch (err) {
            // localStorage may be unavailable; default to showing once
            setShowIntroModal(true);
        }
    }, []);

    // 🔹 Haal gebruiker en favorieten op
    useEffect(() => {
        dispatch(fetchUser());
        setLoading(false);
        refreshRecommendations();
    }, [dispatch]);

    /* =====================================================
         Auth check
      ===================================================== */
    useEffect(() => {
        if (!token) {
            navigate("/error", {
                state: {
                    status: 401,
                    message: "Je bent niet ingelogd. Log in om de swiper te gebruiken.",
                },
            });
        }
    }, [token, navigate]);

    /* =====================================================
         Fetch VKMs → redirect bij DB/API fout
      ===================================================== */
    const refreshRecommendations = async () => {
        if (!user) return;

        setLoading(true);

        try {
            const res = await apiClient.get("/auth/recommendations");
            setVkms(res.data.recommendations || []);
        } catch (err) {
            console.error("Refresh recommendations failed", err);
        } finally {
            setLoading(false);
        }
    };

    /* =====================================================
          Afbeeldingen laden
      ===================================================== */
    useEffect(() => {
        const fetchImages = async () => {
            const results = await Promise.all(
                vkms.map(async (vkm) => {
                    const cacheKey = `vkm-image-${vkm._id}`;
                    const cached = localStorage.getItem(cacheKey);

                    if (cached) {
                        return {_id: vkm._id, img: cached};
                    }

                    try {
                        const res = await fetch(
                            `https://api.pexels.com/v1/search?query=${encodeURIComponent(
                                vkm.name
                            )}&orientation=landscape&per_page=1`,
                            {
                                headers: {Authorization: PEXELS_API_KEY},
                            }
                        );

                        const json = await res.json();
                        const img =
                            json.photos?.[0]?.src?.large ||
                            json.photos?.[0]?.src?.medium ||
                            "/john-mango.png";

                        localStorage.setItem(cacheKey, img);
                        return {_id: vkm._id, img};
                    } catch {
                        return {_id: vkm._id, img: "/john-mango.png"};
                    }
                })
            );

            setPexelsImages((prev) => {
                const updated = {...prev};
                results.forEach(({_id, img}) => {
                    updated[_id] = img;
                });
                return updated;
            });
        };

        if (vkms.length > 0) {
            fetchImages();
        }
    }, [vkms]);

    /* =====================================================
         Loading
      ===================================================== */
    if (loading) {
        return (
            <div className="swipe-page">
                <p>Modules laden...</p>
            </div>
        );
    }

    const currentVkm = vkms[index];
    const nextVkm = vkms[index + 1];

    if (!currentVkm) {
        return (
            <div className="swipe-page">
                <h3>Geen modules meer!</h3>
            </div>
        );
    }

    const getImage = (vkm?: Vkm) =>
        vkm ? pexelsImages[vkm._id] || "/john-mango.png" : "/john-mango.png";

    /* =====================================================
          Favorites toevoegen
      ===================================================== */
    const addToFavorites = async (vkmId: string) => {
        if (!token) return;

        try {
            await axios.post(
                `${API_BASE_URL}/auth/users/favorites/${vkmId}`,
                {},
                {headers: {Authorization: `Bearer ${token}`}}
            );
        } catch (err) {
            console.error("Kon niet toevoegen aan favorites:", err);
        }
    };

    /* =====================================================
         Swipe logic
      ===================================================== */
    const commitSwipe = async (direction: "left" | "right") => {
        if (direction === "right") {
            await addToFavorites(currentVkm._id);
            setShowLikeToast(true);
        }

        setIndex((prev) => prev + 1);
        setX(0);
    };
    const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
        setStartX(e.clientX);
        setDragging(true);
    };

    const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
        if (!dragging) return;
        setX(e.clientX - startX);
    };

    const onPointerUp = () => {
        setDragging(false);

        if (Math.abs(x) > SWIPE_THRESHOLD) {
            commitSwipe(x > 0 ? "right" : "left");
        } else {
            setX(0);
        }
    };

    /* =====================================================
         Card layout
      ===================================================== */
    const renderCard = (vkm: Vkm) => (
        <div className="vkm-info-card">
            <img
                src={getImage(vkm)}
                alt={vkm.name}
                onError={(e) => {
                    (e.target as HTMLImageElement).src = "/john-mango.png";
                }}
            />

            <h4 className="mb-3">Module Info</h4>
            <hr/>

            <p>
                <strong>Naam:</strong> {vkm.name}
            </p>
            <p>
                <strong>Studiepunten:</strong> {vkm.studycredit}
            </p>
            <p>
                <strong>Locatie:</strong> {vkm.location}
            </p>
            <p>
                <strong>Startdatum:</strong> {vkm.start_date}
            </p>
            <p>
                <strong>Beschikbare plekken:</strong> {vkm.available_spots}
            </p>
            <p>
                <strong>Niveau:</strong> {vkm.level}
            </p>
            <p>
                <strong>Contact ID:</strong> {vkm.contact_id}
            </p>
        </div>
    );

    /* =====================================================
         Render
      ===================================================== */
    return (
        <div className="swipe-page">
            <Modal
                show={showIntroModal}
                onHide={() => {
                    try {
                        localStorage.setItem("swipeIntroShown", "true");
                    } catch (err) {
                        /* ignore */
                    }
                    setShowIntroModal(false);
                }}
                centered
                className="intro-modal"
            >
                <Modal.Header closeButton>
                    <Modal.Title>Welkom bij de Swiper</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Je kunt hier door aanbevelingen swipen.
                    <br/>
                    <br/>
                    <strong>Swipe naar rechts of klik op ♥</strong> om een module te liken
                    <br/>
                    <strong>Swipe naar links of klik op X</strong> om een module te
                    disliken
                    <br/>
                    <br/>
                </Modal.Body>
                <Modal.Footer>
                    <button
                        className="btn btn-primary"
                        onClick={() => {
                            try {
                                localStorage.setItem("swipeIntroShown", "true");
                            } catch (err) {
                                /* ignore */
                            }
                            setShowIntroModal(false);
                        }}
                    >
                        Begrepen
                    </button>
                </Modal.Footer>
            </Modal>
            <div className="swipe-wrapper">
                <div className="card-stack">
                    {nextVkm && (
                        <div className="swipe-card swipe-card-under">
                            {renderCard(nextVkm)}
                        </div>
                    )}

                    <div
                        className="swipe-card swipe-card-top"
                        onPointerDown={onPointerDown}
                        onPointerMove={onPointerMove}
                        onPointerUp={onPointerUp}
                        onPointerCancel={onPointerUp}
                        style={{
                            transform: `translateX(${x}px) rotate(${x / 12}deg)`,
                            transition: dragging ? "none" : "transform 0.3s ease",
                            touchAction: "none",
                        }}
                    >
                        {renderCard(currentVkm)}
                    </div>
                </div>

                <div className="swipe-actions">
                    <button
                        className="swipe-btn brand"
                        onClick={() => commitSwipe("left")}
                    >
                        X
                    </button>

                    <button
                        className="swipe-btn brand"
                        aria-label="Swipe help"
                        onClick={() => setShowIntroModal(true)}
                    >
                        ?
                    </button>

                    <button
                        className="swipe-btn brand"
                        onClick={() => commitSwipe("right")}
                    >
                        ♥
                    </button>
                </div>
            </div>

            <div className="position-fixed top-0 end-0 p-3" style={{zIndex: 1060}}>
                <Toast
                    show={showLikeToast}
                    onClose={() => setShowLikeToast(false)}
                    delay={1500}
                    autohide
                >
                    <Toast.Header>
                        <strong className="me-auto">Geliked</strong>
                    </Toast.Header>
                    <Toast.Body>Je hebt deze module geliket!</Toast.Body>
                </Toast>
            </div>
        </div>
    );
}
