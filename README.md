<div align="center">

<img src="public/GetMoneyPlanner.png" alt="GetMoneyPlanner Logo" width="80" height="80" style="border-radius: 16px;" />

# GetMoneyPlanner

**Your personal financial command center — built for the modern web.**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-green?style=flat-square&logo=mongodb)](https://mongodb.com)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![License: Source-Available](https://img.shields.io/badge/License-Source--Available-red?style=flat-square)](LICENSE)

[🌐 Live Demo](https://getmoneyplanner.vercel.app) · [🐛 Report Bug](https://github.com/2000Deba/GetMoneyPlanner/issues) · [✨ Request Feature](https://github.com/2000Deba/GetMoneyPlanner/issues)

</div>

---

## 📖 Overview

**GetMoneyPlanner** is a production-grade, full-stack personal finance management application. It lets users track income and expenses, set and monitor financial goals, manage monthly budgets, and gain insights through rich data visualizations — all secured with enterprise-grade authentication including TOTP-based 2FA.

Built with a focus on real-world usability, security, and performance.

> ⚠️ **This is NOT open-source software.** The source code is available for viewing and learning purposes only. See the [License](#-license) section for details.

---

## 📸 Screenshots

| Dashboard | Transactions | Goals |
|---|---|---|
| ![Dashboard](public/dashboard.jpg) | ![Transactions](public/transactions.jpg) | ![Goals](public/goals.jpg) |

---

## ✨ Features

### 💰 Financial Management
- **Transaction Tracking** — Log income and expenses with categories, notes, and date filters
- **Budget Management** — Set monthly spending limits and get real-time usage alerts
- **Financial Goals** — Create savings goals with progress tracking and milestone notifications
- **Multi-currency Support** — USD, EUR, GBP, INR, BDT, and more

### 📊 Dashboard & Analytics
- **Interactive Charts** — Bar, donut, and line charts powered by Recharts
- **Income vs Expense Overview** — Monthly and yearly breakdowns
- **PDF Export** — Export transaction history and reports via jsPDF
- **Excel Export** — Download spreadsheets using SheetJS

### 🔐 Authentication & Security
- **Credentials Auth** — Secure email/password login with bcrypt hashing
- **OAuth** — Sign in with Google or GitHub via NextAuth.js
- **TOTP 2FA** — Time-based One-Time Password using Speakeasy & QR codes
- **Active Session Management** — View and revoke sessions by device and location
- **Password Reset** — Secure email-based reset flow with time-limited tokens

### 📧 Email Notifications
- **Transaction Alerts** — Instant email on new transactions
- **Budget Alerts** — Notified when nearing or exceeding budget limits
- **Goal Milestones** — Emails at 25%, 50%, 75%, and 100% goal completion
- **Security Alerts** — Unusual activity and new session notifications
- **Customizable Preferences** — Toggle each notification type individually

### 🎨 UI/UX
- **Dark / Light Mode** — System-aware theme with smooth transitions
- **Fully Responsive** — Mobile-first design, optimized for all screen sizes
- **Framer Motion Animations** — Page transitions, stagger effects, micro-interactions
- **Password Strength Meter** — Real-time visual feedback on registration

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router) |
| **Language** | TypeScript |
| **Styling** | Tailwind CSS v4 |
| **Database** | MongoDB Atlas + Mongoose |
| **Auth** | NextAuth.js v4 |
| **2FA** | Speakeasy + QRCode |
| **Email** | Nodemailer (Gmail SMTP) |
| **Charts** | Recharts |
| **Animations** | Framer Motion |
| **Forms** | React Hook Form + Zod |
| **PDF Export** | jsPDF + AutoTable |
| **Excel Export** | SheetJS (xlsx) |
| **Deployment** | Vercel |

---

## 🚀 Getting Started

### Prerequisites

- Node.js `>=18`
- MongoDB Atlas account
- Gmail account (for SMTP email)
- Google & GitHub OAuth apps (optional)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/2000Deba/GetMoneyPlanner.git
cd GetMoneyPlanner

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local

# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🔧 Environment Variables

Create a `.env.local` file in the root directory:

```env
# App
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret_here

# MongoDB
MONGODB_URI=mongodb+srv://<user>:<password>@cluster.mongodb.net/getmoneyplanner

# OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# Email (Gmail SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_gmail@gmail.com
SMTP_PASS=your_gmail_app_password

# Admin
ADMIN_EMAIL=admin@yourdomain.com
```

> **Note:** For Gmail, use an [App Password](https://support.google.com/accounts/answer/185833), not your regular password.

---

## 🔒 Security

- Passwords hashed with **bcrypt** (never stored in plain text)
- TOTP 2FA secrets encrypted before storage
- Session tokens signed with `NEXTAUTH_SECRET`
- Password reset tokens are **single-use** and expire in **1 hour**
- Rate limiting on sensitive API routes
- HTTP-only cookies for session management

---

## 🚢 Deployment

This project is optimized for **Vercel** deployment.

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

Set all environment variables in your Vercel project dashboard under **Settings → Environment Variables**.

> ⚠️ Deploying this software without explicit written permission from the author is a violation of the license terms.

---

## 🤝 Contributing

Contributions are welcome for educational improvement of the project.

1. Fork the repository (study/learning only)
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

By contributing, you agree that your contribution may be used under the terms of this project's license. See [LICENSE](LICENSE) for full details.

---

## 📄 License

This project is licensed under a **Custom Source-Available License**.

| | |
|---|---|
| ✅ Allowed | View and study the source code for learning |
| ✅ Allowed | Fork on GitHub (learning/study only) |
| ✅ Allowed | Submit contributions via Pull Request |
| ❌ Prohibited | Deploy to any server or platform |
| ❌ Prohibited | Redistribute or resell |
| ❌ Prohibited | Use commercially or in client projects |
| ❌ Prohibited | Rebrand or claim as your own work |

See the full [LICENSE](LICENSE) file for complete terms.

For permission requests: **deep2000seal@gmail.com**

---

## 👨‍💻 Author

**Debasish Seal**

- Portfolio: [debasishseal.vercel.app](https://debasishseal.vercel.app)
- GitHub: [@2000Deba](https://github.com/2000Deba)
- LinkedIn: [debasishseal](https://in.linkedin.com/in/debasishseal)

---

<div align="center">

Made with ❤️ by [Debasish Seal](https://debasishseal.vercel.app)

⭐ Star this repo if you find it helpful!

© 2026 Debasish Seal. All rights reserved.

</div>