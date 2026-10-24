# HackAssets – what is here and what is missing

## Downloaded (all free to use)
| Folder | What it is | Use in the app | License |
|---|---|---|---|
| 01_kenney_cc0/furniturekit_updated | 140 isometric furniture pieces, 4 directions each (desks, chairs, shelves, lamps, plants, rugs, walls, floors) | Room items + room shell pieces | CC0 |
| 01_kenney_cc0/library-pack-2.1 | Isometric bookcases (empty → full → ladder), display cases, candle stands, carpets | Bookshelf stages, History room display cases | CC0 |
| 01_kenney_cc0/generic-items-160-assets | 160 flat item icons (microscope, flasks, test tubes, books, compass, calculator…) | Small props on desks, game card icons | CC0 |
| 01_kenney_cc0/roguelikeindoor_updated | 16×16 top-down pixel furniture tilesheet | Only if we pick Style B | CC0 |
| 01_kenney_cc0/1bitpack_kenney_1.1 | 1-bit pixel tiles and icons | UI icons, placeholders | CC0 |
| 01_kenney_cc0/pixeluipack | Pixel UI panels and buttons (9-slice) | Buttons, panels | CC0 |
| 01_kenney_cc0/kenney_emotespack | Speech-bubble emotes | Pip reactions | CC0 |
| 01_kenney_cc0/kenney_foliagesprites | Plants and trees | Garden, house exterior | CC0 |
| 01_kenney_cc0/roguelike-modern-city-pack, isometric-blocks | Extra tiles | House exterior, backgrounds | CC0 |
| 01_kenney_cc0/kenney_interfacesounds, kenney_uiaudio | Clicks, pops, confirm/error sounds | Game and UI sounds | CC0 |
| 01_kenney_cc0/kenney_rpgaudio, kenney_musicjingles | Coin, door, item sounds; short win/level-up jingles | Coins, upgrades, tier-up | CC0 |
| 01_kenney_cc0/kenney_fontpackage | Kenney fonts | Optional | CC0 |
| 02_fonts_ofl | Pixelify Sans, Press Start 2P, Silkscreen | App fonts | SIL OFL |
| 00_layout_previews | Layout mockups to choose from | Not for the app | – |

## Could NOT download – please get these manually
kenney.nl, itch.io and opengameart.org were blocked from here; only GitHub was reachable.

1. **A true isometric pixel-art interior pack** (optional, but closest to the reference look).
   The Kenney furniture is smooth low-poly art; the mockups pixelate it with a filter.
   Candidates found (check price and license before using):
   - Isometric Pixel Art Home Interior Pack – https://kabukidanshi.itch.io/isometric-pixel-art-home-interior-pack
   - Isometric Interiors – https://pixel-salvaje.itch.io/isometric-interiors
   - Isometric pixel bedroom – https://hoodedcrow.itch.io/isometric-pixel-bedroom
   Put it in: `03_manual/isometric_interior_pack/`
2. **Subject-specific room items** – no free pack has these as isometric art:
   globe, telescope, chalkboard, aquarium, chemistry bench, armour stand, typewriter, abacus,
   weather station, rock collection, old map table, timeline wall.
   The mockups use flat icons or simple drawn placeholders. Either buy a pack that has them,
   or draw them in Aseprite / LibreSprite (32 px grid). Put them in: `03_manual/subject_items/<item>/`
3. **Pip, the mascot** – must be our own character. A placeholder is drawn in the mockups.
   Needed: idle, talk, cheer, sleepy (4–6 frames each). Put in: `03_manual/pip/`
4. **Calm background music loops** (one per room, 1–2 min, loopable).
   Kenney only has short jingles. CC0 music: search opengameart.org for "CC0 cozy loop".
   Put in: `03_manual/music/`
5. **Newer Kenney packs (optional)** from kenney.nl if you want more furniture:
   the current "Furniture Kit" (the GitHub copy is version 2.0 from 2018).

## Web version (current) - added after switching from Android to web
| Folder | What it is |
|---|---|
| Hackathon_Build_Plan.pdf | Build plan, now for the web app (React + Vite + TypeScript, FastAPI) |
| 08_design_v3/Design.pdf | Current Design doc: 3D-model art, web pages, all 60 items x 10 levels |
| 08_design_v3/catalog.json | Recipe of every room and item (which 3D models make each stage) |
| 07_web_rooms | Web-ready art: per room shell.webp + item lv01-lv10.webp + layout.json. Copy to web/public/rooms/ |
| 06_3d_models | Source 3D models: KayKit + Kenney (CC0) |
| 09_bake_tool | Script that turns catalog.json + 3D models into 07_web_rooms |

04_app_sprites and 05_design are the old pixel-art Android version and are no longer used.
