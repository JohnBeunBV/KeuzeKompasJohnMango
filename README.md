# KeuzeKompas - VKM Recommender System

A full-stack web application for discovering and recommending educational VKM (Vrije Keuze Module) modules using AI-powered recommendations.

## Architecture

The project consists of three main services:

- **Frontend** (React + Vite): User-facing web application
- **Backend API** (Node.js/Express): REST API for modules, users, and authentication
- **Python AI Model API** (Python/FastAPI): ML-powered recommendation engine

## Prerequisites

- **Docker** and **Docker Compose** (recommended way to run the project)
- OR for manual setup:
  - Node.js 22+ (for backend)
  - Node.js 20+ (for frontend)
  - Python 3.11+ (for AI model)
  - MongoDB (for database)

## Quick Start with Docker (Recommended)

### 1. Clone and Navigate to Project
```bash
cd KeuzeKompasJohnMango
```

### 2. Configure Environment Variables

Create a `.env` file in the project root folder with the following variables:

```.env
# Frontend (react-app) Configuration
VITE_API_URL=http://localhost:5000/api
VITE_PEXELS_KEY=your_pexels_api_key_here
VITE_MICROSOFT_CLIENT_ID=your_microsoft_client_id_here
VITE_MICROSOFT_TENANT_ID=your_microsoft_tenant_id_here

# Backend (react-server) Configuration
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
PORT=5000

# Seed Data (Optional - for admin user initialization)
SEED_ADMIN_EMAIL=admin@example.com
SEED_ADMIN_PASSWORD=your_secure_password
SEED_ADMIN_USERNAME=admin
SEED_ADMIN_ROLE=admin

# AI Model (python-model) Configuration
PYTHON_API_KEY=your_python_api_key
MODEL_API_PORT=8000
MODEL_API_URL=http://model-api:8000
MODULES_API_URL=http://backend:5000/api/vkms

# Frontend Port Configuration
FRONTEND_PORT=5173
BACKEND_PORT=5000
```

### 3. Start All Services with Docker Compose

```bash
docker compose up --build
```

This will build and start all three services:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- ML Model API: http://localhost:8000

## Manual Setup (Development)

### Setup Backend

```bash
cd react-server
npm install
```

Create a `.env` file in `react-server/`:
```env
MONGO_URI=mongodb+srv://your_credentials@your_cluster/your_database
PORT=5000
JWT_SECRET=your_jwt_secret_key
PYTHON_API_KEY=your_python_api_key
```

Start the backend:
```bash
npm run dev
```

### Setup Frontend

```bash
cd react-app
npm install
```

Create a `.env` file in `react-app/`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_PEXELS_KEY=your_pexels_api_key
VITE_MICROSOFT_CLIENT_ID=your_client_id
VITE_MICROSOFT_TENANT_ID=your_tenant_id
```

Start the frontend:
```bash
npm run dev
```

### Setup Python Model API

```bash
cd python-model
python -m venv venv
.venv\Scripts\Activate.ps1 (or .bat if using cmd instead of terminal)
pip install -r requirements.txt
```

Create a `.env` file in `python-model/`:
```env
PYTHON_API_KEY=your_python_api_key
MODEL_API_PORT=8000
MODULES_API_URL=http://localhost:5000/api/vkms
```

Start the AI model API (with activated venv):
```bash
uvicorn main:app --reload --port 8000
```

## Key Features

### Authentication & Authorization

- JWT-based authentication
- User roles and permissions
- Microsoft OAuth login

### Recommendations Engine

- AI-powered module recommendations
- User preference learning
- Multi-factor recommendation algorithm

### Module Discovery & Interaction

- **Swiper** (Core Feature): Swiper interface to discover modules - swipe left to dislike or right to like modules
- Browse and filter VKM modules by tags, location, difficulty and credits
- View module details like description and amount of places left in the module
- Read-only access to module content (authenticated users only)
- Add modules to favorites for recommendations by AI
- Explainable AI information hover
- Module data can be imported via CSV upload to MongoDB

### User Features

- User accounts and authentication
- Favorite/save modules to personalized collection
- User profile management
- Responsive UI supporting all devices (mobile, tablet, desktop)

### Teacher Features

- See how many users have favorited each module
- Monitor learning trends across modules
- Identify popular and engaging content

### Admin Features

- User role management (assign/modify user, teacher roles)
- AI model management:
  - Retrain recommendation models
  - Evaluate model performance
  - Monitor model metrics and insights
- System configuration and monitoring

## Important Notes

### Favorites Feature

Favorites functionality requires an authenticated user with a valid JWT token stored in browser localStorage.

### Environment Variables
- **Never commit `.env` files** to git - they contain sensitive credentials
- Different services have separate `.env` files
- Docker Compose reads from a root `.env` file and passes variables to each service

### Database
MongoDB connection string should be a full URI with credentials. For local development, you can use a local MongoDB instance.

### API Documentation
- Backend API: `http://localhost:5000/api` (REST endpoints)
- AI Model API: `http://localhost:8000/docs` (Swagger/OpenAPI documentation)

## Example Test Data

### User Account
- Email: `test@example.com`
- Password: `Test123!`

### Example VKM/Module
- **name**: "Full-stack Web Applications With AI"
- **studycredit**: 30
- **location**: "Breda"
- **shortdescription**: "Master modern web development with AI"
- **description**: "An intensive module covering full-stack web development. Learn to build scalable applications using React for frontend, Node.js/Express for backend, and MongoDB for data persistence. Includes hands-on projects and best practices for production deployment."
- **learningoutcomes**: "Proficiency in React hooks and state management, RESTful API design, database schema design, authentication implementation, Docker containerization"
- **module_tags**: ["Web Development", "React", "Node.js", "Full-Stack", "JavaScript", "Docker, "AI"]

## Production Deployment

- Ensure all environment variables are properly set
- Use HTTPS in production
- Implement proper CORS policies
- Keep JWT_SECRET and other credentials secure
- Use a managed MongoDB service (e.g., MongoDB Atlas)
- Consider using environment-specific configurations
