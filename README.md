# sw-shared-functions

Shared functions between client and service worker

## Installation

```sh
npm i sw-shared-functions
```

## Usage

### To share

```js
import { share } from 'sw-shared-functions';

export class HelloService {
  sayHello(name: string): string {
    return `Hello, ${name}`;
  }
}

share(new HelloService());
```

### To load

```js
import { load } from 'sw-shared-functions';
import type { HelloService } from '../services/hello.service';

const helloServ = await load<HelloService>();
console.log(await helloServ.sayHello('World!'));
```

## License

MIT. Copyright (c) Kyaw Swar Thwin &lt;myanmarunicorn@gmail.com&gt;
