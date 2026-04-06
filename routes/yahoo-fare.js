const express = require('express');

const router = express.Router();

router.post('/fare', async (req, res) => {
  try {
    const { from, to } = req.body;
    if (!from || !to) {
      return res.status(400).json({ error: 'from と to を入力してください' });
    }

    const result = await getYahooTransitFare(from, to);
    return res.json({
      ok: true,
      from,
      to,
      ...result
    });
  } catch (error) {
    console.error('Yahoo fare error:', error);
    return res.status(500).json({
      error: 'Yahoo路線情報からの運賃取得に失敗しました',
      detail: error.message
    });
  }
});

router.post('/roundtrip-fare', async (req, res) => {
  try {
    const { from, to } = req.body;
    if (!from || !to) {
      return res.status(400).json({ error: 'from と to を入力してください' });
    }

    const result = await getYahooTransitFare(from, to);
    return res.json({
      ok: true,
      from,
      to,
      oneWayFare: result.fare,
      roundTripFare: result.fare * 2,
      fareText: result.fareText,
      found: result.found,
      sourceUrl: result.sourceUrl
    });
  } catch (error) {
    console.error('Yahoo roundtrip fare error:', error);
    return res.status(500).json({
      error: '往復運賃の取得に失敗しました',
      detail: error.message
    });
  }
});

async function getYahooTransitFare(from, to) {
  const url = new URL('https://transit.yahoo.co.jp/search/print');
  url.searchParams.set('from', from);
  url.searchParams.set('flatlon', '');
  url.searchParams.set('to', to);

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
      'Accept-Language': 'ja-JP,ja;q=0.9,en-US;q=0.8,en;q=0.7'
    }
  });

  if (!response.ok) {
    throw new Error(`Yahoo路線情報の取得に失敗しました: ${response.status}`);
  }

  const html = await response.text();
  const routeSummaryFound = /<div[^>]*class=["'][^"']*routeSummary[^"']*["'][^>]*>/i.test(html);
  const fareSectionMatch = html.match(/<li[^>]*class=["'][^"']*fare[^"']*["'][^>]*>([\s\S]*?)<\/li>/i);
  const fareText = stripHtmlTags(fareSectionMatch?.[1] || '');
  const amountMatch = fareText.match(/\d[\d,]*/);

  return {
    fare: amountMatch ? Number(amountMatch[0].replace(/,/g, '')) : 0,
    fareText: fareText || '運賃情報なし',
    found: Boolean(routeSummaryFound && fareSectionMatch),
    sourceUrl: url.toString()
  };
}

function stripHtmlTags(value) {
  return String(value || '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&yen;/gi, '円')
    .replace(/&#165;/g, '円')
    .replace(/\s+/g, ' ')
    .trim();
}

module.exports = router;
