# Development Guide

## Overview

This guide covers the development workflow, coding standards, and best practices for contributing to the Smart Home Backend project.

## Development Environment Setup

### Prerequisites

- **Bun**: 1.0+ (recommended) or **Node.js**: 18+
- **PostgreSQL**: 14+
- **Git**: Latest version
- **VS Code**: Recommended IDE with extensions

### Required VS Code Extensions

```json
{
  "recommendations": [
    "bradlc.vscode-tailwindcss",
    "prisma.prisma",
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-typescript-next",
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-vscode.rest-client"
  ]
}
```

### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd smarthome-backend

# Install dependencies
bun install

# Copy environment file
cp .env.example .env

# Edit environment variables
nano .env

# Setup database
bun run prisma:migrate
bun run prisma:generate

# Start development server
bun run dev
```

### Environment Configuration

```bash
# .env (Development)
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/smarthome_dev

# Authentication
JWT_SECRET=your-development-jwt-secret
JWT_EXPIRES_IN=7d

# MQTT (optional for development)
MQTT_BROKER_URL=mqtt://localhost:1883
MQTT_USERNAME=dev_user
MQTT_PASSWORD=dev_password

# Email (optional)
SMTP_HOST=smtp.mailtrap.io
SMTP_PORT=2525
SMTP_USER=your-mailtrap-user
SMTP_PASS=your-mailtrap-password

# Development settings
LOG_LEVEL=debug
ENABLE_SWAGGER=true
ENABLE_CORS=true
```

## Project Structure

```
smarthome-backend/
├── docs/                     # Documentation
├── prisma/                   # Database schema and migrations
│   ├── migrations/          # Database migrations
│   └── schema.prisma        # Prisma schema
├── public/                   # Static files
├── src/                      # Source code
│   ├── lib/                 # Shared libraries
│   │   ├── generated/       # Generated Prisma client
│   │   ├── types/           # Type definitions
│   │   ├── env.ts           # Environment validation
│   │   ├── jwt.ts           # JWT utilities
│   │   ├── prisma.ts        # Database client
│   │   └── storage.ts       # File storage utilities
│   ├── middlewares/         # Express/Hono middlewares
│   │   ├── auth.ts          # Authentication middleware
│   │   └── device-auth.ts   # Device authentication
│   ├── mqtt/                # MQTT integration
│   │   └── client.ts        # MQTT client
│   ├── routes/              # API routes
│   │   └── v1/              # API version 1
│   │       ├── auth/        # Authentication routes
│   │       ├── homes/       # Home management
│   │       ├── devices/     # Device management
│   │       ├── telemetry/   # Sensor data
│   │       ├── ai/          # AI & analytics
│   │       └── ...          # Other route modules
│   ├── services/            # Business logic services
│   │   ├── ai/              # AI services
│   │   ├── auth/            # Authentication services
│   │   ├── telemetry/       # Telemetry processing
│   │   └── ...              # Other services
│   ├── workers/             # Background workers
│   │   ├── ai-prediction-update.worker.ts
│   │   └── device-offline.worker.ts
│   ├── app.ts               # Application setup
│   └── index.ts             # Entry point
├── .env.example             # Environment template
├── docker-compose.yml       # Docker development setup
├── package.json             # Dependencies and scripts
└── README.md                # Project overview
```

## Development Workflow

### 1. Feature Development

```bash
# Create feature branch
git checkout -b feature/new-feature-name

# Make changes and commit
git add .
git commit -m "feat: add new feature description"

# Push and create PR
git push origin feature/new-feature-name
```

### 2. Database Changes

```bash
# Create migration
bun run prisma:migrate dev --name add_new_table

# Generate Prisma client
bun run prisma:generate

# Reset database (development only)
bun run prisma:migrate reset
```

### 3. Testing Changes

```bash
# Start development server
bun run dev

# Test API endpoints
curl http://localhost:3000/health

