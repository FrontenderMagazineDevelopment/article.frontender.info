import mongoose from 'mongoose';
import jwt from 'restify-jwt';
import restify from 'restify';
import cookieParser from 'restify-cookies';
import dotenv from 'dotenv';
import { resolve } from 'path';
import validator from 'restify-joi-middleware';

import articlePOSTValidation from './validators/article/post';
import articlePUTValidation from './validators/article/put';
import articlePATCHValidation from './validators/article/patch';

import { article, articles, repository } from './routes';

const ENV_PATH = resolve(__dirname, '../.env');
dotenv.config({
  allowEmptyValues: false,
  path: ENV_PATH,
});

const { MONGODB_PORT, MONGODB_HOST, MONGODB_NAME, JWT_SECRET } = process.env;

const PORT = process.env.PORT || 3050;

const { name, version } = require('../package.json');

const jwtOptions = {
  secret: JWT_SECRET,
  getToken: req => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    }
    if (req.query && req.query.token) {
      return req.query.token;
    }
    if (req.cookies && req.cookies.token) {
      return req.cookies.token;
    }
    return null;
  },
};

const server = restify.createServer({ name, version });
server.pre(restify.plugins.pre.dedupeSlashes());

server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.gzipResponse());
server.use(cookieParser.parse);
server.use(validator());
server.use(jwt(jwtOptions).unless({ method: ['OPTIONS', 'GET'] }));

server.pre((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Access-Control-Request-Method, X-Requested-With, Content-Type, Authorization',
  );
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Content-Type', 'application/json');
  res.charSet('utf-8');
  return next();
});

// Reponame

server.opts(
  {
    name: 'Check methods allowed for repository endpoint',
    path: '/repository/:reponame',
  },
  repository.opt,
);

/**
 * Get article by reponame
 * @type {String} reponame - name of repository
 * @return {Object} - repository
 */
server.get(
  {
    path: '/repository/:reponame',
    name: 'Get article by repository',
  },
  repository.get,
);

// Article

server.opts(
  {
    name: 'Check methods allowed for article',
    path: '/:id',
  },
  article.opt,
);

/**
 * Get user by ID
 * @type {String} id - user id
 * @return {Object} - user
 */
server.get(
  {
    path: '/:id',
    name: 'Get article by ID',
  },
  article.get,
);

/**
 * Replace article by id
 * @type {String} id - article id
 */
server.put(
  {
    path: '/:id',
    name: 'Replace article',
    validation: articlePUTValidation,
  },
  jwt(jwtOptions),
  article.put,
);

/**
 * Edit user by id
 * @type {String} id - user id
 */
server.patch(
  {
    path: '/:id',
    name: 'Edit article',
    validation: articlePATCHValidation,
  },
  jwt(jwtOptions),
  article.patch,
);

/**
 * Remove user by ID
 * @type {String} - user id
 */
server.del(
  {
    path: '/:id',
    name: 'Delete article by ID',
  },
  jwt(jwtOptions),
  article.del,
);

// Articles

server.opts(
  {
    path: '/',
    name: 'Check methods allowed for articles list',
  },
  articles.opt,
);

server.get(
  {
    path: '/',
    name: 'Get articles',
  },
  articles.get,
);

server.post(
  {
    path: '/',
    name: 'Create article',
    validation: articlePOSTValidation,
  },
  jwt(jwtOptions),
  articles.post,
);

(async () => {
  mongoose.Promise = global.Promise;
  await mongoose.connect(`mongodb://${MONGODB_HOST}:${MONGODB_PORT}/${MONGODB_NAME}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
  });
  server.listen(PORT);
})();
