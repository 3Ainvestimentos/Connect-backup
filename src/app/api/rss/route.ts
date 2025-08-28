// src/app/api/rss/route.ts
import { NextResponse } from 'next/server';
import Parser from 'rss-parser';

const parser = new Parser();

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const feedUrlsParam = searchParams.get('urls');

  if (!feedUrlsParam) {
    return NextResponse.json({ error: 'Nenhuma URL de feed fornecida.' }, { status: 400 });
  }

  const feedUrls = feedUrlsParam.split(',');

  try {
    const fetchPromises = feedUrls.map(url => parser.parseURL(url));
    const feeds = await Promise.allSettled(fetchPromises);

    let combinedItems: Parser.Item[] = [];
    feeds.forEach((result) => {
      if (result.status === 'fulfilled' && result.value.items) {
        combinedItems = combinedItems.concat(result.value.items);
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
