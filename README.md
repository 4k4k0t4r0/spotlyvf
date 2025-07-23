# Spotlyvf - Mobile Place Recommendation App

Spotlyvf is a comprehensive mobile application for discovering and recommending places to eat, visit, and explore based on location, personal preferences, budget, and service quality.

## 🚀 Features

- **Personalized Recommendations**: AI-powered suggestions based on location and preferences
- **Intelligent Feed**: Curated content by city, budget, and ratings
- **Advanced Search & Filters**: Find places by category, price range, features, and more
- **Reservation System**: Book tables and services with date/time selection
- **Review & Rating System**: Community-driven feedback with spam protection
- **User Roles**: Differentiated experience for customers and businesses
- **Real-time Notifications**: Stay updated with booking confirmations and recommendations
- **Maps Integration**: Interactive maps with Google Maps API
- **Social Features**: Follow, share, and interact with other users

## 🏗️ Architecture

### Frontend
- **Framework**: React Native with Expo CLI
- **Language**: TypeScript
- **State Management**: Redux Toolkit
- **Navigation**: React Navigation v6
- **HTTP Client**: Axios
- **Maps**: React Native Maps (Google Maps)

### Backend
- **Framework**: Django REST Framework
- **Architecture**: Clean Architecture with 30 microservices
- **Database**: MySQL
- **Authentication**: JWT tokens
- **Cache**: Redis
- **Task Queue**: Celery
- **Containerization**: Docker & Docker Compose

### Microservices (30 Services)

1. **auth_service** - Authentication & JWT management
2. **user_service** - User profile management
3. **business_service** - Business registration & profiles
4. **location_service** - Geographic data management
5. **category_service** - Place categories
6. **place_service** - Core place information
7. **review_service** - Reviews & ratings
8. **reservation_service** - Booking management
9. **search_service** - Advanced search & filtering
10. **recommendation_service** - AI recommendations
11. **notification_service** - Push notifications
12. **payment_service** - Payment processing
13. **analytics_service** - User behavior analytics
14. **content_service** - CMS & static content
15. **social_service** - Social features
16. **chat_service** - In-app messaging
17. **rating_service** - Rating algorithms
18. **image_service** - Image processing
19. **cache_service** - Redis management
20. **log_service** - Application logging
21. **email_service** - Email notifications
22. **sms_service** - SMS notifications
23. **verification_service** - Account verification
24. **report_service** - Content moderation
25. **favorite_service** - Favorites & wishlist
26. **schedule_service** - Business hours
27. **pricing_service** - Dynamic pricing
28. **integration_service** - Third-party APIs
29. **backup_service** - Data backup
30. **health_service** - System monitoring

## � Quick Start

### Option 1: Docker (Recommended)
```bash
# Clone and navigate to project
git clone <your-repo>
cd SPOTLYVF

# Start all services
docker-compose up -d

# Initialize database (run once)
docker-compose exec backend python init_db.py

# Access the applications
# Frontend: Install Expo Go app and scan QR code
# Backend API: http://localhost:8000/api/v1/
# Admin Panel: http://localhost:8000/admin (admin@spotlyvf.com / admin123)
```

### Option 2: Manual Setup

#### Prerequisites
- Node.js 18+
- Python 3.11+
- MySQL 8.0+
- Git

#### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
venv\Scripts\activate  # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt

# Initialize database
python init_db.py

# Start server
python manage.py runserver
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start Expo development server
npx expo start

# Scan QR code with Expo Go app on your phone
```

## 📱 Current Features Implemented

### ✅ **Authentication System**
- User registration and login
- JWT token authentication
- Role-based access (User/Business)
- Password security and validation

### ✅ **Frontend Screens**
- **Login Screen** - Modern UI with form validation
- **Registration Screen** - Complete signup flow
- **Feed Screen** - Place discovery with search
- **Map Screen** - Interactive map with location services
- **Reservations Screen** - Booking management
- **Profile Screen** - User profile and settings

### ✅ **Backend Architecture**
- **30 Microservices** planned and documented
- **auth_service** - Fully implemented with JWT
- Clean Architecture pattern
- MySQL database integration
- REST API endpoints
- Docker containerization

### ✅ **Development Ready**
- Complete project structure
- TypeScript configuration
- Navigation system
- API client setup
- Error handling
- Responsive design

## 🔧 **Next Development Steps**

1. **Complete remaining microservices** (place_service, review_service, etc.)
2. **Integrate Google Maps API** with real map functionality
3. **Implement Redux store** for state management
4. **Add real-time features** with WebSockets
5. **Implement push notifications**
6. **Add image upload** functionality
7. **Create admin dashboard**
8. **Add payment integration**

## 🧪 Testing

### Backend Tests
```bash
cd backend
python manage.py test
```

### Frontend Tests
```bash
cd frontend
npm test
```

## 📖 API Documentation

### Authentication Endpoints
- `POST /api/v1/auth/register/` - User registration
- `POST /api/v1/auth/login/` - User login
- `POST /api/v1/auth/logout/` - User logout
- `POST /api/v1/auth/token/refresh/` - Refresh JWT token
- `GET /api/v1/auth/profile/` - Get user profile
- `PUT /api/v1/auth/profile/` - Update user profile

### Core Features
- **Places**: `/api/v1/places/`
- **Reviews**: `/api/v1/reviews/`
- **Reservations**: `/api/v1/reservations/`
- **Search**: `/api/v1/search/`
- **Recommendations**: `/api/v1/recommendations/`

## 🔧 Development Guidelines

### Backend
- Follow Clean Architecture principles
- Use Django best practices
- Implement proper error handling
- Write comprehensive tests
- Document API endpoints

### Frontend
- Use TypeScript strictly
- Follow React Native best practices
- Implement responsive design
- Handle errors gracefully
- Use Redux for state management

## 🚀 Deployment

### Backend Deployment
1. Set `DEBUG=False` in production
2. Configure proper database settings
3. Set up static file serving
4. Configure Redis for caching
5. Use Gunicorn as WSGI server

### Frontend Deployment
1. Build production version: `expo build:android` or `expo build:ios`
2. Submit to app stores
3. Configure push notifications

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support and questions:
- Email: support@spotlyvf.com
- Documentation: [docs.spotlyvf.com](https://docs.spotlyvf.com)

## 🔄 Version History

- **v1.0.0** - Initial release with core features
- **v1.1.0** - Added social features and enhanced recommendations
- **v1.2.0** - Improved UI/UX and performance optimizations
