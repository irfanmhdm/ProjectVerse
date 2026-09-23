from sklearn.feature_extraction.text import TfidfVectorizer


def generate_tfidf(texts):
    """
    Convert a collection of preprocessed texts
    into TF-IDF vectors.

    Parameters:
        texts (list): List of preprocessed document texts.

    Returns:
        vectorizer: Trained TF-IDF vectorizer
        matrix: TF-IDF matrix
    """

    vectorizer = TfidfVectorizer()

    matrix = vectorizer.fit_transform(texts)

    return vectorizer, matrix