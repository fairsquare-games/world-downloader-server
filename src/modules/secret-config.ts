import { default as configModule } from "config";

const convertValueToJson = (value: string | undefined) => {
    if (!value) {
        return null;
    }

    try {
        return JSON.parse(value);
    } catch (e) {
        return value;
    }
};

const convertPropertyToEnv = (property: string) =>
    property
        .split(".")
        .map((splitProp) => splitProp.toUpperCase())
        .join("_");

const config: ISecretConfig = {
    get: (property: string): any | undefined => {
        const env = convertPropertyToEnv(property);
        return convertValueToJson(process.env[env])
            ? convertValueToJson(process.env[env])
            : configModule.has(property)
            ? configModule.get(property)
            : undefined;
    },
    has: (property: string): boolean => {
        const env = convertPropertyToEnv(property);
        return typeof process.env[env] != "undefined" || configModule.has(property);
    },
};

export interface ISecretConfig {
    get(property: string): any | undefined;

    has(property: string): boolean;
}

export default config;
