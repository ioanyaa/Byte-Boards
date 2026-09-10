import os

import requests

BASE_URL = os.environ.get("BYTE_BOARDS_BASE_URL", "http://localhost:5000")


def _post(path: str, payload: dict) -> dict:
    url = f"{BASE_URL}{path}"
    try:
        resp = requests.post(url, json=payload, timeout=30)
    except requests.RequestException as exc:
        raise RuntimeError(
            f"Could not reach the eval endpoint at {url}. "
            "Start the backend with ENABLE_EVAL_ROUTES=true or set "
            "BYTE_BOARDS_BASE_URL."
        ) from exc
    if resp.status_code == 404:
        raise RuntimeError(
            f"Eval route not found at {url}. Restart the backend with "
            "ENABLE_EVAL_ROUTES=true, or set BYTE_BOARDS_BASE_URL to an "
            "eval-enabled backend."
        )
    resp.raise_for_status()
    return resp.json()


def agent_decision(
    agent_name: str,
    traits: list[str],
    player: dict,
    opponents: list[dict] | None = None,
    turn: int = 1,
    dice: int = 7,
    occupancy: dict | None = None,
    **extra,
) -> dict:
    """Calls POST /api/eval/agent-decision. Returns {"action": str, "commentary": str}."""
    return _post(
        "/api/eval/agent-decision",
        {
            "agentName": agent_name,
            "traits": traits,
            "player": player,
            "opponents": opponents or [],
            "turn": turn,
            "dice": dice,
            "occupancy": occupancy or {"settlements": [], "cities": [], "roads": []},
            **extra,
        },
    )


def match_summary(
    game_type: str,
    winner_name: str,
    agents: list[dict],
    events: list[dict],
) -> dict:
    """Calls POST /api/eval/match-summary. Returns {"summary": str}."""
    return _post(
        "/api/eval/match-summary",
        {
            "gameType": game_type,
            "winnerName": winner_name,
            "agents": agents,
            "events": events,
        },
    )


def validate_name(name: str) -> dict:
    """Calls POST /api/eval/validate-name. Returns {"name": str, "allowed": bool}."""
    return _post("/api/eval/validate-name", {"name": name})
