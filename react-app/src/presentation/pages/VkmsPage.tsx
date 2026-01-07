import React, { useEffect, useState } from "react";
import { Container, Row, Col, Spinner, Button } from "react-bootstrap";
import { useSelector, useDispatch } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router-dom";
import type { RootState, AppDispatch } from "../../application/store/store";
import { fetchVkms } from "../../application/Slices/vkmsSlice";
import { login } from "../../application/Slices/authSlice";
import type { Vkm } from "@domain/models/vkm.model";
import VkmFilter from "../components/VkmFilter";
import "../index.css";
import "../vkmspage.css";
import AccountDrawer from "../components/AccountDrawer";

const VkmsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  const { data, status, error } = useSelector((state: RootState) => state.vkms);
  const { user } = useSelector((state: RootState) => state.auth);

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [allVkms, setAllVkms] = useState<Vkm[]>([]);
  const [page, setPage] = useState(1);

  const [pexelsImages, setPexelsImages] = useState<Record<number, string>>({});
  // const [pexelsLoading, setPexelsLoading] = useState(false);
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
        state: { status: 401, message: "Je bent niet ingelogd. Log in om deze pagina te bekijken." },
      });
    }
  }, [navigate]);

  // 🔹 Fetch all VKMs once
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;
    dispatch(fetchVkms({ page: 1, limit: 1000 }));
  }, [dispatch]);

  // 🔹 Store all VKMs when data changes
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

  // 🔹 Handle filters update
  const handleFilterChange = (newFilters: Record<string, string>) => {
    setFilters(newFilters);
    setPage(1); // reset to first page
  };

  // 🔹 Client-side filtering
  const filteredVkms = allVkms.filter((vkm) => {
    for (const [key, value] of Object.entries(filters)) {
      if (!value) continue;

      if (key.startsWith("search")) {
        // Check name
        const nameMatch = vkm.name?.toLowerCase().includes(value.toLowerCase());
        // Check tags
        let tags: string[] = [];
        if (Array.isArray(vkm.module_tags)) {
          tags = vkm.module_tags;
        } else if (typeof vkm.module_tags === "string") {
          tags = vkm.module_tags.split(",").map((t) => t.trim());
        }
        const tagsMatch = tags.some((t) => t.toLowerCase().includes(value.toLowerCase()));
        if (!nameMatch && !tagsMatch) return false;
      } else if (key === "location" && vkm.location !== value) return false;
      else if (key === "credits" && vkm.studycredit?.toString() !== value) return false;
      else if (key === "level" && vkm.level !== value) return false;
    }
    return true;
  });

  // 🔹 Pagination
  const itemsPerPage = 12;
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedVkms = filteredVkms.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredVkms.length / itemsPerPage);

  const getPages = () => {
    const pages: (number | string)[] = [];
    const range = 2;
    if (page > range + 2) pages.push(1, "...");
    for (let i = Math.max(1, page - range); i <= Math.min(totalPages, page + range); i++) pages.push(i);
    if (page < totalPages - range - 1) pages.push("...", totalPages);
    return pages;
  };

  if (status === "loading") return <Spinner animation="border" className="mt-5" />;

  return (
      <Container className="mt-4 vkms-page">
        <h1 className="page-title">Beschikbare VKM's</h1>
        <hr />

        {/* VkmFilter Component */}
        <div className="mb-4">
          <VkmFilter
              onFilterChange={handleFilterChange}
              initialFilters={location.state?.tagSearch ? { search1: location.state.tagSearch } : {}}
          />
        </div>

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
