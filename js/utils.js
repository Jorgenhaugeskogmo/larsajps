// ==================== Utility Functions ====================

/**
 * Format distance in meters to nautical miles
 */
function formatDistance(meters) {
    const nauticalMiles = meters / 1852; // 1 nautical mile = 1852 meters
    return `${nauticalMiles.toFixed(2)} NM`;
}

/**
 * Format duration in seconds to HH:MM:SS
 */
function formatDuration(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
        return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
    return `${minutes}:${String(secs).padStart(2, '0')}`;
}

/**
 * Format speed in m/s to knots
 */
function formatSpeed(metersPerSecond) {
    const knots = metersPerSecond * 1.94384; // 1 m/s = 1.94384 knots
    return `${knots.toFixed(1)} kn`;
}

/**
 * Format elevation in meters to feet
 */
function formatElevation(meters) {
    const feet = meters * 3.28084; // 1 meter = 3.28084 feet
    return `${Math.round(feet)} ft`;
}

/**
 * Format DOP (Dilution of Precision) values
 */
function formatDOP(value) {
    if (value === null || value === undefined) return '-';
    return value.toFixed(2);
}

/**
 * Format satellite count
 */
function formatSatellites(count) {
    if (count === null || count === undefined) return '-';
    return count.toString();
}

/**
 * Format protection levels (HPL/VPL) in feet
 */
function formatProtectionLevel(meters) {
    if (meters === null || meters === undefined) return '-';
    const feet = meters * 3.28084;
    return `${Math.round(feet)} ft`;
}

/**
 * Calculate HPL (Horizontal Protection Level)
 * HPL = HDOP × Protection Factor × URA
 * For GPS: typical protection factor is ~5.33 (for 99.99999% integrity)
 */
function calculateHPL(hdop) {
    if (!hdop) return null;
    const protectionFactor = 5.33; // Conservative factor for aviation
    const ura = 2.0; // User Range Accuracy (typical GPS)
    return hdop * protectionFactor * ura;
}

/**
 * Calculate VPL (Vertical Protection Level)
 * VPL = VDOP × Protection Factor × URA
 */
function calculateVPL(vdop) {
    if (!vdop) return null;
    const protectionFactor = 5.33; // Conservative factor for aviation
    const ura = 2.0; // User Range Accuracy (typical GPS)
    return vdop * protectionFactor * ura;
}

/**
 * Calculate distance between two GPS points using Haversine formula
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371000; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
}

/**
 * Calculate total distance for an array of points
 */
function calculateTotalDistance(points) {
    let total = 0;
    for (let i = 1; i < points.length; i++) {
        total += calculateDistance(
            points[i - 1].lat,
            points[i - 1].lon,
            points[i].lat,
            points[i].lon
        );
    }
    return total;
}

/**
 * Calculate elevation gain
 */
function calculateElevationGain(points) {
    let gain = 0;
    for (let i = 1; i < points.length; i++) {
        const diff = points[i].elevation - points[i - 1].elevation;
        if (diff > 0) {
            gain += diff;
        }
    }
    return gain;
}

/**
 * Calculate statistics from GPS points
 */
