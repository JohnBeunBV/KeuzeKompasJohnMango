const MODEL_API_PORT = process.env.MODEL_API_PORT || "8000";
const MODEL_API_URL = process.env.MODEL_API_URL;
const PYTHON_API_KEY = process.env.PYTHON_API_KEY;

if (!PYTHON_API_KEY) {
    throw new Error("PYTHON_API_KEY not set");
}

const AI_BASE_URL = MODEL_API_URL || `http://localhost:${MODEL_API_PORT}`;

type RecommendPayload = {
    user: {
        favorite_ids?: string[];
        profile_text?: string;
        tags?: string[];
    };
    top_n?: number;
};

export async function recommendWithAI(payload: RecommendPayload) {
    // Try several possible endpoint paths in order (fallbacks)
    const candidates = [
        "/recommend/recommend-explain",
        "/recommend-explain",
        "/recommend/recommend",
        "/recommend",
    ];

    let lastError: any = null;
    for (const path of candidates) {
        const url = `${AI_BASE_URL.replace(/\/$/, "")}${path}`;
        try {
            const res = await fetch(url, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": PYTHON_API_KEY!,
                },
                body: JSON.stringify(payload),
            });

            const text = await res.text();

            if (!res.ok) {
                console.warn(`AI endpoint ${path} returned ${res.status}:`, text);
                // If 404, try next candidate
                if (res.status === 404) {
                    lastError = {status: res.status, body: text, url};
                    continue;
                }
                // For other statuses, throw immediately with details
                throw new Error(`AI model error: ${res.status} ${text}`);
            }

            // Try parse JSON
            try {
                return JSON.parse(text);
            } catch (err) {
                console.log("AI response OK (non-JSON):");
                return text as any;
            }
        } catch (err: any) {
            console.error("AI request failed for", url, err);
            lastError = err;
        }
    }

    // If we reach here, none of the endpoints worked
    if (lastError) {
        throw new Error(`AI requests failed. Last error: ${JSON.stringify(lastError)}`);
    }
    throw new Error("AI requests failed with unknown error");
}