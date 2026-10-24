**STATUS: PRODUCT CONCEPT ONLY — DO NOT IMPLEMENT YET**

This README describes the current agreed product vision for DIFF.

# DIFF

**Build cool shit with cool people.**

DIFF ist ein Social Network für Menschen, die mit Tech etwas machen, lernen oder für ihre Zukunft aufbauen. Es beginnt bei Menschen, Freundschaften und gemeinsamem Bauen. Öffentliche Builds, Projekte und glaubwürdige Proofs machen die Arbeit sichtbar. Der langfristige emotionale Wert entsteht durch die gemeinsame Geschichte der Menschen dahinter.

Diese README ist die zentrale Produktquelle für Design, Engineering und weitere AI-Agents. Sie konserviert das Produktkonzept unabhängig von vorausgegangenen Gesprächen. Sie ist keine Implementierungsfreigabe, keine technische Spezifikation und keine Festlegung einer Architektur oder eines Technologie-Stacks.

## Inhaltsverzeichnis

1. [Vision, Zielgruppe und Positionierung](#1-vision-zielgruppe-und-positionierung)
2. [Kultur: Public DIFF und Friends DIFF](#2-kultur-public-diff-und-friends-diff)
3. [Produktprinzipien](#3-produktprinzipien)
4. [Navigation und zentrale Screens](#4-navigation-und-zentrale-screens)
5. [Identität: öffentliches Profilbild und DIFF Avatar](#5-identität-öffentliches-profilbild-und-diff-avatar)
6. [Stories und Content-Erstellung](#6-stories-und-content-erstellung)
7. [DMs und Debug Snaps](#7-dms-und-debug-snaps)
8. [Friends, Follow und Social Cold Start](#8-friends-follow-und-social-cold-start)
9. [Projekte und Startup Profiles](#9-projekte-und-startup-profiles)
10. [Proofs und verifizierte Reputation](#10-proofs-und-verifizierte-reputation)
11. [Revenue und private Business Analytics](#11-revenue-und-private-business-analytics)
12. [Discovery, Looking For und Challenges](#12-discovery-looking-for-und-challenges)
13. [Leaderboards und The Climb](#13-leaderboards-und-the-climb)
14. [Hilfe, Accepted Fixes und Ship Streak](#14-hilfe-accepted-fixes-und-ship-streak)
15. [Shared History und emotionaler Wert](#15-shared-history-und-emotionaler-wert)
16. [Monetarisierung](#16-monetarisierung)
17. [Moderation, Safety und Privacy](#17-moderation-safety-und-privacy)
18. [Design-System und Markenpersönlichkeit](#18-design-system-und-markenpersönlichkeit)
19. [Erfolgstest und langfristige Vision](#19-erfolgstest-und-langfristige-vision)
20. [Entscheidungsstand und Grenzen dieses Dokuments](#20-entscheidungsstand-und-grenzen-dieses-dokuments)

## 1. Vision, Zielgruppe und Positionierung

### Für wen DIFF da ist

DIFF richtet sich an junge Entwickler, Vibe-Coder, Indie-Hacker, Solo-Founder, Game Developers, AI Builder, Designer, die Dinge bauen, Open-Source- und Hackathon-Leute, Schüler, Studenten und professionelle Developer. Anfänger gehören genauso dazu wie fortgeschrittene Builder.

Die gemeinsame Eigenschaft ist der Wunsch, zu lernen, zu bauen, zu experimentieren oder voranzukommen. Ein Anfänger, der heute Python lernt, gehört genauso dazu wie ein Founder mit 50.000 € MRR.

> Jeder ist ein „10xer“, solange er mit Tech etwas für seine Zukunft macht.

„10xer“ beschreibt hier Zugehörigkeit und Haltung. Es setzt weder hohes Einkommen noch Revenue, GitHub Stars, besondere Intelligenz, einen Founder-Titel oder gute Programmierkenntnisse voraus. DIFF ist **ambitioniert, aber inklusiv**. Es darf ausdrücklich nicht elitär werden.

### Wie sich DIFF anfühlen soll

Die emotionale Referenz ist **Snapchat für Builder**, mit einer starken eigenen Identität:

> Chill mit deinen Homies und bau coolen Shit.

DIFF beginnt mit Freundschaften und gemeinsamem Bauen. Der professionelle Wert entsteht später aus dem Social Graph und echten Builds. Karriere, Portfolio, Recruiting und professionelles Networking sind nicht der Ausgangspunkt.

DIFF ist deshalb weder „LinkedIn für Entwickler“ noch „GitHub mit Social Feed“, „Product Hunt mit DMs“, eine reine SaaS-Founder-App, ein generisches Jugend-Social-Network oder eine weitere professionelle Networking-Plattform.

Mögliche Markenformulierungen, ohne damit eine endgültige Tagline festzulegen:

- **Build cool shit with cool people.**
- **Build something. Prove it. Flex it. Find people. Ship again.**
- **Show what you built.**
- **Build. Snap. Ship.**

### Die Produktthese

Durch AI und Vibe Coding werden sehr viel mehr Menschen zu Buildern. Ihr Social Life verteilt sich heute auf Snapchat, Discord, GitHub, X, Product Hunt, Peerlist, Reddit und TikTok.

DIFF soll der soziale Ort für Builder-Freundschaften werden: ein Ort zum Schreiben, Teilen, Helfen, Experimentieren, gemeinsamen Bauen und Abhängen. Der öffentliche Builder Graph ist wertvoll; die über Jahre gewachsene gemeinsame Geschichte soll der langfristige Moat sein.

## 2. Kultur: Public DIFF und Friends DIFF

DIFF hat zwei bewusst unterschiedliche, zusammengehörende Ebenen.

| | Public DIFF | Friends DIFF |
| --- | --- | --- |
| Schwerpunkt | Sichtbare Arbeit und Builder-Identität | Menschen, Nähe und Freundschaft |
| Inhalte | Projekte, Stack, Proofs, Fortschritt, Launches, Demos, GitHub-Aktivität, optional Revenue | Snaps, Selfies, Bilder, Memes, Voice Notes, dumme Nachrichten, Build Snaps, Debug Snaps, Ideen, Sessions, persönliche Momente |
| Gefühl | Clean, aspirational, hochwertig, modern, builder-focused | Chaotic, funny, close, human |
| Persönlichkeit | Ungefähr 70 % aspirational, 30 % fun | Ungefähr 55 % fun, 45 % clean |

Public DIFF zeigt, was jemand baut, und ermöglicht Reputation durch echte Arbeit. Es soll hochwertig wirken, ohne steif oder corporate zu werden.

Friends DIFF lässt Menschen einfach Menschen sein. Private Unterhaltungen müssen keinen Produktivitätszweck erfüllen. Ein Meme, ein Selfie oder eine dumme Nachricht gehört genauso dazu wie ein gemeinsamer Bugfix.

> **Public DIFF looks cool. Private DIFF feels fun.**

## 3. Produktprinzipien

- **Menschen zuerst.** Die App öffnet auf Friends und damit auf den eigenen Leuten.
- **Zugehörigkeit ohne Leistungsnachweis.** Proofs sind Status, keine Eintrittskarte.
- **Alle Formen des Bauens zählen.** Ein kreatives Game, Open Source, Design und ein erstes Lernprojekt können genauso wertvoll wirken wie ein profitables Startup.
- **Öffentlich sichtbar, privat menschlich.** Die öffentliche Builder-Kultur darf private Freundschaften nicht in permanente Produktivität verwandeln.
- **Schnell teilen.** Content-Erstellung soll meistens in zwei bis drei Taps bis zum Post führen.
- **Freiwillige Sichtbarkeit.** Presence, Standortangaben und sensible Kennzahlen brauchen bewusste Sichtbarkeitsentscheidungen.
- **Reale Aktivität statt künstlicher Belohnungsschleifen.** Reputation und Gamification sollen tatsächliches Bauen, Lernen und Helfen widerspiegeln.
- **Gemeinsame Geschichte zählt langfristig.** Beziehungen, Erinnerungen und gemeinsam erlebte Fortschritte sind ein zentrales Produktziel.

## 4. Navigation und zentrale Screens

DIFF besitzt fünf Haupttabs in dieser Reihenfolge:

| Tab | Aufgabe |
| --- | --- |
| **Friends** | Default-Screen: Stories, freiwillige Presence und Chats |
| **Feed** | Discovery durch Builds, Demos und weitere öffentliche Formate |
| **Create** | Zentraler großer Button für schnelle Content-Erstellung |
| **Explore** | Gezieltes Entdecken von Menschen, Projekten und Möglichkeiten |
| **You / Profile** | Eigenes Profil und öffentliche Builder-Identität |

### Friends

Friends ist der Einstieg beim Öffnen der App. DIFF öffnet bewusst nicht direkt auf einem algorithmischen Feed, der Kamera oder einem Leaderboard.

**Stories:** Oben stehen horizontale Story-Kreise mit den DIFF Pixel-Avataren der Freunde, zum Beispiel Alex, Laila, Noah und Mia. Die eigene Story steht zuerst und besitzt einen Plus-Button.

**Building Now:** Freiwillige Presence zeigt, woran Freunde gerade arbeiten. Beispiele:

```text
Alex
orbit.so
debugging auth · 18m

Laila
LeadGuard
redesigning dashboard · 43m
```

Building Now darf nicht creepy wirken und enthält keinen Standort. Spätere mögliche Erweiterungen sind **Join Build**, **Build Room**, **Voice Session** und **Screen Share**.

**Chats:** Unterhalb von Stories und Presence stehen normale DMs. Sie sollen persönliche Gespräche sichtbar machen:

```text
Alex     bro look at this 💀
Laila    📹 Build Snap
Noah     ✓ fixed your bug
```

**Notification-Glocke / Events:** Oben rechts befindet sich eine Glocke für soziale und produktbezogene Ereignisse. Normale Chatnachrichten gehören nicht hierher. Beispiele:

- Alex added you; jemand folgt dir.
- Jemand antwortet auf deinen Build.
- Domain oder Revenue wurde verifiziert.
- Ship-Streak Milestone oder Ranking-Bewegung.
- Ein Projekt erreicht einen Milestone.
- Accepted Fix oder Launch-Event.

### Feed

Der Feed dient der Discovery. Er mischt kurze Demo-Videos, Screen Recordings, UI-Demos, Build Posts, Bilder, Launches, Pitches, Fragen und Fortschritte.

Videos können immersiv oder fullscreen dargestellt werden. Bilder und Build-Updates sind eher Card-basiert. **For You** und **Friends** sind mögliche Feed-Tabs.

Ein Feed-Post kann folgende zusätzliche Informationen enthalten:

| Element | Bedeutung und Beispiele |
| --- | --- |
| **Tech Stack Pills** | Next.js, Supabase, Tailwind, Rust, Python, Godot |
| **Prompt Peek** | Optionaler, aufklappbarer und kopierbarer verwendeter Prompt bei AI-/Vibe-Coding-Projekten |
| **Startup / Project Metrics** | Optional MRR, Wachstum und Projektphase |
| **Gesuche** | Zum Beispiel Co-Founder, Tester oder Feedback gesucht |

Revenue darf niemals den gesamten Feed dominieren. Ein kreatives Game, ein Open-Source-Projekt oder das erste Anfängerprojekt soll genauso wertvoll wirken können.

Die genannten Technologien sind Beispiele für Nutzerinhalte und Stack-Tags. Sie legen den Implementierungs-Stack von DIFF nicht fest.

### Create

Create ist der zentrale große Button und führt zu **Snap**, **Story**, **Demo**, **Build Update**, **Screen Record** und **Pitch**. Ziel sind meistens zwei bis drei Taps bis zum Post.

Die Studio-Modi sind **Front Camera**, **Screen Capture** und **Split Screen**. Details zu Stories und optionalen Filtern stehen in [Abschnitt 6](#6-stories-und-content-erstellung).

### Explore

Explore ermöglicht gezieltes Entdecken und enthält Search, Builders, Startups, Projects, Stacks, Challenges, Leaderboards, Co-Founder Discovery und Builder Radar.

Mögliche Filter sind **AI**, **React**, **Python**, **Game Dev**, **Indie SaaS**, **U20**, **Open Source**, **Region** und **Land**. Standort bleibt freiwillig; die Schutzprinzipien für junge Nutzer gelten auch hier.

### You / Profile

Das eigene Profil beziehungsweise öffentliche Builder-Profil enthält:

- Öffentliches PFP, Handle und Bio.
- Stack und aktuelle Projekte.
- Ship-Streak und Proofs.
- Builds und Stats.
- Startup Profiles und Builder History.

Sensible Informationen folgen ihren jeweiligen Privacy-Einstellungen. Ein Profil muss auch ohne Revenue oder umfangreiche Proofs eine vollwertige Builder-Identität ermöglichen.

## 5. Identität: öffentliches Profilbild und DIFF Avatar

DIFF besitzt bewusst zwei visuelle Identitäten pro Nutzer.

### Public Profile Picture

Öffentlich kann ein Nutzer ein echtes Foto, ein Logo, ein normales PFP oder optional einen Avatar verwenden. Das öffentliche Profil soll seriös genug für Networking sein.

### DIFF Avatar

Zusätzlich besitzt jeder Nutzer einen separaten, hochwertigen, minimalistischen **8-Bit-/Pixel-Character**. Er wird vor allem in Friends, Chats, Stories, Building Now, Streaks, Reactions, gemeinsamen Sessions und Animationen eingesetzt.

**Fallback-Regel:** Wenn kein normales PFP vorhanden ist, wird der DIFF Avatar automatisch überall als Profilbild verwendet.

Der Avatar-Stil ist modern, minimalistisch und hochwertig, mit klarer Silhouette und leichter Wiedererkennbarkeit. Er soll weder kindisch noch NFT-artig oder übertrieben cartoonig wirken.

Customization umfasst Haare, Outfit, Accessoires und Pose. Spätere Animationen können **idle**, **typing**, **coding**, **debugging**, **shipping** und **celebrating** sein.

## 6. Stories und Content-Erstellung

### Builder-native Stories

Stories geben typischen Builder-Momenten eine schnelle Ausdrucksform:

- **Shipped**, **Still Building**, **Bug from Hell**.
- **First User**, **Need Feedback**, **Launching Tonight**.
- **Rate this UI**, **Which Logo?**, **Deploying Now**, **New Milestone**.

Mögliche Story-Sticker sind **Ship Streak**, **MRR**, **GitHub Commit**, **Domain Verified**, **Poll**, **Tech Stack**, **Looking for Co-Founder**, **Help**, **Launch** und **Growth**.

Private Freunde dürfen weiterhin normale Stories teilen. Die builder-native Gestaltung ist ein Angebot und macht persönliche Momente nicht zu Pflicht-Build-Content.

### Studio und spätere Fun-Elemente

Front Camera, Screen Capture und Split Screen unterstützen verschiedene Arten, einen Moment oder Build zu zeigen. Die schnelle Erstellung bleibt das Ziel.

Optional können später Developer Lenses beziehungsweise Filter wie **CRT**, **Matrix**, **BSOD** und **Scanlines** hinzukommen. Sie sind kleine Fun-Elemente und dürfen weder übertrieben noch cringe sein.

Technische Aufnahmeverfahren, Plattformunterstützung, Mediengrenzen und konkrete Story-Laufzeiten: **TBD during implementation.**

## 7. DMs und Debug Snaps

### Persönliche Nachrichten

DMs sollen sich schnell und persönlich anfühlen. Unterstützte Inhaltsformen sind Text, Foto, Video, Voice Note, Code und Screen Recording.

### Debug Snap

Ein Debug Snap ist eine spezielle Form der direkten Hilfe. Ein Nutzer sendet einen Terminal Error, UI Bug, Screenshot oder Code. Der Empfänger kann direkt darauf zeichnen, markieren, Pfeile setzen, die Problemstelle hervorheben und eine Voice Note hinzufügen.

Debug Snaps können temporär sein. Mögliche Regeln beziehungsweise Aktionen sind:

| Option | Produktabsicht |
| --- | --- |
| **View Once** | Einmaliges Ansehen |
| **Replay Once** | Einmaliges erneutes Ansehen |
| **Save Fix** | Die hilfreiche Lösung optional erhalten |

Die eigentliche hilfreiche Lösung darf optional gespeichert werden, auch wenn der ursprüngliche Snap verschwindet. Temporärer Inhalt und dauerhaft hilfreicher Fix müssen im Produktverständnis unterscheidbar bleiben.

Exakte Ablauf-, Speicher- und Berechtigungsregeln: **TBD during implementation.**

## 8. Friends, Follow und Social Cold Start

### Zwei verschiedene Beziehungen

| Beziehung | Zweck |
| --- | --- |
| **Follow** | Creatorn, interessanten Buildern, Startups und Personen folgen, deren öffentliche Arbeit man beobachten möchte |
| **Friend** | Echte soziale Verbindung mit privaten Snaps, privaten Stories, Building Now und engerer Interaktion |

Diese Trennung ist zentral. Ein Follow allein bedeutet keine Freundschaft und keinen Zugang zum privaten Friends-Layer.

### Invite your friends

Das erste Onboarding bietet früh **Invite your friends** an, ohne es zu erzwingen. Nutzer können einen Invite-Link über WhatsApp, iMessage oder Discord teilen oder mit **Copy Link** kopieren.

Beispiel für die vorgesehene Linkform, ohne Aussage über eine bereits existierende Domain oder Implementierung:

```text
diff.app/join/vlad
```

Wenn jemand über einen Invite kommt, wird der Einladende klar angezeigt und ein Friend Request vorbereitet. Der neue Nutzer soll nicht allein in der App landen. Ein vorbereiteter Friend Request ist keine automatisch bestätigte Freundschaft.

### Crew Invites — später

Später können kleine Freundesgruppen gemeinsam onboarden:

```text
Vlad’s Builders
3/5 joined
```

Das Wachstumsziel sind auch **Freundescluster**, nicht ausschließlich einzelne neue Accounts.

## 9. Projekte und Startup Profiles

Projekte sind eigene **Social Objects**. Sie bündeln die Arbeit und Geschichte eines Projekts über einzelne Posts hinaus. Menschen können Startups folgen.

Ein Startup-/Projektprofil kann Name, Logo, Description, Domain, Team, Stack, Revenue, Growth, Builds, Followers, Launch History und Updates enthalten. Revenue und Growth sind nur relevant, wenn sie zum Projekt passen und entsprechend freigegeben wurden.

Vorgesehene Tabs:

- **Overview**
- **Builds**
- **Team**
- **Stats**

Projekte umfassen mehr als SaaS-Unternehmen. Games, Open Source, Experimente und erste Anfängerprojekte gehören zur Produktwelt von DIFF.

## 10. Proofs und verifizierte Reputation

Proofs machen echte Builder-Reputation sichtbar. **Zugehörigkeit hängt niemals von Proofs ab: Proofs sind Status, keine Eintrittskarte.**

### Domain Verification

Domain Ownership kann über DNS TXT, Meta Tag oder eine Datei nachgewiesen werden. Die verifizierte Domain kann anschließend so erscheinen:

```text
leadguard.ai ✓
```

### GitHub

GitHub kann Proofs für Repo Ownership, Activity, Contributions, Stars und Open Source liefern. Ein fehlender GitHub-Nachweis wertet andere Formen des Bauens oder Lernens nicht ab.

### Revenue Verification — spätere Integrationen

Spätere Integrationen können Stripe, Lemon Squeezy, Polar und weitere Payment Provider umfassen.

Ein Revenue-Badge darf **nicht gekauft** werden. Es muss auf echter Verifikation beruhen. Verifikation und öffentliche Anzeige sind getrennte Entscheidungen: Verifizierte Revenue kann verborgen bleiben.

Technische Integrationen, Nachweisumfang, Aktualisierung und Gültigkeit von Verifikationen: **TBD during implementation.**

## 11. Revenue und private Business Analytics

DIFF kann für Founder später zusätzlich ein privates Revenue Dashboard sein. Diese Funktion ergänzt das Social Network; sie definiert weder Zugehörigkeit noch den Wert anderer Projekte.

Mögliche Kennzahlen:

| Kennzahl | Bedeutung |
| --- | --- |
| **MRR** | Monthly Recurring Revenue |
| **ARR** | Annual Recurring Revenue |
| **Customers** | Kundenanzahl |
| **ARPU** | Average Revenue per User |
| **New MRR** | Neu hinzugekommener MRR |
| **Expansion** | Zuwachs aus bestehenden Kundenbeziehungen |
| **Contraction** | Rückgang aus bestehenden Kundenbeziehungen |
| **Churn** | Abwanderung beziehungsweise Verlust wiederkehrender Umsätze |
| **Net New MRR** | Nettoveränderung des MRR |
| **Growth** | Wachstum im betrachteten Zeitraum |

Die Tabelle benennt Produktbegriffe, keine verbindlichen Berechnungsregeln. Exakte Definitionen, Zeiträume, Währungsbehandlung und Provider-Zuordnung: **TBD during implementation.**

### Privacy pro Kennzahl

**Jede Kennzahl besitzt eigene Privacy-Einstellungen**, zum Beispiel **Public**, **Friends** oder **Only Me**. Mögliche Darstellungen sind:

- Exakter MRR öffentlich.
- **€1K+ MRR verified** als Schwellenwert.
- **Revenue verified · hidden** ohne sichtbaren Betrag.
- Vollständig privat.

Das private Dashboard kann tiefer gehen als das öffentliche Profil. Beispielhafte Insights:

```text
Your MRR grew 18.4% this month.
Main driver: new subscriptions.
Churn increased from 3.1% to 4.8%.
```

Später sind anonymisierte Benchmarks denkbar. Sie bleiben eine spätere Möglichkeit und müssen die Privacy-Grundsätze erfüllen.

## 12. Discovery, Looking For und Challenges

### Builder Radar

Discovery soll auch unbekannte Menschen sichtbar machen. Builder Radar findet **People blowing up this week** anhand möglicher Signale:

- Neues Projekt.
- Hohe Interaktion.
- Ungewöhnlich viele Builds.
- Schnelles Wachstum.
- Guter Help Score.
- Neue Open-Source-Traktion.

Die Signale beschreiben die Produktabsicht. Gewichtung, Ranking-Logik und Missbrauchserkennung: **TBD during implementation.**

### Looking For

**Looking For** ist ein First-class Field, damit aktuelle Gesuche sichtbar und auffindbar sind. Vorgesehene Optionen:

| Zusammenarbeit | Unterstützung und nächste Schritte |
| --- | --- |
| Co-Founder | Beta Testers |
| Designer | First Users |
| Developer | Code Review |
| Hackathon Team | Feedback |
| Job | Investment |
| Internship | |

### Challenges

Challenges geben einen gemeinsamen Anlass zum Bauen. Beispiele:

- **Ship a SaaS in 7 days**
- **Build with Supabase in 72h**
- **Build a Game Weekend**
- **AI x Web Challenge**

Später können Dev-Tool-Unternehmen Challenges sponsoren.

## 13. Leaderboards und The Climb

### Mögliche Leaderboards

Leaderboards können nach Geografie, Builder-Kontext oder tatsächlichen Ergebnissen gegliedert sein:

| Dimension | Beispiele |
| --- | --- |
| Geografie | Global, Germany, Europe, Region, City |
| Gruppe oder Kategorie | U20, Solo, AI, Game Dev, DevTools |
| Fortschritt und Beitrag | Fastest Growing, Most Shipped, New MRR, Accepted Fixes |

Standortangaben sind freiwillig. Es gibt keine Snap Map und kein GPS-Tracking. Für Minderjährige ist standardmäßig eher Land oder Region statt einer exakten Stadt vorgesehen.

### The Climb

Leaderboards sollen nicht nur große Founder bevorzugen. **The Climb** ermöglicht Vergleiche innerhalb von Revenue-Stufen:

- **$0 → $100**
- **$100 → $1K**
- **$1K → $10K**
- **$10K → $100K**

So kann ein kleiner Builder in seiner Liga gewinnen. Revenue-Stufen ergänzen die anderen Formen von Fortschritt und Beitrag; sie sind keine allgemeine Rangordnung des Werts einer Person.

Die Dollar-Stufen sind Konzeptbeispiele. Berechnungen, Liga-Zuordnung, Zeitfenster und Währungsnormalisierung: **TBD during implementation.**

## 14. Hilfe, Accepted Fixes und Ship Streak

### Reputation durch Hilfe

DIFF soll Hilfe sichtbar machen. Wenn ein Nutzer beispielsweise bei einem Debug Snap geholfen hat, kann der Empfänger **FIXED MY BUG** drücken. Die helfende Person erhält einen **Accepted Fix**.

Ein Profil kann dadurch anzeigen:

```text
47 accepted fixes
```

Später kann **You helped ship this.** eine Verbindung zu einem gelaunchten Projekt sichtbar machen, an dem jemand geholfen hat.

### Ship Streak

DIFF besitzt einen Ship Streak, der reale Aktivität widerspiegelt. Er kann durch Commit, Design, Fix, Build, Launch, Demo oder echtes Lernen beziehungsweise Fortschritt erhalten bleiben.

Das Prinzip ist ausdrücklich nicht toxisch: kein sinnloses XP-Farming, keine Casino-Mechaniken und keine Daily Chests. Sichtbar werden soll tatsächlicher Fortschritt, einschließlich Lernen.

Konkrete Anerkennungsregeln, Zeitfenster, Unterbrechungen und Schutz vor Farming: **TBD during implementation.**

## 15. Shared History und emotionaler Wert

DIFF soll über Jahre emotional wertvoll werden. Gemeinsame Geschichte ist ein zentrales Produktziel und der langfristige Moat. Die folgenden Konzepte beschreiben diese Vision; ihre Aufnahme hier legt keine gemeinsame erste Release-Version fest.

### Shared History

Freunde bekommen eine gemeinsame Historie. Beispiel:

```text
YOU + ALEX

Friends since Sep 2026
187 days built together
23 build sessions
61 Debug Snaps
8 projects helped on
3 launches together
```

### Builder Memories

Eine Timeline bewahrt prägende Momente: first snap, first project, first bug fixed, first launch, first customer, first hackathon, failed startup und next startup.

Sie macht sichtbar, wie Menschen und Projekte sich entwickeln. Nicht nur erfolgreiche Launches gehören zur Geschichte.

### I Was There When

Frühe Begleiter können später sehen, an welchem Punkt sie dabei waren:

```text
You followed LeadGuard when it had:
12 users
€0 MRR
3 followers

Today:
14,821 users
€42K MRR
```

### Firsts

DIFF merkt sich erste wichtige Schritte:

- First Project, First Build, First Launch, First Friend.
- First Customer, First €1, First €100, First 1K MRR.
- First GitHub Star, First Accepted Fix.

Die Darstellung soll ruhig und emotional sein, nicht casinoartig.

### Build Sessions

Freunde können gemeinsam Building Sessions haben. Danach kann eine Zusammenfassung stehen:

```text
2h 14m together

Vlad shipped 2 commits
Alex fixed auth
Noah redesigned onboarding
```

**Save Memory** ist optional. Die mögliche spätere Erweiterung von Building Now um gemeinsame Räume, Voice und Screen Share ist damit verwandt, aber technisch noch nicht festgelegt.

### Private Build Journal

Persönliche Logs bieten Platz für Text, Voice Notes und Gedanken. Der Default ist **Only Me**. Später können einzelne Einträge veröffentlicht werden.

### Time Capsules

**Message to Future You** bewahrt eine Nachricht an das zukünftige Ich:

```text
hopefully 1k mrr lol
```

Sechs Monate später könnte sie so wieder erscheinen:

```text
TIME CAPSULE OPENED

Today:
€4,281 MRR
```

### Failure is History

Gescheiterte Projekte werden nicht wie peinliche Fehler behandelt. Nutzer können Projekte würdevoll archivieren:

```text
PROJECT ARCHIVED

143 days built
2,418 users
€620 peak MRR

learned more from this than anything else.
```

### Friendship Milestones

Gemeinsame Meilensteine zeigen die Beziehung hinter den Aktivitäten:

```text
100 days on DIFF

42 snaps
13 builds shared
7 bugs fixed
18 hours building together
```

### Annual DIFF Recap

Ein Jahresrückblick verbindet Builds, Hilfe und Freundschaften:

```text
YOUR YEAR IN DIFF

31 people built with
14 projects shipped
Longest night: 04:17 AM
Most used stack: TypeScript
Most built-with friend: Alex
18 bugs fixed together
```

Revenue Growth und Build Hours können ebenfalls Teil des Rückblicks sein. Am Ende steht **THE PEOPLE WHO WERE THERE**, mit den Pixel-Avataren der wichtigsten Freunde.

Die Zahlen und Texte dieses Abschnitts sind illustrative Beispiele. Sie definieren keine bereits erhobenen Daten oder verpflichtenden Messverfahren. Historien, Rückblicke und Erinnerungen müssen die Privacy der zugrunde liegenden Inhalte respektieren. Technische Erfassung, Aufbewahrung und Sichtbarkeitsregeln: **TBD during implementation.**

## 16. Monetarisierung

**Der normale Social Layer soll kostenlos bleiben.** Die folgenden Modelle sind mögliche spätere Monetarisierung, keine bereits festgelegten Angebote oder Preise.

### DIFF Pro

Mögliche Bestandteile sind Advanced Analytics, bessere Profile, tiefere Projektstatistiken, Customization und eventuell Premium Avatar Cosmetics.

### DIFF Scout

DIFF Scout richtet sich an Recruiter, Startups, VCs, Accelerators und Agencies. Es ermöglicht die Suche nach verifizierten Buildern. Beispielhafte Suchkombination:

```text
Germany
Rust
U21
3+ shipped projects
Looking for work
```

Das ist ein Nutzungsszenario, keine Freigabe privater Profildaten. Privacy und die Schutzprinzipien für junge Nutzer gelten auch für kommerzielle Discovery.

### Weitere mögliche Modelle

- Hiring Posts.
- Sponsored Challenges.
- Dev Tool Sponsoring.
- Launch Boosts.
- Marketplace.
- Später **Open to Acquire** und Startup-Verkäufe.

### B2B Data

Eine spätere Möglichkeit ist aggregierte Stack Intelligence, etwa darüber, welche Stacks wachsen, welche Tools profitable Startups verwenden und welche Technologien in bestimmten Kategorien dominieren.

Dies ist ausschließlich **privacy-safe und aggregiert** gedacht. Private Chats, persönliche Erinnerungen oder verborgene individuelle Kennzahlen sind damit nicht zur Veröffentlichung freigegeben.

Monetarisierung darf keine käufliche Revenue-Verifikation schaffen und den kostenlosen sozialen Kern nicht verdrängen. Preise, Pakete und technische Umsetzung: **TBD during implementation.**

## 17. Moderation, Safety und Privacy

### Öffentliche Kultur

DIFF soll kulturell nicht von Drugs, Dealer Content, Scam Culture, Gang Content, NSFW Spam, Crypto Spam, Fake Founders, Follow-for-follow, Engagement Farming, Fake Revenue oder Spam Recruiting dominiert werden.

Öffentliche Posts sollten überwiegend einem klaren Objekt beziehungsweise Inhaltstyp zugeordnet sein:

```text
BUILD · DEMO · DEBUG · LAUNCH · QUESTION · MILESTONE · PITCH
```

Private Friends dürfen viel freier sein. Diese Freiheit bedeutet Raum für Alltag, Humor und persönliche Gespräche; die grundlegenden Safety-Funktionen bleiben relevant.

### Safety für eine Plattform mit jungen Nutzern

Zum Produktkonzept gehören:

- Keine Live Location, keine Snap Map, kein verstecktes Standorttracking und kein GPS-Tracking.
- Report User und Report Content.
- Block User.
- Stranger DM Controls.
- Privacy by Default für junge Nutzer.
- Account Deletion und Data Export.
- Moderation und Community Guidelines.

### Privacy-Grundsätze im gesamten Produkt

| Bereich | Vereinbarter Grundsatz |
| --- | --- |
| Building Now | Freiwillige Presence ohne Standort |
| Standort in Discovery und Rankings | Freiwillig; für Minderjährige standardmäßig eher Land oder Region statt exakter Stadt |
| Friends und Follow | Follow allein öffnet den privaten Friends-Layer nicht |
| Revenue und Analytics | Eigene Privacy pro Kennzahl; Verifikation erzwingt keine Veröffentlichung |
| Private Build Journal | Only Me als Default |
| Temporäre Debug Snaps | Eine hilfreiche Lösung kann optional separat erhalten bleiben |
| B2B Stack Intelligence und Benchmarks | Nur privacy-safe und aggregiert beziehungsweise anonymisiert |

Konkrete Altersgrenzen, Durchsetzung der Schutzregeln, Moderationsabläufe, Aufbewahrungsfristen sowie technische Lösch- und Exportverfahren: **TBD during implementation.** Dieses Dokument trifft dazu keine rechtlichen oder technischen Detailentscheidungen.

## 18. Design-System und Markenpersönlichkeit

### Visuelle Richtung

DIFF ist clean, punchy, modern, youthful, slightly playful und premium. Das Interface ist konsequent mobile-first, mit guten Abständen und abgerundeten Cards mit ungefähr **12–16 px Radius**.

> **Snap-clean + premium tech + terminal soul.**

Die Terminal-Identität soll charaktervoll, aber sparsam sein. Übertriebene Matrix-/Hacker-Ästhetik passt ebenso wenig wie ein steriles Corporate-Interface.

### Dark Mode

| Rolle | Vorgabe |
| --- | --- |
| Background | `#181F20` |
| Panels | `#222B2C` |
| Primary Mint | `#6EE7B7` |
| Terminal Green | `#4E9B78` |
| Focus Blue | `#3B82F6` |
| Main Text | Off-white; exakter Wert: TBD during implementation. |
| Secondary Text | Muted gray-green; exakter Wert: TBD during implementation. |

### Light Mode

| Rolle | Vorgabe |
| --- | --- |
| Background | Ungefähr `#F2F6F4` |
| Cards | `#FFFFFF` |
| Secondary Surface | `#E8EFEC` |
| Text | Dark graphite; exakter Wert: TBD during implementation. |
| Markenfarbe | Mint bleibt Markenfarbe |

Light Mode soll weich, leicht mint-/graustichig und nicht steril weiß wirken. DIFF hat sowohl Light als auch Dark Mode.

### Typografie

| Schriftkategorie | Verwendung |
| --- | --- |
| **Sans Serif** | Navigation, Headings und normaler UI-Text |
| **Monospace** | Handles, Timer, Stats, Terminal Labels, Code und Proofs |

Konkrete Schriftfamilien und vollständige Typografie-Skala: **TBD during implementation.**

### Visuelle Motive

Mögliche Marken- und Statusmotive:

```text
_ DIFF
[DIFF]
BUILD SHIPPED
DOMAIN VERIFIED
```

Sparsam kann echte diff-Syntax eingesetzt werden:

```diff
+ shipped v1
+ first customer
- sleep
```

Die Motive sind gestalterische Akzente. Sie sollen nicht die gesamte Oberfläche in ein Terminal verwandeln. Der spielerische Ton muss mit der hochwertigen, klaren Gestaltung und der nicht toxischen Kultur zusammenpassen.

### Persönlichkeit nach Kontext

Die ungefähre Balance bleibt:

- **Public Layer:** 70 % aspirational, 30 % fun.
- **Friends Layer:** 55 % fun, 45 % clean.

Diese Anteile sind gestalterische Leitplanken, keine messbaren Layout-Vorgaben. Öffentlich soll DIFF cool aussehen; privat soll es sich persönlich und lustig anfühlen.

## 19. Erfolgstest und langfristige Vision

Die wichtigste Erfolgsfrage lautet:

> **Entstehen echte Beziehungen?**

Downloads, Likes und Registrierungen allein beantworten diese Frage nicht. Ein starkes Signal wäre, wenn Menschen sagen:

> **„Add mich auf DIFF.“**

Und damit meinen: Lass uns dort schreiben, bauen, Sachen schicken und zusammen abhängen.

Über Jahre können Menschen auf DIFF Freunde finden, gemeinsam bauen, Bugs lösen, Projekte starten, Projekte scheitern sehen, erste Kunden gewinnen, Erinnerungen sammeln und Launches erleben. Die gemeinsame Geschichte lässt sich nicht einfach durch das Kopieren einzelner Features ersetzen.

Der öffentliche Builder Graph erzeugt professionellen Wert. **Shared History** schafft den langfristigen emotionalen Wert. Wenn DIFF zum selbstverständlichen Ort dieser Beziehungen wird, ist es ein echtes Social Network.

Konkrete Erfolgsmessung und quantitative Zielwerte sind noch nicht festgelegt: **TBD during implementation.**

## 20. Entscheidungsstand und Grenzen dieses Dokuments

### Festgehaltene Produktgrundlage

Die inklusive Zielgruppe, Freundschaften als Ausgangspunkt, die Trennung von Public und Friends, Friends als Default-Screen, die fünf Haupttabs, das duale Identity-System und die Trennung von Friend und Follow bilden die Produktgrundlage.

Ebenso zentral sind Proofs ohne Zugangshürde, freiwillige Sichtbarkeit, Revenue als optionaler Teil, Reputation durch Hilfe, nicht toxische Gamification, Safety für junge Nutzer, ein kostenloser normaler Social Layer sowie Shared History als langfristige Vision.

### Optionen und spätere Erweiterungen

Formulierungen wie **möglich**, **optional** und **später** sind bewusst gewählt. Dazu gehören insbesondere zusätzliche Presence-/Session-Funktionen, Developer Lenses, Avatar-Animationen, Crew Invites, Payment-Provider-Integrationen, das private Revenue Dashboard, anonymisierte Benchmarks, „You helped ship this.“, die spätere Veröffentlichung einzelner Journal-Einträge, gesponserte Challenges und die Monetarisierungsoptionen.

Auch Beispiel-Tabs, Filter, Rankings, Texte, Zahlen, Domains und Markenformulierungen sind nicht automatisch endgültige Detailentscheidungen. Die langfristigen Erinnerungskonzepte sind Teil der Vision; ihre Release-Reihenfolge bleibt offen.

### Noch keine Implementierungsentscheidungen

Diese README legt weder MVP-Umfang noch Roadmap, Architektur, Datenmodell, Technologie-Stack, Hosting, konkrete APIs oder technische Integrationsverfahren fest. Sie ist keine Behauptung, dass die beschriebenen Funktionen bereits existieren.

Für offene technische Entscheidungen gilt: **TBD during implementation.**

Design, Engineering und weitere AI-Agents sollen das hier dokumentierte Produktkonzept als gemeinsame Grundlage verwenden. Neue Kernfeatures, Richtungsänderungen oder technische Festlegungen sind nicht stillschweigend aus Beispielen abzuleiten. Der aktuelle Auftrag konserviert ausschließlich die Produktidee in dieser README; Coding und Implementierung sind noch nicht freigegeben.
