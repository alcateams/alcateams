
import { Router } from 'express'
import { RainbowIdentityProvider } from '../auth/rainbow-identity-provider.adapter'
import { requireAuth } from '../auth/require-auth.middleware'
import { registerHandler } from './commands/register-user/register-user.http.controller'
import { loginHandler } from './commands/login-user/login-user.http.controller'
import { getCurrentUserHandler } from './queries/get-current-user/get-current-user.http.controller'
import { updateUserHandler } from './commands/update-user/update-user.http.controller'

const identityProvider = new RainbowIdentityProvider()

export const userRouter = Router()

userRouter.post('/register', registerHandler)
userRouter.post('/login', loginHandler)

userRouter.get(
    '/me',
    requireAuth(identityProvider),
    getCurrentUserHandler,
)

userRouter.patch(
    '/me',
    requireAuth(identityProvider),
    updateUserHandler,
)
