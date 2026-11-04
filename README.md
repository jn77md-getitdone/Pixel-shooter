# Pixel Soldier

Et simpelt 2D-skydespil i pixelgrafik, som kan spilles på iPad (Safari) og computer.

Du er en lille soldat på en græsmark. Skyd fjenderne og overlev så længe som muligt!
Jo længere du kommer, jo flere fjender kommer der, og nye slags dukker op.

## Sådan spiller du

| | iPad | Computer |
|---|---|---|
| Gå | Pileknapperne nederst til venstre | Piletaster eller W A S D |
| Skyd | Den røde SKYD-knap nederst til højre | Mellemrum |

- Du skyder i den retning, du sidst gik.
- Du har 3 hjerter. Fjender giver nogle gange et hjerte, som du kan samle op (max 5).
- Der kommer et nyt niveau hvert 20. sekund.

### Fjender

| Fjende | Kommer fra niveau | Hvad gør den |
|---|---|---|
| Slim | 1 | Langsom, går mod dig |
| Bi | 2 | Hurtig, flyver i bølger |
| Robot | 3 | Langsom, men tåler 4 skud |
| Spøgelse | 5 | Holder afstand og spytter slimkugler |
| Kæmpeslim | 7 | Stor og sej, deler sig i 3 små slim |

## Prøv det på din egen computer

Åbn `index.html` direkte i en browser, eller start en lille webserver i mappen:

```
python3 -m http.server 8000
```

og gå til http://localhost:8000

## Læg spillet på GitHub Pages

1. Gå til repoet på GitHub → **Settings** → **Pages**.
2. Under *Build and deployment* vælg **Deploy from a branch**.
3. Vælg branch `main` og mappen `/ (root)`, og tryk **Save**.
4. Efter et minut ligger spillet på `https://<dit-brugernavn>.github.io/<repo-navn>/`.
5. Åbn adressen i Safari på iPad'en. Tryk på del-knappen → **Føj til hjemmeskærm**, så kører det i fuld skærm som en app.

## Sådan er koden bygget op

Ingen frameworks og intet build-trin – bare almindelig HTML, CSS og JavaScript.

```
index.html        Siden: lærred, knapper, start- og game over-skærm
css/style.css     Udseende på knapper og skærme
js/sprites.js     Al pixelgrafik, tegnet som tekst (ét tegn = én pixel)
js/audio.js       Lydeffekter, lavet direkte i browseren
js/input.js       Tastatur og touch-knapper
js/entities.js    Soldaten, fjendetyper, skud, hjerter og effekter
js/game.js        Spillets regler: niveauer, kollisioner, tegning, skærme
```

### Idéer til at bygge videre

- **Ny fjende:** Tegn den i `SPRITE_DATA` i `js/sprites.js`, og tilføj en linje i `ENEMY_TYPES` i `js/entities.js`.
- **Sværere/lettere spil:** Ret tallene i `SETTINGS` øverst i `js/game.js`, eller `spawnInterval()`.
- **Hurtigere skud:** Ret `fireRate` i `Player` i `js/entities.js`.
- **Ændr soldaten:** Ret bogstaverne i `SOLDIER_TOP` og farverne i `palette` i `js/sprites.js`.
