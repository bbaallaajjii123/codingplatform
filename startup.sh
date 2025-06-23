#!/bin/bash

# Akshaya Coding Platform Startup Script

echo "🚀 Starting Akshaya Coding Platform..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if MongoDB is running locally (optional)
if ! docker ps | grep -q mongodb; then
    echo "📦 Starting MongoDB container..."
    docker-compose -f docker/docker-compose.yml up -d mongodb
    echo "⏳ Waiting for MongoDB to be ready..."
    sleep 10
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
npm install

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd client && npm install && cd ..

# Create .env file if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "✅ .env file created. Please review and update the configuration if needed."
fi

# Start the development servers
echo "🚀 Starting development servers..."
echo "📱 Frontend will be available at: http://localhost:3051"
echo "🔧 Backend API will be available at: http://localhost:5051"
echo "🗄️  MongoDB will be available at: localhost:27017"
echo ""
echo "Press Ctrl+C to stop all services"

# Start both servers concurrently
npm run dev 