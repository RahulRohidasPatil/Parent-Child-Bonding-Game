# Hackathon Plan — Learning Party App

**Status:** Reviewed concept, not an implemented app. This document covers the family-and-friends learning app; the DevOps office simulation remains a separate project.

**Current direction:** Select a subject, upload school material, confirm the extracted content, and create a reviewed learning block with a study plan, flashcards, and quiz questions. Children and parents or guardians learn and track progress before playing learning and party games. Friends-only play remains part of the product. The initial demo centres on the uploaded-material learning journey; weekly classroom events remain an optional extension.

**Scope labels:** “Product feature” means included in the intended product, not guaranteed for the hackathon. “Proposed extension” and “suggestion” mean not yet selected. The single recommended prototype is defined in Section 10; final demo scope remains open.

## 0. Consolidated Build Brief — Latest User Summary

Recognising the latest written summary and whiteboard reference, the project records:

a. **Working title:** Rejected by Y Combinator. This is a project name, not a claim about an actual application or rejection;
b. **Audience:** Children and teenagers aged 10–18, together with their parents or guardians. Initial content difficulty and the first subject still need selection;
c. **Purpose:** Help families spend time together through learning, explaining concepts, and playful challenges;
d. **Core journey:** Choose a subject → upload screenshots of schoolwork or learning material → create a study plan, flashcards, and quiz questions with AI assistance → complete modules and view progress → enter learning and party games;
e. **Initial game formats:** Child versus parent, duo versus duo, flashcard practice, multiple-choice quizzes, and party games such as Forbidden clues. The wider party catalogue remains the product backlog;
f. **Participation:** Parent–child bonding is the primary use case; the previously requested friends-only participation remains supported in the product concept;
g. **Stack:** Figma for design, Next.js with React/TypeScript and shadcn for the interface, Python/FastAPI for custom API logic, and Supabase for authentication, storage, and its PostgreSQL database. PostgreSQL is part of Supabase, not an additional database service;
h. **Account experience:** Login, registration, learner/parent progress, and school-subject context are product features. A school-management integration is not implied;
i. **Pitch:** An AI-powered learning platform that turns schoolwork into interactive games, helping parents and children learn, compete, and bond together.

### Uploaded Material and Content Review

a. Uploaded screenshots are source material, not automatically verified facts. Extracted text, formulas, and diagrams must be confirmed before a learning block is published;
b. AI may draft the study plan, flashcards, and quiz questions from that confirmed source. Correct answers and explanations require review before scored play;
c. Questions must retain a reference to the relevant source passage or task. Unreadable or unsupported material prompts correction or an unavailable response;
d. This extends the earlier curated-block approach: a block may originate from an upload, but remains unavailable for scored games until reviewed;
e. For a dependable demo, prepare one reviewed sample upload and its checked learning block. A live upload can demonstrate draft creation without claiming immediate factual verification;
f. The mechanism for review, who performs it, and the supported upload formats remain implementation decisions. The app must not claim zero hallucinations.

### Decisions Raised by the Whiteboard

a. **Game unlocks:** The new journey describes learning modules unlocking games; earlier requirements allow immediate block selection and friends-only play. Decide whether completion gates all games, only a subject-specific challenge, or is optional. Recommended interpretation: retain immediate casual play and use module completion to unlock the related challenge. This is a recommendation, not yet confirmed;
b. **Competitive tone:** The written summary includes child-versus-parent and duo-versus-duo matches; the board also says “No competition, only fun.” Casual scored matches without a public ranking are a possible reconciliation. Public leaderboards and mandatory ranked competition remain unselected;
c. **Progress:** Record child and parent module completion separately. Whether both must finish before the shared challenge opens remains undecided;
d. **Demo scope:** The upload-to-learning-to-game journey takes priority in the latest brief. The exact subset must be agreed before treating the older three-game recommendation as a delivery commitment.

The latest written summary supplies the target audience and upload workflow. Where game gating or competitive tone remains ambiguous, the open decisions above apply; this brief does not silently remove earlier friends-only, reward, or party-game requirements.

## 1. Idea

Recognising the opportunity for children and parents to learn and compete together, the project proposes an app that:

