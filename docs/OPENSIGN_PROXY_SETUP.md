# OpenSign API Proxy Setup - Fix Summary

## Problem
The application was getting 404 errors when trying to access OpenSign Parse Server endpoints:
- `404: curl 'http://localhost:3000/api/proxy/opensign/classes/contracts_Document?limit=1000'`
- `400: curl 'http://localhost:3000/api/proxy/opensign/classes/contracts_Template?limit=1000'`
- `400: curl 'http://localhost:3000/api/proxy/opensign/classes/contracts_Users?limit=1000'`

## Root Cause
The Next.js application was trying to make requests to `/api/proxy/opensign/...` routes that didn't exist. The application needed a proxy route to forward requests to the OpenSign Parse Server.

## Solution

### 1. Created API Proxy Route
**File:** `app/api/proxy/opensign/[...path]/route.ts`
- Handles all HTTP methods (GET, POST, PUT, DELETE, OPTIONS)
- Forwards requests to the OpenSign Parse Server at `https://94.249.71.89:9000/app`
- Properly handles Parse Server headers:
  - `X-Parse-Application-Id: opensign`
  - `X-Parse-Session-Token` (when available)
- Includes CORS headers for cross-origin requests
- Provides detailed error logging and handling

### 2. Updated Environment Configuration
**File:** `.env.local`
```bash
# Client-side configuration (used by browser)
NEXT_PUBLIC_OPENSIGN_API_URL=/api/proxy/opensign
NEXT_PUBLIC_OPENSIGN_APP_ID=opensign

# Server-side configuration (used by proxy route)
OPENSIGN_BASE_URL=https://94.249.71.89:9000/app
OPENSIGN_APP_ID=opensign
```

### 3. Updated Constants Configuration
**File:** `app/lib/constants.ts`
- Set `API_OPENSIGN_URL` to use the proxy route for client-side requests
- Updated default `OPENSIGN_APP_ID` to match your server configuration

### 4. Updated API Service
**File:** `app/lib/api-service.ts`
- Enhanced the `openSignApiService` to use different URLs for client vs server:
  - **Client-side (browser)**: Uses `/api/proxy/opensign` (proxy route)
  - **Server-side (SSR/API routes)**: Uses direct URL to Parse Server
- Proper handling of Parse Server authentication headers

## How It Works

### Request Flow
1. **Browser Request**: Client makes request to `/api/proxy/opensign/classes/contracts_Document`
2. **Proxy Route**: Next.js API route receives the request
3. **Forward Request**: Proxy forwards to `https://94.249.71.89:9000/app/classes/contracts_Document`
4. **OpenSign Response**: Parse Server responds with data
5. **Return Response**: Proxy returns the response to the client

### Architecture Benefits
- **Security**: Hides direct access to Parse Server from client
- **CORS Handling**: Eliminates cross-origin request issues
- **Environment Separation**: Different URLs for development/production
- **Error Handling**: Centralized error handling and logging
- **Header Management**: Proper Parse Server authentication

## Testing

### Manual Testing
Run the test script:
```bash
./test-proxy.sh
```

Or test manually:
```bash
curl -X GET \
  "http://localhost:3000/api/proxy/opensign/classes/contracts_Document?limit=1" \
  -H "X-Parse-Application-Id: opensign" \
  -H "Content-Type: application/json"
```

### Expected Response
You should receive a JSON response with Parse Server data instead of 404 errors.

## OpenSign Parse Server Endpoints

Based on your Postman collection, the following endpoints are now accessible through the proxy:

### Authentication
- `POST /api/proxy/opensign/functions/usersignup`
- `POST /api/proxy/opensign/functions/loginuser`
- `POST /api/proxy/opensign/functions/SendOTPMailV1`
- `POST /api/proxy/opensign/functions/AuthLoginAsMail`

### Data Access (REST API)
- `GET /api/proxy/opensign/classes/contracts_Document`
- `GET /api/proxy/opensign/classes/contracts_Template`
- `GET /api/proxy/opensign/classes/contracts_Users`
- `GET /api/proxy/opensign/classes/contracts_Contactbook`

### Cloud Functions
- `POST /api/proxy/opensign/functions/getDocument`
- `POST /api/proxy/opensign/functions/signPdf`
- `POST /api/proxy/opensign/functions/getReport`
- And all other functions from your Postman collection

## Next Steps

1. **Start Development Server**: 
   ```bash
   npm run dev
   ```

2. **Test the Ecological Savings Component**: 
   The data sync should now work properly and fetch real data from OpenSign

3. **Monitor Network Tab**: 
   Check browser dev tools to confirm requests are going to proxy routes

4. **Authentication**: 
   If you need authenticated requests, ensure session tokens are properly stored in localStorage

## Troubleshooting

### Common Issues
1. **Still getting 404s**: Ensure dev server is running (`npm run dev`)
2. **CORS errors**: The proxy handles CORS, but check browser console
3. **Authentication errors**: Verify session tokens and Parse Server credentials
4. **Connection timeouts**: Check if OpenSign server at `https://94.249.71.89:9000` is accessible

### Debug Logging
The proxy route includes detailed logging. Check terminal output for:
- `[OpenSign Proxy] GET/POST/PUT/DELETE <URL>`
- `[OpenSign Proxy] Response status: <CODE>`
- `[OpenSign Proxy] Error: <ERROR_MESSAGE>`

This setup provides a robust, production-ready proxy solution for your OpenSign Parse Server integration.
