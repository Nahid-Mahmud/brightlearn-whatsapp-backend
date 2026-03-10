# ST Comp Holdings - Job Task Backend

A robust backend API for managing specialists and service offerings with comprehensive authentication and media handling.

## 🚀 Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js v5.2.1
- **ORM**: Prisma v6.19.2 with PostgreSQL
- **Authentication**: JWT (jsonwebtoken) + bcryptjs for password hashing
- **File Upload**: Multer + Cloudinary for media storage
- **Testing**: Jest v30 + Supertest for API testing
- **Validation**: Zod v4.3.6 for schema validation
- **Development**: tsx for hot-reload development

## 🏗️ Architecture & Strategies

### Modular Structure

Feature-based module organization with separate modules for:

- Authentication (`auth`)
- Media management (`media`)
- Specialists (`specialists`)
- Service offerings (`serviceOffering`, `serviceOfferingsMasterList`)
- Platform fee configuration (`platformFee`)
- User management (`user`)

### Error Handling Strategy

Comprehensive error handling with custom error classes and global error handler:

- Prisma-specific error handlers (validation, known requests, unknown requests, panics)
- Zod validation errors
- API error standardization
- Custom `ApiError` and `AppError` classes

### Middleware Layer

- **Authentication**: `checkAuth` middleware for JWT verification
- **Request Validation**: `validateRequest` using Zod schemas
- **Global Error Handler**: Centralized error processing and response formatting
- **Not Found Handler**: 404 error handling

### Database Strategy

- **PostgreSQL** with Prisma ORM
- **UUID-based** primary keys for all models
- **Soft deletes** with `deleted_at` timestamps
- **Indexed fields** for optimized queries (slug, specialist_id, etc.)
- **Enum types** for user roles, status, verification status, media types
- **Relations**: Proper foreign key constraints with cascade deletes

### Testing Strategy

- **Jest** with separate test database configuration
- **Supertest** for API endpoint testing
- Test files for auth, platform fees, and service offerings
- Isolated test environment with `NODE_ENV=test`

### Key Features

- User authentication with role-based access (admin/user)
- Specialist profile management with media uploads
- Service offering management with master list
- Platform fee configuration
- Draft system for specialists
- Verification workflow
- Photo upload with Cloudinary integration

## ⚠️ Important Limitations

### Vercel Free Tier Limitation

**Photo Upload Failure (4.5 MB Body Size Limit)**

If photo uploads fail, it's likely due to **Vercel's free tier limitation**, not a backend issue:

- **Vercel Free Tier**: Request body size limited to **4.5 MB**
- **Impact**: Large images or multiple images may fail to upload
- **Solution Options**:
  1. Compress images before upload (recommended for free tier)
  2. Upgrade to Vercel Pro for 100 MB limit
  3. Upload multiple images separately
  4. Use image optimization/compression on the frontend

**Note**: The backend and Cloudinary configuration support much larger files. This is purely a Vercel infrastructure limitation.

## 📦 Installation

```bash
cd st_comp_holdings_job_task_backend
pnpm install

# Set up environment variables
cp .env.example .env
# Configure DATABASE_URL, JWT_SECRET, CLOUDINARY credentials

# Run migrations
pnpm prisma:migrate

# Start development server
pnpm dev
```

### Environment Variables

```env
DATABASE_URL="postgresql://user:password@localhost:5432/db_name"
JWT_SECRET="your-secret-key"
JWT_EXPIRES_IN="7d"
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
PORT=5000
```

## 🧪 Testing

```bash
# Backend tests
cd st_comp_holdings_job_task_backend
pnpm test

# Run specific test file
pnpm test -- auth.test.ts
```

## 📝 Available Scripts

### Backend

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build production version
- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build production version (lints + compiles)
- `pnpm start` - Start production server
- `pnpm test` - Run Jest tests
- `pnpm lint` - Run ESLint
- `pnpm format` - Format code with Prettier
- `pnpm format:check` - Check code formatting
- `pnpm prisma:studio` - Open Prisma Studio
- `pnpm prisma:migrate` - Run database migrations
- `pnpm prisma:generate` - Generate Prisma Client
- `pnpm prisma:db-push` - Push schema changes to database
- `pnpm prisma:db-reset` - Reset database
- Bcrypt password hashing
- Cookie-based session management
- CORS configuration
- Request validation with Zod
- Role-based access control

## 📊 Database Models

- **User**: Authentication and authorization
- **Specialists**: Service provider profiles with ratings and pricing
- **Media**: File attachments for specialists (images, videos, documents)
- **ServiceOffering**: Services offered by specialists
- **ServiceOfferingMasterList**: Master list of available services
- **PlatformFee**: Configurable platform fee structure

## 🔗 API Documentation

Backend server runs on port 5000 (configurable via env)
Frontend application runs on port 3000

---

**Developed for ST Comp Holdings Job Task**
Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Get current user

### Specialists

- `GET /api/specialists` - Get all specialists
- `GET /api/specialists/:id` - Get specialist by ID
- `POST /api/specialists` - Create specialist (admin only)
- `PUT /api/specialists/:id` - Update specialist
- `DELETE /api/specialists/:id` - Delete specialist

### Service Offerings

- `GET /api/service-offerings` - Get all service offerings
- `POST /api/service-offerings` - Create service offering
- `DELETE /api/service-offerings/:id` - Delete service offering

### Media

- `POST /api/media` - Upload media file
- `DELETE /api/media/:id` - Delete media file

### Platform Fee

- `GET /api/platform-fee` - Get platform fee configuration
- `PUT /api/platform-fee` - Update platform fee (admin only)

**Server runs on port 5000** (configurable via PORT environment variable)
# brightlearn-whatsapp-backend
