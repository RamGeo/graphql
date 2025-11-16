// SVG Graph rendering utilities

/**
 * Create SVG element with proper namespace
 */
function createSVGElement(tag, attributes = {}) {
    const element = document.createElementNS('http://www.w3.org/2000/svg', tag);
    Object.entries(attributes).forEach(([key, value]) => {
        element.setAttribute(key, value);
    });
    return element;
}

/**
 * Create text element
 */
function createText(x, y, text, className = '', anchor = 'start') {
    const textEl = createSVGElement('text', {
        x: x,
        y: y,
        class: className,
        'text-anchor': anchor
    });
    textEl.textContent = text;
    return textEl;
}

/**
 * Linear scale function
 */
function linearScale(domain, range) {
    return function(value) {
        const [d0, d1] = domain;
        const [r0, r1] = range;
        return r0 + (value - d0) / (d1 - d0) * (r1 - r0);
    };
}

/**
 * Get extent (min, max) from array
 */
function extent(array, accessor) {
    const values = array.map(accessor);
    return [Math.min(...values), Math.max(...values)];
}

/**
 * Get max value from array
 */
function max(array, accessor) {
    return Math.max(...array.map(accessor));
}

/**
 * Format date as YYYY-MM-DD
 */
function formatDate(date) {
    return date.toISOString().split('T')[0];
}

/**
 * Render XP over time line chart
 */
function renderXPOverTime(data, container) {
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">No XP data available</p>';
        return;
    }

    const margin = { top: 40, right: 40, bottom: 60, left: 80 };
    const containerWidth = container.clientWidth || 800;
    const width = containerWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    container.innerHTML = '';
    
    const svg = createSVGElement('svg', {
        width: containerWidth,
        height: 400,
        viewBox: `0 0 ${containerWidth} 400`
    });

    const g = createSVGElement('g', {
        transform: `translate(${margin.left},${margin.top})`
    });

    // Create scales
    const dateExtent = extent(data, d => new Date(d.date).getTime());
    const xScale = linearScale(dateExtent, [0, width]);
    
    const maxXP = max(data, d => d.cumulative);
    const yScale = linearScale([0, maxXP], [height, 0]);

    // Add grid lines
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
        const value = (maxXP / yTicks) * i;
        const y = yScale(value);
        const line = createSVGElement('line', {
            x1: 0,
            y1: y,
            x2: width,
            y2: y,
            class: 'grid-line'
        });
        g.appendChild(line);
    }

    // Create area path
    let areaPath = `M ${xScale(new Date(data[0].date).getTime())} ${height} `;
    data.forEach(d => {
        areaPath += `L ${xScale(new Date(d.date).getTime())} ${yScale(d.cumulative)} `;
    });
    areaPath += `L ${xScale(new Date(data[data.length - 1].date).getTime())} ${height} Z`;

    const area = createSVGElement('path', {
        d: areaPath,
        class: 'area-path',
        fill: '#6366f1'
    });
    g.appendChild(area);

    // Create line path
    let linePath = `M ${xScale(new Date(data[0].date).getTime())} ${yScale(data[0].cumulative)} `;
    data.forEach((d, i) => {
        if (i > 0) {
            linePath += `L ${xScale(new Date(d.date).getTime())} ${yScale(d.cumulative)} `;
        }
    });

    const line = createSVGElement('path', {
        d: linePath,
        class: 'line-path',
        stroke: '#6366f1',
        fill: 'none',
        'stroke-width': '3'
    });
    g.appendChild(line);

    // Add data points
    data.forEach(d => {
        const circle = createSVGElement('circle', {
            cx: xScale(new Date(d.date).getTime()),
            cy: yScale(d.cumulative),
            r: 4,
            fill: '#6366f1',
            class: 'data-point'
        });
        g.appendChild(circle);
    });

    // Add X axis
    const xAxis = createSVGElement('g', {
        transform: `translate(0,${height})`,
        class: 'axis'
    });

    const xTicks = Math.min(5, data.length);
    const xStep = data.length / xTicks;
    for (let i = 0; i < xTicks; i++) {
        const idx = Math.floor(i * xStep);
        if (idx < data.length) {
            const date = new Date(data[idx].date);
            const x = xScale(date.getTime());
            const tick = createSVGElement('line', {
                x1: x,
                y1: 0,
                x2: x,
                y2: 5,
                stroke: '#64748b',
                'stroke-width': '1'
            });
            xAxis.appendChild(tick);
            
            const label = createText(x, 20, formatDate(date), 'axis-label', 'middle');
            xAxis.appendChild(label);
        }
    }
    g.appendChild(xAxis);

    // Add Y axis
    const yAxis = createSVGElement('g', { class: 'axis' });
    for (let i = 0; i <= yTicks; i++) {
        const value = (maxXP / yTicks) * i;
        const y = yScale(value);
        const tick = createSVGElement('line', {
            x1: -5,
            y1: y,
            x2: 0,
            y2: y,
            stroke: '#64748b',
            'stroke-width': '1'
        });
        yAxis.appendChild(tick);
        
        const label = createText(-10, y + 4, Math.round(value).toLocaleString(), 'axis-label', 'end');
        yAxis.appendChild(label);
    }
    g.appendChild(yAxis);

    // Add axis line
    const xAxisLine = createSVGElement('line', {
        x1: 0,
        y1: height,
        x2: width,
        y2: height,
        class: 'axis-line',
        'stroke-width': '2'
    });
    g.appendChild(xAxisLine);

    const yAxisLine = createSVGElement('line', {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: height,
        class: 'axis-line',
        'stroke-width': '2'
    });
    g.appendChild(yAxisLine);

    // Add title
    const title = createText(width / 2, -20, 'Cumulative XP Over Time', 'graph-title', 'middle');
    g.appendChild(title);

    // Add labels
    const xLabel = createText(width / 2, height + 45, 'Date', 'axis-label', 'middle');
    g.appendChild(xLabel);

    const yLabel = createSVGElement('text', {
        x: -height / 2,
        y: -50,
        class: 'axis-label',
        'text-anchor': 'middle',
        transform: 'rotate(-90)'
    });
    yLabel.textContent = 'Cumulative XP';
    g.appendChild(yLabel);

    svg.appendChild(g);
    container.appendChild(svg);
}

