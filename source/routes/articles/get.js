import Article from '../../models/Article';

export async function get(req, res, next) {
  const { ARTICLES_DOMAIN } = process.env;

  const query = [];

  if (req.query.s !== undefined) {
    res.setHeader('Cache-Control', 'no-cache');
    query.push({
      $match: {
        $text: {
          $search: req.query.s,
          $caseSensitive: false,
          $diacriticSensitive: false,
        },
      },
    });
  }

  query.push({
    $unwind: {
      path: '$translations',
      preserveNullAndEmptyArrays: true,
    },
  });

  query.push({
    $lookup: {
      from: 'users',
      localField: 'author',
      foreignField: '_id',
      as: 'author',
    },
  });

  query.push({
    $lookup: {
      from: 'users',
      localField: 'translations.author',
      foreignField: '_id',
      as: 'translations.author',
    },
  });

  query.push({
    $group: {
      _id: '$_id',
      url: { $first: '$url' },
      domain: { $first: '$domain' },
      title: { $first: '$title' },
      published: { $first: '$published' },
      lang: { $first: '$lang' },
      tags: { $first: '$tags' },
      contributors: { $first: '$contributors' },
      author: { $first: '$author' },
      translations: { $push: '$translations' },
    },
  });

  let page = parseInt(req.query.page, 10) || 1;
  const perPage = parseInt(req.query.per_page, 10) || 20;
  const full = await Article.aggregate(query);
  const total = full.length;
  const pagesCount = Math.ceil(total / perPage);

  if (perPage === 0) {
    const result = full;
    res.status(200);
    res.send(result);
    res.end();
    return next();
  }

  res.setHeader(
    'Access-Control-Allow-Headers',
    'Link, X-Pagination-Page-Count, X-Pagination-Total-Count, X-Pagination-Per-Page, X-Pagination-Current-Page, Access-Control-Request-Method, X-Requested-With, Content-Type, Authorization',
  );
  res.setHeader('X-Pagination-Current-Page', page);
  res.setHeader('X-Pagination-Per-Page', perPage);
  res.setHeader('X-Pagination-Total-Count', total);
  res.setHeader('X-Pagination-Page-Count', pagesCount);

  page = Math.min(page, pagesCount);

  const links = [];
  links.push(`<${ARTICLES_DOMAIN}?page=1>; rel=first`);
  if (page > 1) {
    links.push(`<${ARTICLES_DOMAIN}?page=${page - 1}>; rel=prev`);
  }
  links.push(`<${ARTICLES_DOMAIN}?page=${page}>; rel=self`);
  if (page < pagesCount) {
    links.push(`<${ARTICLES_DOMAIN}?page=${page + 1}>; rel=prev`);
  }
  links.push(`<${ARTICLES_DOMAIN}?page=${pagesCount}>; rel=last`);
  res.setHeader('Link', links.join(', '));

  const result = await Article.aggregate(query)
    .skip(Math.max(0, (page - 1) * perPage))
    .limit(perPage);
  res.status(200);
  res.send(result);
  res.end();
  return next();
}

export default get;
