# Taktfast Blog

## Overview
Static blog at `blog.taktfast.no` built with Astro. Content hub for Klimp and Taktfast, targeting SEO keywords like "free chord chart maker", "transpose songs", and music education topics.

## Tech Stack
- **Framework**: Astro 5 with static output
- **Content**: Markdown/MDX blog posts in `src/content/blog/`
- **Integrations**: `@astrojs/mdx`, `@astrojs/sitemap`, `@astrojs/rss`
- **No external JS frameworks** — vanilla Astro components

## Commands
- `npm run dev` — Start dev server
- `npm run build` — Build static site to `dist/`
- `npm run preview` — Preview built site locally

## Design System
Matches the Klimp/Taktfast visual language:
- **Font**: Source Sans 3 (Google Fonts)
- **Colors**: Slate blue palette (`rgba(131, 162, 219)` accent, `rgba(15, 23, 42)` text)
- **Background**: Pastel gradient `linear-gradient(135deg, #83a2db2e, #fd8e8c1f, #ffce872e)`
- **Glass effects**: `backdrop-filter: blur(20px)` with semi-transparent white backgrounds
- **Border radii**: 16px cards, 999px pill buttons, 12px code blocks
- **Shadows**: Soft minimal (`var(--shadow-sm)`, `var(--shadow-md)`)
- **Transitions**: 0.15s ease on interactive elements

CSS variables are defined in `src/styles/global.css`.

## Structure
```
src/
├── content/blog/           # Markdown posts (frontmatter: title, description, pubDate)
├── components/
│   ├── BaseHead.astro      # <head> with SEO meta tags, Open Graph, fonts
│   ├── Header.astro        # Sticky glass nav with links to Klimp + Taktfast
│   ├── Footer.astro        # Footer with tool links
│   ├── HeaderLink.astro    # Nav link with active state
│   └── FormattedDate.astro # Date formatter
├── layouts/
│   └── BlogPost.astro      # Post layout — glass card with CTA box at bottom
├── pages/
│   ├── index.astro         # Home — hero + latest posts as glass cards
│   ├── blog/index.astro    # Blog listing — grid of glass cards
│   ├── blog/[...slug].astro # Dynamic post route
│   └── rss.xml.js          # RSS feed
├── styles/
│   └── global.css          # Global styles + CSS variables
└── consts.ts               # SITE_TITLE, SITE_DESCRIPTION
```

## Blog Posts
- Each post is a `.md` or `.mdx` file in `src/content/blog/`
- Required frontmatter: `title`, `description`, `pubDate`
- Optional frontmatter: `updatedDate`, `heroImage`
- Every post automatically gets a CTA box at the bottom linking to Klimp

## Related Projects
- **Klimp**: Chord chart maker — `https://klimp.taktfast.no` (source: `../klimp/`)
- **Taktfast**: Parent site — `https://taktfast.no`