a. Supports friends-only groups, individual learning, and optional teams consisting of one child and one parent;
b. Lets players select learning blocks for on-demand play and provides a shared weekly subject for classroom events;
c. Gives participants in weekly events the week to prepare, individually or together;
d. Holds a competition at the end of the week in which parent–child teams compete against other parent–child teams.

In the optional classroom format, participants shall know the shared subject for the week. Parents and children may prepare separately on their own phones before competing together. Approximately 15 minutes per day is a suggested practice routine, not a compulsory session length or the daily activity allowance. On-demand games do not require waiting for the weekly event.

## 2. Features

The project shall:

a. Use **Supabase as its backend**;
b. Support parent–child teams;
c. Present the weekly learning theme or subject;
d. Support individual preparation on personal phones, with approximately 15 minutes of practice as an optional daily routine;
e. Offer short study activities, such as flashcards, covering the weekly subject;
f. Provide an end-of-week competition for teams to complete together;
g. Combine quiz questions and practical challenges in the competition, with the exact format still to be finalised.

The detailed competition format, final learning activities, scoring, and results presentation remain to be agreed.

## 3. Idea Two — Rewards and Learning Unlocks

Recognising the opportunity to reward learning progress, the project shall:

a. Begin with a daily limit on learning activities;
b. Award achievement badges that unlock additional learning activities or attempts;
c. Increase the available daily allowance when a qualifying badge is earned.

### Features

a. Track the daily activity allowance and remaining activities;
b. Show earned badges and the additional learning activities each qualifying badge unlocks;
c. Define the starting allowance, qualifying achievements, amount unlocked, and duration of each increase before implementation.

The combined badge and activity-unlock system is agreed in principle. Points, badges, random item boxes, and avatar customisation are product features. Leaderboards remain an option, and specific costume types remain undecided. None of these is automatically a committed demo feature.

Reward roles shall remain distinct: round scores measure game outcomes; points support the proposed cosmetic-redemption system; badges recognise achievements and may increase the activity allowance; earned boxes roll cosmetic items. Amounts, item pools, duplicate-item handling, and unlock rules remain open. Cosmetics shall not alter answer correctness or competitive scoring.

**Open design conflict:** If badges require completing activities but no activities remain, the learner could be unable to earn an unlock. Before implementation, define the allowance reset and a reachable route to each unlock. Recommended resolution: limit bonus challenges while retaining access to core learning; this recommendation changes the original broad cap and requires a product decision. Accessibility controls and equivalent presentations shall never consume extra allowance.

## 4. Idea Three — Animated Visual Explanations

Recognising that topics may be explained through visual storytelling, the project proposes a feature that:

a. Accepts a user-selected topic that maps to a reviewed learning block, including a reviewed block created from uploaded material; unsupported topics return an unavailable message;
b. Uses a supplied library of **2D pixel-art assets**;
c. Proposes AI-assisted assembly of those assets around a reviewed explanation and scene plan; factual content must pass review before publication;
d. Accompanies the animation with a voiceover explaining the topic.

### Features

a. Topic selection or search limited to supported, reviewed blocks;
b. A reusable library of pixel-art assets for the AI to work with;
c. Animated scenes illustrating the requested topic;
d. Explanatory voiceover accompanying the visuals.

The generation approach, supported topics, explanation length, and inclusion in the hackathon demo remain to be agreed.

## 5. Idea Four — Accessible Learning and Competition

Recognising the need to include children who are blind, have low vision, are Deaf, or are hard of hearing, the project proposes accessibility features across the existing learning and competition experience.

### Features — Proposed

a. Provide screen-reader-compatible instructions, flashcards, questions, answers, and results, using labelled controls and a logical reading order;
b. Explain essential animation visuals through narration and descriptive text;
c. Provide synchronised captions for speech and meaningful sounds, plus a readable transcript;
d. Pair audio feedback with visible text or symbols;
e. Support keyboard navigation, adjustable text, sufficient contrast, and reduced motion;
f. Provide equivalent alternatives to challenges that depend on sight or hearing, testing the same learning objective with comparable rewards;
g. Keep accessibility features available without earning badges or spending the daily learning allowance.

### Suggested Build Approach — Not Yet Committed

