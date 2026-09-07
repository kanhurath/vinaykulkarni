import { useState, useEffect } from 'react';
import { useReveal } from '../hooks/useReveal';
import { PageSeo } from '../components/PageSeo';
import InnerPageHero from '../components/Sections/InnerPageHero';
import ArticlesListSection from '../components/Sections/ArticlesListSection';
import InnerPageCTA from '../components/Sections/InnerPageCTA';
import { getSeo } from '../services/seoApi';

function ArticlesPage() {
  useReveal();
  const [seo, setSeo] = useState({});

  useEffect(() => {
    getSeo('articles').then(setSeo).catch(() => {});
  }, []);

  return (
    <main>
      <PageSeo
        title={seo.seo_title}
        description={seo.meta_description}
        keyword={seo.focus_keyword}
        canonical={seo.canonical_url}
        ogImage={seo.og_image_url}
        schema={seo.custom_schema}
      />
      <InnerPageHero
        eyebrow="Writing"
        title="Recent"
        titleEm="Articles"
        subtitle="Reflections on Dharma, Indian Knowledge Systems, education, and the ancient wisdom of Bhārata applied to modern life."
        breadcrumb="Articles"
      />
      <ArticlesListSection />
      <InnerPageCTA />
    </main>
  );
}

export default ArticlesPage;
