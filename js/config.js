// Configuration file for GraphQL endpoint with CORS proxy support
const CONFIG = {
    // Base domain
    DOMAIN: 'https://platform.zone01.gr',
    
    // CORS proxy URL
    CORS_PROXY: 'https://corsproxy.io',
    
    // Get GraphQL endpoint with proxy
    get GRAPHQL_ENDPOINT() {
        return `${this.CORS_PROXY}/?${this.DOMAIN}/api/graphql-engine/v1/graphql`;
    },
    
    // Get Signin endpoint with proxy
    get SIGNIN_ENDPOINT() {
        return `${this.CORS_PROXY}/?${this.DOMAIN}/api/auth/signin`;
    },
    
    // Direct endpoints (fallback)
    GRAPHQL_ENDPOINT_DIRECT: 'https://platform.zone01.gr/api/graphql-engine/v1/graphql',
    SIGNIN_ENDPOINT_DIRECT: 'https://platform.zone01.gr/api/auth/signin',
    
    // Storage keys
    TOKEN_KEY: 'graphql_profile_token',
    USER_ID_KEY: 'graphql_profile_user_id',
    
    // Use proxy (can be toggled)
    USE_PROXY: true
};