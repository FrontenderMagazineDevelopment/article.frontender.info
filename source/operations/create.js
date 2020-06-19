import { Article } from '@frontender-magazine/models';


export default params => {
  const article = new Article(params);
  article.save();
}
