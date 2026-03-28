# 🌌 AI Money Mentor

**AI Money Mentor** is a premium, galaxy-themed financial intelligence platform designed to simplify complex financial decisions. It leverages AI to transform raw financial data into:

* 📊 Personalized wealth roadmaps
* 📈 Accurate trend analysis
* 💡 Actionable investment strategies

All wrapped in a **high-end glassmorphic UI** for a modern and immersive experience.

---

## 🚀 How to Run Locally

Follow these steps carefully to set up and run the project on your machine.

### 1️⃣ Prerequisites

Make sure you have the following installed:

* **Node.js** (v18.17 or higher, recommended v20+)
* **Git**
* **Package Manager**: npm (comes with Node) or yarn

---

### 2️⃣ Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/your-username/money-mentor.git
cd money-mentor
```

---

### 3️⃣ Install Dependencies

Install all required libraries:

```bash
npm install
# or
yarn install
```

---

### 4️⃣ Set Up Environment Variables 🔑

This project requires API keys for AI and database access.

1. Locate the file:

   ```
   .env.example
   ```

2. Create a copy and rename it to:

   ```
   .env.local
   ```

3. Add your credentials:

```env
NEXT_PUBLIC_AI_API_KEY=your_openai_or_gemini_key_here
DATABASE_URL=your_database_url_here
```

---

### 5️⃣ Start Development Server

Run the app locally:

```bash
npm run dev
```

---

### 6️⃣ Open the Application

Visit in your browser:

```
http://localhost:3000
```

---

## 🛠️ Tech Stack

| Technology    | Purpose                             |
| ------------- | ----------------------------------- |
| Next.js 15    | Modern React Framework (App Router) |
| Tailwind CSS  | Premium UI & Glassmorphism          |
| Framer Motion | Smooth Animations & Transitions     |
| Recharts      | Financial Data Visualization        |
| Lucide React  | Clean, modern icon system           |
| TypeScript    | Type-safe and scalable logic        |

---

## 📂 Project Structure

```
/app          → Pages (Dashboard, Analyzer, Landing)
/components   → Reusable UI components
/public       → Static assets (images, logos)
/.env.local   → Private environment variables
```

---

## 💡 Troubleshooting

* **Node version error**
  Run:

  ```bash
  node -v
  ```

  Update if below v18.

* **Module not found**
  Reinstall dependencies:

  ```bash
  npm install
  ```

* **Port already in use**
  Next.js will automatically switch to another port (e.g., 3001).

---

## ✨ Features Overview

* 🌠 Galaxy-themed UI with glassmorphism
* 🤖 AI-powered financial insights
* 📊 Interactive charts & analytics
* 🧠 Personalized financial recommendations
* ⚡ Fast and responsive performance

---

## 📌 Future Enhancements

* 🔐 Secure authentication system
* 📉 Real-time stock & crypto integration
* 🧾 Expense tracking & budgeting tools
* 📊 Advanced AI forecasting models
* 📱 Mobile-first optimization

---

## 👨‍💻 Author

Built with 💡 by **[Nandani Solgama]**

---

## ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub!

---
