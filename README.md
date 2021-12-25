# swagger-generator
swagger-generator is used to convert a swagger api to a class instance. support url or json file.

## Installing

```shell
npm i @quicker-js/swagger-generator
#or
yarn add @quicker-js/swagger-generator
```

## UseAge
Create `swagger-generator.config.js` in the root directory of the project.
```js
module.exports = {
  namespaces: {},
  output: path.resolve('src', 'api'),
  globalFiles: [],
  replaces: [],
  excludes: [],
}
```

### namespaces
This option is added in the form of keyValue, which can be a URL or a local file

```js
const path = require('path')
// "system.json" in project the root directory.
// "system.json" should a "swagger" json file.
// fetch the "https://app.com/test/v2/api-docs" url should response a "swagger" json file.
module.exports = {
  namespaces: {
    system: path.resolve('system.json'),
    test: 'https://app.com/test/v2/api-docs'
  },
}
```

### output
This option specifies the directory where the model file is generated.
```js
const path = require('path')
module.exports = {
  output: path.resolve('src', 'api'),
}
```

### globalFiles
This option is used to specify some generic class models, which are generally shared by the whole project.
```js
module.exports = {
  globalFiles: ['ResponseList', 'PageList'],
}
```

### replaces
This option is used to replace the path path or model name in the model.
```js
module.exports = {
  replaces: [
    {
      // Replace version number in path
      // For example, from:
      // @ApiRequest({
      //   url: '/order-v100001/info/{id}',
      // })
      // to:
      // @ApiRequest({
      //   url: '/order/info/{id}',
      // })
      test: /-v100001/,
      // Replace value
      value: '',
      // Replace type is path
      type: 'path',
    },
    {
      // Replace model name in name
      // For example, ResponseResult will be replaced with R
      test: /^ResponseResult/,
      // Replace value
      value: 'R',
      // Replace type is name
      type: 'name',
    },
  ],
}
```

### excludes
This option specifies which model names are excluded from the build file.
```js
module.exports = {
  // Can be string or regexp.
  excludes: [
    /\PageData/,
    'PageData'
  ]
}
```

## Documentation
- [ApiDocs](https://quicker-js.github.io/swagger-generator/)
- [Samples](https://github.com/quicker-js/swagger-generator/tree/master/sample)
- [GitRepository](https://github.com/quicker-js/swagger-generator)


## Issues
Create [issues](https://github.com/quicker-js/swagger-generator/issues) in this repository for anything related to the Class Transformer. When creating issues please search for existing issues to avoid duplicates.


## License
Licensed under the [MIT](https://github.com/quicker-js/swagger-generator/blob/master/LICENSE) License.
