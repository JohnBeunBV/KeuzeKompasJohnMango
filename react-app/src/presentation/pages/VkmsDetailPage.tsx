import React, { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Container, Row, Col, Spinner } from "react-bootstrap";
import axios from "axios";
import "../index.css";
import type { Vkm } from "@domain/models/vkm.model";

const API_BASE_URL = import.meta.env.VITE_API_URL;

const VkmsDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const token = localStorage.getItem("token");

  const [vkm, setVkm] = useState<Vkm | null>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loadingFavorites, setLoadingFavorites] = useState(true);

  const imageUrl = (location.state as any)?.imageUrl || "/images/default-vkm.png";

  // 🔹 Fetch VKM data
  useEffect(() => {
    if (!token) {
      navigate("/error", {
        state: { status: 401, message: "Je bent niet ingelogd. Log in om deze pagina te bekijken." },
      });
      return;
    }

    if (!id || isNaN(Number(id))) {
      navigate("/error", { state: { status: 404, message: "Deze VKM bestaat niet" } });
      return;
    }

    const fetchVkm = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/vkms/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.data || !res.data.id) {
          navigate("/error", { state: { status: 404, message: "Deze VKM bestaat niet" } });
          return;
        }

        setVkm(res.data);
      } catch (err: any) {
        console.error("Kon VKM niet ophalen:", err);
        if (err.response?.status === 404) {
          navigate("/error", { state: { status: 404, message: "Deze VKM bestaat niet" } });
        } else {
          navigate("/error", { state: { status: 500, message: "Er is iets misgegaan" } });
        }
      } finally {
        setLoading(false);
      }
    };

    fetchVkm();
  }, [id, token, navigate]);

  // 🔹 Fetch favorite status
  useEffect(() => {
    if (!token || !id) return;

    const fetchFavorites = async () => {
      setLoadingFavorites(true);
      try {
        const res = await axios.get(`${API_BASE_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const favorites: number[] = res.data.favorites.map((f: any) => Number(f.id));
        setIsFavorite(favorites.includes(Number(id)));
        localStorage.setItem("favorites", JSON.stringify(favorites));
      } catch (err) {
        console.error("Kon favorites niet ophalen:", err);
        const storedFavs = JSON.parse(localStorage.getItem("favorites") || "[]");
        setIsFavorite(storedFavs.includes(Number(id)));
      } finally {
        setLoadingFavorites(false);
      }
    };

    fetchFavorites();
  }, [id, token]);

  const handleToggleFavorite = async () => {
    if (!vkm) return alert("Geen VKM gevonden");
    if (!token) return alert("Je bent niet ingelogd");

    try {
      const method = isFavorite ? "delete" : "post";
      const url = `${API_BASE_URL}/auth/users/favorites/${vkm.id}`;
      const res = await axios({ method, url, headers: { Authorization: `Bearer ${token}` } });

      const favorites: number[] = res.data.favorites.map((f: any) => Number(f.id));
      localStorage.setItem("favorites", JSON.stringify(favorites));
      setIsFavorite(!isFavorite);
      alert(res.data.message);
    } catch (err: any) {
      console.error("Toggle favorite error:", err);
      alert(`Kon VKM niet toevoegen/verwijderen: ${err.response?.data?.error || err.message}`);
    }
  };

  // 🔹 Tag klik: voeg toe aan active filters en ga terug naar VkmsPage
  const handleTagClick = (tag: string) => {
    const savedFilters: Record<string, string> = JSON.parse(
        localStorage.getItem("activeVkmFilters") || "{}"
    );

    let index = 1;
    let key = `search${index}`;
    while (savedFilters[key]) {
      index++;
      key = `search${index}`;
    }

    savedFilters[key] = tag;
    localStorage.setItem("activeVkmFilters", JSON.stringify(savedFilters));

    navigate("/vkms", { state: { tagSearch: tag } });
  };

  if (loading) {
    return (
        <Container className="text-center mt-5">
          <Spinner animation="border" role="status" />
          <p>Laden...</p>
        </Container>
    );
  }

  if (!vkm) {
    return (
        <Container className="text-center mt-5">
          <h3 className="text-danger">Deze VKM bestaat niet</h3>
        </Container>
    );
  }

  return (
      <Container className="mt-5 vkm-detail">
        <Row>
          <Col md={3} className="vkm-info">
            <div className="info-box">
              <img
                  src={imageUrl}
                  alt={vkm.name || "Onbekend"}
                  className="vkm-detail-image mb-4"
                  style={{ width: "100%", borderRadius: "16px", objectFit: "cover" }}
              />
              <h4 className="mb-3">Module Info</h4>
              <hr />
              <div className="favorite-buttons mb-3">
                <button
                    className={`btn ${isFavorite ? "btn-danger" : "btn-warning"} btn-sm me-2`}
                    disabled={loadingFavorites}
                    onClick={handleToggleFavorite}
                >
                  {isFavorite ? "Verwijder uit favorieten" : "Voeg toe aan favorieten"}
                </button>
              </div>
              <hr />
              <p><strong>Naam:</strong> {vkm.name || "Onbekend"}</p>
              <p><strong>Studiepunten:</strong> {vkm.studycredit ?? 0}</p>
              <p><strong>Locatie:</strong> {vkm.location || "Onbekend"}</p>
              <p><strong>Startdatum:</strong> {vkm.start_date || "Onbekend"}</p>
              <p><strong>Beschikbare plekken:</strong> {vkm.available_spots ?? 0}</p>
              <p><strong>Niveau:</strong> {vkm.level || "Onbekend"}</p>
              <p><strong>Contact ID:</strong> {vkm.contact_id ?? "Onbekend"}</p>
            </div>
          </Col>

          <Col md={9} className="vkm-content">
            <div className="content-box">
              <h3>Korte beschrijving</h3>
              <hr />
              <p>{vkm.shortdescription || "Geen korte beschrijving beschikbaar."}</p>

              <h3 className="mt-4">Beschrijving</h3>
              <hr />
              <p>{vkm.description || "Geen beschrijving beschikbaar."}</p>

              <h3 className="mt-4">Leerdoelen</h3>
              <hr />
              <p>{vkm.learningoutcomes || "Nog niet bekend"}</p>

              <h3 className="mt-4">Tags</h3>
              <hr />
              <div className="tags-container">
                {parseTags(vkm.module_tags).map((tag, index) => (
                    <span
                        key={index}
                        className="tag-chip"
                        style={{ cursor: "pointer" }}
                        onClick={() => handleTagClick(tag)}
                    >
                  <span className="tag-icon">#</span> {tag}
                </span>
                ))}
              </div>
            </div>
          </Col>
        </Row>
      </Container>
  );
};

// 🔹 Parse tags uit string of array
function parseTags(input: string | string[] | undefined): string[] {
  if (!input) return [];
  const str = Array.isArray(input) ? input.join(",") : input;
  return str
      .replace(/^\[|\]$/g, "")
      .split(",")
      .map((tag) => tag.replace(/['"]+/g, "").trim())
      .filter((tag) => tag.length > 0);
}

export default VkmsDetailPage;
