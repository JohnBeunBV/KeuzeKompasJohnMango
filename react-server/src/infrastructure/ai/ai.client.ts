const MODEL_API_PORT = process.env.MODEL_API_PORT || "8000";
const PYTHON_API_KEY = process.env.PYTHON_API_KEY;

if (!PYTHON_API_KEY) {
  throw new Error("PYTHON_API_KEY not set");
}

const AI_BASE_URL = `http://localhost:${MODEL_API_PORT}`;

type RecommendPayload = {
  user: {
    favorite_id?: number[];
    profile_text?: string;
    tags?: string[];
  };
  top_n?: number;
};

export async function recommendWithAI(payload: RecommendPayload) {
  const res = await fetch(`${AI_BASE_URL}/recommend-explain`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": PYTHON_API_KEY!,
    },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`AI model error: ${res.status} ${text}`);
  }

  return res.json();
}