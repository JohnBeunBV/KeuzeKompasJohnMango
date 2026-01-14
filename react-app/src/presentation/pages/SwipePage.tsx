import "../swipe.css";
import { useEffect, useState } from "react";
import axios from "axios";
import type { Vkm } from "@domain/models/vkm.model";
import { useNavigate } from "react-router-dom";
import Modal from "react-bootstrap/Modal";
import Button from "react-bootstrap/Button";
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

    const [vkms, setVkms] = useState<Vkm[]>([]);
    const [index, setIndex] = useState(0);
    const [loading, setLoading] = useState(true);
    const {user} = useAppSelector((s) => s.auth);
    const [pexelsImages, setPexelsImages] = useState<Record<string, string>>({});

    const [x, setX] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [startX, setStartX] = useState(0);

    const SWIPE_THRESHOLD = 120; 
    const [showIntroModal, setShowIntroModal] = useState(false);
    const [swipeOut, setSwipeOut] = useState<"left" | "right" | null>(null);

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
       Pointer Listeners (Fixes "Stickiness")
    ===================================================== */
    useEffect(() => {
        const handleGlobalPointerUp = () => {
            if (dragging) {
                setDragging(false);
                if (Math.abs(x) > SWIPE_THRESHOLD) {
                    commitSwipe(x > 0 ? "right" : "left");
                } else {
                    setX(0);
                }
            }
        };

        const handleGlobalPointerMove = (e: PointerEvent) => {
            if (dragging) {
                setX(e.clientX - startX);
            }
        };

        window.addEventListener("pointerup", handleGlobalPointerUp);
        window.addEventListener("pointermove", handleGlobalPointerMove);
        return () => {
            window.removeEventListener("pointerup", handleGlobalPointerUp);
            window.removeEventListener("pointermove", handleGlobalPointerMove);
        };
    }, [dragging, x, startX]);

    /* =====================================================
       Auth & Data Fetching
    ===================================================== */
    useEffect(() => {
        if (!token) {
            navigate("/error", { state: { status: 401, message: "Log in om te swipen." } });
        }
    }, [token, navigate]);

    useEffect(() => {
        if (!token) return;
        const fetchVkms = async () => {
            try {
                const res = await axios.get(`${API_BASE_URL}/vkms`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setVkms(res.data.vkms);
            } catch (err) {
                navigate("/error", { state: { status: 500, message: "Modules laden mislukt." } });
            } finally {
                setLoading(false);
            }
        };
        fetchVkms();
    }, [token, navigate]);

    /* =====================================================
          Afbeeldingen laden
      ===================================================== */
    useEffect(() => {
        const fetchImages = async () => {
            const results = await Promise.all(
                vkms.slice(index, index + 5).map(async (vkm) => {
                    const cacheKey = `vkm-image-${vkm._id}`;
                    const cached = localStorage.getItem(cacheKey);
                    if (cached) return { _id: vkm._id, img: cached };
                    try {
                        const res = await fetch(`https://api.pexels.com/v1/search?query=${encodeURIComponent(vkm.name)}&per_page=1`, {
                            headers: { Authorization: PEXELS_API_KEY },
                        });
                        const json = await res.json();
                        const img = json.photos?.[0]?.src?.large || "/john-mango.png";
                        localStorage.setItem(cacheKey, img);
                        return { _id: vkm._id, img };
                    } catch {
                        return { _id: vkm._id, img: "/john-mango.png" };
                    }
                })
            );
            setPexelsImages(prev => {
                const updated = { ...prev };
                results.forEach(r => updated[r._id] = r.img);
                return updated;
            });
        };
        if (vkms.length > 0) fetchImages();
    }, [vkms, index]);

    const commitSwipe = (direction: "left" | "right") => {
        const currentVkm = vkms[index];
        if (!currentVkm) return;

        // 1. TRIGGER ANIMATION IMMEDIATELY
        setSwipeOut(direction);
        const flyDistance = (direction === "right" ? window.innerWidth : -window.innerWidth) * 1.5;
        setX(x + flyDistance);

        // 2. DO THE API CALL WITHOUT 'AWAIT'
        // This runs in the background while the card is flying
        if (direction === "right") {
            axios.post(`${API_BASE_URL}/auth/users/favorites/${currentVkm._id}`, {}, {
                headers: { Authorization: `Bearer ${token}` }
            }).catch(e => console.error("Favorite failed", e));
        }

        // 3. CLEANUP AFTER ANIMATION
        setTimeout(() => {
            setSwipeOut(null);
            setX(0);
            setIndex((prev) => prev + 1);
        }, 500); 
    };

    if (loading) return <div className="swipe-page"><p>Modules laden...</p></div>;

    const currentVkm = vkms[index];
    const nextVkm = vkms[index + 1];

    if (!currentVkm) return <div className="swipe-page"><h3>Geen modules meer!</h3></div>;

    const renderCard = (vkm: Vkm) => (
        <div className="vkm-info-card">
            <img 
                src={pexelsImages[vkm._id] || "/john-mango.png"} 
                alt={vkm.name} 
                onError={(e) => { (e.target as HTMLImageElement).src = "/john-mango.png"; }}
            />
            <h4 className="mb-3">{vkm.name}</h4>
            <hr />
            <p><strong>Studiepunten:</strong> {vkm.studycredit}</p>
            <p><strong>Locatie:</strong> {vkm.location}</p>
            <p><strong>Startdatum:</strong> {vkm.start_date}</p>
            <p><strong>Niveau:</strong> {vkm.level}</p>
            <p><strong>Plekken:</strong> {vkm.available_spots}</p>
            <p><strong>Contact:</strong> {vkm.contact_id}</p>
        </div>
    );

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
                    <Modal.Title>Hoe werkt het?</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>Swipe naar <strong>rechts (♥)</strong> om een module aan je favorieten toe te voegen.</p>
                    <p>Swipe naar <strong>links (X)</strong> om de module over te slaan.</p>
                    <p>Druk op <strong>?</strong> om dit menu weer te vinden.</p>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="primary" onClick={() => setShowIntroModal(false)}>Begrepen!</Button>
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
                        className={`swipe-card swipe-card-top ${swipeOut ? 'swiping-out' : ''}`}
                        onPointerDown={(e) => { setStartX(e.clientX); setDragging(true); }}
                        style={{
                            transform: `translateX(${x}px) rotate(${x / 15}deg)`,
                            transition: dragging || swipeOut ? "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)" : "none",
                            touchAction: "none",
                        }}
                    >
                        {renderCard(currentVkm)}
                    </div>
                </div>

                <div className="swipe-actions">
                    <button className="swipe-btn brand" onClick={() => commitSwipe("left")}>X</button>
                    <button className="swipe-btn brand" onClick={() => setShowIntroModal(true)}>?</button>
                    <button className="swipe-btn brand" onClick={() => commitSwipe("right")}>♥</button>
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