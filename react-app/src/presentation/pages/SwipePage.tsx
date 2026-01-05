import "../swipe.css";
import { useEffect, useState } from "react";
import axios from "axios";
import type { Vkm } from "@domain/models/vkm.model";

const API_BASE_URL = import.meta.env.VITE_API_URL;
const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_API_KEY;

export default function SwipePage() {
  /* =========================
     Auth
  ========================= */
  const token = localStorage.getItem("token");

  /* =========================
     State
  ========================= */
  const [vkms, setVkms] = useState<Vkm[]>([]);
  const [index, setIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  const [pexelsImages, setPexelsImages] = useState<string[]>([]);
  const [pexelsLoading, setPexelsLoading] = useState(false);

  const [x, setX] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [startX, setStartX] = useState(0);

  const SWIPE_THRESHOLD = 120;

  /* =========================
     Fetch VKMs
  ========================= */
  useEffect(() => {
    if (!token) {
      setLoading(false);
      return;
    }

    const fetchVkms = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/vkms`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVkms(res.data.vkms);
      } catch (err) {
        console.error("Kon VKMs niet ophalen:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchVkms();
  }, [token]);

  /* =========================
     Fetch Pexels images TODO: Werkt nog niet.
  ========================= */
  useEffect(() => {
    const fetchPexelsImages = async () => {
      setPexelsLoading(true);
      try {
        const res = await fetch(
          "https://api.pexels.com/v1/search?query=education&orientation=landscape&per_page=30",
          {
            headers: { Authorization: PEXELS_API_KEY },
          }
        );
        const data = await res.json();
        setPexelsImages(data.photos.map((p: any) => p.src.large));
      } catch (err) {
        console.error("Pexels error:", err);
        setPexelsImages([]);
      } finally {
        setPexelsLoading(false);
      }
    };

    fetchPexelsImages();
  }, []);

  /* =========================
     Current VKM
  ========================= */
  const currentVkm = vkms[index];

  const imageUrl =
    pexelsImages.length > 0
      ? pexelsImages[index % pexelsImages.length]
      : "/images/default-vkm.png";

  /* =========================
     Like / Dislike
  ========================= */
  const sendFeedback = (type: "like" | "dislike") => {
    if (!currentVkm) return;
    console.log(type.toUpperCase(), currentVkm.name);
    setIndex((prev) => prev + 1);
    setX(0);
  };

  /* =========================
     Swipe handlers
  ========================= */
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

    if (x > SWIPE_THRESHOLD) sendFeedback("like");
    else if (x < -SWIPE_THRESHOLD) sendFeedback("dislike");

    setX(0);
  };

  /* =========================
     States
  ========================= */
  if (loading || pexelsLoading) {
    return (
      <div className="swipe-page">
        <p>Modules laden...</p>
      </div>
    );
  }

  if (!currentVkm) {
    return (
      <div className="swipe-page">
        <h3>Geen modules meer!</h3>
      </div>
    );
  }

  /* =========================
     Render
  ========================= */
  return (
    <div className="swipe-page">
      <div className="swipe-wrapper">
        <div
          className="swipe-card"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          style={{
            transform: `translateX(${x}px) rotate(${x / 10}deg)`,
            transition: dragging ? "none" : "transform 0.3s ease",
            touchAction: "none",
          }}
        >
          <img
            src={imageUrl}
            alt={currentVkm.name}
            className="swipe-card-image"
          />

          <div className="swipe-card-content">
            <p>
              <strong>Naam:</strong> {currentVkm.name}
            </p>
            <p>
              <strong>Studiepunten:</strong> {currentVkm.studycredit}
            </p>
            <p>
              <strong>Locatie:</strong> {currentVkm.location}
            </p>
            <p>
              <strong>Startdatum:</strong> {currentVkm.start_date}
            </p>
            <p>
              <strong>Beschikbare plekken:</strong> {currentVkm.available_spots}
            </p>
            <p>
              <strong>Niveau:</strong> {currentVkm.level}
            </p>
          </div>
        </div>

        <div className="swipe-actions">
          <button
            className="swipe-btn brand"
            onClick={() => sendFeedback("dislike")}
          >
            X
          </button>
          <button
            className="swipe-btn brand"
            onClick={() => alert("Swipe rechts = like\nSwipe links = dislike")}
          >
            ?
          </button>
          <button
            className="swipe-btn brand"
            onClick={() => sendFeedback("like")}
          >
            ♥
          </button>
        </div>
      </div>
    </div>
  );
}
