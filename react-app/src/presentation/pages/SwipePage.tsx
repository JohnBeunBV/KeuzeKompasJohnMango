import "../swipe.css";
import {useEffect, useState} from "react";
import axios from "axios";
import type {Vkm} from "@domain/models/vkm.model";
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

    const token = localStorage.getItem("token");
    // Vkms
    const [vkms, setVkms] = useState<Vkm[]>([]);
    const [loading, setLoading] = useState(true);

    // Session-only memory
    const [seenIds, setSeenIds] = useState<Set<string>>(new Set());

    const {user} = useAppSelector((s) => s.auth);
    const [pexelsImages, setPexelsImages] = useState<Record<string, string>>({});

    const [dislikedIds, setDislikedIds] = useState<Set<string>>(() => {
    const stored = localStorage.getItem("dislikedVkms");
    return stored ? new Set(JSON.parse(stored)) : new Set();
    });

    const [x, setX] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [startX, setStartX] = useState(0);

    const SWIPE_THRESHOLD = 120;
    const [showIntroModal, setShowIntroModal] = useState(false);
    const [showLikeToast, setShowLikeToast] = useState(false);

    const [swipeOut, setSwipeOut] = useState<"left" | "right" | null>(null);

    const dispatch = useAppDispatch();

    useEffect(() => {
        try {
            const stored = localStorage.getItem("dislikedVkms");
            if (stored) {
                setDislikedIds(new Set(JSON.parse(stored)));
            }
        } catch (err) {
            console.error("Failed to load disliked VKMs:", err);
        }
    }, []);

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
    }, [dispatch]);

    useEffect(() => {
        if (user) {
            fetchMoreRecommendations().finally(() => setLoading(false));
        }
    }, [user]);

    useEffect(() => {
        if (vkms.length < 3 && !loading) {
            fetchMoreRecommendations();
        }
    }, [vkms.length]);

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
    // Filter vkm list
    const filterVkms = (incoming: Vkm[]) => {
        const favoriteIds = new Set(
            (user?.favorites ?? []).map((f: any) => f._id)
        );

        return incoming.filter(vkm =>
            !favoriteIds.has(vkm._id) &&
            !seenIds.has(vkm._id) &&
            !dislikedIds.has(vkm._id)
        );
    };

    /* =====================================================
            Fetch VKMs → redirect bij DB/API fout
      ===================================================== */
    const fetchMoreRecommendations = async () => {
        if (!user) return;

        try {
            const res = await apiClient.get("/auth/recommendations", {
                params: { topN: 15 }  // ← params object voor GET requests
            });
            const fresh = filterVkms(res.data.recommendations || []);

            setVkms(prev => {
                const existing = new Set(prev.map(v => v._id));
                const deduped = fresh.filter(v => !existing.has(v._id));
                return [...prev, ...deduped];
            });
        } catch (err) {
            console.error("Failed to fetch recommendations", err);
        }
    };


    /* =====================================================
          Afbeeldingen laden
      ===================================================== */
    useEffect(() => {
        const fetchImages = async () => {
            const results = await Promise.all(
                vkms
                    .slice(0, 5) // current + next 4
                    .filter(vkm => !pexelsImages[vkm._id]) // already loaded? skip
                    .map(async (vkm) => {
                        const cacheKey = `vkm-image-${vkm._id}`;
                        const cached = localStorage.getItem(cacheKey);

                        if (cached) {
                            return {_id: vkm._id, img: cached};
                        }

                        try {
                            const res = await fetch(
                                `https://api.pexels.com/v1/search?query=${encodeURIComponent(vkm.name)}&per_page=1`,
                                {headers: {Authorization: PEXELS_API_KEY}}
                            );
                            const json = await res.json();
                            const img =
                                json.photos?.[0]?.src?.large ?? "/john-mango.png";

                            localStorage.setItem(cacheKey, img);
                            return {_id: vkm._id, img};
                        } catch {
                            return {_id: vkm._id, img: "/john-mango.png"};
                        }
                    })
            );

            if (results.length === 0) return;

            setPexelsImages(prev => {
                const updated = {...prev};
                results.forEach(r => {
                    updated[r._id] = r.img;
                });
                return updated;
            });
        };

        if (vkms.length > 0) {
            fetchImages();
        }
    }, [vkms, pexelsImages]);

    const saveDislikedId = (id: string) => {
            try {
                const updated = new Set(dislikedIds).add(id);
                setDislikedIds(updated);
                localStorage.setItem("dislikedVkms", JSON.stringify(Array.from(updated)));
            } catch (err) {
                console.error("Failed to save disliked VKM:", err);
            }
        };

    const commitSwipe = (direction: "left" | "right") => {
        const current = vkms[0];
        if (!current) return;

        // 1️⃣ Animate immediately
        setSwipeOut(direction);
        const flyDistance =
            (direction === "right" ? window.innerWidth : -window.innerWidth) * 1.5;
        setX(flyDistance);

        // 2️⃣ Background API call
        if (direction === "right") {
            setShowLikeToast(true);
            axios.post(
                `${API_BASE_URL}/auth/users/favorites/${current._id}`,
                {},
                {headers: {Authorization: `Bearer ${token}`}}
            ).catch(console.error);
        } else {
            saveDislikedId(current._id);
        }

        // 3️⃣ Mark as seen (session only)
        setSeenIds(prev => new Set(prev).add(current._id));

        // 4️⃣ Remove card after animation
        setTimeout(() => {
            setVkms(prev => prev.slice(1));
            setSwipeOut(null);
            setX(0);
        }, 400);
    };

    if (loading) return <div className="swipe-page"><p>Modules laden...</p></div>;

    const currentVkm = vkms[0];
    const nextVkm = vkms[1];

    if (!currentVkm) return <div className="swipe-page"><h3>Geen modules meer!</h3></div>;

    const renderCard = (vkm: Vkm) => (
        <div className="vkm-info-card">
            <img
                src={pexelsImages[vkm._id] || "/john-mango.png"}
                alt={vkm.name}
                onError={(e) => {
                    (e.target as HTMLImageElement).src = "/john-mango.png";
                }}
            />
            <h4 className="mb-3">{vkm.name}</h4>
            <hr/>
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
                        console.log(err);
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
                        onPointerDown={(e) => {
                            setStartX(e.clientX);
                            setDragging(true);
                        }}
                        style={{
                            transform: `translateX(${x}px) rotate(${x / 15}deg)`,
                            transition: dragging || swipeOut ? "transform 0.3s cubic-bezier(0.25, 0.8, 0.25, 1)" : "none",
                            touchAction: "none",
                        }}
                    >
                        {renderCard(currentVkm)}
                        
                        {/* Dislike overlay (left) */}
                        <div className="swipe-overlay swipe-overlay-dislike" style={{ opacity: x < -30 ? Math.min((Math.abs(x) - 30) / 90, 1) : 0 }}>
                            ✕
                        </div>
                        
                        {/* Like overlay (right) */}
                        <div className="swipe-overlay swipe-overlay-like" style={{ opacity: x > 30 ? Math.min((x - 30) / 90, 1) : 0 }}>
                            ♥
                        </div>
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