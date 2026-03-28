# 🚀 AI Money Mentor — Your Intelligent Financial Navigator

[![Team](https://img.shields.io/badge/Team-Falcon001-6366f1?style=for-the-badge)](https://github.com/charitarth2636/AI_money_mentor)
[![License](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-15+-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-Latest-05998b?style=for-the-badge&logo=fastapi)](https://fastapi.tiangolo.com/)

**AI Money Mentor** isn't just a chatbot; it's a sophisticated "Intelligent Financial System" designed to transform complex numbers into a clear, actionable roadmap for wealth building. Built for the modern Indian user, it combines real-time data tracking with human-like AI guidance.

---

## 🚀 Project Overview

Most people struggle with financial literacy not because they lack data, but because they lack **context**. Spreadsheets are cold, and generic advice is boring. 

### 🚩 The Problem
Scattered financial data across multiple apps, complex banking jargon, and robotic, impersonal advice that doesn't account for individual life goals.

### 💡 The Solution
A unified, "Ground-Truth" driven dashboard that combines automated financial tracking with a smart, human-like AI advisor that understands your specific context.

### 🚀 The Impact
Empowering users to move from mindless spending to intentional wealth creation through actionable insights and a clear, data-backed roadmap.

---

## ✨ Features

- **🧠 Human-Like AI Mentor:** A smart, context-aware chatbot that detects intent (Greetings vs. Queries) and mirrors your language (English/Hinglish). It uses "grounded" data from your profile to give advice.
- **📊 Real-Time Financial Hub:** Interactive charts and bento-style cards showing Liquidity, Outflow, and Investment Health. Data is never static; it's always live.
- **📈 Dynamic Cashflow Trends:** High-fidelity visual representations of your income vs. expenses over time, powered by automated backend logic.
- **🎯 Precision Goal Tracking:** Set, edit, and track milestones like "₹12 Lakh Car" or "Emergency Fund" with algorithmic progress tracking.
- **💸 Advanced Transaction Management:** Seamless CRUD operations for adding, editing, and deleting entries, with instant recalculation of all dashboard metrics.
- **🛡️ Data Integrity & Security:** Built with a "Single Source of Truth" philosophy; all insights are derived directly from the database, not assumed by the LLM.

---

## 🧠 How It Works (Architecture)

The system follows a modern **Decoupled Architecture**:

```mermaid
graph TD
    User((User)) <--> Frontend[Next.js 15 Hero UI]
    Frontend <--> API[FastAPI Logic Layer]
    API <--> DB[(MongoDB Atlas)]
    API <--> AI[Groq Cloud / Llama 3]
    AI -.-> |Contextual Finance| User
```

1.  **Data Ingestion:** User inputs transactions or goals via the Next.js frontend.
2.  **Processing:** FastAPI backend validates data and performs deterministic financial calculations.
3.  **Intelligence:** The AI Mentor fetches your real-time aggregates to provide "grounded" advice (it knows your real net worth before speaking).
4.  **Sync:** State-of-the-art React reactivity ensures the dashboard updates instantly on every change.

### 🔄 System Flow
```text
User Input 
    ↓
Frontend (Next.js)
    ↓
Backend API (FastAPI)
    ↓
Logic Engine (Financial Metrics Calculation)
    ↓
AI Layer (LLM Integration via Groq)
    ↓
Response (Actionable Financial Advice)
```

---

## 🛠 Tech Stack

- **Frontend:** Next.js 15 (App Router), Tailwind CSS 4, Framer Motion (Animations), Recharts.
- **Backend:** Python FastAPI, Pydantic (Data Validation), Uvicorn.
- **Database:** MongoDB (NoSQL) for flexible financial schema design.
- **AI Engine:** Groq SDK (Llama 3-70B) for lightning-fast inference.
- **Security:** JWT-based Authentication & Environment-level secret management.

---

## 🏗️ Engineering Highlights

- **Clean Architecture:** Separated concern between UI components, API routes, and specialized service layers (PDF Parser, AI Analyst).
- **API-First Design:** All data points are served via structured RESTful endpoints, ensuring the system can scale to mobile platforms easily.
- **Data Consistency:** Implemented a robust "Refresh Key" mechanism in React to ensure child components (charts, cards) re-sync immediately after any database mutation (CRUD).
- **Type Safety:** Used Pydantic for strict backend data validation and TypeScript for frontend reliability.

---

## 📊 Key Functionalities

- **Transactional Engine:** Handles Categorized spending patterns (Food, Rent, Salary, etc.).
- **Wealth Insight:** Displays "Financial Efficiency" score based on the 50/30/20 rule.
- **Bento Dashboards:** Premium dark-themed UI for a high-end startup feel.
- **Smart Onboarding:** Captures your initial financial identity to build a custom plan.

---

## ✨ What Makes It Unique?

- **Beyond the Chatbot:** Unlike generic AI apps, this is a full-scale financial system. The AI doesn't just "talk"; it analyzes real database metrics.
- **Hybrid Brain:** Combines rigid, 100% accurate backend financial logic with flexible, human-centric AI conversation.
- **Indian Financial Context:** Custom-built logic for Indian currency (`en-IN`), tax-aware thinking, and localized spending patterns.

---

## 💡 Unique Selling Points (USP)

- **Mirror-Language AI:** The first mentor that talks to you like a real friend in Hinglish/English.
- **Deterministic AI:** Unlike other bots, this one doesn't "hallucinate" numbers. It reads your DB and tells the truth.
- **Zero-Friction UX:** Simple, beautiful, and "Wow" aesthetics designed for high engagement.

---

## 🧪 How to Run Locally

### Prerequisites:
- Node.js 20+
- Python 3.9+
- MongoDB Instance (Atlas or Local)

### 1. Clone the Repo
```bash
git clone https://github.com/charitarth2636/AI_money_mentor.git
cd AI_money_mentor
```

### 2. Setup Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
# Create a .env file based on .env.example
# Run the server
uvicorn app.main:app --reload
```

### 3. Setup Frontend
```bash
cd ../frontend
npm install
# Run the dev server
npm run dev
```

---

## 📂 Project Structure

```text
AI_money_mentor/
├── backend/            # FastAPI Python Application
│   ├── app/            # Source code (routes, services, models)
│   ├── .env.example    # Template for secrets
│   └── main.py         # Entry point
├── frontend/           # Next.js React Application
│   ├── app/            # Next.js App Router (Dashboard, Mentor, Profile)
│   ├── components/     # Reusable UI (Cards, Charts, Tables, Modals)
│   └── public/         # Static assets
└── .gitignore          # Unified ignore rules
```

---

## 👨‍💻 Team Falcon001

- **Abhay Jagatiya** 
- **Charitarth Zinzuwadiya** 
- **Vansh Ganchi** 
- **Nandani Solgama** 

---

## 📈 Future Improvements

- [ ] **PDF Statement Parser:** Use Vision-LLM models to upload bank PDFs and auto-sync thousands of transactions in seconds.
- [ ] **Investment Connect:** Real-time stock and mutual fund portfolio tracking via Secure API integrations.
- [ ] **Predictive Cashflow:** Machine Learning models to forecast your bank balance for the next 6 months based on historical spending.
- [ ] **Predictive Goal Advice:** AI suggesting "When" you can afford your goal based on surplus growth rate.

---

## 🤝 Contribution

Contributions are welcome! Please feel free to submit a Pull Request.

## 📜 License

This project is licensed under the MIT License - see the placeholder [LICENSE](LICENSE) file for details.

---
**Built with ❤️ by Team Falcon001**
