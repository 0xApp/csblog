---
title: "How I Built This Blog with Astro and Claude"
description: "A behind-the-scenes look at building CS Blog using Astro 5, SCSS, and Claude Code — including the bugs Claude introduced and how it fixed them."
pubDate: 2026-03-08T19:47:30Z
author: "Parimal Raj"
category: "Web Development"
tags: ["astro", "claude", "claude-code", "ai-development"]
draft: false
---

According to the [Stack Overflow 2025 Developer Survey](https://survey.stackoverflow.co/2025/ai), 84% of developers now use or plan to use AI tools in their workflow, and 51% use them daily. I decided to put that to the test — building this entire blog from project scaffolding to a production-ready site in a single session using [Astro](https://astro.build/) and [Claude Code](https://claude.ai/), Anthropic's CLI tool. Here is what went right, what went wrong, and what I learned along the way.

## Why Astro

I knew from the start that this blog would be built with Astro. The decision was not a coin flip — Astro is purpose-built for content-driven websites, and the numbers back it up.

With over [57,000 GitHub stars](https://github.com/withastro/astro) and npm weekly downloads that grew from 360K to over 900K during 2025 alone ([Astro Year in Review](https://astro.build/blog/year-in-review-2025/)), Astro has become one of the fastest-growing web frameworks. The [Stack Overflow 2025 survey](https://survey.stackoverflow.co/2025/technology) ranked it the 4th most admired web framework with 62.2% approval.

Unlike React-heavy frameworks like Next.js or Gatsby, Astro ships zero JavaScript to the browser by default. Every page is rendered to static HTML at build time. In benchmarks, Astro sites achieve 95-100 Lighthouse scores and ship [6x less JavaScript than Next.js](https://senorit.de/en/blog/astro-vs-nextjs-2025). 60% of Astro sites pass Core Web Vitals with "Good" scores, compared to 38% for WordPress and Gatsby ([Astro Performance Report](https://astro.build/blog/2023-web-framework-performance-report/)).

For a blog, this is exactly what you want — fast page loads, great SEO, and no unnecessary client-side JavaScript bloating the bundle. Enterprise adopters including Google, Microsoft, Adobe, and Porsche have already made the switch ([CloudCannon](https://cloudcannon.com/blog/the-top-five-static-site-generators-for-2025-and-when-to-use-them/)).

With the framework chosen, the next step was telling Claude exactly what to build.

## The Prompt That Started It All

Claude Code became the [#1 AI coding tool](https://newsletter.pragmaticengineer.com/p/ai-tooling-2026) within eight months of its May 2025 launch. In a survey of 99 professional developers by UC San Diego and Cornell, Claude Code (58 users) edged out GitHub Copilot (53) and Cursor (51) as the most-used tool ([Pragmatic Engineer](https://newsletter.pragmaticengineer.com/p/ai-tooling-2026)).

I used Claude Code to build this blog from scratch. I gave it a specification prompt with clear requirements and let it work:

```markdown
Plan to create a blog using Astro framework.

Features of blog
* Minimal CSS Overhead using sass
* All good practises of SEO
* Good Readable font that is eye pleasing
* blog listing with pagination
* Categories page
* Tags page
* Exceptionally fast page load speed

Blog Post should have
* All post should be in markdown format either .md or .mdx
* Title, publication date, Author, Read Time
* since this would be computer science related blog code snippet support
  is needed, this should loaded on page that does not have code snippet
  or lazy loading
* Possibility of adding comments via 3rd part widget like Discuss
* some of the blog post can be very lengthy in such cases there should
  a right sidebar with table of content. TOC will take H1 and H2 of
  markdown
```

Before writing a single line of code, Claude generated a detailed implementation plan. Here is a condensed version of what it produced:

### Project Structure

```
csblog/
├── astro.config.mjs
├── src/
│   ├── content.config.ts          # Content collection + Zod schema
│   ├── data/blog/                 # All .md/.mdx posts
│   ├── layouts/
│   │   ├── BaseLayout.astro       # HTML shell, fonts, global SCSS, SEO
│   │   └── BlogPostLayout.astro   # Post layout: metadata, TOC sidebar, Giscus
│   ├── components/
│   │   ├── Header.astro           # Site nav
│   │   ├── PostCard.astro         # Blog listing card
│   │   ├── Pagination.astro       # Prev/Next page links
│   │   ├── TableOfContents.astro  # Sticky sidebar TOC (H2+H3)
│   │   ├── Giscus.astro           # Lazy-loaded comments
│   │   ├── ThemeToggle.astro      # Dark mode toggle
│   │   └── ...                    # SEO, TagList, Footer, FormattedDate
│   ├── pages/
│   │   ├── index.astro
│   │   ├── blog/[...page].astro   # Paginated blog listing
│   │   ├── blog/[slug].astro      # Individual posts
│   │   ├── categories/            # Category pages with pagination
│   │   ├── tags/                  # Tag pages with pagination
│   │   └── rss.xml.ts             # RSS feed
│   └── styles/                    # SCSS architecture
│       ├── global.scss
│       ├── _variables.scss        # CSS custom properties for theming
│       ├── _prose.scss            # Blog body typography
│       └── _code.scss             # Shiki code block styling
```

### Performance Strategy

Claude's plan included a clear performance strategy:

| Optimization | Approach |
|---|---|
| Minimal client JS | Only JS: theme toggle (~10 lines inline) + Giscus lazy script |
| Self-hosted fonts | @fontsource IBM Plex packages, same-origin, pre-subsetted WOFF2 |
| Build-time syntax highlighting | Shiki inlines CSS vars, zero JS shipped |
| Lazy comments | Giscus `data-loading="lazy"` + `async` |
| Prefetching | Viewport-based prefetch for instant navigation |
| Static output | Pre-rendered HTML, CDN-ready |
| Minimal CSS | No framework, just targeted SCSS |

### Implementation Order

The plan specified a 16-step build order — from project scaffolding through to verification:

1. Scaffold project and install dependencies
2. Configure Astro (integrations, Shiki, prefetch, rehype/remark plugins)
3. Create utility functions (reading time, slugify helpers)
4. Define content collection schema with Zod validation
5. Build the SCSS architecture (variables, mixins, prose, code blocks)
6. Build all components (Header, PostCard, Pagination, TOC, Giscus, ThemeToggle)
7. Create layouts (BaseLayout with SEO/JSON-LD, BlogPostLayout with TOC sidebar)
8. Write a sample blog post with code blocks
9. Build all pages (index, blog listing, post pages, categories, tags, RSS)
10. Add `robots.txt` referencing the sitemap

The plan ended with a verification checklist targeting 95+ Lighthouse scores across Performance, SEO, Accessibility, and Best Practices.

From that plan, Claude executed every step and produced a fully working blog in a single pass. The first commit contained the entire project.

## Why Plan Mode Made the Difference

The plan above was not something I wrote. Claude Code generated it using its **Plan Mode** — a feature that separates thinking from doing. Instead of jumping straight into writing files, Plan Mode forces the AI to architect the solution first, then execute against that blueprint.

This distinction matters more than it might seem.

### What Is Plan Mode

Claude Code has two operating modes. In normal mode, it reads files, writes code, and runs commands as it goes — thinking and acting at the same time. In Plan Mode, activated with the `plan` keyword or the `/plan` command, Claude only thinks. It cannot create files, edit code, or run any commands. It can only read the codebase, research, and produce a written plan.

Once you review and approve the plan, Claude exits Plan Mode and executes. The key constraint is that the AI commits to an architecture **before** it starts building.

### Why This Matters for Complex Projects

Without Plan Mode, an AI coding assistant tends to make decisions incrementally. It picks a directory structure while creating the first file, chooses a styling approach when writing the first component, and decides on a routing strategy when building the first page. Each decision is locally reasonable, but the end result can be inconsistent — a file here follows one pattern, a file there follows another.

Plan Mode prevents this. By forcing all architectural decisions upfront — directory structure, component boundaries, styling strategy, plugin choices, data flow — the generated code is internally consistent from the start. Every file follows the same conventions because those conventions were defined before any file existed.

For this blog, Plan Mode decided:

- **SCSS architecture** with CSS custom properties for theming, rather than CSS-in-JS or Tailwind
- **Content collections** with Zod schema validation, rather than loose markdown imports
- **Component boundaries** — what gets its own `.astro` file versus inline HTML
- **SEO strategy** — `astro-seo` wrapper component, JSON-LD in the base layout, sitemap plugin
- **Performance approach** — inline theme script to prevent FOUC, lazy-loaded Giscus, build-time Shiki

All of these choices were made together, in one coherent pass. The result was a project where the SCSS variables referenced in `_code.scss` matched the theme system in `ThemeToggle.astro`, the content schema in `content.config.ts` aligned with the frontmatter in `BlogPostLayout.astro`, and the SEO component in `BaseLayout.astro` consumed the same fields as the RSS feed in `rss.xml.ts`.

### When to Use Plan Mode

Plan Mode is most valuable when:

- **The project is greenfield.** There are many interdependent decisions to make and no existing patterns to follow.
- **Multiple files need to work together.** A blog has layouts, components, pages, styles, and configuration that all reference each other.
- **You want to review before execution.** The plan is a document you can read, question, and modify before any code is written.

For small, isolated changes — fixing a bug, adding a single component — normal mode is faster. But for building something from scratch, planning first and coding second produced a dramatically better result than the alternative.

But here is where it gets interesting. The initial build was not perfect. Claude made several mistakes that required debugging — and Claude itself did the debugging too. Before we get to those bugs, here is what else Claude chose for the tech stack.

## The Rest of the Tech Stack

### SCSS with CSS Custom Properties

The styling uses SCSS for nesting and mixins, combined with CSS custom properties for theming. A `data-theme` attribute on the `<html>` element toggles between light and dark mode, and every color in the design system references a CSS variable:

```scss
[data-theme="light"] {
  --bg: #ffffff;
  --text: #1f2328;
  --accent: #0969da;
  --code-bg: #f6f8fa;
}

[data-theme="dark"] {
  --bg: #0d1117;
  --text: #e6edf3;
  --accent: #4493f8;
  --code-bg: #161b22;
}
```

The color palette is inspired by GitHub's design system, which makes code blocks feel right at home.

### Shiki Dual-Theme Syntax Highlighting

Astro uses [Shiki](https://shiki.style/) for syntax highlighting at build time. Instead of shipping a JavaScript syntax highlighter to the browser, Shiki generates pre-colored HTML during the build. The dual-theme configuration generates both light and dark mode colors simultaneously:

```javascript
shikiConfig: {
  themes: {
    light: "github-light",
    dark: "github-dark",
  },
  wrap: true,
}
```

### Other Key Pieces

- **MDX support** for rich content with components inside markdown
- **IBM Plex Sans and Mono** fonts for clean typography
- **rehype-slug and rehype-autolink-headings** for anchor links on headings
- **Giscus** for GitHub Discussions-powered comments
- **Astro Sitemap** for automatic sitemap generation
- **RSS feed** built with `@astrojs/rss`

## The Bugs Claude Introduced (And Fixed)

### Bug 1: The Broken Header Layout

After Claude added a hamburger menu for mobile navigation, the desktop header broke. The RSS icon and theme toggle appeared in the center of the header instead of sitting next to the navigation links on the right.

**What went wrong:** The header nav used `display: flex` with `justify-content: space-between` and had three flex children — the logo, an actions group (RSS + theme toggle + hamburger), and the nav links. With three children and `space-between`, the actions group got pushed to the center.

**The fix:** Remove `justify-content: space-between` and add `margin-right: auto` to the logo instead. This pushes the logo left and lets the actions and nav links naturally group together on the right side:

```scss
.header__nav {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--space-3);
}

.header__logo {
  margin-right: auto;
}
```

**Lesson learned:** When you have more than two flex children and want a "logo left, everything else right" layout, `margin-right: auto` on the first child is more predictable than `space-between`.

### Bug 2: Syntax Highlighting Disappeared in Light Mode

This was the most subtle bug. All code blocks in light mode rendered as plain monochrome text — no syntax colors at all. Dark mode worked perfectly.

**What went wrong:** The CSS tried to apply light theme colors using `color: var(--shiki-light) !important` on each code span. But that CSS variable does not exist. Here is how Shiki's dual-theme system actually works:

When you configure two themes, Shiki generates HTML like this:

```html
<span style="color:#1F2328;--shiki-dark:#E6EDF3">const</span>
```

The first theme's color goes directly into the inline `color` property. The second theme uses a CSS variable (`--shiki-dark`). There is **no** `--shiki-light` variable — the light colors are already in `color`.

So the CSS `color: var(--shiki-light) !important` resolved to nothing, and the `!important` flag meant it overrode the correct inline color. Every span became colorless.

**The fix:** Remove the light mode span override entirely and let the inline colors work. Only the dark mode needs a CSS override to switch from the inline light color to `--shiki-dark`:

```scss
[data-theme="light"] .astro-code {
  background-color: var(--code-bg) !important;
}

[data-theme="dark"] .astro-code {
  background-color: var(--code-bg) !important;
}

[data-theme="dark"] .astro-code span {
  color: var(--shiki-dark) !important;
}
```

**Lesson learned:** When working with Shiki's dual themes, understand the asymmetry — the first theme gets inline `color`, subsequent themes get CSS custom properties.

### Bug 3: Underlined Headings

All H2 and H3 headings appeared with blue underlines, looking like clickable hyperlinks rather than section headers.

**What went wrong:** The `rehype-autolink-headings` plugin with `behavior: "wrap"` wraps every heading's text content in an `<a>` tag. The prose styles applied `text-decoration: underline` to all links, including these heading anchors.

**The fix (attempt 1 — also wrong):** Claude added `color: inherit; text-decoration: none` to heading anchors. This removed the underline but also killed the blue accent color on headings, making them blend into regular text.

**The fix (attempt 2 — correct):** Keep the `text-decoration: none` but remove `color: inherit`, letting the heading links keep their blue accent color:

```scss
h2, h3, h4 {
  a {
    text-decoration: none;
  }
}
```

**Lesson learned:** When fixing one CSS issue, check that you have not broken something else. Overriding with `inherit` can be too aggressive.

### Bug 4: Black Post Card Titles

On the homepage, blog post titles were rendered in black text instead of the blue accent color used everywhere else for links.

**What went wrong:** The PostCard component explicitly set `color: var(--text)` on the title link, making it match body text instead of the link theme.

**The fix:** Change the title link color to `var(--accent)` with `var(--accent-hover)` on hover to match the site's link styling.

## What Claude Got Right

Despite the bugs, the vast majority of the build was solid on the first pass:

- **Project structure** — Clean separation of layouts, components, pages, and styles
- **Content collections** — Type-safe schema with Zod validation for frontmatter
- **Theme system** — CSS custom properties with `data-theme` attribute and localStorage persistence
- **Responsive design** — Mobile-first approach with SCSS mixins for breakpoints
- **Table of contents** — Auto-generated from heading hierarchy on blog posts
- **SEO setup** — Meta tags, Open Graph, canonical URLs, and sitemap
- **RSS feed** — Properly configured with all required fields
- **Accessibility** — ARIA labels, semantic HTML, and keyboard-navigable components

## Key Takeaways

**AI-assisted development is fast but not flawless.** Claude built a production-quality blog in minutes, but it introduced CSS bugs that required visual inspection to catch. The bugs were not random — they stemmed from misunderstanding how third-party tools work (Shiki's theme variable naming, rehype-autolink-headings' DOM output). This aligns with the broader trend — while [95% of surveyed engineers](https://newsletter.pragmaticengineer.com/p/ai-tooling-2026) use AI tools at least weekly, positive developer sentiment about AI has actually [dropped from 70% to 60%](https://survey.stackoverflow.co/2025/ai) between 2024 and 2025. The tools are powerful, but they require oversight.

**Visual testing is non-negotiable.** Three of the four bugs were only visible by looking at the rendered page. No linter or type checker would have caught them. Always preview your site in both light and dark mode.

**AI is good at fixing its own mistakes.** Once I pointed out each visual issue, Claude diagnosed the root cause and applied the correct fix. The key was providing a screenshot or clear description of the problem.

**Astro is an excellent choice for blogs.** Zero JavaScript by default, built-in content collections, and Shiki syntax highlighting make it the ideal static site generator for developer blogs in 2026. With Gatsby [effectively in decline](https://josselin.pro/blog/whats-going-on-with-gatsby-js/) after the Netlify acquisition and Next.js often being overkill for content sites, Astro hits the sweet spot for performance-focused blogs.

## Source Code

The entire source code for this blog is open source. You can browse, fork, or clone it on GitHub: [github.com/0xApp/csblog](https://github.com/0xApp/csblog.git).
