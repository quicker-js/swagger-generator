const path = require('path');

const SERVER_HOST = exports.SERVER_HOST = "https://huifu.api.usoft3.cn";

module.exports = {
  namespaces: {},
  output: path.resolve('src', 'api'),
  globalFiles: [],
  replaces: [],
  excludes: [],
  
  // namespaces: {
  //   "v2": path.resolve('test', 'v2.json'),
  //   "v3": path.resolve('test', 'v3.json'),
  //   'company': `${SERVER_HOST}/company-v100001/v2/api-docs`,
  //   'system': `${SERVER_HOST}/system-v100001/v2/api-docs`,
  //   'supplier': `${SERVER_HOST}/supplier-v100001/v2/api-docs`,
  //   'support': `${SERVER_HOST}/support-v100001/v2/api-docs`,
  //   'report': `${SERVER_HOST}/report-v100001/v2/api-docs`,
  // },
  // output: path.resolve('apis'),
  // globalFiles: ['ResponseResult', 'PageData', 'PageList'],
  // replaces: [
  //   {
  //     test: /-v100001/,
  //     value: '',
  //     type: 'path',
  //   },
  //   {
  //     test: /^ResponseResult/,
  //     value: 'R',
  //     type: 'name',
  //   },
  //   {
  //     test: /^PageList/,
  //     value: 'P',
  //     type: 'name',
  //   }
  // ],
  // excludes: [],
};
