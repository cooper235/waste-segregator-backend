# Smart Waste Segregator - Admin Dashboard Backend

A comprehensive, production-ready Express.js backend for managing IoT-enabled smart waste segregation bins with real-time monitoring, analytics, and admin controls.

## Features

### Core Functionality
- **JWT-based Authentication**: Secure admin user authentication with refresh tokens and account lockout protection
- **IoT Device Integration**: API key authentication for IoT devices with rate limiting
- **Real-time Monitoring**: Live bin status tracking with fill level monitoring
- **Image Verification**: Cloudinary integration for waste image capture and verification
- **Waste Categories**: Support for 4 waste types (Metal, Biodegradable, Non-biodegradable, Others)
- **Remote Commands**: Send commands to IoT devices (empty, calibrate, reset, test)
- **Maintenance Management**: Log and schedule maintenance activities
- **Alert System**: Automatic anomaly detection and alert management
- **Worker Management**: Assign workers to bins with performance tracking
- **Email Notifications**: Automated email alerts for critical events
- **Analytics Dashboard**: Real-time waste statistics and trends

### Security Features
- Helmet security headers (CSP, HSTS, X-Frame-Options)
- NoSQL injection prevention
- XSS protection
- HTTP Parameter Pollution prevention
- Rate limiting on all endpoints
- Input validation and sanitization
- Secure password hashing with bcrypt
- Token rotation and invalidation

### Testing & CI/CD
- Comprehensive Jest test suite (20+ test cases)
- GitHub Actions workflows for testing, security, and deployment
- Code coverage reporting
- ESLint code quality checks

## Quick Start

### Prerequisites
- Node.js 18+
- MongoDB 5.0+
- npm or yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd waste-segregator-backend
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`

3. Create `.env` file from `.env.example`:
\`\`\`bash
cp .env.example .env
\`\`\`

4. Configure environment variables in `.env`:
\`\`\`env
# Database
MONGO_URI=mongodb://localhost:27017/waste-segregator

# JWT
JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRE=15m
JWT_REFRESH_EXPIRE=7d

# IoT
IOT_API_KEY=your-iot-api-key

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Cloudinary
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Frontend
FRONTEND_URL=http://localhost:3000

# Environment
NODE_ENV=development
\`\`\`

5. Seed the database with initial data:
\`\`\`bash
npm run seed
\`\`\`

6. Start the development server:
\`\`\`bash
npm run dev
\`\`\`

The server will start on `http://localhost:5000`

## Project Structure

\`\`\`
src/
├── __tests__/              # Jest test files
│   ├── auth.test.js
│   ├── iot.test.js
│   ├── bins.test.js
│   └── setup.js
├── config/                 # Configuration files
│   ├── db.js              # MongoDB connection
│   ├── cloudinary.js      # Cloudinary setup
│   ├── logger.js          # Logging utility
│   └── constants.js       # App constants
├── models/                 # Mongoose schemas
│   ├── AdminUser.js
│   ├── Bin.js
│   ├── ImageRecord.js
│   ├── Command.js
│   ├── MaintenanceLog.js
│   ├── Worker.js
│   ├── Alert.js
│   └── Feedback.js
├── routes/                 # Express routes
│   ├── authRoutes.js
│   ├── binRoutes.js
│   ├── iotRoutes.js
│   ├── imageRoutes.js
│   ├── commandRoutes.js
│   ├── maintenanceRoutes.js
│   ├── workerRoutes.js
│   ├── alertRoutes.js
│   ├── analyticsRoutes.js
│   └── feedbackRoutes.js
├── controllers/            # Business logic
│   ├── authController.js
│   ├── binController.js
│   ├── iotController.js
│   ├── imageController.js
│   ├── commandController.js
│   ├── maintenanceController.js
│   ├── workerController.js
│   ├── alertController.js
│   ├── analyticsController.js
│   └── feedbackController.js
├── middlewares/            # Express middlewares
│   ├── authMiddleware.js
│   ├── iotAuthMiddleware.js
│   ├── errorHandler.js
│   ├── rateLimiter.js
│   ├── securityHeaders.js
│   ├── inputValidation.js
│   └── validation.js
├── services/               # Business services
│   ├── mailService.js
│   ├── commandService.js
│   ├── anomalyService.js
│   └── cloudUploadService.js
├── utils/                  # Utility functions
│   ├── jwtUtils.js
│   ├── validators.js
│   ├── fileValidation.js
│   └── seed.js
├── jobs/                   # Scheduled jobs
│   └── anomalyDetectionJob.js
├── app.js                  # Express app setup
└── server.js               # Entry point

docs/
├── openapi.yaml           # OpenAPI specification
├── postman-collection.json # Postman collection
└── test-api-windows.ps1   # PowerShell test script

.github/workflows/         # CI/CD pipelines
├── test.yml
├── security.yml
├── deploy.yml
└── code-quality.yml
\`\`\`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new admin user
- `POST /api/auth/login` - Login admin user
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout user

### Bins Management
- `GET /api/bins` - Get all bins (with filtering and pagination)
- `POST /api/bins` - Create new bin
- `PATCH /api/bins/:binId` - Update bin
- `DELETE /api/bins/:binId` - Delete bin

### IoT Endpoints
- `POST /api/iot/update` - Device sends sensor data
- `GET /api/iot/commands/:binId` - Get pending commands
- `PATCH /api/iot/commands/:commandId/ack` - Acknowledge command

### Images
- `POST /api/images/upload` - Upload waste image
- `PATCH /api/images/:imageId/verify` - Verify image classification

### Commands
- `GET /api/commands` - Get all commands
- `POST /api/commands` - Create command
- `PATCH /api/commands/:commandId` - Update command
- `DELETE /api/commands/:commandId` - Delete command

### Maintenance
- `GET /api/maintenance` - Get maintenance logs
- `POST /api/maintenance` - Create maintenance log
- `PATCH /api/maintenance/:logId` - Update maintenance log

### Workers
- `GET /api/workers` - Get all workers
- `POST /api/workers` - Create worker
- `PATCH /api/workers/:workerId` - Update worker
- `DELETE /api/workers/:workerId` - Delete worker

### Alerts
- `GET /api/alerts` - Get all alerts
- `PATCH /api/alerts/:alertId` - Resolve alert

### Analytics
- `GET /api/analytics/waste-count` - Waste count by category
- `GET /api/analytics/trends` - Waste trends over time
- `GET /api/analytics/dashboard` - Dashboard summary
- `GET /api/analytics/category-performance` - Classification accuracy

### Feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/feedback` - Get all feedback (admin only)
- `PATCH /api/feedback/:feedbackId` - Update feedback status

## Available Scripts

\`\`\`bash
# Start development server with auto-reload
npm run dev

# Start production server
npm start

# Run tests with coverage
npm test

# Run linter
npm run lint

# Seed database with initial data
npm run seed
\`\`\`

## Testing

### Run Tests
\`\`\`bash
npm test
\`\`\`

### Test Coverage
\`\`\`bash
npm test -- --coverage
\`\`\`

### Using Postman
1. Import `docs/postman-collection.json` into Postman
2. Set environment variables:
   - `base_url`: http://localhost:5000/api
   - `access_token`: (obtained from login)
   - `iot_api_key`: test-api-key-123

### Windows PowerShell Testing
```powershell
.\docs\test-api-windows.ps1
