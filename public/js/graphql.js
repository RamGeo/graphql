// GraphQL client utilities

/**
 * Execute a GraphQL query
 */
async function executeQuery(query, variables = {}) {
    try {
        const headers = getAuthHeader();
        
        // Request timeout (30 seconds)
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 30000);
        
        const response = await fetch(CONFIG.GRAPHQL_ENDPOINT, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                query: query,
                variables: variables
            }),
            signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
            if (response.status === 401) {
                signOut();
                throw new Error('Authentication expired. Please login again.');
            }
            if (response.status === 403) {
                throw new Error('Access forbidden.');
            }
            if (response.status >= 500) {
                throw new Error('Server error. Please try again later.');
            }
            throw new Error(`GraphQL request failed: ${response.statusText}`);
        }

        const data = await response.json();
        
        if (data.errors) {
            const errorMessage = data.errors[0]?.message || 'GraphQL query error';
            console.error('GraphQL errors:', data.errors);
            throw new Error(errorMessage);
        }

        return data.data;
    } catch (error) {
        console.error('GraphQL query error:', error);
        
        // Handle specific error types
        if (error.name === 'AbortError') {
            throw new Error('Request timeout. Please check your connection and try again.');
        }
        if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
            throw new Error('Network error: Could not connect to server. Check your internet connection.');
        }
        if (error.message.includes('JSON')) {
            throw new Error('Invalid response from server. Please try again.');
        }
        
        throw error;
    }
}

/**
 * Get user information
 */
async function getUserInfo() {
    const query = `
        query {
            user {
                id
                login
            }
        }
    `;
    
    const data = await executeQuery(query);
    const userInfo = data.user?.[0] || null;
    
    // Store user ID if we got it and don't have it yet
    if (userInfo && userInfo.id && !getUserId()) {
        localStorage.setItem(CONFIG.USER_ID_KEY, String(userInfo.id));
    }
    
    return userInfo;
}

/**
 * Get total XP for the user
 */
async function getTotalXP() {
    let userId = getUserId();
    
    // If no userId stored, try to get it from user query first
    if (!userId) {
        const userInfo = await getUserInfo();
        if (userInfo && userInfo.id) {
            userId = String(userInfo.id);
            localStorage.setItem(CONFIG.USER_ID_KEY, userId);
        } else {
            throw new Error('Unable to determine user ID');
        }
    }
    
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
        throw new Error('Invalid user ID: ' + userId);
    }
    
    const query = `
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
    `;
    
    const data = await executeQuery(query, { userId: userIdInt });
    
    if (!data.transaction || data.transaction.length === 0) {
        return 0;
    }
    
    return data.transaction.reduce((sum, t) => sum + (t.amount || 0), 0);
}

/**
 * Get XP transactions over time
 */
async function getXPOverTime() {
    let userId = getUserId();
    if (!userId) {
        const userInfo = await getUserInfo();
        if (userInfo && userInfo.id) {
            userId = String(userInfo.id);
            localStorage.setItem(CONFIG.USER_ID_KEY, userId);
        } else {
            throw new Error('Unable to determine user ID');
        }
    }
    
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
        throw new Error('Invalid user ID: ' + userId);
    }
    
    const query = `
        query GetXPOverTime($userId: Int!) {
            transaction(
                where: {
                    userId: { _eq: $userId },
                    type: { _eq: "xp" }
                },
                order_by: { createdAt: asc }
            ) {
                amount
                createdAt
                path
            }
        }
    `;
    
    const data = await executeQuery(query, { userId: userIdInt });
    
    if (!data.transaction) {
        return [];
    }
    
    // Group by date and accumulate XP
    const xpByDate = {};
    let cumulativeXP = 0;
    
    data.transaction.forEach(t => {
        const date = new Date(t.createdAt).toISOString().split('T')[0];
        cumulativeXP += t.amount || 0;
        
        if (!xpByDate[date]) {
            xpByDate[date] = { date, xp: 0, cumulative: 0 };
        }
        xpByDate[date].xp += t.amount || 0;
        xpByDate[date].cumulative = cumulativeXP;
    });
    
    return Object.values(xpByDate).sort((a, b) => 
        new Date(a.date) - new Date(b.date)
    );
}

