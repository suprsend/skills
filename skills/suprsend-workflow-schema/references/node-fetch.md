# Fetch Node

**Schema `node_type`:** `httpapi_fetch`

## Verified behaviour (overrides the docs below)

- **Every field except `output_key` is JSONNET** — `url` and each header / query-param `key` **and** `value`. Quote literals: `{ "key": "\"Authorization\"", "value": "\"Bearer \" + data.api_token" }`. A bare word (`"key": "Authorization"`) is an unknown variable and `{{ }}` is a syntax error: the request is skipped, an error is logged, and the run continues without the data.
- **Success** is any 2xx. The request times out after **15 s**.
- **Failures:** a 5xx is retried (up to 3 attempts, with backoff), then the workflow run fails. Everything else — 4xx, 301/302 (redirects aren't followed), timeouts, connection or render errors, unsupported response types, a top-level JSON array, a body over 100 KB — is logged, **not retried**, and the run continues without the data. Make later nodes tolerate a missing `output_key`.
- **Response types:** `application/json` must be a JSON object. `text/plain`, `text/csv`, `text/html`, `text/markdown` and `application/xml` are stored as a raw string and **require `output_key`**. Any other `Content-Type` is rejected.
- **`output_key`** can't start with `$` or `ss_` (rejected on save).
- **Blocked targets:** only `http`/`https` URLs. Private, loopback and link-local IPs and SuprSend's own API hosts are rejected at runtime.

## Documentation

# Fetch

> Use the Fetch node to call an external API mid-workflow, pull dynamic data into the run context and personalize SuprSend notification content.

Fetch is an HTTP API request call to an endpoint which you can use to fetch data from an endpoint and use it as template or workflow variables. One of the use case of using fetch node could be to send digest notifications where you can add fetch node before a batch or delay function to fetch digest data and then use it inside template to trigger the notification.

Any data returned in the API request response is appended to the response_key in your fetch function and then merged with the input payload.

## Configuring fetch node

In a Fetch node, you have to define the endpoint, query params and headers. You can add both static and dynamic values in all request fields except response key. All Static values are added within `"static value"` and dynamic data is referred as `data.key`.

| Field | Description |
| - | - |
| Method* | Only `GET` method is supported in Fetch. |
| Endpoint* | A valid URL endpoint for the `GET` method. Add static URL as `"https://static_url"` and dynamic URL as `data.url_endpoint` (the URL is a JSONNET expression — never wrap it in `{{ }}`). Data for dynamic URL will be picked from trigger payload. You can also combine static and dynamic part as `"https://domain" + data.path`. |
| Params | Query Params to pass in the request, for example (limit 10) to fetch top 10 stories to show in digest notification. Similar to endpoint, param key and value are both JSONNET expressions — quote static values: `{"key": "\"limit\"", "value": "\"10\""}`. |
| Header | Any header to be passed in the request can be added as key-value pair with key being the header type and value as header value. Both key and value are JSONNET expressions — quote literal strings: `{"key": "\"Authorization\"", "value": "\"Bearer \" + data.api_token"}`. |
| Response key | Response of your `GET` request is appended against response key and merged in the workflow payload. Data is merged at parent level if response key is not set. |


### Adding variables in Fetch node

Fetch node supports JSONNET rendering language. You can add workflow trigger payload variables as `data.<key>` and internal suprsend data as `data["$tenant"].<key>`. Here's a list of variables supported in workflow engine:

| Variable | Description | JSONNET format |
| - | - | - |
| Input Payload | data passed in your event or workflow trigger. | `data.key` |
| Actor | properties of actor in your workflow trigger. In case of event, distinct_id works both as actor and recipient. | `data["$actor"].key` |
| Recipient | properties of recipient in your workflow trigger. In case of event, distinct_id works both as actor and recipient, unless override recipient is set in workflow trigger settings. In case of override recipient, properties of overridden recipient is picked. | `data["$recipient"].key` |
| Tenant | properties of the tenant passed in workflow trigger. | `data["$tenant"].key` |

### Request execution

When executing the request for a fetch function, SuprSend expects the following from your service:

* The response status is any 2xx. Redirects (301/302) are not followed and count as a failure.

* If the request response contains data, it's encoded as JSON and can be decoded into a map/dictionary/hash.

* The response to the request takes no longer than 15 seconds (the request timeout).

### Merging response to workflow input

If you have added a response key in your setting. The response of the `GET` request is first appended to the response key and then merged to the input workflow data. The response is merged at parent level if response key is empty.

*The merged data result from a fetch function step then becomes the global trigger data for all subsequent steps in the workflow run.*

Here's how Fetch function data output would look like with response key and without response key


  ```json json theme={"system"}

  // node input data
  {
    "name":"old_name",
    "location":{
      "city":"old_city"
    }
  }

  //Fetch function response with response key = fetch_response
  {
    "org":"new_org",
    "location":{
      "state":"new_state"
    }
  }

  //Merged data with response key = fetch_response
  {
    "name":"old_name",
    "location":{
      "city":"old_city"
    },
    "fetch_response":{
      "org":"new_org",
      "location":{
        "state":"new_state"
      }
    }
  }

  //Merged data with empty response key
  {
    "name":"old_name",
    "org":"new_org",
    "location":{
      "state":"new_state"
    }
  }
  ```


***


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.

## Schema Properties

| Property | Type | Required | Description |
| --- | --- | --- | --- |
| http_method | string | Yes |  |
| url | string | Yes | JSONNET script to evaluate url |
| headers | array | No |  |
| body_content_type | string | No |  |
| body | string \| null | No | JSONNET script to evaluate request body |
| query_params | array | No |  |
| output_key | string \| null | No | optional key to store the response body of api call |

The fetch node is restricted to `GET` requests only. The `body` field must be `null`.

## Example

```json
{
  "node_type": "httpapi_fetch",
  "properties": {
    "http_method": "GET",
    "url": "\"https://api.example.com/users/\" + data[\"$recipient\"].distinct_id",
    "headers": [
      { "key": "\"Authorization\"", "value": "\"Bearer \" + data.api_token" }
    ],
    "query_params": [
      { "key": "\"include\"", "value": "\"preferences\"" }
    ],
    "body": null,
    "output_key": "user_data"
  }
}
```
