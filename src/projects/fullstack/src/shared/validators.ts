import {minPasswordLength, nameRegex} from '@/shared/constants'

import {type} from 'arktype'

export const emailValidator = type('string.email')
export const passwordValidator = type(`string >= ${minPasswordLength}`)
export const nameValidator = type(nameRegex)
