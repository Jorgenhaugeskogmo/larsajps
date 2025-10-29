# GPS Track Viewer

En moderne webapplikasjon for visualisering og analyse av GPS-spor.

![GPS Track Viewer](https://img.shields.io/badge/Status-Active-success)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Funksjoner

- **Interaktiv kartvisning** med OpenStreetMap
- **Fargegradient-visualisering** basert på hastighet, høyde eller GPS-nøyaktighet
- **Detaljert statistikk**: 
  - Distanse (nautiske mil)
  - Hastighet (knop)
  - Høyde (fot)
  - GPS-nøyaktighet (HDOP, VDOP, PDOP)
  - Satellittinformasjon
- **Grafiske profiler**: høydeprofil og hastighetsgraf
- **Avspillingsfunksjon** med animert markør som følger sporet
- **Drag-and-drop** filopplasting
- **Støtte for GPX og JPS/NMEA** formater
- **Mørk/lys tema** med automatisk lagring av preferanser
- **Responsiv design** for mobil og desktop
- **Nautiske enheter**: knop (kn), nautiske mil (NM), fot (ft)

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

1. **Last opp egne filer**: Dra og slipp GPX- eller JPS-filer på opplastingsområdet
2. **Bruk eksempeldata**: Klikk på "Last eksempeldata" for å se en demo

### Visualisering

- **Endre farge**: Velg mellom hastighet, høyde eller GPS-nøyaktighet i dropdown-menyen
- **Utforsk sporet**: Klikk på sporet for å se detaljerte data for hvert punkt
- **Avspilling**: Bruk play-knappen for å animere turen, eller dra i tidslinjen

### Statistikk og grafer

- **Statistikkpanel**: Viser total distanse, varighet, hastighet og høydedata
- **Høydeprofil**: Graf som viser terrengprofilen
- **Hastighetsgraf**: Visualiserer hastighetsvariasjoner over tid

## 🛠️ Teknologi

- **Vanilla JavaScript** (ES6+)
- **Leaflet.js** - Interaktive kart
- **Chart.js** - Grafer og visualisering
- **OpenStreetMap** / **CARTO** - Kartdata

## 📁 Prosjektstruktur

```
larsajps/
├── index.html          # Hovedfil
├── css/
│   └── styles.css      # Alle stiler
├── js/
│   ├── app.js          # Hovedapplikasjon
│   ├── gpxParser.js    # GPX-parser
│   ├── jpsParser.js    # JPS/NMEA-parser
│   ├── mapController.js # Kartkontroll
│   ├── chartController.js # Graf-kontroll
│   └── utils.js        # Hjelpefunksjoner
├── input/              # Eksempeldata
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

