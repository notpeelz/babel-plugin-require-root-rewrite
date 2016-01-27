# babel-plugin-require-root-rewrite

A Babel plugin for requiring files relative to the project root.

## Example

**In**: `/path/to/project/containers/Register/Register.js`

``` js
const BaseAuthForm = require('~/components/BaseAuthForm');
```
*or*
``` js
import BaseAuthForm from '~/components/BaseAuthForm';
```

**Out**

``` js
var BaseAuthForm = require('../../components/BaseAuthForm');
```

## Installation

``` sh
$ npm install babel-plugin-require-root-rewrite
```

## Usage

### Via `.babelrc` (Recommended)

**.babelrc**

``` json
{
  "plugins": [
    ["babel-plugin-require-root-rewrite", {
      "pattern": "^~/",
      "basePath": "lib",
      "overrides": [
        "api",
        "server"
      ]
    }]
  ]
}
```

## Via CLI

``` sh
$ babel --plugins babel-plugin-require-root-rewrite script.js
```

### Via Node API

``` js
require('babel-core').transform('code', {
  plugins: ['babel-plugin-require-root-rewrite']
});
```