a. Store each lesson as structured content: explanation text, scene descriptions, narration, captions, and questions;
b. Present that shared content through accessible text, audio, and animation views;
c. Keep learner display and playback preferences in Supabase when account-based persistence is needed;
d. For the hackathon, demonstrate one lesson and one quiz with captions, descriptive narration, and screen-reader support;
e. Verify the complete flow using a screen reader, keyboard-only navigation, and muted audio. Seek feedback from users with relevant access needs before claiming broad accessibility support.

**Scope:** The dedicated accessibility demonstration remains a proposed extension if time permits. Accessibility requirements in this plan describe intended behaviour wherever the corresponding feature is built; they do not claim that all modes or equivalent alternatives have been implemented or tested. The extent of accessibility validation for the demo must be explicitly agreed.

Reference: [W3C guidance on accessible audio and video](https://www.w3.org/WAI/media/av/) and [WCAG 2.2](https://www.w3.org/TR/WCAG22/).

## 6. Idea Five — AI Tutor and Flexible Quiz Competition

Recognising the opportunity to combine independent learning with play and parent–child bonding, the project proposes a feature set that:

a. Lets learners explore a supported concept through reviewed explanations, with proposed AI assistance subject to the same content checks;
b. Personalises practice by selecting reviewed questions based on previous answers; newly generated questions require review before use;
c. Supports learning on its own, without requiring participation in a competition;
d. Lets learners play against AI, friends, or their parents;
e. Supports two-versus-two matches between parent–child teams;
f. Helps parents and children discover gaps in their understanding and learn together;
g. Proposes parent explanation assistance within supported blocks. Arbitrary parent-entered factual content is outside the reviewed demo content and cannot be presented as verified.

### Features

a. **Learn mode:** Topic explanations, follow-up questions, and personalised practice quizzes;
b. **Competition mode:** Quiz matches against AI or other players, including parent–child team matches;
c. **Learning feedback:** Show topics a learner understands and topics that need further practice, based on their answers;
d. **Parent explanation assistance:** AI helps a parent explain a selected concept to their child;
e. **Points and avatar customisation:** Award points for wins, with the exact reward rules still open, and let players use earned points to customise their avatar.

### Relationship to Earlier Ideas

a. These modes extend the parent–child learning app; they are separate from the DevOps office simulation;
b. Weekly shared-topic competitions are scheduled events; on-demand games can use any supported block without waiting for an event;
c. Avatar customisation is now part of the proposed concept. Specific costumes remain undecided;
d. The existing badge-based activity unlocks remain recorded; how points, badges, and activity allowances work together remains to be agreed.

The personalised quiz approach, multiplayer implementation, scoring, reward amounts, and hackathon demo scope remain open.

## 7. Idea Six — Flexible Participation, Reward Boxes, and Timed Quests

The project shall extend participation and rewards as follows:

a. Allow learners to participate independently of a parent, including playing only with friends;
b. Let players select a topic or learning block and join the corresponding activity or competition without requiring a parent–child team;
c. Retain parent–child team play as an available mode rather than a prerequisite;
d. Offer randomly rolled reward boxes containing items, including items for avatar customisation;
e. Award these boxes through play and quest completion. Item pools, drop probabilities, and reward frequency remain to be agreed;
f. Include time-based quests. Proposed formats are daily and weekly quests with explicit completion windows; exact schedules and objectives remain open. These windows are separate from optional round countdowns. An untimed round may still count towards a quest, subject to the same completion criteria.

### Content Reliability

a. Exclude AI-generated books and unsupported long-form factual content from the planned scope;
b. Base explanations, quizzes, flashcards, and animations on checked source content for each learning block, either curated in advance or confirmed and reviewed through the upload workflow in Section 0;
c. Require generated questions, answers, and explanations to be checked against that source content before they are made available to learners;
d. If the available source material does not support an answer, indicate that the answer is unavailable rather than inventing it;
e. For the hackathon demo, use pre-reviewed learning blocks and questions. These controls reduce hallucination risk; they do not establish that arbitrary AI output is error-free.

### Effect on Earlier Ideas

The parent–child format described above remains one supported mode. It is not a restriction on participation. Rewards now include random item boxes alongside points, badges, and avatar customisation; their combined economy remains to be defined. Earlier AI explanation features are subject to the content-reliability constraints in this section.

## 8. Idea Seven — Short Learning Rounds and Social Explanation Games

The proposed product direction combines short phone-based learning activities with games in which friends explain concepts to each other.

### Features — User-Proposed

a. **Guess the concept:** A player holds the phone at their forehead without seeing the displayed term; friends explain the concept so that the player can guess it, inspired by Taboo-style party games;
b. **Cooperative rounds:** Players work together and share a win, rather than every round requiring a winner and loser;
c. **Short learning feed:** A swipeable sequence of brief maths problems, texts, and concept prompts, with an active response or explanation rather than passive viewing;
d. **Explain to a friend:** Players explain a selected concept or answer to each other;
e. **Block selection:** Use the previously agreed learning blocks to choose the subject for these rounds;
f. **Verified content:** Apply the existing checked-content requirements to terms, prompts, solutions, and explanations.

The precise feed interaction, answer formats, and round durations remain to be agreed. Cooperative and competitive formats are supported where the individual game rules permit them; not every game needs both. No monthly release or competition schedule is assumed.

### Additional Suggestions — Not Yet Selected

a. **Find the mistake:** Show a short worked solution containing one deliberate, pre-reviewed error; players identify and explain the mistake;
b. **Pass the explanation:** One player explains the concept, and a partner applies it to a different example;
c. **Shared streak:** A pair completes complementary tasks towards a shared quest, with flexible time to finish.

### Suggested First Prototype — Not Yet Committed

See Section 10 for the single current prototype recommendation. The learning feed remains in the product catalogue, with demo inclusion undecided. Keep automatic AI judgement of spoken explanations outside the initial scope until a reliable evaluation approach is defined.

**Status:** Product concepts; prototype scope remains open. The previously rejected standalone bluff-game concept is not the product direction. Fact check is included later as one minigame in the party collection.

## 9. Additional Learning Minigames — Idea Pool

These are suggestions for selection, not committed demo features. Each uses pre-reviewed prompts, answers, and explanations from the selected learning block.

a. **Order chaos:** Put shuffled steps, events, or sentences into the correct order. Example: assemble the steps for solving an equation;
b. **Match pairs:** Match a concept to an example, a fraction to its visual representation, or a word to its meaning;
c. **Forbidden clues:** The same mode as the Taboom-inspired entry in Section 10; this is one game, not an additional implementation;
d. **Information split:** Each partner sees different clues; they must talk to solve a shared problem. Provide an accessible text-sharing alternative;
e. **Build the answer:** Assemble number, operator, or word tiles to reach a target value or construct a correct sentence;
f. **Estimate and reveal:** Estimate a quantity, distance, or result, then reveal the checked answer and explanation. Score closeness rather than only exact matches;
g. **Odd one out:** Choose which item does not fit an explicitly defined category, then explain why. Avoid prompts with multiple defensible answers unless those answers are supported;
h. **Learning detective:** Inspect a small set of clues to solve a case, such as identifying which circuit works, with the solution grounded in reviewed subject content.

These entries supplement the party catalogue; they are not a second prototype selection. **Learning detective** is a short clue puzzle, while **Lab mystery** adds hidden roles and group deduction. Timers should be optional or adjustable; fast responses alone should not determine learning success. Open spoken explanations should use model answers or peer discussion rather than unvalidated automatic AI scoring.

## 10. Product Direction — Learning Party-Game Collection

The app shall bring the previously discussed learning blocks, friends, parent–child teams, quests, and rewards together in a party-game collection. The following learning adaptations join the product feature catalogue. Inclusion in the catalogue does not imply that every mode will be implemented during the hackathon.

Reference: [Splash's developer-published game catalogue](https://play.google.com/store/apps/details?id=app.cranberry.splash). The names below describe our proposed learning adaptations; the app shall use its own branding, interface, artwork, and content.

### Learning Adaptations

| Reference mechanic | Proposed learning mode | Round and learning outcome |
| --- | --- | --- |
| Impostor | Secret concept | Most players receive one concept; one receives a related concept. Players give factual clues, identify the mismatch, then compare the checked definitions. No player has to invent false facts. |
| Who Am I | Concept on your forehead | Hold the phone without seeing the term. Ask yes/no questions or listen to friends' clues to identify it; reveal its definition afterwards. |
| Charades | Act the concept | Act out a process or concept for teammates to guess. Follow with the reviewed explanation; offer drawing or text clues as equivalent alternatives. |
| Taboom | Forbidden clues | Explain a concept without its listed clue words. The team guesses and then reviews the reference explanation. |
| Bomb Party | Knowledge relay | Give a valid example in the chosen category and pass the phone. Avoid repetition; build a shared streak with optional timing. Use a checked answer pool for automatic scoring. |
| Who's the Liar? | Different question | One player receives a different but related prompt. Everyone answers, compares the reasoning, and reveals both prompts and their checked answers. |
| Fake or Fact | Fact check | Vote on a reviewed statement, explain the choice, then reveal its truth value and source-backed explanation. This mode is now explicitly included following the request for the full party-game collection. |
| Would You Rather | Choose and explain | Choose between two learning strategies or outcomes and explain the trade-off. Distinguish open discussion from questions with a single checked answer. |
| Truth or Dare | Explain or try | Choose a concept question or a short learning task such as drawing a fraction, solving an equation, or explaining an example. Allow skipping and avoid personal disclosures. |
| Who's Most Likely To | Which concept fits? | Vote on which concept, process, or object best matches a clue, then reveal the explanation. Classify subject content rather than labelling children. |
| 100 Questions | Question circle | Draw short subject questions, take turns answering, and use optional follow-ups to discuss the reasoning. |
| Bet Buddy | Team prediction | Predict how many checked tasks the team can complete in a round, then attempt them together. Use in-game points only. |
| 10/10 | Rate and improve | Rate a sample explanation or worked solution against a simple rubric, then improve it and compare with a reviewed model answer. |
| Werewolves | Lab mystery | Players receive roles and partial evidence about a scientific or logical case. Discuss, identify a fictional saboteur, and solve the case; the debrief separates role-play from verified subject facts. |
| Chooser | Round selector | Randomly select a willing player, learning block, team, or next game. This supports turn-taking rather than serving as a learning assessment. |
| Sketch It | Draw and guess | Draw a subject term or diagram for the team to guess, followed by a checked definition or labelled diagram. |
| Meme Master | Caption the concept | Caption a supplied image to express a concept. Use a brief factual checklist and peer voting for creativity; popularity is not treated as proof of correctness. |

### Shared Experience

a. Choose a reviewed learning block, then a compatible game or mixed-game session. Each mode must declare its minimum players, team setup, and required content before it can be selected;
b. Play with friends, family, or parent–child teams; parent participation is optional;
c. The recommended prototype uses pass-the-phone play on one device. Independent practice on personal phones remains a product feature; synchronised multi-device matches and remote play are separate extensions. The one-device prototype is not a commitment to those extensions;
d. Show concise rules, a sample round, player/team setup, and optional or adjustable timers;
e. End each round with an answer or learning debrief, then continue to the next game;
f. Offer competitive scores and cooperative shared targets where appropriate;
g. Apply daily and weekly quests across compatible game modes. Record completion, points, badge progress, earned item boxes, and avatar customisation. Named local players are not automatically authenticated accounts: define reward ownership before persisting individual or team rewards;
h. Design captioned, text-based, screen-reader-compatible, and non-timed paths for implemented features. Provide equivalent alternatives where a mechanic depends on sight, hearing, drawing, or movement, and validate the paths actually included in the demo;
i. Offer solo practice against checked answers or AI assistance where meaningful. Social deduction and role-play modes require a group in the initial design;
j. Keep the short learning feed as an entry into practice or a party round, alongside standalone learn mode.

### Content and Scoring

Each learning block shall contain reviewed terms, definitions, example/non-example pairs, clue restrictions, questions, accepted answers, explanations, source references, and difficulty tags. Enable a mode only when that block has the content it needs. Use deterministic answer checks where possible, and model answers or peer review for open explanations and drawings. AI assistance remains subject to the earlier source-grounding and review requirements.

Use Supabase as the backend for the implemented subset of accounts, optional team links, reviewed content, sessions, quest progress, and reward inventory. Schema design, account ownership, access rules, and multiplayer synchronisation remain implementation decisions. Secret-role games must hide other players' cards during hand-off; future multi-device implementations must not expose other players' secrets.

### Hackathon Recommendation — Selection Still Open

The latest upload-based brief in Section 0 adds a subject/upload/review/study-plan stage before the game flow below. The following is a game-stage recommendation, not a confirmed delivery commitment; choose the number of games after estimating the full upload-to-play flow:

a. One pre-reviewed learning block;
b. Local pass-the-phone play with named players or teams;
c. **Concept on your forehead**, **Forbidden clues**, and **Knowledge relay**;
d. Rules, optional timers, checked explanations, and a shared results flow;
e. One sample quest and an earned cosmetic-box flow, with reward ownership defined before persistent inventory is built;
f. Supabase persistence for the selected flow, including protection against granting the same completion reward repeatedly.

For oral guessing and relay play, a designated player confirms answers against revealed reference content; typed answers can use deterministic checks. Peer confirmation supports casual play and is not evidence for a trusted global leaderboard. Add remote competition, AI opponents, generated animation, full personalisation, the feed, and remaining games only after the first playable flow works. Accessibility support for this flow must be explicitly scoped and checked.

## 11. End

The team shall conclude this plan by agreeing on:

a. The features required for the hackathon demo;
b. The user journey demonstrated from start to finish;
c. The tasks and responsibilities of each team member;
d. The criteria for considering the demo complete.

---

**Status:** Reviewed product plan. Supabase, flexible friends/family participation, the party-game catalogue, learning blocks, quests, and reward concepts are recorded. Demo selection, owners, deadlines, and reward parameters remain open. No application implementation or compliance is claimed.

## 12. Review Findings and Remaining Decisions

| Finding | Resolution or remaining decision |
| --- | --- |
| Parent–child teams required at the start but optional later | Resolved: parent–child teams are one supported format; friends can play without parents. |
| Weekly subject appeared to restrict every session | Resolved: weekly events use their shared subject; on-demand play uses any available block. |
| Three competing prototype recommendations | Consolidated: Section 0 defines the latest end-to-end journey; Section 10 recommends the game-stage subset. Final delivery scope remains open. |
| Fifteen-minute routine confused with daily limits | Resolved: practice duration is guidance; activity allowance is a separate, undecided rule. |
| Open-ended AI generation conflicted with reviewed content | Resolved at the design level: uploaded material can produce draft blocks; extracted content and generated answers require confirmation/review before scored play. The reviewer workflow remains open. |
| Timed quests conflicted with untimed play | Resolved: quest completion windows and round countdowns are separate. |
| Accessibility was both a stretch module and an apparent completed requirement | Clarified: intended requirements are documented; the demonstrated subset and validation remain open. |
| Reward system mixed scores, currency, badges, and boxes | Roles distinguished; amounts, allowance reset, unlock reachability, drops, duplicates, and ownership remain open. |
| One-device play was confused with personal-phone learning and remote multiplayer | Separated: local party play, individual practice, and synchronised online matches are distinct capabilities. |
| Social games were implied to work solo or against AI | Clarified: only compatible modes support solo play; AI opponents are an extension. |
| Duplicate games and conflicting rejected-idea notes | Consolidated Forbidden clues; distinguished clue puzzles from role games; Fact check is a catalogue mode, not the rejected standalone concept. |
| Spoken answers, drawings, and votes had no reliable automatic scoring | Clarified: use checked references and peer confirmation for casual play; automated open-answer grading is outside the initial scope. |

Before implementation, select the initial subject and difficulty within the confirmed 10–18 audience; the reviewed-content owner; final demo games and accessibility paths; local-player versus account reward ownership; scoring and reward parameters; account/access model; and task owners with hackathon deadlines. The full catalogue needs mode-specific player counts and scoring rules before each additional mode is built.


### Review Addendum — Latest Brief

The target age is now confirmed as 10–18. The upload-to-study-plan workflow and Figma/Next.js/FastAPI/Supabase stack are recorded. Remaining product decisions include module-to-game unlock rules, whether both partners must finish, casual versus ranked matches, and the content review owner. These are additions to the unresolved delivery and reward decisions above.
