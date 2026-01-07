// src/pages/VkmsPage.tsx
import React, { useEffect, useState } from "react";
import { Container, Row, Col, Spinner, Button, Form } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import type { RootState, AppDispatch } from "../../application/store/store";
import { fetchVkms } from "../../application/Slices/vkmsSlice";
import { login } from "../../application/Slices/authSlice";
import type { Vkm } from "@domain/models/vkm.model";
import "../index.css";
import "../vkmspage.css";
import AccountDrawer from "../components/AccountDrawer";

const VkmsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { data, status, error, totalPages } = useSelector(
    (state: RootState) => state.vkms
  );
  const { user } = useSelector((state: RootState) => state.auth);

  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [creditsInput, setCreditsInput] = useState("");
  const [filters, setFilters] = useState({ search: "", location: "", credits: "" });

  const [pexelsImages, setPexelsImages] = useState<string[]>([]);
  const [pexelsLoading, setPexelsLoading] = useState(true);
  const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_KEY;

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // 🔹 Sync Redux auth met localStorage
  useEffect(() => {
    if (!user) {
      const token = localStorage.getItem("token");
      const localUser = localStorage.getItem("user");
      if (token && localUser) {
        dispatch(login({ token, user: JSON.parse(localUser) }));
      }
    }
  }, [dispatch, user]);

  // 🔹 Redirect als niet ingelogd
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/error", {
        state: {
          status: 401,
          message: "Je bent niet ingelogd. Log in om deze pagina te bekijken.",
        },
      });
    }
  }, [navigate]);

  // 🔹 Fetch VKMs
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    dispatch(fetchVkms({ page, limit: 12, ...filters }));
  }, [dispatch, page, filters]);

  // 🔹 Fetch Pexels afbeeldingen met loading-state
  useEffect(() => {
    const fetchPexelsImages = async () => {
      setPexelsLoading(true);
      try {
        const res = await fetch(
          `https://api.pexels.com/v1/search?query=nature&orientation=landscape&per_page=12&page=${page}`,
          { headers: { Authorization: PEXELS_API_KEY } }
        );
        const data = await res.json();
        setPexelsImages(data.photos.map((p: any) => p.src.medium));
      } catch {
        setPexelsImages([]);
      } finally {
        setPexelsLoading(false);
      }
    };
    fetchPexelsImages();
  }, [page, PEXELS_API_KEY]);

  // 🔹 Redirect bij VKM-fetch errors
  useEffect(() => {
    if (status === "failed") {
      navigate("/error", {
        state: { status: 500, message: error || "Er is iets misgegaan" },
      });
    }
  }, [status, error, navigate]);

  const handleSearch = () => {
    setPage(1);
    setFilters({ search: searchInput, location: locationInput, credits: creditsInput });
  };

  const handleReset = () => {
    setSearchInput("");
    setLocationInput("");
    setCreditsInput("");
    setFilters({ search: "", location: "", credits: "" });
    setPage(1);
  };

  const getPages = () => {
    const pages: (number | string)[] = [];
    const max = totalPages;
    const range = 2;
    if (page > range + 2) pages.push(1, "...");
    for (let i = Math.max(1, page - range); i <= Math.min(max, page + range); i++)
      pages.push(i);
    if (page < max - range - 1) pages.push("...", max);
    return pages;
  };

  if (status === "loading") return <Spinner animation="border" className="mt-5" />;

  return (
    <Container className="mt-4 vkms-page">
      <h1 className="page-title">Beschikbare VKM’s</h1>
      <hr />
      {/* Filters */}
      <Row className="mb-3 align-items-end">
        <Col md={3}>
          <Form.Control
            type="text"
            placeholder="Zoek op naam..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
          />
        </Col>
        <Col md={3}>
          <Form.Select value={locationInput} onChange={(e) => setLocationInput(e.target.value)}>
            <option value="">Alle locaties</option>
            <option value="Breda">Breda</option>
            <option value="Den Bosch">Den Bosch</option>
          </Form.Select>
        </Col>
        <Col md={3}>
          <Form.Select value={creditsInput} onChange={(e) => setCreditsInput(e.target.value)}>
            <option value="">Alle studiepunten</option>
            <option value="15">15</option>
            <option value="30">30</option>
          </Form.Select>
        </Col>
        <Col md={3} className="d-flex gap-2">
          <Button className="btn-search" onClick={handleSearch}>
            Zoeken
          </Button>
          <Button variant="secondary" onClick={handleReset}>
            Reset
          </Button>
        </Col>
      </Row>

      {/* Kaarten */}
      <Row>
        {data.map((vkm: Vkm, index: number) => (
          <Col md={4} key={vkm.id} className="mb-4 d-flex">
            <div className="vkm-card-wrapper" style={{ animationDelay: `${index * 100}ms` }}>
              <div className="vkm-card card h-100 d-flex flex-column">
                {pexelsLoading ? (
                  <div
                    style={{
                      height: "180px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: "#333",
                    }}
                  >
                    <Spinner animation="border" variant="light" />
                  </div>
                ) : (
                  <img
                    src={pexelsImages[index] || "/images/default-vkm.png"}
                    alt={vkm.name}
                    style={{ height: "180px", objectFit: "cover" }}
                    className="card-img-top"
                  />
                )}
                <div className="card-body d-flex flex-column">
                  <h5 className="card-title">
                    {vkm.name} <small className="text-muted">({vkm.studycredit})</small>
                  </h5>
                  <p className="card-text mb-2">{vkm.shortdescription}</p>
                  <hr />
                  <p className="card-text text-muted mt-auto">Locatie: {vkm.location}</p>
                  <div className="mt-3">
                    <Link to={`/vkms/${vkm.id}`} state={{ imageUrl: pexelsImages[index] }}>
                      <Button className="btn-detail">Bekijk details</Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </Col>
        ))}
      </Row>

      {/* Pagination */}
      <div className="d-flex justify-content-center mt-4">
        {getPages().map((p, idx) =>
          p === "..." ? (
            <span
              key={idx}
              className="mx-2 text-muted"
              style={{ cursor: "pointer" }}
              onClick={() => {
                const input = prompt("Ga naar pagina:");
                if (input) setPage(Number(input));
              }}
            >
              ...
            </span>
          ) : (
            <Button
              key={p}
              variant={p === page ? "warning" : "light"}
              className="mx-1"
              onClick={() => setPage(p as number)}
            >
              {p}
            </Button>
          )
        )}
      </div>
      <div className={`side-drawer ${isDrawerOpen ? "open" : ""}`}>
        <div className="side-drawer-panel">

          <button
            className="side-drawer-toggle"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            aria-label="Toggle side panel"
          >
            <span className="toggle-arrow"><svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M5 7.5L10 12.5L15 7.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>
          </button>

          <div className="side-drawer-content">
            <AccountDrawer />
          </div>

        </div>
      </div>
    </Container>
  );
};

export default VkmsPage;
