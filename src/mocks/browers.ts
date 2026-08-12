import { setupWorker } from 'msw/browser'
import { handlehot } from './handlers/hottop'
import { handlecomment } from './handlers/postcomment'
export const work=setupWorker(...handlehot,...handlecomment)