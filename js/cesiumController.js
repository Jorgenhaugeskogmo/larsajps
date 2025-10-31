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
            // Don't use Cesium Ion - use free services instead
            Cesium.Ion.defaultAccessToken = undefined;

            // Create viewer with basic configuration
            this.viewer = new Cesium.Viewer('cesiumContainer', {
                animation: true,
                baseLayerPicker: false, // Disable to avoid Ion dependency
                fullscreenButton: true,
                vrButton: false,
                geocoder: false,
                homeButton: true,
                infoBox: true,
                sceneModePicker: true,
                selectionIndicator: true,
                timeline: true,
                navigationHelpButton: true, // Enable navigation help
                navigationInstructionsInitiallyVisible: false,
                // Use basic terrain (no token required)
                terrainProvider: new Cesium.EllipsoidTerrainProvider()
            });

            // Remove default imagery layers and add our own
            this.viewer.imageryLayers.removeAll();
            
            // Add Mapbox imagery layer
            const mapboxAccessToken = 'pk.eyJ1Ijoiam9lc2tvIiwiYSI6ImNtNXowenR4NDA1Mzkya3NicG5ocjNubXoifQ.b_2GrrKXGT-FqePBM2o8XQ';
            const mapboxLayer = this.viewer.imageryLayers.addImageryProvider(
                new Cesium.UrlTemplateImageryProvider({
                    url: `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/tiles/{z}/{x}/{y}?access_token=${mapboxAccessToken}`,
                    maximumLevel: 19,
                    credit: '© Mapbox © OpenStreetMap'
                })
            );
            
            // Ensure the globe is visible
            this.viewer.scene.globe.show = true;
            this.viewer.scene.skyBox.show = true;
            this.viewer.scene.sun.show = true;
            this.viewer.scene.moon.show = false;
            
            // Enable lighting
            this.viewer.scene.globe.enableLighting = false; // Disable lighting for better visibility
            
            // Set background color
            this.viewer.scene.backgroundColor = Cesium.Color.BLACK;

            // Configure camera controls for better navigation
            const scene = this.viewer.scene;
            const camera = this.viewer.camera;
            
            // Enable better camera controls
            scene.screenSpaceCameraController.enableRotate = true;
            scene.screenSpaceCameraController.enableTranslate = true;
            scene.screenSpaceCameraController.enableZoom = true;
            scene.screenSpaceCameraController.enableTilt = true;
            scene.screenSpaceCameraController.enableLook = true;
            
            // Set rotation speed
            scene.screenSpaceCameraController.inertiaSpin = 0.9;
            scene.screenSpaceCameraController.inertiaTranslate = 0.9;
            scene.screenSpaceCameraController.inertiaZoom = 0.8;
            
            // Minimum and maximum zoom distances
            scene.screenSpaceCameraController.minimumZoomDistance = 100; // 100 meters
            scene.screenSpaceCameraController.maximumZoomDistance = 10000000; // 10,000 km

            this.isInitialized = true;
            console.log('Cesium viewer initialized successfully');
            console.log('Navigasjonskontroller:');
            console.log('- Venstre museknapp + dra: Roter kamera');
            console.log('- Høyre museknapp + dra: Zoom inn/ut');
            console.log('- Midtre museknapp + dra: Pan');
            console.log('- Mushjul: Zoom');
            console.log('- Ctrl + venstre/høyre: Tilt kamera');
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

        // Create aircraft entity with simple visual representation
        this.currentEntity = this.viewer.entities.add({
            availability: new Cesium.TimeIntervalCollection([
                new Cesium.TimeInterval({
                    start: startTime,
                    stop: stopTime
                })
            ]),
            position: positionProperty,
            orientation: orientationProperty,
            
            // Use a simple cylinder to represent the aircraft
            cylinder: {
                length: 50,
                topRadius: 10,
                bottomRadius: 10,
                material: cesiumColor,
                outline: true,
                outlineColor: Cesium.Color.WHITE,
                outlineWidth: 2
            },
            
            // Path line showing the trail
            path: {
                resolution: 1,
                material: new Cesium.PolylineGlowMaterialProperty({
                    glowPower: 0.2,
                    color: cesiumColor
                }),
                width: 5,
                leadTime: 0,
                trailTime: 100000 // Show trail behind
            },
            
            label: {
                text: trackData.name || 'GPS Track',
                font: '14pt sans-serif',
                style: Cesium.LabelStyle.FILL_AND_OUTLINE,
                outlineWidth: 2,
                verticalOrigin: Cesium.VerticalOrigin.BOTTOM,
                pixelOffset: new Cesium.Cartesian2(0, -30),
                fillColor: Cesium.Color.WHITE
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

        // Calculate center point of the track
        let sumLat = 0, sumLon = 0, minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
        validPoints.forEach(p => {
            sumLat += p.lat;
            sumLon += p.lon;
            minLat = Math.min(minLat, p.lat);
            maxLat = Math.max(maxLat, p.lat);
            minLon = Math.min(minLon, p.lon);
            maxLon = Math.max(maxLon, p.lon);
        });
        
        const centerLat = sumLat / validPoints.length;
        const centerLon = sumLon / validPoints.length;
        const latSpan = maxLat - minLat;
        const lonSpan = maxLon - minLon;
        
        console.log('Track center:', centerLat, centerLon);
        console.log('Track span:', latSpan, lonSpan);
        console.log('First point:', validPoints[0].lat, validPoints[0].lon, validPoints[0].elevation);
        
        // Calculate appropriate viewing distance based on track extent
        const maxSpan = Math.max(latSpan, lonSpan);
        const distance = maxSpan > 0.1 ? 50000 : (maxSpan > 0.01 ? 15000 : 5000);
        
        console.log('Camera distance:', distance);
        
        // Wait a bit for viewer to be ready, then position camera
        setTimeout(() => {
            try {
                // Try different approach: use flyTo with explicit coordinates
                this.viewer.camera.flyTo({
                    destination: Cesium.Cartesian3.fromDegrees(centerLon, centerLat, distance),
                    orientation: {
                        heading: 0.0,
                        pitch: Cesium.Math.toRadians(-60),
                        roll: 0.0
                    },
                    duration: 2,
                    complete: () => {
                        console.log('Camera positioned at:', centerLat, centerLon, distance);
                    }
                });
            } catch (e) {
                console.error('Error positioning camera:', e);
            }
        }, 100);
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

