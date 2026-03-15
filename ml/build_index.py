import pandas as pd
from sentence_transformers import SentenceTransformer
import numpy as np
import faiss

print("Loading dataset...")

df = pd.read_csv("grants.csv")

text_columns = [
    "opportunity_title",
    "summary_description",
    "funding_category_description",
    "category_explanation",
    "applicant_eligibility_description"
]

df["text"] = df[text_columns].fillna("").agg(" ".join, axis=1)

print("Loading embedding model...")

model = SentenceTransformer("all-MiniLM-L6-v2")

print("Generating embeddings...")

embeddings = model.encode(
    df["text"].tolist(),
    convert_to_numpy=True,
    show_progress_bar=True
)

dimension = embeddings.shape[1]

print("Creating FAISS index...")

index = faiss.IndexFlatL2(dimension)

index.add(np.array(embeddings))

print("Saving index...")

faiss.write_index(index, "grant_index.faiss")

df.to_pickle("grant_data.pkl")

print("Index built successfully!")