// ==================== JPS/NMEA Parser ====================

/**
 * Parse JPS/NMEA file and extract track data
 */
async function parseJPS(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const lines = e.target.result.split('\n');
                const points = [];
                const dataMap = new Map();
                
                lines.forEach(line => {
                    line = line.trim();
                    if (!line.startsWith('$')) return;
                    
                    const parts = line.split(',');
                    const messageType = parts[0];
                    
                    if (messageType === '$GPGGA') {
                        // Global Positioning System Fix Data
                        const data = parseGPGGA(parts);
                        if (data) {
                            const key = data.time.toISOString();
                            if (!dataMap.has(key)) {
                                dataMap.set(key, {});
                            }
                            Object.assign(dataMap.get(key), data);
                        }
                    } else if (messageType === '$GNVTG') {
                        // Track made good and Ground speed
                        const data = parseGNVTG(parts);
                        if (data) {
                            const lastKey = Array.from(dataMap.keys()).pop();
                            if (lastKey && dataMap.has(lastKey)) {
                                Object.assign(dataMap.get(lastKey), data);
                            }
                        }
                    } else if (messageType === '$GNGSA') {
                        // GPS DOP and active satellites
                        const data = parseGNGSA(parts);
                        if (data) {
                            const lastKey = Array.from(dataMap.keys()).pop();
                            if (lastKey && dataMap.has(lastKey)) {
                                const existing = dataMap.get(lastKey);
                                if (!existing.hdop && data.hdop) existing.hdop = data.hdop;
                                if (!existing.vdop && data.vdop) existing.vdop = data.vdop;
                                if (!existing.pdop && data.pdop) existing.pdop = data.pdop;
                            }
                        }
                    } else if (messageType === '$GNZDA') {
                        // Time & Date
                        const data = parseGNZDA(parts);
                        if (data) {
                            const lastKey = Array.from(dataMap.keys()).pop();
                            if (lastKey && dataMap.has(lastKey)) {
                                Object.assign(dataMap.get(lastKey), { fullDate: data.date });
                            }
                        }
                    }
                });
                
                // Convert map to points array
                dataMap.forEach((data, key) => {
                    if (data.lat && data.lon) {
                        points.push({
                            lat: data.lat,
                            lon: data.lon,
                            elevation: data.elevation || null,
                            time: data.time,
                            speed: data.speed || null,
                            course: data.course || null,
                            hdop: data.hdop || null,
                            vdop: data.vdop || null,
                            pdop: data.pdop || null,
                            satellites: data.satellites || null
                        });
                    }
                });
                
                if (points.length === 0) {
                    throw new Error('Ingen GPS-punkter funnet i JPS-filen');
                }
                
                // Sort by time
                points.sort((a, b) => a.time - b.time);
                
                resolve({
                    name: file.name,
                    type: 'jps',
                    points
                });
            } catch (error) {
                reject(error);
            }
        };
        
        reader.onerror = () => {
            reject(new Error('Feil ved lesing av fil'));
        };
        
        reader.readAsText(file);
    });
}

/**
 * Parse GPGGA sentence (GPS Fix Data)
 * Format: $GPGGA,time,lat,N/S,lon,E/W,quality,numSats,hdop,alt,M,geoid,M,,*checksum
 */
function parseGPGGA(parts) {
    try {
        const time = parseNMEATime(parts[1]);
        const lat = parseNMEACoordinate(parts[2], parts[3]);
        const lon = parseNMEACoordinate(parts[4], parts[5]);
        const quality = parseInt(parts[6]);
        const satellites = parseInt(parts[7]);
        const hdop = parseFloat(parts[8]);
        const elevation = parseFloat(parts[9]);
        
        if (!time || lat === null || lon === null) {
            return null;
        }
        
        return {
            time,
            lat,
            lon,
            elevation: isNaN(elevation) ? null : elevation,
            satellites: isNaN(satellites) ? null : satellites,
            hdop: isNaN(hdop) ? null : hdop,
            quality
        };
    } catch (e) {
        return null;
    }
}

/**
 * Parse GNVTG sentence (Track made good and ground speed)
 * Format: $GNVTG,course1,T,course2,M,speed1,N,speed2,K,mode*checksum
 */
function parseGNVTG(parts) {
    try {
        const course = parseFloat(parts[1]);
        const speedKnots = parseFloat(parts[5]);
        const speedKmh = parseFloat(parts[7]);
        
        // Convert km/h to m/s
        const speedMs = !isNaN(speedKmh) ? speedKmh / 3.6 : null;
        
        return {
            course: isNaN(course) ? null : course,
            speed: speedMs
        };
    } catch (e) {
        return null;
    }
}

/**
 * Parse GNGSA sentence (GPS DOP and active satellites)
 * Format: $GNGSA,mode,fixType,sat1,...,sat12,pdop,hdop,vdop,systemId*checksum
 */
function parseGNGSA(parts) {
    try {
        const pdop = parseFloat(parts[parts.length - 3]);
        const hdop = parseFloat(parts[parts.length - 2]);
        const vdop = parseFloat(parts[parts.length - 1].split('*')[0]);
        
        return {
            pdop: isNaN(pdop) ? null : pdop,
            hdop: isNaN(hdop) ? null : hdop,
            vdop: isNaN(vdop) ? null : vdop
        };
    } catch (e) {
        return null;
    }
}

/**
 * Parse GNZDA sentence (Time & Date)
 * Format: $GNZDA,time,day,month,year,localZoneHours,localZoneMinutes*checksum
 */
function parseGNZDA(parts) {
    try {
        const time = parts[1];
        const day = parseInt(parts[2]);
        const month = parseInt(parts[3]);
        const year = parseInt(parts[4]);
        
        const hours = parseInt(time.substring(0, 2));
        const minutes = parseInt(time.substring(2, 4));
        const seconds = parseFloat(time.substring(4));
        
        const date = new Date(Date.UTC(year, month - 1, day, hours, minutes, seconds));
        
        return { date };
    } catch (e) {
        return null;
    }
}

/**
 * Parse NMEA time format (HHMMSS.sss)
 */
function parseNMEATime(timeStr) {
    if (!timeStr || timeStr.length < 6) return null;
    
    try {
        const hours = parseInt(timeStr.substring(0, 2));
        const minutes = parseInt(timeStr.substring(2, 4));
        const seconds = parseFloat(timeStr.substring(4));
        
        const now = new Date();
        const date = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
            hours,
            minutes,
            seconds
        ));
        
        return date;
    } catch (e) {
        return null;
    }
}

/**
 * Parse NMEA coordinate format (DDMM.MMMMM)
 */
function parseNMEACoordinate(coord, direction) {
    if (!coord || !direction) return null;
    
    try {
        const value = parseFloat(coord);
        const degrees = Math.floor(value / 100);
        const minutes = value - (degrees * 100);
        let decimal = degrees + (minutes / 60);
        
        if (direction === 'S' || direction === 'W') {
            decimal = -decimal;
        }
        
        return decimal;
    } catch (e) {
        return null;
    }
}

