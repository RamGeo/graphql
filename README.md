# GraphQL Profile Page

A modern, interactive profile page that displays your school information using GraphQL queries. This project demonstrates GraphQL querying, JWT authentication, and SVG-based data visualization.

## Features

- **Login Page**: Secure authentication with JWT tokens supporting both username and email login
- **Profile Display**: Shows user information including:
  - User ID and Login
  - Total XP
  - Audit Ratio
- **Interactive Statistics**: SVG-based graphs including:
  - XP Over Time (Line Chart)
  - XP by Project (Bar Chart)
  - Pass/Fail Ratio (Pie Chart)
  - Audit Ratio (Pie Chart)
- **Modern UI**: Responsive design with beautiful gradients and animations
- **GraphQL Queries**: Demonstrates normal, nested, and argument-based queries

## Setup Instructions

### 1. Configure Your GraphQL Endpoint

**Important:** This project is generic and works with any GraphQL API endpoint. You need to configure it with your own API endpoints.

1. **Copy the example configuration:**
   ```bash
   cp js/config.example.js js/config.js
   ```

2. **Edit `js/config.js`** and replace the placeholder values with your actual GraphQL API endpoints:

   ```javascript
   const CONFIG = {
       // Replace with your GraphQL API domain
       DOMAIN: 'https://your-api-domain.com',
       
       // Update these with your actual endpoints
       GRAPHQL_ENDPOINT_DIRECT: 'https://your-api-domain.com/api/graphql-engine/v1/graphql',
       SIGNIN_ENDPOINT_DIRECT: 'https://your-api-domain.com/api/auth/signin',
       
       // Set to false if your API supports CORS directly
       USE_PROXY: true
   };
   ```

3. **CORS Configuration:**
   - If your API supports CORS: Set `USE_PROXY: false` and use the `*_DIRECT` endpoints
   - If your API doesn't support CORS: Keep `USE_PROXY: true` (uses a CORS proxy)

**Note:** The `js/config.js` file is gitignored, so your personal configuration won't be committed to the repository.

### 2. Local Development

1. Clone or download this repository
2. Open `index.html` in a web browser
3. For better development experience, use a local server:

```bash
# Using Python 3
python -m http.server 8000

# Using Node.js (with http-server)
npx http-server

# Using PHP
php -S localhost:8000
```

Then navigate to `http://localhost:8000`

### 3. Hosting

This project can be hosted on any static hosting service:

#### GitHub Pages
1. Push your code to a GitHub repository
2. Go to Settings > Pages
3. Select your branch and folder
4. Your site will be available at `https://yourusername.github.io/repository-name`

