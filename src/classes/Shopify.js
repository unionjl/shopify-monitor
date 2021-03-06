const xml2js = require('xml2js');
const request = require('request');

let Shopify = {};

Shopify.parseSitemap = function(url, proxy, userAgent, callback) {

  request({
    method: 'get',
    url: 'https://' + url + '/sitemap_products_1.xml',
    proxy: proxy,
    gzip: true,
    headers: {
      'User-Agent': userAgent
    }
  }, (err, resp, body) => {

    if (err) return callback(null, err);

    if (body.indexOf('errors') > -1) {
      return callback('Invalid XML Result, IP may be banned or invalid Shopify site.', null);
    }

    const parsed = xml2js.parseString(body, (error, result) => {

      if (err || result == undefined) return callback(error, true);

        let products = result['urlset']['url'];
        products.shift()


      return callback(null, products);

    })

  })
}

Shopify.getStockData = function(url, proxy, callback) {
      let status;
      let totalStock = 0

      request({
          url: url + '.json',
          method: 'get',
          proxy: proxy,
          headers: {
              'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_11_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/54.0.2840.98 Safari/537.36'
          }
      }, function(err, res, body) {

          if (tryParseJSON(body)) {
              let jsonBodyProduct = JSON.parse(body)
              let data = []
              for (let i = 0; i < jsonBodyProduct.product.variants.length; i++) {
                  totalStock += jsonBodyProduct.product.variants[i].inventory_quantity
                  const baseUrl = url.split('/products')[0] // remove the product path from url

                  const variantData = {
                      baseUrl,
                      id: jsonBodyProduct.product.variants[i].id,
                      title: jsonBodyProduct.product.variants[i].option1
                  };

                  // data.push('<' + baseUrl + '/cart/' + jsonBodyProduct.product.variants[i].id + ':1' + '|' + jsonBodyProduct.product.variants[i].option1 +'>')
                  data.push(variantData);
              }

              if (totalStock > 0) {
                  status = 'Available'
              } else {
                  status = 'Sold Out'
              }

              if (isNaN(totalStock)) {
                var finalStock = 'Unavailable'
              } else {
                var finalStock = totalStock
              }

              let image = "https://i.imgur.com/FpYrCaS.png";

              if (jsonBodyProduct.product.image != null) {
                image = jsonBodyProduct.product.image.src
              }

              let product = {
                  title: jsonBodyProduct.product.title,
                  handle: jsonBodyProduct.product.handle,
                  stock: finalStock,
                  status: status,
                  links: data,
                  img: image,
                  price: '$' + jsonBodyProduct.product.variants[0].price
              }

              console.log(data);

              return callback(product, null)

          } else {
              // console.log('error', 'No valid JSON was returned.')
              //return process.exit()
          }
      })
}

function tryParseJSON(jsonString) {
  try {
    let o = JSON.parse(jsonString);
    if (o && typeof o === "object") {
      return o;
    }
  } catch (e) {}
  return false;
}

module.exports = Shopify;
