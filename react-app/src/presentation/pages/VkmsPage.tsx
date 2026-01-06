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

const VkmsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const location = useLocation();

  const { data, status, error } = useSelector((state: RootState) => state.vkms);
  const { user } = useSelector((state: RootState) => state.auth);

  const [filters, setFilters] = useState<Record<string, string>>({});
  const [allVkms, setAllVkms] = useState<Vkm[]>([]);
  const [page, setPage] = useState(1);

  const [pexelsImages, setPexelsImages] = useState<string[]>([]);
  const [pexelsLoading, setPexelsLoading] = useState(true);
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
    if (data.length > 0) setAllVkms(data);
  }, [data]);

  // 🔹 Fetch Pexels images
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

        {/* VKM Cards */}
        <Row>
          {paginatedVkms.map((vkm, index) => (
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
      </Container>
  );
};

export default VkmsPage;
