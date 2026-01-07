import React, { useState, useEffect } from "react";
import { Form, Button, Row, Col, Card, Badge } from "react-bootstrap";

interface VkmFilterProps {
    onFilterChange: (filters: Record<string, string>) => void;
    initialFilters?: Record<string, string>;
}

export default function VkmFilter({ onFilterChange, initialFilters = {} }: VkmFilterProps) {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [open, setOpen] = useState(false);
    const [searchInput, setSearchInput] = useState(""); // 🔹 tijdelijke state voor zoekbalk

    const filterLabels: Record<string, string> = {
        course: "Opleiding",
        location: "Locatie",
        period: "Periode",
        language: "Taal",
        level: "Niveau",
        credits: "Studiepunten",
        search: "Zoekterm",
    };

    // 🔹 Load filters from localStorage on mount
    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem("activeVkmFilters") || "{}");
        const merged = { ...saved, ...initialFilters };
        setFilters(merged);
        onFilterChange(merged);
    }, []);

    // 🔹 Save filters to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem("activeVkmFilters", JSON.stringify(filters));
        onFilterChange(filters);
    }, [filters]);

    function handleChange(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) {
        const { name, value } = e.target;
        if (name === "search") {
            setSearchInput(value); // 🔹 wijzig alleen tijdelijke searchInput
        } else {
            setFilters((prev) => ({ ...prev, [name]: value }));
        }
    }

    function addSearchFilter() {
        const searchValue = searchInput.trim();
        if (!searchValue) return;

        // 🔹 Find next available search key
        let index = 1;
        let key = `search${index}`;
        const newFilters = { ...filters };
        while (newFilters[key]) {
            index++;
            key = `search${index}`;
        }

        newFilters[key] = searchValue;
        setFilters(newFilters);
        setSearchInput(""); // 🔹 clear input pas na toevoegen
    }

    function handleReset() {
        setFilters({});
        setSearchInput("");
    }

    function removeFilter(key: string) {
        const updated = { ...filters };
        delete updated[key];
        setFilters(updated);
    }

    const activeFilters = Object.entries(filters);

    return (
        <Card className="vkm-filter-card card h-100 d-flex flex-column">
            <Card.Body>
                {/* Active Filters Display */}
                {activeFilters.length > 0 && (
                    <>
                        <div className="mb-3 d-flex flex-wrap gap-2 align-items-center">
                            {activeFilters.map(([key, value]) => (
                                <Badge
                                    key={key}
                                    bg="light"
                                    text="dark"
                                    className="d-flex align-items-center gap-2"
                                    style={{ fontSize: "0.9rem", padding: "0.5rem 0.75rem" }}
                                >
                                    <span>{value}</span>
                                    <button
                                        type="button"
                                        onClick={() => removeFilter(key)}
                                        style={{
                                            background: "none",
                                            border: "none",
                                            color: "inherit",
                                            cursor: "pointer",
                                            padding: 0,
                                            fontSize: "1.2rem",
                                            lineHeight: 1,
                                        }}
                                        aria-label={`Verwijder ${filterLabels[key] || key}`}
                                    >
                                        ×
                                    </button>
                                </Badge>
                            ))}
                        </div>
                        <hr className="my-3" />
                    </>
                )}

                <div className="d-flex align-items-center gap-3 mb-3">
                    <Button className="btn-detail" onClick={() => setOpen((prev) => !prev)}>
                        {open ? "Filters verbergen" : "Filters tonen"}
                    </Button>

                    <Form.Control
                        type="text"
                        name="search"
                        placeholder="Zoeken op naam of tag..."
                        value={searchInput} // 🔹 bind aan tijdelijke input
                        onChange={handleChange}
                        style={{ maxWidth: "400px" }}
                    />

                    <Button className="btn-header" onClick={addSearchFilter}>
                        Toevoegen
                    </Button>

                    <Button className="btn-header" onClick={handleReset}>
                        Reset
                    </Button>
                </div>

                {open && (
                    <Row className="g-3">
                        <Col md={4}>
                            <Form.Label>Locatie</Form.Label>
                            <Form.Select name="location" value={filters.location || ""} onChange={handleChange}>
                                <option value="">Alle locaties</option>
                                <option value="Breda">Breda</option>
                                <option value="Tilburg">Tilburg</option>
                                <option value="Den Bosch">Den Bosch</option>
                            </Form.Select>
                        </Col>

                        <Col md={4}>
                            <Form.Label>Studiepunten</Form.Label>
                            <Form.Select name="credits" value={filters.credits || ""} onChange={handleChange}>
                                <option value="">Alle studiepunten</option>
                                <option value="15">15</option>
                                <option value="30">30</option>
                            </Form.Select>
                        </Col>

                        <Col md={4}>
                            <Form.Label>Niveau</Form.Label>
                            <Form.Select name="level" value={filters.level || ""} onChange={handleChange}>
                                <option value="">Alle niveaus</option>
                                <option value="NLQF5">NLQF5</option>
                                <option value="NLQF6">NLQF6</option>
                            </Form.Select>
                        </Col>
                    </Row>
                )}
            </Card.Body>
        </Card>
    );
}