/**
 * Get XP by project/path
 */
async function getXPByProject() {
    let userId = getUserId();
    if (!userId) {
        const userInfo = await getUserInfo();
        if (userInfo && userInfo.id) {
            userId = String(userInfo.id);
            localStorage.setItem(CONFIG.USER_ID_KEY, userId);
        } else {
            throw new Error('Unable to determine user ID');
        }
    }
    
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
        throw new Error('Invalid user ID: ' + userId);
    }
    
    const query = `
        query GetXPByProject($userId: Int!) {
            transaction(
                where: {
                    userId: { _eq: $userId },
                    type: { _eq: "xp" }
                }
            ) {
                amount
                path
                objectId
            }
        }
    `;
    
    const data = await executeQuery(query, { userId: userIdInt });
    
    if (!data.transaction) {
        return [];
    }
    
    // Group by path
    const xpByPath = {};
    
    data.transaction.forEach(t => {
        const path = t.path || 'Unknown';
        if (!xpByPath[path]) {
            xpByPath[path] = { path, xp: 0 };
        }
        xpByPath[path].xp += t.amount || 0;
    });
    
    // Convert to array and sort by XP
    return Object.values(xpByPath)
        .sort((a, b) => b.xp - a.xp)
        .slice(0, 10); // Top 10 projects
}

/**
 * Get audit ratio
 */
async function getAuditRatio() {
    let userId = getUserId();
    if (!userId) {
        const userInfo = await getUserInfo();
        if (userInfo && userInfo.id) {
            userId = String(userInfo.id);
            localStorage.setItem(CONFIG.USER_ID_KEY, userId);
        } else {
            throw new Error('Unable to determine user ID');
        }
    }
    
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
        throw new Error('Invalid user ID: ' + userId);
    }
    
    const query = `
        query GetAuditRatio($userId: Int!) {
            audit(
                where: {
                    auditorId: { _eq: $userId }
                }
            ) {
                grade
            }
        }
    `;
    
    const data = await executeQuery(query, { userId: userIdInt });
    
    if (!data.audit || data.audit.length === 0) {
        return { passed: 0, failed: 0, ratio: 0 };
    }
    
    let passed = 0;
    let failed = 0;
    
    data.audit.forEach(audit => {
        if (audit.grade >= 1.0) {
            passed++;
        } else {
            failed++;
        }
    });
    
    const total = passed + failed;
    const ratio = total > 0 ? (passed / total * 100).toFixed(1) : 0;
    
    return { passed, failed, ratio, total };
}

/**
 * Get pass/fail ratio from results
 */
async function getPassFailRatio() {
    let userId = getUserId();
    if (!userId) {
        const userInfo = await getUserInfo();
        if (userInfo && userInfo.id) {
            userId = String(userInfo.id);
            localStorage.setItem(CONFIG.USER_ID_KEY, userId);
        } else {
            throw new Error('Unable to determine user ID');
        }
    }
    
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
        throw new Error('Invalid user ID: ' + userId);
    }
    
    const query = `
        query GetPassFailRatio($userId: Int!) {
            result(
                where: {
                    userId: { _eq: $userId }
                }
            ) {
                grade
                path
                object {
                    id
                    type
                }
            }
        }
    `;
    
    const data = await executeQuery(query, { userId: userIdInt });
    
    if (!data.result || data.result.length === 0) {
        return { passed: 0, failed: 0, total: 0 };
    }
    
    // Helper function to check if result should be excluded
    const shouldExcludeResult = (path, objectType) => {
        const pathLower = (path || '').toLowerCase();
        const isProject = objectType === 'project';
        const isPiscine = pathLower.includes('piscine') || 
                         pathLower.includes('piscine-') ||
                         pathLower.includes('/piscine');
        
        // Only include projects, exclude piscines
        return !isProject || isPiscine;
    };
    
    let passed = 0;
    let failed = 0;
    
    data.result.forEach(result => {
        // Only count projects (not exercises) and exclude piscines
        if (!shouldExcludeResult(result.path, result.object?.type)) {
            if (result.grade >= 1.0) {
                passed++;
            } else {
                failed++;
            }
        }
    });
    
    return { passed, failed, total: passed + failed };
}

