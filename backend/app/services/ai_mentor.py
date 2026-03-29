"""
AI Mentor Service — Intelligent Financial Assistant
Architecture:  User Input → Intent Detection → Finance Engine → LLM → Response
"""
import re
from datetime import datetime, timezone
from groq import Groq
from app.core.config import settings
from app.core.database import get_database
from app.models.financial import FinancialProfile
from app.services.health_score import calculate_health_score
from app.services.finance_engine import (
    build_calculation_brief,
    format_inr,
)
import json

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
# INTENT ANALYSIS (Low-level extraction)
# ────────────────────────────────────────────────────────────────
INTENT_SYSTEM_PROMPT = """You are a high-precision Financial Intent Extractor.
Extract structured intents from user messages as JSON.
VALID ACTIONS: ADD_TRANSACTION, DELETE_TRANSACTION, ADD_GOAL, UPDATE_GOAL, QUERY
JSON SCHEMA:
{
  "action": "ACTION_NAME",
  "params": {
    "amount": number,
    "type": "income" | "expense",
    "category": "string",
    "description": "string",
    "title": "goal title"
  }
}
- If it's a general question, return {"action": "QUERY"}.
- If the user confirms a previous action (Yes/Haan/Ok), return {"action": "CONFIRM"}.
- If uncertainty, return {"action": "QUERY"}.
Do NOT explain. Return JSON only.
"""

async def analyze_intent(message: str, history: list = []) -> dict:
    """
    Calls LLM to extract JSON intent.
    """
    messages = [{"role": "system", "content": INTENT_SYSTEM_PROMPT}]
    # Minimal history for intent awareness
    for doc in history[-2:]:
        messages.append({"role": "user", "content": doc["user_msg"]})
        messages.append({"role": "assistant", "content": doc["ai_reply"]})
    
    messages.append({"role": "user", "content": message})
    
    try:
        response = client.chat.completions.create(
            messages=messages,
            model="llama-3.1-8b-instant",
            temperature=0,
            max_tokens=200,
            response_format={"type": "json_object"}
        )
        return json.loads(response.choices[0].message.content)
    except Exception:
        return {"action": "QUERY"}

def requires_confirmation(intent: dict) -> bool:
    """Check if action needs user approval."""
    action = intent.get("action")
    params = intent.get("params", {})
    if action in ["DELETE_TRANSACTION", "DELETE_GOAL"]:
        return True
    
    amount = float(params.get("amount", 0))
    if amount > 50000:
        return True
    
    return False


