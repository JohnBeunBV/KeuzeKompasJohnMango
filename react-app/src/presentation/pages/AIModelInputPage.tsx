import React, { useMemo, useState, useEffect, useRef } from "react";
import "../index.css";
import "../AIModelInputPage.css";
import apiClient from "../../infrastructure/ApiClient";
import { Modal } from "react-bootstrap";
import { useAppDispatch } from "../../application/store/hooks";
import 'bootstrap/dist/css/bootstrap.min.css';
import {fetchUser} from "../../application/Slices/authSlice.ts";

const interests_options = [
  "Business & Innovatie",
  "Communicatie & Media",
  "Creativiteit & Design",
  "Data & AI",
  "Duurzaamheid",
  "Economie & Management",
  "Gezondheid & Zorg",
  "ICT & Software Development",
  "Maatschappij & Cultuur",
  "Onderwijs & Ondersteuning",
  "Psychologie & Gedrag",
  "Technologie & Engineering",
] as const;

const values_options = [
  "Innovatie",
  "Maatschappelijke impact",
  "Prestatiegerichtheid",
  "Samenwerking",
  "Vrijheid & Autonomie",
  "Zelfontwikkeling",
] as const;

const goal_options = [
  "Loopbaanoriëntatie",
  "Nieuwe vaardigheden ontwikkelen",
  "Persoonlijke groei",
  "Projectmatig leren",
  "Verbreding buiten eigen studie",
  "Verdieping in huidig vakgebied",
] as const;

type Option = string;

type SavedProfile = {
  interests: Option[];
  values: Option[];
  goals: Option[];
};

function getSelectedValues(select: HTMLSelectElement): string[] {
  return Array.from(select.selectedOptions).map((o) => o.value);
}