function calculateStatistics(points) {
    if (!points || points.length === 0) {
        return null;
    }

    const elevations = points.map(p => p.elevation).filter(e => e !== null && e !== undefined);
    const speeds = points.map(p => p.speed).filter(s => s !== null && s !== undefined && s > 0);
    const satellites = points.map(p => p.satellites).filter(s => s !== null && s !== undefined);
    const hdops = points.map(p => p.hdop).filter(h => h !== null && h !== undefined);
    const vdops = points.map(p => p.vdop).filter(v => v !== null && v !== undefined);
    const pdops = points.map(p => p.pdop).filter(p => p !== null && p !== undefined);
    
    const distance = calculateTotalDistance(points);
    const elevationGain = calculateElevationGain(points);
    
    const startTime = points[0].time;
    const endTime = points[points.length - 1].time;
    const duration = (endTime - startTime) / 1000; // in seconds
    
    const avgSpeed = speeds.length > 0 
        ? speeds.reduce((a, b) => a + b, 0) / speeds.length 
        : distance / duration;
    
    // Calculate min/max/avg for satellites
    const minSatellites = satellites.length > 0 ? Math.min(...satellites) : null;
    const maxSatellites = satellites.length > 0 ? Math.max(...satellites) : null;
    const avgSatellites = satellites.length > 0 ? satellites.reduce((a, b) => a + b, 0) / satellites.length : null;

    // Calculate min/max/avg for DOP values
    const minHDOP = hdops.length > 0 ? Math.min(...hdops) : null;
    const maxHDOP = hdops.length > 0 ? Math.max(...hdops) : null;
    const avgHDOP = hdops.length > 0 ? hdops.reduce((a, b) => a + b, 0) / hdops.length : null;

    const minVDOP = vdops.length > 0 ? Math.min(...vdops) : null;
    const maxVDOP = vdops.length > 0 ? Math.max(...vdops) : null;
    const avgVDOP = vdops.length > 0 ? vdops.reduce((a, b) => a + b, 0) / vdops.length : null;

    const minPDOP = pdops.length > 0 ? Math.min(...pdops) : null;
    const maxPDOP = pdops.length > 0 ? Math.max(...pdops) : null;
    const avgPDOP = pdops.length > 0 ? pdops.reduce((a, b) => a + b, 0) / pdops.length : null;

    // Calculate HPL and VPL for min/max/avg
    const minHPL = minHDOP ? calculateHPL(minHDOP) : null;
    const maxHPL = maxHDOP ? calculateHPL(maxHDOP) : null;
    const avgHPL = avgHDOP ? calculateHPL(avgHDOP) : null;

    const minVPL = minVDOP ? calculateVPL(minVDOP) : null;
    const maxVPL = maxVDOP ? calculateVPL(maxVDOP) : null;
    const avgVPL = avgVDOP ? calculateVPL(avgVDOP) : null;

    return {
        distance,
        duration,
        avgSpeed,
        maxSpeed: speeds.length > 0 ? Math.max(...speeds) : 0,
        maxElevation: elevations.length > 0 ? Math.max(...elevations) : 0,
        minElevation: elevations.length > 0 ? Math.min(...elevations) : 0,
        elevationGain,
        pointCount: points.length,
        
        // Satellites
        minSatellites,
        maxSatellites,
        avgSatellites,
        
        // HDOP
        minHDOP,
        maxHDOP,
        avgHDOP,
        
        // VDOP
        minVDOP,
        maxVDOP,
        avgVDOP,
        
        // PDOP
        minPDOP,
        maxPDOP,
        avgPDOP,
        
        // HPL
        minHPL,
        maxHPL,
        avgHPL,
        
        // VPL
        minVPL,
        maxVPL,
        avgVPL
    };
}

/**
 * Get color based on value and range
 */
function getColorForValue(value, min, max, colorScheme = 'speed') {
    const normalized = (value - min) / (max - min);
    
    if (colorScheme === 'speed') {
        // Blue (slow) -> Green -> Yellow -> Red (fast)
        if (normalized < 0.33) {
            const t = normalized / 0.33;
            return interpolateColor('#3b82f6', '#10b981', t);
        } else if (normalized < 0.66) {
            const t = (normalized - 0.33) / 0.33;
            return interpolateColor('#10b981', '#f59e0b', t);
        } else {
            const t = (normalized - 0.66) / 0.34;
            return interpolateColor('#f59e0b', '#ef4444', t);
        }
    } else if (colorScheme === 'elevation') {
        // Green (low) -> Yellow -> Brown (high)
        if (normalized < 0.5) {
            const t = normalized / 0.5;
            return interpolateColor('#10b981', '#f59e0b', t);
        } else {
            const t = (normalized - 0.5) / 0.5;
            return interpolateColor('#f59e0b', '#92400e', t);
        }
    } else if (colorScheme === 'accuracy') {
        // Red (poor) -> Yellow -> Green (good)
        // Note: lower values are better for accuracy, so we invert
        const inverted = 1 - normalized;
        if (inverted < 0.5) {
            const t = inverted / 0.5;
            return interpolateColor('#ef4444', '#f59e0b', t);
        } else {
            const t = (inverted - 0.5) / 0.5;
            return interpolateColor('#f59e0b', '#10b981', t);
        }
    }
    
    return '#3b82f6';
}

/**
 * Interpolate between two hex colors
 */
function interpolateColor(color1, color2, factor) {
    const c1 = hexToRgb(color1);
    const c2 = hexToRgb(color2);
    
    const r = Math.round(c1.r + factor * (c2.r - c1.r));
    const g = Math.round(c1.g + factor * (c2.g - c1.g));
    const b = Math.round(c1.b + factor * (c2.b - c1.b));
    
    return rgbToHex(r, g, b);
}

/**
 * Convert hex color to RGB
 */
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

/**
 * Convert RGB to hex color
 */
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

/**
 * Debounce function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Show loading overlay
 */
function showLoading() {
    document.getElementById('loadingOverlay').style.display = 'flex';
}

/**
 * Hide loading overlay
 */
function hideLoading() {
    document.getElementById('loadingOverlay').style.display = 'none';
}

/**
 * Show error message
 */
function showError(message) {
    // Create toast notification
    const toast = document.createElement('div');
    toast.className = 'error-toast';
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 5rem;
        right: 2rem;
        background: #ef4444;
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 0.75rem;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
        z-index: 10000;
        animation: slideIn 0.3s ease-out;
    `;
    
    document.body.appendChild(toast);
    
    setTimeout(() => {
        toast.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}

