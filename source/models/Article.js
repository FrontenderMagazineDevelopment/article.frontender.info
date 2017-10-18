import mongoose from 'mongoose';

const ArticleSchema = new mongoose.Schema({
  url: { type: String, required: true }, // article current url
  domain: { type: String, required: true, text: true }, // domain from the url
  title: { type: String, required: true, text: true }, // title of article
  lang: { type: String, required: true }, // iso code of the language

  characters: { type: Number, required: true }, // characters count for billing

  author: { type: Array }, // Author of article or translation
  contributors: { type: Array }, // Editors, independent contributors from github

  tags: { type: Array }, // list of tags

  reponame: { type: String }, // if this is our translation — it have repo
  translations: { type: Array }, // array of thanslations in same format

  // @todo comments
  // @todo votes
});

const Article = mongoose.model('article', ArticleSchema);
export default Article;
