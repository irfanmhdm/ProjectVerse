import re
import nltk
from nltk.corpus import stopwords


nltk.download("stopwords", quiet=True)

STOP_WORDS = set(stopwords.words("english"))


def preprocess_text(text: str) -> str:
    """
    Clean and preprocess extracted PDF text.
    """

    # Convert to lowercase
    text = text.lower()

    # Remove normal email addresses
    text = re.sub(r"\S+@\S+", " ", text)

    # Remove URLs
    text = re.sub(r"https?://\S+|www\.\S+", " ", text)

    # Remove common broken email/URL patterns
    text = re.sub(
        r"\b(gmail|yahoo|hotmail|outlook)\s+com\b",
        " ",
        text
    )

    text = re.sub(
        r"\blinkedin\s+com\b",
        " ",
        text
    )

    # Remove standalone linkedin username that follows linkedin.com
    text = re.sub(
        r"\blinkedin\s+\w+\b",
        " ",
        text
    )

    # Remove punctuation, numbers and special characters
    text = re.sub(r"[^a-z\s]", " ", text)

    # Split into words
    words = text.split()

    # Remove stop words
    words = [
        word
        for word in words
        if word not in STOP_WORDS
    ]

    # Join words
    cleaned_text = " ".join(words)

    # Remove extra whitespace
    cleaned_text = re.sub(r"\s+", " ", cleaned_text).strip()

    return cleaned_text