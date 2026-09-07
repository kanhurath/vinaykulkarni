import { Link } from 'react-router-dom';
import { uploadUrl } from '../../services/apiUtils';
import './ArticlesSection.css';

const DELAY = ['', 'reveal-delay-1', 'reveal-delay-1', 'reveal-delay-2', 'reveal-delay-2'];

function ArticlesSection({ articles }) {
  const list = articles || [];

  return (
    <section className="articles-section" id="articles">
      <div className="articles-header reveal">
        <div>
          <div className="section-label">Writing</div>
          <h2 className="section-title">Articles &amp; Thought <em>Pieces</em></h2>
        </div>
        <Link to="/articles" className="view-all">
          View all articles
        </Link>
      </div>

      <div className="articles-grid">
        {list.map((article, i) => {
          const imgSrc = article.image_url ? uploadUrl(article.image_url) : (article.image || null);

          return (
            <a
              key={article.id}
              href={article.url}
              className={`article-card${article.featured ? ' featured' : ''} reveal ${DELAY[i] || ''}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {imgSrc && (
                <div className="article-img-wrap">
                  <img src={imgSrc} alt="" className="article-img" />
                </div>
              )}
              <div className="article-meta">{article.category}</div>
              <h3 className="article-title">{article.title}</h3>
              <p className="article-excerpt">{article.excerpt}</p>
              <div className="article-date">{article.pub_date || article.date}</div>
            </a>
          );
        })}
      </div>
    </section>
  );
}

export default ArticlesSection;
