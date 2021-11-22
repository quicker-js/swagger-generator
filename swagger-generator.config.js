const path = require('path');

module.exports = {
  namespaces: {
    // v2: path.resolve("test", 'v2.json'),
    // v3: path.resolve('test', 'v3.json'),
    ss: 'http://58.33.188.228:21000/api/auth-service/v2/api-docs'
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
