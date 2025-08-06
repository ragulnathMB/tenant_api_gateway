# Tenant API Gateway

## Overview

Tenant API Gateway is a Node.js Express-based service that manages multi-tenant authentication, tenant lifecycle, API registry, and dynamic proxy forwarding to downstream services backed by MS SQL databases.

## Key Features

- **Authentication**: Admin (`/api/auth/admin`) and Tenant Admin (`/api/tenantAdmin/login`) login with JWT.
- **Tenant Management**: Create, read, update (info, license counts, expiry), and delete tenants.
- **Tenant Statistics**: Retrieve usage and license stats per tenant.
- **User Validation**: Validate end-user credentials within a tenant context.
- **API Registry**: Register, list, update, delete tenant-specific APIs and test them.
- **Proxy Forwarding**: Dynamic request proxying based on headers (`x-api-name`, `x-tenant-id`).
- **Health Check**: `/health` returns service status and timestamp.
- **Logging & Errors**: Centralized error handler and Winston-based logging.

## Tech Stack

- Node.js 18+ with Express 5.x
- MS SQL Server via `mssql`
- Input validation: `express-validator`
- Logging: `winston`
- HTTP client: `axios`
- Configuration: `dotenv`

## Installation

```bash
git clone <REPO_URL>
cd tenant_api_gateway
npm install
```

## Environment Variables

Copy `.env.example` to `.env` and set:

```dotenv
NODE_ENV=development
PORT=3001

# User DB (authentication)
USER_DB_USER=
USER_DB_PASSWORD=
USER_DB_SERVER=
USER_DB_NAME=

# Tenant DB (tenant data)
TENANT_DB_USER=
TENANT_DB_PASSWORD=
TENANT_DB_SERVER=
TENANT_DB_NAME=

# Fallback DB settings (if above not set)
DB_USER=
DB_PASSWORD=
DB_SERVER=
DB_DATABASE=
DB_ENCRYPT=true
DB_TRUST_SERVER_CERTIFICATE=true
```

## Running the Service

- Development (with hot reload):
  ```bash
  npm run dev
  ```
- Production:
  ```bash
  npm start
  ```

## API Reference

All routes under `/api` require `Authorization: Bearer <token>` except proxy.

### Authentication

- **POST** `/api/auth/admin`
  - Body: `{ username, password }`
  - Returns: `{ token }`

- **POST** `/api/tenantAdmin/login`
  - Body: `{ tenantId, username, password }`
  - Returns: `{ token }`

### Tenants

- **POST** `/api/tenant`
  - Create a new tenant.

- **GET** `/api/tenant/:tenantId`
  - Get tenant details.

- **GET** `/api/tenants`
  - List all tenants.

- **PUT** `/api/tenant/:tenantId/info`
  - Update tenant info.

- **PUT** `/api/tenant/:tenantId/license-counts`
  - Update license counts.

- **PUT** `/api/tenant/:tenantId/license-expiry`
  - Update license expiry date.

- **DELETE** `/api/tenant/:tenantId`
  - Delete a tenant.

- **DELETE** `/api/tenants`
  - Bulk delete tenants (pass array of IDs).

- **POST** `/api/login/userValidation`
  - Validate end-user credentials.

- **GET** `/api/tenant/:tenantId/stats`
  - Retrieve tenant statistics.

### API Registry

- **GET** `/api/tenant/:tenantId/apis`
  - List registered APIs.

- **POST** `/api/tenant/:tenantId/apis`
  - Body: `{ apiName, url, method }`

- **PATCH** `/api/tenant/:tenantId/apis/:apiName`
  - Update API details.

- **DELETE** `/api/tenant/:tenantId/apis/:apiName`
  - Remove API.

- **POST** `/api/check-tenant-api`
  - Test a registered API.

### Proxy

- **ALL** `/*`
  - Handled by proxy controller. Requires headers `x-api-name`, `x-tenant-id`, etc.

### Health Check

- **GET** `/health`
  - Returns `{ status: 'OK', service: 'Tenant Portal', timestamp }`

## Project Structure

```
src/
  app.js           # Express app setup
  server.js        # Server bootstrap
  config/
    database.js    # MSSQL connection pools
  routes/
    auth.routes.js
    tenant.routes.js
    api.routes.js
    proxy.routes.js
  controllers/
    auth.controller.js
    tenant.controller.js
    api.controller.js
    proxy.controller.js
  middleware/
    validation.js
    error_handler.js
  services/        # Business logic and DB ops
  utils/
    logger.js      # Winston logger
  logs/            # Application logs
```

## Logging

Logs are managed via Winston and stored in `logs/`.

## Testing

```bash
npm test
```

## Linting

```bash
npm run lint
```

## Contributing

Contributions are welcome! Please open issues or PRs.

## License

MIT License

