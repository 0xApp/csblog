// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import sitemap from "@astrojs/sitemap";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { remarkReadingTime } from "./src/utils/reading-time.mjs";
import fs from "node:fs";
import path from "node:path";

// Build a map of blog post slug → last modified date from frontmatter
const blogDir = "./src/data/blog";
const blogDateMap = new Map();

if (fs.existsSync(blogDir)) {
  const files = fs
    .readdirSync(blogDir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".mdx"));
  for (const file of files) {
    const content = fs.readFileSync(path.join(blogDir, file), "utf-8");
    const fmMatch = content.match(/^---\n([\s\S]*?)\n---/);
    if (fmMatch) {
      const fm = fmMatch[1];
      // Prefer updatedDate, fall back to pubDate
      const updatedMatch = fm.match(/updatedDate:\s*(.+)/);
      const pubMatch = fm.match(/pubDate:\s*(.+)/);
      const dateStr = updatedMatch
        ? updatedMatch[1].trim()
        : pubMatch
          ? pubMatch[1].trim()
          : null;
      if (dateStr) {
        const slug = file.replace(/\.(md|mdx)$/, "");
        blogDateMap.set(slug, new Date(dateStr));
      }
    }
  }
}

export default defineConfig({
  site: "https://csblog.org",
  prefetch: {
    prefetchAll: true,
    defaultStrategy: "viewport",
  },
  integrations: [
    mdx(),
    sitemap({
      serialize(item) {
        // Add lastmod to blog post URLs from frontmatter dates
        const blogMatch = item.url.match(/\/blog\/([^/]+)\/?$/);
        if (blogMatch) {
          const slug = blogMatch[1];
          if (blogDateMap.has(slug)) {
            item.lastmod = blogDateMap.get(slug);
          }
        }
        return item;
      },
    }),
  ],
  markdown: {
    remarkPlugins: [remarkReadingTime],
    rehypePlugins: [
      rehypeSlug,
      [rehypeAutolinkHeadings, { behavior: "wrap" }],
    ],
    shikiConfig: {
      themes: {
        light: "github-light",
        dark: "github-dark",
      },
      wrap: true,
    },
  },
});
