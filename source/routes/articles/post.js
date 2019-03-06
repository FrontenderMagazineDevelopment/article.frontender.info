import Article from '../../models/Article';

export async function post(req, res, next) {
  if (req.user.scope.isOwner === false) {
    res.status(401);
    res.end();
    return next();
  }

  const user = new Article(req.params);
  let result;
  try {
    result = await user.save();
  } catch (error) {
    res.status(400);
    res.send(error.message);
    res.end();
    return next();
  }

  res.header('content-type', 'json');
  res.status(201);
  res.send(result);
  res.end();
  return next();
}

export default post;
