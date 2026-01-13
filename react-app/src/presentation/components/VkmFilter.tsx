import React, { useState, useEffect, useRef } from "react";
import { Form, Button, Row, Col, Card, Badge, InputGroup } from "react-bootstrap";

import "../vkmfilter.css";

interface VkmFilterProps {
    onFilterChange: (filters: Record<string, string>) => void;
    initialFilters?: Record<string, string>;
}

export default function VkmFilter({ onFilterChange, initialFilters = {} }: VkmFilterProps) {
    const [filters, setFilters] = useState<Record<string, string>>({});
    const [open, setOpen] = useState(false);
    const [searchInput, setSearchInput] = useState("");
    const isInitialMount = useRef(true);

    const filterLabels: Record<string, string> = {
        location: "Locatie",
        level: "Niveau",
        credits: "Studiepunten",
        search: "Zoekterm",
    };

    useEffect(() => {
        const saved = JSON.parse(localStorage.getItem("activeVkmFilters") || "{}");
        const merged = { ...saved, ...initialFilters };
        setFilters(merged);
        isInitialMount.current = false;
    }, []);

    useEffect(() => {
        if (!isInitialMount.current) {
            localStorage.setItem("activeVkmFilters", JSON.stringify(filters));
        }
    }, [filters]);

    function handleChange(e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement | HTMLTextAreaElement>) {
        const { name, value } = e.target;
        if (name === "search") {
            setSearchInput(value);
        } else {
            const newFilters = { ...filters };
            if (value === "") {
                delete newFilters[name];
            } else {
                newFilters[name] = value;
            }
            setFilters(newFilters);
            onFilterChange(newFilters);
        }
    }

    function handleSearchSubmit(e: React.FormEvent) {
        e.preventDefault(); // Prevents page reload
        const searchValue = searchInput.trim();
        if (!searchValue) return;

        const newFilters = { ...filters, search: searchValue };
        setFilters(newFilters);
        onFilterChange(newFilters);
        setSearchInput("");
    }

    function handleReset() {
        setFilters({});
        setSearchInput("");
        onFilterChange({});
    }

    function removeFilter(key: string) {
        const updated = { ...filters };
        delete updated[key];
        setFilters(updated);
        onFilterChange(updated);
    }

    const activeFilters = Object.entries(filters);

    return (
        <Card className="vkm-filter-card h-100 d-flex flex-column">
            <Card.Body>
                {/* Active Filters Display */}
                <div className="mb-3 d-flex flex-wrap gap-2 align-items-center">
                    {activeFilters.map(([key, value]) => (
                        <Badge key={key} bg="light" text="dark" className="d-flex align-items-center gap-2 filter-badge">
                            <span>{value}</span>
                            <button 
                                type="button" 
                                onClick={() => removeFilter(key)} 
                                className="filter-remove-btn"
                                aria-label={`Verwijder ${filterLabels[key] || key}`} // Usage restored here!
                            >
                                &times;
                            </button>
                        </Badge>
                    ))}
                </div>

                {/* Main Filter Bar */}
                <Form onSubmit={handleSearchSubmit}>
                    <div className="filter-grid-container mb-3">
                        {/* Filter Toggle Button */}
                        <Button 
                            className="btn-detail filter-toggle-btn" 
                            onClick={() => setOpen((prev) => !prev)}
                        >
                            <i className="bi bi-sliders d-md-none"></i>
                            <span className="d-none d-md-inline">
                                {open ? "Filters verbergen" : "Filters tonen"}
                            </span>
                        </Button>

                        {/* Search Bar */}
                        <InputGroup className="filter-search-group">
                            {/* Removed d-md-none so the icon shows on desktop too */}
                            <InputGroup.Text className="bg-white">
                                <i className="bi bi-search"></i>
                            </InputGroup.Text>
                            <Form.Control
                                type="text"
                                name="search"
                                placeholder="Zoeken..."
                                value={searchInput}
                                onChange={handleChange}
                            />
                        </InputGroup>

                        {/* Action Buttons */}
                        <div className="filter-actions">
                            <Button type="submit" className="btn-header search-btn">
                                <i className="bi bi-arrow-right d-md-none"></i>
                                <span className="d-none d-md-inline">Zoeken</span>
                            </Button>

                            <Button className="btn-header reset-btn" onClick={handleReset}>
                                <i className="bi bi-x-lg d-md-none"></i>
                                <span className="d-none d-md-inline">Reset</span>
                            </Button>
                        </div>
                    </div>
                </Form>

                {/* Collapsible Filters */}
                {open && (
                    <Row className="g-3 mt-2">
                        <Col xs={12} md={4}>
                            <Form.Group controlId="filterLocation">
                                <Form.Label className="d-md-block">Locatie</Form.Label>
                                <Form.Select 
                                    name="location" 
                                    value={filters.location || ""} 
                                    onChange={handleChange}
                                >
                                    <option value="">Alle locaties</option>
                                    <option value="Breda">Breda</option>
                                    <option value="Tilburg">Tilburg</option>
                                    <option value="Den Bosch">Den Bosch</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={4}>
                            <Form.Group controlId="filterCredits">
                                <Form.Label className="d-md-block">Studiepunten</Form.Label>
                                <Form.Select 
                                    name="credits" 
                                    value={filters.credits || ""} 
                                    onChange={handleChange}
                                >
                                    <option value="">Alle studiepunten</option>
                                    <option value="15">15</option>
                                    <option value="30">30</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        <Col xs={12} md={4}>
                            <Form.Group controlId="filterLevel">
                                <Form.Label className="d-md-block">Niveau</Form.Label>
                                <Form.Select 
                                    name="level" 
                                    value={filters.level || ""} 
                                    onChange={handleChange}
                                >
                                    <option value="">Alle niveaus</option>
                                    <option value="NLQF5">NLQF5</option>
                                    <option value="NLQF6">NLQF6</option>
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                )}
            </Card.Body>
        </Card>
    );
}