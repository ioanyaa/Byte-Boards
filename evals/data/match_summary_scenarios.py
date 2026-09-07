SCENARIOS = [
    {
        "id": "classic_decisive_win_via_cities_and_knight",
        "game_type": "catan-classic",
        "winner_name": "HexaMind",
        "agents": [
            {"name": "HexaMind", "score": 10},
            {"name": "RoadRunner", "score": 6},
            {"name": "SheepBaron", "score": 4},
        ],
        "events": [
            {"type": "MOVE", "actorName": "HexaMind", "text": "HexaMind builds a settlement at node 12 to secure a new resource spot."},
            {"type": "MOVE", "actorName": "RoadRunner", "text": "RoadRunner builds a road on edge 0910 to expand their network."},
            {"type": "MOVE", "actorName": "HexaMind", "text": "HexaMind upgrades node 12 to a city for double production."},
            {"type": "MOVE", "actorName": "SheepBaron", "text": "SheepBaron trades 4 sheep for 1 ore at the bank."},
            {"type": "MOVE", "actorName": "HexaMind", "text": "HexaMind plays a Knight, placing the robber on tile 9 and steals from agent 2."},
            {"type": "MOVE", "actorName": "HexaMind", "text": "HexaMind upgrades node 20 to a city for double production."},
            {"type": "MOVE", "actorName": "RoadRunner", "text": "RoadRunner builds a settlement at node 22 to secure a new resource spot."},
            {"type": "MOVE", "actorName": "HexaMind", "text": "HexaMind buys a development card, hoping for a Knight or VP."},
        ],
        "must_mention": ["HexaMind"],
        "must_not_invent": ["settlement at node 40", "city at node 99", "Seafarers", "ship"],
    },
    {
        "id": "seafarers_exploration_win",
        "game_type": "catan-seafarers",
        "winner_name": "PortTrader",
        "agents": [
            {"name": "PortTrader", "score": 10},
            {"name": "HexaMind", "score": 7},
        ],
        "events": [
            {"type": "MOVE", "actorName": "PortTrader", "text": "PortTrader builds a ship on sea route 5471 to explore new islands."},
            {"type": "MOVE", "actorName": "PortTrader", "text": "PortTrader builds a settlement at node 58 to secure a new resource spot."},
            {"type": "MOVE", "actorName": "HexaMind", "text": "HexaMind builds a road on edge 1112 to expand their network."},
            {"type": "MOVE", "actorName": "PortTrader", "text": "PortTrader builds a ship on sea route 5859 to explore new islands."},
            {"type": "MOVE", "actorName": "PortTrader", "text": "PortTrader upgrades node 58 to a city for double production."},
        ],
        "must_mention": ["PortTrader"],
        "must_not_invent": ["knight", "robber", "monopoly"],
    },
]

# A match with no effective actions logged (everything filtered out as
# passes/discards). generateAiSummary now still calls Gemini for a
# standings-only "quiet game" recap in this case — it no longer takes the
# deterministic fallback path just because nothing eventful happened. Judged
# with GEval rather than a plain string assertion (see
# test_quiet_game_still_gets_an_ai_summary in test_match_summary.py):
# specifically checks the summary doesn't fabricate a build/trade/steal that
# was never in the log.
QUIET_GAME_SCENARIO = {
    "id": "no_effective_actions_still_gets_ai_summary",
    "game_type": "catan-classic",
    "winner_name": "SheepBaron",
    "agents": [
        {"name": "SheepBaron", "score": 10},
        {"name": "RoadRunner", "score": 3},
    ],
    "events": [
        {"type": "MOVE", "actorName": "RoadRunner", "text": "RoadRunner passes their turn."},
        {"type": "MOVE", "actorName": "SheepBaron", "text": "SheepBaron discards 3 cards."},
    ],
    "must_mention": ["SheepBaron"],
}
