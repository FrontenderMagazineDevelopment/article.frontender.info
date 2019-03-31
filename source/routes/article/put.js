import { Article } from '@frontender-magazine/models';

export async function put(req, res, next) {
  if (req.user.scope.isOwner === false) {
    res.status(401);
    res.end();
    return next();
  }

  const result = await Article.replaceOne({ _id: req.params.id }, req.params);

  if (!result.ok) {
    res.status(500);
    res.end();
    return next();
  }

  if (!result.n) {
    res.status(404);
    res.end();
    return next();
  }

  let user;
  try {
    user = await Article.findById(req.params.id);
  } catch (error) {
    res.status(404);
    res.end();
    return next();
  }

  res.status(200);
  res.send(user);
  res.end();
  return next();
}

export default put;
