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

        // Color mode selector
        document.getElementById('colorMode').addEventListener('change', (e) => {
            this.mapController.updateColorMode(e.target.value);
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
        document.getElementById('statMaxSatellites').textContent = formatSatellites(stats.maxSatellites);
        document.getElementById('statHDOP').textContent = formatDOP(stats.bestHDOP);
        document.getElementById('statVDOP').textContent = formatDOP(stats.bestVDOP);
        document.getElementById('statPDOP').textContent = formatDOP(stats.bestPDOP);
        document.getElementById('statHPL').textContent = formatProtectionLevel(stats.bestHPL);
        document.getElementById('statVPL').textContent = formatProtectionLevel(stats.bestVPL);
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
     * Toggle theme
     */
    toggleTheme() {
        const html = document.documentElement;
        const currentTheme = html.dataset.theme;
        const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        html.dataset.theme = newTheme;
        localStorage.setItem('theme', newTheme);

        // Update map tiles
        this.mapController.updateTileLayer(newTheme === 'dark');

        // Update charts
        this.chartController.updateTheme(newTheme === 'dark');
    }

    /**
     * Load theme preference
     */
    loadTheme() {
        const savedTheme = localStorage.getItem('theme') || 'light';
        document.documentElement.dataset.theme = savedTheme;

        // Update map tiles
        this.mapController.updateTileLayer(savedTheme === 'dark');
    }
}

// Initialize application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new GPSTrackViewer();
});

