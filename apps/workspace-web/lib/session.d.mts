export const DEFAULT_ORIGIN: string;
export const DEFAULT_API: string;
export function allowedMutationOrigin(request: Request, expectedOrigin?: string): boolean;
export function validCredentials(body: unknown): body is {email:string;password:string};
export function safeUser(body: unknown): {id:string;displayName:string;verificationLevel:string;locale?:string;email:string|null}|null;
export function publicError(status: number): string;
