import pytest
from deepeval import assert_test
from deepeval.metrics import GEval
from deepeval.test_case import LLMTestCase, SingleTurnParams

import client
from data.match_summary_scenarios import SCENARIOS, QUIET_GAME_SCENARIO


def _assert_summary_constraints(summary: str, scenario: dict) -> None:
    for term in scenario.get("must_mention", []):
        assert term.lower() in summary.lower(), (
            f"Expected '{term}' to be mentioned in: {summary!r}"
        )
    for term in scenario.get("must_not_invent", []):
        assert term.lower() not in summary.lower(), (
            f"Unexpected unsupported detail '{term}' appeared in: {summary!r}"
        )


@pytest.fixture(scope="module")
def faithfulness_metric(judge_model):
    return GEval(
        name="MatchSummaryFaithfulness",
        criteria=(
            "The 'input' is a raw log of a Catan match: the winner, final standings, "
            "and a sample of the actual moves that were played. The 'actual output' is "
            "an AI-generated recap of that match. Determine whether the recap is "
            "faithful to the input — it should correctly name the winner, and should "
            "NOT invent specific moves, builds, trades, or steals that are not "
            "supported by the input log. General scene-setting language is fine; "
            "specific fabricated details (a node number, a resource, an opponent "
            "action) that don't appear in the input should score low."
        ),
        evaluation_params=[SingleTurnParams.INPUT, SingleTurnParams.ACTUAL_OUTPUT],
        threshold=0.6,
        model=judge_model,
    )


@pytest.mark.parametrize("scenario", SCENARIOS, ids=[s["id"] for s in SCENARIOS])
def test_match_summary_faithfulness(scenario, faithfulness_metric):
    result = client.match_summary(
        game_type=scenario["game_type"],
        winner_name=scenario["winner_name"],
        agents=scenario["agents"],
        events=scenario["events"],
    )
    summary = result["summary"]

    assert summary, f"No summary returned for {scenario['id']}"
    _assert_summary_constraints(summary, scenario)

    standings = ", ".join(f"{a['name']} {a['score']}VP" for a in scenario["agents"])
    moves = " | ".join(e["text"] for e in scenario["events"])
    log = f"Winner: {scenario['winner_name']}. Standings: {standings}. Logged moves: {moves}"
    test_case = LLMTestCase(input=log, actual_output=summary)
    assert_test(test_case, [faithfulness_metric])


def test_quiet_game_still_gets_an_ai_summary(faithfulness_metric):
    """generateAiSummary no longer takes the deterministic '<winner> won the
    match.' shortcut just because no eventful moves were logged — it asks
    Gemini for a standings-only recap instead. This checks that path
    actually returns a real (non-trivial) AI summary, and that it doesn't
    fabricate a specific move that was never in the log — the one thing
    that's easy to get wrong once you're asking a model to write about a
    match it has almost no concrete detail on."""
    result = client.match_summary(
        game_type=QUIET_GAME_SCENARIO["game_type"],
        winner_name=QUIET_GAME_SCENARIO["winner_name"],
        agents=QUIET_GAME_SCENARIO["agents"],
        events=QUIET_GAME_SCENARIO["events"],
    )
    summary = result["summary"]

    assert summary, "No summary returned for the quiet-game scenario"
    # The old deterministic shortcut would return exactly this string with
    # nothing else — if we see exactly that, the fallback path fired again
    # (Gemini call failed or was skipped), which is what this test exists to catch.
    assert summary != f"{QUIET_GAME_SCENARIO['winner_name']} won the match.", (
        "Got the plain deterministic fallback instead of an AI-generated recap — "
        "check backend logs for a '[generateAiSummary] Gemini call failed' warning."
    )
    _assert_summary_constraints(summary, QUIET_GAME_SCENARIO)

    standings = ", ".join(f"{a['name']} {a['score']}VP" for a in QUIET_GAME_SCENARIO["agents"])
    log = (
        f"Winner: {QUIET_GAME_SCENARIO['winner_name']}. Standings: {standings}. "
        "No individual moves were logged for this match."
    )
    test_case = LLMTestCase(input=log, actual_output=summary)
    assert_test(test_case, [faithfulness_metric])
