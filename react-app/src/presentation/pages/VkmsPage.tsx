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

  const [pexelsImages, setPexelsImages] = useState<Record<number, string>>({});
  // const [pexelsLoading, setPexelsLoading] = useState(false);
  const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_KEY;

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
  const fetchImages = async () => {
    const promises = data.map(async (vkm) => {
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
        const img = json.photos?.[0]?.src?.medium || "/john-mango.png";

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

  if (data.length) fetchImages();
}, [data, PEXELS_API_KEY]);



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
  {data.map((vkm: Vkm, index: number) => {
    const img = pexelsImages[vkm.id]; // individuele afbeelding voor deze vkm

    return (
      <Col md={4} key={vkm.id} className="mb-4 d-flex">
        <div className="vkm-card-wrapper" style={{ animationDelay: `${index * 100}ms` }}>
          <div className="vkm-card card h-100 d-flex flex-column">

            {/* 🔹 Per-kaart loading */}
            {!img ? (
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
                src={img || "/john-mango.png"}
                alt={vkm.name}
                style={{ height: "180px", objectFit: "cover" }}
                className="card-img-top"
                onError={(e) => {
    (e.target as HTMLImageElement).src = "/john-mango.png"; // fallback bij broken image
  }}
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
                <Link to={`/vkms/${vkm.id}`} state={{ imageUrl: img }}>
                  <Button className="btn-detail">Bekijk details</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Col>
    );
  })}
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
    </Container>
  );
};

export default VkmsPage;
