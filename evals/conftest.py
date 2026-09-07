import os

import pytest
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), ".env.local"))
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))


@pytest.fixture(scope="session")
def judge_model():
    """The LLM used to *judge* GEval metrics — reuses the app's own Gemini key."""
    from deepeval.models import GeminiModel

    api_key = os.environ.get("GOOGLE_API_KEY")
    if not api_key:
        pytest.fail(
            "GOOGLE_API_KEY is missing. Add it to evals/.env or export it before "
            "running the agent and summary evals."
        )

    return GeminiModel(
        model=os.environ.get("DEEPEVAL_JUDGE_MODEL", "gemini-3.6-flash"),
        api_key=api_key,
        temperature=0,
    )
