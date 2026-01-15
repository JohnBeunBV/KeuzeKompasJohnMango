import React, { useState } from "react";
import "../index.css";

interface Technique {
  id: string;
  title: string;
  description: string;
  details: string[];
}

interface Epic {
  id: string;
  title: string;
  goal: string;
  userStories: Technique[];
}

const AboutPage: React.FC = () => {
  const [openEpics, setOpenEpics] = useState<string[]>([]);
  const [openUserStories, setOpenUserStories] = useState<{ [key: string]: string[] }>({});
  const [allOpen, setAllOpen] = useState(false);

  const epics: Epic[] = [
    {
      id: "1",
      title: "Frontend",
      goal: "De frontend verzorgt de gebruikerservaring en visuele presentatie van het VKM-dashboard.",
      userStories: [
        {
          id: "1.1",
          title: "React + TypeScript",
          description: "De frontend is ontwikkeld met React in combinatie met TypeScript.",
          details: [
            "Component-based architectuur",
            "Typeveiligheid en betere onderhoudbaarheid",
            "Grote community en ecosysteem"
          ]
        },
        {
          id: "1.2",
          title: "State & interactie",
          description: "De applicatie maakt gebruik van React hooks voor interactieve functionaliteit.",
          details: [
            "useState voor dynamische UI",
            "Conditionele rendering",
            "Duidelijke en leesbare logica"
          ]
        },
        {
          id: "1.3",
          title: "Styling & layout",
          description: "De layout is opgebouwd met custom CSS.",
          details: [
            "Consistente styling",
            "Card-based ontwerp",
            "Responsieve opzet"
          ]
        }
      ]
    },
    {
      id: "2",
      title: "Backend",
      goal: "De backend verwerkt data, verzorgt authenticatie en communiceert met de database.",
      userStories: [
        {
          id: "2.1",
          title: "Express API",
          description: "De backend is gebouwd met Express als REST API.",
          details: [
            "Lichtgewicht en flexibel",
            "Snelle setup",
            "Volledige controle over routing"
          ]
        },
        {
          id: "2.2",
          title: "Authenticatie",
          description: "Gebruikersdata wordt beveiligd via backend-authenticatie.",
          details: [
            "Login- en registratie-endpoints",
            "Beveiligde routes",
            "Data-afscherming"
          ]
        },
        {
          id: "2.3",
          title: "Database-integratie",
          description: "Data wordt persistent opgeslagen in een database.",
          details: [
            "Opslag van gebruikers en favorieten",
            "Consistente datamodellen",
            "Betrouwbare data tussen sessies"
          ]
        }
      ]
    },
    {
      id: "3",
      title: "Python Model",
      goal: "Het Python-model analyseert data en ondersteunt intelligente functionaliteit.",
      userStories: [
        {
          id: "3.1",
          title: "Data preprocessing",
          description: "Ruwe data wordt opgeschoond en voorbereid voor analyse.",
          details: [
            "Opschonen van datasets",
            "Normalisatie",
            "Structurering van data"
          ]
        },
        {
          id: "3.2",
          title: "Analyse & logica",
          description: "Het model voert analyses of voorspellingen uit.",
          details: [
            "Gebruik van Python libraries",
            "Herbruikbare functies",
            "Uitbreidbaar ontwerp"
          ]
        },
        {
          id: "3.3",
          title: "Backend-koppeling",
          description: "Het model communiceert met de backend via API-calls.",
          details: [
            "JSON-communicatie",
            "Losgekoppelde architectuur",
            "Makkelijk te testen"
          ]
        }
      ]
    }
  ];

  const toggleEpic = (id: string) => {
    setOpenEpics(prev => {
      const isOpen = prev.includes(id);
      if (isOpen) {
        setOpenUserStories(prev => ({ ...prev, [id]: [] }));
        setAllOpen(false);
        return prev.filter(e => e !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleUserStory = (epicId: string, usId: string, e: React.MouseEvent) => {
    e.preventDefault();
    setOpenUserStories(prev => {
      const openStories = prev[epicId] || [];
      if (openStories.includes(usId)) {
        return { ...prev, [epicId]: openStories.filter(id => id !== usId) };
      } else {
        return { ...prev, [epicId]: [...openStories, usId] };
      }
    });
  };

  const toggleAllEpics = () => {
    if (allOpen) {
      setOpenEpics([]);
      setOpenUserStories({});
      setAllOpen(false);
    } else {
      setOpenEpics(epics.map(e => e.id));
      const allStories: { [key: string]: string[] } = {};
      epics.forEach(e => (allStories[e.id] = e.userStories.map(us => us.id)));
      setOpenUserStories(allStories);
      setAllOpen(true);
    }
  };

  return (
    <div className="about-page">
      <header className="homepage-header">
        <h1>Over dit project</h1>
        <p className="lead">
          Leer meer over de keuzes van frameworks, architectuur en de structuur van mijn VKM-dashboard.
        </p>
        <button className="btn-header2" onClick={toggleAllEpics}>
          {allOpen ? "Alles dichtklappen" : "Alle epics openklappen"}
        </button>
      </header>

      {/* 🔹 NIEUWE SECTIE */}
      <section className="feature-section">
        <h2>Projectintroductie & Doel</h2>
        <p>
          In periode 2.3 staan studenten voor de uitdaging om een passende keuze te maken binnen de vrije keuzeruimte.
          Dit keuzeproces is vaak lastig door een gebrek aan overzicht, begeleiding en persoonlijke afstemming.
          Hierdoor lopen studenten het risico keuzes te maken die niet aansluiten bij hun interesses,
          vaardigheden of carrièreambities.
        </p>
        <p>
          Om dit probleem aan te pakken ontwikkelen wij het <strong>Avans KeuzeKompas</strong>:
          een webapplicatie die studenten ondersteunt bij het maken van bewuste en onderbouwde modulekeuzes.
          De applicatie helpt studenten bij het reflecteren op hun voorkeuren, het vergelijken van beschikbare modules
          en het ontvangen van gepersonaliseerde aanbevelingen.
        </p>
        <p>
          Het doel van dit project is het realiseren van een functionerend <strong>Minimum Viable Product (MVP)</strong>
          binnen de projectperiode (blok LU3). Dit MVP bestaat uit een full-stack webapplicatie met een frontend,
          backend, database en een AI-component die aanbevelingen doet op basis van ingevoerde gebruikersdata.
        </p>
      </section>
      <hr />
<section className="feature-section">
  <h2>De inspiratie achter het project</h2>

  <div className="feature-cards">
    <div className="feature-card react">
      <h3>Een bescheiden begin</h3>
      <p>
        John Mango, officieel genaamd <em>Johannes Beunes Mangones</em>, groeide op in een landelijke omgeving
        waar middelen schaars waren en kansen niet vanzelfsprekend. Onderwijs en begeleiding
        waren beperkt beschikbaar, waardoor hij al vroeg merkte hoe lastig het is
        om zonder richting vooruit te komen.
      </p>
    </div>

    <div className="feature-card angular">
      <h3>Gebrek aan begeleiding</h3>
      <p>
        Zonder financiële ruimte en zonder duidelijke begeleiding was het maken van keuzes
        een grote uitdaging. John zag niet alleen zijn eigen worsteling, maar ook die van
        andere studenten die belangrijke beslissingen moesten nemen zonder overzicht of ondersteuning.
      </p>
    </div>
  </div>

  {/* Tekst onder de eerste twee cards */}
  <p className="framework-conclusion">
    Deze ervaringen vormden de basis voor Johns visie: studenten zouden nooit alleen
    moeten staan bij keuzes die hun toekomst bepalen. Er moest een hulpmiddel komen
    dat overzicht biedt, ondersteunt bij reflectie en helpt bij het maken van bewuste beslissingen.
  </p>

  <div className="feature-cards">
    <div className="feature-card express">
      <h3>Een idee ontstaat</h3>
      <p>
        Vanuit deze overtuiging begon John zichzelf te ontwikkelen en aan oplossingen te werken.
        Hij combineerde zijn persoonlijke ervaringen met technische kennis en ontdekte
        hoe digitale middelen kunnen bijdragen aan begeleiding en inzicht.
      </p>
    </div>

    <div className="feature-card nestjs">
      <h3>De realisatie</h3>
      <p>
        Dit leidde tot het ontstaan van het <strong>KeuzeKompas van John Mango</strong>:
        een platform dat studenten helpt hun voorkeuren te verkennen, beschikbare opties te vergelijken
        en keuzes te maken die aansluiten bij hun interesses en ambities.
      </p>
    </div>
  </div>

  {/* Grote conclusie onder de tweede twee cards */}
  <p className="framework-conclusion">
    Het Avans KeuzeKompas is geïnspireerd op dit gedachtegoed. Binnen dit project ontwikkelen wij
    een functionerend <strong>Minimum Viable Product (MVP)</strong> dat studenten actief ondersteunt
    bij het kiezen van modules binnen de vrije keuzeruimte. Door reflectie, vergelijking en
    gepersonaliseerde aanbevelingen te combineren, streven wij ernaar studenten meer zekerheid,
    motivatie en richting te bieden. Wat begon als een persoonlijke ervaring,
    is uitgegroeid tot een oplossing met impact.
    <strong>Al goed eind goed.</strong>
  </p>
</section>





      <section className="epics-section">
        <h2>Technische Architectuur</h2>
        <hr />
        <div className="epics-container">
          {epics.map(epic => (
            <div key={epic.id} className="epic-card">
              <div className="epic-header" onClick={() => toggleEpic(epic.id)}>
                <h3>{epic.title}</h3>
                <p>{epic.goal}</p>
              </div>
              {openEpics.includes(epic.id) && (
                <div className="user-stories">
                  {epic.userStories.map(us => (
                    <details
                      key={us.id}
                      className="user-story"
                      open={openUserStories[epic.id]?.includes(us.id)}
                    >
                      <summary onClick={(e) => toggleUserStory(epic.id, us.id, e)}>
                        {us.title}
                      </summary>
                      <p>{us.description}</p>
                      <ul>
                        {us.details.map((d, i) => (
                          <li key={i}>{d}</li>
                        ))}
                      </ul>
                    </details>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
