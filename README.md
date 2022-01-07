# AemiJS

AemiJS is a bunch of scripts and micro-lib that can help programming with vanilla JS. You can notice that there is no external import.

Code is yet poorly commented but I'll improve that and I really welcome any help, advice and questions.

Happy Coding everyone !


## Building for Browser (expose the whole bundle to global scope)

```shell
npm run build-bundle
```

## Building for browser with module usage
```shell
npm run build-module
```

## Build everything
```
npm run build
```



## Usage

### Add as submodule

```bash
git submodule add -b es-module https://github.com/aemi-dev/aemijs.git <destination folder>
```

### Update the submodule

```bash
git submodule update --init --recursive
```

### Load in HTML

#### Load bundled-version in HTML

```html
<script src="<destination folder>/aemi.min.js"></script>
```

#### Load unbundled-version in HTML

```html
<script src="<destination folder>/aemi.min.js" type="module"></script>
```

### Import in JavaScript

#### Import bundled-version in JavaScript

```javascript
const {
    Content,
    DOM,
    Dataset,
    Functional,
    Loading,
    Math,
    Move,
    MultiThread,
    Navigator,
    Performance,
    Utils
} = Aemi;
```

#### Import unbundled-version in JavaScript

```javascript
import {
    Content,
    DOM,
    Dataset,
    Functional,
    Loading,
    Math,
    Move,
    MultiThread,
    Navigator,
    Performance,
    Utils
} from 'aemi.min.js';
```
