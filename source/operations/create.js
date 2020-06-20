import { Article } from '@frontender-magazine/models';

export default async params => {
  const article = new Article(params);
  let result;
  try {
    result = await article.save();
    console.log('result: ');
    console.log(result);
    return result;
  } catch (error) {
    console.log('error: ');
    console.log(error);
  }
}
