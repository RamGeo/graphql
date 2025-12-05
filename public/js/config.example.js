// Configuration file for GraphQL endpoint with CORS proxy support
// Copy this file to config.js and update with your own endpoints

const CONFIG = {
    // Base domain (e.g., 'https://your-domain.com')
    DOMAIN: 'https://your-domain.com',
    
    // CORS proxy URL (only needed if your API doesn't allow CORS)
    CORS_PROXY: 'https://corsproxy.io',
    
    // GraphQL endpoint with proxy
    get GRAPHQL_ENDPOINT() {
        return `${this.CORS_PROXY}/?${this.DOMAIN}/api/graphql-engine/v1/graphql`;
    },
    
    // Signin endpoint with proxy
    get SIGNIN_ENDPOINT() {
        return `${this.CORS_PROXY}/?${this.DOMAIN}/api/auth/signin`;
    },
    
    // Direct endpoints (used when USE_PROXY is false)
    GRAPHQL_ENDPOINT_DIRECT: 'https://your-domain.com/api/graphql-engine/v1/graphql',
    SIGNIN_ENDPOINT_DIRECT: 'https://your-domain.com/api/auth/signin',
    
    // localStorage keys
    TOKEN_KEY: 'graphql_profile_token',
    USER_ID_KEY: 'graphql_profile_user_id',
    
    // Use proxy (set to false if your API supports CORS directly)
    USE_PROXY: true
};

