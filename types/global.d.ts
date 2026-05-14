export interface LoginToken {
    userid: number;
    sys_username: string;
    sys_password: string;
    sys_parent_user: number;
    groupid: number;
    company: string;
    address: string;
    billing_address: string;
    mobile_number: string;
    mobile_app_token: string;
    payment: number;
    logo: string;
    access_label: null | string;
    extra: string;
}

export type LoginTokenState = {
    loggedIn: LoginToken | false
    setLoggedIn: Dispatch<SetStateAction<false | LoginToken>>
}