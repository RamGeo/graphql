// Authentication utilities

/**
 * Encode credentials to base64 for Basic authentication
 */
function encodeCredentials(username, password) {
    const credentials = `${username}:${password}`;
    return btoa(credentials);
}

/**
 * Sign in and get JWT token
 */
async function signIn(username, password) {
    try {
        const credentials = encodeCredentials(username, password);
        
        // Request timeout (30 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(CONFIG.SIGNIN_ENDPOINT, {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            // Get error message from response
            let errorMessage = `Authentication failed: ${response.statusText}`;
            try {
                const errorData = await response.text();
                if (errorData) {
                    const parsed = JSON.parse(errorData);
                    errorMessage = parsed.message || parsed.error || errorMessage;
                }
            } catch (e) {
                // Response is not JSON, use status text
            }
            
            if (response.status === 401) {
                throw new Error('Invalid username/email or password');
            }
            throw new Error(errorMessage);
        }

        // Parse response (handles JSON or plain text token)
        const contentType = response.headers.get('content-type');
        let data;
        
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            const text = await response.text();
            try {
                data = JSON.parse(text);
            } catch (e) {
                // Response is plain text token
                if (text && text.length > 0) {
                    data = { token: text.trim() };
                } else {
                    throw new Error('Unexpected response format from server');
                }
            }
        }
        
        // Extract token from various response formats
        const token = data.token || data.accessToken || data.jwt || (typeof data === 'string' ? data : null);
        
        if (!token) {
            console.error('No token in response:', data);
            throw new Error('No token received from server. Response: ' + JSON.stringify(data));
        }

        // Store token and user ID
        localStorage.setItem(CONFIG.TOKEN_KEY, token);
        const userId = extractUserIdFromToken(token);
        if (userId) {
            localStorage.setItem(CONFIG.USER_ID_KEY, userId);
        }

        return token;
    } catch (error) {
        console.error('Sign in error:', error);
        
        // Handle specific error types
        if (error.name === 'AbortError') {
            throw new Error('Request timeout. Please check your connection and try again.');
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('Network error: Could not connect to server. Check your internet connection and CORS settings.');
        }
        if (error.message.includes('JSON')) {
            throw new Error('Invalid response from server. Please try again.');
        }
        
        throw error;
    }
}

/**
 * Extract user ID from JWT token
 */
function extractUserIdFromToken(token) {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        // Try different field names for user ID
        const userId = payload.userId || payload.id || payload.user_id || payload.sub || null;
        if (userId) {
            return String(userId);
        }
        return null;
    } catch (error) {
        console.error('Error extracting user ID from token:', error);
        return null;
    }
}

/**
 * Get stored JWT token
 */
function getToken() {
    return localStorage.getItem(CONFIG.TOKEN_KEY);
}

/**
 * Get stored user ID
 */
function getUserId() {
    return localStorage.getItem(CONFIG.USER_ID_KEY);
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
    return !!getToken();
}

/**
 * Sign out
 */
function signOut() {
    localStorage.removeItem(CONFIG.TOKEN_KEY);
    localStorage.removeItem(CONFIG.USER_ID_KEY);
    window.location.href = 'index.html';
}

/**
 * Get authorization header for API requests
 */
function getAuthHeader() {
    const token = getToken();
    if (!token) {
        throw new Error('No authentication token found');
    }
    return {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };
}