/**
 * Render XP by project bar chart
 */
function renderXPByProject(data, container) {
    if (!data || data.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">No project data available</p>';
        return;
    }

    const margin = { top: 40, right: 40, bottom: 120, left: 80 };
    const containerWidth = container.clientWidth || 800;
    const width = containerWidth - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;

    container.innerHTML = '';
    
    const svg = createSVGElement('svg', {
        width: containerWidth,
        height: 400,
        viewBox: `0 0 ${containerWidth} 400`
    });

    const g = createSVGElement('g', {
        transform: `translate(${margin.left},${margin.top})`
    });

    // Create scales
    const maxXP = max(data, d => d.xp);
    const yScale = linearScale([0, maxXP], [height, 0]);
    
    const barWidth = width / data.length * 0.8;
    const barSpacing = width / data.length;

    // Add grid lines
    const yTicks = 5;
    for (let i = 0; i <= yTicks; i++) {
        const value = (maxXP / yTicks) * i;
        const y = yScale(value);
        const line = createSVGElement('line', {
            x1: 0,
            y1: y,
            x2: width,
            y2: y,
            class: 'grid-line'
        });
        g.appendChild(line);
    }

    // Add bars
    data.forEach((d, i) => {
        const x = i * barSpacing + (barSpacing - barWidth) / 2;
        const barHeight = height - yScale(d.xp);
        const bar = createSVGElement('rect', {
            x: x,
            y: yScale(d.xp),
            width: barWidth,
            height: barHeight,
            class: 'bar',
            fill: '#6366f1',
            opacity: '0.8'
        });
        g.appendChild(bar);

        // Add value label
        const label = createText(x + barWidth / 2, yScale(d.xp) - 5, d.xp.toLocaleString(), 'axis-label', 'middle');
        label.setAttribute('font-size', '12px');
        g.appendChild(label);

        // Add project name (rotated)
        const projectName = d.path.split('/').pop() || 'Unknown';
        const nameLabel = createSVGElement('text', {
            x: x + barWidth / 2,
            y: height + 15,
            class: 'axis-label',
            'text-anchor': 'middle',
            transform: `rotate(-45 ${x + barWidth / 2} ${height + 15})`,
            'font-size': '10px'
        });
        nameLabel.textContent = projectName.length > 15 ? projectName.substring(0, 15) + '...' : projectName;
        g.appendChild(nameLabel);
    });

    // Add Y axis
    const yAxis = createSVGElement('g', { class: 'axis' });
    for (let i = 0; i <= yTicks; i++) {
        const value = (maxXP / yTicks) * i;
        const y = yScale(value);
        const tick = createSVGElement('line', {
            x1: -5,
            y1: y,
            x2: 0,
            y2: y,
            stroke: '#64748b',
            'stroke-width': '1'
        });
        yAxis.appendChild(tick);
        
        const label = createText(-10, y + 4, Math.round(value).toLocaleString(), 'axis-label', 'end');
        yAxis.appendChild(label);
    }
    g.appendChild(yAxis);

    // Add axis lines
    const xAxisLine = createSVGElement('line', {
        x1: 0,
        y1: height,
        x2: width,
        y2: height,
        class: 'axis-line',
        'stroke-width': '2'
    });
    g.appendChild(xAxisLine);

    const yAxisLine = createSVGElement('line', {
        x1: 0,
        y1: 0,
        x2: 0,
        y2: height,
        class: 'axis-line',
        'stroke-width': '2'
    });
    g.appendChild(yAxisLine);

    // Add title
    const title = createText(width / 2, -20, 'XP by Project (Top 10)', 'graph-title', 'middle');
    g.appendChild(title);

    // Add labels
    const xLabel = createText(width / 2, height + 100, 'Project', 'axis-label', 'middle');
    g.appendChild(xLabel);

    const yLabel = createSVGElement('text', {
        x: -height / 2,
        y: -50,
        class: 'axis-label',
        'text-anchor': 'middle',
        transform: 'rotate(-90)'
    });
    yLabel.textContent = 'XP';
    g.appendChild(yLabel);

    svg.appendChild(g);
    container.appendChild(svg);
}