#### Netlify
1. Drag and drop the project folder to [Netlify](https://app.netlify.com/drop)
2. Or connect your GitHub repository for automatic deployments

#### Vercel
1. Install Vercel CLI: `npm i -g vercel`
2. Run `vercel` in the project directory

## DevOps Setup

This project includes a complete DevOps setup with Docker, CI/CD, and deployment automation.

### Prerequisites

- Docker and Docker Compose installed
- Git for version control

### Quick Start with Docker

```bash
# Build and start the application
make up

# Or using docker-compose directly
docker-compose up -d

# View logs
make logs

# Stop the application
make down
```

The application will be available at `http://localhost:8080`

### DevOps Files Overview

| File | Purpose |
|------|---------|
| `Dockerfile` | Defines how to build the Docker image |
| `docker-compose.yml` | Development environment configuration |
| `docker-compose.prod.yml` | Production environment configuration |
| `nginx.conf` | Nginx web server configuration |
| `.dockerignore` | Files to exclude from Docker builds |
| `.env.example` | Environment variables template |
| `deploy.sh` | Automated deployment script |
| `healthcheck.sh` | Health check script for monitoring |
| `Makefile` | Common DevOps commands |
| `.github/workflows/ci-cd.yml` | CI/CD pipeline configuration |

### Common Commands

Using Makefile (recommended):
```bash
make help          # Show all available commands
make build         # Build Docker image
make up            # Start application
make down          # Stop application
make logs          # View logs
make rebuild       # Rebuild and restart
make test          # Test if application is running
make clean         # Remove containers and images
```

Using Docker Compose:
```bash
# Development
docker-compose up -d              # Start in background
docker-compose down               # Stop
docker-compose logs -f            # View logs

# Production
docker-compose -f docker-compose.prod.yml up -d
docker-compose -f docker-compose.prod.yml down
```

### Deployment

#### Automated Deployment

```bash
# Deploy to production
./deploy.sh production

# Deploy to development
./deploy.sh development
```

The deployment script will:
1. Check prerequisites (Docker, docker-compose)
2. Stop existing containers
3. Build fresh Docker image
4. Start containers
5. Perform health checks
6. Show status and logs

#### Manual Deployment

```bash
# 1. Build the image
docker build -t graphql-profile .

# 2. Run the container
docker run -d -p 8080:80 --name graphql-profile-app graphql-profile

# 3. Verify it's running
curl http://localhost:8080
```

### Health Checks

Check application health:
```bash
./healthcheck.sh
```

The health check script verifies:
- Docker is running
- Container exists and is running
- HTTP endpoint responds
- Response time is acceptable
- No critical errors in logs

Exit code `0` = healthy, `1` = unhealthy (useful for automation)

### Environment Configuration

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` with your actual values (this file is gitignored)

3. Environment variables are used by docker-compose for configuration

### CI/CD Pipeline

The project includes a GitHub Actions/Gitea Actions workflow (`.github/workflows/ci-cd.yml`) that:
- Builds Docker image on every push
- Tests the container
- Performs security scanning

**Note:** For Gitea, you'll need to set up a runner. The workflow will wait until a runner is available.

### Production Deployment

For production, use the production docker-compose file:

```bash
docker-compose -f docker-compose.prod.yml up -d
```

Production configuration includes:
- Resource limits (CPU, memory)
- Always restart policy
- Health checks
- Log rotation
- Standard HTTP port (80)

### Monitoring

- **Health Checks**: Run `./healthcheck.sh` regularly (e.g., via cron)
- **Logs**: Use `docker-compose logs -f` to monitor logs
- **Container Status**: Use `docker ps` or `make status`

### Troubleshooting DevOps Issues

#### Container won't start
```bash
# Check logs
docker-compose logs

# Check if port is already in use
netstat -tulpn | grep 8080

# Rebuild from scratch
make clean
make build
make up
```

#### Health check fails
```bash
# Run health check manually
./healthcheck.sh

# Check container logs
docker logs graphql-profile-app

# Verify nginx is running inside container
docker exec graphql-profile-app ps aux
```

#### Image build fails
- Ensure all files are present (Dockerfile, nginx.conf)
- Check `.dockerignore` isn't excluding needed files
- Verify Docker has enough disk space

## Project Structure

```
graphql/
├── index.html              # Login page
├── profile.html            # Profile page
├── css/
│   └── styles.css          # All styling
├── js/
│   ├── config.js           # Configuration (domain endpoints) - NOT in git
│   ├── config.example.js   # Example configuration template
│   ├── auth.js             # Authentication utilities
│   ├── login.js            # Login page logic
│   ├── graphql.js          # GraphQL query functions
│   ├── graphs.js           # SVG graph rendering
│   └── profile.js          # Profile page logic
├── .github/
│   └── workflows/
│       └── ci-cd.yml       # CI/CD pipeline configuration
├── Dockerfile              # Docker image definition
├── docker-compose.yml      # Development Docker Compose config
├── docker-compose.prod.yml # Production Docker Compose config
├── nginx.conf              # Nginx web server configuration
├── .dockerignore           # Files to exclude from Docker builds
├── .env.example            # Environment variables template
├── .env                    # Environment variables (gitignored)
├── deploy.sh               # Automated deployment script
├── healthcheck.sh          # Health check script
├── Makefile                # Common DevOps commands
├── .gitignore              # Git ignore file
└── README.md               # This file
```

## GraphQL Queries Used

The project demonstrates three types of GraphQL queries:

### 1. Normal Query
```graphql
query {
  user {
    id
    login
  }
}
```

### 2. Query with Arguments
```graphql
query GetTotalXP($userId: Int!) {
  transaction(
    where: {
      userId: { _eq: $userId },
      type: { _eq: "xp" }
    }
  ) {
    amount
  }
}
```

### 3. Nested Query
```graphql
query {
  result {
    id
    user {
      id
      login
    }
  }
}
```

## Authentication Flow

1. User enters username/email and password
2. Credentials are base64 encoded and sent via Basic Authentication
3. Server returns JWT token
4. JWT is stored in localStorage
5. All GraphQL requests include JWT as Bearer token
6. User ID is extracted from JWT payload

## SVG Graphs

All graphs are rendered using pure SVG (no external charting libraries):

- **Line Chart**: XP progression over time with area fill
- **Bar Chart**: XP distribution across projects
- **Pie Charts**: Visual representation of ratios (Pass/Fail, Audit)

Graphs are interactive and responsive, adapting to container size.

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Any modern browser with ES6+ support

## Security Notes

- JWT tokens are stored in localStorage (consider httpOnly cookies for production)
- All API requests use HTTPS
- Credentials are base64 encoded (not encrypted - always use HTTPS)

## Customization

### Adding New Graphs

1. Add a new function in `graphs.js` (e.g., `renderNewGraph`)
2. Add a query function in `graphql.js` to fetch the data
3. Add a button in `profile.html` with `data-graph="new-graph"`
4. Add a case in `profile.js` `renderGraph()` function

### Styling

Edit `styles.css` to customize:
- Colors (CSS variables in `:root`)
- Layout and spacing
- Animations
- Responsive breakpoints

## Troubleshooting

### CORS Errors
If you encounter CORS errors, ensure:
- The domain in `config.js` is correct
- The server allows requests from your origin
- You're using HTTPS for production

### Authentication Fails
- Verify the domain is correct
- Check that credentials are valid
- Ensure the signin endpoint is accessible

### Graphs Not Displaying
- Check browser console for errors
- Verify GraphQL queries return data
- Ensure SVG rendering is supported

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

