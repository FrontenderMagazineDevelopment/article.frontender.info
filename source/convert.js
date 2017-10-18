import 'babel-polyfill';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import fs from 'fs';
import { resolve } from 'path';

import Users from './models/Users';

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

let contributors = require('./contributors.json'); // eslint-disable-line
contributors = JSON.parse(JSON.stringify(contributors));

(async () => {
  mongoose.Promise = global.Promise;
  await mongoose.connect(
    `mongodb://${config.mongoDBHost}:${config.mongoDBPort}/${config.mongoDBName}`,
    { useMongoClient: true },
  );

  // eslint-disable-next-line
  for (const login in contributors) {
    const user = contributors[login];
    const mongooseUser = new Users({
      name: user.name,
      avatar: user.img,
      team: user.team,
      core: false,
    });

    if (user.contacts.Twitter) mongooseUser.twitter = user.contacts.Twitter.url;
    if (user.contacts.GitHub) mongooseUser.github = user.contacts.GitHub.url;
    if (user.contacts['Сaйт']) mongooseUser.blog = user.contacts['Сaйт'].url;

    console.log(mongooseUser); // eslint-disable-line
    await mongooseUser.save(); // eslint-disable-line
  }
})();
