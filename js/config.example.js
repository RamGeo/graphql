// Example configuration file
// Copy this to config.js and replace ((DOMAIN)) with your actual domain

const CONFIG = {
    // GraphQL endpoint - replace (DOMAIN) with your actual domain
    // Example: 'https://01.kood.tech/api/graphql-engine/v1/graphql'
    GRAPHQL_ENDPOINT: 'https://((DOMAIN))/api/graphql-engine/v1/graphql',
    
    // Signin endpoint
    // Example: 'https://01.kood.tech/api/auth/signin'
    SIGNIN_ENDPOINT: 'https://((DOMAIN))/api/auth/signin',
    
    // Storage keys
    TOKEN_KEY: 'graphql_profile_token',
    USER_ID_KEY: 'graphql_profile_user_id'
};

