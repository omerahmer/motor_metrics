# Technology Stack Summary

## Backend

### **Go (Golang)**
- **Purpose**: Main backend API server
- **Usage**: 
  - RESTful API endpoints (`/health`, `/ready`, `/api/search`)
  - HTTP server handling vehicle search requests
  - Concurrent processing with goroutines for parallel build data fetching
  - Rate limiting middleware using `golang.org/x/time`
- **Location**: `cmd/api/main.go`, all `internal/` packages

### **PostgreSQL**
- **Purpose**: Persistent data storage
- **Usage**:
  - Stores vehicle listings with JSONB columns for flexible schema
  - Price history tracking per VIN
  - Build data and valuation information
  - Connection pooling (max 25 connections, 5 idle)
- **Location**: `internal/repository/postgres.go`, `migrations/001_initial_schema.sql`

### **Kafka**
- **Purpose**: Event streaming for price updates
- **Usage**:
  - Consumer reads enriched listings from Kafka topics
  - Updates price history and recalculates valuations
  - Decouples data processing from API requests
- **Library**: `github.com/segmentio/kafka-go`
- **Location**: `internal/kafka/consumer.go`, `cmd/producer/main.go`

### **MarketCheck API**
- **Purpose**: External data source for vehicle listings
- **Usage**:
  - Fetches active vehicle listings by make/model/zip/radius
  - Retrieves detailed build specifications by VIN
  - Rate-limited to prevent API quota exhaustion
- **Location**: `internal/marketcheck/client.go`

## Frontend

### **Next.js 16**
- **Purpose**: React framework for server-side rendering and routing
- **Usage**:
  - App Router architecture (`app/` directory)
  - Client-side components with React hooks
  - API route proxying to backend
  - Production build optimization
- **Location**: `web/app/` directory

### **React 19**
- **Purpose**: UI component library
- **Usage**:
  - Component-based architecture (SearchFilters, CarCard, CarDetailModal)
  - State management with `useState` hooks
  - Event handling for user interactions
- **Location**: `web/app/components/`, `web/app/page.tsx`

### **TypeScript**
- **Purpose**: Type-safe JavaScript
- **Usage**:
  - Type definitions for API responses (Listing interface)
  - Component prop typing
  - Compile-time error checking
- **Location**: All `.tsx` files in `web/app/`

### **Tailwind CSS 4**
- **Purpose**: Utility-first CSS framework
- **Usage**:
  - Modern, responsive UI styling
  - Gradient backgrounds, shadows, borders
  - Responsive grid layouts
  - Dark mode support (via custom theme)
- **Location**: `web/app/globals.css`, all component files

### **Lucide React**
- **Purpose**: Icon library
- **Usage**:
  - UI icons (X for close button, etc.)
  - Consistent icon styling
- **Location**: `web/app/components/CarDetailModal.tsx`

## Infrastructure & DevOps

### **Docker**
- **Purpose**: Containerization
- **Usage**:
  - Multi-stage builds for optimized images
  - Separate images for API (Go binary) and Web (Next.js)
  - Health checks built into images
  - Platform-specific builds (`linux/amd64`)
- **Location**: `Dockerfile.api`, `Dockerfile.web`

### **Kubernetes (EKS)**
- **Purpose**: Container orchestration on AWS
- **Usage**:
  - Deployments for API and Web services
  - StatefulSet for PostgreSQL with persistent volumes
  - Services for internal networking
  - ConfigMaps for non-sensitive configuration
  - Secrets for API keys and passwords
  - Horizontal Pod Autoscaler (HPA) for auto-scaling
  - Ingress with AWS ALB for external access
- **Location**: `k8s/` directory

### **AWS ECR (Elastic Container Registry)**
- **Purpose**: Docker image storage
- **Usage**:
  - Stores built Docker images
  - Image versioning and tagging
  - Pulled by Kubernetes nodes
- **Location**: `deploy-images.sh`, `deploy.sh`

### **AWS EBS CSI Driver**
- **Purpose**: Dynamic volume provisioning
- **Usage**:
  - Creates persistent volumes for PostgreSQL
  - GP2/GP3 storage classes
  - Volume binding with `WaitForFirstConsumer`
- **Location**: `k8s/gp2-csi-storageclass.yaml`, `k8s/postgres-statefulset.yaml`

### **AWS ALB (Application Load Balancer)**
- **Purpose**: External traffic routing
- **Usage**:
  - Routes traffic to web and API services
  - SSL/TLS termination
  - Path-based routing (`/api` → API, `/` → Web)
- **Location**: `k8s/ingress.yaml`

## Supporting Libraries & Tools

### **golang.org/x/time**
- **Purpose**: Rate limiting
- **Usage**: Token bucket rate limiter (10 req/s, burst 20)

### **github.com/lib/pq**
- **Purpose**: PostgreSQL driver for Go
- **Usage**: Database connection and query execution

### **pnpm**
- **Purpose**: Fast, disk-efficient Node.js package manager
- **Usage**: Frontend dependency management

### **ESLint**
- **Purpose**: JavaScript/TypeScript linting
- **Usage**: Code quality and style enforcement

## Architecture Patterns

### **Repository Pattern**
- **Purpose**: Data access abstraction
- **Usage**: `PriceRepository` and `ListingRepository` interfaces separate business logic from database implementation

### **Caching Strategy**
- **Purpose**: Reduce API calls
- **Usage**: In-memory cache for build data with TTL (1 hour), reduces redundant MarketCheck API requests

### **Rate Limiting**
- **Purpose**: Protect external APIs
- **Usage**: IP-based rate limiting prevents overwhelming MarketCheck API

### **Partial Matching**
- **Purpose**: Flexible search
- **Usage**: Normalizes search terms (removes spaces/hyphens) for fuzzy matching (e.g., "f-150" matches "f150")

