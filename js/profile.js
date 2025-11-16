// Profile page functionality

let graphData = {
    xpOverTime: null,
    xpByProject: null,
    auditRatio: null
};

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    if (!isAuthenticated()) {
        window.location.href = 'index.html';
        return;
    }

    // Setup logout button
    document.getElementById('logoutBtn').addEventListener('click', () => {
        signOut();
    });

    // Setup graph control buttons
    setupGraphControls();

    // Load profile data
    await loadProfileData();
});

function setupGraphControls() {
    const buttons = document.querySelectorAll('.btn-graph');
    buttons.forEach(btn => {
        btn.addEventListener('click', async () => {
            // Update active state
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Load and render graph
            const graphType = btn.dataset.graph;
            await renderGraph(graphType);
        });
    });
}

async function loadProfileData() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const profileContent = document.getElementById('profileContent');
    const errorContent = document.getElementById('errorContent');

    try {
        loadingIndicator.style.display = 'block';
        profileContent.style.display = 'none';
        errorContent.style.display = 'none';

        // Load all data in parallel
        const [userInfo, totalXP, xpOverTime, xpByProject, auditRatio, completedProjects] = await Promise.all([
            getUserInfo(),
            getTotalXP(),
            getXPOverTime(),
            getXPByProject(),
            getAuditRatio(),
            getCompletedProjects()
        ]);

        // Store graph data
        graphData.xpOverTime = xpOverTime;
        graphData.xpByProject = xpByProject;
        graphData.auditRatio = auditRatio;

        // Update UI
        if (userInfo) {
            document.getElementById('userLogin').textContent = userInfo.login || 'N/A';
            document.getElementById('userId').textContent = userInfo.id || 'N/A';
        }
        
        document.getElementById('totalXP').textContent = totalXP.toLocaleString();
        document.getElementById('auditRatio').textContent = 
            auditRatio.total > 0 ? `${auditRatio.ratio}%` : 'N/A';

        // Display completed projects
        console.log('Completed projects to display:', completedProjects);
        displayCompletedProjects(completedProjects);

        // Hide loading, show content
        loadingIndicator.style.display = 'none';
        profileContent.style.display = 'block';

        // Render default graph
        await renderGraph('xp-over-time');
    } catch (error) {
        console.error('Error loading profile data:', error);
        loadingIndicator.style.display = 'none';
        errorContent.style.display = 'block';
        errorContent.querySelector('p').textContent = 
            `Failed to load profile data: ${error.message}`;
    }
}

async function renderGraph(graphType) {
    const graphArea = document.getElementById('graphArea');
    
    try {
        switch (graphType) {
            case 'xp-over-time':
                if (!graphData.xpOverTime) {
                    graphData.xpOverTime = await getXPOverTime();
                }
                renderXPOverTime(graphData.xpOverTime, graphArea);
                break;
            
            case 'xp-by-project':
                if (!graphData.xpByProject) {
                    graphData.xpByProject = await getXPByProject();
                }
                renderXPByProject(graphData.xpByProject, graphArea);
                break;
            
            case 'audit-ratio':
                if (!graphData.auditRatio) {
                    graphData.auditRatio = await getAuditRatio();
                }
                renderAuditRatio(graphData.auditRatio, graphArea);
                break;
            
            default:
                graphArea.innerHTML = '<p>Unknown graph type</p>';
        }
    } catch (error) {
        console.error('Error rendering graph:', error);
        graphArea.innerHTML = `<p style="color: #ef4444;">Error loading graph: ${error.message}</p>`;
    }
}

function displayCompletedProjects(projects) {
    const projectsList = document.getElementById('projectsList');
    
    if (!projects || projects.length === 0) {
        projectsList.innerHTML = '<p class="no-projects">No completed projects yet. Keep learning!</p>';
        return;
    }
    
    projectsList.innerHTML = projects.map(project => {
        const completedDate = new Date(project.completedAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        const projectName = project.name || project.path.split('/').pop() || 'Unknown Project';
        
        return `
            <div class="project-card">
                <span class="project-name">${escapeHtml(projectName)}</span>
                <span class="project-date">${completedDate}</span>
            </div>
        `;
    }).join('');
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

