import 'babel-polyfill';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import { resolve } from 'path';

import User from './models/User';
import Article from './models/Article';

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

let articles = require('./articles.json'); // eslint-disable-line
articles = Object.values(articles);

let contributors = require('./contributors.json'); // eslint-disable-line


(async () => {
  mongoose.Promise = global.Promise;
  await mongoose.connect(
    `mongodb://${config.mongoDBHost}:${config.mongoDBPort}/${config.mongoDBName}`,
    { useMongoClient: true },
  );

  const list = articles.map(async (article) => {

    let original = {
      url: article.url,
      domain: article.domain,
      title: article.eng,
      published: new Date(article.original_publish_date),
      lang: 'eng',
    };

    if (article.contributors !== null) {

      let authors = Object.keys(article.contributors).filter((name)=>((article.contributors[name] === 'Автор')||(article.contributors[name] === 'Aвтор')));

      if (authors.length === 0) {
        throw new Error(`Автор не найден ${JSON.stringify(article.contributors)}`);
      }

      authors = authors.filter((login) => (
        (contributors[login] !== undefined)
        || (contributors[login.toLowerCase()] === undefined)
      ));

      if (authors.length === 0) {
        throw new Error(`Не могу получить псевдоним: ${JSON.stringify(article)}`);
      }

      authors = authors.map(async (login) => {
        if ((contributors[login] === undefined) && (contributors[login.toLowerCase()] === undefined)) {
          console.log('login ', login, ' fucked');
        }
        const value = (contributors[login] !== undefined) ? contributors[login].name : contributors[login.toLowerCase()].name;
        const user = await User.find({ name: value });
        return user[0]._id;
      });

      authors = await Promise.all(authors);
      // console.log('Статья :', article.eng, 'Пользователи: ', authors);

      if (authors.length === 0) {
        throw new Error(`автор? ${JSON.stringify(article)}`);
      }
      original.author = authors;
    }

    if (article.ready === true) {

      if (article.type === 'Статья') {
        original = {
          ...original,
          lang: 'rus',
          reponame: article.reponame,
        }

      } else {
        const translation = {
          url: `https://frontender.info/${article.reponame}/`,
          domain: 'frontender.info',
          title: article.rus,
          lang: 'rus',
          reponame: article.reponame,
          published: new Date(article.magazine_publish_date),
        };

        let translators = Object.keys(article.contributors).filter((name)=>(article.contributors[name] === 'Переводчик'));

        translators = translators.filter((login) => (
          (contributors[login] !== undefined)
          || (contributors[login.toLowerCase()] === undefined)
        ));

        translators = translators.map(async (login) => {
          if ((contributors[login] === undefined) && (contributors[login.toLowerCase()] === undefined)) {
            console.log('login ', login, ' fucked');
          }
          const value = (contributors[login] === undefined) ? contributors[login.toLowerCase()].name : contributors[login].name;
          const user = await User.find({ name: value });
          return user[0]._id;
        });

        translators = await Promise.all(translators);
        translation.author = translators;

        original.translations = [translation];
      }
    }

    const toSave = new Article(original);

    await toSave.save((error, object)=>{
      if (error !== null) {
        console.log('Error: ', article.eng, " : ", error);
        throw new Error(error);
      } else {
        console.log('Article: ', object);
      }
    });

    console.log(toSave);

    return original;
  });

  await Promise.all(list).then(()=>{
    console.log('done');
    mongoose.connection.close();
  }).catch(err => {
    console.log(err);
    mongoose.connection.close();
  });
})();
