// ==================== Main Application ====================

class GPSTrackViewer {
    constructor() {
        this.mapController = new MapController();
        this.chartController = new ChartController();
        this.currentTrackData = null;
        this.playbackInterval = null;
        this.playbackIndex = 0;
        this.isPlaying = false;
        
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
            // For now, handle the first file
            const file = files[0];
            const extension = file.name.split('.').pop().toLowerCase();

            let trackData;
            if (extension === 'gpx') {
                trackData = await parseGPX(file);
            } else if (extension === 'jps') {
                trackData = await parseJPS(file);
            } else {
                throw new Error('Ugyldig filformat. Støtter kun .gpx og .jps filer.');
            }

            this.loadTrackData(trackData);
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
        this.currentTrackData = trackData;

        // Hide upload area, show stats panel
        this.showStatsPanel();

        // Display track on map
        this.mapController.displayTrack(trackData.points);

        // Calculate and display statistics
        const stats = calculateStatistics(trackData.points);
        this.displayStatistics(stats);

        // Initialize charts
        this.chartController.initCharts(trackData.points);

        // Setup playback
        this.setupPlayback(trackData.points.length);
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

