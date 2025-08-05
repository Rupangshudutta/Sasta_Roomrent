# Sasta Room - AI Agent Configuration

## Project Overview
Sasta Room is a comprehensive long-term accommodation booking platform similar to OYO, built with modern web technologies and featuring separate dashboards for customers, room owners, and administrators.

## Technology Stack

### Backend
- **Runtime**: Node.js with Express.js
- **Database**: MySQL with Sequelize ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Uploads**: Multer with Sharp image processing
- **Payment**: Razorpay integration
- **Validation**: Express-validator with custom middleware
- **Security**: Helmet, CORS, rate limiting

### Frontend
- **Markup**: HTML5 with semantic structure
- **Styling**: Bootstrap 5 with custom CSS
- **JavaScript**: ES6+ with modern APIs
- **Maps**: Google Maps API integration
- **Icons**: Font Awesome
- **Fonts**: Google Fonts (Inter)

## Project Structure

```
room_rent/
├── backend/                    # Backend application
│   ├── src/
│   │   ├── models/            # Sequelize database models
│   │   │   ├── User.js        # User management
│   │   │   ├── Property.js    # Property listings
│   │   │   ├── Booking.js     # Booking management
│   │   │   ├── Payment.js     # Payment processing
│   │   │   ├── Review.js      # Reviews and ratings
│   │   │   ├── PropertyImage.js # Property photos
│   │   │   └── PropertyAmenity.js # Property features
│   │   ├── routes/            # API endpoints
│   │   │   ├── auth.js        # Authentication routes
│   │   │   ├── users.js       # User management
│   │   │   ├── properties.js  # Property CRUD
│   │   │   ├── bookings.js    # Booking management
│   │   │   ├── payments.js    # Payment processing
│   │   │   ├── reviews.js     # Review management
│   │   │   ├── uploads.js     # File uploads
│   │   │   └── dashboard.js   # Dashboard APIs
│   │   ├── middleware/        # Custom middleware
│   │   │   ├── auth.js        # JWT authentication
│   │   │   ├── validation.js  # Input validation
│   │   │   ├── upload.js      # File upload handling
│   │   │   └── errorHandler.js # Global error handling
│   │   └── config/            # Configuration
│   │       └── database.js    # MySQL connection
│   ├── tests/                 # Test files
│   ├── uploads/               # File storage
│   └── package.json           # Dependencies
├── js/                        # Frontend JavaScript
│   ├── api-service.js         # API communication
│   ├── payment_gateway.js     # Razorpay integration
│   ├── map_integration.js     # Google Maps
│   └── test-connection.js     # API testing
├── *.html                     # Frontend pages
├── .github/                   # CI/CD workflows
└── README.md                  # Documentation
```

## Database Schema

### Core Models
- **Users**: Multi-role user system (customer, owner, admin)
- **Properties**: Property listings with location and details
- **Bookings**: Long-term booking management
- **Payments**: Payment processing and history
- **Reviews**: Property reviews and ratings
- **PropertyImages**: Property photo management
- **PropertyAmenities**: Property features and amenities

### Key Relationships
- Users can have multiple Properties (owners)
- Users can have multiple Bookings (customers)
- Properties can have multiple Images and Amenities
- Properties can have multiple Reviews
- Bookings are linked to Users and Properties

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Properties
- `GET /api/properties` - List properties with filters
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create property (owners)
- `PUT /api/properties/:id` - Update property (owners)
- `DELETE /api/properties/:id` - Delete property (owners)

### Bookings
- `GET /api/bookings` - User bookings
- `POST /api/bookings` - Create booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Payments
- `POST /api/payments/create-order` - Create payment
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/refund` - Process refund

### Dashboard
- `GET /api/dashboard/admin` - Admin stats
- `GET /api/dashboard/owner` - Owner stats
- `GET /api/dashboard/customer` - Customer stats

## Security Features

- **JWT Authentication**: Token-based auth with role-based access
- **Password Security**: bcrypt hashing with salt
- **Input Validation**: Comprehensive validation middleware
- **SQL Injection Protection**: Sequelize ORM with parameterized queries
- **Rate Limiting**: Express rate limiter
- **CORS**: Configured cross-origin protection
- **Security Headers**: Helmet.js implementation

## Development Guidelines

### Code Style
- Use ES6+ JavaScript features
- Follow RESTful API conventions
- Implement proper error handling
- Use async/await for database operations
- Add JSDoc comments for complex functions

### Database Operations
- Use Sequelize models for all database interactions
- Implement proper relationships and constraints
- Use transactions for complex operations
- Add database indexes for performance

### API Design
- Consistent response format with status codes
- Proper error messages and validation
- Pagination for list endpoints
- Filtering and sorting capabilities

### Testing
- Unit tests for models and utilities
- Integration tests for API endpoints
- Use Jest and Supertest for testing

## Environment Configuration

### Required Environment Variables
```env
# Database
DB_HOST=localhost
DB_NAME=sasta_room
DB_USER=root
DB_PASSWORD=your_password
DB_PORT=3306

# JWT
JWT_SECRET=your_jwt_secret_key

# Payment
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key

# Maps
GOOGLE_MAPS_API_KEY=your_google_maps_api_key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_email_password
```

## Deployment

### Production Setup
1. Set NODE_ENV=production
2. Configure MySQL database
3. Set up environment variables
4. Use PM2 or Docker for process management

### Docker Deployment
- Dockerfile included for containerization
- Multi-stage build for optimization
- Environment variable support
- Health check endpoint available

## Monitoring and Logging

- Winston logging for structured logs
- Error tracking and monitoring
- Health check endpoint for uptime monitoring
- Performance metrics collection

## Future Enhancements

- Mobile app development
- Advanced analytics dashboard
- AI-powered recommendations
- Real-time notifications
- Multi-language support
- Advanced search and filtering
