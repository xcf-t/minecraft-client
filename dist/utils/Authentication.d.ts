export declare class Authentication {
    static offline(username: string): AuthenticationResult;
    static login(username: string, password: string): Promise<AuthenticationResult>;
    static refresh(token: string): Promise<AuthenticationResult>;
    private static authenticate;
    private static generateHeaders;
}
export interface AuthenticationResult {
    token: string;
    name: string;
    uuid: string;
    result: boolean;
    errorType: string;
    errorMessage: string;
    errorCause: string;
}
