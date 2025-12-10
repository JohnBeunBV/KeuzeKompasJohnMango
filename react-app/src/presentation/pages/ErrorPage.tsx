import React from "react";
import { Container, Row, Col, Button } from "react-bootstrap";
import { useNavigate, useLocation } from "react-router-dom";

const ErrorPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  // Check zowel state als query params
  const state = location.state as { status?: number; message?: string } | undefined;
  const searchParams = new URLSearchParams(location.search);
  const queryStatus = Number(searchParams.get("status"));
  const queryMessage = searchParams.get("message");

  const displayStatus = state?.status || queryStatus || 404;
  const displayMessage =
    state?.message || queryMessage || 
    (displayStatus === 401
      ? "Ongeldige sessie. Log opnieuw in."
      : displayStatus === 429
      ? "Te veel requests. Wacht even en probeer later opnieuw."
      : "Pagina niet gevonden.");

  let buttonLabel = "Home";
  let buttonAction = () => navigate("/");

  if (displayStatus === 401) {
    buttonLabel = "Inloggen";
    buttonAction = () => navigate("/login");
  }

  return (
    <Container className="text-center mt-5">
      <Row className="justify-content-center">
        <Col md={8}>
          <div
            className="p-5 rounded shadow-lg"
            style={{
              background: "linear-gradient(135deg, #fff8e1, #ffd54f)",
              border: "2px solid #ffb300",
            }}
          >
            <h1
              style={{
                fontSize: "5rem",
                fontWeight: "800",
                background: "linear-gradient(90deg, #FFD54F, #FF8F00)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {displayStatus}
            </h1>
            <h2 style={{ color: "#FF8F00", fontWeight: 700, marginBottom: "1rem" }}>
              {displayMessage}
            </h2>
            <p style={{ color: "#555" }}>
              {displayStatus === 401
                ? "Klik op de knop hieronder om in te loggen."
                : displayStatus === 429
                ? "Probeer later opnieuw."
                : "Ga terug naar de homepagina."}
            </p>
            <Button className="btn-warning" onClick={buttonAction}>
              {buttonLabel}
            </Button>
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ErrorPage;
