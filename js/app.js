// ==================== Main Application ====================

class GPSTrackViewer {
    constructor() {
        this.mapController = new MapController();
        this.chartController = new ChartController();
        this.cesiumController = new CesiumController();
        this.weatherController = new WeatherController();
        this.currentTrackData = null;
        this.layers = []; // Store multiple tracks as layers
        this.layerColors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
        this.playbackInterval = null;
        this.playbackIndex = 0;
        this.isPlaying = false;
        this.is3DMode = false;
        this.flightCellData = { gps: null, flight: null }; // Store separate FlightCell files
        
        this.init();
    }

    /**
     * Initialize application
     */
    init() {
        // Initialize map
        this.mapController.initMap();

        // Setup event listeners
        this.setupEventListeners();

        // Load theme preference
        this.loadTheme();

        // Show upload area initially
        this.showUploadArea();
    }

    /**
     * Setup all event listeners
     */
    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Load example data
        document.getElementById('loadExample').addEventListener('click', () => {
            this.loadExampleData();
        });

        // File input
        const fileInput = document.getElementById('fileInput');
        fileInput.addEventListener('change', (e) => {
            this.handleFiles(e.target.files);
        });

        // Drag and drop
        const uploadArea = document.getElementById('uploadArea');
        
        uploadArea.addEventListener('click', () => {
            fileInput.click();
        });

        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('drag-over');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('drag-over');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('drag-over');
            this.handleFiles(e.dataTransfer.files);
        });

        // Map layer selector
        document.getElementById('mapLayer').addEventListener('change', (e) => {
            const isDark = document.documentElement.dataset.theme === 'dark';
            this.mapController.updateTileLayer(isDark, e.target.value);
        });

        // Color mode selector
        document.getElementById('colorMode').addEventListener('change', (e) => {
            this.mapController.updateColorMode(e.target.value);
        });

        // 3D View toggle
        document.getElementById('toggle3DBtn').addEventListener('click', () => {
            this.toggle3DView();
        });

        // Layers panel
        document.getElementById('layersBtn').addEventListener('click', () => {
            this.toggleLayersPanel();
        });

        document.getElementById('closeLayersBtn').addEventListener('click', () => {
            this.toggleLayersPanel();
        });

        document.getElementById('addLayerBtn').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('clearAllLayersBtn').addEventListener('click', () => {
            this.clearAllLayers();
        });

        // Export PDF button
        document.getElementById('exportPdfBtn').addEventListener('click', () => {
            this.exportToPDF();
        });

        // Playback controls
        const playPauseBtn = document.getElementById('playPauseBtn');
        playPauseBtn.addEventListener('click', () => {
            this.togglePlayback();
        });

        const playbackSlider = document.getElementById('playbackSlider');
        playbackSlider.addEventListener('input', (e) => {
            if (this.currentTrackData) {
                this.playbackIndex = parseInt(e.target.value);
                this.updatePlaybackPosition();
            }
        });
    }

    /**
     * Handle file uploads
     */
    async handleFiles(files) {
        if (files.length === 0) return;

        showLoading();

        try {
            // Handle multiple files for FlightCell (GPS + Flight data)
            const fileArray = Array.from(files);
            let trackData = null;

            // Check if we have FlightCell log files
            const logFiles = fileArray.filter(f => f.name.endsWith('.log'));
            
            if (logFiles.length > 0) {
                // Handle FlightCell log files
                for (const file of logFiles) {
                    const content = await file.text();
                    const logType = detectFlightCellLogType(content);
                    
                    if (logType === 'gps') {
                        this.flightCellData.gps = parseFlightCellGPS(content);
                        this.flightCellData.gps.name = file.name;
                    } else if (logType === 'flight') {
                        this.flightCellData.flight = parseFlightCellFlightData(content);
                    }
                }
                
                // If we have GPS data, use it (optionally merge with flight data)
                if (this.flightCellData.gps) {
                    trackData = this.flightCellData.gps;
                    
                    // Merge with flight data if available
                    if (this.flightCellData.flight) {
                        trackData.points = mergeFlightCellData(
                            this.flightCellData.gps.points,
                            this.flightCellData.flight
                        );
                        trackData.hasOrientation = true;
                    }
                }
            } else {
                // Handle regular GPS files (GPX or JPS)
                const file = files[0];
                const extension = file.name.split('.').pop().toLowerCase();

                if (extension === 'gpx') {
                    trackData = await parseGPX(file);
                } else if (extension === 'jps') {
                    trackData = await parseJPS(file);
                } else {
                    throw new Error('Ugyldig filformat. Støtter kun .gpx, .jps og .log filer.');
                }
            }

            if (trackData && trackData.points && trackData.points.length > 0) {
                this.loadTrackData(trackData);
            } else {
                throw new Error('Kunne ikke laste data fra filen(e). Ingen gyldige GPS-punkter funnet.');
            }
        } catch (error) {
            console.error('Error loading file:', error);
            showError(error.message || 'Feil ved lasting av fil');
        } finally {
            hideLoading();
        }
    }

    /**
     * Load example data
     */
    async loadExampleData() {
        showLoading();

        try {
            // Load the example GPX file
            const response = await fetch('input/log0408d.gpx');
            if (!response.ok) {
                throw new Error('Kunne ikke laste eksempeldata');
            }

            const text = await response.text();
            const blob = new Blob([text], { type: 'application/gpx+xml' });
            const file = new File([blob], 'log0408d.gpx', { type: 'application/gpx+xml' });

            const trackData = await parseGPX(file);
            this.loadTrackData(trackData);
        } catch (error) {
            console.error('Error loading example data:', error);
            showError('Kunne ikke laste eksempeldata');
        } finally {
            hideLoading();
        }
    }

    /**
     * Load and display track data
     */
    loadTrackData(trackData) {
        // Add as a new layer
        this.addLayer(trackData);
    }

    /**
     * Add a new layer
     */
    async addLayer(trackData) {
        // Validate track data
        if (!trackData || !trackData.points || trackData.points.length === 0) {
            console.error('Cannot add layer: no valid points');
            showError('Ingen gyldige GPS-punkter funnet i filen');
            return;
        }

        const layerId = Date.now();
        const colorIndex = this.layers.length % this.layerColors.length;
        
        const layer = {
            id: layerId,
            data: trackData,
            visible: true,
            color: this.layerColors[colorIndex],
            name: trackData.name || `Spor ${this.layers.length + 1}`
        };
        
        this.layers.push(layer);
        this.currentTrackData = trackData; // Set as current for stats/charts
        
        // Hide upload area, show panels
        this.showStatsPanel();
        
        // Show layers button
        document.getElementById('layersBtn').style.display = 'block';
        document.getElementById('toggle3DBtn').style.display = this.has3DCapableLayer() ? 'block' : 'none';
        
        // Update layer count
        this.updateLayerCount();
        
        // Render layer in UI
        this.renderLayers();
        
        // Display all visible layers
        await this.displayAllLayers();
        
        // Update stats and charts for current track
        const stats = calculateStatistics(trackData.points);
        this.displayStatistics(stats);
        this.chartController.initCharts(trackData.points);
        this.setupPlayback(trackData.points.length);
    }

    /**
     * Check if any layer has 3D capability
     */
    has3DCapableLayer() {
        return this.layers.some(layer => 
            layer.data.hasOrientation || layer.data.type === 'flightcell'
        );
    }

    /**
     * Display all visible layers on map/3D
     */
    async displayAllLayers() {
        if (this.is3DMode) {
            // Display in 3D
            this.cesiumController.clear();
            for (const layer of this.layers) {
                if (layer.visible) {
                    await this.cesiumController.displayTrack(layer.data, layer.color);
                }
            }
        } else {
            // Display in 2D
            this.mapController.clearAllLayers();
            this.layers.forEach(layer => {
                if (layer.visible) {
                    this.mapController.displayLayer(layer.data.points, layer.color, layer.id);
                }
            });
            
            // Fit bounds to show all layers
            if (this.layers.length > 0) {
                const allPoints = this.layers
                    .filter(l => l.visible)
                    .flatMap(l => l.data.points);
                this.mapController.fitBounds(allPoints);
            }
        }
    }

    /**
     * Render layers list in UI
     */
    renderLayers() {
        const layersList = document.getElementById('layersList');
        layersList.innerHTML = '';
        
        this.layers.forEach(layer => {
            const layerItem = document.createElement('div');
            layerItem.className = 'layer-item';
            layerItem.innerHTML = `
                <div class="layer-color" style="background-color: ${layer.color};"></div>
                <div class="layer-info">
                    <div class="layer-name">${layer.name}</div>
                    <div class="layer-stats">${layer.data.points.length} punkter</div>
                </div>
                <div class="layer-actions">
                    <button class="icon-btn" data-action="toggle" data-layer-id="${layer.id}" title="${layer.visible ? 'Skjul' : 'Vis'}">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            ${layer.visible ? 
                                '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>' :
                                '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>'
                            }
                        </svg>
                    </button>
                    <button class="icon-btn" data-action="remove" data-layer-id="${layer.id}" title="Fjern">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="3 6 5 6 21 6"/>
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                        </svg>
                    </button>
                </div>
            `;
            
            // Add event listeners
            const toggleBtn = layerItem.querySelector('[data-action="toggle"]');
            const removeBtn = layerItem.querySelector('[data-action="remove"]');
            
            toggleBtn.addEventListener('click', () => this.toggleLayer(layer.id));
            removeBtn.addEventListener('click', () => this.removeLayer(layer.id));
            
            layersList.appendChild(layerItem);
        });
    }

    /**
     * Toggle layer visibility
     */
    async toggleLayer(layerId) {
        const layer = this.layers.find(l => l.id === layerId);
        if (layer) {
            layer.visible = !layer.visible;
            this.renderLayers();
            await this.displayAllLayers();
        }
    }

    /**
     * Remove a layer
     */
    async removeLayer(layerId) {
        const index = this.layers.findIndex(l => l.id === layerId);
        if (index !== -1) {
            this.layers.splice(index, 1);
            this.updateLayerCount();
            this.renderLayers();
            await this.displayAllLayers();
            
            // Update current track if needed
            if (this.layers.length > 0) {
                this.currentTrackData = this.layers[this.layers.length - 1].data;
                const stats = calculateStatistics(this.currentTrackData.points);
                this.displayStatistics(stats);
                this.chartController.initCharts(this.currentTrackData.points);
            } else {
                // No layers left, show upload area
                this.showUploadArea();
                document.getElementById('layersBtn').style.display = 'none';
                document.getElementById('toggle3DBtn').style.display = 'none';
            }
        }
    }

    /**
     * Clear all layers
     */
    clearAllLayers() {
        if (confirm('Er du sikker på at du vil fjerne alle spor?')) {
            this.layers = [];
            this.mapController.clearAllLayers();
            this.cesiumController.clear();
            this.showUploadArea();
            this.updateLayerCount();
            this.renderLayers();
            document.getElementById('layersBtn').style.display = 'none';
            document.getElementById('toggle3DBtn').style.display = 'none';
            document.getElementById('layersPanel').style.display = 'none';
        }
    }

    /**
     * Update layer count in UI
     */
    updateLayerCount() {
        document.getElementById('layerCount').textContent = this.layers.length;
    }

    /**
     * Toggle layers panel
     */
    toggleLayersPanel() {
        const panel = document.getElementById('layersPanel');
        panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
    }

    /**
     * Toggle between 2D and 3D view
     */
    async toggle3DView() {
        if (this.layers.length === 0) return;

        this.is3DMode = !this.is3DMode;
        const toggle3DBtn = document.getElementById('toggle3DBtn');

        if (this.is3DMode) {
            // Switch to 3D
            await this.cesiumController.show();
            await this.displayAllLayers();
            toggle3DBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M12 2v20M2 12h20"/>
                </svg>
                2D Visning
            `;
        } else {
            // Switch to 2D
            this.cesiumController.hide();
            await this.displayAllLayers();
            toggle3DBtn.innerHTML = `
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                    <path d="M2 17l10 5 10-5"/>
                    <path d="M2 12l10 5 10-5"/>
                </svg>
                3D Visning
            `;
        }
    }

    /**
     * Display statistics
     */
    displayStatistics(stats) {
        document.getElementById('statDistance').textContent = formatDistance(stats.distance);
        document.getElementById('statDuration').textContent = formatDuration(stats.duration);
        document.getElementById('statAvgSpeed').textContent = formatSpeed(stats.avgSpeed);
        document.getElementById('statMaxSpeed').textContent = formatSpeed(stats.maxSpeed);
        document.getElementById('statMaxElevation').textContent = formatElevation(stats.maxElevation);
        document.getElementById('statMinElevation').textContent = formatElevation(stats.minElevation);
        document.getElementById('statElevationGain').textContent = formatElevation(stats.elevationGain);
        document.getElementById('statPoints').textContent = stats.pointCount.toLocaleString('no-NO');
        
        // Satellites
        document.getElementById('statMinSatellites').textContent = formatSatellites(stats.minSatellites);
        document.getElementById('statAvgSatellites').textContent = stats.avgSatellites ? stats.avgSatellites.toFixed(1) : '-';
        document.getElementById('statMaxSatellites').textContent = formatSatellites(stats.maxSatellites);
        
        // HDOP
        document.getElementById('statMinHDOP').textContent = formatDOP(stats.minHDOP);
        document.getElementById('statAvgHDOP').textContent = formatDOP(stats.avgHDOP);
        document.getElementById('statMaxHDOP').textContent = formatDOP(stats.maxHDOP);
        
        // VDOP
        document.getElementById('statMinVDOP').textContent = formatDOP(stats.minVDOP);
        document.getElementById('statAvgVDOP').textContent = formatDOP(stats.avgVDOP);
        document.getElementById('statMaxVDOP').textContent = formatDOP(stats.maxVDOP);
        
        // PDOP
        document.getElementById('statMinPDOP').textContent = formatDOP(stats.minPDOP);
        document.getElementById('statAvgPDOP').textContent = formatDOP(stats.avgPDOP);
        document.getElementById('statMaxPDOP').textContent = formatDOP(stats.maxPDOP);
        
        // HPL
        document.getElementById('statMinHPL').textContent = formatProtectionLevel(stats.minHPL);
        document.getElementById('statAvgHPL').textContent = formatProtectionLevel(stats.avgHPL);
        document.getElementById('statMaxHPL').textContent = formatProtectionLevel(stats.maxHPL);
        
        // VPL
        document.getElementById('statMinVPL').textContent = formatProtectionLevel(stats.minVPL);
        document.getElementById('statAvgVPL').textContent = formatProtectionLevel(stats.avgVPL);
        document.getElementById('statMaxVPL').textContent = formatProtectionLevel(stats.maxVPL);
    }

    /**
     * Setup playback controls
     */
    setupPlayback(pointCount) {
        const playbackSlider = document.getElementById('playbackSlider');
        playbackSlider.max = pointCount - 1;
        playbackSlider.value = 0;
        this.playbackIndex = 0;

        document.getElementById('playbackPanel').style.display = 'flex';
    }

    /**
     * Toggle playback
     */
    togglePlayback() {
        if (this.isPlaying) {
            this.pausePlayback();
        } else {
            this.startPlayback();
        }
    }

    /**
     * Start playback
     */
    startPlayback() {
        this.isPlaying = true;
        document.getElementById('playPauseBtn').classList.add('playing');

        this.playbackInterval = setInterval(() => {
            if (this.playbackIndex >= this.currentTrackData.points.length - 1) {
                this.pausePlayback();
                this.playbackIndex = 0;
                return;
            }

            this.playbackIndex++;
            this.updatePlaybackPosition();
        }, 100); // Update every 100ms
    }

    /**
     * Pause playback
     */
    pausePlayback() {
        this.isPlaying = false;
        document.getElementById('playPauseBtn').classList.remove('playing');

        if (this.playbackInterval) {
            clearInterval(this.playbackInterval);
            this.playbackInterval = null;
        }
    }

    /**
     * Update playback position
     */
    updatePlaybackPosition() {
        const playbackSlider = document.getElementById('playbackSlider');
        playbackSlider.value = this.playbackIndex;

        // Update marker on map
        this.mapController.showPlaybackMarker(this.playbackIndex);

        // Update time display
        const point = this.currentTrackData.points[this.playbackIndex];
        const startTime = this.currentTrackData.points[0].time;
        const elapsed = (point.time - startTime) / 1000;
        document.getElementById('playbackTime').textContent = formatDuration(elapsed);
    }

    /**
     * Show upload area
     */
    showUploadArea() {
        document.getElementById('uploadArea').style.display = 'block';
        document.getElementById('statsPanel').style.display = 'none';
        document.getElementById('playbackPanel').style.display = 'none';
    }

    /**
     * Show stats panel
     */
    showStatsPanel() {
        document.getElementById('uploadArea').style.display = 'none';
        document.getElementById('statsPanel').style.display = 'block';
    }

    /**
     * Export data to PDF
     */
    async exportToPDF() {
        if (!this.currentTrackData) return;

        showLoading();

        try {
            const { jsPDF } = window.jspdf;
            const doc = new jsPDF();

            // Title
            doc.setFontSize(20);
            doc.text('GPS Track Rapport', 14, 20);
            
            doc.setFontSize(10);
            doc.text(`Fil: ${this.currentTrackData.name}`, 14, 28);
            doc.text(`Generert: ${new Date().toLocaleString('no-NO')}`, 14, 34);

            // Statistics table
            const stats = calculateStatistics(this.currentTrackData.points);
            
            doc.setFontSize(14);
            doc.text('Statistikk', 14, 45);

            const statsData = [
                ['Distanse', formatDistance(stats.distance)],
                ['Varighet', formatDuration(stats.duration)],
                ['Gjennomsnittshastighet', formatSpeed(stats.avgSpeed)],
                ['Maks hastighet', formatSpeed(stats.maxSpeed)],
                ['Høyeste punkt', formatElevation(stats.maxElevation)],
                ['Laveste punkt', formatElevation(stats.minElevation)],
                ['Total stigning', formatElevation(stats.elevationGain)],
                ['GPS-punkter', stats.pointCount.toLocaleString('no-NO')],
                ['', ''], // Separator
                ['Satellitter (min/avg/maks)', `${formatSatellites(stats.minSatellites)} / ${stats.avgSatellites ? stats.avgSatellites.toFixed(1) : '-'} / ${formatSatellites(stats.maxSatellites)}`],
                ['HDOP (min/avg/maks)', `${formatDOP(stats.minHDOP)} / ${formatDOP(stats.avgHDOP)} / ${formatDOP(stats.maxHDOP)}`],
                ['VDOP (min/avg/maks)', `${formatDOP(stats.minVDOP)} / ${formatDOP(stats.avgVDOP)} / ${formatDOP(stats.maxVDOP)}`],
                ['PDOP (min/avg/maks)', `${formatDOP(stats.minPDOP)} / ${formatDOP(stats.avgPDOP)} / ${formatDOP(stats.maxPDOP)}`],
                ['HPL (min/avg/maks)', `${formatProtectionLevel(stats.minHPL)} / ${formatProtectionLevel(stats.avgHPL)} / ${formatProtectionLevel(stats.maxHPL)}`],
                ['VPL (min/avg/maks)', `${formatProtectionLevel(stats.minVPL)} / ${formatProtectionLevel(stats.avgVPL)} / ${formatProtectionLevel(stats.maxVPL)}`]
            ];

            doc.autoTable({
                startY: 50,
                head: [['Parameter', 'Verdi']],
                body: statsData,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246] },
                margin: { left: 14, right: 14 }
            });

            // GPS Points table (sample first 50 points)
            let finalY = doc.lastAutoTable.finalY + 10;
            
            if (finalY > 250) {
                doc.addPage();
                finalY = 20;
            }

            doc.setFontSize(14);
            doc.text('GPS-punkter (første 50)', 14, finalY);

            const pointsData = this.currentTrackData.points.slice(0, 50).map((p, i) => [
                (i + 1).toString(),
                p.lat.toFixed(6),
                p.lon.toFixed(6),
                p.elevation ? `${Math.round(p.elevation * 3.28084)} ft` : '-',
                p.speed ? `${(p.speed * 1.94384).toFixed(1)} kn` : '-',
                p.time ? p.time.toLocaleTimeString('no-NO') : '-'
            ]);

            doc.autoTable({
                startY: finalY + 5,
                head: [['#', 'Bredde', 'Lengde', 'Høyde', 'Hastighet', 'Tid']],
                body: pointsData,
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246] },
                styles: { fontSize: 8 },
                margin: { left: 14, right: 14 }
            });

            // Add charts as images
            finalY = doc.lastAutoTable.finalY + 10;
            
            if (finalY > 220) {
                doc.addPage();
                finalY = 20;
            }

            doc.setFontSize(14);
            doc.text('Høydeprofil', 14, finalY);
            
            const elevationCanvas = document.getElementById('elevationChart');
            if (elevationCanvas) {
                const elevationImg = elevationCanvas.toDataURL('image/png');
                doc.addImage(elevationImg, 'PNG', 14, finalY + 5, 180, 60);
                finalY += 70;
            }

            if (finalY > 200) {
                doc.addPage();
                finalY = 20;
            }

            doc.setFontSize(14);
            doc.text('Hastighetsprofil', 14, finalY);
            
            const speedCanvas = document.getElementById('speedChart');
            if (speedCanvas) {
                const speedImg = speedCanvas.toDataURL('image/png');
                doc.addImage(speedImg, 'PNG', 14, finalY + 5, 180, 60);
            }

            // Save PDF
            const fileName = this.currentTrackData.name.replace(/\.[^/.]+$/, '') + '_rapport.pdf';
            doc.save(fileName);

            hideLoading();
        } catch (error) {
            console.error('Error exporting PDF:', error);
            showError('Kunne ikke eksportere PDF');
            hideLoading();
        }
    }

    /**
     * Toggle theme
     */
    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.dataset.theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.dataset.theme = newTheme;
        localStorage.setItem('theme', newTheme);

        // Update map tiles (maintain current layer type)
        const layerType = this.mapController.currentLayerType || 'street';
        this.mapController.updateTileLayer(newTheme === 'dark', layerType);
        
        // Update weather charts if modal is open
        this.weatherController.updateTheme();

        // Update charts
        this.chartController.updateTheme(newTheme === 'dark');
    }

    /**
     * Load theme preference
     */
    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.dataset.theme = savedTheme;

        // Update map tiles with default layer type
        this.mapController.updateTileLayer(savedTheme === 'dark', 'street');
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GPSTrackViewer();
});

