# Quick Setup Guide

## Prerequisites
- Node.js (v16 or higher)
- MySQL (8.0 or higher) OR SQLite (for development)

## Installation Steps

### 1. Install Backend Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
The `.env` file is already configured. Update database credentials if needed:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sastaroom
DB_USER=root
DB_PASSWORD=I@mysqluser10
```

### 3. Setup Database
```bash
# Run database setup script
npm run setup-db

# OR manually sync database
node src/scripts/setup-database.js
```

### 4. Start Backend Server
```bash
# Development mode
npm run dev

# Production mode
npm start
```

### 5. Access Application
- Frontend: Open `index.html` in browser (use Live Server extension)
- Backend API: http://localhost:3000/api/health
- Health Check: http://localhost:3000/health

## Quick Test
1. Open browser console on `index.html`
2. Look for "🎉 Frontend-Backend connection successful!" message
3. If you see connection errors, ensure backend is running on port 3000

## Common Issues

### Database Connection Error
- Ensure MySQL is running
- Check database credentials in `.env`
- Create database: `CREATE DATABASE sastaroom;`

### Port Already in Use
- Change PORT in `.env` file
- Update `js/config.js` with new port

### CORS Errors
- Backend already configured for localhost
- Check if frontend is served from correct origin

## Development Notes
- Backend uses SQLite in development mode
- MySQL for production
- JWT tokens expire in 24 hours
- File uploads stored in `backend/uploads/`