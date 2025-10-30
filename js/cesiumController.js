/**
 * Cesium Controller for 3D Visualization
 * Handles 3D map rendering with aircraft orientation
 */

class CesiumController {
    constructor() {
        this.viewer = null;
        this.currentEntity = null;
        this.trackData = null;
        this.isInitialized = false;
    }

    /**
     * Initialize Cesium viewer
     */
    initViewer() {
        if (this.isInitialized) return;

        try {
            // Set Cesium Ion access token (using default public token)
            Cesium.Ion.defaultAccessToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJqdGkiOiJlYWE1OWUxNy1mMWZiLTQzYjYtYTQ0OS1kMWFjYmFkNjczZTQiLCJpZCI6OTc3MjksImplzIjoxNjY3MzExMzI2fQ.qHgXl4Kswxw9fYmgJmHmdMn5jNMQKJDnxEqWFPl-aQE';

            // Create viewer with basic configuration
            this.viewer = new Cesium.Viewer('cesiumContainer', {
                animation: true,
                baseLayerPicker: true,
                fullscreenButton: true,
                vrButton: false,
                geocoder: false,
                homeButton: true,
                infoBox: true,
                sceneModePicker: true,
                selectionIndicator: true,
                timeline: true,
                navigationHelpButton: false,
                navigationInstructionsInitiallyVisible: false
            });

            // Try to add terrain provider if available
            try {
                if (Cesium.Terrain && Cesium.Terrain.fromWorldTerrain) {
                    this.viewer.terrainProvider = Cesium.Terrain.fromWorldTerrain();
                }
            } catch (e) {
                console.log('Terrain provider not available, using basic globe');
            }

            // Enable lighting based on sun/moon positions
            this.viewer.scene.globe.enableLighting = true;

            this.isInitialized = true;
        } catch (error) {
            console.error('Error initializing Cesium:', error);
            showError('Kunne ikke initialisere 3D-visning');
        }
    }

    /**
     * Display track in 3D
     * @param {object} trackData - Track data with points
     * @param {string} color - Hex color for the track (optional)
     */
    displayTrack(trackData, color = '#FFFF00') {
        if (!this.isInitialized) {
            this.initViewer();
        }

        if (!this.viewer) return;

        // Convert hex color to Cesium Color
        const cesiumColor = Cesium.Color.fromCssColorString(color);

        this.trackData = trackData;
        const points = trackData.points;

        if (!points || points.length === 0) {
            console.warn('No points to display in 3D');
            return;
        }

        // Filter out invalid points
        const validPoints = points.filter(p => p && p.lat !== undefined && p.lon !== undefined);
        if (validPoints.length === 0) {
            console.warn('No valid points with lat/lon for 3D display');
            return;
        }

        // Create path positions
        const positions = validPoints.map(p => 
            Cesium.Cartesian3.fromDegrees(p.lon, p.lat, p.elevation || 0)
        );

        // Create time-stamped positions for animation
        const startTime = Cesium.JulianDate.fromDate(validPoints[0].time);
        const stopTime = Cesium.JulianDate.fromDate(validPoints[validPoints.length - 1].time);

        // Create position property with timestamps
        const positionProperty = new Cesium.SampledPositionProperty();
        validPoints.forEach((point, index) => {
            const time = Cesium.JulianDate.fromDate(point.time);
            const position = Cesium.Cartesian3.fromDegrees(point.lon, point.lat, point.elevation || 0);
            positionProperty.addSample(time, position);
        });

        // Create orientation property for aircraft with pitch and roll
        const orientationProperty = new Cesium.VelocityOrientationProperty(positionProperty);

        // If we have pitch/roll data, create custom orientation
        if (validPoints.some(p => p.pitch !== null && p.pitch !== undefined)) {
            const customOrientation = new Cesium.SampledProperty(Cesium.Quaternion);
            
            validPoints.forEach(point => {
                if (point.pitch !== null && point.roll !== null) {
                    const time = Cesium.JulianDate.fromDate(point.time);
                    
                    // Convert pitch and roll from degrees to radians
                    const pitch = Cesium.Math.toRadians(point.pitch);
                    const roll = Cesium.Math.toRadians(point.roll);
                    const heading = point.heading ? Cesium.Math.toRadians(point.heading) : 0;
                    
                    // Create quaternion from heading, pitch, roll
                    const hpr = new Cesium.HeadingPitchRoll(heading, pitch, roll);
                    const quaternion = Cesium.Transforms.headingPitchRollQuaternion(
                        Cesium.Cartesian3.fromDegrees(point.lon, point.lat, point.elevation || 0),
                        hpr
                    );
                    
                    customOrientation.addSample(time, quaternion);
                }
            });
            
            orientationProperty.setValue = customOrientation.getValue.bind(customOrientation);
        }

        // Create aircraft entity
        this.currentEntity = this.viewer.entities.add({
            availability: new Cesium.TimeIntervalCollection([
                new Cesium.TimeInterval({
                    start: startTime,
                    stop: stopTime
                })
            ]),
            position: positionProperty,
            orientation: orientationProperty,
            
            // Aircraft model (using built-in Cesium airplane or simple shape)
            model: {
                uri: 'data:image/svg+xml;base64,' + btoa(this.createHelicopterSVG()),
                minimumPixelSize: 64,
                maximumScale: 2000
            },
            
            // Fallback to a simple shape if model fails
            point: {
                pixelSize: 10,
                color: Cesium.Color.RED,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2
            },
            
            // Path line
            path: {
                resolution: 1,
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.2,
                    color: cesiumColor
                }),
                width: 3,
                leadTime: 0,
                trailTime: 100000 // Show trail behind
            },
            
            label: {
                text: trackData.name,
                font: '14pt sans-serif',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -20)
            },
            
