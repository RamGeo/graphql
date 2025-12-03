// Configuration file for GraphQL endpoint with CORS proxy support
// Copy this file to config.js and update with your own endpoints

const CONFIG = {
    // Base domain - REPLACE WITH YOUR GRAPHQL API DOMAIN
    // Example: 'https://your-domain.com' or 'https://api.example.com'
    DOMAIN: 'https://your-domain.com',
    
    // CORS proxy URL (optional - only needed if your API doesn't allow CORS)
    // Leave as is if you don't need a proxy, or use a CORS proxy service
    CORS_PROXY: 'https://corsproxy.io',
    
    // Get GraphQL endpoint with proxy
    get GRAPHQL_ENDPOINT() {
        return `${this.CORS_PROXY}/?${this.DOMAIN}/api/graphql-engine/v1/graphql`;
    },
    
    // Get Signin endpoint with proxy
    get SIGNIN_ENDPOINT() {
        return `${this.CORS_PROXY}/?${this.DOMAIN}/api/auth/signin`;
    },
    
    // Direct endpoints (fallback - used when USE_PROXY is false)
    // REPLACE WITH YOUR ACTUAL ENDPOINTS
    GRAPHQL_ENDPOINT_DIRECT: 'https://your-domain.com/api/graphql-engine/v1/graphql',
    SIGNIN_ENDPOINT_DIRECT: 'https://your-domain.com/api/auth/signin',
    
    // Storage keys (for localStorage - you can customize these)
    TOKEN_KEY: 'graphql_profile_token',
    USER_ID_KEY: 'graphql_profile_user_id',
    
    // Use proxy (set to false if your API supports CORS directly)
    USE_PROXY: true
};

