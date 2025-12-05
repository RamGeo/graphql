#!/bin/sh
# Generate config.js from environment variables at container startup

CONFIG_FILE="/usr/share/nginx/html/js/config.js"

# Default values
DOMAIN_INPUT="${GRAPHQL_DOMAIN:-https://your-domain.com}"
CORS_PROXY="${CORS_PROXY:-https://corsproxy.io}"
USE_PROXY="${USE_PROXY:-true}"

# Extract domain from input (handles full URLs or just domains)
if echo "$DOMAIN_INPUT" | grep -q "://"; then
    DOMAIN=$(echo "$DOMAIN_INPUT" | awk -F'/' '{print $1"//"$3}')
else
    DOMAIN="https://${DOMAIN_INPUT}"
    DOMAIN=$(echo "$DOMAIN" | awk -F'/' '{print $1"//"$3}')
fi

# Convert USE_PROXY to boolean
if [ "$USE_PROXY" = "false" ] || [ "$USE_PROXY" = "0" ]; then
    USE_PROXY_VALUE="false"
else
    USE_PROXY_VALUE="true"
fi

# Generate config.js
cat > "$CONFIG_FILE" << EOF
// Configuration file for GraphQL endpoint with CORS proxy support
// This file is auto-generated from environment variables

const CONFIG = {
    // Base domain
    DOMAIN: '${DOMAIN}',
    
    // CORS proxy URL
    CORS_PROXY: '${CORS_PROXY}',
    
    // GraphQL endpoint with proxy
    get GRAPHQL_ENDPOINT() {
        return \`\${this.CORS_PROXY}/?\${this.DOMAIN}/api/graphql-engine/v1/graphql\`;
    },
    
    // Signin endpoint with proxy
    get SIGNIN_ENDPOINT() {
        return \`\${this.CORS_PROXY}/?\${this.DOMAIN}/api/auth/signin\`;
    },
    
    // Direct endpoints (used when USE_PROXY is false)
    GRAPHQL_ENDPOINT_DIRECT: '${DOMAIN}/api/graphql-engine/v1/graphql',
    SIGNIN_ENDPOINT_DIRECT: '${DOMAIN}/api/auth/signin',
    
    // localStorage keys
    TOKEN_KEY: 'graphql_profile_token',
    USER_ID_KEY: 'graphql_profile_user_id',
    
    // Use proxy
    USE_PROXY: ${USE_PROXY_VALUE}
};
EOF

# Set proper permissions
chown nginx:nginx "$CONFIG_FILE"
chmod 644 "$CONFIG_FILE"

echo "Configuration file generated at $CONFIG_FILE"
echo "DOMAIN: $DOMAIN"
echo "CORS_PROXY: $CORS_PROXY"
echo "USE_PROXY: $USE_PROXY"

