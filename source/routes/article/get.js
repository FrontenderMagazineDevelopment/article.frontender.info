import mongoose from 'mongoose';
import { Article } from '@frontender-magazine/models';

export async function get(req, res, next) {
  if (req.params.id === 'favicon.ico') {
    res.status(204);
    res.end();
    return next();
  }

  if (req.params.id === '') return next('Get articles');

  let result;
  try {
    const query = [];

    query.push({
      $match: {
        _id: mongoose.Types.ObjectId(req.params.id),
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

    if (result === null) throw new Error('no such article');
  } catch (error) {
    res.status(404);
    res.end();
    return next();
  }

  res.status(200);
  res.send(result);
  res.end();
  return next();
}

export default get;
