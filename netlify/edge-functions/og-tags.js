export default async (request, context) => {
  try {
    const response = await context.next();

    // Only process HTML responses
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('text/html')) {
      return response;
    }

    const page = await response.text();
    const url = new URL(request.url);
    const path = url.pathname;

    // Define route-specific meta tags
    const metaTags = {
      '/': {
        title: 'BeatFlow Media - License Royalty-Free Music for Your Content',
        description: 'License royalty-free production music for YouTube, TikTok, films, podcasts & more. Copyright-safe music for content creators. No strikes, ever.',
      },
      '/browse-music': {
        title: 'Browse Music - BeatFlow Media',
        description: 'Browse and license royalty-free music by genre, mood, and style. Find the perfect track for your project.',
      },
      '/explore-premium': {
        title: 'Premium Music Licensing - BeatFlow Media',
        description: 'Explore premium music licensing plans for creators and businesses.',
      },
      '/studio': {
        title: 'BeatFlow Studio - Professional Music Production Services',
        description: 'Professional music production, mixing, mastering, and custom composition services.',
      },
    };

    const meta = {
      title: 'BeatFlow - Web Player: Licensing Music By Independent Artists',
      description: 'License and stream music from independent artists',
      image: 'https://beatflowmediagroup.com/images/beatflow-share.png',
      imageWidth: '1024',
      imageHeight: '1024',
      url: `https://beatflowmediagroup.com${path}`,
      ...metaTags[path]
    };

    // Replace meta tags in the HTML (handle both " />" and "/>" formats)
    let modifiedPage = page
      .replace(
        /<meta property="og:title" content="[^"]*"\s*\/?>/,
        `<meta property="og:title" content="${meta.title}"/>`
      )
      .replace(
        /<meta property="og:description" content="[^"]*"\s*\/?>/,
        `<meta property="og:description" content="${meta.description}"/>`
      )
      .replace(
        /<meta property="og:image" content="[^"]*"\s*\/?>/,
        `<meta property="og:image" content="${meta.image}"/>`
      )
      .replace(
        /<meta property="og:image:width" content="[^"]*"\s*\/?>/,
        `<meta property="og:image:width" content="${meta.imageWidth}"/>`
      )
      .replace(
        /<meta property="og:image:height" content="[^"]*"\s*\/?>/,
        `<meta property="og:image:height" content="${meta.imageHeight}"/>`
      )
      .replace(
        /<meta property="og:url" content="[^"]*"\s*\/?>/,
        `<meta property="og:url" content="${meta.url}"/>`
      )
      .replace(
        /<meta name="twitter:title" content="[^"]*"\s*\/?>/,
        `<meta name="twitter:title" content="${meta.title}"/>`
      )
      .replace(
        /<meta name="twitter:description" content="[^"]*"\s*\/?>/,
        `<meta name="twitter:description" content="${meta.description}"/>`
      )
      .replace(
        /<meta name="twitter:image" content="[^"]*"\s*\/?>/,
        `<meta name="twitter:image" content="${meta.image}"/>`
      )
      .replace(
        /<meta name="twitter:url" content="[^"]*"\s*\/?>/,
        `<meta name="twitter:url" content="${meta.url}"/>`
      )
      .replace(
        /<title>[^<]*<\/title>/,
        `<title>${meta.title}</title>`
      );

    return new Response(modifiedPage, {
      status: response.status,
      headers: response.headers
    });
  } catch (error) {
    // If anything fails, pass through the original response unmodified
    // This prevents 5xx errors from crashing the entire site
    return context.next();
  }
};
