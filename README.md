# GPS Track Viewer

En moderne webapplikasjon for visualisering og analyse av GPS-spor.

![GPS Track Viewer](https://img.shields.io/badge/Status-Active-success)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Funksjoner

### Kartvisning
- **2D Interaktiv kartvisning** (Leaflet.js) med flere kartlag:
  - Gatekart (OpenStreetMap)
  - Satellittkart (Esri)
  - Hybrid (satellitt med veier)
- **3D Visualisering** (Cesium.js) for FlightCell-data:
  - 3D-terreng og satellittbilder
  - Animert helikopter-modell med korrekt orientering
  - Pitch og roll-visualisering i sanntid
  - Interaktiv timeline for avspilling
- **Fargegradient-visualisering** basert på hastighet, høyde eller GPS-nøyaktighet

### Data og Format-støtte
- **GPX-filer**: Standard GPS-format
- **JPS/NMEA-filer**: NMEA 0183 format
- **FlightCell .log-filer**: 
  - GPS-data (gps_flight.log)
  - Flight-data med gyro, accelerometer, pitch og roll (flightData.log)
  - Automatisk sammenslåing av GPS og flight-data

### Statistikk og Analyse
- **Detaljert statistikk** (min/avg/maks): 
  - Distanse (nautiske mil)
  - Hastighet (knop)
  - Høyde (fot)
  - GPS-nøyaktighet (HDOP, VDOP, PDOP)
  - Beskyttelsesnivåer (HPL, VPL)
  - Satellittinformasjon
- **PDF-eksport**: 
  - Komplett rapport med statistikk
  - GPS-punkter i tabellform
  - Høydeprofil og hastighetsgraf
- **Grafiske profiler**: høydeprofil og hastighetsgraf
- **Avspillingsfunksjon** med animert markør som følger sporet

### UI/UX
- **Drag-and-drop** filopplasting (støtter multiple filer)
- **Mørk/lys tema** med automatisk lagring av preferanser
- **Responsiv design** for mobil og desktop
- **Nautiske enheter**: knop (kn), nautiske mil (NM), fot (ft)
- **Værdata for Voss**: Normalverdier (1991-2020) fra Meteorologisk Institutt

## 🚀 Kom i gang

### Direkte bruk

Applikasjonen kan brukes direkte fra GitHub Pages:

**[Åpne GPS Track Viewer](#)** *(erstatt med din GitHub Pages URL)*

### Lokal installasjon

1. Klon repositoriet:
```bash
git clone https://github.com/dittbrukernavn/larsajps.git
cd larsajps
```

2. Åpne `index.html` i nettleseren:
```bash
open index.html  # macOS
start index.html # Windows
xdg-open index.html # Linux
```

Ingen bygging eller installasjon nødvendig!

## 📖 Brukerveiledning

### Laste inn GPS-data

1. **Last opp egne filer**: 
   - Dra og slipp GPX-, JPS- eller LOG-filer på opplastingsområdet
   - For FlightCell-data: Last opp både `gps_flight.log` og `flightData.log` samtidig
2. **Bruk eksempeldata**: Klikk på "Last eksempeldata" for å se en demo

### Visualisering

#### 2D-visning (standard)
- **Bytt kartlag**: Velg mellom gatekart, satellitt eller hybrid
- **Endre farge**: Velg mellom hastighet, høyde eller GPS-nøyaktighet
- **Utforsk sporet**: Klikk på sporet for å se detaljerte data
- **Avspilling**: Bruk play-knappen for å animere turen

#### 3D-visning (for FlightCell-data)
- **Aktiver 3D**: Klikk på "3D Visning"-knappen når FlightCell-data er lastet
- **Helikopter-modell**: Se helikopterets orientering i sanntid med pitch og roll
- **Interaktiv timeline**: Bruk Cesium timeline for å navigere gjennom flighten
- **3D-terreng**: Se ruten i 3D med terreng og satellittbilder
- **Kamera-kontroll**: 
  - Venstre mus: Roter kamera
  - Høyre mus: Zoom
  - Midtre mus: Pan

### Statistikk og grafer

- **Statistikkpanel**: Viser min/avg/maks for alle GPS-nøyaktighetsparametre
- **Høydeprofil**: Graf som viser terrengprofilen (i fot og nautiske mil)
- **Hastighetsgraf**: Visualiserer hastighetsvariasjoner over tid (i knop)

### Værdata

- **Værdata Voss**: Klikk på "Værdata Voss" i headeren
  - Se normalverdier for Vossevangen og Bulken
  - Sammenlign stasjonene
  - Eksporter værdata til PDF

### Eksport

- **GPS-rapport**: Klikk "Eksporter PDF" i statistikkpanelet
  - Alle statistikker i tabellform
  - GPS-punkter (første 50) med koordinater, høyde, hastighet
  - Høydeprofil og hastighetsgraf som bilder
- **Værdata-rapport**: Klikk "Eksporter PDF" i værdata-modalen
  - Månedlige temperatur og nedbør
  - Årsoversikt og sammenligninger

## 🛠️ Teknologi

### Frontend
- **Vanilla JavaScript** (ES6+) - Ingen rammeverk nødvendig
- **HTML5** & **CSS3** - Moderne webteknologier

### Kartvisning
- **Leaflet.js 1.9.4** - 2D interaktive kart
- **Cesium.js 1.111** - 3D globus og terreng-visualisering
- **OpenStreetMap** / **CARTO** - Gatekartdata
- **Esri World Imagery** - Satellittbilder

### Datavisualisering
- **Chart.js 4.4.1** - Grafer og diagrammer
- **jsPDF 2.5.1** - PDF-generering
- **jsPDF-AutoTable 3.8.2** - Tabeller i PDF

### Datakilde
- **Meteorologisk Institutt** - Værdata (normalverdier 1991-2020)

## 📁 Prosjektstruktur

```
larsajps/
├── index.html              # Hovedfil
├── css/
│   └── styles.css          # Alle stiler (inkl. Cesium custom)
├── js/
│   ├── app.js              # Hovedapplikasjon og orkest rering
│   ├── gpxParser.js        # GPX-parser
│   ├── jpsParser.js        # JPS/NMEA-parser
│   ├── flightCellParser.js # FlightCell .log-parser
│   ├── mapController.js    # 2D Leaflet-kartkontroll
│   ├── cesiumController.js # 3D Cesium-kartkontroll
│   ├── chartController.js  # Chart.js graf-kontroll
│   ├── weatherData.js      # Værdata (Meteorologisk Institutt)
│   ├── weatherController.js # Værdata-visualisering
│   └── utils.js            # Hjelpefunksjoner og beregninger
├── input/                  # Eksempeldata
│   ├── log0408d.gpx
│   └── log0408d.jps
└── README.md
```

## 🎨 Design

Applikasjonen bruker moderne 2025 designprinsipper:
- **Glassmorphism** med backdrop-blur effekter
- **Smooth animations** og transitions
- **Moderne fargepalett** med gradient accents
- **Responsivt layout** som tilpasser seg alle skjermstørrelser

## 🤝 Bidra

Bidrag er velkomne! Åpne gjerne issues eller pull requests.

## 📄 Lisens

Dette prosjektet er lisensiert under MIT-lisensen.

## 🙏 Anerkjennelser

- [Leaflet.js](https://leafletjs.com/) for kartfunksjonalitet
- [Chart.js](https://www.chartjs.org/) for grafvisualisering
- [OpenStreetMap](https://www.openstreetmap.org/) for kartdata
- [CARTO](https://carto.com/) for mørke kartfliser

---

Laget med ❤️ for GPS-entusiaster

