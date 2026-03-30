<div align="center">

# AutoFarming

**One person. AI tools. Ship products until something sticks.**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Built with Claude Code](https://img.shields.io/badge/Built%20with-Claude%20Code-blueviolet)](https://claude.ai)
[![Ralph Loop](https://img.shields.io/badge/Powered%20by-Ralph%20Loop-ff6b6b)](https://github.com/snarktank/ralph)

</div>

---

This is an experiment. Build mini products with AI, ship them fast, see what works, kill what doesn't.

Every product in this repo was built by [Claude Code](https://claude.ai) + [Ralph Loop](https://github.com/snarktank/ralph) with minimal human intervention. The AI writes code, reviews its own work, commits, and iterates. A human decides what to build and whether the result is any good.

## How it works

```
1. Pick an idea
2. Write a PRD checklist (prd.json)
3. Run Ralph Loop  →  AI builds until every item passes
4. Play it. Ship it. Measure it.
5. If it works, double down. If not, next idea.
```

The entire production pipeline runs on a single bash script:

```bash
cd games/tower-defense
./ralph.sh 50 sonnet     # 50 iterations, Claude Sonnet
```

Each iteration: read PRD → implement the next failing item → commit → push → repeat.

## Products

### 🏰 Soul Tower Defense `[in progress]`

A tower defense game with a twist: **Tower Fusion**.

Kill enemies, collect their souls, feed souls to your towers. Your towers absorb enemy abilities and evolve. Fire goblin soul + Arrow tower = Fire Arrow with burn damage. Boss soul = mutant tower with a completely new form.

"The more you kill, the stronger your towers become."

- **4 base towers** — Arrow, Cannon, Ice, Lightning
- **4 enemy types** — Goblin, Wolf, Golem, Dragon
- **8+ fusion combinations** — each changes tower behavior and visuals
- **Soul collection system** — drag-and-drop souls onto towers
- **Stage progression** — 5+ maps with 1-3 star ratings

Tech: Vanilla HTML/CSS/JS, Canvas 2D, Web Audio API. No build step, no dependencies.

```bash
open games/tower-defense/index.html
```

## The Stack

| Layer | Tool | Role |
|-------|------|------|
| Coding | [Claude Code](https://claude.ai) | Writes all the code |
| Iteration | [Ralph Loop](https://github.com/snarktank/ralph) | Runs Claude in a loop until PRD passes |
| Planning | [gstack](https://github.com/garrytan/gstack) | Product design, code review, QA |
| Hosting | GitHub Pages | Free, instant deploy |
| Mobile | Capacitor | Web → Android/iOS |
| Monetization | AdMob + IAP | Ads and in-app purchases |

## Philosophy

Most indie hackers spend months on one product. Most fail. The math is simple: **more attempts = more chances**.

AI makes each attempt nearly free. Claude Code + Ralph Loop can build a playable game in a day. The bottleneck is no longer engineering. It's taste — knowing what's worth building and when to move on.

This repo is the lab notebook. Every product, every iteration, every failure is tracked in git.

## Structure

```
autoFarming/
├── games/
│   └── tower-defense/     ← Soul Tower Defense
│       ├── ralph.sh       ← Ralph Loop script
│       ├── prd.json       ← PRD checklist (24 items)
│       ├── PROMPT.md      ← AI instructions per iteration
│       ├── AGENTS.md      ← Learnings from each iteration
│       └── js/            ← Game source
├── CLAUDE.md              ← AI behavior rules
└── README.md
```

## Run Ralph Loop yourself

```bash
git clone https://github.com/kangraemin/autoFarming.git
cd autoFarming/games/tower-defense
./ralph.sh 30 sonnet    # needs Claude Code CLI installed
```

## License

MIT
</div>
