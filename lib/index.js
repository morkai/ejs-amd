const ejs = require('ejs');
const path = require('path');
const fs = require('fs');

exports.wrapAmd = content =>
{
  return [
    'define([], function() {',
    'return ' + content,
    '});'
  ].join('\n');
};

exports.middleware = options =>
{
  let viewsDir = options.views || '';

  delete options.views;

  return (req, res, next) =>
  {
    const url = req.url;
    const ejsPath = url.replace(/\.js$/, '.ejs');

    if (!viewsDir && req.app && typeof req.app.get === 'function')
    {
      viewsDir = req.app.get('views');
    }

    const filename = path.join(viewsDir, ejsPath);

    options.client = options.client !== false;

    fs.readFile(filename, (err, template) =>
    {
      if (err)
      {
        if (err.code === 'ENOENT')
        {
          return next();
        }

        return next(err);
      }

      options.filename = filename;

      let html;

      try
      {
        html = ejs.compile(template.toString(), options).toString();
      }
      catch (err)
      {
        return next(err);
      }

      res.header('content-type', 'application/javascript');
      res.end(exports.wrapAmd(html));
    });
  };
};
