"""
Each scenario is built so the *board-legal* options force a real choice
between two-plus valid moves, and the agent's declared traits point to one
of them. See backend/src/game/personality.ts TRAIT_DESCRIPTIONS for the
exact wording each trait is supposed to follow.

Scenarios avoid `build_settlement` (which needs real board-graph adjacency
to be legal) and instead lean on `build_city` (legal for any node already
in `settlementNodes`, no geometry check — see catan.ts getValidActions),
`buy_dev_card`, `trade_bank`, and robber targeting, which are all
resource/state driven and safe to fabricate.
"""

SCENARIOS = [
    {
        "id": "hard_trader_dumps_surplus_wood",
        "agent_name": "TestTrader",
        "traits": ["HardTrader"],
        "trait_context": "You exploit 4:1 bank trades aggressively whenever you have surplus.",
        "player": {
            "agentId": 1,
            "wood": 8, "brick": 0, "ore": 0, "wheat": 0, "sheep": 0,
            "settlementNodes": [], "cityNodes": [],
        },
        "opponents": [
            {"agentId": 2, "wood": 1, "brick": 1, "ore": 1, "wheat": 1, "sheep": 1},
        ],
        "turn": 5,
        "expectation": (
            "With 8 surplus wood and nothing else useful to do, a HardTrader should "
            "take a 4:1 bank trade to convert the excess wood into a resource it needs, "
            "rather than passing."
        ),
    },
    {
        "id": "dev_focused_buys_card_over_trading",
        "agent_name": "TestDevFocused",
        "traits": ["DevFocused"],
        "trait_context": "You prioritize buying development cards over physical buildings and save towards them.",
        "player": {
            "agentId": 1,
            "wood": 4, "brick": 0, "ore": 1, "wheat": 1, "sheep": 1,
            "settlementNodes": [], "cityNodes": [],
        },
        "opponents": [
            {"agentId": 2, "wood": 0, "brick": 0, "ore": 0, "wheat": 0, "sheep": 0},
        ],
        "turn": 6,
        "expectation": (
            "The agent can afford both a development card (ore+wheat+sheep) and a 4:1 "
            "bank trade of its surplus wood. A DevFocused agent should buy the "
            "development card rather than trading the wood away."
        ),
    },
    {
        "id": "militarist_robber_targets_the_leader",
        "agent_name": "TestMilitarist",
        "traits": ["Militarist"],
        "trait_context": "You use knight cards aggressively to control the robber and steal from leading players.",
        "player": {
            "agentId": 1,
            "wood": 0, "brick": 0, "ore": 0, "wheat": 0, "sheep": 0,
            "settlementNodes": [], "cityNodes": [],
        },
        "opponents": [
            {"agentId": 2, "wood": 1, "brick": 1, "ore": 0, "wheat": 0, "sheep": 0},
            {"agentId": 3, "wood": 2, "brick": 2, "ore": 2, "wheat": 2, "sheep": 2},
        ],
        "turn": 20,
        "robber_payload": {
            "eligibleTiles": [4, 9, 13],
            "targets": [
                {"tile": 9, "players": [{"id": 2, "cards": 2}, {"id": 3, "cards": 10}]},
            ],
        },
        "opponent_vps": {2: 2, 3: 9},
        "expectation": (
            "Opponent 3 has 9 VP and is about to win, opponent 2 has only 2 VP. "
            "A Militarist agent should move the robber onto tile 9 and steal from "
            "opponent 3 (the leader), not opponent 2."
        ),
    },
    {
        "id": "diplomatic_avoids_hostile_robber_when_possible",
        "agent_name": "TestDiplomat",
        "traits": ["Empathic", "Diplomatic"],
        "trait_context": (
            "You cooperate when it benefits long-term standing and avoid hostile moves. "
            "You prefer peaceful coexistence, avoid hostile moves, and seek mutually beneficial trades."
        ),
        "player": {
            "agentId": 1,
            "wood": 0, "brick": 0, "ore": 0, "wheat": 0, "sheep": 0,
            "settlementNodes": [], "cityNodes": [],
        },
        "opponents": [
            {"agentId": 2, "wood": 1, "brick": 1, "ore": 0, "wheat": 0, "sheep": 0},
        ],
        "turn": 8,
        "robber_payload": {
            "eligibleTiles": [4, 9, 13],
            "targets": [
                {"tile": 9, "players": [{"id": 2, "cards": 2}]},
            ],
        },
        "opponent_vps": {2: 3},
        "expectation": (
            "This is an early, low-stakes turn (opponent only has 3 VP) and the only "
            "robber option available steals from that single opponent. An Empathic, "
            "Diplomatic agent should recognize this is a hostile move against a "
            "non-threatening opponent and its commentary should reflect reluctance or "
            "a stated reason for the move, not casual aggression."
        ),
    },
]
