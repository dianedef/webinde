import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';

export async function GET(context) {
  const posts = await getCollection('posts');
  return rss({
    title: 'Web\'Indé',
    description: 'Web\'Indé est un blog qui parle de la création de sites web',
    stylesheet: false,
    site: context.site,
    items: posts.map((post) => ({
      title: post.data.title,
      pubDate: post.data.pubDate,
      description: post.data.description,
      link: `/${post.id}/`,
    })),
    customData: '<language>fr-fr</language>',
    canonicalUrl: 'https://webinde.fr',
  });
}
