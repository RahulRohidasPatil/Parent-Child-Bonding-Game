# DIFF Character Builder — vollständige Übergabe

**Nur Übergabe für den Kollegen. Nicht in die Lern-App integriert.**

Dieses Paket stammt aus dem lokalen Projekt `DIFF`. Der Vergleich mit `DIFF-next` ergab
identische Dateien für `src`, `scripts` und `assets/avatar`. Alle übernommenen Originaldateien
sind unverändert; Prüfsummen und Dateiliste liegen bei. Keine Zugangsdaten, Social-App-Daten,
Git-Historie, privaten Selfie-Fotos oder Analyseberichte wurden übernommen.

## Enthalten

- Aktueller Pack **`assets/avatar/atelier-r6`** mit **270 kosmetischen Items**, **732 kompilierten
  Layer-PNGs** und **12 Hautpaletten**; Rig `front_reference_v1`, Ausgabe 128×128.
- **100 Frisuren**, **33 Oberteile**, **26 Jacken**, **24 Hosen**, **30 Paar Schuhe** sowie Köpfe,
  Augen, Brauen, Nasen, Münder, Bärte, Hüte, Brillen, Ohrringe, Hörgeräte und weitere Details.
- Alle vorhandenen älteren Avatar-Packs, Vorschaubilder, Masken, Paletten, Layer und Manifeste.
- Alle Avatar-Zeichenreferenzen und ursprünglichen Generierungs-/Authoring-Dateien.
- Vollständiger Avatar-/Collection-/Studio-/Selfie-Quellcode, Build-Skripte und Testquellen.
- Lokale MediaPipe-Modell-/WASM-Dateien einschließlich vorhandener Lizenz und Hash-Manifeste.
- Originale `package.json`, `package-lock.json`, `tsconfig.json` und Dokumentation.
- Zwei nicht-personenbezogene historische Test-Baselines unter `artifacts/`.

`ITEM_CATALOG.csv` listet jedes aktuelle Item mit ID, Namen, Kategorie, Layern und Quellen.
`EXTRACTION_REPORT.json` enthält die Bestandszahlen; `SOURCE_FILES.json` und
`SOURCE_FILES.sha256` dokumentieren alle 3.250 übernommenen Originaldateien.

**Wichtig:** Manche ältere DIFF-Dokumente nennen kleinere Katalogzahlen. Verbindlich ist das
mitgelieferte aktuelle Manifest mit 270 Items. Alte Packs sind zusätzlich enthalten und keine
weiteren 270 unabhängigen aktuellen Items.

## Für den Kollegen: auspacken und starten

Das Repository klonen oder vollständig herunterladen; alle Asset-Dateien werden benötigt.
Quellcode, Skripte und Tests liegen in `SOURCE_CODE.zip`, damit Next.js sie nicht als Teil der
Lern-App kompiliert. Die PNGs und Referenzen sind direkt durchsuchbar.

Aus dem Root des geklonten Repositories:

```sh
python3 handoffs/diff-character-builder/unpack.py /tmp/diff-avatar-builder
cd /tmp/diff-avatar-builder
npm ci
npm run build
npm run preview
```

Python 3.9+ für den Entpacker, eine aktuelle Node.js-LTS-Version und npm verwenden.
Danach `http://127.0.0.1:4312/avatar-studio` öffnen. Alternativer Port: `PORT=4313 npm run preview`.
Der Entpacker erstellt ein neues Verzeichnis **außerhalb** der Lern-App und prüft jede Datei.
Existierende Zielverzeichnisse werden nicht überschrieben. Im ausgepackten Paket können
`src/`, `scripts/` und `tests/` normal bearbeitet werden.

## Einstiegspunkte

| Datei/Verzeichnis im ausgepackten Paket | Bedeutung |
| --- | --- |
| `assets/avatar/atelier-r6/manifest.json` | Aktiver Item-Katalog, Layer, Varianten, Quellen und Hashes |
| `src/collection/model.ts` | Konfigurationsschema, Slots, Defaults und Presets |
| `src/collection/render.ts` | PNG-Rendering, Manifest und einzelne Layer |
| `src/collection/hairPalettes.ts`, `wearPalettes.ts` | Haar- und Kleidungsfarben |
| `src/studio/` | Vorhandene eigenständige Editor-Oberfläche |
| `scripts/avatar/previewServer.ts` | Lokaler Node-Previewserver und dessen `/api/collection/*`-Routen |
| `scripts/avatar/buildCollection.ts` | Aktuellen Pack aus Quellen bauen |
| `scripts/avatar/validateCollection.ts` | Pack-/Hash-/Maskenprüfung und umfangreiche Renderprüfung |
| `src/selfie/`, `assets/selfie/v1/` | Bestehende lokale Selfie-Auswertung samt Modellen |
| `docs/` und `UPSTREAM_README.md` | Unverändert übernommene DIFF-Dokumentation |

Der Previewserver ist kein produktiver, authentifizierter Dienst und kein FastAPI-Endpunkt der
Lern-App. Nicht öffentlich bereitstellen. Die Übergabe verändert weder deren Frontend noch Backend.
Die ursprünglichen DIFF-Architekturvorgaben gelten nur für das archivierte Projekt und ersetzen
keine Vorgaben der Lern-App.

## Prüfungen und bekannte Grenzen

Bei der Extraktion wurden alle übernommenen Dateien bytegenau gegen die Quelle geprüft.
TypeScript-Build erfolgreich; der aktive Pack bestand die Prüfung von 270 Modulen,
113 Kleidungs-/Schuh-Items und 732 Layern. Jedes der 270 Items wurde einzeln erfolgreich in einer
gültigen Konfiguration ohne Fallback-Warnung gerendert. Das prüft nicht alle Kombinationen.

Die originalen Testquellen sind enthalten. Einige historische Tests und `/dev/selfie-*`-Ansichten
benötigen Foto-/Analyse-Fixtures aus dem ursprünglichen `artifacts/selfie`-Verzeichnis; diese gehören
nicht zum Item-/Builder-Handoff und sind bewusst nicht enthalten. Der volle historische Testsatz
ist deshalb nicht als vollständig bestanden zugesagt. Nicht fehlende Fotos durch fremde private
Daten ersetzen. Die normalen Avatar-Assets und ihre Quellen sind vollständig enthalten.

Einzelne historische Authoring-/Report-Skripte enthalten absolute DIFF-Pfade oder Verweise auf alte
QA-Artefakte. Diese müssen vor gezielter Wiederverwendung angepasst werden. Keine Legacy-Builds
blind ausführen: `npm run assets` baut den alten v1-Pack, nicht den aktuellen r6-Katalog.

Die Originalabhängigkeiten bleiben unverändert. `npm audit` meldete beim Handoff eine als hoch
eingestufte Zod-Schwachstelle (Speicherverbrauch bei übergroßen eingeschränkten Collections).
Vor einer echten Integration Abhängigkeiten prüfen und aktualisieren; nicht ungeprüft `--force`
ausführen. Der Fund betrifft das archivierte Paket, das nicht in der Lern-App ausgeführt wird.
Vorhandene Drittanbieter-Lizenzhinweise bleiben erhalten; diese Übergabe vergibt keine neue Lizenz.
