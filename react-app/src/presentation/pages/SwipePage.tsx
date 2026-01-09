import "../swipe.css";
import { useEffect, useState } from "react";
import axios from "axios";
import type { Vkm } from "@domain/models/vkm.model";
import { useNavigate } from "react-router-dom";
import Modal from "react-bootstrap/Modal";

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

  // 🔹 EXACT dezelfde structuur als VkmsPage
  const [pexelsImages, setPexelsImages] = useState<Record<number, string>>({});

  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const SWIPE_THRESHOLD = 120;

  const [showIntroModal, setShowIntroModal] = useState(false);

  useEffect(() => {
    // also show intro modal when the page opens
    setShowIntroModal(true);
  }, []);

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
  useEffect(() => {
    if (!token) return;

    const fetchVkms = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/vkms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVkms(res.data.vkms);
      } catch (err) {
        console.error(err);
        navigate("/error", {
          state: {
            status: 500,
            message: "De modules konden niet worden geladen.",
          },
        });
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
      const promises = vkms.map(async (vkm) => {
        const cacheKey = `vkm-image-${vkm.id}`;
        const cached = localStorage.getItem(cacheKey);

        if (cached) return { id: vkm.id, img: cached };

        try {
          const res = await fetch(
            `https://api.pexels.com/v1/search?query=${encodeURIComponent(
              vkm.name
            )}&orientation=landscape&per_page=1`,
            { headers: { Authorization: PEXELS_API_KEY } }
          );

          const json = await res.json();
          const img =
            json.photos?.[0]?.src?.large ||
            json.photos?.[0]?.src?.medium ||
            "/john-mango.png";

          localStorage.setItem(cacheKey, img);
          return { id: vkm.id, img };
        } catch {
          return { id: vkm.id, img: "/john-mango.png" };
        }
      });

      const results = await Promise.all(promises);

      setPexelsImages((prev) => {
        const updated = { ...prev };
        results.forEach(({ id, img }) => (updated[id] = img));
        return updated;
      });
    };

    if (vkms.length) fetchImages();
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
    vkm ? pexelsImages[vkm.id] || "/john-mango.png" : "/john-mango.png";

  /* =====================================================
      Favorites toevoegen
  ===================================================== */
  const addToFavorites = async (vkmId: number) => {
  if (!token) return;

  try {
    await axios.post(
      `${API_BASE_URL}/auth/users/favorites/${vkmId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
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
      await addToFavorites(currentVkm.id);
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
  /* Popover removed — ? button now opens the intro modal */

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
      <hr />

      <p><strong>Naam:</strong> {vkm.name}</p>
      <p><strong>Studiepunten:</strong> {vkm.studycredit}</p>
      <p><strong>Locatie:</strong> {vkm.location}</p>
      <p><strong>Startdatum:</strong> {vkm.start_date}</p>
      <p><strong>Beschikbare plekken:</strong> {vkm.available_spots}</p>
      <p><strong>Niveau:</strong> {vkm.level}</p>
      <p><strong>Contact ID:</strong> {vkm.contact_id}</p>
    </div>
  );

  /* =====================================================
     Render
  ===================================================== */
  return (
    <div className="swipe-page">
      <Modal show={showIntroModal} onHide={() => setShowIntroModal(false)} centered className="intro-modal">
        <Modal.Header closeButton>
          <Modal.Title>Welkom bij de Swiper</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Je kunt hier door aanbevelingen swipen. 
          <br />
          <br />
          <strong>Swipe naar rechts of klik op ♥</strong> om een module te liken
          <br />
          <strong>Swipe naar links of klik op X</strong> om een module te disliken
          <br />
          <br />
          
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-primary" onClick={() => setShowIntroModal(false)}>Begrepen</button>
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

          <button className="swipe-btn brand" aria-label="Swipe help" onClick={() => setShowIntroModal(true)}>?</button>

          <button
            className="swipe-btn brand"
            onClick={() => commitSwipe("right")}
          >
            ♥
          </button>
        </div>
      </div>
    </div>
  );
}
