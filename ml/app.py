"""
Semantic grant-matching service.

Serves the Discovery Agent: given an organization profile, returns the most
semantically similar *currently-open* funding opportunities, along with the
structured eligibility fields the Eligibility Agent needs (applicant type codes,
award bounds, cost sharing) so it can screen without a second API round-trip.
"""

import json
import math

import faiss
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sentence_transformers import SentenceTransformer

app = FastAPI(title="GrantWeave semantic matcher")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("Loading ML model...")
model = SentenceTransformer("all-MiniLM-L6-v2")

print("Loading FAISS index...")
index = faiss.read_index("grant_index.faiss")

print("Loading dataset...")
df = pd.read_pickle("grant_data.pkl")
print(f"Ready — {len(df)} open opportunities indexed.")


def _clean(value, default=None):
    """Pandas/NumPy scalars -> plain JSON-safe Python values."""
    if value is None:
        return default
    if isinstance(value, float) and math.isnan(value):
        return default
    if pd.isna(value):
        return default
    return value


def _json_list(value):
    """Several columns hold JSON-encoded arrays as strings."""
    raw = _clean(value)
    if raw is None:
        return []
    if isinstance(raw, list):
        return raw
    try:
        parsed = json.loads(raw)
        return parsed if isinstance(parsed, list) else [parsed]
    except (json.JSONDecodeError, TypeError):
        return [s.strip() for s in str(raw).split(",") if s.strip()]


def _num(value):
    v = _clean(value)
    if v is None:
        return None
    try:
        n = float(v)
        return n if n > 0 else None
    except (TypeError, ValueError):
        return None


@app.get("/health")
def health():
    return {"status": "ok", "indexed": int(len(df))}


@app.post("/match-grants")
def match_grants(data: dict):
    org_type = data.get("org_type", "")
    sector = data.get("sector", "")
    description = data.get("project_description", "")
    top_k = int(data.get("top_k", 12))

    query = f"Organization type: {org_type}\nSector: {sector}\nProject: {description}"

    query_embedding = model.encode([query], convert_to_numpy=True)
    faiss.normalize_L2(query_embedding)

    # Index is inner-product over normalised vectors, so scores are cosine similarity.
    scores, indices = index.search(query_embedding, min(top_k, len(df)))

    results = []
    for rank, idx in enumerate(indices[0]):
        if idx < 0:
            continue
        row = df.iloc[int(idx)]
        similarity = float(scores[0][rank])
        close_dt = _clean(row.get("close_dt"))

        results.append(
            {
                # Identity — lets the agents fetch the live record and link the user out.
                "opportunity_id": str(_clean(row.get("source_opportunity_id"), "")),
                "opportunity_number": str(_clean(row.get("opportunity_number"), "")),
                "title": str(_clean(row.get("title"), "")),
                "agency": str(_clean(row.get("agency_name"), "")),
                "url": str(_clean(row.get("source_url"), "")),
                # Deadline — every indexed record is still open by construction.
                "close_date": close_dt.isoformat() if close_dt is not None else None,
                # Structured eligibility for deterministic screening.
                "eligible_applicant_codes": _json_list(row.get("eligible_applicant_codes")),
                "eligible_applicant_types": _json_list(row.get("eligible_applicant_types")),
                "award_ceiling": _num(row.get("award_ceiling_usd")),
                "award_floor": _num(row.get("award_floor_usd")),
                "estimated_total_funding": _num(row.get("estimated_total_program_funding_usd")),
                "expected_number_of_awards": _num(row.get("expected_number_of_awards")),
                "cost_sharing_required": bool(_clean(row.get("cost_sharing_required"), False)),
                "assistance_listing_numbers": _json_list(row.get("assistance_listing_numbers")),
                "funding_activity_categories": _json_list(row.get("funding_activity_categories")),
                "opportunity_status": str(_clean(row.get("opportunity_status"), "")),
                # Cosine similarity as a 0-100 match percentage.
                "match_score": round(max(0.0, similarity) * 100, 2),
            }
        )

    return results
