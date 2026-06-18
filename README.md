# Krypto-Werkzeug

Lokales, offline-fähiges Werkzeug für Caesar-, Vigenère- und Substitutionschiffren
inkl. Kryptoanalyse (Brute-Force, Index of Coincidence, Häufigkeitsanalyse).

## Starten (Fedora)

Da die Seite ES-Module verwendet, muss sie über `http://`, nicht `file://`,
geöffnet werden. Im Projektordner:

```bash
python3 -m http.server 8420
```

Dann im Browser öffnen: http://localhost:8420/

Alles läuft rein im Browser, es werden keine Daten irgendwohin gesendet.

## Module

- `js/utils.js` – Alphabet, Sprachstatistik (DE/EN), Häufigkeiten, Index of
  Coincidence, Chi-Quadrat-Test
- `js/caesar.js` – Caesar ver-/entschlüsseln + Brute-Force über alle 26 Shifts
- `js/vigenere.js` – Vigenère ver-/entschlüsseln + Schlüssellängen-/
  Schlüssel-Schätzung
- `js/substitution.js` – monoalphabetische Substitution + Häufigkeits-Vorschlag
- `js/frequency.js` – Balkendiagramm der Buchstabenhäufigkeit
- `js/app.js` – UI-Logik / Verdrahtung der Tabs

## Erweitern

Neue Verfahren (z.B. Playfair, Hill-Chiffre, Transpositions-Chiffren) lassen
sich als eigenes Modul nach demselben Muster ergänzen:

1. Neues `js/<verfahren>.js` mit `encrypt`/`decrypt`/Analyse-Funktionen
2. Neuen Tab in `index.html` (Button + `<section>`)
3. Verdrahtung in `js/app.js` (Tab erscheint automatisch über die bestehende
   Tab-Logik, sobald `data-tab` und `id="tab-..."` übereinstimmen)
