import 'babel-polyfill';
import mongoose from 'mongoose';
import restify from 'restify';
import jwt from 'restify-jwt';
import cookieParser from 'restify-cookies';
import dotenv from 'dotenv';
import fs from 'fs';
import { resolve } from 'path';
import validator from 'restify-joi-middleware';

import Article from './models/Article';

import articlePOSTValidation from './validators/article/post';
import articlePUTValidation from './validators/article/put';
import articlePATCHValidation from './validators/article/patch';

const ENV_PATH = resolve(__dirname, '../../.env');
const CONFIG_DIR = '../config/';
const CONFIG_PATH = resolve(
  __dirname,
  `${CONFIG_DIR}application.${process.env.NODE_ENV || 'local'}.json`,
);
if (!fs.existsSync(ENV_PATH)) throw new Error('Envirnment files not found');
dotenv.config({ path: ENV_PATH });

if (!fs.existsSync(CONFIG_PATH)) throw new Error(`Config not found: ${CONFIG_PATH}`);
const config = require(CONFIG_PATH); // eslint-disable-line
const { name, version } = require('../package.json');

const jwtOptions = {
  secret: process.env.JWT_SECRET,
  getToken: req => {
    if (req.headers.authorization && req.headers.authorization.split(' ')[0] === 'Bearer') {
      return req.headers.authorization.split(' ')[1];
    } else if (req.query && req.query.token) {
      return req.query.token;
    } else if (req.cookies && req.cookies.token) {
      return req.cookies.token;
    }
    return null;
  },
};

const PORT = process.env.PORT || 3050;
const server = restify.createServer({ name, version });
server.use(restify.plugins.acceptParser(server.acceptable));
server.use(restify.plugins.queryParser());
server.use(restify.plugins.bodyParser());
server.use(restify.plugins.gzipResponse());
server.use(cookieParser.parse);
server.use(validator());

server.pre((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');
  res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type,Authorization');
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.charSet('utf-8');
  return next();
});

server.get('/ticket-departments/:id', async (req, res, next) => {


  res.setHeader('Expires', '0');

  res.status(200);
  res.send(`{"id":172,"author_id":862,"user_id":1531778,"department_id":257, solt: ${Math.random()*Date.now()}}`);
  res.end();
  return next();
});

server.get('/', jwt(jwtOptions), async (req, res, next) => {

  if (req.user.scope.isOwner === false) {
    res.status(401);
    res.end();
    return next();
  }

  if (req.url === '/favicon.ico') {
    res.state(204);
    res.end();
    return next();
  }

  const query = {};

  if (req.query.s !== undefined) {
    query.$text = {
      $search: req.query.s,
      $caseSensitive: false,
      $diacriticSensitive: false,
    };
  }

  let page = parseInt(req.query.page, 10) || 1;
  const perPage = parseInt(req.query.per_page, 10) || 20;
  const total = await Article.find(query).count();
  const pagesCount = Math.ceil(total/perPage);

  if (perPage === 0) {
    const result = await Article.find(query);
    res.status(200);
    res.send(result);
    res.end();
    return next();
  }

  res.setHeader('X-Pagination-Current-Page', page);
  res.setHeader('X-Pagination-Per-Page', perPage);
  res.setHeader('X-Pagination-Total-Count', total);
  res.setHeader('X-Pagination-Page-Count', pagesCount);

  page = Math.min(page, pagesCount);

  const links = [];
  links.push(`<${config.domain}?page=1>; rel=first`);
  if ( page > 1 ) {
    links.push(`<${config.domain}?page=${(page - 1)}>; rel=prev`);
  }
  links.push(`<${config.domain}?page=${page}>; rel=self`);
  if ( page < pagesCount ) {
    links.push(`<${config.domain}?page=${(page + 1)}>; rel=prev`);
  }
  links.push(`<${config.domain}?page=${pagesCount}>; rel=last`);
  res.setHeader('Link', links.join(', '));

  const result = await Article.find(query).skip((page - 1) * perPage).limit(perPage);
  res.status(200);
  res.send(result);
  res.end();
  return next();
});

server.post(
  {
    path: '/',
    validation: articlePOSTValidation,
  },
  jwt(jwtOptions),
  async (req, res, next) => {
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

    res.link('Location', `${config}${result._id}`);
    res.header('content-type', 'json');
    res.status(201);
    res.send(result);
    res.end();
    return next();
  },
);

// User

/**
 * Replace user by id
 * @type {String} id - user id
 */
server.put(
  {
    path: '/:id',
    validation: articlePUTValidation,
  },
  jwt(jwtOptions),
  async (req, res, next) => {
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
  },
);

/**
 * Edit user by id
 * @type {String} id - user id
 */
server.patch(
  {
    path: '/:id',
    validation: articlePATCHValidation,
  },
  jwt(jwtOptions),
  async (req, res, next) => {
    if (req.user.scope.isTeam === false) {
      res.status(401);
      res.end();
      return next();
    }

    if (req.user.scope.isOwner === false) {
      res.status(401);
      res.end();
      return next();
    }

    const result = await Article.updateOne({ _id: req.params.id }, req.params);

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
  },
);

/**
 * Get user by ID
 * @type {String} id - user id
 * @return {Object} - user
 */
server.get('/:id', jwt(jwtOptions), async (req, res, next) => {
  if (req.params.id === 'favicon.ico') {
    res.status(204);
    res.end();
    return next();
  }

  if (req.user.scope.isTeam === false) {
    res.status(401);
    res.end();
    return next();
  }

  let result;
  try {
    result = await Article.findById(req.params.id);
  } catch (error) {
    res.status(404);
    res.end();
    return next();
  }

  res.status(200);
  res.send(result);
  res.end();
  return next();
});

/**
 * Remove user by ID
 * @type {String} - user id
 */
server.del('/:id', jwt(jwtOptions), async (req, res, next) => {
  if (req.user.scope.isOwner === false) {
    res.status(401);
    res.end();
    return next();
  }

  const result = await Article.remove({ _id: req.params.id });

  if (!result.result.ok) {
    res.status(500);
    res.end();
    return next();
  }

  if (!result.result.n) {
    res.status(404);
    res.end();
    return next();
  }

  res.status(204);
  res.end();
  return next();
});

server.opts('/:id', jwt(jwtOptions), async (req, res) => {
  res.status(200);
  res.end();
});

server.opts('/', jwt(jwtOptions), async (req, res) => {
  res.status(200);
  res.end();
});

(async () => {
  mongoose.Promise = global.Promise;
  await mongoose.connect(
    `mongodb://${config.mongoDBHost}:${config.mongoDBPort}/${config.mongoDBName}`,
    { useMongoClient: true },
  );
  server.listen(PORT);
})();
