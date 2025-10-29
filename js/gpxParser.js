// ==================== GPX Parser ====================

/**
 * Parse GPX file and extract track data
 */
async function parseGPX(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = (e) => {
            try {
                const parser = new DOMParser();
                const xmlDoc = parser.parseFromString(e.target.result, 'text/xml');
                
                // Check for parsing errors
                const parseError = xmlDoc.querySelector('parsererror');
                if (parseError) {
                    throw new Error('Feil ved parsing av GPX-fil');
                }
                
                const points = [];
                const trkpts = xmlDoc.querySelectorAll('trkpt');
                
                if (trkpts.length === 0) {
                    throw new Error('Ingen trackpoints funnet i GPX-filen');
                }
                
                trkpts.forEach((trkpt) => {
                    const lat = parseFloat(trkpt.getAttribute('lat'));
                    const lon = parseFloat(trkpt.getAttribute('lon'));
                    
                    const eleElement = trkpt.querySelector('ele');
                    const timeElement = trkpt.querySelector('time');
                    const speedElement = trkpt.querySelector('speed');
                    const courseElement = trkpt.querySelector('course');
                    const hdopElement = trkpt.querySelector('hdop');
                    const vdopElement = trkpt.querySelector('vdop');
                    const pdopElement = trkpt.querySelector('pdop');
                    const satElement = trkpt.querySelector('sat');
                    
                    const point = {
                        lat,
                        lon,
                        elevation: eleElement ? parseFloat(eleElement.textContent) : null,
                        time: timeElement ? new Date(timeElement.textContent) : null,
                        speed: speedElement ? parseFloat(speedElement.textContent) : null,
                        course: courseElement ? parseFloat(courseElement.textContent) : null,
                        hdop: hdopElement ? parseFloat(hdopElement.textContent) : null,
                        vdop: vdopElement ? parseFloat(vdopElement.textContent) : null,
                        pdop: pdopElement ? parseFloat(pdopElement.textContent) : null,
                        satellites: satElement ? parseInt(satElement.textContent) : null
                    };
                    
                    points.push(point);
                });
                
                resolve({
                    name: file.name,
                    type: 'gpx',
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
 * Export track data to GPX format
 */
function exportToGPX(trackData) {
    let gpx = '<?xml version="1.0" encoding="UTF-8"?>\n';
    gpx += '<gpx version="1.1" creator="GPS Track Viewer">\n';
    gpx += '  <trk>\n';
    gpx += `    <name>${trackData.name}</name>\n`;
    gpx += '    <trkseg>\n';
    
    trackData.points.forEach(point => {
        gpx += `      <trkpt lat="${point.lat}" lon="${point.lon}">\n`;
        if (point.elevation !== null) {
            gpx += `        <ele>${point.elevation}</ele>\n`;
        }
        if (point.time) {
            gpx += `        <time>${point.time.toISOString()}</time>\n`;
        }
        if (point.speed !== null) {
            gpx += `        <speed>${point.speed}</speed>\n`;
        }
        if (point.course !== null) {
            gpx += `        <course>${point.course}</course>\n`;
        }
        gpx += '      </trkpt>\n';
    });
    
    gpx += '    </trkseg>\n';
    gpx += '  </trk>\n';
    gpx += '</gpx>';
    
    return gpx;
}

