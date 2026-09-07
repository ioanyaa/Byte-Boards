# (name, expected_allowed). Kept mild on purpose — the goal is exercising
# the pipeline (blocklist -> Gemini fallback), not cataloguing slurs.
CASES = [
    # Clean names that should be allowed
    ("DragonSlayer", True),
    ("CastleKing42", True),
    ("ZenMaster987", True),
    ("Bucharest_Warrior", True),
    ("QuietStrategist", True),
    ("SheepWhisperer", True),

    # Words that LOOK like blocklist substrings but aren't the whole word
    # (regression check for the \b...\b word-boundary regex not over-blocking)
    ("AssassinKing", True),
    ("CursedBlade", True),
    ("ClassAct", True),

    # Should be blocked (mild profanity already present in the app's own
    # local blocklist — see backend/src/name-moderation.ts)
    ("FuckMachine", False),
    ("ShitTalker", False),
    ("StupidBitch", False),
    ("IdiotKing", False),
    ("prost_jucator", False),  # Romanian: "stupid player"
]
