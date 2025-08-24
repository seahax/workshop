# @seahax/interval

Convert units of time to other units of time.

```ts
import { interval } from '@seahax/interval';

interval('10 minutes').valueOf(); // 600000
interval('10 minutes').as('milliseconds'); // 600000
interval('2 hours', '10 minutes').as('seconds'); // 7800
```
