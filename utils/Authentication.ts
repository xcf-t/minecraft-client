import * as sys from 'os';
import {crypto} from 'mz';
import * as fetch from 'node-fetch';
import {Endpoints} from "./Constants";

function getUniqueIdentifier(): String {
    let data: string = sys.arch() + sys.cpus() + sys.type() + sys.homedir() + sys.endianness() + sys.tmpdir();
    let hash: crypto.Hash = crypto.createHash('sha512');
    hash.update(data, "utf8");
    return hash.digest().toString('hex');
}

export class Authentication {

    public static offline(username: string): AuthenticationResult {
        return {
            token: "null",
            name: username,
            errorMessage: "",
            result: false,
            uuid: "00000000-0000-0000-0000-000000000000",
            errorCause: "",
            errorType: ""
        }
    }

    public static login(username: string, password: string): Promise<AuthenticationResult> {
        return this.authenticate(new LoginStrategy(username, password));
    }

    public static refresh(token: string): Promise<AuthenticationResult> {
        return this.authenticate(new RefreshStrategy(token));
    }

    private static async authenticate(strategy: AuthenticationStrategy): Promise<AuthenticationResult> {

        let res: fetch.Response = await fetch.default(strategy.endpoint, new class implements fetch.RequestInit {
            method: string = 'POST';
            body: fetch.BodyInit = JSON.stringify(strategy.generatePayload());
            headers: fetch.HeaderInit = Authentication.generateHeaders();
        });

        let json: any = await res.json();

        let result: AuthenticationResult;
        if(json.hasOwnProperty('error'))
            result = new ErrorAuthenticationResult(json["cause"] || "", json["errorMessage"], json["error"]);
        else if(!json.hasOwnProperty('selectedProfile'))
            result = new ErrorAuthenticationResult("", "Your Mojang profile has no attached Minecraft profile!", "Not Found");
        else
            result = new ValidAuthenticationResult(json["selectedProfile"]["name"], json["accessToken"], json["selectedProfile"]["id"]);
        return result;
    }

    private static generateHeaders(): fetch.HeaderInit {
        let headers: fetch.Headers = new fetch.Headers();
        headers.append('Content-Type', "application/json");
        return headers;
    }

}

enum AuthenticationType {
    Login,
    Refresh
}

interface AuthenticationStrategy {
    endpoint: string;
    type: AuthenticationType;

    generatePayload(): object;
}
class LoginStrategy implements AuthenticationStrategy {
    endpoint: string = Endpoints.MINECRAFT_AUTH_SERVER + "authenticate";

    type: AuthenticationType = AuthenticationType.Login;

    private readonly username: string;
    private readonly password: string;

    constructor(username: string, password: string) {
        this.username = username;
        this.password = password;
    }

    generatePayload(): object {
        return {
            agent: {
                name: "Minecraft",
                version: 1
            },
            username: this.username,
            password: this.password,
            clientToken: getUniqueIdentifier(),
            requestUser: true
        };
    }

}
class RefreshStrategy implements AuthenticationStrategy {
    endpoint: string = Endpoints.MINECRAFT_AUTH_SERVER + "refresh";

    type: AuthenticationType = AuthenticationType.Refresh;

    private readonly token: string;

    constructor(token: string) {
        this.token = token;
    }

    generatePayload(): object {
        return {
            "accessToken": this.token,
            "clientToken": getUniqueIdentifier(),
            //sending "selectedProfile" will result in an error
            "requestUser": true
        }
    }

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
class ValidAuthenticationResult implements AuthenticationResult {

    errorCause: string;
    errorMessage: string;
    errorType: string;

    result: boolean;

    name: string;
    token: string;
    uuid: string;


    constructor(name: string, token: string, uuid: string) {
        this.name = name;
        this.token = token;
        this.uuid = uuid;

        this.errorCause = "";
        this.errorMessage = "";
        this.errorType = "";

        this.result = true;
    }

}
class ErrorAuthenticationResult implements AuthenticationResult {

    errorCause: string;
    errorMessage: string;
    errorType: string;

    result: boolean;

    name: string;
    token: string;
    uuid: string;


    constructor(errorCause: string, errorMessage: string, errorType: string) {
        this.errorCause = errorCause;
        this.errorMessage = errorMessage;
        this.errorType = errorType;

        this.result = false;

        this.name = "";
        this.token = "";
        this.uuid = "";
    }
}