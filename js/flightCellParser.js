/**
 * FlightCell Data Parser
 * Parses FlightCell .log files containing GPS and flight data
 */

/**
 * Parse FlightCell GPS log file
 * @param {string} fileContent - Content of the GPS log file
 * @returns {object} Parsed GPS track data
 */
function parseFlightCellGPS(fileContent) {
    const lines = fileContent.trim().split('\n');
    const points = [];
    
    for (const line of lines) {
        try {
            const data = JSON.parse(line);
            
            // Parse date and time to create timestamp
            const [day, month, year] = data.date.split('/');
            const fullYear = `20${year}`;
            const timeStr = data.time.substring(0, 8); // Remove milliseconds for Date parsing
            const dateTimeStr = `${fullYear}-${month}-${day}T${timeStr}Z`;
            const timestamp = new Date(dateTimeStr);
            
            // Create point object
            const point = {
                lat: data.latitude,
                lon: data.longitude,
                elevation: data.altitude,
                time: timestamp,
                speed: data.speed, // in knots already
                heading: data.heading,
                hdop: data.hdop,
                pdop: data.pdop,
                satellites: data.satellites,
                fix: data.fix_type
            };
            
            points.push(point);
        } catch (error) {
            console.warn('Error parsing GPS line:', error);
        }
    }
    
    return {
        type: 'flightcell',
        points: points,
        name: 'FlightCell Track'
    };
}

/**
 * Parse FlightCell flight data log file
 * @param {string} fileContent - Content of the flight data log file
 * @returns {object} Parsed flight data
 */
function parseFlightCellFlightData(fileContent) {
    const lines = fileContent.trim().split('\n');
    const flightData = [];
    
    for (const line of lines) {
        try {
            const data = JSON.parse(line);
            
            // Create timestamp from ISO string
            const timestamp = new Date(data.timestamp);
            
            // Create flight data object
            const point = {
                time: timestamp,
                epochMs: data.epoch_milli_secs,
                gyro: {
                    x: data.gyro[0],
                    y: data.gyro[1],
                    z: data.gyro[2]
                },
                accel: {
                    x: data.accel[0],
                    y: data.accel[1],
                    z: data.accel[2]
                },
                pitch: data.pitch,
                roll: data.roll
            };
            
            flightData.push(point);
        } catch (error) {
            console.warn('Error parsing flight data line:', error);
        }
    }
    
    return flightData;
}

/**
 * Merge GPS and flight data based on timestamps
 * @param {array} gpsPoints - Array of GPS points
 * @param {array} flightData - Array of flight data points
 * @returns {array} Merged data points
 */
function mergeFlightCellData(gpsPoints, flightData) {
    const merged = [];
    
    // Create a map of flight data by timestamp (rounded to second)
    const flightMap = new Map();
    flightData.forEach(fd => {
        const key = Math.floor(fd.time.getTime() / 1000);
        flightMap.set(key, fd);
    });
    
    // Merge GPS points with flight data
    for (const gps of gpsPoints) {
        const key = Math.floor(gps.time.getTime() / 1000);
        const flight = flightMap.get(key);
        
        if (flight) {
            merged.push({
                ...gps,
                pitch: flight.pitch,
                roll: flight.roll,
                gyro: flight.gyro,
                accel: flight.accel
            });
        } else {
            // GPS point without flight data
            merged.push({
                ...gps,
                pitch: null,
                roll: null
            });
        }
    }
    
    return merged;
}

/**
 * Check if file is a FlightCell log file
 * @param {string} content - File content
 * @returns {boolean} True if FlightCell format
 */
function isFlightCellLog(content) {
    try {
        const firstLine = content.trim().split('\n')[0];
        const data = JSON.parse(firstLine);
        
        // Check for GPS log format
        if (data.latitude && data.longitude && data.altitude !== undefined) {
            return true;
        }
        
        // Check for flight data format
        if (data.gyro && data.accel && data.pitch !== undefined) {
            return true;
        }
        
        return false;
    } catch (error) {
        return false;
    }
}

/**
 * Detect FlightCell log type
 * @param {string} content - File content
 * @returns {string} 'gps', 'flight', or 'unknown'
 */
function detectFlightCellLogType(content) {
    try {
        const firstLine = content.trim().split('\n')[0];
        const data = JSON.parse(firstLine);
        
        if (data.latitude && data.longitude) {
            return 'gps';
        }
        
        if (data.gyro && data.accel) {
            return 'flight';
        }
        
        return 'unknown';
    } catch (error) {
        return 'unknown';
    }
}

