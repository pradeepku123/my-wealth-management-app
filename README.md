# WealthTracker - Personal Wealth Management Application

A modern full-stack wealth management application built with Angular 20 frontend, FastAPI backend, and PostgreSQL database.

## 🚀 Features

- **Portfolio Management**: Track multiple investment types (Mutual Funds, EPF, PPF, FD, MIS, NPS)
- **Real-time NAV Data**: Automatic mutual fund NAV updates from AMFI API
- **User Authentication**: JWT-based login with role-based access control
- **Dashboard Analytics**: Investment performance tracking with returns calculation
- **Database Administration**: Complete admin interface for data management
- **Responsive Design**: Modern UI with Bootstrap 5
- **Dark/Light Themes**: Accessibility features with theme switching

## 🛠️ Tech Stack

### Frontend
- **Angular 20** - Modern web framework
- **Bootstrap 5** - UI components & styling
- **Bootstrap Icons** - Modern SVG icons
- **TypeScript** - Type-safe development

### Backend
- **FastAPI** - High-performance Python API framework
- **PostgreSQL** - Robust relational database
- **JWT Authentication** - Secure token-based auth
- **Asyncio** - Background task scheduling
- **Pydantic** - Data validation and serialization

### Infrastructure
- **Docker** - Containerized deployment
- **Docker Compose** - Multi-service orchestration
- **GitHub Codespaces** - Cloud development environment

## 📦 Installation & Setup

### Prerequisites
- Docker and Docker Compose
- Node.js 18+ (for local development)
- Python 3.9+ (for local development)

### Quick Start with Docker

1. **Clone the repository**
```bash
git clone <repository-url>
cd my-wealth-management-app
```

2. **Production Mode (All services in Docker)**
```bash
sudo docker compose up --build
sudo docker volume prune -f
```

3. **Development Mode (Database only in Docker)**
```bash
# Start database
sudo docker compose -f docker-compose.dev.yml up

# Run backend locally
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload

# Run frontend locally
cd frontend/wealth-frontend
npm install
ng serve
```

### Access Points
- **Frontend**: http://localhost:4200
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs
- **Database**: PostgreSQL on port 5432

## 🏗️ Project Structure

```
my-wealth-management-app/
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI application
│   │   ├── models.py            # Pydantic models
│   │   ├── database.py          # Database configuration
│   │   ├── auth.py              # Authentication logic
│   │   ├── scheduler.py         # Background tasks
│   │   └── routers/             # API route modules
│   ├── requirements.txt         # Python dependencies
│   └── Dockerfile              # Backend container
├── frontend/wealth-frontend/
│   ├── src/app/
│   │   ├── layout/             # Dashboard layout
│   │   ├── portfolio/          # Portfolio management
│   │   ├── market/             # Mutual funds data
│   │   ├── login/              # Authentication
│   │   ├── services/           # API services
│   │   └── guards/             # Route protection
│   ├── tailwind.config.js      # Tailwind configuration
│   └── Dockerfile             # Frontend container
├── docker-compose.yml          # Production setup
├── docker-compose.dev.yml      # Development setup
└── README.md                   # This file
```

## 🔐 Authentication

### Default Users
- **Admin**: `admin` / `admin123`
- **User**: `user1` / `password123`

### User Registration
New users can register through the registration page with automatic role assignment.

## 📊 API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/forgot-password` - Password reset
- `GET /auth/user-info` - User profile

### Portfolio Management
- `GET /portfolio/investments` - Get user investments
- `POST /portfolio/investments` - Add new investment
- `PUT /portfolio/investments/{id}` - Update investment
- `DELETE /portfolio/investments/{id}` - Delete investment
- `GET /portfolio/mutual-funds-nav` - Get NAV data

### Admin Operations
- `GET /admin/tables` - List database tables
- `GET /admin/table/{name}` - Get table data
- `POST /admin/table/{name}` - Insert table record
- `PUT /admin/table/{name}/{id}` - Update table record
- `DELETE /admin/table/{name}/{id}` - Delete table record

## 🎨 UI Features

### Modern Design
- Clean light theme with blue accents
- Responsive grid layouts
- Smooth hover animations
- Interactive card components
- Professional typography

### Navigation
- Collapsible sidebar navigation
- Dynamic page titles
- Role-based menu visibility
- Mobile-friendly hamburger menu

### Accessibility
- WCAG compliant design
- Keyboard navigation support
- Screen reader compatibility
- High contrast options

## 🔄 Data Management

### Automatic NAV Updates
- Daily NAV updates at midnight
- Startup NAV synchronization
- AMFI API integration
- Fund categorization (Equity/Debt)

### Investment Types
- **Mutual Funds**: Equity, Debt, Hybrid funds
- **EPF**: Employee Provident Fund
- **PPF**: Public Provident Fund
- **FD**: Fixed Deposits
- **MIS**: Monthly Income Scheme
- **NPS**: National Pension System

## 🚀 Deployment

### GitHub Codespaces
The application is configured for GitHub Codespaces with proper CORS settings and port forwarding.

### Production Deployment
1. Set environment variables
2. Configure database connection
3. Run `docker compose up --build`
4. Access via configured domain

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the API documentation at `/docs`
2. Review the application logs
3. Create an issue in the repository

---

**WealthTracker** - Empowering your financial journey with modern technology.