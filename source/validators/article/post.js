import joi from 'joi';

export default {
  body: joi
    .object()
    .keys({
      url: joi
        .string()
        .required()
        .uri(),
      domain: joi.string().required(),
      title: joi.string().required(),
      lang: joi.string().required(),
      published: joi.date().required(),
      characters: joi.number(),

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
    })
    .required(),
};
