# Smart Home Backend Documentation

Welcome to the comprehensive documentation for the Smart Home Backend - a production-ready IoT platform with AI-powered analytics and real-time device management.

## 📚 Documentation Index

### 🚀 Getting Started

- **[API Reference](./API_REFERENCE.md)** - Complete REST API documentation with examples
- **[Development Guide](./DEVELOPMENT_GUIDE.md)** - Setup, coding standards, and development workflow
- **[Deployment Guide](./DEPLOYMENT_GUIDE.md)** - Production deployment instructions

### 🔧 Technical Guides

- **[MQTT Integration](./MQTT_INTEGRATION.md)** - Real-time IoT device communication
- **[AI System](./AI_SYSTEM.md)** - Energy prediction and anomaly detection
- **[Schema Optimization](./SCHEMA_OPTIMIZATION.md)** - Database performance improvements

### 📋 Quick Reference

- **[AsyncAPI Specification](../docs/asyncapi.yaml)** - MQTT topic contracts
- **[OpenAPI Specification](http://localhost:3000/openapi.json)** - REST API schema
- **[Interactive API Docs](http://localhost:3000/docs)** - Swagger UI

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   IoT Devices   │◄──►│   MQTT Broker   │◄──►│  Smart Home     │
│  (ESP32/Arduino)│    │  (Mosquitto)    │    │    Backend      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                       ┌─────────────────┐             │
                       │   PostgreSQL    │◄────────────┤
                       │   Database      │             │
                       └─────────────────┘             │
                                                        │
                       ┌─────────────────┐             │
                       │  Frontend Apps  │◄────────────┘
                       │ (Web/Mobile)    │
                       └─────────────────┘
```

## 🌟 Key Features

### 🔌 **Real-time IoT Communication**

- MQTT-based device communication
- WebSocket real-time updates
- Device authentication and authorization
- Automatic device discovery and pairing

### 🤖 **AI-Powered Analytics**

- Energy consumption prediction
- Anomaly detection for sensors
- Intelligent insights and recommendations
- Multiple ML algorithms (Moving Average, Linear Regression, Seasonal Decomposition)

### 🏠 **Smart Home Management**

- Multi-home support with role-based access
- Room and device organization
- Device configuration management
- Real-time monitoring and control

### 🚨 **Intelligent Alerting**

- Customizable alarm thresholds
- Multi-channel notifications (Email, SMS, Push)
- Automatic escalation and acknowledgment
- Historical alarm tracking

### 🔄 **OTA Firmware Updates**

- Over-the-air device updates
- Version management and rollback
- Batch deployment capabilities
- Update progress tracking

### 🔒 **Enterprise Security**

- JWT-based authentication
- Role-based access control (RBAC)
- Device-specific authentication tokens
- Comprehensive audit logging

## 🚀 Quick Start

### 1. **Development Setup**

```bash
# Clone repository
git clone <repository-url>
cd smarthome-backend

# Install dependencies
bun install

# Setup environment
cp .env.example .env
# Edit .env with your configuration

# Setup database
bun run prisma:migrate
bun run prisma:generate

# Start development server
bun run dev
```

### 2. **Docker Development**

```bash
# Start all services
docker-compose up --build

# View API documentation
open http://localhost:3000/docs
```

### 3. **First API Call**

```bash
# Register a new user
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H 'Content-Type: application/json' \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "name": "Test User"
  }'

# Create a home
curl -X POST http://localhost:3000/api/v1/homes \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <your-token>' \
  -d '{
    "name": "My Smart Home",
    "address": "123 Main St, City, Country"
  }'
```

## 📊 API Endpoints Overview

### Authentication

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - User login
- `POST /api/v1/auth/refresh` - Refresh JWT token

### Home Management

- `GET /api/v1/homes` - List user homes
- `POST /api/v1/homes` - Create new home
- `GET /api/v1/homes/{id}` - Get home details
- `PATCH /api/v1/homes/{id}` - Update home
- `DELETE /api/v1/homes/{id}` - Delete home

### Device Management

- `GET /api/v1/homes/{homeId}/devices` - List home devices
- `POST /api/v1/homes/{homeId}/devices` - Register new device
- `GET /api/v1/devices/{id}` - Get device details
- `PATCH /api/v1/devices/{id}` - Update device
- `DELETE /api/v1/devices/{id}` - Delete device

### Telemetry & Control

- `POST /api/v1/devices/{id}/telemetry` - Send sensor data
- `GET /api/v1/devices/{id}/telemetry` - Get telemetry history
- `POST /api/v1/devices/{id}/commands` - Send device command
- `GET /api/v1/commands/{id}` - Get command status

### AI & Analytics

- `POST /api/v1/devices/{id}/energy-predictions` - Generate energy prediction
- `GET /api/v1/devices/{id}/ai-insights` - Get AI insights
- `POST /api/v1/predictions/{id}/anomalies` - Detect anomalies
- `GET /api/v1/ai-models` - List AI models

### Alarms & Notifications

- `GET /api/v1/homes/{id}/alarms` - List home alarms
- `POST /api/v1/homes/{id}/alarms` - Create alarm
- `POST /api/v1/homes/{id}/alarms/{id}/acknowledge` - Acknowledge alarm
- `GET /api/v1/notifications/endpoints` - List notification endpoints

## 🔧 Configuration

### Environment Variables

```bash
# Core Settings
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/smarthome

