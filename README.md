# GPS Track Viewer

En moderne webapplikasjon for visualisering og analyse av GPS-spor.

![GPS Track Viewer](https://img.shields.io/badge/Status-Active-success)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6+-yellow)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ Funksjoner

- **Interaktiv kartvisning** med flere kartlag:
  - Gatekart (OpenStreetMap)
  - Satellittkart (Esri)
  - Hybrid (satellitt med veier)
- **Fargegradient-visualisering** basert på hastighet, høyde eller GPS-nøyaktighet
- **Detaljert statistikk**: 
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

- **Bytt kartlag**: Velg mellom gatekart, satellitt eller hybrid i dropdown-menyen
- **Endre farge**: Velg mellom hastighet, høyde eller GPS-nøyaktighet
- **Utforsk sporet**: Klikk på sporet for å se detaljerte data for hvert punkt
- **Avspilling**: Bruk play-knappen for å animere turen, eller dra i tidslinjen

### Statistikk og grafer

- **Statistikkpanel**: Viser 14 parametre inkl. GPS-nøyaktighet og beskyttelsesnivåer
- **Høydeprofil**: Graf som viser terrengprofilen (i fot og nautiske mil)
- **Hastighetsgraf**: Visualiserer hastighetsvariasjoner over tid (i knop)

### Eksport

- **PDF-rapport**: Klikk "Eksporter PDF" for å generere en komplett rapport
  - Alle statistikker i tabellform
  - GPS-punkter (første 50) med koordinater, høyde, hastighet
  - Høydeprofil og hastighetsgraf som bilder

## 🛠️ Teknologi

- **Vanilla JavaScript** (ES6+)
- **Leaflet.js** - Interaktive kart
- **Chart.js** - Grafer og visualisering
- **jsPDF** - PDF-generering
- **OpenStreetMap** / **CARTO** - Gatekartdata
- **Esri** - Satellittbilder

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

