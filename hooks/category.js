'use strict';

function slug(name) {
  return name.replace(/-/g, '').replace(/\s+/g, '-').toLowerCase();
}

let hooks = {
  parentCategoryIdChecker: (ctx, next) => {
    let reqData;
    if (ctx.isNewInstance) {
      reqData = ctx.instance;
    } else {
      reqData = ctx.data;
    }

    let parentCategoryId = reqData.parentCategoryId + '';
    if (parentCategoryId && parentCategoryId.toLowerCase() === 'null') {
      reqData.parentCategoryId = null;
    }

    next();
  },
  generateSlug: (ctx, inst, next) => {
    let data = ctx.args.data;

    if (data.name) {
      data.slug = slug(data.name);
    }

    next();
  }
};

module.exports = Category => {
  Category.observe('before save', hooks.parentCategoryIdChecker);
  Category.beforeRemote('create', hooks.generateSlug);
};
