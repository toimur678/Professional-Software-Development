#!/bin/bash

# EcoWisely Frontend - Installation Script
# This script will set up your Next.js mobile app

echo "🌱 EcoWisely Frontend Setup"
echo "============================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: package.json not found!"
    echo "Please run this script from the FrontEnd directory:"
    echo "  cd FrontEnd && bash install.sh"
    exit 1
fi

echo "📦 Step 1: Installing dependencies..."
echo "This may take a few minutes..."
echo ""

npm install

if [ $? -ne 0 ]; then
    echo ""
    echo "❌ Installation failed!"
    echo "Please check your internet connection and try again."
    exit 1
fi

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    echo "🔧 Step 2: Creating .env.local file..."
    cp .env.example .env.local
    echo "✅ Environment file created!"
    echo ""
else
    echo "⚠️  .env.local already exists, skipping..."
    echo ""
fi

echo "✅ Setup Complete!"
echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Start the development server:"
echo "   npm run dev"
echo ""
echo "2. Find your computer's IP address:"
echo "   - macOS/Linux: ifconfig | grep 'inet ' | grep -v 127.0.0.1"
echo "   - Windows: ipconfig"
echo ""
echo "3. Open on your mobile device:"
echo "   http://YOUR_IP_ADDRESS:3000"
echo ""
echo "4. Read the docs:"
echo "   - SETUP.md - Detailed setup guide"
echo "   - README.md - Features and documentation"
echo "   - PROJECT_SUMMARY.md - Complete project overview"
echo ""
echo "📱 Remember: This app is designed for MOBILE ONLY!"
echo ""
echo "Happy coding! 🌍💚"
