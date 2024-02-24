const client = require('../utils/redis');
const ApiFeatures = require('../utils/apiFeatures');

const cache = async (req, res, next) => {
  await client.connect();
  let data;
  if (req.params.id) {
    data = await client.get(`product-${req.params.id}`);
  } else {
    data = await client.get(`products`);
  }
  if (data) {
    await client.disconnect();
    const products = JSON.parse(data);

    console.log(products);
    const documentsCounts = await products.length;

    const features = new ApiFeatures(products, req.query)
      .filter()
      .sort()
      .limitFields()
      .paginate(documentsCounts);

    const { query, paginationResult } = features;

    const product = await query;
    console.log(product);

    res.status(200).json({
      status: 'success',
      result: products.length,
      paginationResult,
      data: product,
    });
  } else {
    console.log('next to controller');
    next();
  }
};

module.exports = cache;
