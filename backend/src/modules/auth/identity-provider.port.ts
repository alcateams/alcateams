export interface IdentityProvider {
  isEmailAvailable(email: string): Promise<boolean>;
  createAccount(email: string, password: string, pseudo: string): Promise<string>;
  deleteAccount(identityId: string): Promise<void>;
  loginAndGetToken(email: string, password: string): Promise<string>;
  validateToken(token: string): Promise<string>;
}
