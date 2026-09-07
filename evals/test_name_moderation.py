import pytest

import client
from data.name_moderation_cases import CASES


@pytest.mark.parametrize("name,expected_allowed", CASES)
def test_name_moderation_verdict(name, expected_allowed):
    result = client.validate_name(name)
    assert result["allowed"] == expected_allowed, (
        f"validateName({name!r}) returned allowed={result['allowed']}, "
        f"expected {expected_allowed}"
    )


def test_name_moderation_accuracy_summary():
    """Not a hard assertion per-name — reports overall accuracy so a partial
    regression (e.g. one Gemini-only edge case flipping) is visible without
    failing the whole suite. Tune the threshold as your blocklist evolves."""
    results = [
        (name, expected, client.validate_name(name)["allowed"])
        for name, expected in CASES
    ]
    correct = sum(1 for _, expected, actual in results if expected == actual)
    accuracy = correct / len(results)
    mistakes = [(n, e, a) for n, e, a in results if e != a]
    assert accuracy >= 0.9, f"Accuracy {accuracy:.0%} below threshold. Mistakes: {mistakes}"
