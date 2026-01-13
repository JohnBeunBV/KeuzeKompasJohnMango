// src/pages/VkmsPage.tsx
import React, {useEffect, useState} from "react";
import {Container, Row, Col, Spinner, Button} from "react-bootstrap";
import {useAppDispatch, useAppSelector} from "../../application/store/hooks";
import {Link, useNavigate} from "react-router-dom";
import {fetchVkms} from "../../application/Slices/vkmsSlice";
import type {Vkm} from "@domain/models/vkm.model";
import "../index.css";
import "../vkmspage.css";
import AccountDrawer from "../components/AccountDrawer";
import {fetchUser} from "../../application/Slices/authSlice.ts";
import VkmFilter from "../components/VkmFilter";

const VkmsPage: React.FC = () => {
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const {data, status, error, totalPages} = useAppSelector(
        (state) => state.vkms
    );
    const [filters, setFilters] = useState<Record<string, string>>(() => {
        return JSON.parse(localStorage.getItem("activeVkmFilters") || "{}");
    });


    const [page, setPage] = useState(1);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const [pexelsImages, setPexelsImages] = useState<Record<string, string>>({});
    const [pexelsLoading, setPexelsLoading] = useState(true);
    const PEXELS_API_KEY = import.meta.env.VITE_PEXELS_KEY;

    const [isMobile, setIsMobile] = useState(window.innerWidth <= 500);

    // 🔹 Handle window resize for responsiveness
    useEffect(() => {
      const handleResize = () => setIsMobile(window.innerWidth <= 500);
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }, []);

    // Disable scrolling when drawer is open on mobile
    useEffect(() => {
      if (isDrawerOpen && isMobile) {
        document.body.style.overflow = "hidden";
      } else {
        document.body.style.overflow = "";
      }

      return () => {
        document.body.style.overflow = "";
      };
    }, [isDrawerOpen, isMobile]);


    // 🔹 Fetch VKMs
    useEffect(() => {
        dispatch(fetchVkms({page, limit: 12, ...filters}));
    }, [dispatch, page, filters]);

    useEffect(() => {
        dispatch(fetchUser());
    }, [dispatch]);

    // 🔹 Fetch Pexels afbeeldingen met loading-state
    useEffect(() => {
        const fetchImages = async () => {
            const promises = data.map(async (vkm) => {
                const cacheKey = `vkm-image-${vkm._id}`;
                const cached = localStorage.getItem(cacheKey);

                if (cached) return {_id: vkm._id, img: cached};

                try {
                    const res = await fetch(
                        `https://api.pexels.com/v1/search?query=${encodeURIComponent(
                            vkm.name
                        )}&orientation=landscape&per_page=1`,
                        {headers: {Authorization: PEXELS_API_KEY}}
                    );
                    const json = await res.json();
                    const img = json.photos?.[0]?.src?.medium || "/john-mango.png";

                    localStorage.setItem(cacheKey, img);
                    return {_id: vkm._id, img};
                } catch {
                    return {_id: vkm._id, img: "/john-mango.png"};
                }
            });

            const results = await Promise.all(promises);

            setPexelsImages((prev) => {
                const updated = {...prev};
                results.forEach(({_id, img}) => {
                    updated[_id] = img;
                });
                return updated;
            });
        };

        if (data.length) fetchImages().finally(() => setPexelsLoading(false));
    }, [data, PEXELS_API_KEY]);

    // 🔹 Redirect bij VKM-fetch errors
    useEffect(() => {
        if (status === "failed") {
            navigate("/error", {
                state: {status: 500, message: error || "Er is iets misgegaan"},
            });
        }
    }, [status, error, navigate]);


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
            <hr/>

            {/* Filters */}
            <VkmFilter
                onFilterChange={(newFilters) => {
                    setFilters(newFilters);
                    setPage(1);
                }}
                initialFilters={filters}
            />

            <br/>

            {/* Kaarten */}
            <Row>
                {data.map((vkm: Vkm, index: number) => {
                    const id = String(vkm._id);

                    return (
                        <Col xs={12} md={6} xl={4} key={id} className="mb-4 d-flex">
                            <div
                                className="vkm-card-wrapper"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
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
                                            src={pexelsImages[id] ?? "/images/default-vkm.png"}
                                            alt={vkm.name}
                                            style={{ height: "180px", objectFit: "cover" }}
                                            className="card-img-top"
                                        />
                                    )}

                                    <div className="card-body d-flex flex-column">
                                        <h5 className="card-title">
                                            {vkm.name}{" "}
                                            <small className="text-muted">
                                                ({vkm.studycredit})
                                            </small>
                                        </h5>

                                        <p className="card-text mb-2">
                                            {vkm.shortdescription}
                                        </p>

                                        <hr />

                                        <p className="card-text text-muted mt-auto">
                                            Locatie: {vkm.location}
                                        </p>

                                        <div className="mt-3">
                                            <Link
                                                to={`/vkms/${id}`}
                                                state={{ imageUrl: pexelsImages[id] }}
                                            >
                                                <Button className="btn-detail">
                                                    Bekijk details
                                                </Button>
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
                                style={{cursor: "pointer"}}
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

                {/* TOGGLE — INSIDE PANEL */}
                <button
                  className={`side-drawer-toggle ${isDrawerOpen ? "open" : ""}`}
                  onClick={() => setIsDrawerOpen(!isDrawerOpen)}
                  aria-label="Toggle side panel"
                >
                  <span className="toggle-arrow">
                    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                      <path
                        d="M5 7.5L10 12.5L15 7.5"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </span>
                </button>

                {/* CONTENT */}
                <div className="side-drawer-content">
                  {isMobile && isDrawerOpen && (
                    <button
                      className="side-drawer-close-btn"
                      onClick={() => setIsDrawerOpen(false)}
                    >
                      ✕
                    </button>
                  )}
                  <AccountDrawer />
                </div>

              </div>
            </div>
        </Container>
    );
};

export default VkmsPage;