from sklearn.feature_extraction.text import TfidfVectorizer


def generate_tfidf(documents: list[str]):
    """
    Convert a collection of documents into TF-IDF vectors.

    Args:
        documents: List of preprocessed text documents.

    Returns:
        vectorizer: TF-IDF vectorizer
        tfidf_matrix: Numerical TF-IDF representation
        feature_names: Words/features used by the vectorizer
    """

    vectorizer = TfidfVectorizer()

    tfidf_matrix = vectorizer.fit_transform(documents)

    feature_names = vectorizer.get_feature_names_out()

    return vectorizer, tfidf_matrix, feature_names