import React, {useEffect, useState} from "react";
import {useParams, useLocation, useNavigate} from "react-router-dom";
import {Container, Row, Col, Spinner} from "react-bootstrap";
import "../index.css";
import {useAppDispatch, useAppSelector} from "../../application/store/hooks";
import apiClient from "../../infrastructure/ApiClient";
import {fetchUser} from "../../application/Slices/authSlice";
import {fetchVkmById} from "../../application/Slices/vkmsSlice";


const VkmsDetailPage: React.FC = () => {
    const {id} = useParams<{ id: string }>();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();

    const location = useLocation();

    const {isAuthenticated, user} = useAppSelector((s) => s.auth);

    const vkm = useAppSelector((state) => state.vkms.selected);
    const isFavorite = !!user?.favorites.find((f) => f._id === id);


    const [imageUrl, setImageUrl] = useState<string>(
        (location.state as any)?.imageUrl || "/images/default-vkm.png"
    );

    useEffect(() => {
        dispatch(fetchUser());
    }, [dispatch]);

    useEffect(() => {
        if (id) dispatch(fetchVkmById(id));
    }, [dispatch, id]);

    useEffect(() => {
        const fetchPexelsImage = async () => {
            if (!vkm) return;

            const cacheKey = `vkm-image-${vkm._id}`;


            // 1️⃣ Check localStorage cache
            const cachedImage = localStorage.getItem(cacheKey);
            if (cachedImage) {
                setImageUrl(cachedImage);
                return;
            }

            // 2️⃣ Als image via state is meegekomen → opslaan & stoppen
            const stateImage = (location.state as any)?.imageUrl;
            if (stateImage) {
                localStorage.setItem(cacheKey, stateImage);
                setImageUrl(stateImage);
                return;
            }

            // 3️⃣ Anders: ophalen via Pexels
            try {
                const res = await fetch(
                    `https://api.pexels.com/v1/search?query=${encodeURIComponent(
                        vkm.name
                    )}&orientation=landscape&per_page=1`,
                    {
                        headers: {
                            Authorization: import.meta.env.VITE_PEXELS_KEY,
                        },
                    }
                );

                const data = await res.json();

                const img =
                    data.photos?.[0]?.src?.large ||
                    data.photos?.[0]?.src?.medium ||
                    "/images/default-vkm.png";

                localStorage.setItem(cacheKey, img);
                setImageUrl(img);
            } catch (err) {
                console.error("Pexels image ophalen mislukt:", err);
                setImageUrl("/images/default-vkm.png");
            }
        };
        fetchPexelsImage();
    }, [vkm, location.state]);

    // 🔹 Tag klik: voeg toe aan active filters en ga terug naar VkmsPage
    const handleTagClick = (tag: string) => {
        const newFilters = {
            search: tag,
        };

        localStorage.setItem("activeVkmFilters", JSON.stringify(newFilters));

        navigate("/vkms", {
            state: {
                fromTag: true,
            },
        });
    };

    if (!isAuthenticated) {
        return (
            <Container className="text-center mt-5">
                <Spinner animation="border" role="status"/>
                <p>Laden...</p>
            </Container>
        );
    }

    const handleToggleFavorite = async () => {
        const method = isFavorite ? apiClient.delete : apiClient.post;
        await method(`/auth/users/favorites/${id}`);
        dispatch(fetchUser());
    };

    if (status === "loading") return <p>Loading...</p>;
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
                            style={{width: "100%", borderRadius: "16px", objectFit: "cover"}}
                            onError={(e) => {
                                (e.target as HTMLImageElement).src = "/john-mango.png";
                            }} // fallback bij broken image
                        />
                        <h4 className="mb-3">Module Info</h4>
                        <hr/>
                        <div className="favorite-buttons mb-3">
                            <button
                                className={`btn ${isFavorite ? "btn-danger" : "btn-warning"} btn-sm me-2`}
                                onClick={handleToggleFavorite}
                            >
                                {isFavorite ? (
                                    <>
                                        <i className="bi bi-trash3-fill me-1"></i> Verwijder uit favorieten
                                    </>
                                ) : (
                                    <>
                                        <i className="bi bi-heart-fill me-1"></i> Voeg toe aan favorieten
                                    </>
                                )}
                            </button>
                        </div>
                        <hr/>
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
                        <div className="shortdescription-wrapper">
                            <div className="shortdescription-text">
                                <h3>Korte beschrijving</h3>
                                <hr/>
                                <p>{vkm.shortdescription || "Geen korte beschrijving beschikbaar."}</p>
                            </div>
                            <img
                                src="/john-mango.png"
                                alt="John Mango"
                                className="john-mango-image"
                            />
                        </div>

                        <h3 className="mt-4">Beschrijving</h3>
                        <hr/>
                        <p>{vkm.description || "Geen beschrijving beschikbaar."}</p>

                        <h3 className="mt-4">Leerdoelen</h3>
                        <hr/>
                        <p>{vkm.learningoutcomes || "Nog niet bekend"}</p>

                        <h3 className="mt-4">Tags</h3>
                        <hr/>
                        <div className="tags-container">
                            {parseTags(vkm.module_tags).map((tag, index) => (
                                <span
                                    key={index}
                                    className="tag-chip"
                                    style={{cursor: "pointer"}}
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
        .map(tag => tag.replace(/['"]+/g, "").trim())
        .filter(tag => tag.length > 0);
}

export default VkmsDetailPage;
