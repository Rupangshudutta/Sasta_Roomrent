# Sasta Room - Long-Term Accommodation Platform

A comprehensive hotel booking platform similar to OYO, designed specifically for long-term stays including PGs, shared rooms, single rooms, and flats. Built with modern web technologies and featuring separate dashboards for customers, room owners, and administrators.

## 🌟 Features

### Core Features
- **Multi-User System**: Separate login and dashboards for customers, room owners, and administrators
- **Property Management**: Complete CRUD operations for properties with image uploads
- **Booking System**: Long-term booking management with flexible lease durations
- **Payment Integration**: Secure payment processing with Razorpay
- **Map Integration**: Google Maps integration for property locations
- **Real-time Search**: Advanced search and filtering capabilities
- **Mobile Responsive**: Clean, modern UI that works on all devices

### Property Types
- **PG (Paying Guest)**: Traditional PG accommodations
- **Shared Rooms**: Co-living spaces with shared facilities
- **Single Rooms**: Private rooms with individual facilities
- **Flats**: Complete apartment rentals

### User Dashboards
- **Customer Dashboard**: Search properties, manage bookings, favorites, and payments
- **Room Owner Dashboard**: Manage properties, bookings, earnings, and inquiries
- **Admin Dashboard**: Complete platform management, user management, and analytics

## 🛠️ Technology Stack

### Frontend
- **HTML5/CSS3**: Semantic markup and modern styling
- **Bootstrap 5**: Responsive UI framework
- **JavaScript (ES6+)**: Interactive functionality
- **Font Awesome**: Icon library
- **Google Fonts**: Typography (Inter font family)

### Backend
- **Node.js**: Runtime environment
- **Express.js**: Web application framework
- **MySQL**: Primary database with Sequelize ORM
- **JWT**: Authentication and authorization
- **Multer**: File upload handling
- **Sharp**: Image processing

### Third-Party Integrations
- **Razorpay**: Payment gateway
- **Google Maps API**: Location services
- **Nodemailer**: Email services

## 🎨 Design System

### Color Palette
- **Primary**: #EE2E24 (OYO Red)
- **Secondary**: #1A73E8 (Trust Blue)
- **Success**: #34A853 (Green)
- **Background**: #FFFFFF (White)
- **Text**: #202124 (Dark Grey)
- **Neutral**: #F8F9FA (Light Grey)