# View Swagger documentation
open http://localhost:3000/docs
```

## Coding Standards

### TypeScript Guidelines

#### 1. Type Safety

```typescript
// ✅ Good: Explicit types
interface UserCreateInput {
  email: string;
  password: string;
  name?: string;
}

function createUser(input: UserCreateInput): Promise<User> {
  // Implementation
}

// ❌ Bad: Any types
function createUser(input: any): any {
  // Implementation
}
```

#### 2. Error Handling

```typescript
// ✅ Good: Proper error handling
export async function getUserById(id: number) {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      return { error: "USER_NOT_FOUND" as const };
    }

    return { user };
  } catch (error) {
    console.error("Error fetching user:", error);
    return { error: "DATABASE_ERROR" as const };
  }
}

// ❌ Bad: Throwing errors without handling
export async function getUserById(id: number) {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}
```

#### 3. Async/Await

```typescript
// ✅ Good: Consistent async/await
export async function processUserData(userId: number) {
  const user = await getUserById(userId);
  if (user.error) return user;

  const profile = await getUserProfile(userId);
  if (profile.error) return profile;

  return { user: user.user, profile: profile.profile };
}

// ❌ Bad: Mixing promises and async/await
export async function processUserData(userId: number) {
  return getUserById(userId).then((user) => {
    if (user.error) return user;

    return getUserProfile(userId).then((profile) => {
      return { user, profile };
    });
  });
}
```

### API Route Guidelines

#### 1. Route Structure

```typescript
// ✅ Good: Consistent route structure
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { z } from "@hono/zod-openapi";

const createUserRoute = createRoute({
  method: "post",
  path: "/users",
  summary: "Create new user",
  description: "Create a new user account with email and password",
  request: {
    body: {
      content: {
        "application/json": {
          schema: UserCreateSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: z.object({ user: UserSchema }),
        },
      },
      description: "User created successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "Invalid input data",
    },
  },
  tags: ["User Management"],
});

app.openapi(createUserRoute, async (c) => {
  const body = c.req.valid("json");

  const result = await UserService.createUser(body);

  if (result.error) {
    return c.json({ error: result.error }, 400);
  }

  return c.json({ user: result.user }, 201);
});
```

#### 2. Input Validation

```typescript
// ✅ Good: Zod schema validation
const UserCreateSchema = z
  .object({
    email: z.string().email().min(1).max(255),
    password: z.string().min(8).max(128),
    name: z.string().min(1).max(100).optional(),
  })
  .openapi("UserCreateInput");

// ❌ Bad: Manual validation
function validateUserInput(input: any) {
  if (!input.email || typeof input.email !== "string") {
    throw new Error("Invalid email");
  }
  // More manual validation...
}
```

### Database Guidelines

#### 1. Prisma Queries

```typescript
// ✅ Good: Efficient queries with proper includes
export async function getHomeWithDevices(homeId: number) {
  return prisma.home.findUnique({
    where: { id: homeId },
    include: {
      devices: {
        where: { deletedAt: null },
        select: {
          id: true,
          deviceName: true,
          deviceType: true,
          status: true,
          lastSeenAt: true,
        },
      },
      members: {
        select: {
          user: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
          role: true,
        },
      },
    },
  });
}

// ❌ Bad: N+1 queries
export async function getHomeWithDevices(homeId: number) {
  const home = await prisma.home.findUnique({
    where: { id: homeId },
  });

  const devices = await prisma.device.findMany({
    where: { homeId },
  });

  const members = await prisma.homeMember.findMany({
    where: { homeId },
  });

  return { home, devices, members };
}
```

#### 2. Transactions

```typescript
// ✅ Good: Using transactions for related operations
export async function transferDeviceToRoom(
  deviceId: number,
  newRoomId: number,
) {
  return prisma.$transaction(async (tx) => {
    // Verify device exists
    const device = await tx.device.findUnique({
      where: { id: deviceId },
    });

    if (!device) {
      throw new Error("Device not found");
    }

    // Verify room exists and belongs to same home
    const room = await tx.room.findUnique({
      where: { id: newRoomId },
    });

    if (!room || room.homeId !== device.homeId) {
      throw new Error("Invalid room");
    }

    // Update device
    return tx.device.update({
      where: { id: deviceId },
      data: { roomId: newRoomId },
    });
  });
}
```

## Testing Guidelines

### 1. Unit Tests

```typescript
// tests/services/user.service.test.ts
import { describe, it, expect, beforeEach, afterEach } from "bun:test";
import { UserService } from "../../src/services/user.service";
import { prisma } from "../../src/lib/prisma";

