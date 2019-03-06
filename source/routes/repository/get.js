import Article from '../../models/Article';

export async function get(req, res, next) {
  let result;
  try {
    const query = [];
    query.push({
      $match: {
        $or: [{ reponame: req.params.reponame }, { 'translations.reponame': req.params.reponame }],
      },
    });

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

    result = await Article.aggregate(query);
  } catch (error) {
    res.status(500);
    res.send(error.message);
    res.end();
    return next();
  }
  res.status(result.length === 0 ? 404 : 200);
  res.send(result);
  res.end();
  return next();
}

export default get;
