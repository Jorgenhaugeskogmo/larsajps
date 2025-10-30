// ==================== Map Controller ====================

class MapController {
    constructor() {
        this.map = null;
        this.trackLayer = null;
        this.startMarker = null;
        this.endMarker = null;
        this.playbackMarker = null;
        this.colorMode = 'speed';
        this.currentPoints = null;
    }

    /**
     * Initialize map
     */
    initMap() {
        // Create map centered on Norway
        this.map = L.map('map', {
            zoomControl: true,
            attributionControl: true
        }).setView([60.472, 8.469], 6);

        // Add tile layer
        const isDark = document.documentElement.dataset.theme === 'dark';
        this.currentLayerType = 'street';
        this.updateTileLayer(isDark, this.currentLayerType);

        return this.map;
    }

    /**
     * Update tile layer based on theme and layer type
     */
    updateTileLayer(isDark, layerType = 'street') {
        if (this.tileLayer) {
            this.map.removeLayer(this.tileLayer);
        }

        this.currentLayerType = layerType;

        if (layerType === 'satellite') {
            // Satellite imagery from Esri
            this.tileLayer = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '© <a href="https://www.esri.com/">Esri</a>',
                maxZoom: 19
            });
        } else if (layerType === 'hybrid') {
            // Satellite with labels
            const satellite = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
                attribution: '© <a href="https://www.esri.com/">Esri</a>',
                maxZoom: 19
            });
            const labels = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager_only_labels/{z}/{x}/{y}{r}.png', {
                attribution: '© <a href="https://carto.com/attributions">CARTO</a>',
                maxZoom: 19,
                pane: 'overlayPane'
            });
            this.tileLayer = L.layerGroup([satellite, labels]);
        } else {
            // Street map
            if (isDark) {
                this.tileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
                    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors © <a href="https://carto.com/attributions">CARTO</a>',
                    maxZoom: 19
                });
            } else {
                this.tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
                    maxZoom: 19
                });
            }
        }

        this.tileLayer.addTo(this.map);
    }

    /**
     * Display track on map
     */
    displayTrack(points, colorMode = 'speed') {
        this.currentPoints = points;
        this.colorMode = colorMode;
        
        // Clear existing layers
        this.clearTrack();

        // Get min/max values for coloring
        let values, min, max;
        if (colorMode === 'speed') {
            values = points.map(p => p.speed || 0);
            min = Math.min(...values);
            max = Math.max(...values);
        } else if (colorMode === 'elevation') {
            values = points.map(p => p.elevation || 0);
            min = Math.min(...values);
            max = Math.max(...values);
        } else if (colorMode === 'accuracy') {
            values = points.map(p => p.hdop || 1);
            min = Math.min(...values);
            max = Math.max(...values);
        }

        // Create colored segments
        const segments = [];
        for (let i = 1; i < points.length; i++) {
            const value = values[i];
            const color = getColorForValue(value, min, max, colorMode);
            
            const segment = L.polyline([
                [points[i - 1].lat, points[i - 1].lon],
                [points[i].lat, points[i].lon]
            ], {
                color: color,
                weight: 4,
                opacity: 0.8
            });

            // Add popup with data
            segment.bindPopup(this.createPopupContent(points[i], i));
            segments.push(segment);
        }

        // Add all segments to a layer group
        this.trackLayer = L.layerGroup(segments).addTo(this.map);

        // Add start marker
        const startIcon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    background: #10b981;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                "></div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        this.startMarker = L.marker([points[0].lat, points[0].lon], { icon: startIcon })
            .addTo(this.map)
            .bindPopup('<b>Start</b><br>' + this.formatTime(points[0].time));

        // Add end marker
        const endIcon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    background: #ef4444;
                    width: 24px;
                    height: 24px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.3);
                "></div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
        });

        const lastPoint = points[points.length - 1];
        this.endMarker = L.marker([lastPoint.lat, lastPoint.lon], { icon: endIcon })
            .addTo(this.map)
            .bindPopup('<b>Slutt</b><br>' + this.formatTime(lastPoint.time));

        // Fit map to track bounds
        const bounds = L.latLngBounds(points.map(p => [p.lat, p.lon]));
        this.map.fitBounds(bounds, { padding: [50, 50] });
    }

    /**
     * Create popup content for a point
     */
    createPopupContent(point, index) {
        let content = `<div style="font-size: 13px; line-height: 1.6;">`;
        content += `<b>Punkt ${index + 1}</b><br>`;
        
        if (point.time) {
            content += `<b>Tid:</b> ${this.formatTime(point.time)}<br>`;
        }
        
        if (point.speed !== null) {
            content += `<b>Hastighet:</b> ${formatSpeed(point.speed)}<br>`;
        }
        
        if (point.elevation !== null) {
            content += `<b>Høyde:</b> ${formatElevation(point.elevation)}<br>`;
        }
        
        if (point.course !== null) {
            content += `<b>Retning:</b> ${Math.round(point.course)}°<br>`;
        }
        
        if (point.hdop !== null) {
            content += `<b>HDOP:</b> ${point.hdop.toFixed(2)}<br>`;
        }
        
        if (point.satellites !== null) {
            content += `<b>Satellitter:</b> ${point.satellites}<br>`;
        }
        
        content += `<small style="color: #64748b;">Lat: ${point.lat.toFixed(6)}, Lon: ${point.lon.toFixed(6)}</small>`;
        content += `</div>`;
        
        return content;
    }

    /**
     * Format time for display
     */
    formatTime(date) {
        if (!date) return '-';
        return date.toLocaleTimeString('no-NO', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
    }

    /**
     * Update track color mode
     */
    updateColorMode(mode) {
        if (this.currentPoints) {
            this.displayTrack(this.currentPoints, mode);
        }
    }

    /**
     * Show playback marker at specific point
     */
    showPlaybackMarker(pointIndex) {
        if (!this.currentPoints || pointIndex >= this.currentPoints.length) return;

        const point = this.currentPoints[pointIndex];

        if (!this.playbackMarker) {
            const icon = L.divIcon({
                className: 'playback-marker',
                html: `
                    <div style="
                        background: #3b82f6;
                        width: 16px;
                        height: 16px;
                        border-radius: 50%;
                        border: 3px solid white;
                        box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.3), 0 2px 8px rgba(0,0,0,0.3);
                        animation: pulse 2s ease-in-out infinite;
                    "></div>
                    <style>
                        @keyframes pulse {
                            0%, 100% { transform: scale(1); }
                            50% { transform: scale(1.2); }
                        }
                    </style>
                `,
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            });

            this.playbackMarker = L.marker([point.lat, point.lon], { icon })
                .addTo(this.map);
        } else {
            this.playbackMarker.setLatLng([point.lat, point.lon]);
        }

        // Update popup
        this.playbackMarker.bindPopup(this.createPopupContent(point, pointIndex));
        
        // Pan to marker
        this.map.panTo([point.lat, point.lon], { animate: true, duration: 0.5 });
    }

    /**
     * Hide playback marker
     */
    hidePlaybackMarker() {
        if (this.playbackMarker) {
            this.map.removeLayer(this.playbackMarker);
            this.playbackMarker = null;
        }
    }

    /**
     * Clear track from map
     */
    clearTrack() {
        if (this.trackLayer) {
            this.map.removeLayer(this.trackLayer);
            this.trackLayer = null;
        }

        if (this.startMarker) {
            this.map.removeLayer(this.startMarker);
            this.startMarker = null;
        }

        if (this.endMarker) {
            this.map.removeLayer(this.endMarker);
            this.endMarker = null;
        }

        this.hidePlaybackMarker();
    }

    /**
     * Display a single layer with specific color
     */
    displayLayer(points, color, layerId) {
        if (!this.layers) {
            this.layers = {};
        }

        // Create polyline segments with popups
        const segments = [];
        for (let i = 0; i < points.length - 1; i++) {
            const segment = L.polyline([
                [points[i].lat, points[i].lon],
                [points[i + 1].lat, points[i + 1].lon]
            ], {
                color: color,
                weight: 4,
                opacity: 0.8
            });
            segment.bindPopup(this.createPopupContent(points[i + 1], i + 1));
            segments.push(segment);
        }

        const polylineGroup = L.layerGroup(segments);

        // Add start marker
        const startIcon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    background: ${color};
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                "></div>
            `,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
        });

        const startMarker = L.marker([points[0].lat, points[0].lon], { icon: startIcon })
            .bindPopup('<b>Start</b><br>' + this.formatTime(points[0].time));

        // Add end marker
        const endIcon = L.divIcon({
            className: 'custom-marker',
            html: `
                <div style="
                    background: ${color};
                    width: 18px;
                    height: 18px;
                    border-radius: 50%;
                    border: 2px solid white;
                    box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                    opacity: 0.7;
                "></div>
            `,
            iconSize: [18, 18],
            iconAnchor: [9, 9]
        });

        const endMarker = L.marker([points[points.length - 1].lat, points[points.length - 1].lon], { icon: endIcon })
            .bindPopup('<b>Slutt</b><br>' + this.formatTime(points[points.length - 1].time));

        // Add to map
        polylineGroup.addTo(this.map);
        startMarker.addTo(this.map);
        endMarker.addTo(this.map);

        // Store layer reference
        this.layers[layerId] = {
            polylineGroup,
            startMarker,
            endMarker,
            points
        };
    }

    /**
     * Clear all layers
     */
    clearAllLayers() {
        if (this.layers) {
            Object.values(this.layers).forEach(layer => {
                if (layer.polylineGroup) this.map.removeLayer(layer.polylineGroup);
                if (layer.startMarker) this.map.removeLayer(layer.startMarker);
                if (layer.endMarker) this.map.removeLayer(layer.endMarker);
            });
            this.layers = {};
        }

        // Clear single track layers too
        this.clearTrack();
    }

    /**
     * Fit map bounds to show all points
     */
    fitBounds(points) {
        if (points && points.length > 0) {
            const bounds = L.latLngBounds(points.map(p => [p.lat, p.lon]));
            this.map.fitBounds(bounds, { padding: [50, 50] });
        }
    }

    /**
     * Reset map view
     */
    reset() {
        this.clearAllLayers();
        this.map.setView([60.472, 8.469], 6);
    }
}

