/**
 * Weather Controller
 * Handles weather data visualization for Voss area
 */

class WeatherController {
    constructor() {
        this.currentStation = 'vossevangen';
        this.charts = {
            temp: null,
            precip: null,
            daily: null
        };
        
        this.initEventListeners();
    }
    
    initEventListeners() {
        // Open/Close modal
        document.getElementById('weatherViewBtn').addEventListener('click', () => {
            this.openModal();
        });
        
        document.getElementById('closeWeatherModal').addEventListener('click', () => {
            this.closeModal();
        });
        
        // Close on overlay click
        document.getElementById('weatherModal').addEventListener('click', (e) => {
            if (e.target.id === 'weatherModal') {
                this.closeModal();
            }
        });
        
        // Station selector buttons
        document.querySelectorAll('.station-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.station-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                const station = btn.dataset.station;
                if (station === 'compare') {
                    this.showComparison();
                } else {
                    this.currentStation = station;
                    this.updateCharts();
                }
            });
        });
    }
    
    openModal() {
        document.getElementById('weatherModal').style.display = 'flex';
        this.updateCharts();
    }
    
    closeModal() {
        document.getElementById('weatherModal').style.display = 'none';
    }
    
    updateCharts() {
        const data = weatherData[this.currentStation];
        
        this.createTempChart(data);
        this.createPrecipChart(data);
        this.createDailyTempChart(data);
        this.updateSummary(data);
    }
    
    createTempChart(data) {
        const ctx = document.getElementById('tempChart');
        
        if (this.charts.temp) {
            this.charts.temp.destroy();
        }
        
        const isDark = document.documentElement.dataset.theme === 'dark';
        const textColor = isDark ? '#e5e7eb' : '#1f2937';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        this.charts.temp = new Chart(ctx, {
            type: 'line',
            data: {
                labels: monthNames,
                datasets: [{
                    label: `${data.name} (${data.elevation})`,
                    data: data.monthlyTemp,
                    borderColor: 'rgb(239, 68, 68)',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: textColor,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}°C`
                        }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Temperatur (°C)',
                            color: textColor
                        },
                        ticks: {
                            color: textColor,
                            callback: (value) => `${value}°C`
                        },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }
    
    createPrecipChart(data) {
        const ctx = document.getElementById('precipChart');
        
        if (this.charts.precip) {
            this.charts.precip.destroy();
        }
        
        const isDark = document.documentElement.dataset.theme === 'dark';
        const textColor = isDark ? '#e5e7eb' : '#1f2937';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        this.charts.precip = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: monthNames,
                datasets: [{
                    label: `${data.name} (${data.elevation})`,
                    data: data.monthlyPrecip,
                    backgroundColor: 'rgba(59, 130, 246, 0.8)',
                    borderColor: 'rgb(59, 130, 246)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: textColor,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${context.parsed.y} mm`
                        }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Nedbør (mm)',
                            color: textColor
                        },
                        ticks: {
                            color: textColor,
                            callback: (value) => `${value} mm`
                        },
                        grid: { color: gridColor },
                        beginAtZero: true
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }
    
    createDailyTempChart(data) {
        const ctx = document.getElementById('dailyTempChart');
        
        if (this.charts.daily) {
            this.charts.daily.destroy();
        }
        
        const isDark = document.documentElement.dataset.theme === 'dark';
        const textColor = isDark ? '#e5e7eb' : '#1f2937';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        // Flatten daily data to a continuous array
        const dailyData = [];
        const labels = [];
        let dayCounter = 0;
        
        Object.keys(data.dailyTemp).forEach((month, monthIdx) => {
            data.dailyTemp[month].forEach((temp, dayIdx) => {
                dailyData.push(temp);
                // Only show label every 10 days
                if (dayCounter % 10 === 0) {
                    labels.push(`${monthNames[monthIdx]} ${dayIdx + 1}`);
                } else {
                    labels.push('');
                }
                dayCounter++;
            });
        });
        
        this.charts.daily = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: `Døgntemperatur ${data.name}`,
                    data: dailyData,
                    borderColor: 'rgb(16, 185, 129)',
                    backgroundColor: 'rgba(16, 185, 129, 0.05)',
                    borderWidth: 1.5,
                    fill: true,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: textColor,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.parsed.y.toFixed(1)}°C`
                        }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Temperatur (°C)',
                            color: textColor
                        },
                        ticks: {
                            color: textColor,
                            callback: (value) => `${value}°C`
                        },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: {
                            color: textColor,
                            maxRotation: 45,
                            minRotation: 45
                        },
                        grid: { color: gridColor }
                    }
                }
            }
        });
    }
    
    showComparison() {
        const voss = weatherData.vossevangen;
        const bulk = weatherData.bulken;
        
        // Temperature comparison
        const tempCtx = document.getElementById('tempChart');
        if (this.charts.temp) {
            this.charts.temp.destroy();
        }
        
        const isDark = document.documentElement.dataset.theme === 'dark';
        const textColor = isDark ? '#e5e7eb' : '#1f2937';
        const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';
        
        this.charts.temp = new Chart(tempCtx, {
            type: 'line',
            data: {
                labels: monthNames,
                datasets: [
                    {
                        label: `${voss.name} (${voss.elevation})`,
                        data: voss.monthlyTemp,
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    },
                    {
                        label: `${bulk.name} (${bulk.elevation})`,
                        data: bulk.monthlyTemp,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: textColor,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${context.parsed.y.toFixed(1)}°C`
                        }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Temperatur (°C)',
                            color: textColor
                        },
                        ticks: {
                            color: textColor,
                            callback: (value) => `${value}°C`
                        },
                        grid: { color: gridColor }
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    }
                }
            }
        });
        
        // Precipitation comparison
        const precipCtx = document.getElementById('precipChart');
        if (this.charts.precip) {
            this.charts.precip.destroy();
        }
        
        this.charts.precip = new Chart(precipCtx, {
            type: 'bar',
            data: {
                labels: monthNames,
                datasets: [
                    {
                        label: `${voss.name} (${voss.elevation})`,
                        data: voss.monthlyPrecip,
                        backgroundColor: 'rgba(239, 68, 68, 0.8)',
                        borderColor: 'rgb(239, 68, 68)',
                        borderWidth: 1
                    },
                    {
                        label: `${bulk.name} (${bulk.elevation})`,
                        data: bulk.monthlyPrecip,
                        backgroundColor: 'rgba(59, 130, 246, 0.8)',
                        borderColor: 'rgb(59, 130, 246)',
                        borderWidth: 1
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: textColor,
                            font: { size: 12 }
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${context.parsed.y} mm`
                        }
                    }
                },
                scales: {
                    y: {
                        title: {
                            display: true,
                            text: 'Nedbør (mm)',
                            color: textColor
                        },
                        ticks: {
                            color: textColor,
                            callback: (value) => `${value} mm`
                        },
                        grid: { color: gridColor },
                        beginAtZero: true
                    },
                    x: {
                        ticks: { color: textColor },
                        grid: { color: gridColor }
                    }
                }
            }
        });
        
        // Update summary with comparison
        document.getElementById('yearlyTempValue').textContent = 
            `Voss: ${voss.yearlyTemp.toFixed(1)}°C | Bulken: ${bulk.yearlyTemp.toFixed(1)}°C`;
        document.getElementById('yearlyPrecipValue').textContent = 
            `Voss: ${voss.yearlyPrecip} mm | Bulken: ${bulk.yearlyPrecip} mm`;
            
        // Hide daily chart in comparison mode
        document.querySelector('.weather-daily-section').style.display = 'none';
    }
    
    updateSummary(data) {
        document.getElementById('yearlyTempValue').textContent = `${data.yearlyTemp.toFixed(1)}°C`;
        document.getElementById('yearlyPrecipValue').textContent = `${data.yearlyPrecip} mm`;
        
        // Show daily chart in single station mode
        document.querySelector('.weather-daily-section').style.display = 'block';
    }
    
    updateTheme() {
        // Re-create charts with new theme colors
        if (document.getElementById('weatherModal').style.display === 'flex') {
            const activeBtn = document.querySelector('.station-btn.active');
            if (activeBtn && activeBtn.dataset.station === 'compare') {
                this.showComparison();
            } else {
                this.updateCharts();
            }
        }
    }
}

