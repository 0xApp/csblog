import rss from "@astrojs/rss";
import type { APIContext } from "astro";
import { getCollection } from "astro:content";
import { filterDrafts, sortByDate } from "../utils/helpers";

export async function GET(context: APIContext) {
  const allPosts = await getCollection("blog");
  const posts = sortByDate(filterDrafts(allPosts));

  return rss({
    title: "CS Blog",
    description:
      "Articles on computer science, programming, and software engineering.",
    site: context.site!.href,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/blog/${post.id}/`,
    })),
  });
}
