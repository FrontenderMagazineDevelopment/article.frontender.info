import joi from 'joi';

export default {
  body: joi
    .object()
    .keys({
      url: joi.string(),
      domain: joi.string(),
      title: joi.string(),
      lang: joi.string(),
      characters: joi.number(),
      published: joi.date(),

      author: joi.array().items(joi.string()),
      contributors: joi.array().items(
        joi.object().keys({
          login: joi.string().required(),
          url: joi.string().uri(),
        }),
      ),

      tags: joi.array().items(joi.string()),

      reponame: joi.string(),

      translations: joi.array(),

      _id: joi.string().required(),
      __v: joi.number(),
    })
    .required(),
};
