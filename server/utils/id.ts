import { customAlphabet } from 'nanoid'

const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789'
export const generateCuid2 = customAlphabet(alphabet, 21)
