const path = require('path');

module.exports = {
  namespaces: {
    v2: path.resolve("test", 'v2.json'),
    v3: path.resolve('test', 'v3.json')
  },
  output: path.resolve('apis'),
  replaces: [
    {
      test: /-v100001/,
      value: '',
      type: 'path'
    }
  ],
  excludes: [],
};