            description: this.createEntityDescription(trackData)
        });

        // Draw the full path as a polyline
        this.viewer.entities.add({
            polyline: {
                positions: positions,
                width: 3,
                material: new Cesium.PolylineArrowMaterialProperty(cesiumColor),
                clampToGround: false
            }
        });

        // Set up the timeline
        this.viewer.clock.startTime = startTime.clone();
        this.viewer.clock.stopTime = stopTime.clone();
        this.viewer.clock.currentTime = startTime.clone();
        this.viewer.clock.clockRange = Cesium.ClockRange.LOOP_STOP;
        this.viewer.clock.multiplier = 1;

        // Set the timeline to the entire range
        this.viewer.timeline.zoomTo(startTime, stopTime);

        // Calculate the bounding sphere from all positions
        const boundingSphere = Cesium.BoundingSphere.fromPoints(positions);
        
        // Calculate appropriate camera distance based on track length
        const distance = Math.max(5000, boundingSphere.radius * 3);
        
        // Fly to the track center
        this.viewer.camera.flyToBoundingSphere(boundingSphere, {
            duration: 2,
            offset: new Cesium.HeadingPitchRange(
                0, // heading
                Cesium.Math.toRadians(-45), // pitch (looking down at 45 degrees)
                distance // range/distance
            )
        });
    }

    /**
     * Create a simple helicopter SVG for visualization
     * @returns {string} Base64 encoded SVG
     */
    createHelicopterSVG() {
        // Simple helicopter icon
        return `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
            <g transform="translate(50,50) rotate(0)">
                <!-- Rotor -->
                <ellipse cx="0" cy="0" rx="45" ry="5" fill="#333" opacity="0.3"/>
                <!-- Body -->
                <ellipse cx="0" cy="5" rx="15" ry="20" fill="#FF6B6B"/>
                <!-- Tail -->
                <rect x="-3" y="15" width="6" height="25" fill="#FF6B6B"/>
                <!-- Tail rotor -->
                <circle cx="0" cy="42" r="5" fill="#333" opacity="0.3"/>
                <!-- Skids -->
                <rect x="-20" y="23" width="40" height="2" fill="#333"/>
                <rect x="-18" y="20" width="2" height="5" fill="#333"/>
                <rect x="16" y="20" width="2" height="5" fill="#333"/>
            </g>
        </svg>`;
    }

    /**
     * Create entity description HTML
     * @param {object} trackData - Track data
     * @returns {string} HTML description
     */
    createEntityDescription(trackData) {
        const stats = calculateStatistics(trackData.points);
        
        return `
            <div>
                <h3>${trackData.name}</h3>
                <table>
                    <tr><td><strong>Distanse:</strong></td><td>${formatDistance(stats.distance)}</td></tr>
                    <tr><td><strong>Varighet:</strong></td><td>${formatDuration(stats.duration)}</td></tr>
                    <tr><td><strong>Gj.sn. hastighet:</strong></td><td>${formatSpeed(stats.avgSpeed)}</td></tr>
                    <tr><td><strong>Maks hastighet:</strong></td><td>${formatSpeed(stats.maxSpeed)}</td></tr>
                    <tr><td><strong>GPS-punkter:</strong></td><td>${stats.pointCount}</td></tr>
                </table>
            </div>
        `;
    }

    /**
     * Show 3D view
     */
    show() {
        const cesiumContainer = document.getElementById('cesiumContainer');
        const leafletMap = document.getElementById('map');
        
        if (cesiumContainer && leafletMap) {
            cesiumContainer.style.display = 'block';
            leafletMap.style.display = 'none';
            
            if (!this.isInitialized) {
                this.initViewer();
            }
            
            // Resize viewer
            if (this.viewer) {
                this.viewer.resize();
            }
        }
    }

    /**
     * Hide 3D view
     */
    hide() {
        const cesiumContainer = document.getElementById('cesiumContainer');
        const leafletMap = document.getElementById('map');
        
        if (cesiumContainer && leafletMap) {
            cesiumContainer.style.display = 'none';
            leafletMap.style.display = 'block';
        }
    }

    /**
     * Clear all entities
     */
    clear() {
        if (this.viewer) {
            this.viewer.entities.removeAll();
            this.currentEntity = null;
        }
    }

    /**
     * Play animation
     */
    play() {
        if (this.viewer) {
            this.viewer.clock.shouldAnimate = true;
        }
    }

    /**
     * Pause animation
     */
    pause() {
        if (this.viewer) {
            this.viewer.clock.shouldAnimate = false;
        }
    }

    /**
     * Reset animation
     */
    reset() {
        if (this.viewer && this.viewer.clock.startTime) {
            this.viewer.clock.currentTime = this.viewer.clock.startTime.clone();
        }
    }

    /**
     * Set animation speed multiplier
     * @param {number} multiplier - Speed multiplier
     */
    setSpeed(multiplier) {
        if (this.viewer) {
            this.viewer.clock.multiplier = multiplier;
        }
    }

    /**
     * Destroy the viewer
     */
    destroy() {
        if (this.viewer) {
            this.viewer.destroy();
            this.viewer = null;
            this.isInitialized = false;
        }
    }
}

