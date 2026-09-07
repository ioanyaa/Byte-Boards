import json

import pytest
from deepeval import assert_test
from deepeval.metrics import GEval
from deepeval.test_case import LLMTestCase, SingleTurnParams

import client
from data.agent_decision_scenarios import SCENARIOS


def _build_context(scenario: dict) -> str:
    parts = [
        f"Agent traits: {', '.join(scenario['traits'])}.",
        f"Trait definitions: {scenario['trait_context']}",
        f"Turn: {scenario['turn']}.",
        f"Player resources: {scenario['player']}",
    ]
    if "opponent_vps" in scenario:
        parts.append(f"Opponent VPs: {scenario['opponent_vps']}")
    parts.append(f"Scenario intent: {scenario['expectation']}")
    return "\n".join(parts)


@pytest.fixture(scope="module")
def trait_alignment_metric(judge_model):
    return GEval(
        name="TraitAlignment",
        criteria=(
            "The 'input' describes an AI Catan agent's declared personality traits "
            "and the game situation it faces. The 'actual output' is the action the "
            "agent chose. Determine whether the chosen action is consistent with the "
            "agent's declared traits and the scenario's stated intent. An action that "
            "contradicts the traits (e.g. a Militarist agent stealing from the weakest "
            "opponent instead of the leader) should score low."
        ),
        evaluation_params=[SingleTurnParams.INPUT, SingleTurnParams.ACTUAL_OUTPUT],
        threshold=0.6,
        model=judge_model,
    )


@pytest.fixture(scope="module")
def commentary_grounding_metric(judge_model):
    return GEval(
        name="CommentaryGrounding",
        criteria=(
            "The 'actual output' contains an 'ACTION' the agent took and a 'COMMENTARY' "
            "sentence the agent generated to describe it. Determine whether the "
            "commentary accurately, specifically, and honestly describes the action — "
            "it should not describe a different action, invent details not implied by "
            "the action string, or be so vague it could apply to any move."
        ),
        evaluation_params=[SingleTurnParams.ACTUAL_OUTPUT],
        threshold=0.6,
        model=judge_model,
    )


@pytest.mark.parametrize("scenario", SCENARIOS, ids=[s["id"] for s in SCENARIOS])
def test_agent_decision(scenario, trait_alignment_metric, commentary_grounding_metric):
    result = client.agent_decision(
        agent_name=scenario["agent_name"],
        traits=scenario["traits"],
        player=scenario["player"],
        opponents=scenario.get("opponents", []),
        turn=scenario["turn"],
        robberPayload=scenario.get("robber_payload"),
    )

    # Deterministic guardrail: the app itself falls back to a random legal
    # move if Gemini returns something illegal, so a "pass" here likely
    # means the LLM call errored or Gemini returned nothing usable.
    assert result["action"], f"No action returned for {scenario['id']}"
    assert result["commentary"], f"No commentary returned for {scenario['id']}"

    test_case = LLMTestCase(
        input=_build_context(scenario),
        actual_output=json.dumps({"ACTION": result["action"], "COMMENTARY": result["commentary"]}),
    )

    assert_test(test_case, [trait_alignment_metric, commentary_grounding_metric])
