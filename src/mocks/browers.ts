import { setupWorker } from 'msw/browser'
import { handlehot } from './handlers/hottop'
export const work=setupWorker(...handlehot)