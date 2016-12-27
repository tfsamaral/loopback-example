'use strict';

let crypto = require('crypto');

function slug(name) {
  return name.replace(/-/g, '').replace(/\s+/g, '-').toLowerCase();
}

let hooks = {
  generateSku: (ctx, inst, next) => {
    let data = ctx.args.data;

    if (data.name) {
      let noSpaces = data.name.replace(/\s+/g, '');
      data.sku = crypto.createHash('md5').update(noSpaces).digest('hex');
    }

    next();
  },
  generateSlug: (ctx, inst, next) => {
    let data = ctx.args.data;

    if (data.name) {
      data.slug = slug(data.name);
    }

    next();
  },
  checkData: (ctx, next) => {
    let reqData;
    if (ctx.isNewInstance) {
      reqData = ctx.instance;
    } else {
      reqData = ctx.data;
    }
    console.log(reqData);


    next();
  }
};

module.exports = Product => {
  Product.beforeRemote('create', hooks.generateSku);
  Product.beforeRemote('create', hooks.generateSlug);
  Product.observe('before save', hooks.checkData);
};