/**
 * Get progress information
 */
async function getProgressInfo() {
    let userId = getUserId();
    if (!userId) {
        const userInfo = await getUserInfo();
        if (userInfo && userInfo.id) {
            userId = String(userInfo.id);
            localStorage.setItem(CONFIG.USER_ID_KEY, userId);
        } else {
            throw new Error('Unable to determine user ID');
        }
    }
    
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
        throw new Error('Invalid user ID: ' + userId);
    }
    
    const query = `
        query GetProgressInfo($userId: Int!) {
            progress(
                where: {
                    userId: { _eq: $userId }
                }
            ) {
                grade
                objectId
                path
            }
        }
    `;
    
    const data = await executeQuery(query, { userId: userIdInt });
    
    return data.progress || [];
}

/**
 * Get completed projects
 */
async function getCompletedProjects() {
    let userId = getUserId();
    if (!userId) {
        const userInfo = await getUserInfo();
        if (userInfo && userInfo.id) {
            userId = String(userInfo.id);
            localStorage.setItem(CONFIG.USER_ID_KEY, userId);
        } else {
            throw new Error('Unable to determine user ID');
        }
    }
    
    const userIdInt = parseInt(userId);
    if (isNaN(userIdInt)) {
        throw new Error('Invalid user ID: ' + userId);
    }
    
    // Query both progress and result tables to get all completed projects
    const query = `
        query GetCompletedProjects($userId: Int!) {
            progress(
                where: {
                    userId: { _eq: $userId },
                    grade: { _gte: 1 }
                },
                order_by: { updatedAt: desc }
            ) {
                id
                grade
                path
                updatedAt
                objectId
                object {
                    id
                    name
                    type
                }
            }
            result(
                where: {
                    userId: { _eq: $userId },
                    grade: { _gte: 1 }
                },
                order_by: { updatedAt: desc }
            ) {
                id
                grade
                path
                updatedAt
                objectId
                object {
                    id
                    name
                    type
                }
            }
        }
    `;
    
    const data = await executeQuery(query, { userId: userIdInt });
    
    console.log('Completed projects data:', data);
    
    const allProjects = [];
    const seenProjects = new Set();
    
    // Helper function to check if project should be excluded
    const shouldExcludeProject = (path, name) => {
        const pathLower = (path || '').toLowerCase();
        const nameLower = (name || '').toLowerCase();
        const combined = pathLower + ' ' + nameLower;
        
        return combined.includes('piscine') || 
               combined.includes('piscine-') ||
               combined.includes('/piscine') ||
               combined.includes('check-in') ||
               combined.includes('checkin') ||
               combined.includes('checkpoint') ||
               combined.includes('/checkpoint') ||
               combined.includes('administration') ||
               combined.includes('toad');
    };
    
    // Process progress entries
    if (data.progress && data.progress.length > 0) {
        data.progress.forEach(item => {
            // Check if it's a project - either by object type or by path pattern
            const isProject = (item.object && item.object.type === 'project') || 
                            (item.path && !item.path.includes('/exercise') && !item.path.includes('/quest'));
            
            // Exclude piscine and other unwanted projects
            const projectName = item.object?.name || item.path?.split('/').pop() || '';
            if (isProject && item.objectId && !shouldExcludeProject(item.path, projectName)) {
                const objectId = item.objectId;
                if (!seenProjects.has(objectId)) {
                    seenProjects.add(objectId);
                    allProjects.push({
                        id: objectId,
                        name: projectName || 'Unknown Project',
                        path: item.path || '',
                        grade: item.grade || 0,
                        completedAt: item.updatedAt || item.createdAt
                    });
                }
            }
        });
    }
    
    // Process result entries
    if (data.result && data.result.length > 0) {
        data.result.forEach(item => {
            const isProject = (item.object && item.object.type === 'project') ||
                            (item.path && !item.path.includes('/exercise') && !item.path.includes('/quest'));
            
            // Exclude piscine and other unwanted projects
            const projectName = item.object?.name || item.path?.split('/').pop() || '';
            if (isProject && item.objectId && !shouldExcludeProject(item.path, projectName)) {
                const objectId = item.objectId;
                // Only add if we haven't seen it, or if this result has a better grade
                const existingIndex = allProjects.findIndex(p => p.id === objectId);
                if (existingIndex === -1) {
                    seenProjects.add(objectId);
                    allProjects.push({
                        id: objectId,
                        name: projectName || 'Unknown Project',
                        path: item.path || '',
                        grade: item.grade || 0,
                        completedAt: item.updatedAt || item.createdAt
                    });
                } else {
                    // Update if this result is more recent or has better grade
                    const existing = allProjects[existingIndex];
                    const newDate = new Date(item.updatedAt || item.createdAt);
                    const existingDate = new Date(existing.completedAt);
                    if (newDate > existingDate || item.grade > existing.grade) {
                        allProjects[existingIndex] = {
                            id: objectId,
                            name: projectName || 'Unknown Project',
                            path: item.path || '',
                            grade: item.grade || 0,
                            completedAt: item.updatedAt || item.createdAt
                        };
                    }
                }
            }
        });
    }
    
    // If we still don't have projects, try a different approach - query objects directly
    if (allProjects.length === 0) {
        console.log('No projects found with current query, trying alternative approach...');
        // Try querying transactions for XP from projects
        const altQuery = `
            query GetProjectXP($userId: Int!) {
                transaction(
                    where: {
                        userId: { _eq: $userId },
                        type: { _eq: "xp" }
                    }
                ) {
                    path
                    objectId
                    amount
                    createdAt
                    object {
                        id
                        name
                        type
                    }
                }
            }
        `;
        
        try {
            const altData = await executeQuery(altQuery, { userId: userIdInt });
            console.log('Alternative query data:', altData);
            
            if (altData.transaction && altData.transaction.length > 0) {
                const projectPaths = new Set();
                // Helper function to check if project should be excluded
                const shouldExcludeProject = (path, name) => {
                    const pathLower = (path || '').toLowerCase();
                    const nameLower = (name || '').toLowerCase();
                    const combined = pathLower + ' ' + nameLower;
                    
                    return combined.includes('piscine') || 
                           combined.includes('piscine-') ||
                           combined.includes('/piscine') ||
                           combined.includes('check-in') ||
                           combined.includes('checkin') ||
                           combined.includes('checkpoint') ||
                           combined.includes('/checkpoint') ||
                           combined.includes('administration') ||
                           combined.includes('toad');
                };
                
                altData.transaction.forEach(t => {
                    const projectName = t.object?.name || t.path?.split('/').pop() || '';
                    if (t.object && t.object.type === 'project' && t.path && !shouldExcludeProject(t.path, projectName)) {
                        const pathKey = t.path;
                        if (!projectPaths.has(pathKey)) {
                            projectPaths.add(pathKey);
                            allProjects.push({
                                id: t.objectId || t.object?.id || pathKey,
                                name: t.object?.name || t.path.split('/').pop() || 'Unknown Project',
                                path: t.path,
                                grade: 1, // Assume passed if they got XP
                                completedAt: t.createdAt
                            });
                        }
                    }
                });
            }
        } catch (error) {
            console.error('Alternative query failed:', error);
        }
    }
    
    // Sort by completion date (most recent first)
    allProjects.sort((a, b) => {
        const dateA = new Date(a.completedAt);
        const dateB = new Date(b.completedAt);
        return dateB - dateA;
    });
    
    console.log('Processed completed projects:', allProjects);
    
    return allProjects;
}

