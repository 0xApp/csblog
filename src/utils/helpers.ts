export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function sortByDate(
  posts: { data: { pubDate: Date } }[],
): { data: { pubDate: Date } }[] {
  return posts.sort(
    (a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf(),
  );
}

export function filterDrafts<T extends { data: { draft?: boolean } }>(
  posts: T[],
): T[] {
  return posts.filter((post) => !post.data.draft);
}
