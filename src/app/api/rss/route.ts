
// src/app/api/rss/route.ts
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

interface CustomFeedItem extends Parser.Item {
  sourceCategory?: string;
}

const getCategoryFromUrl = (url: string): string => {
    if (url.includes('mercados')) return 'Mercados';
    if (url.includes('economia')) return 'Economia';
    if (url.includes('business')) return 'Business';
    if (url.includes('mundo')) return 'Mundo';
    return 'Notícias';
};

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const feedUrlsParam = searchParams.get('urls');

  if (!feedUrlsParam) {
    return NextResponse.json({ error: 'Nenhuma URL de feed fornecida.' }, { status: 400 });
  }

  const feedUrls = feedUrlsParam.split(',');

  try {
    const fetchPromises = feedUrls.map(async (url) => {
      const feed = await parser.parseURL(url);
      const category = getCategoryFromUrl(url);
      return { feed, category };
    });
    
    const results = await Promise.allSettled(fetchPromises);

    let combinedItems: CustomFeedItem[] = [];
    results.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.feed.items) {
        const itemsWithSource = result.value.feed.items.map(item => ({
          ...item,
          sourceCategory: result.value.category,
        }));
        combinedItems = combinedItems.concat(itemsWithSource);
      }
    });

    combinedItems.sort((a, b) => new Date(b.isoDate!).getTime() - new Date(a.isoDate!).getTime());
    const finalItems = combinedItems.slice(0, 20);

    return NextResponse.json(finalItems);
  } catch (error) {
    console.error("Error in /api/rss:", error);
    return NextResponse.json({ error: 'Não foi possível carregar os feeds.' }, { status: 500 });
  }
}