# Authentication
JWT_SECRET=your-secure-jwt-secret
JWT_EXPIRES_IN=7d

# MQTT
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=smarthome_backend
MQTT_PASSWORD=secure-password

# AI Processing
AI_PREDICTION_INTERVAL=30
AI_ENABLE_AUTO_PROCESSING=true

# Email Notifications
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
```

### Database Schema

The system uses PostgreSQL with Prisma ORM. Key tables include:

- **Users & Authentication**: `UserAccount`, `UserSession`, `LoginHistory`
- **Home Management**: `Home`, `HomeMember`, `HomeInviteToken`
- **Device Management**: `Device`, `Room`, `DeviceConfig`
- **Telemetry**: `SensorData`, `SensorReading`
- **AI System**: `EnergyPrediction`, `AnomalyResult`, `AIModel`
- **Alarms**: `AlarmEvent`, `NotificationLog`
- **Firmware**: `FirmwareRelease`, `OtaJob`

## 🧪 Testing

### Running Tests

```bash
# Run all tests
bun test

# Run specific test suite
bun test tests/services/

# Run with coverage
bun test --coverage

# Run in watch mode
bun test --watch
```

### API Testing

Use the interactive Swagger UI at `http://localhost:3000/docs` or test with cURL:

```bash
# Health check
curl http://localhost:3000/health

# Get OpenAPI spec
curl http://localhost:3000/openapi.json

# Test authentication
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"email": "test@example.com", "password": "password123"}'
```

## 📈 Performance & Monitoring

### Database Optimization

- Strategic indexing for 60-90% query performance improvement
- Efficient pagination and filtering
- Connection pooling and query optimization

### Monitoring Endpoints

- `GET /health` - System health check
- `GET /metrics` - Application metrics (if enabled)
- Database query performance monitoring
- MQTT message throughput tracking

### Scaling Considerations

- Horizontal scaling with load balancers
- Database read replicas for high-traffic scenarios
- Redis caching for frequently accessed data
- CDN for static assets

## 🔒 Security

### Authentication & Authorization

- JWT-based stateless authentication
- Role-based access control (ADMIN, MEMBER, VIEWER)
- Device-specific authentication tokens
- Session management and token refresh

### Data Protection

- Password hashing with Argon2
- SQL injection prevention with Prisma
- Input validation with Zod schemas
- Rate limiting and CORS protection

### MQTT Security

- Username/password authentication
- Access Control Lists (ACLs)
- TLS encryption support
- Device-specific topic permissions

## 🚀 Deployment

### Production Deployment Options

1. **Docker Compose** (Recommended for small-medium deployments)
2. **Kubernetes** (For large-scale deployments)
3. **VPS/Server** (Traditional server deployment)
4. **Cloud Platforms** (AWS ECS, Google Cloud Run, etc.)

See the [Deployment Guide](./DEPLOYMENT_GUIDE.md) for detailed instructions.

### Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed
- [ ] MQTT broker secured
- [ ] Monitoring and logging setup
- [ ] Backup strategy implemented
- [ ] Load balancer configured (if needed)

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes following the coding standards
4. Add tests for new functionality
5. Update documentation
6. Submit a pull request

### Coding Standards

- TypeScript with strict type checking
- Prettier for code formatting
- ESLint for code quality
- Conventional commits for git messages
- Comprehensive test coverage

See the [Development Guide](./DEVELOPMENT_GUIDE.md) for detailed guidelines.

## 📞 Support & Resources

### Documentation

- **API Documentation**: `/docs` (Swagger UI)
- **OpenAPI Spec**: `/openapi.json`
- **AsyncAPI Spec**: `/docs/asyncapi.yaml`

### Community

- **GitHub Issues**: Report bugs and request features
- **Discussions**: Ask questions and share ideas
- **Wiki**: Community-contributed guides and examples

### Professional Support

- **Enterprise Support**: Available for production deployments
- **Custom Development**: Tailored solutions and integrations
- **Training & Consulting**: Team training and architecture consulting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](../LICENSE) file for details.

## 🙏 Acknowledgments

- **Bun** - Fast JavaScript runtime and package manager
- **Hono** - Lightweight web framework for edge computing
- **Prisma** - Next-generation ORM for TypeScript
- **PostgreSQL** - Advanced open-source relational database
- **Mosquitto** - Lightweight MQTT broker
- **Tailwind CSS** - Utility-first CSS framework

---

**Ready to build the future of smart homes?** Start with our [Development Guide](./DEVELOPMENT_GUIDE.md) or explore the [API Reference](./API_REFERENCE.md) to begin integrating with the Smart Home Backend.

For questions, issues, or contributions, please visit our [GitHub repository](https://github.com/your-repo) or check out the [interactive API documentation](http://localhost:3000/docs).
