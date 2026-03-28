"""
AI Mentor Service — Intelligent Financial Assistant
Architecture:  User Input → Intent Detection → Finance Engine → LLM → Response
"""
import re
from groq import Groq
from app.core.config import settings
from app.core.database import get_database
from app.models.financial import FinancialProfile
from app.services.health_score import calculate_health_score
from app.services.finance_engine import (
    build_calculation_brief,
    format_inr,
)

client = Groq(api_key=settings.GROQ_API_KEY)

# ────────────────────────────────────────────────────────────────
# LANGUAGE DETECTION
# ────────────────────────────────────────────────────────────────
HINDI_MARKERS = [
    "muje", "mujhe", "mera", "meri", "mere", "kya", "kaise", "kab", "kahan",
    "hai", "hain", "hoga", "karo", "chahiye", "nahi", "nhi", "ek", "aur",
    "toh", "bhi", "se", "ke", "ka", "ki", "lena", "dena", "leni", "karni",
    "paisa", "paise", "bachat", "kharcha", "loan", "nivesh", "namaste",
    "theek", "sahi", "batao", "bolo", "dalo", "chalega", "lagega",
]

def detect_language(text: str) -> str:
    tokens = re.findall(r"\b\w+\b", text.lower())
    hindi_count = sum(1 for t in tokens if t in HINDI_MARKERS)
    ratio = hindi_count / max(len(tokens), 1)
    return "hinglish" if ratio >= 0.15 else "english"


# ────────────────────────────────────────────────────────────────
# INTENT DETECTION
# ────────────────────────────────────────────────────────────────
GREETING_WORDS = {
    "hello", "hi", "hey", "namaste", "namaskar", "hola", "good morning",
    "good evening", "good afternoon", "good night", "sup", "wassup",
    "kya haal", "kya hal", "hii", "helo", "heyy", "greetings", "howdy",
    "salaam", "salam", "sat sri akal",
}

CONTINUATION_PATTERNS = [
    r"^(ok|okay|han|haan|yes|no|nahi|acha|achha|thik|theek|sure|bilkul|sahi|1|2|3|got it|samjha|samjhi|hmm|hn|hm)$",
    r"^(aur|and|also|plus|then|phir|next|iske baad|uske baad|matlab|so|toh|)[\s,].+",
]


def detect_intent(message: str, has_history: bool) -> str:
    """
    Returns: 'GREETING' | 'DIRECT_QUESTION' | 'CONTINUATION'
    """
    cleaned = message.strip().lower()

    # Check greeting
    if cleaned in GREETING_WORDS:
        return "GREETING"
    # Multi-word greeting
    for g in GREETING_WORDS:
        if cleaned.startswith(g + " ") or cleaned.startswith(g + ","):
            return "GREETING"

    # Check continuation (short reply or continues a topic)
    for pattern in CONTINUATION_PATTERNS:
        if re.match(pattern, cleaned, re.IGNORECASE):
            if has_history:
                return "CONTINUATION"

    # Short message with history = likely continuation
    if len(cleaned.split()) <= 3 and has_history:
        return "CONTINUATION"

    return "DIRECT_QUESTION"


# ────────────────────────────────────────────────────────────────
# BAD WORD SUBSTITUTIONS
# ────────────────────────────────────────────────────────────────
CLEAN_WORD_MAP = {
    "amadani":      "income",
    "kamai":        "income",
    "aavak":        "income",
    "tankha":       "salary",
    "vetan":        "salary",
    "taukh":        "salary",
    "kharcha":      "expenses",
    "kharch":       "expenses",
    "vyay":         "expenses",
    "aramai":       "fixed expenses",
    "aramaai":      "fixed expenses",
    "sthir kharch": "fixed expenses",
    "bachat":       "savings",
    "jamapunji":    "savings",
    "nivesh":       "investment",
    "paisa lagana": "invest",
    "daud":         "invest",
    "karz":         "loan",
    "udhaar":       "loan",
    "qarz":         "loan",
    "byaz":         "interest",
    "byaj":         "interest",
    "dhan":         "money/wealth",
    "sampatti":     "assets",
    "lakshya":      "goal",
}

def clean_message(text: str) -> str:
    for bad, good in CLEAN_WORD_MAP.items():
        text = re.sub(rf"\b{bad}\b", good, text, flags=re.IGNORECASE)
    return text


# ────────────────────────────────────────────────────────────────
# CONTEXT MEMORY
# ────────────────────────────────────────────────────────────────
async def get_conversation_context(db, user_id: str) -> dict:
    ctx = await db["chat_context"].find_one({"user_id": user_id})
    return ctx or {}

