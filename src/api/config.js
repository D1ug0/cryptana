import axios from "axios";
import { appConfig } from "../config.js";

export const $apiDefined = axios.create({
  baseURL: "https://graph.defined.fi/graphql",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
    Authorization: appConfig.definedApiKey,
  },
});

export const $apiZerion = axios.create({
  timeout: 30000,
  headers: {
    accept: "application/json",
  },
  proxy: false,
});

$apiZerion.interceptors.request.use((config) => {
  config.headers.Authorization = `Basic ${Buffer.from(
    `${appConfig.zerionApiKey}:`
  ).toString("base64")}`;
  return config;
});