describe("UserService", () => {
  beforeEach(async () => {
    // Setup test data
    await prisma.user.deleteMany();
  });

  afterEach(async () => {
    // Cleanup
    await prisma.user.deleteMany();
  });

  it("should create user with valid input", async () => {
    const input = {
      email: "test@example.com",
      password: "password123",
      name: "Test User",
    };

    const result = await UserService.createUser(input);

    expect(result.error).toBeUndefined();
    expect(result.user).toBeDefined();
    expect(result.user?.email).toBe(input.email);
  });

  it("should return error for duplicate email", async () => {
    const input = {
      email: "test@example.com",
      password: "password123",
    };

    // Create first user
    await UserService.createUser(input);

    // Try to create duplicate
    const result = await UserService.createUser(input);

    expect(result.error).toBe("EMAIL_ALREADY_EXISTS");
    expect(result.user).toBeUndefined();
  });
});
```

### 2. Integration Tests

```typescript
// tests/routes/auth.test.ts
import { describe, it, expect, beforeEach } from "bun:test";
import { app } from "../../src/app";

describe("Auth Routes", () => {
  beforeEach(async () => {
    // Setup test database
    await prisma.user.deleteMany();
  });

  it("should register new user", async () => {
    const response = await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
        name: "Test User",
      }),
    });

    expect(response.status).toBe(201);

    const data = await response.json();
    expect(data.user).toBeDefined();
    expect(data.token).toBeDefined();
  });

  it("should login with valid credentials", async () => {
    // First register a user
    await app.request("/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    // Then login
    const response = await app.request("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: "test@example.com",
        password: "password123",
      }),
    });

    expect(response.status).toBe(200);

    const data = await response.json();
    expect(data.token).toBeDefined();
  });
});
```

### 3. Running Tests

```bash
# Run all tests
bun test

# Run specific test file
bun test tests/services/user.service.test.ts

# Run tests with coverage
bun test --coverage

# Run tests in watch mode
bun test --watch
```

## Code Quality Tools

### 1. Prettier Configuration

```json
// .prettierrc
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": false,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

### 2. ESLint Configuration

```json
// .eslintrc.json
{
  "extends": ["@typescript-eslint/recommended", "prettier"],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "@typescript-eslint/explicit-function-return-type": "off",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

### 3. Pre-commit Hooks

```json
// package.json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{ts,js}": ["prettier --write", "eslint --fix", "git add"]
  }
}
```

## Debugging

### 1. VS Code Debug Configuration

```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "name": "Debug Backend",
      "type": "node",
      "request": "launch",
      "program": "${workspaceFolder}/src/index.ts",
      "runtimeExecutable": "bun",
      "runtimeArgs": ["--inspect"],
      "env": {
        "NODE_ENV": "development"
      },
      "console": "integratedTerminal",
      "restart": true,
      "protocol": "inspector"
    }
  ]
}
```

### 2. Logging

```typescript
// src/lib/logger.ts
export class Logger {
  static info(message: string, meta?: any) {
    console.log(`[INFO] ${new Date().toISOString()} - ${message}`, meta || "");
  }

  static error(message: string, error?: Error) {
    console.error(
      `[ERROR] ${new Date().toISOString()} - ${message}`,
      error || "",
    );
  }

