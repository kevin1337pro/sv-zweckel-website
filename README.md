# SV Zweckel Website

Statische, responsive Website in Schwarz-Gruen mit interaktivem 3D-Fussball.
Kein Framework und kein Backend im Produktivbetrieb; der kleine Buildschritt
buendelt Three.js lokal fuer die Startseite.

Live: https://kevin1337pro.github.io/sv-zweckel-website/

## Projektstruktur

- Zehn HTML-Seiten: Startseite, News, Mannschaften, drei Seniorenteams, Jugend, Mitgliedschaft, Service und Fanshop.
- `styles.css`: gemeinsames Designsystem und responsive Layouts.
- `data.js`: redaktionelle News, ein datiertes Ergebnis, Produktbilder und Kaderarchiv.
- `script.js`: gemeinsame Navigation, Newsfilter, Produktansichten, mobile Ergebnisleiste, Mailentwurf und Laufschrift.
- `src/football/`: progressive 3D-Einbindung, Geometrie aus 32 gekruemmten Panels und Bedienung.
- `scripts/build.mjs`: baut lokale ES-Module, ein SVG-Ersatzbild aus derselben Geometrie und die Three.js-Lizenz nach `assets/football/`.
- `scripts/serve.mjs`: lokaler Vorschau-Server, nur auf `127.0.0.1` erreichbar.
- `assets/`: lokale Vereinsbilder, Produktfotos und Logo.
- `assets/fonts/`: lokal gehostete Barlow Condensed und Manrope, jeweils mit OFL-Lizenz.
- `tests/`: statische Pruefungen und Browser-Regressionstests.
- `.github/workflows/deploy-pages.yml`: gepruefte Veroeffentlichung nach GitHub Pages.

## Lokal Ansehen

Im Projektordner mit Node.js ab Version 20:

```sh
npm ci
npm run dev
```

Dann http://127.0.0.1:8000 aufrufen. `npm run dev` baut die 3D-Dateien vor dem
Serverstart. Nach Aenderungen an `src/football/` erneut `npm run build` ausfuehren.
HTML und CSS koennen direkt aktualisiert werden. `PORT` aendert den Vorschau-Port.

Der Ideenordner `3D_Fussball_Website_Idee` diente als gestalterische Vorlage.
Die bestehende Website wurde nicht auf Next.js migriert. Die neue Geometrie ist
prozedural, braucht keinen externen Modelldownload und nutzt das Vereinswappen
aus `assets/svzweckel_logo.jpg` als lokale Textur.

## Den Ball Bedienen

- Ziehen dreht den Ball; auf Touchscreens bleibt vertikales Scrollen und Zoomen moeglich.
- Schwarze Panels waehlen einen von sechs Vereinsbereichen. Der Textlink darunter oeffnet die passende Unterseite.
- Die Pfeiltasten-Buttons waehlen dieselben Bereiche auch ohne Ziehen; alle Buttons sind per Tastatur erreichbar.
- Die Pause-Taste stoppt bzw. startet die automatische Drehung. Bei reduzierter Bewegung startet der Ball still.
- Ausserhalb des Bildschirms und in inaktiven Browser-Tabs wird nicht weiter gerendert.
- Ohne JavaScript oder WebGL bleibt das SVG-Ersatzbild mit einem normalen Mannschaftslink sichtbar. Bei Datensparmodus wird 3D erst auf Klick geladen.

## Testen

Node.js ab Version 20:

```sh
npm ci
npm test
npx playwright install chromium
npm run test:browser
npm run test:football
```

Die Browsertests starten einen eigenen lokalen Server, pruefen alle zehn Seiten bei
320, 390, 600, 768, 1024, 1100, 1101 und 1440 Pixeln und speichern Screenshots in
`test-results/`. Geprueft werden Ueberlaeufe, Bild-/Schriftladen, Navigation mit
Tastatur, Chevron, Bildschirmwechsel, Footer-Abstand, Produktrueckseiten,
Newsfilter, Mailentwurf, Kaderarchiv, reduzierte Bewegung und JavaScript-Fallback.
Die zusaetzlichen 3D-Tests pruefen die 32 Flaechen, echte WebGL-Zeichenaufrufe,
Ziehen, Panel-Auswahl, sechs Zielseiten, Touch-Scrollen, Pause, Sichtbarkeit,
Datensparmodus, WebGL-Ausfall und Tastaturbedienung.

