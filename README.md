# WealthTracker - Personal Wealth Management Application

A modern, full-stack wealth management application designed to help users track, analyze, and grow their wealth. Built with the latest web technologies including **Angular 20** and **FastAPI**, it offers a robust platform for managing diverse investment portfolios.

## 📸 Screenshots

| Dashboard | Portfolio |
|-----------|-----------|
| ![Dashboard](https://github.com/pradeepku123/my-wealth-management-app/blob/main/frontend/wealth-frontend/assets/11.png?raw=true) | ![Portfolio](https://github.com/pradeepku123/my-wealth-management-app/blob/main/frontend/wealth-frontend/assets/12.png?raw=true) |

| Mutual Fund | SIP Calculator |
|-------------|----------------|
| ![Mutual Fund](https://github.com/pradeepku123/my-wealth-management-app/blob/main/frontend/wealth-frontend/assets/3.png?raw=true) | ![SIP](https://github.com/pradeepku123/my-wealth-management-app/blob/main/frontend/wealth-frontend/assets/6.png?raw=true) |

| SWP Calculator | Inflation Calculator |
|----------------|----------------------|
| ![SWP](https://github.com/pradeepku123/my-wealth-management-app/blob/main/frontend/wealth-frontend/assets/5.png?raw=true) | ![Inflation](https://github.com/pradeepku123/my-wealth-management-app/blob/main/frontend/wealth-frontend/assets/7.png?raw=true) |

| Mutual Fund Compare | |
|---------------------|---|
| *Placeholder for compare.png* | |

## 🚀 Features

### 💰 Portfolio Management
- **Multi-Asset Tracking**: Manage Mutual Funds, EPF, PPF, FD, MIS, and NPS in one place.
- **Real-time Updates**: Automatic NAV synchronization for mutual funds via AMFI API.
- **Detailed Analytics**: View asset allocation with customizable targets for Equity, Debt, and Gold.

### 📝 Budget Planner
- **Income & Expense Tracking**: Plan monthly budgets with custom categories.
- **Visual Breakdown**: Interactive charts to visualize income vs. expenses.
- **Plan Management**: Save, load, and update multiple budget plans.

### 🎯 Financial Goals
- **Goal Planning**: Set and track financial goals (e.g., Retirement, Buying a House).
- **Smart Calculators**: Auto-calculate required monthly SIP based on target amount and date.
- **Progress Monitoring**: Visual progress bars and dynamic status updates (e.g., "Achieved").

### 🧮 Financial Tools
- **SIP Calculator**: Estimate returns on Systematic Investment Plans.
- **SWP Calculator**: Plan Systematic Withdrawal Plans for regular income.
- **Inflation Calculator**: Understand the impact of inflation on future value.

### 🤖 Smart Recommendations & Market Analysis
- **Personalized Suggestions**: Investment recommendations based on risk profile and goals.
- **Fund Analysis & Comparison**: Search, select, and compare up to 4 mutual funds side-by-side to make informed decisions based on Category, NAV, Expense Ratios, and Trailing Returns.

### 🛡️ Security & Administration
- **Secure Authentication**: JWT-based login with role-based access control (RBAC).
- **Admin Panel**: Comprehensive interface for managing users and system settings.

## 🛠️ Tech Stack

### Frontend
- **Angular 20**: Cutting-edge web framework for building dynamic SPAs.
- **Bootstrap 5 & ng-bootstrap**: Responsive, mobile-first UI components.
- **Chart.js**: Interactive data visualization for dashboards and analytics.
- **TypeScript**: Strictly typed codebase for reliability.

### Backend
- **FastAPI**: High-performance, easy-to-learn Python API framework.
- **PostgreSQL**: Robust, open-source relational database.
- **SQLAlchemy**: Powerful ORM for Python.
- **Pydantic**: Data validation using Python type hints.

### Infrastructure & Testing
- **Docker & Docker Compose**: Containerized application lifecycle management.
- **Playwright**: Comprehensive end-to-end (E2E) testing suite for the frontend.
- **Pytest**: Robust backend testing framework.

## 🏗️ Project Structure

```
my-wealth-management-app/
├── backend/
│   ├── app/
│   │   ├── api/v1/endpoints/    # API route handlers (Budget, Goals, Portfolio, etc.)
│   │   ├── core/                # Core config & security
│   │   ├── crud/                # Database CRUD operations
│   │   ├── db/                  # Database connection & models
│   │   ├── models/              # SQLAlchemy models
│   │   ├── schemas/             # Pydantic schemas
│   │   └── main.py              # Application entry point
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile               # Backend container definition
├── frontend/wealth-frontend/
│   ├── src/app/
│   │   ├── analytics/           # Analytics dashboard
│   │   ├── budget/              # Budget planner feature
│   │   ├── goals/               # Goal management
│   │   ├── portfolio/           # Portfolio tracking
│   │   ├── sip/                 # SIP calculator
│   │   ├── swp/                 # SWP calculator
│   │   ├── services/            # API integration services
│   │   └── shared/              # Shared components & pipes
│   ├── package.json             # Frontend dependencies
│   └── Dockerfile               # Frontend container definition
├── tests/
│   ├── api/                     # Backend integration tests
│   └── ui/                      # Frontend E2E tests (Playwright)
├── docker-compose.yml           # Development orchestration
├── docker-compose.prod.yml      # Production orchestration
├── API.md                       # Detailed API documentation
├── DEPLOYMENT.md                # Deployment guide
└── README.md                    # Project documentation
```

## 📦 Installation & Setup

### Prerequisites
- **Docker** & **Docker Compose**
- **Node.js 20+** (for local frontend dev)
- **Python 3.12+** (for local backend dev)

### Quick Start (Docker)

The easiest way to run the application is using Docker.

1.  **Clone the repository**:
    ```bash
    git clone <repository-url>
    cd my-wealth-management-app
    ```

2.  **Run in Production Mode** (Recommended for demo):
    ```bash
    docker compose -f docker-compose.prod.yml up -d --build
    ```
    - Access Frontend: `http://localhost`
    - Access API: `http://localhost/api`

3.  **Run in Development Mode**:
    ```bash
    docker compose up --build
    ```
    - Access Frontend: `http://localhost:4200`
    - Access API: `http://localhost:8000`
    - Access DB: `localhost:5432`

### Local Development Setup

If you prefer running services locally without Docker containers for the app logic:

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

**Frontend:**
```bash
cd frontend/wealth-frontend
npm install
ng serve
```

## 🧪 Testing

We ensure code quality with a comprehensive testing suite.

- **API Tests**: Located in `tests/api/`.
- **UI Tests**: Located in `tests/ui/` using Playwright.

**Run all tests:**
```bash
./tests/run_tests.sh
```
This script sets up a virtual environment, installs dependencies, and runs both API and UI tests, generating an HTML report.

## 📚 Documentation

- **API Documentation**: See [API.md](API.md) for detailed endpoint descriptions.
- **Interactive Docs**: Visit `/docs` (Swagger UI) or `/redoc` on the running backend instance.
- **Deployment Guide**: See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions.

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1.  Fork the repository.
2.  Create a feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

---
**WealthTracker** — Built with ❤️ for financial freedom.