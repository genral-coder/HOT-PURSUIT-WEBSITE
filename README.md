# HOT PURSUIT RP — FiveM Website + Store

Official website for the **HOT PURSUIT RP** FiveM roleplay server.

## Structure

```
HOT PURSUIT/
├── index.html         Main site (Home, Server, Store, Community, Applications,
│                      Media, Rules, News, Leaderboards, Support, Login, Profile)
├── site-config.js     Central config: server, social, links, jobs, applications,
│                      rules, news, leaderboards, FAQ (edit values here)
├── site.css           Styles for the new site pages
├── script.js          Store engine + SPA routing for all sections, i18n (EN/AR + RTL)
├── style.css          Store theme (dark cinematic)
├── products.json      Store products
├── github-config.js   GitHub repo settings for the admin panel
├── a7x3k9pz.html      Admin dashboard (products CRUD on GitHub)
├── admin.css / admin.js
└── images/            Logos + product images
```

## Sections

- **Home** — cinematic landing + store previews
- **Server** — status, players, IP, connect (FiveM protocol when configured), jobs/departments
- **Store** — the original store (search, categories, filters, purchase → Discord ticket flow)
- **Community** — social cards (Discord primary)
- **Applications** — police/EMS/staff/gang/business/creator
- **Media** — video/screenshot gallery slots
- **Rules** — accordion rules categories with search
- **News** — update articles/changelogs
- **Leaderboards** — rankings (dev placeholders)
- **Support** — FAQ accordion + Discord support
- **Login / Profile** — Discord OAuth architecture placeholders
- **Admin** — `a7x3k9pz.html` (products management)

## Configuration

Edit `site-config.js` to set the real server IP, player limit, Discord/social links,
server description, jobs, applications, rules, news, leaderboards and FAQ.

Store products, prices and categories are managed in the admin panel (`a7x3k9pz.html`)
which writes to `products.json` via the GitHub API.

## Language

Full English / Arabic support with RTL layout. Switch via the language button in the navbar.

## Hosting

GitHub Pages (`https://genral-coder.github.io/Hot-store/`).
