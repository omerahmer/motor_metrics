# motor_metrics

A Go application that fetches vehicle listings from MarketCheck API, enriches them with build information, tracks price history, and computes valuations. Features include caching, rate limiting, PostgreSQL persistence with repository pattern, and Kubernetes deployment support for EKS.

## 🚀 Quick Start

See [QUICKSTART.md](QUICKSTART.md) for the fastest way to deploy everything.

For detailed deployment instructions, see [DEPLOYMENT.md](DEPLOYMENT.md).

## Features

- 🚀 **Efficient API Usage**: In-memory caching reduces redundant API calls
- ⚡ **Parallel Processing**: Build information fetched in parallel for faster responses
- 🛡️ **Rate Limiting**: IP-based rate limiting (10 req/s, burst 20)
- 🐳 **Dockerized**: Multi-stage Docker builds for optimized images
- ☸️ **Kubernetes Ready**: Full K8s manifests for EKS deployment
- 📈 **Auto-scaling**: Horizontal Pod Autoscaling based on CPU/memory
- 🏥 **Health Checks**: Liveness and readiness probes for reliability

## Prerequisites

1. **Go 1.25.4 or later** - [Install Go](https://golang.org/doc/install)
2. **Kafka** - Running Kafka broker(s). You can use:
   - Local Kafka installation
   - Docker: `docker run -p 9092:9092 apache/kafka:latest`
   - Kafka cloud service

## Environment Variables

Set the following environment variables:

### Required
- `MARKETCHECK_API_KEY` - Your MarketCheck API key

### Optional (with defaults)
- `MARKETCHECK_BASE_URL` - MarketCheck API base URL (default: `https://marketcheck-prod.apigee.net/v1`)
- `KAFKA_BROKERS` - Comma-separated Kafka broker addresses (default: `localhost:9092`)
- `SEARCH_MAKE` - Vehicle make to search for (default: `ford`)
- `SEARCH_MODEL` - Vehicle model to search for (default: `f-150`)
- `SEARCH_ZIP` - ZIP code for search location (default: `92617`)
- `SEARCH_RADIUS` - Search radius in miles (default: `50`)
- `DATABASE_URL` - PostgreSQL connection string (or use individual DATABASE_* vars)
- `DATABASE_HOST` - PostgreSQL host (default: `localhost`)
- `DATABASE_PORT` - PostgreSQL port (default: `5432`)
- `DATABASE_NAME` - Database name (default: `motor_metrics`)
- `DATABASE_USER` - Database user (default: `postgres`)
- `DATABASE_PASSWORD` - Database password (required)
- `DATABASE_SSLMODE` - SSL mode (default: `disable`)

## Running the Application

### 1. Set Environment Variables

```bash
export MARKETCHECK_API_KEY="your-api-key-here"
export KAFKA_BROKERS="localhost:9092"
```

### 2. Ensure Kafka is Running

Make sure Kafka is running and accessible at the broker address you specified.

Create the topic if it doesn't exist:
```bash
# Using kafka-topics.sh (if you have Kafka installed locally)
kafka-topics.sh --create --topic listings-raw --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
```

Or using Docker:
```bash
docker exec -it <kafka-container> kafka-topics.sh --create --topic listings-raw --bootstrap-server localhost:9092 --partitions 1 --replication-factor 1
```

### 3. Build and Run

```bash
# Build the application
go build -o motor_metrics ./cmd/producer

# Run the application
./motor_metrics
```

Or run directly with `go run`:

```bash
go run ./cmd/producer/main.go
```

## How It Works

1. **Producer**: Fetches active listings from MarketCheck API every minute, enriches them with build information, and writes to Kafka topic `listings-raw`

2. **Consumer**: Reads from `listings-raw` topic, tracks price history in memory, computes valuations, and logs the results

3. **PostgreSQL Repository**: Persistent storage for listings and price history using repository pattern

4. **API Server**: HTTP server that exposes search endpoints for the web frontend

5. **Web Frontend**: Beautiful Next.js application for searching and viewing vehicle listings with valuation insights

## Web Frontend

A modern, beautiful web interface is available in the `/web` directory. See [web/README.md](web/README.md) for details.

### Quick Start (Web Frontend)

1. **Start the API server**:
   ```bash
   go run ./cmd/api/main.go
   ```

2. **Start the web frontend** (in a new terminal):
   ```bash
   cd web
   pnpm install
   pnpm dev
   ```

3. **Open your browser** to `http://localhost:3000`

The web interface provides:
- 🔍 Advanced search filters (make, model, ZIP, radius)
- 🚗 Rich car listings with images
- 💰 Valuation insights and "Great Value" badges
- 📱 Responsive design with dark mode support

## Architecture

- **Producer** (`internal/producer/`): Fetches and enriches listings
- **Consumer** (`internal/kafka/consumer.go`): Processes listings and computes valuations
- **MarketCheck Client** (`internal/marketcheck/`): API client for MarketCheck
- **Repository** (`internal/repository/`): PostgreSQL repository pattern implementation
- **Price Store** (`internal/store/`): In-memory storage (legacy, use repository pattern)
- **Kafka** (`internal/kafka/`): Kafka reader and writer implementations
- **Cache** (`internal/cache/`): In-memory cache for build information (1 hour TTL)
- **Rate Limiter** (`internal/ratelimit/`): IP-based rate limiting middleware
- **API Server** (`cmd/api/`): HTTP API server with caching and rate limiting
- **Web Frontend** (`web/`): Next.js frontend for searching and viewing listings

## Performance Optimizations

### Caching
- Build information cached for 1 hour to reduce API calls
- Automatic cache cleanup of expired entries
- Significant reduction in MarketCheck API requests

### Parallel Processing
- Build information fetched in parallel using goroutines
- WaitGroup synchronization for concurrent requests
- Faster response times for multiple listings

### Rate Limiting
- IP-based rate limiting: 10 requests per second
- Burst capacity: 20 requests
- Prevents API abuse and ensures fair usage

## Graceful Shutdown

The application handles SIGTERM and SIGINT signals for graceful shutdown. Press `Ctrl+C` to stop the application.

## Kubernetes Deployment (EKS)

### Quick Deploy

```bash
# Set your ECR repository and region
export ECR_REPO=123456789012.dkr.ecr.us-west-2.amazonaws.com
export AWS_REGION=us-west-2

# Run deployment script
./deploy.sh
```

### Manual Deployment

See [k8s/README.md](k8s/README.md) for detailed deployment instructions.

### Kubernetes Resources

- **Namespace**: `motor-metrics`
- **StatefulSet**: PostgreSQL database with persistent storage (20Gi)
- **Deployments**: API (3 replicas), Web (2 replicas)
- **Services**: ClusterIP services for API, Web, and PostgreSQL
- **Ingress**: ALB Ingress for AWS load balancing
- **HPA**: Auto-scaling based on CPU/memory (API: 3-10, Web: 2-5)
- **ConfigMap**: Environment configuration
- **Secrets**: API keys and database credentials
- **PVC**: Persistent volume for PostgreSQL data

### Health Checks

- API: `/health` (liveness), `/ready` (readiness)
- Web: `/` (liveness and readiness)

### Monitoring

```bash
# Check pod status
kubectl get pods -n motor-metrics

# View logs
kubectl logs -f deployment/motor-metrics-api -n motor-metrics
kubectl logs -f deployment/motor-metrics-web -n motor-metrics

# Check HPA status
kubectl get hpa -n motor-metrics
```

## Troubleshooting

- **"MARKETCHECK_API_KEY environment variable is required"**: Set the `MARKETCHECK_API_KEY` environment variable
- **Connection errors to Kafka**: Ensure Kafka is running and accessible at the specified broker address
- **Topic not found**: Create the `listings-raw` topic in Kafka before running
- **API errors**: Verify your MarketCheck API key is valid and has proper permissions
- **Rate limit exceeded**: The API has rate limiting (10 req/s). Wait a moment and retry
- **Cache not working**: Check that the cache TTL is appropriate for your use case
