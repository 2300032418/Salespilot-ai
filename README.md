# 🚀 SalesPilot AI

> **Autonomous AI-Powered B2B Lead Discovery, Ideal Customer Profile (ICP) Targeting & Cold Email Outreach Engine**

SalesPilot AI is a commercial-grade, full-stack B2B sales automation platform. It empowers growth, sales, and business development teams to define target Ideal Customer Profiles, discover high-intent prospects, generate hyper-personalized outreach emails using AI, and manage end-to-end sales pipeline analytics in real time.

---

## ✨ Key Features & Capabilities

- 🚀 **Sales Intelligence Dashboard**
  - Live KPI cards featuring total campaigns, prospect leads, AI draft pipeline, emails sent, approval rates, and lead-to-sent conversion ratios.
  - Interactive **Recharts** visualizations: Campaign Performance Bar Charts, Email Status Donut Distributions, Cumulative Lead Growth Trajectories, and Email Activity Line Graphs.
  - Quick performance statistics and CSV report export.

- 📢 **Campaign Management**
  - Full CRUD lifecycle management for outreach campaigns.
  - Real-time search, status filtering (Active, Inactive, Draft), pagination, and instant toggling.

- 🎯 **ICP (Ideal Customer Profile) Generator**
  - Granular definition of B2B target profiles including Industry, Company Size, Geographic Location, Target Job Titles, Pain Points, Keywords, and Tech Stack.
  - Association of ICP rules directly to campaigns.

- 👥 **Lead Discovery & AI Prospect Generation**
  - Automatic matching of prospect companies against active ICP rules.
  - Built-in duplicate detection and skipping to ensure clean data pipelines.
  - Manual lead creation and status tracking (`NEW`, `QUALIFIED`, `CONTACTED`, `EMAIL_SENT`, `REPLIED`, `REJECTED`).

- ✉️ **AI Email Draft & Review Engine**
  - Multi-tone AI email generation (**Professional**, **Friendly**, **Casual**, **Formal**).
  - Human-in-the-loop review workflow: **Approve**, **Reject**, or **Send** drafts with safe status enforcement.
  - Modal viewer displaying personalized subject lines and full email copy.

- 👤 **Enterprise UI & User Profile**
  - Modern dark-mode SaaS UI inspired by **Apollo.io, Stripe, Linear, and Vercel**.
  - Glassmorphic card containers (`backdropFilter: blur`), smooth **Framer Motion** animations, glowing hover effects, and live green online status badges.

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18 (Vite SPA)
- **UI & Styling**: Material UI (MUI v5), Glassmorphism styling, Vanilla CSS tokens
- **Animations**: Framer Motion
- **Data Visualizations**: Recharts v2
- **State & Form Management**: React Hook Form, React Context API
- **HTTP Client**: Axios (with centralized interceptors & error boundaries)
- **Icons & Alerts**: Lucide React, React Toastify

### Backend
- **Framework**: Django 5.x + Django REST Framework (DRF)
- **Database**: SQLite / PostgreSQL (Django ORM with annotated single-query aggregations)
- **CORS**: `django-cors-headers`
- **Language**: Python 3.11+

---

## 📁 Repository Structure

```text
salespilot-ai/
├── frontend/                     # React + Vite Frontend Application
│   ├── src/
│   │   ├── components/          # Navbar, Sidebar, PageHeader, StatCard, LoadingSpinner
│   │   ├── context/             # AuthContext
│   │   ├── pages/               # Dashboard, Campaigns, ICP, Leads, EmailDrafts, Analytics, Login
│   │   ├── routes/              # AppRoutes, ProtectedLayout
│   │   ├── services/            # api.js, dashboardService, campaignService, icpService, leadService, emailDraftService, analyticsService
│   │   └── styles/              # Global CSS tokens and styles
│   ├── package.json
│   └── vite.config.js
│
├── salespilot-ai/                # Django REST Backend Application
│   ├── core/                    # Django project settings and URL routing
│   ├── dashboard/               # Analytics & overview API endpoints
│   ├── sales/                   # Campaign & ICP models, serializers, views
│   ├── leads/                   # Lead discovery & AI generator services
│   ├── email_agent/             # Email draft models & AI prompt generator
│   └── manage.py
│
├── ARCHITECTURE.md              # Detailed system architecture document
└── README.md                    # Platform documentation (this file)
```

---

## ⚡ Quick Start Guide

### Prerequisites
- **Node.js**: v18.x or higher
- **Python**: v3.11 or higher
- **npm** or **yarn**

---

### 1. Backend Setup (Django REST API)

```bash
# Navigate to backend directory
cd salespilot-ai

# Create and activate Python virtual environment
python -m venv venv

# On Windows:
.\venv\Scripts\activate
# On macOS/Linux:
# source venv/bin/activate

# Install backend dependencies
pip install django djangorestframework django-cors-headers

# Run database migrations
python manage.py migrate

# Start Django development server (runs on http://127.0.0.1:8000)
python manage.py runserver
```

---

### 2. Frontend Setup (React + Vite)

```bash
# Open a new terminal and navigate to frontend directory
cd frontend

# Install frontend dependencies
npm install

# Start Vite development server (runs on http://localhost:3000 or http://localhost:5173)
npm run dev
```

Open your browser and navigate to `http://localhost:3000` to access SalesPilot AI.

---

## 📡 API Reference Overview

| Module | Endpoint | Method | Description |
|---|---|---|---|
| **Overview** | `/api/dashboard/` | `GET` | High-level system statistics summary |
| **Campaigns** | `/api/campaigns/` | `GET`, `POST` | List and create campaigns |
| | `/api/campaigns/{id}/` | `PUT`, `PATCH`, `DELETE` | Update and delete campaign |
| **ICP** | `/api/icp/` | `GET`, `POST` | List and create Ideal Customer Profiles |
| | `/api/icp/{id}/` | `PUT`, `PATCH`, `DELETE` | Update and delete ICP |
| **Leads** | `/api/leads/` | `GET`, `POST` | List and manually create leads |
| | `/api/leads/generate/` | `POST` | Generate prospects matching active ICP rules |
| **Email Drafts** | `/api/email-drafts/` | `GET` | List generated AI email drafts |
| | `/api/email-drafts/generate/` | `POST` | Trigger AI email draft generation for a lead |
| | `/api/email-drafts/{id}/approve/` | `POST` | Approve draft for outreach |
| | `/api/email-drafts/{id}/reject/` | `POST` | Reject draft |
| | `/api/email-drafts/{id}/send/` | `POST` | Send approved email |
| **Analytics** | `/api/dashboard/campaigns/` | `GET` | Per-campaign lead & email conversion metrics |
| | `/api/dashboard/leads/` | `GET` | Lead company and country analytics |
| | `/api/dashboard/emails/` | `GET` | Email approval & rejection rate metrics |

---

## 👨‍💻 Author

Developed by **Lalith Pavan** (*Founder & Full Stack Developer*).
