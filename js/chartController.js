// ==================== Chart Controller ====================

class ChartController {
    constructor() {
        this.elevationChart = null;
        this.speedChart = null;
        this.isDarkMode = document.documentElement.dataset.theme === 'dark';
    }

    /**
     * Initialize charts with track data
     */
    initCharts(points) {
        this.destroyCharts();
        this.createElevationChart(points);
        this.createSpeedChart(points);
    }

    /**
     * Create elevation profile chart
     */
    createElevationChart(points) {
        const ctx = document.getElementById('elevationChart');
        if (!ctx) return;

        const elevations = points.map(p => p.elevation ? p.elevation * 3.28084 : null).filter(e => e !== null); // Convert to feet
        const distances = this.calculateCumulativeDistances(points);
        
        const data = {
            labels: distances.map(d => (d / 1852).toFixed(1)), // Convert to nautical miles
            datasets: [{
                label: 'Høyde (ft)',
                data: elevations,
                borderColor: this.isDarkMode ? '#3b82f6' : '#2563eb',
                backgroundColor: this.createGradient(ctx, '#3b82f6', 'elevation'),
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHoverBackgroundColor: '#3b82f6',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        };

        this.elevationChart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: this.getChartOptions('Distanse (NM)', 'Høyde (ft)')
        });
    }

    /**
     * Create speed profile chart
     */
    createSpeedChart(points) {
        const ctx = document.getElementById('speedChart');
        if (!ctx) return;

        const speeds = points.map(p => p.speed ? p.speed * 1.94384 : 0); // Convert to knots
        const times = points.map((p, i) => i); // Use index as x-axis for time progression
        
        const data = {
            labels: times.map((_, i) => {
                if (i % Math.ceil(times.length / 10) === 0) {
                    const duration = (points[i].time - points[0].time) / 1000 / 60; // minutes
                    return Math.round(duration) + 'm';
                }
                return '';
            }),
            datasets: [{
                label: 'Hastighet (kn)',
                data: speeds,
                borderColor: this.isDarkMode ? '#10b981' : '#059669',
                backgroundColor: this.createGradient(ctx, '#10b981', 'speed'),
                borderWidth: 2,
                fill: true,
                tension: 0.4,
                pointRadius: 0,
                pointHoverRadius: 4,
                pointHoverBackgroundColor: '#10b981',
                pointHoverBorderColor: '#fff',
                pointHoverBorderWidth: 2
            }]
        };

        this.speedChart = new Chart(ctx, {
            type: 'line',
            data: data,
            options: this.getChartOptions('Tid', 'Hastighet (kn)')
        });
    }

    /**
     * Calculate cumulative distances for elevation chart
     */
    calculateCumulativeDistances(points) {
        const distances = [0];
        let cumulative = 0;
        
        for (let i = 1; i < points.length; i++) {
            cumulative += calculateDistance(
                points[i - 1].lat,
                points[i - 1].lon,
                points[i].lat,
                points[i].lon
            );
            distances.push(cumulative);
        }
        
        return distances;
    }

    /**
     * Create gradient for chart background
     */
    createGradient(ctx, color, type) {
        const gradient = ctx.getContext('2d').createLinearGradient(0, 0, 0, 200);
        const rgb = hexToRgb(color);
        
        gradient.addColorStop(0, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.5)`);
        gradient.addColorStop(1, `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.05)`);
        
        return gradient;
    }

    /**
     * Get common chart options
     */
    getChartOptions(xAxisLabel, yAxisLabel) {
        const textColor = this.isDarkMode ? '#cbd5e1' : '#475569';
        const gridColor = this.isDarkMode ? '#334155' : '#e2e8f0';

        return {
            responsive: true,
            maintainAspectRatio: true,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    backgroundColor: this.isDarkMode ? '#1e293b' : '#ffffff',
                    titleColor: textColor,
                    bodyColor: textColor,
                    borderColor: gridColor,
                    borderWidth: 1,
                    padding: 12,
                    displayColors: false,
                    callbacks: {
                        label: function(context) {
                            return `${context.parsed.y.toFixed(1)} ${yAxisLabel.split(' ')[1]}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    grid: {
                        color: gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            size: 11
                        }
                    },
                    title: {
                        display: true,
                        text: xAxisLabel,
                        color: textColor,
                        font: {
                            size: 12,
                            weight: 600
                        }
                    }
                },
                y: {
                    grid: {
                        color: gridColor,
                        drawBorder: false
                    },
                    ticks: {
                        color: textColor,
                        font: {
                            size: 11
                        }
                    },
                    title: {
                        display: true,
                        text: yAxisLabel,
                        color: textColor,
                        font: {
                            size: 12,
                            weight: 600
                        }
                    }
                }
            }
        };
    }

    /**
     * Update charts theme
     */
    updateTheme(isDark) {
        this.isDarkMode = isDark;
        
        if (this.elevationChart) {
            this.updateChartTheme(this.elevationChart);
        }
        
        if (this.speedChart) {
            this.updateChartTheme(this.speedChart);
        }
    }

    /**
     * Update individual chart theme
     */
    updateChartTheme(chart) {
        const textColor = this.isDarkMode ? '#cbd5e1' : '#475569';
        const gridColor = this.isDarkMode ? '#334155' : '#e2e8f0';

        chart.options.scales.x.grid.color = gridColor;
        chart.options.scales.x.ticks.color = textColor;
        chart.options.scales.x.title.color = textColor;
        
        chart.options.scales.y.grid.color = gridColor;
        chart.options.scales.y.ticks.color = textColor;
        chart.options.scales.y.title.color = textColor;

        chart.options.plugins.tooltip.backgroundColor = this.isDarkMode ? '#1e293b' : '#ffffff';
        chart.options.plugins.tooltip.titleColor = textColor;
        chart.options.plugins.tooltip.bodyColor = textColor;
        chart.options.plugins.tooltip.borderColor = gridColor;
        
        chart.update();
    }

    /**
     * Destroy existing charts
     */
    destroyCharts() {
        if (this.elevationChart) {
            this.elevationChart.destroy();
            this.elevationChart = null;
        }
        
        if (this.speedChart) {
            this.speedChart.destroy();
            this.speedChart = null;
        }
    }
}

