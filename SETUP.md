# Akshaya Coding Platform - Setup Guide

This guide will help you set up and run the Akshaya Coding Platform on your local machine.

## Prerequisites

Before you begin, make sure you have the following installed:

- **Node.js** (v16 or higher) - [Download here](https://nodejs.org/)
- **MongoDB** (v5.0 or higher) - [Download here](https://www.mongodb.com/try/download/community)
- **Docker** (v20.0 or higher) - [Download here](https://www.docker.com/products/docker-desktop/)
- **Git** - [Download here](https://git-scm.com/)

## Quick Start (Recommended)

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd akshaya-coding-platform
   ```

2. **Run the startup script:**
   ```bash
   chmod +x startup.sh
   ./startup.sh
   ```

3. **Access the application:**
   - Frontend: http://localhost:3051
   - Backend API: http://localhost:5051
   - MongoDB: localhost:27017

## Manual Setup

If you prefer to set up manually, follow these steps:

### 1. Install Dependencies

```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client && npm install && cd ..
```

### 2. Environment Configuration

```bash
# Copy the example environment file
cp env.example .env

# Edit the .env file with your configuration
nano .env
```

**Required environment variables:**
- `MONGODB_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for JWT tokens
- `PORT`: Backend server port (default: 5051)

### 3. Database Setup

**Option A: Local MongoDB**
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or use MongoDB Compass for GUI
```

**Option B: Docker MongoDB**
```bash
# Start MongoDB container
docker run -d --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  mongo:6.0
```

### 4. Start the Application

```bash
# Start both frontend and backend
npm run dev

# Or start them separately:
npm run server    # Backend only
npm run client    # Frontend only
```

## Docker Setup (Alternative)

If you prefer to run everything in Docker:

```bash
# Build and start all services
docker-compose -f docker/docker-compose.yml up --build

# Run in background
docker-compose -f docker/docker-compose.yml up -d
```

## Code Execution Setup

The platform uses Docker containers for safe code execution. Make sure Docker is running and accessible:

```bash
# Test Docker access
docker --version
docker ps
```

## Database Seeding

To populate the database with sample problems:

```bash
# Create a script to seed the database
node scripts/seed-database.js
```

## Development Workflow

1. **Backend Development:**
   - Server runs on http://localhost:5051
   - API documentation available at http://localhost:5051/api/health
   - Hot reload enabled with nodemon

2. **Frontend Development:**
   - React app runs on http://localhost:3051
   - Hot reload enabled
   - Proxy configured to backend API

3. **Database:**
   - MongoDB runs on localhost:27017
   - Use MongoDB Compass for database management

## Troubleshooting

### Common Issues

1. **Port already in use:**
   ```bash
   # Find process using port
   lsof -i :5051
   # Kill process
   kill -9 <PID>
   ```

2. **MongoDB connection failed:**
   - Check if MongoDB is running
   - Verify connection string in .env
   - Check firewall settings

3. **Docker permission denied:**
   ```bash
   # Add user to docker group
   sudo usermod -aG docker $USER
   # Logout and login again
   ```

4. **Node modules issues:**
   ```bash
   # Clear node modules and reinstall
   rm -rf node_modules package-lock.json
   npm install
   ```

### Logs

```bash
# View backend logs
npm run server

# View frontend logs
cd client && npm start

# View Docker logs
docker-compose logs -f
```

## Production Deployment

For production deployment:

1. **Environment Variables:**
   - Set `NODE_ENV=production`
   - Use strong JWT secret
   - Configure proper MongoDB URI
   - Set up SSL certificates

2. **Security:**
   - Enable rate limiting
   - Configure CORS properly
   - Set up proper authentication
   - Use HTTPS

3. **Performance:**
   - Enable compression
   - Set up caching (Redis)
   - Configure load balancing
   - Monitor resources

## API Documentation

The API includes the following endpoints:

- **Authentication:** `/api/auth/*`
- **Problems:** `/api/problems/*`
- **Submissions:** `/api/submissions/*`
- **Leaderboard:** `/api/leaderboard/*`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## Support

If you encounter any issues:

1. Check the troubleshooting section
2. Review the logs
3. Create an issue on GitHub
4. Contact the development team

## License

This project is licensed under the MIT License - see the LICENSE file for details. 