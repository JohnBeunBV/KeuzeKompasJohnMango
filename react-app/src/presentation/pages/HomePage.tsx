import { Container, Row, Col, Carousel, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import "../index.css";
import "../homepage.css";

const HomePage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="homepage">
      {/* Header */}
<header className="homepage-header text-center p-5 mb-5">
  <h1>Welkom bij John Mango</h1>

  {/* Introductie */}
  <p className="lead mt-4">
    John Mango helpt studenten die moeite hebben met het kiezen van de juiste
    <strong> vrije keuzemodules.</strong> Door jouw interesses centraal te zetten, maken we
    studiekeuzes overzichtelijk en makkelijker.
  </p>

  {/* Uitleg sectie */}
  <div className="row justify-content-center mt-5">
    <div className="col-md-8">
      <p>
        Gebruik onze interactieve swiper
        om aanbevolen modules te <strong>liken</strong> of <strong>disliken</strong>.
      </p>
    </div>
  </div>

  {/* Call to action */}
  <Button
    className="btn-header2 mt-4"
    onClick={() => navigate("/swipe")}
  >
    Swipe je aanbevolen VKM's
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
              <h3>Ontdek VKM's</h3>
              <p>Ontdek VKM's die passen bij jouw studie en interesses.</p>
              <Button
                className="btn-header"
                onClick={() => navigate("/vkms")}
              >
                Ontdek VKM's
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
              <p>Bekijk jouw aanbevolen VKM's op je profiel pagina.</p>

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
              <h3>Studentenprofiel</h3>
              <p>Vul je interesses, waarden en doelen in op je studentenprofiel.</p>
              <Button
                className="btn-header"
                onClick={() => navigate("/studentenprofiel")}
              >
                Studentenprofiel
              </Button>
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
                  Filter VKM's op naam, locatie, studiepunten, moeilijkheid en/of tags en ontdek snel de modules die bij jou passen.
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
                  Sla je favoriete modules op en bekijk ze in een overzichtelijke lijst op de vkm pagina en account pagina.
                </p>
              </div>
            </div>
          </Col>

          {/* Card 3 */}
          <Col md={4} className="d-flex justify-content-center">
            <div className="feature-card wide-card">
              <h4 className="feature-title">Bekijk de about page</h4>
              <p>Leer meer over John Mango</p>
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
                  Leer de developers kennen en de technologieën achter John Mango op onze about page.
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
