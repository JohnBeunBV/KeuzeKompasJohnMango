import { Container, Row, Col, Carousel, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "../index.css";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      {/* Header */}
      <header className="homepage-header text-center p-5 mb-5">
        <h1>Welkom bij John Mango</h1>
        <p className="lead">
          Ontdek en beheer VKM's in een stijlvol, kleurrijk en interactief mango-thema.
        </p>
        <Button
          className="btn-header2"
          onClick={() => navigate("/vkms")}
        >
          Ontdek VKM's
        </Button>
      </header>

      {/* Carousel */}
      <Container className="my-5">
        <Carousel className="homepage-carousel">
          <Carousel.Item>
            <img
              className="d-block w-100 carousel-image"
              src="/beautiful-outdoor-landscape-tropical-nature-with-sea-beach-sunset-sunrise.jpg"
              alt="Swipe VKM's"
            />
            <Carousel.Caption className="carousel-caption">
              <h3>Swipe VKM's</h3>
              <p>Swipe VKM's die passen bij jouw studie en interesses.</p>
              <Button
                className="btn-header"
                onClick={() => navigate("/swipe")}
              >
                Swipe VKM's
              </Button>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100 carousel-image"
              src="/low-angle-shot-clouds-colorful-sky-captured-twilight.jpg"
              alt="Smart Study Coach"
            />
            <Carousel.Caption className="carousel-caption">
              <h3>Smart Study Coach</h3>
              <p>Bekijk jouw aanbevolen VKM's op je profiel pagina!</p>

              <Button
                className="btn-header"
                onClick={() => navigate("/account")}
              >
                Ga naar profiel
              </Button>
            </Carousel.Caption>
          </Carousel.Item>
          <Carousel.Item>
            <img
              className="d-block w-100 carousel-image"
              src="/scenic-shot-orange-sky-forest-sunset.jpg"
              alt="Altijd up-to-date"
            />
            <Carousel.Caption className="carousel-caption">
              <h3>Altijd up-to-date</h3>
              <p>Blijf op de hoogte van nieuwe VKM's en beschikbare plekken.</p>
            </Carousel.Caption>
          </Carousel.Item>
        </Carousel>
      </Container>

      <hr />

      {/* Feature Cards */}
      <Container className="my-5 text-center">
        <Row className="g-4 justify-content-center">
          {/* Card 1 */}
          <Col md={4} className="d-flex justify-content-center">
            <div className="feature-card wide-card">
              <h4 className="feature-title">Snelle VKM-zoeker</h4>
              <p>Vind direct VKM's die passen bij jouw interesses.</p>
              <button
                className="feature-toggle"
                onClick={(e) => {
                  const card = (e.currentTarget.parentElement as HTMLElement).querySelector('.feature-details')!;
                  card.classList.toggle('open');
                }}
              >
                Meer info
              </button>
              <div className="feature-details">
                <p>
                  Filter VKM's op locatie, studiepunten of tags en ontdek snel de modules die bij jou passen.
                </p>
              </div>
            </div>
          </Col>

          {/* Card 2 */}
          <Col md={4} className="d-flex justify-content-center">
            <div className="feature-card wide-card">
              <h4 className="feature-title">Favorieten bijhouden</h4>
              <p>Markeer VKM's als favoriet om ze snel terug te vinden.</p>
              <button
                className="feature-toggle"
                onClick={(e) => {
                  const card = (e.currentTarget.parentElement as HTMLElement).querySelector('.feature-details')!;
                  card.classList.toggle('open');
                }}
              >
                Meer info
              </button>
              <div className="feature-details">
                <p>
                  Sla je favoriete modules op en bekijk ze in een overzichtelijke lijst met één klik.
                </p>
              </div>
            </div>
          </Col>

          {/* Card 3 */}
          <Col md={4} className="d-flex justify-content-center">
            <div className="feature-card wide-card">
              <h4 className="feature-title">Altijd up-to-date</h4>
              <p>Ontvang notificaties over nieuwe VKM's en beschikbare plekken.</p>
              <button
                className="feature-toggle"
                onClick={(e) => {
                  const card = (e.currentTarget.parentElement as HTMLElement).querySelector('.feature-details')!;
                  card.classList.toggle('open');
                }}
              >
                Meer info
              </button>
              <div className="feature-details">
                <p>
                  Blijf op de hoogte van wijzigingen en updates zodat je nooit een interessante module mist.
                </p>
              </div>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default HomePage;
