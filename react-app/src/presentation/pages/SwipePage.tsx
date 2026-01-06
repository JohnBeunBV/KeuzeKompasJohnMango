import "../swipe.css";
import { useEffect, useState } from "react";
import axios from "axios";
import type { Vkm } from "@domain/models/vkm.model";
import { useNavigate } from "react-router-dom";
import OverlayTrigger from "react-bootstrap/OverlayTrigger";
import Popover from "react-bootstrap/Popover";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

export default function SwipePage() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [vkms, setVkms] = useState<Vkm[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [pexelsImages, setPexelsImages] = useState<string[]>([]);
  const [pexelsLoading, setPexelsLoading] = useState(true);

  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const SWIPE_THRESHOLD = 120;

  /* =====================================================
    Auth check → EXACT zoals VkmsPage
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
    Fetch VKMs → redirect bij error (500)
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
    Fetch Pexels images
  ===================================================== */
  useEffect(() => {
    const fetchImages = async () => {
      setPexelsLoading(true);
      try {
        const res = await fetch(
          "https://api.pexels.com/v1/search?query=education&orientation=landscape&per_page=30",
          { headers: { Authorization: PEXELS_API_KEY } }
        );
        const data = await res.json();
        setPexelsImages(data.photos.map((p: any) => p.src.large));
      } catch {
        setPexelsImages([]);
      } finally {
        setPexelsLoading(false);
      }
    };

    fetchImages();
  }, []);

  /* =====================================================
    Inladen
  ===================================================== */
  if (loading || pexelsLoading) {
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

  const getImage = (i: number) =>
    pexelsImages.length > 0
      ? pexelsImages[i % pexelsImages.length]
      : "/images/default-vkm.png";

  /* =====================================================
    Swipe logic
  ===================================================== */
  const commitSwipe = () => {
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
    if (Math.abs(x) > SWIPE_THRESHOLD) commitSwipe();
    else setX(0);
  };

  /* =====================================================
    Uitleg swiper popover
  ===================================================== */
  const swipeHelpPopover = (
    <Popover id="swipe-help-popover">
      <Popover.Header as="h3">Hoe werkt swipen?</Popover.Header>
      <Popover.Body>
        👉 <strong>Swipe naar rechts</strong> om een module te liken
        <br />
        👈 <strong>Swipe naar links</strong> om een module te disliken
      </Popover.Body>
    </Popover>
  );

  /* =====================================================
    Card layout (info-box)
  ===================================================== */
  const renderCard = (vkm: Vkm, img: string) => (
    <div className="vkm-info-card">
      <img
        src={img}
        alt={vkm.name}
        style={{
          width: "100%",
          borderRadius: "16px",
          objectFit: "cover",
          maxHeight: "220px",
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
    Render Swiper
  ===================================================== */
  return (
    <div className="swipe-page">
      <div className="swipe-wrapper card-stack">
        {/* Onderste kaart */}
        {nextVkm && (
          <div className="swipe-card swipe-card-under">
            {renderCard(nextVkm, getImage(index + 1))}
          </div>
        )}

        {/* Bovenste kaart */}
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
          {renderCard(currentVkm, getImage(index))}
        </div>

        {/* Acties */}
        <div className="swipe-actions">
          <button className="swipe-btn brand" onClick={commitSwipe}>
            X
          </button>

          <OverlayTrigger
            trigger="click"
            placement="top"
            overlay={swipeHelpPopover}
            rootClose
          >
            <button className="swipe-btn brand">?</button>
          </OverlayTrigger>

          <button className="swipe-btn brand" onClick={commitSwipe}>
            ♥
          </button>
        </div>
      </div>
    </div>
  );
}
