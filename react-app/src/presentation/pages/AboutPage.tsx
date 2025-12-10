import React, { useState } from "react";
import "../index.css";

interface UserStory {
  id: string;
  title: string;
  description: string;
  criteria: string[];
}

interface Epic {
  id: string;
  title: string;
  goal: string;
  userStories: UserStory[];
}

const AboutPage: React.FC = () => {
  const [openEpics, setOpenEpics] = useState<string[]>([]);
  const [openUserStories, setOpenUserStories] = useState<{ [key: string]: string[] }>({});
  const [allOpen, setAllOpen] = useState(false);

  const epics: Epic[] = [
    {
      id: "1",
      title: "Epic 1 – Gebruikersauthenticatie & Profielbeheer",
      goal: "Een veilige authenticatieflow waarmee gebruikers kunnen registreren, inloggen, hun profiel beheren en beveiligd toegang krijgen tot hun persoonlijke data.",
      userStories: [
        {
          id: "1.1",
          title: "User Story 1.1 – Registratie",
          description: "Als nieuwe gebruiker wil ik een account aanmaken zodat ik toegang krijg tot de applicatie en mijn eigen favorieten kan opslaan.",
          criteria: [
            "Gebruiker kan een account aanmaken via een formulier.",
            "Een foutmelding verschijnt bij een bestaand e-mailadres.",
            "Na registratie wordt de gebruiker doorgestuurd naar het dashboard."
          ]
        },
        {
          id: "1.2",
          title: "User Story 1.2 – Inloggen",
          description: "Als gebruiker wil ik kunnen inloggen zodat ik mijn gegevens kan beheren.",
          criteria: [
            "Gebruiker kan inloggen met e-mail en wachtwoord.",
            "Verkeerde inloggegevens tonen een foutmelding.",
            "Na succesvol inloggen wordt de sessie onthouden."
          ]
        },
        {
          id: "1.3",
          title: "User Story 1.3 – Profiel beheren",
          description: "Als gebruiker wil ik mijn profiel kunnen aanpassen of verwijderen zodat ik controle heb over mijn account.",
          criteria: [
            "Gebruiker kan naam en e-mailadres wijzigen.",
            "Er is een optie om het account permanent te verwijderen.",
            "Wijzigingen worden direct opgeslagen en zichtbaar."
          ]
        }
      ]
    },
    {
      id: "2",
      title: "Epic 2 – VKM Weergave & Detailpagina’s",
      goal: "Een overzichtelijke interface waarin gebruikers beschikbare VKM’s kunnen bekijken, filteren en details raadplegen.",
      userStories: [
        {
          id: "2.1",
          title: "User Story 2.1 – VKM Overzicht",
          description: "Toont alle beschikbare VKM’s met naam, locatie en studiepunten.",
          criteria: [
            "Lijst toont minimaal naam, locatie en studiepunten.",
            "Data wordt opgehaald via de API.",
            "Gebruiker kan op een item klikken voor details."
          ]
        },
        {
          id: "2.2",
          title: "User Story 2.2 – VKM Detailpagina",
          description: "Geeft uitgebreide informatie over een specifieke VKM.",
          criteria: [
            "Detailpagina toont beschrijving, studiepunten en competenties.",
            "Er is een knop om terug te keren naar het overzicht.",
            "De data wordt dynamisch geladen."
          ]
        },
        {
          id: "2.3",
          title: "User Story 2.3 – Zoeken & filteren",
          description: "Gebruikers kunnen VKM’s filteren op naam, locatie en studiepunten.",
          criteria: [
            "Zoekveld filtert resultaten real-time.",
            "Dropdowns bevatten unieke waarden uit de dataset.",
            "Filters kunnen gecombineerd worden."
          ]
        }
      ]
    },
    {
      id: "3",
      title: "Epic 3 – Favorietenbeheer",
      goal: "Gebruikers kunnen VKM’s opslaan als favoriet, beheren en snel terugvinden.",
      userStories: [
        {
          id: "3.1",
          title: "User Story 3.1 – Favoriet toevoegen",
          description: "Gebruiker kan een VKM toevoegen aan zijn favorietenlijst.",
          criteria: [
            "Knop op detailpagina voegt VKM toe aan favorieten.",
            "Favorieten worden opgeslagen in de database.",
            "Een bevestiging verschijnt na toevoegen."
          ]
        },
        {
          id: "3.2",
          title: "User Story 3.2 – Favoriet verwijderen",
          description: "Gebruiker kan een VKM verwijderen uit zijn favorietenlijst.",
          criteria: [
            "Verwijderknop verwijdert VKM direct uit lijst.",
            "De database wordt geüpdatet.",
            "Een melding bevestigt de actie."
          ]
        },
        {
          id: "3.3",
          title: "User Story 3.3 – Favorietenlijst bekijken",
          description: "Toont de opgeslagen favoriete VKM’s van de gebruiker.",
          criteria: [
            "De lijst toont alle opgeslagen VKM’s.",
            "Elk item heeft een directe link naar de detailpagina.",
            "Favorieten blijven behouden tussen sessies."
          ]
        }
      ]
    }
  ];

  const toggleEpic = (id: string) => {
    setOpenEpics(prev => {
      const isOpen = prev.includes(id);
      if (isOpen) {
        // Epic sluiten -> alle user stories ook sluiten
        setOpenUserStories(prev => ({ ...prev, [id]: [] }));
        setAllOpen(false);
        return prev.filter(e => e !== id);
      } else {
        return [...prev, id];
      }
    });
  };

  const toggleUserStory = (epicId: string, usId: string, e: React.MouseEvent) => {
    e.preventDefault(); // voorkom default toggle van <details>
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
      <header className="about-header">
        <h1>Over dit project</h1>
        <p className="lead">
          Leer meer over de keuzes van frameworks, architectuur en de structuur van mijn VKM-dashboard.
        </p>
        <button className="btn-header" onClick={toggleAllEpics}>
          {allOpen ? "Alles dichtklappen" : "Alle epics openklappen"}
        </button>
      </header>

      <section className="feature-section">
        <h2>Frameworkkeuze: React vs Angular</h2>
        <div className="feature-cards">
          <div className="feature-card react">
            <h3>React</h3>
            <p>
              React is eenvoudig te leren, flexibel en heeft een grote community. 
              TypeScript wordt goed ondersteund en het framework is ideaal voor snelle ontwikkeling.
            </p>
          </div>
          <div className="feature-card angular">
            <h3>Angular</h3>
            <p>
              Angular biedt een complete structuur met ingebouwde tools, sterke TypeScript-integratie
              en is perfect voor enterprise-omgevingen en schaalbare systemen.
            </p>
          </div>
        </div>
        <p className="framework-conclusion">
          Voor dit project koos ik <strong>React</strong> vanwege de flexibiliteit, eenvoud en communityondersteuning.
        </p>
      </section>
<section className="feature-section">
  <h2>Frameworkkeuze: Express vs NestJS</h2>
  <div className="feature-cards">
    <div className="feature-card express">
      <h3 className="feature-title">Express</h3>
      <p>
        Express is een minimalistisch en flexibel Node.js-framework. 
        Het is lichtgewicht en ideaal voor snelle API-ontwikkeling zonder veel structuur. 
        Je hebt volledige controle over routing en middleware.
      </p>
    </div>
    <div className="feature-card nestjs">
      <h3 className="feature-title">NestJS</h3>
      <p>
        NestJS is een volledig gestructureerd framework met TypeScript-integratie. 
        Het maakt gebruik van modules, controllers en services voor schaalbare applicaties. 
        Perfect voor grotere projecten en teams die een duidelijke architectuur willen.
      </p>
    </div>
  </div>
  <p className="framework-conclusion">
    Voor dit project koos ik <strong>Express</strong> vanwege de eenvoud, flexibiliteit en snelle setup voor mijn backend-API.
  </p>
</section>
      <section className="epics-section">
        <h2>Project Epics</h2>
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
                        {us.criteria.map((c, i) => (
                          <li key={i}>{c}</li>
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