/**
 * Render pass/fail ratio pie chart
 */
function renderPassFailRatio(data, container) {
    if (!data || data.total === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">No result data available</p>';
        return;
    }

    const containerWidth = container.clientWidth || 800;
    const width = containerWidth;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 60;

    container.innerHTML = '';
    
    const svg = createSVGElement('svg', {
        width: width,
        height: height,
        viewBox: `0 0 ${width} ${height}`
    });

    const g = createSVGElement('g', {
        transform: `translate(${width / 2},${height / 2})`
    });

    // Pie data
    const pieData = [
        { label: 'Passed', value: data.passed, color: '#10b981' },
        { label: 'Failed', value: data.failed, color: '#ef4444' }
    ];

    // Calculate angles
    const total = data.total;
    let currentAngle = -Math.PI / 2;

    pieData.forEach((item, i) => {
        const angle = (item.value / total) * 2 * Math.PI;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;

        // Create arc path
        const startInnerX = Math.cos(startAngle) * 0;
        const startInnerY = Math.sin(startAngle) * 0;
        const startOuterX = Math.cos(startAngle) * radius;
        const startOuterY = Math.sin(startAngle) * radius;
        const endOuterX = Math.cos(endAngle) * radius;
        const endOuterY = Math.sin(endAngle) * radius;
        const endInnerX = Math.cos(endAngle) * 0;
        const endInnerY = Math.sin(endAngle) * 0;

        const largeArc = angle > Math.PI ? 1 : 0;

        const pathData = `M ${startOuterX} ${startOuterY} A ${radius} ${radius} 0 ${largeArc} 1 ${endOuterX} ${endOuterY} L ${endInnerX} ${endInnerY} A 0 0 0 ${largeArc} 0 ${startInnerX} ${startInnerY} Z`;

        const path = createSVGElement('path', {
            d: pathData,
            fill: item.color,
            class: 'pie-slice',
            opacity: '0.8'
        });
        g.appendChild(path);

        // Add label
        const labelAngle = (startAngle + endAngle) / 2;
        const labelRadius = radius * 0.7;
        const labelX = Math.cos(labelAngle) * labelRadius;
        const labelY = Math.sin(labelAngle) * labelRadius;

        const label = createText(labelX, labelY, `${item.label}: ${item.value}`, '', 'middle');
        label.setAttribute('fill', 'white');
        label.setAttribute('font-size', '14px');
        label.setAttribute('font-weight', 'bold');
        g.appendChild(label);

        // Add percentage
        const percentage = ((item.value / total) * 100).toFixed(1);
        const percentLabel = createText(labelX, labelY + 18, `${percentage}%`, '', 'middle');
        percentLabel.setAttribute('fill', 'white');
        percentLabel.setAttribute('font-size', '12px');
        g.appendChild(percentLabel);

        currentAngle = endAngle;
    });

    // Add title
    const title = createText(0, -height / 2 + 20, 'Pass/Fail Ratio', 'graph-title', 'middle');
    g.appendChild(title);

    svg.appendChild(g);
    container.appendChild(svg);
}