Optionale Umgebungsvariablen:

- `CHROMIUM_PATH`: Pfad zu einer bereits installierten Chromium-Datei.
- `BASE_URL`: statt lokalem Server eine bereits bereitgestellte Website testen.
- `SCREENSHOT_DIR`: alternatives Screenshot-Verzeichnis.
- `PLAYWRIGHT_MODULE`: alternatives Playwright-Modul, etwa aus einer Arbeitsumgebung.

## Inhalte Pflegen

1. News in `data.js` unter `news` bearbeiten. Jede Meldung braucht ein echtes Datum,
   einen Quellenlink sowie eine zutreffende Bildbeschreibung.
2. Das Ergebnis unter `match` nur nach Quellenpruefung aendern. Es ist ein
   redaktioneller Endstand, **kein automatisch aktualisierter Live-Ticker**.
3. Unter `products` gehoeren Vorder- und Rueckseite zusammen. Der Shop ist eine
   Vorschau; Bestellung, Preise und Bestand liegen ausschliesslich im verlinkten
   JAKO-Teamshop.
4. Texte in den jeweiligen HTML-Seiten bearbeiten. Kopf-/Fussbereiche sind
   statisches HTML und muessen bei strukturellen Aenderungen konsistent gehalten
   werden.
5. Tests ausfuehren, geaenderte Projektdateien committen und nach `main` pushen.
   GitHub Actions installiert die festgeschriebenen Abhaengigkeiten, baut und
   prueft das Projekt und publiziert nur HTML, CSS, aktive Skripte und
   oeffentliche Assets. `node_modules`, Quellcode und private Referenzordner
   werden nicht veroeffentlicht. Die erzeugten 3D-Dateien sind in Git ignoriert.

## Quellen Und Grenzen

Redaktionell geprueft am 02.10.2026:

- Legendenspiel: https://www.svzweckel.de/?p=19532
- Ergebnis Grafenwald 4:1 SV Zweckel vom 27.09.2026: https://www.svzweckel.de/?p=19529
- Schalke-Camp: https://www.svzweckel.de/?p=19482
- Erste Mannschaft / Saisonmeldungen: https://www.svzweckel.de/?cat=2
- Trainernennung Marc Schaefer vom 04.09.2026: https://www.svzweckel.de/?p=19415
- Reserve in Kreisliga C1: https://www.svzweckel.de/?p=19308
- Jugend und JSG: https://www.svzweckel.de/?page_id=19
- Beitrittsunterlagen: https://www.svzweckel.de/?page_id=224
- Historie: https://www.svzweckel.de/?page_id=199
- JAKO-Teamshop: https://team.jako.com/de-de/team/sv_zweckel_23_e_v_/

Das Kaderarchiv 2025/26 wurde aus dem bestehenden Projekt uebernommen und ist
ausdruecklich kein aktueller Kader. Verbindliche Trainingszeiten, vollstaendige
Trainerteams und der aktuelle Meldestatus der dritten Mannschaft muessen vom
Verein bestaetigt werden.

Das Kontaktformular erstellt nur einen Mailentwurf. Es versendet und speichert
keine Nachricht. Die Bilder und Fonts werden lokal geladen, Social Media und
Karten sind normale externe Links ohne Tracking-Einbettung.

Die verlinkten Vereins-Rechtstexte ersetzen keine Freigabe der neuen Website:
Vor dem offiziellen Vereinsbetrieb muessen Betreiberangaben, Datenschutz,
Bildrechte und aktuelle Teaminformationen vom Verantwortlichen geprueft werden.
