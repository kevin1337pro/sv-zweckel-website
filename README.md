# SV Zweckel Website

Diese erste Version ist bewusst als statische Basis aufgebaut. So koennen wir Design, Inhaltsstruktur und Nutzerfuehrung sauber ausarbeiten, bevor wir ein CMS oder dynamische Datenquellen anschliessen.

## Projektdateien

- `index.html`: komplette Startseite mit allen Hauptsektionen
- `news.html`: eigenstaendige News-Seite mit Archiv, Kategorien und Suchfilter
- `mannschaften.html`: Mannschafts-Hub mit offiziellen FUSSBALL.DE-Links
- `jugend.html`: Jugendportal mit Ansprechpartnern und Probetraining
- `mitgliedschaft.html`: eigene Seite fuer Beitritt und Einstiegswege
- `service.html`: Serviceebene fuer Fans, Downloads, Sponsoring und Kontakt
- `erste-mannschaft.html`: erste echte Team-Detailseite auf Basis offizieller Teamdaten
- `zweite-mannschaft.html`: Detailseite der 2. Mannschaft
- `dritte-mannschaft.html`: Detailseite der 3. Mannschaft
- `styles.css`: Designsystem, Layout, Komponenten und Responsiveness
- `data.js`: gemeinsame Inhaltsdaten fuer Startseite und Unterseiten
- `script.js`: Startseitenlogik, Teamfilter, mobile Navigation und Demo-Interaktionen
- `news.js`: Logik fuer Featured-News, Filterchips und News-Archiv
- `jugend.js`: Logik fuer Jugend-Hub und Jugendteams
- `mitgliedschaft.js`: Logik fuer Mitgliedschaftsseite und Einstiegswege
- `service.js`: Logik fuer Serviceebene, Sponsoring und Kontakt
- `teams.js`: Logik fuer Mannschafts-Hub, Vereinsdaten und Social-Kanaele
- `team-detail.js`: wiederverwendbare Teamdetail-Logik fuer Mannschaftsseiten
- `.github/workflows/deploy-pages.yml`: automatische Bereitstellung ueber GitHub Pages
- `assets/`: Logo, Headerbild, Banner und Blogbild
- `SV Zweckel Website Plan.md`: fachliche Grundlage fuer Struktur und Inhalte

## Schritt-fuer-Schritt durch das Projekt

### 1. Informationsarchitektur festziehen

Aus dem Plan wurden diese Kernbereiche direkt in die Website uebernommen:

- Aktuelles
- Mannschaften
- Jugend
- Verein
- Mitgliedschaft
- Fans & Service
- Kontakt

Ziel dabei: erst die Nutzerfuehrung festziehen, dann Unterseiten und CMS-Felder daraus ableiten.

### 2. Startseite als Leitseite bauen

Die Startseite wurde absichtlich als stark kuratierte Portal-Seite angelegt:

- Hero mit Vereinsbild und zentralen CTAs
- Matchcenter als Modul fuer kuenftige Spieltagsdaten
- News-Raster fuer redaktionelle Inhalte plus eigenstaendige News-Seite
- Team-Uebersicht als Vorlage fuer spaetere Landingpages
- Mannschafts-Hub mit offiziellen Wettbewerbslinks von FUSSBALL.DE
- erste echte Teamdetailseite fuer die 1. Mannschaft
- weitere Detailseiten fuer die 2. und 3. Mannschaft
- Jugend-Landingpage
- eigene Seiten fuer Mitgliedschaft und Fans & Service
- Jugend-Featureblock
- Historie und Ansprechpartner
- Mitgliedschaft und Kontakt

### 3. Inhalte in wiederverwendbare Bausteine ueberfuehren

In `data.js` liegen die Inhalte als gemeinsame Datenbasis statt fest im HTML. Das ist wichtig, weil wir spaeter:

- News aus einem CMS ziehen koennen
- Mannschaftsdaten aus einem Teammodell laden koennen
- Historie, Ansprechpartner und Schnellzugriffe zentral pflegen koennen
- mehrere Seiten mit denselben Inhalten fuettern koennen
- Social-Kanaele und externe Vereinsprofile zentral aktualisieren koennen
- weitere Mannschaftsseiten aus demselben Detailtemplate ableiten koennen

### 4. Designsystem aufbauen

`styles.css` definiert:

- Farbvariablen fuer die schwarz-gruene Markenwelt
- wiederverwendbare Karten, Buttons und Panels
- responsive Layouts fuer Desktop und Mobil
- mobile Navigation

Damit koennen wir spaeter leicht weitere Seiten im selben Stil aufbauen.

### 5. Naechste sinnvolle Ausbaustufen

Die logische Reihenfolge ab hier:

1. Jugend-Landingpage als eigene Unterseite aufbauen
2. weitere Detailseiten fuer Walking Football und Jugendteams anlegen
3. echtes Formularsystem anbinden
4. Downloadbereich fuer Mitgliedsantrag und Satzung mit echten PDFs integrieren
5. Spielplan- und Tabellen-Einbindung vorbereiten
6. danach CMS-Entscheidung treffen, z. B. WordPress, Sanity, Strapi oder statisch mit Netlify CMS

## Lokale Vorschau

Im Projektordner kannst du eine einfache Vorschau mit einem lokalen Server starten, zum Beispiel:

```bash
python3 -m http.server 8000
```

Anschliessend oeffnest du `http://localhost:8000`.

## Empfehlung fuer den naechsten Durchgang

Wenn wir sauber weitermachen wollen, bauen wir als naechstes nicht wahllos mehr Startseiten-Elemente, sondern:

1. Walking Football und Jugendteams als weitere Detailseiten
2. echte Formulare und Downloads einbauen
3. spaeter einzelne News-Detailseiten oder CMS-Detailansichten

Das ist der Punkt, an dem aus einer starken Startseite ein richtiges Webprojekt wird.
