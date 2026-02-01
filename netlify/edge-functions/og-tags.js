export default async (request, context) => {
  const response = await context.next();
  const page = await response.text();

  const url = new URL(request.url);
  const path = url.pathname;

  // Define route-specific meta tags
  const metaTags = {
    '/artist-pricing': {
      title: 'Join BeatFlow - Artist Membership $25/year',
      description: 'Upload your music, reach new listeners, and grow your fanbase.',
      image: 'https://beatflowmediagroup.com/images/beatflow-share.png',
      imageWidth: '1024',
      imageHeight: '1024',
      url: 'https://beatflowmediagroup.com/artist-pricing'
    },
    // Add more routes as needed
  };

  const meta = metaTags[path] || {
    title: 'BeatFlow - Web Player: Licensing Music By Independent Artists',
    description: 'License and stream music from independent artists',
    image: 'https://beatflowmediagroup.com/images/beatflow-share.png',
    imageWidth: '1024',
    imageHeight: '1024',
    url: `https://beatflowmediagroup.com${path}`
  };

  // Replace meta tags in the HTML
  let modifiedPage = page
    .replace(
      /<meta property="og:title" content="[^"]*" \/>/,
      `<meta property="og:title" content="${meta.title}" />`
    )
    .replace(
      /<meta property="og:description" content="[^"]*" \/>/,
      `<meta property="og:description" content="${meta.description}" />`
    )
    .replace(
      /<meta property="og:image" content="[^"]*" \/>/,
      `<meta property="og:image" content="${meta.image}" />`
    )
    .replace(
      /<meta property="og:image:width" content="[^"]*" \/>/,
      `<meta property="og:image:width" content="${meta.imageWidth}" />`
    )
    .replace(
      /<meta property="og:image:height" content="[^"]*" \/>/,
      `<meta property="og:image:height" content="${meta.imageHeight}" />`
    )
    .replace(
      /<meta property="og:url" content="[^"]*" \/>/,
      `<meta property="og:url" content="${meta.url}" />`
    )
    .replace(
      /<meta name="twitter:title" content="[^"]*" \/>/,
      `<meta name="twitter:title" content="${meta.title}" />`
    )
    .replace(
      /<meta name="twitter:description" content="[^"]*" \/>/,
      `<meta name="twitter:description" content="${meta.description}" />`
    )
    .replace(
      /<meta name="twitter:image" content="[^"]*" \/>/,
      `<meta name="twitter:image" content="${meta.image}" />`
    )
    .replace(
      /<meta name="twitter:url" content="[^"]*" \/>/,
      `<meta name="twitter:url" content="${meta.url}" />`
    )
    .replace(
      /<title>[^<]*<\/title>/,
      `<title>${meta.title}</title>`
    );

  return new Response(modifiedPage, response);
};