export default function AIModelInputPage() {
  const [interests, setInterests] = useState<Option[]>([]);
  const [values, setValues] = useState<Option[]>([]);
  const [goals, setGoals] = useState<Option[]>([]);
  const [touched, setTouched] = useState(false);
  const savedProfileRef = useRef<HTMLDivElement>(null);
  const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);
  const [showForceModal, setShowForceModal] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const dispatch = useAppDispatch();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [showSavedModal, setShowSavedModal] = useState(false);

  const isValid = useMemo(() => {
    return interests.length > 0 && values.length > 0 && goals.length > 0;
  }, [interests, values, goals]);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const response = await apiClient.get("/auth/me/profile");

        if (response.data?.profile) {
          const profile = response.data.profile;

          setInterests(profile.interests ?? []);
          setValues(profile.values ?? []);
          setGoals(profile.goals ?? []);
          setSavedProfile(profile);
          setIsDirty(false);

          // ✅ Als profiel leeg is, modal tonen
          if (
            (!profile.interests || profile.interests.length === 0) &&
            (!profile.values || profile.values.length === 0) &&
            (!profile.goals || profile.goals.length === 0)
          ) {
            setShowWelcomeModal(true);
          }
        }
      } catch (err) {
        console.error("Kon profiel niet ophalen:", err);
      }
    }

    fetchProfile();
  }, []);

  async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setTouched(true);
  if (!isValid) return;

  const payload: SavedProfile = { interests, values, goals };

  try {
    // Opslaan van profiel
    await apiClient.put("/auth/me/profile", payload);

    // ✅ Lokaal updaten
    setSavedProfile(payload);
    // setHasJustSaved(true);
    setIsDirty(false);
    setShowSavedModal(true);
    console.log("Saved modal open:", true);


    // ✅ Nieuwe fetch naar /auth/me om globale state bij te werken
    const response = await apiClient.get("/auth/me");
    dispatch(fetchUser()); // update globale auth state

    console.log("Profiel succesvol opgeslagen en globale state geüpdatet:", response.data);

    // Scroll naar de opgeslagen profiel sectie
    savedProfileRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (err) {
    console.error("Fout bij opslaan of ophalen profiel:", err);
    alert("Er is een fout opgetreden bij het opslaan van je profiel.");
  }
}


    useEffect(() => {
    if (!isDirty) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);


  return (
    <main className="ai-container">
      <h1 className="page-title">Studentprofiel Formulier</h1>

      <p className="ai-intro">
        Selecteer hieronder jouw interesses, waarden en doelen. Dit helpt ons om betere aanbevelingen te doen.
      </p>
      <p className="ai-subtext">
        Je kunt meerdere opties selecteren <span 
        className="desktop-only"> (Ctrl/⌘ + klik)</span>.
      </p>

      {savedProfile && (
        <section className="ai-current-profile" ref={savedProfileRef}>

          <h2>Huidige ingevulde profielvoorkeuren</h2>
          <ul>
            <li><strong>Interesses:</strong> {savedProfile.interests.join(", ")}</li>
            <li><strong>Waarden:</strong> {savedProfile.values.join(", ")}</li>
            <li><strong>Leerdoelen:</strong> {savedProfile.goals.join(", ")}</li>
          </ul>
          <p className="ai-current-hint">
            Je kunt hieronder je profiel aanpassen en opnieuw opslaan.
          </p>
        </section>
      )}

      <form onSubmit={handleSubmit} className="ai-form">
        {/* Interesses */}
        <section className="ai-field">
          <label><strong>Interesses</strong></label>
          <select
            multiple
            value={interests}
            onChange={(e) => {
              setInterests(getSelectedValues(e.currentTarget));
              setIsDirty(true);
            }}

            onBlur={() => setTouched(true)}
            className="ai-select"
          >
            {interests_options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {touched && interests.length === 0 && <div className="ai-error">Selecteer minimaal 1 interesse.</div>}
        </section>

        {/* Waarden */}
        <section className="ai-field">
          <label><strong>Waarden</strong></label>
          <select
            multiple
            value={values}
            onChange={(e) => {
              setValues(getSelectedValues(e.currentTarget));
              setIsDirty(true);
            }}
            onBlur={() => setTouched(true)}
            className="ai-select"
          >
            {values_options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {touched && values.length === 0 && <div className="ai-error">Selecteer minimaal 1 waarde.</div>}
        </section>

        {/* Leerdoelen */}
        <section className="ai-field">
          <label><strong>Leerdoelen</strong></label>
          <select
            multiple
            value={goals}
            onChange={(e) => {
              setGoals(getSelectedValues(e.currentTarget));
              setIsDirty(true);
            }}
            onBlur={() => setTouched(true)}
            className="ai-select"
          >
            {goal_options.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
          {touched && goals.length === 0 && <div className="ai-error">Selecteer minimaal 1 leerdoel.</div>}
        </section>

        {/* CTA */}
        <div className="ai-cta">
          <div>
            <p><strong>Klaar?</strong> Klik op <strong>Opslaan</strong> om je profiel definitief op te slaan.</p>
            <p className="ai-cta-sub">Deze gegevens worden gebruikt voor persoonlijke aanbevelingen.</p>
          </div>
          <button type="submit" className={`ai-save-btn ${isValid ? "enabled" : "disabled"}`} disabled={!isValid}>
            Opslaan
          </button>
        </div>
      </form>

      {/* ✅ Welkomstmodal voor leeg profiel */}
      <Modal
        show={showWelcomeModal}
        onHide={() => setShowWelcomeModal(false)}
        centered
        className="intro-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Welkom bij je profiel</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Hier kun je je interesses, waarden en doelen invullen.
          <br /><br />
          Dit helpt ons om persoonlijke aanbevelingen te doen.
          <br /><br />
          <strong>Selecteer zoveel opties als je wilt</strong> en klik op "Opslaan" om je keuzes definitief vast te leggen.
        </Modal.Body>
        <Modal.Footer>
          <button className="btn btn-primary" onClick={() => setShowWelcomeModal(false)}>
            Begrepen
          </button>
        </Modal.Footer>
      </Modal>

      <Modal
    show={showForceModal}
    onHide={() => setShowForceModal(false)}
    centered
    className="intro-modal"
>
    <Modal.Header closeButton>
        <Modal.Title>Profiel nog niet volledig</Modal.Title>
    </Modal.Header>
    <Modal.Body>
        Je moet eerst minimaal één interesse, waarde en leerdoel selecteren
        voordat je verder kunt gaan.
        <br /><br />
        Vul je voorkeuren in en klik op "Opslaan".
    </Modal.Body>
    <Modal.Footer>
        <button className="btn btn-primary" onClick={() => setShowForceModal(false)}>
            Begrepen
        </button>
    </Modal.Footer>
</Modal>

<Modal
  show={showSavedModal}
  onHide={() => setShowSavedModal(false)}
  centered
  className="intro-modal"
>
  <Modal.Header closeButton>
    <Modal.Title>Voorkeuren opgeslagen!</Modal.Title>
  </Modal.Header>
  <Modal.Body>
    Je voorkeuren zijn succesvol opgeslagen. 
    <br /><br />
    Je kunt nu kiezen wat je wilt doen:
  </Modal.Body>
  <Modal.Footer>
    <button
      className="btn btn-primary"
      onClick={() => setShowSavedModal(false)}
    >
      Blijf op deze pagina
    </button>
    <button
      className="btn btn-primary"
      onClick={() => {
        setShowSavedModal(false);
        window.location.href = "/"; // of gebruik navigate("/") als je react-router gebruikt
      }}
    >
      Naar homepagina
    </button>
  </Modal.Footer>
</Modal>

    </main>
  );
}