  static debug(message: string, meta?: any) {
    if (process.env.LOG_LEVEL === "debug") {
      console.log(
        `[DEBUG] ${new Date().toISOString()} - ${message}`,
        meta || "",
      );
    }
  }
}

// Usage
Logger.info("User created", { userId: 123 });
Logger.error("Database connection failed", error);
Logger.debug("Processing telemetry data", { deviceId: 1 });
```

## Performance Guidelines

### 1. Database Optimization

```typescript
// ✅ Good: Use indexes and efficient queries
export async function getRecentTelemetry(deviceId: number, limit = 100) {
  return prisma.sensorData.findMany({
    where: { deviceId },
    orderBy: { timestamp: "desc" },
    take: limit,
    select: {
      id: true,
      timestamp: true,
      powerW: true,
      gasPpm: true,
      current: true,
    },
  });
}

// ❌ Bad: Fetching unnecessary data
export async function getRecentTelemetry(deviceId: number) {
  const allData = await prisma.sensorData.findMany({
    where: { deviceId },
    orderBy: { timestamp: "desc" },
  });

  return allData.slice(0, 100);
}
```

### 2. Caching

```typescript
// Simple in-memory cache
class Cache {
  private static cache = new Map<string, { data: any; expires: number }>();

  static set(key: string, data: any, ttlSeconds = 300) {
    this.cache.set(key, {
      data,
      expires: Date.now() + ttlSeconds * 1000,
    });
  }

  static get(key: string) {
    const item = this.cache.get(key);
    if (!item || item.expires < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    return item.data;
  }
}

// Usage in service
export async function getDeviceStats(deviceId: number) {
  const cacheKey = `device_stats_${deviceId}`;
  const cached = Cache.get(cacheKey);

  if (cached) {
    return cached;
  }

  const stats = await calculateDeviceStats(deviceId);
  Cache.set(cacheKey, stats, 300); // 5 minutes

  return stats;
}
```

## Git Workflow

### Commit Message Convention

```bash
# Format: type(scope): description

# Types:
feat: new feature
fix: bug fix
docs: documentation changes
style: formatting, missing semicolons, etc.
refactor: code refactoring
test: adding tests
chore: maintenance tasks

# Examples:
feat(auth): add JWT token refresh endpoint
fix(telemetry): handle missing sensor data gracefully
docs(api): update authentication documentation
refactor(database): optimize user queries
test(auth): add login integration tests
chore(deps): update dependencies
```

### Branch Naming

```bash
# Feature branches
feature/user-authentication
feature/device-management
feature/ai-predictions

# Bug fix branches
fix/login-validation-error
fix/telemetry-data-parsing

# Documentation branches
docs/api-reference
docs/deployment-guide

# Maintenance branches
chore/dependency-updates
chore/code-cleanup
```

## Deployment

### Development Deployment

```bash
# Start development environment
docker-compose up -d

# Run migrations
bun run prisma:migrate dev

# Start development server
bun run dev:ui  # Includes Tailwind watcher
```

### Production Build

```bash
# Build for production
bun run build

# Start production server
bun run start
```

## Contributing Guidelines

### 1. Before Starting

- Check existing issues and PRs
- Create an issue for new features
- Discuss major changes with maintainers

### 2. Development Process

1. Fork the repository
2. Create a feature branch
3. Make changes following coding standards
4. Add tests for new functionality
5. Update documentation
6. Submit a pull request

### 3. Pull Request Guidelines

- Use descriptive titles and descriptions
- Reference related issues
- Include screenshots for UI changes
- Ensure all tests pass
- Update documentation if needed

### 4. Code Review Process

- All PRs require review from maintainers
- Address feedback promptly
- Keep PRs focused and reasonably sized
- Squash commits before merging

---

This development guide provides comprehensive guidelines for contributing to the Smart Home Backend project. Follow these standards to maintain code quality and consistency across the codebase.