# ────────────────────────────────────────────────────────────────
# MAIN AI REPLY FUNCTION (Grounded Explanation)
# ────────────────────────────────────────────────────────────────
async def get_ai_reply(user_id: str, message: str, profile_dict: dict, action_summary: str = "") -> str:
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

    # 11. User data summary (STRICT BOUNDARY)
    active_goals_str = "\n".join([
        f"• {g['title']}: {format_inr(g['current'])} / {format_inr(g['target'])} [{'COMPLETED' if g.get('is_completed') else 'ACTIVE'}]"
        for g in profile_dict.get("active_goals", [])
    ]) or "no goals found"
    
    # Strictly categories derived from data
    cats = profile_dict.get("tx_category_totals", {})
    top_cats_str = ", ".join([f"{cat}: {format_inr(amt)}" for cat, amt in cats.items()]) if cats else "no category data yet"

    # Recent transactions
    recent_txs = profile_dict.get("recent_transactions", [])
    recent_txs_str = "\n".join([f"• {t['date']}: {format_inr(t['amount'])} - {t['category']} ({t['desc']})" for t in recent_txs]) if recent_txs else "no recent transactions"

    surplus_val = surplus if surplus is not None else 0
    surplus_display  = format_inr(max(surplus_val, 0))
    
    user_data_block  = (
        f"RAW_INCOME: {monthly_income} | RAW_EXPENSE: {monthly_expenses} | RAW_SURPLUS: {surplus_val}\n"
        f"Income: {format_inr(monthly_income)} | Expenses: {format_inr(monthly_expenses)} | Surplus: {surplus_display}\n"
        f"Health Score: {health_score}%\n"
        f"Active Goals:\n{active_goals_str}\n"
        f"Top Spending: {top_cats_str}\n"
        f"Recent History:\n{recent_txs_str}"
    )

    # Status check
    if not data_complete:
        user_data_status = "DATA_INCOMPLETE: Income/expense data missing. Refuse detailed advice, ask for data."
    elif not cats:
        user_data_status = "PARTIAL_DATA: No transaction categories yet. Mention user needs to add more detailed expenses."
    else:
        user_data_status = "DATA_COMPLETE: Use provided categories and transactions for grounding."

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
    system_prompt = f"""You are "Money Mentor" — a natural, data-driven financial advisor.
Your objective: Give human-like, non-repetitive advice based ONLY on the user context provided.

━━━ CORE INTEGRITY RULES ━━━
- ADVISOR BOUNDARY: You provide explanations and guidance. The backend executes actions. 
- CALCULATION INTEGRITY: Use ONLY values from USER DATA and CALCULATION blocks. NEVER calculate, estimate, or guess health scores, surpluses, or timelines yourself. If data is missing, say it.
- GROUNDING: Your entire answer must be grounded in the provided numeric state.
- ACTION CONFIRMATION: If an action summary is provided, confirm it gracefully (e.g., "I've added that expense for you").
- NO FAKE SUCCESS: Do not claim an action happened unless the "Action Summary" confirms it.

━━━ PERSONA ━━━
- Conversational, professional Financial Advisor. Use bolding (**amount**) for numbers.
- NO TEMPLATES. NO REPETITION. NO FILLER. 
- If user asks for action you can't infer, ask for missing details (amount, category).

━━━ CONTEXT ━━━
Status: {user_data_status}
{user_data_block}

━━━ CALCULATION ━━━
{calc_block}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
ACTION STATUS: {action_summary or "None - Answer the question directly."}
ADVISOR NOTE: {priority_note}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"""

    # 16. Build messages with rich few-shot examples ───────────────
    messages = [{"role": "system", "content": system_prompt}]

    messages += [
        # --- EXAMPLE 1: Goal question ---
        {
            "role": "user",
            "content": "muji 1 lakh bike ke liye save karna hai"
        },
        {
            "role": "assistant",
            "content": (
                "Acha plan hai! 🏍️ Aapki monthly **₹15,000** ki surplus income se, aap easily **7 mahine** mein ₹1 lakh save kar lenge.\n\n"
                "Mera suggestion: Har mahine **₹14,300** ek Liquid Fund mein dalo. Yeh safe hai aur aapko bank se better returns bhi dega. Baki ₹700 emergency ke liye rakho.\n\n"
                "Kya aap itna monthly save kar paoge?"
            )
        },
        # --- EXAMPLE 2: Spending/Category question ---
        {
            "role": "user",
            "content": "Where is my money going?"
        },
        {
            "role": "assistant",
            "content": (
                "Main aapka spending pattern dekh ke batata hun 📊\n\n"
                "Pichle 30 din mein aapka major kharcha **Shopping (₹12,400)** aur **Food (₹8,200)** mein hua hai. Total spending ₹45,000 ke aas-paas hai.\n\n"
                "I also saw a recent payment of **₹1,200 at Amazon** on 15 March. Maybe aap Shopping thoda kam kar sakte ho? Isse ₹5,000 extra bachega."
            )
        },
        # --- EXAMPLE 3: Generic advice with missing data ---
        {
            "role": "user",
            "content": "Should I invest in stocks?"
        },
        {
            "role": "assistant",
            "content": (
                "Stocks long-term wealth ke liye badhiya hain, par pehle safety dekhte hain. 👍\n\n"
                "Mujhe aapke data mein koi **Emergency Fund** ya **Insurance** nahi dikh raha. Rule ye hai ki pehle 6 mahine ka kharcha save karo, phir stocks mein paisa dalo.\n\n"
                "Kya aapka koi emergency fund ready hai?"
            )
        },
        # --- EXAMPLE 4: Advisor Boundary Check ---
        {
            "role": "user",
            "content": "Add a new goal for ₹5 lakh for my wedding"
        },
        {
            "role": "assistant",
            "content": (
                "Shaadi ki taiyari! Bohot badiya. 💍\n\n"
                "Main appke liye goals add nahi kar sakta directly, par app AI Money Mentor ke **Add Goal** button pe click karke ₹5 lakh ka target set kar sakte hain.\n\n"
                "Once you add it, main appko best saving strategy bata dunga. Kya hum monthly bachat calculate karein?"
            )
        }
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
        temperature=0.25,   # Balanced for consistency + natural flow
        max_tokens=350,
    )

    raw_reply = response.choices[0].message.content
    return clean_message(raw_reply)
