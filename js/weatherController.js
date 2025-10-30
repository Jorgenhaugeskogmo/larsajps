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
        
        // Export PDF button
        document.getElementById('exportWeatherPdfBtn').addEventListener('click', () => {
            this.exportToPDF();
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
    
    async exportToPDF() {
        showLoading();
        
        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();
            
            // Check if we're in comparison mode
            const activeBtn = document.querySelector('.station-btn.active');
            const isComparison = activeBtn && activeBtn.dataset.station === 'compare';
            
            // Title
            doc.setFontSize(20);
            doc.text('Værdata Voss - Normalverdier', 14, 20);
            doc.setFontSize(10);
            doc.text('Periode: 1991-2020', 14, 28);
            doc.text(`Kilde: Meteorologisk Institutt`, 14, 34);
            doc.text(`Generert: ${new Date().toLocaleString('no-NO')}`, 14, 40);
            
            if (isComparison) {
                // Comparison mode - show both stations
                this.exportComparisonPDF(doc);
            } else {
                // Single station mode
                this.exportSingleStationPDF(doc);
            }
            
            // Save PDF
            const fileName = isComparison 
                ? 'Voss_Værdata_Sammenligning.pdf' 
                : `Voss_Værdata_${weatherData[this.currentStation].name}.pdf`;
            doc.save(fileName);
            
            hideLoading();
        } catch (error) {
            console.error('Error exporting PDF:', error);
            showError('Kunne ikke eksportere PDF');
            hideLoading();
        }
    }
    
    exportSingleStationPDF(doc) {
        const data = weatherData[this.currentStation];
        
        // Station info
        doc.setFontSize(14);
        doc.text(`Stasjon: ${data.name}`, 14, 50);
        doc.setFontSize(10);
        doc.text(`Høyde: ${data.elevation} | Stasjon ID: ${data.stationId}`, 14, 56);
        
        // Summary statistics
        doc.setFontSize(12);
        doc.text('Årsoversikt', 14, 66);
        const summaryData = [
            ['Årsmiddeltemperatur', `${data.yearlyTemp.toFixed(1)}°C`],
            ['Total årsnedbør', `${data.yearlyPrecip} mm`]
        ];
        
        doc.autoTable({
            startY: 70,
            head: [['Parameter', 'Verdi']],
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            margin: { left: 14, right: 14 }
        });
        
        // Monthly temperature data
        let finalY = doc.lastAutoTable.finalY + 10;
        doc.setFontSize(12);
        doc.text('Månedlig Normaltemperatur', 14, finalY);
        
        const tempData = monthNames.map((month, idx) => [
            month,
            `${data.monthlyTemp[idx].toFixed(1)}°C`
        ]);
        
        doc.autoTable({
            startY: finalY + 5,
            head: [['Måned', 'Temperatur']],
            body: tempData,
            theme: 'grid',
            headStyles: { fillColor: [239, 68, 68] },
            margin: { left: 14, right: 105 },
            tableWidth: 85
        });
        
        // Monthly precipitation data (next to temperature)
        doc.setFontSize(12);
        doc.text('Månedlig Normalnedbør', 109, finalY);
        
        const precipData = monthNames.map((month, idx) => [
            month,
            `${data.monthlyPrecip[idx]} mm`
        ]);
        
        doc.autoTable({
            startY: finalY + 5,
            head: [['Måned', 'Nedbør']],
            body: precipData,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            margin: { left: 109, right: 14 },
            tableWidth: 85
        });
        
        // Add charts as images
        finalY = Math.max(doc.lastAutoTable.finalY || 0, doc.previousAutoTable?.finalY || 0) + 10;
        
        if (finalY > 220) {
            doc.addPage();
            finalY = 20;
        }
        
        doc.setFontSize(12);
        doc.text('Temperaturprofil', 14, finalY);
        const tempCanvas = document.getElementById('tempChart');
        if (tempCanvas) {
            const tempImg = tempCanvas.toDataURL('image/png');
            doc.addImage(tempImg, 'PNG', 14, finalY + 5, 180, 70);
            finalY += 80;
        }
        
        if (finalY > 200) {
            doc.addPage();
            finalY = 20;
        }
        
        doc.setFontSize(12);
        doc.text('Nedbørprofil', 14, finalY);
        const precipCanvas = document.getElementById('precipChart');
        if (precipCanvas) {
            const precipImg = precipCanvas.toDataURL('image/png');
            doc.addImage(precipImg, 'PNG', 14, finalY + 5, 180, 70);
        }
    }
    
    exportComparisonPDF(doc) {
        const voss = weatherData.vossevangen;
        const bulk = weatherData.bulken;
        
        // Title for comparison
        doc.setFontSize(14);
        doc.text('Sammenligning: Vossevangen vs Bulken', 14, 50);
        
        // Summary comparison
        doc.setFontSize(12);
        doc.text('Årsoversikt', 14, 60);
        
        const summaryData = [
            ['', voss.name, bulk.name, 'Differanse'],
            ['Høyde', voss.elevation, bulk.elevation, '-'],
            ['Årsmiddeltemperatur', `${voss.yearlyTemp.toFixed(1)}°C`, `${bulk.yearlyTemp.toFixed(1)}°C`, `${(voss.yearlyTemp - bulk.yearlyTemp).toFixed(1)}°C`],
            ['Årsnedbør', `${voss.yearlyPrecip} mm`, `${bulk.yearlyPrecip} mm`, `${bulk.yearlyPrecip - voss.yearlyPrecip} mm (+${((bulk.yearlyPrecip / voss.yearlyPrecip - 1) * 100).toFixed(0)}%)`]
        ];
        
        doc.autoTable({
            startY: 65,
            body: summaryData,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            margin: { left: 14, right: 14 },
            columnStyles: {
                0: { fontStyle: 'bold' }
            }
        });
        
        // Monthly comparison table
        let finalY = doc.lastAutoTable.finalY + 10;
        if (finalY > 200) {
            doc.addPage();
            finalY = 20;
        }
        
        doc.setFontSize(12);
        doc.text('Månedlig Temperatursammenligning', 14, finalY);
        
        const tempCompareData = monthNames.map((month, idx) => [
            month,
            `${voss.monthlyTemp[idx].toFixed(1)}°C`,
            `${bulk.monthlyTemp[idx].toFixed(1)}°C`,
            `${(voss.monthlyTemp[idx] - bulk.monthlyTemp[idx]).toFixed(1)}°C`
        ]);
        
        doc.autoTable({
            startY: finalY + 5,
            head: [['Måned', voss.name, bulk.name, 'Diff']],
            body: tempCompareData,
            theme: 'grid',
            headStyles: { fillColor: [239, 68, 68] },
            margin: { left: 14, right: 14 }
        });
        
        // Precipitation comparison
        finalY = doc.lastAutoTable.finalY + 10;
        if (finalY > 200) {
            doc.addPage();
            finalY = 20;
        }
        
        doc.setFontSize(12);
        doc.text('Månedlig Nedbørsammenligning', 14, finalY);
        
        const precipCompareData = monthNames.map((month, idx) => [
            month,
            `${voss.monthlyPrecip[idx]} mm`,
            `${bulk.monthlyPrecip[idx]} mm`,
            `${bulk.monthlyPrecip[idx] - voss.monthlyPrecip[idx]} mm`
        ]);
        
        doc.autoTable({
            startY: finalY + 5,
            head: [['Måned', voss.name, bulk.name, 'Diff']],
            body: precipCompareData,
            theme: 'grid',
            headStyles: { fillColor: [59, 130, 246] },
            margin: { left: 14, right: 14 }
        });
        
        // Add comparison charts
        finalY = doc.lastAutoTable.finalY + 10;
        if (finalY > 200) {
            doc.addPage();
            finalY = 20;
        }
        
        doc.setFontSize(12);
        doc.text('Temperatursammenligning', 14, finalY);
        const tempCanvas = document.getElementById('tempChart');
        if (tempCanvas) {
            const tempImg = tempCanvas.toDataURL('image/png');
            doc.addImage(tempImg, 'PNG', 14, finalY + 5, 180, 70);
            finalY += 80;
        }
        
        if (finalY > 200) {
            doc.addPage();
            finalY = 20;
        }
        
        doc.setFontSize(12);
        doc.text('Nedbørsammenligning', 14, finalY);
        const precipCanvas = document.getElementById('precipChart');
        if (precipCanvas) {
            const precipImg = precipCanvas.toDataURL('image/png');
            doc.addImage(precipImg, 'PNG', 14, finalY + 5, 180, 70);
        }
    }
}

