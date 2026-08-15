import { handler } from "../netlify/functions/api";

const response = await handler(
  {
    httpMethod: "GET",
    path: "/api/oauth/callback",
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    body: null,
    isBase64Encoded: false,
  } as never,
  {} as never,
  () => undefined
);

if (response.statusCode !== 400 || !response.body.includes("required")) {
  throw new Error(
    `Expected Netlify adapter to preserve the OAuth route; received ${response.statusCode}.`
  );
}

console.log("Netlify function smoke test passed.");
