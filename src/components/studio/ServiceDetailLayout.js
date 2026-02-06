import { Helmet } from 'react-helmet-async';

export default function ServiceDetailLayout({
  title,
  metaDescription,
  ogTitle,
  ogDescription,
  keywords,
  children
}) {
  return (
    <>
      <Helmet>
        <title>{title} - BeatFlow Studio</title>
        <meta name="description" content={metaDescription} />
        <meta property="og:title" content={ogTitle || `${title} | BeatFlow Studio`} />
        <meta property="og:description" content={ogDescription || metaDescription} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
        {keywords && <meta name="keywords" content={keywords} />}
      </Helmet>
      {children}
    </>
  );
}
