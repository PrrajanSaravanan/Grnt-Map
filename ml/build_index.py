"""
Builds the FAISS semantic index over currently-open funding opportunities.

Only opportunities whose close_date is still in the future are indexed — recommending
a grant that can no longer be applied to wastes the applicant's time, so closed
records are filtered out here rather than being screened out later.
"""

import faiss
import numpy as np
import pandas as pd
from sentence_transformers import SentenceTransformer

CSV = "funding-opportunities.csv"

print("Loading dataset...")
df = pd.read_csv(CSV, encoding="utf-8-sig", low_memory=False)
print(f"  {len(df)} total records")

# --- Keep only opportunities that are still open ---
df["close_dt"] = pd.to_datetime(df["close_date"], errors="coerce", utc=True)
now = pd.Timestamp.now(tz="UTC")
before = len(df)
df = df[df["close_dt"].notna() & (df["close_dt"] > now)].copy()
print(f"  {len(df)} still open (dropped {before - len(df)} closed/undated)")

df = df.reset_index(drop=True)

# --- Build the text that gets embedded ---
# This dataset has no long description column, so combine the descriptive fields
# that do exist: title carries most of the signal, agency and activity categories
# add domain context.
text_columns = ["title", "agency_name", "funding_activity_categories", "eligible_applicant_types"]
for col in text_columns:
    if col not in df.columns:
        df[col] = ""

df["text"] = df[text_columns].fillna("").astype(str).agg(" ".join, axis=1)

print("Loading embedding model...")
model = SentenceTransformer("all-MiniLM-L6-v2")

print("Generating embeddings...")
embeddings = model.encode(df["text"].tolist(), convert_to_numpy=True, show_progress_bar=True)

# Normalise so inner-product search gives cosine similarity in [-1, 1]; that maps
# to an interpretable match percentage, unlike raw L2 distance.
faiss.normalize_L2(embeddings)

print("Creating FAISS index...")
index = faiss.IndexFlatIP(embeddings.shape[1])
index.add(np.array(embeddings))

print("Saving index...")
faiss.write_index(index, "grant_index.faiss")
df.to_pickle("grant_data.pkl")

print(f"Index built successfully over {len(df)} open opportunities.")
