/**
 * aemijs/dom — browser-only helpers.
 *
 * These touch `document`/`window`/`cookieStore`, so they only make sense in a
 * browser (or a DOM emulator). The cross-runtime core lives in `aemijs`.
 */

import { ecs, ecsr } from './ecs.js';
import { Wait } from './wait.js';
import { Cookies } from './cookies.js';

export { ecs, ecsr } from './ecs.js';
export { Wait } from './wait.js';
export { Cookies } from './cookies.js';

export default { ecs, ecsr, Wait, Cookies };