/**
 * Render audit ratio pie chart
 */
function renderAuditRatio(data, container) {
    if (!data || data.total === 0) {
        container.innerHTML = '<p style="text-align: center; color: #64748b; padding: 40px;">No audit data available</p>';
        return;
    }

    const containerWidth = container.clientWidth || 800;
    const width = containerWidth;
    const height = 400;
    const radius = Math.min(width, height) / 2 - 60;

    container.innerHTML = '';
    
    const svg = createSVGElement('svg', {
        width: width,
        height: height,
        viewBox: `0 0 ${width} ${height}`
    });

    const g = createSVGElement('g', {
        transform: `translate(${width / 2},${height / 2})`
    });

    // Pie data - Purple from XP by Project graph for passed, Pink for failed
    const pieData = [
        { label: 'Passed', value: data.passed, color: '#6366f1' },
        { label: 'Failed', value: data.failed, color: '#ec4899' }
    ];

    // Calculate angles
    const total = data.total;
    let currentAngle = -Math.PI / 2;

    pieData.forEach((item, i) => {
        const angle = (item.value / total) * 2 * Math.PI;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;

        // Create arc path
        const startInnerX = Math.cos(startAngle) * 0;
        const startInnerY = Math.sin(startAngle) * 0;
        const startOuterX = Math.cos(startAngle) * radius;
        const startOuterY = Math.sin(startAngle) * radius;
        const endOuterX = Math.cos(endAngle) * radius;
        const endOuterY = Math.sin(endAngle) * radius;
        const endInnerX = Math.cos(endAngle) * 0;
        const endInnerY = Math.sin(endAngle) * 0;

        const largeArc = angle > Math.PI ? 1 : 0;

        const pathData = `M ${startOuterX} ${startOuterY} A ${radius} ${radius} 0 ${largeArc} 1 ${endOuterX} ${endOuterY} L ${endInnerX} ${endInnerY} A 0 0 0 ${largeArc} 0 ${startInnerX} ${startInnerY} Z`;

        const path = createSVGElement('path', {
            d: pathData,
            fill: item.color,
            class: 'pie-slice',
            opacity: '0.8'
        });
        g.appendChild(path);

        // Add label - adjust text color based on background
        const labelAngle = (startAngle + endAngle) / 2;
        const labelRadius = radius * 0.7;
        const labelX = Math.cos(labelAngle) * labelRadius;
        const labelY = Math.sin(labelAngle) * labelRadius;

        // Use white text for both colors (they're both dark enough)
        const textColor = 'white';

        const label = createText(labelX, labelY, `${item.label}: ${item.value}`, '', 'middle');
        label.setAttribute('fill', textColor);
        label.setAttribute('font-size', '14px');
        label.setAttribute('font-weight', 'bold');
        g.appendChild(label);

        // Add percentage
        const percentage = ((item.value / total) * 100).toFixed(1);
        const percentLabel = createText(labelX, labelY + 18, `${percentage}%`, '', 'middle');
        percentLabel.setAttribute('fill', textColor);
        percentLabel.setAttribute('font-size', '12px');
        g.appendChild(percentLabel);

        currentAngle = endAngle;
    });

    // Add title
    const title = createText(0, -height / 2 + 20, `Audit Ratio (${data.ratio}% Pass Rate)`, 'graph-title', 'middle');
    g.appendChild(title);

    svg.appendChild(g);
    container.appendChild(svg);
}
