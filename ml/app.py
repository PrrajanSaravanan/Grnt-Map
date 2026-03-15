from fastapi import FastAPI
import pandas as pd
import faiss
from sentence_transformers import SentenceTransformer
import numpy as np

app = FastAPI()

print("Loading ML model...")

model = SentenceTransformer("all-MiniLM-L6-v2")

print("Loading FAISS index...")

index = faiss.read_index("grant_index.faiss")

print("Loading dataset...")

df = pd.read_pickle("grant_data.pkl")

@app.post("/match-grants")
def match_grants(data: dict):

    org_type = data.get("org_type", "")
    sector = data.get("sector", "")
    description = data.get("project_description", "")
    requested_amount = float(data.get("requested_amount", 0))

    query = f"""
    Organization type: {org_type}
    Sector: {sector}
    Project: {description}
    Funding needed: {requested_amount}
    """

    print("Generating query embedding...")

    query_embedding = model.encode([query], convert_to_numpy=True)

    k = 10

    distances, indices = index.search(query_embedding, k)

    results = []

    for i, idx in enumerate(indices[0]):

        grant = df.iloc[int(idx)]

        similarity = float(1 / (1 + distances[0][i]))

        match_percent = float(round(similarity * 100, 2))

        try:
            award_ceiling = float(grant.get("award_ceiling", 0))
        except:
            award_ceiling = 0

        if award_ceiling >= requested_amount:

            result = {
                "title": str(grant.get("opportunity_title", "")),
                "agency": str(grant.get("agency_name", "")),
                "match_score": match_percent,
                "award_ceiling": award_ceiling,
                "deadline": str(grant.get("close_date", "")),
                "url": str(grant.get("url", ""))
            }

            results.append(result)

    return results