### Typography
- **Primary Font**: Inter (Google Fonts)
- **Fallback**: system-ui, -apple-system, sans-serif

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MySQL (8.0 or higher)
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/sasta-room.git
   cd sasta-room
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Set up MySQL database**
   ```bash
   # Create MySQL database
   mysql -u root -p
   CREATE DATABASE sasta_room CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

4. **Configure environment variables**
   ```bash
   # In backend directory
   cp .env.example .env
   # Edit .env file with your actual configuration values
   ```

5. **Run database migrations**
   ```bash
   npm run migrate
   ```

6. **Start the development server**
   ```bash
   npm run dev
   ```

7. **Access the application**
   - Frontend: http://localhost:3000
   - API Health Check: http://localhost:3000/api/health

### Production Deployment

1. **Build and start the application**
   ```bash
   cd backend
   npm start
   ```

2. **Using Docker**
   ```bash
   docker build -t sasta-room-backend .
   docker run -d --env-file .env -p 3000:3000 sasta-room-backend
   ```

## 📁 Project Structure

```
sasta-room/
├── backend/                    # Backend application
│   ├── src/
│   │   ├── models/            # Sequelize database models
│   │   ├── routes/            # API route handlers
│   │   ├── middleware/        # Custom middleware
│   │   └── config/            # Database configuration
│   ├── tests/                 # Test files
│   ├── uploads/               # File upload directory
│   ├── package.json           # Backend dependencies
│   └── README.md              # Backend documentation
├── js/                        # Frontend JavaScript
│   ├── api-service.js         # API communication service
│   ├── payment_gateway.js     # Payment integration
│   └── map_integration.js     # Google Maps integration
├── *.html                     # Frontend pages
├── .github/                   # CI/CD workflows
└── README.md                  # This file
```

## 🔧 Configuration

### Database Configuration
Update the database connection settings in `backend/.env`:
```env
DB_HOST=localhost
DB_NAME=sasta_room
DB_USER=root
DB_PASSWORD=your_password
DB_PORT=3306
```

### Payment Gateway Setup
Configure Razorpay in `backend/.env`:
```env
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key
```

### Google Maps Setup
Add your Google Maps API key:
```env
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
```

## 📊 Database Schema

The platform uses a comprehensive MySQL database with Sequelize ORM and the following main models:
- **Users**: Customer, owner, and admin user management
- **Properties**: Property listings with location and amenities
- **Bookings**: Booking management and tracking
- **Payments**: Payment processing and history
- **Reviews**: Property reviews and ratings
- **PropertyImages**: Property photo management
- **PropertyAmenities**: Property amenities and features

## 🔐 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for secure password storage
- **Rate Limiting**: Protection against brute force attacks
- **Input Validation**: Comprehensive input sanitization
- **SQL Injection Protection**: Parameterized queries via Sequelize
- **CORS Protection**: Configured cross-origin resource sharing
- **Helmet.js**: Security headers and protection

## 📱 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Properties
- `GET /api/properties` - Get all properties with filters
- `GET /api/properties/:id` - Get property details
- `POST /api/properties` - Create new property (owners only)
- `PUT /api/properties/:id` - Update property (owners only)
- `DELETE /api/properties/:id` - Delete property (owners only)

### Bookings
- `GET /api/bookings` - Get user bookings
- `POST /api/bookings` - Create new booking
- `PUT /api/bookings/:id` - Update booking
- `DELETE /api/bookings/:id` - Cancel booking

### Payments
- `POST /api/payments/create-order` - Create payment order
- `POST /api/payments/verify` - Verify payment
- `POST /api/payments/refund` - Process refund

### Dashboard
- `GET /api/dashboard/admin` - Admin dashboard stats
- `GET /api/dashboard/owner` - Owner dashboard stats
- `GET /api/dashboard/customer` - Customer dashboard stats

### Health Check
- `GET /api/health` - Server health status

## 🧪 Testing

Run the test suite:
```bash
cd backend
npm test
```

## 📈 Performance Optimization

- **Image Optimization**: Sharp for image compression and resizing
- **Database Indexing**: Optimized MySQL queries
- **Connection Pooling**: Sequelize connection pool management
- **Compression**: Gzip compression for responses
- **CDN Ready**: Static assets can be served from CDN

## 🔄 Development Workflow

1. **Database Migrations**: Manage database schema changes
   ```bash
   npm run migrate
   npm run migrate:undo
   ```

2. **Environment Management**: Use different .env files for different environments

3. **Code Quality**: Follow ESLint standards and best practices

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Email: support@sastaroom.com
- Documentation: [Wiki](https://github.com/your-username/sasta-room/wiki)

## 🎯 Roadmap

### Phase 1 (Current)
- ✅ Basic property listing and booking
- ✅ Payment integration
- ✅ User management
- ✅ Admin dashboard
- ✅ MySQL database with Sequelize

### Phase 2 (Planned)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics
- [ ] AI-powered recommendations
- [ ] Multi-language support
- [ ] Automated property verification

### Phase 3 (Future)
- [ ] IoT integration for smart properties
- [ ] Blockchain-based property verification
- [ ] AR/VR property tours
- [ ] Advanced AI chatbot support

## 🙏 Acknowledgments

- [OYO](https://www.oyorooms.com/) for design inspiration
- [Booking.com](https://www.booking.com/) for UX patterns
- [Bootstrap](https://getbootstrap.com/) for UI components
- [Razorpay](https://razorpay.com/) for payment processing
- [Google Maps](https://developers.google.com/maps) for location services

---

**Made with ❤️ for better living experiences**