async def update_conversation_context(db, user_id: str, updates: dict):
    await db["chat_context"].update_one(
        {"user_id": user_id},
        {"$set": updates},
        upsert=True
    )


# ────────────────────────────────────────────────────────────────
# GREETING RESPONSE (no LLM needed — deterministic)
# ────────────────────────────────────────────────────────────────
def build_greeting_response(lang: str, user_name: str = "") -> str:
    name_part = f" {user_name.split()[0]}" if user_name else ""
    if lang == "hinglish":
        return (
            f"Namaste{name_part}! 👋\n\n"
            "👉 Aap kya karna chahte ho?\n\n"
            "1️⃣  Naya financial plan banana\n"
            "2️⃣  Koi specific question poochna\n"
            "3️⃣  Pichli baatcheet continue karna\n\n"
            "Number choose karo ya seedha apna sawaal poochho 😊"
        )
    return (
        f"Hello{name_part}! 👋\n\n"
        "👉 What would you like to do?\n\n"
        "1️⃣  Create a new financial plan\n"
        "2️⃣  Ask a specific question\n"
        "3️⃣  Continue our previous conversation\n\n"
        "Choose a number or just ask your question directly 😊"
    )


# ────────────────────────────────────────────────────────────────
# MAIN AI REPLY FUNCTION
# ────────────────────────────────────────────────────────────────
async def get_ai_reply(user_id: str, message: str, profile_dict: dict) -> str:
    db = get_database()

    # 1. Clean input
    message = clean_message(message)

    # 2. Detect language
    lang = detect_language(message)

    # 3. Fetch history (last 6 turns)
    history_cursor = db["chat_history"].find({"user_id": user_id}).sort("timestamp", -1).limit(6)
    history_docs   = await history_cursor.to_list(length=6)
    history_docs.reverse()
    has_history = len(history_docs) > 0

    # 4. Detect intent
    intent = detect_intent(message, has_history)

    # 5. GREETING → return immediately (no LLM cost)
    if intent == "GREETING":
        user_name = profile_dict.get("full_name", "")
        return build_greeting_response(lang, user_name)

    # 6. Get financial data
    monthly_income   = profile_dict.get("monthly_income", 0)
    monthly_expenses = profile_dict.get("monthly_expenses", 0)
    data_complete    = monthly_income > 0 and monthly_expenses > 0
    surplus          = (monthly_income - monthly_expenses) if data_complete else None

    # 7. Health score
    try:
        profile_model = FinancialProfile(**profile_dict)
        health_score  = calculate_health_score(profile_model)["total_score"]
    except Exception:
        health_score = 0

    # 8. Finance Engine calculations
    surplus_for_calc = surplus if surplus and surplus > 0 else 0
    brief = build_calculation_brief(message, surplus_for_calc, profile_dict)

    # 9. Context memory — persist / recall goal
    ctx = await get_conversation_context(db, user_id)
    if brief["target_amount"] and brief["goal_label"] != "General Advice":
        await update_conversation_context(db, user_id, {
            "last_goal_label":  brief["goal_label"],
            "last_goal_target": brief["target_amount"],
        })
    elif not brief["target_amount"] and ctx.get("last_goal_target") and intent == "CONTINUATION":
        last_target = ctx["last_goal_target"]
        brief = build_calculation_brief(f"goal {last_target}", surplus_for_calc, profile_dict)
        brief["goal_label"]   = ctx.get("last_goal_label", "Previous Goal") + " (continued)"
        brief["target_amount"] = last_target

    # 10. Build calculation block (STRICT TRUTH)
    if brief["has_calc"] and surplus and surplus > 0:
        calc_block = (
            f"GOAL: {brief['goal_label']} — {brief['target_fmt']}\n"
            f"REAL SURPLUS: {brief['surplus_fmt']}/month\n"
            f"TIMELINE (current rate): {brief['timeline_str']}\n"
            f"SAVE IN 1 YEAR:  {brief['save_1yr_str']}/month\n"
            f"SAVE IN 2 YEARS: {brief['save_2yr_str']}/month\n"
            f"EMI (5yr, 10%):  {brief['emi_5yr_str']}/month\n"
            f"EMI (3yr, 10%):  {brief['emi_3yr_str']}/month"
        )
    elif brief["has_calc"]:
        calc_block = (
            f"GOAL: {brief['goal_label']} — {brief['target_fmt']}\n"
            "CALCULATION: NOT AVAILABLE — income/expenses missing. Ask user for these."
        )
    else:
        calc_block = "GOAL: General financial question — no specific calculation needed."

    # 11. User data summary
    surplus_display  = format_inr(max(surplus, 0)) if surplus is not None else "Not provided"
    user_data_block  = (
        f"Income: {format_inr(monthly_income)}/month | "
        f"Expenses: {format_inr(monthly_expenses)}/month | "
        f"Surplus: {surplus_display}/month | "
        f"Health Score: {health_score}%"
    )

    # 12. Priority advice
    if health_score < 40:
        priority_note = "⚠️ CRITICAL: Emergency Fund + Term Insurance missing. Mention this, but do NOT hijack user's question."
    elif health_score < 60:
        priority_note = "🔶 MODERATE: Suggest building safety net alongside goal — mention briefly."
    else:
        priority_note = "✅ STABLE: Focus on answering the user's goal question directly."

    # 13. Language rule
    if lang == "hinglish":
        lang_rule = (
            "LANGUAGE: Hinglish only — mix simple Hindi + English naturally. "
            "Use: paisa, bachat, kharcha, goal, invest, EMI, surplus, plan. "
            "Do NOT write full formal Hindi sentences. Keep it conversational."
        )
    else:
        lang_rule = "LANGUAGE: Clean, professional English. Friendly tone."

    # 14. Intent-specific instruction
    if intent == "CONTINUATION":
        intent_rule = (
            "BEHAVIOR: User is CONTINUING the previous conversation. "
            "Do NOT reset. Do NOT show menus. Just continue naturally from where you left off."
        )
    else:
        intent_rule = (
            "BEHAVIOR: User asked a DIRECT QUESTION. Answer immediately like a smart human advisor. "
            "Do NOT show menu options. Do NOT ask unnecessary questions first. "
            "If required data is missing, ask max 2 specific questions."
        )

    # 15. Build the system prompt ──────────────────────────────────
    system_prompt = f"""You are "Money Mentor" — a smart, human-like financial advisor for Indian users.
Behave like a trusted CA friend: give CLEAR opinions, not vague answers.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
USER DATA (ground truth — NEVER change these numbers):
{user_data_block}

CALCULATION (copy EXACTLY — NEVER invent numbers):
{calc_block}

ADVISOR STATUS: {priority_note}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

{intent_rule}

━━━ RULE 1 — DECISION MAKING (most important) ━━━
Always give a SPECIFIC, CLEAR recommendation. Never be vague.

❌ WRONG: "Both saving and investing are good options."
✅ RIGHT: "Best: ₹12k saving + ₹4.5k SIP (70/30 split)"

❌ WRONG: "It depends on your situation."
✅ RIGHT: "Based on your data: [specific answer]"

━━━ RULE 2 — RESPONSE FORMAT ━━━
🔹 Goal: [what user wants, one clear line]
📊 Required: [COPY from CALCULATION above — exact numbers only]
⚡ Best Plan:
  • Option 1: [safest route]
  • Option 2: [balanced — RECOMMEND THIS] ← mark your pick
  • Option 3: [fastest / EMI if relevant]
👉 [ONE clear next step OR one specific question if data missing]

━━━ RULE 3 — NO REPETITION ━━━
Check conversation history. If advice was already given, do NOT repeat it.
Move conversation forward. Ask a follow-up or explore a new angle.

━━━ RULE 4 — MISSING DATA ━━━
If income/expenses are missing:
→ Ask MAX 2 specific questions in one message.
→ Example: "Aapki monthly income aur expenses kya hain?"
→ Then STOP. Wait. Do NOT guess.

━━━ RULE 5 — CONTEXT CONTINUATION ━━━
If user says "ok", "haan", "theek", "1"/"2"/"3", or any short reply:
→ Continue DIRECTLY from previous topic
→ Do NOT show menu again
→ Do NOT restart conversation

━━━ ABSOLUTE FORBIDDEN ━━━
- NEVER invent any number (income, surplus, savings, shortage)
- NEVER say FDs or Mutual Funds are tax-free (they are TAXABLE)
- NEVER write negative/shortage amounts unless present in CALCULATION
- If CALCULATION says "NOT AVAILABLE" → ask for data, do NOT guess
- Keep response under 130 words
- {lang_rule}
- Indian number style: lakh, crore — NEVER million/billion
- If user picks option "3" → pick up from chat history context naturally
"""

    # 16. Build messages with rich few-shot examples ───────────────
    messages = [{"role": "system", "content": system_prompt}]

    messages += [
        # ── EXAMPLE 1: Simple goal with calculation ──
        {
            "role": "user",
            "content": "4 lakh 2 saal mein chahiye"
        },
        {
            "role": "assistant",
            "content": (
                "Samajh gaya 👍\n\n"
                "🔹 Goal: ₹4 lakh in 2 saal\n"
                "📊 Required: ₹16,700/month saving\n\n"
                "⚡ Best Plan:\n"
                "  • Option 1: ₹16,700 pure savings (FD/RD — safest)\n"
                "  • Option 2: ₹12k saving + ₹4,700 SIP ← Best hai\n"
                "  • Option 3: ₹8k saving + ₹9k aggressive SIP (higher risk)\n\n"
                "👉 Aap itna save kar paoge monthly?"
            )
        },

        # ── EXAMPLE 2: Saving vs Invest debate (forces DECISION) ──
        {
            "role": "user",
            "content": "saving better hai ya investment?"
        },
        {
            "role": "assistant",
            "content": (
                "Clear answer deta hun 💡\n\n"
                "🔹 Goal: Savings vs Investment decide karna\n"
                "📊 Rule of thumb: 50/30/20 formula\n\n"
                "⚡ Best Plan:\n"
                "  • Emergency fund nahi hai → 100% savings first\n"
                "  • Emergency fund ready hai → 70% saving + 30% SIP ← Best\n"
                "  • Long-term 10+ saal goal → 60% SIP + 40% saving\n\n"
                "👉 Aapka emergency fund (3-6 months ka kharcha) ready hai?"
            )
        },

        # ── EXAMPLE 3: Car loan question ──
        {
            "role": "user",
            "content": "muje 15 lakh ki car leni hai"
        },
        {
            "role": "assistant",
            "content": (
                "🔹 Goal: Car — ₹15 lakh\n"
                "📊 Required:\n"
                "  • 1 saal mein: ₹1.25 lakh/month\n"
                "  • 2 saal mein: ₹62,500/month\n\n"
                "⚡ Best Plan:\n"
                "  • Option 1: ₹62,500/month save — 2 saal (zero debt) ← Best\n"
                "  • Option 2: ₹30k down + 5yr loan = ₹25,500 EMI/month\n"
                "  • Option 3: ₹7.5L save + ₹7.5L loan (50/50 split)\n\n"
                "👉 Kitne time mein lena chahte ho?"
            )
        },

        # ── EXAMPLE 4: 3 lakh savings (English) ──
        {
            "role": "user",
            "content": "I have 3 lakhs saved, what should I do?"
        },
        {
            "role": "assistant",
            "content": (
                "Great start! Here's the smartest allocation 👇\n\n"
                "🔹 Goal: Deploy ₹3 lakh wisely\n"
                "📊 Ideal split based on financial best practices:\n\n"
                "⚡ Best Plan:\n"
                "  • ₹1.5L → Emergency Fund (keep in liquid fund) — do this FIRST\n"
                "  • ₹1L   → Index Fund SIP start (₹8,300/month) ← Recommended\n"
                "  • ₹50K  → Keep liquid for short-term needs\n\n"
                "👉 Do you already have an emergency fund (3-6 months expenses)?"
            )
        },

        # ── EXAMPLE 5: CONTINUATION — user says "haan" ──
        {
            "role": "user",
            "content": "haan kar sakta hun"
        },
        {
            "role": "assistant",
            "content": (
                "Bilkul badhiya! 🎯\n\n"
                "Toh chalte hain Option 2 pe — ₹12k saving + ₹4,700 SIP.\n\n"
                "⚡ Next step:\n"
                "  1. Kal se ₹12,000 ek alag savings account mein transfer karo\n"
                "  2. Kisi bhi app (Groww, Zerodha) pe ₹4,700 ka monthly SIP set karo\n"
                "  3. 3 mahine baad review karein\n\n"
                "👉 SIP ke liye Nifty 50 Index Fund best rahega — kam risk, achha return."
            )
        },

        # ── EXAMPLE 6: Greet + option "1" ──
        {
            "role": "user",
            "content": "1"
        },
        {
            "role": "assistant",
            "content": (
                "Perfect! Naya plan banate hain 📋\n\n"
                "Mujhe 2 cheezein chahiye:\n\n"
                "1️⃣ Aapki **monthly income** kitni hai? (e.g. ₹50,000)\n"
                "2️⃣ Rough **monthly kharcha** kitna hai? (e.g. ₹35,000)\n\n"
                "Yeh batao — rest main calculate kar dunga 😊"
            )
        },
    ]

    # Real conversation history
    for doc in history_docs:
        messages.append({"role": "user",      "content": doc["user_msg"]})
        messages.append({"role": "assistant", "content": doc["ai_reply"]})

    messages.append({"role": "user", "content": message})

    # 17. LLM call ────────────────────────────────────────────────
    response = client.chat.completions.create(
        messages=messages,
        model="llama-3.1-8b-instant",
        temperature=0.2,   # Lower = more deterministic, less hallucination
        max_tokens=320,
    )

    raw_reply = response.choices[0].message.content
    return clean_message(raw_reply)
