import React, { useMemo, useState, useEffect } from "react";
import "../index.css";
import "../AIModelInputPage.css";
import apiClient from "../../infrastructure/ApiClient";

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

  // Snapshot van écht opgeslagen data
  const [savedProfile, setSavedProfile] = useState<SavedProfile | null>(null);

  const isValid = useMemo(() => {
    return interests.length > 0 && values.length > 0 && goals.length > 0;
  }, [interests, values, goals]);

  // Als gebruiker iets wijzigt → niet meer "opgeslagen"
  useEffect(() => {
    setSavedProfile(null);
  }, [interests, values, goals]);

 async function handleSubmit(e: React.FormEvent) {
  e.preventDefault();
  setTouched(true);

  if (!isValid) return;

  const payload: SavedProfile = {
    interests,
    values,
    goals,
  };

  try {
    // PUT call naar backend via apiClient
    const response = await apiClient.put("/auth/me/profile", payload);

    // apiClient geeft al response.data
    setSavedProfile(response.data.profile); // update state met opgeslagen data
    console.log("Profiel succesvol opgeslagen in DB:", response.data.profile);
  } catch (err) {
    console.error("Fout bij opslaan profiel:", err);
    alert("Er is een fout opgetreden bij het opslaan van je profiel.");
  }
}




  return (
  <main className="ai-container">
    <h1 className="page-title">Studentprofiel Formulier</h1>

    <p className="ai-intro">
      Selecteer hieronder jouw interesses, waarden en doelen.
      Dit helpt ons om betere aanbevelingen te doen.
    </p>

    <p className="ai-subtext">
      Je kunt meerdere opties selecteren (Ctrl/⌘ + klik).
    </p>

    <form onSubmit={handleSubmit} className="ai-form">
      {/* Interesses */}
      <section className="ai-field">
        <label><strong>Interesses</strong></label>
        <select
          multiple
          value={interests}
          onChange={(e) => setInterests(getSelectedValues(e.currentTarget))}
          onBlur={() => setTouched(true)}
          className="ai-select"
        >
          {interests_options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {touched && interests.length === 0 && (
          <div className="ai-error">Selecteer minimaal 1 interesse.</div>
        )}
      </section>

      {/* Waarden */}
      <section className="ai-field">
        <label><strong>Waarden</strong></label>
        <select
          multiple
          value={values}
          onChange={(e) => setValues(getSelectedValues(e.currentTarget))}
          onBlur={() => setTouched(true)}
          className="ai-select"
        >
          {values_options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {touched && values.length === 0 && (
          <div className="ai-error">Selecteer minimaal 1 waarde.</div>
        )}
      </section>

      {/* Doelen */}
      <section className="ai-field">
        <label><strong>Leerdoelen</strong></label>
        <select
          multiple
          value={goals}
          onChange={(e) => setGoals(getSelectedValues(e.currentTarget))}
          onBlur={() => setTouched(true)}
          className="ai-select"
        >
          {goal_options.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
        {touched && goals.length === 0 && (
          <div className="ai-error">Selecteer minimaal 1 leerdoel.</div>
        )}
      </section>

      {/* CTA */}
      <div className="ai-cta">
  <div>
    <p>
      <strong>Klaar?</strong> Klik op <strong>Opslaan</strong> om je profiel definitief op te slaan.
    </p>
    <p className="ai-cta-sub">
      Deze gegevens worden gebruikt voor persoonlijke aanbevelingen.
    </p>
  </div>

  <button
    type="submit"
    className={`ai-save-btn ${isValid ? "enabled" : "disabled"}`}
    disabled={!isValid}
  >
    Opslaan
  </button>
</div>



      {/* Bevestiging */}
      {savedProfile && (
        <div className="ai-confirmation">
          <h3>Profiel opgeslagen!</h3>
          <ul>
            <li><strong>Interesses:</strong> {savedProfile.interests.join(", ")}</li>
            <li><strong>Waarden:</strong> {savedProfile.values.join(", ")}</li>
            <li><strong>Doelen:</strong> {savedProfile.goals.join(", ")}</li>
          </ul>
        </div>
      )}
    </form>
  </main>
);
}
