from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

# Previous legal cases

cases = [
    "Family partition dispute in Trichy district",
    "Patta ownership conflict in Madurai",
    "Agricultural land litigation pending in Salem",
    "Court stay order for residential land in Coimbatore",
    "Duplicate ownership registration issue in Erode"
]

# User query

query = "Family land ownership issue in Trichy"

# Convert text into vectors

vectorizer = TfidfVectorizer()

vectors = vectorizer.fit_transform(cases + [query])

# Similarity check

similarity = cosine_similarity(vectors[-1], vectors[:-1])

# Get best match

best_match_index = similarity.argmax()

print("\nMost Similar Case:\n")

print(cases[best_match_index])

print("\nSimilarity Score:")

print(similarity[0][best_match_index])