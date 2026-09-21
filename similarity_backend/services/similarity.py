from sklearn.metrics.pairwise import cosine_similarity


def calculate_similarity(tfidf_matrix):
    """
    Calculate cosine similarity between documents.

    Args:
        tfidf_matrix: TF-IDF matrix containing document vectors.

    Returns:
        Cosine similarity matrix.
    """

    similarity_matrix = cosine_similarity(tfidf_matrix)

    return similarity_matrix