const { parentPort, workerData, threadId } = require('worker_threads');
const axios = require('axios');
const cheerio = require('cheerio');
const url = require('url');

async function getPageUrls(websiteUrl) {
  try {
    console.log(`Worker ${threadId} is fetching URLs from ${websiteUrl}`);
    const response = await axios.get(websiteUrl);
    const $ = cheerio.load(response.data);
    const pageUrls = [];

    $('a').each((index, element) => {
      const href = $(element).attr('href');
      if (href && !href.startsWith('#')) {
        const absoluteUrl = new URL(href, websiteUrl);
        if (absoluteUrl.hostname.endsWith(new URL(websiteUrl).hostname)) {
          pageUrls.push(absoluteUrl.href);
        }
      }
    });

    return pageUrls;
  } catch (error) {
    console.error('Error:', error.message);
    return [];
  }
}

async function checkEntities(websiteUrl) {
  try {
    console.log(`Worker ${threadId} is checking entities on ${websiteUrl}`);
    const response = await axios.get(websiteUrl);
    const $ = cheerio.load(response.data);

    const title = $('title').text();
    const metaTitle = $('meta[name="title"]').attr('content');
    const metaDescription = $('meta[name="description"]').attr('content');

    const entities = [
      { type: 'title', text: title },
      { type: 'meta title', text: metaTitle },
      { type: 'meta description', text: metaDescription },
    ];

    $('img').each((index, element) => {
      const alt = $(element).attr('alt');
      entities.push({ type: 'image alt', text: alt });
    });

    for (const entity of entities) {
      for (const keyword of workerData.keywords) {
        if (entity.text && entity.text.includes(keyword)) {
          const matchInfo = {
            link: websiteUrl,
            type: entity.type,
            matchedKeyword: keyword,
            timeFound: new Date().toISOString(),
            baseUrl: new URL(websiteUrl).origin,
          };

          parentPort.postMessage(matchInfo);
        }
      }
    }
  } catch (error) {
    console.error(`Error in worker ${threadId} while checking entities on ${websiteUrl}:`, error.message);
    parentPort.postMessage({ error: error.message });
  }
}

async function crawlWebsite(websiteUrl, visited = new Set()) {
  if (visited.has(websiteUrl)) {
    return visited;
  }

  visited.add(websiteUrl);

  await checkEntities(websiteUrl);

  const pageUrls = await getPageUrls(websiteUrl);
  for (const pageUrl of pageUrls) {
    try {
      await crawlWebsite(pageUrl, visited);
    } catch (error) {
      console.error('Error visiting', pageUrl, ':', error.message);
    }
  }

  return visited;
}

crawlWebsite(workerData.website)
  .then((visitedUrls) => {
    parentPort.postMessage({
      visitedUrls: Array.from(visitedUrls),
      numVisited: visitedUrls.size,
    });
  })
  .catch((error) => {
    console.error('Error:', error.message);
    parentPort.postMessage({
      error: error.message,
    });
  });