# Handlebars Helpers

Most text-bearing fields in a variant's `content` are rendered with Handlebars at send time. Use `{{ variable }}` for substitution. SuprSend extends standard Handlebars with the helpers below — use them inside any string content field (subject, body, button text, etc.).

This applies to every channel where `templating_language` is `handlebars` (the default for all channels). Slack and MS Teams additionally support `jsonnet` — for those, see the channel reference.

> **Tenant variables:** use `{{$tenant.*}}` — `$brand` is the legacy namespace for the same object; never emit it in new content. The tenant display name is `{{$tenant.name}}` (not the legacy `brand_name`). Custom tenant properties always go under `{{$tenant.properties.<key>}}`. There is no `$tenant.<custom_key>` shorthand — `{{$tenant.address}}`, `{{$tenant.support_url}}`, `{{$tenant.unsubscribe_url}}` fail the render with a missing-variable error. A missing custom key fails too (`{{$tenant.properties.<missing>}}`); use `{{default $tenant.properties.<key> "…"}}`, which falls back when `properties` is `{}` but still fails if `properties` is `null`. See [Multi-tenant Variants](multi-tenant-variants.md) for the full reserved-key list and the top-level `{{$hosted_preference_url}}` / `{{$embedded_preference_url}}` variables.

## Verified behaviour (overrides the docs below)

Templates render in **strict mode**:

- **Missing variable = failed render, not empty output.** `{{x}}` fails when `x` is absent (a `null` value renders empty). `{{a.b}}` fails when `a` is absent or `null`, or when `b` is absent.
- **Inside helper and block arguments** (`if`, `with`, `each`, `default`, `compare`, …) a missing top-level name or a missing *last* key is tolerated (`{{#if x}}`, `{{default a.b "-"}}` with `a: {}`), but a missing or `null` *parent* still fails. Guard each parent level: `{{#if a}}{{#if a.b}}…{{/if}}{{/if}}`.
- **Escaping: default to `{{ }}`; use `{{{ }}}` only where HTML escaping isn't needed.** `{{ }}` escapes `&`, `<`, `>`, `"`, `'`, `` ` ``, `=` in every channel and field, and nothing un-escapes it later.
  - **Keep `{{ }}`** where the output is rendered as HTML, so user-supplied values can't inject markup: the email HTML body, and the Inbox `body` (rendered as Markdown with raw HTML allowed, which also decodes the entities).
  - **Use `{{{ }}}`** where the output is plain text: SMS, push, WhatsApp, Slack text mode, Inbox `header` / `subtext` / URLs, and the email `subject`, `preheader` and plain-text part. There `{{ }}` delivers `O&#x27;Brien &amp; Sons`, and a `preheader` is escaped a second time when it is injected into the HTML.
- **`datetime-format`:** pass an ISO-8601 string with offset or epoch **milliseconds**, and always pass a timezone: `{{datetime-format created_at "MMM D, YYYY h:mm a" "America/New_York"}}`. Epoch seconds and numeric strings misparse; without a timezone nothing is converted.
- **Array helpers:** `unique`, `list-agg`, `itemAt`, and `join` return empty for a `null` value but fail the render when the variable is absent.
- **Two-argument `compare` / `condition`** use `===`: `{{#compare plan "pro"}}…{{/compare}}`.

**Supported, not covered below:**

- Block params: `{{#each items as |item i|}}{{i}}: {{item.name}}{{/each}}`
- `includeZero=true` on `if`: `{{#if count includeZero=true}}`
- Whitespace control: `{{~ var ~}}` trims whitespace on that side.
- Parent context inside `each`: `{{../title}}`
- **Not supported:** partials (`{{> name}}`) — render error.

## Documentation

# Handlebars helpers

> Handlebars syntax, built-in helpers, and the custom helpers available in SuprSend templates — conditionals, dates, JSON, strings, math, arrays, and translations.

SuprSend templates use Handlebars to insert variables and format data. This page is the syntax and helper reference. Slack and MS Teams templates use a different language — see [JSONNET templates](/docs/jsonnet-templates).

> **Warning:**
  Block helpers (`#if`, `#each`, `#with`, `#unless`, `#compare`, …), partials, and comments are rejected in WhatsApp templates and in SMS that needs pre-approved copy (e.g. India DLT). Inline helpers (`default`, `datetime-format`, `join`, …) and plain variables are allowed. Block helpers do work for US SMS on Twilio and MessageBird.


## Syntax

| Syntax | What it does |
| :- | :- |
| `{{ var }}` | Default — use it unless HTML escaping isn't needed. HTML-escapes `<`, `>`, `"`, `'`, `&`, `` ` ``, `=` into HTML entities in **every** channel and field. Safe in HTML outputs (email HTML body, Inbox body). In plain-text outputs (SMS, push, WhatsApp, Slack text, email subject / preheader / plain-text part) the entities are delivered as-is (`O&#x27;Brien &amp; Sons`). |
| `{{{ var }}}` | Unescaped. Use only where HTML escaping isn't needed: plain-text outputs (SMS, push, WhatsApp, Slack text, Inbox header / subtext / URLs, email subject / preheader / plain-text part), so `'`, `&`, `=` arrive unchanged. Can inject HTML — don't use it for user-supplied values in the email HTML body or Inbox body. |
| `{{array.[0].name}}` | First element of `array`. Use `[1]`, `[2]`, … for later items. |
| `{{[first name]}}` | Names with spaces, capitals, or special characters. |

## Reserved variables

These are injected at render time, not by your trigger payload. Full preview context is on [Templates](/docs/templates).

| Syntax | Source |
| :- | :- |
| `{{$recipient.name}}` | Recipient profile. |
| `{{$actor.name}}` | Actor on the trigger. If the trigger has no actor, `$actor` is unset and this fails the render — wrap it in `{{#if $actor}}…{{/if}}`. |
| `{{$tenant.name}}` | Tenant reserved property. Custom values: `{{$tenant.properties.address}}`. Full list: [Tenant templates](/docs/tenant-templates). |
| `{{$batched_events_count}}` | Count of events in a [batch](/docs/batch) or [digest](/docs/digest). |
| `{{$batched_events.[0].name}}` | Field on the nth batched event (`[0]` is the first). |

## Helper index

| Helper | Kind | Purpose |
| :- | :- | :- |
| [`if`](#if) | block (builtin) | Render a block when a value is truthy |
| [`unless`](#unless) | block (builtin) | Inverse of `if` |
| [`each`](#each) | block (builtin) | Iterate an array or object |
| [`with`](#with) | block (builtin) | Shift context to a nested object |
| [`lookup`](#lookup) | inline (builtin) | Look up a value in an object against a key, where the key is the value of another variable |
| [`default`](#default) | inline | Fallback when the value is empty, `null`, or `undefined` |
| [`compare`](#compare) | block | Conditional block (`==`, `===`, `typeof`, …) |
| [`condition`](#condition) | inline (boolean) | Comparison inside `{{#if (condition ...)}}` |
| [`and`](#and) / [`or`](#or) | inline (boolean) | Combine truthy checks inside `{{#if ...}}` |
| [`datetime-format`](#datetime-format) | inline | Format a date or `"now"` with Moment.js + optional timezone |
| [`jsonStringify`](#jsonstringify) / [`jsonParse`](#jsonparse) / [`jsonPath`](#jsonpath) | inline | Serialize, parse, or read nested JSON |
| [`lowercase`](#lowercase) / [`uppercase`](#uppercase) / [`capitalize`](#capitalize) | inline | String case |
| [`add`](#add) / [`subtract`](#subtract) / [`multiply`](#multiply) / [`divide`](#divide) / [`round`](#round) / [`mod`](#mod) | inline | Math |
| [`unique`](#unique) / [`list-agg`](#list-agg) / [`itemAt`](#itemat) / [`join`](#join) / [`length`](#length) | inline | Arrays |
| [`t`](#t) | inline | Localized string from translation files |

<Tip>
  You can ask the copilot in the template editor to add a Handlebars helper. Describe the output you want and include your variables.
</Tip>

## Built-in helpers

These are the default Handlebars helpers. They work in every template that uses Handlebars ([official reference](https://handlebarsjs.com/guide/builtin-helpers.html)).

### if

Renders a block when the value is truthy. Use [`condition`](#condition), [`and`](#and), or [`or`](#or) inside `{{#if}}` when you need a comparison or combined check. `if` itself does not compare two values — that is [`compare`](#compare).

**Syntax**

```handlebars theme={"system"}
{{#if is_premium}}
true_block
{{else}}
false_block
{{/if}}
```

`{{else}}` is optional. Chain further branches with `{{else if ...}}`.

**Examples**

```handlebars theme={"system"}
{{#if is_premium}}
Welcome to premium
{{else}}
Upgrade to premium
{{/if}}

{{#if (condition plan '==' "pro")}}
Pro features
{{/if}}

{{#if (condition plan '==' "pro")}}
Pro features
{{else if (condition plan '==' "starter")}}
Starter features
{{else}}
Free plan
{{/if}}
```

Falsy values for `if`, `unless`, `with`, and `each`: `false`, `0`, `""`, `null`, `undefined`, and an empty array `[]`. An empty object `{}` is truthy. The custom `and` / `or` helpers treat `[]` as truthy. Add `includeZero=true` (`{{#if count includeZero=true}}`) to treat `0` as truthy.

### unless

Renders a block when the value is falsy. Inverse of [`if`](#if).

**Syntax**

```handlebars theme={"system"}
{{#unless unsubscribed}}
true_block
{{/unless}}
```

**Example**

```handlebars theme={"system"}
{{#unless unsubscribed}}
You are subscribed to updates
{{else}}
You have unsubscribed
{{/unless}}
```

### each

Iterates over an array or object. Inside the block, properties of the current item are in scope.

**Syntax**

```handlebars theme={"system"}
{{#each array_object}}
{{variable_key}}
{{else}}
empty_block
{{/each}}
```

**Example**

```handlebars theme={"system"}
{{#each admins}}
{{name}}{{#unless @last}}, {{/unless}}
{{else}}
No admins
{{/each}}
```

**Mock data**

```json theme={"system"}
{
  "admins": [
    { "name": "steve", "id": "1", "city": "Palo Alto" },
    { "name": "Olivia", "id": 2, "city": "Houston" }
  ]
}
```

With this mock data, the example above renders: `steve, Olivia`

| Variable | Meaning |
| :- | :- |
| `this` | The current item. Use `{{this}}` when the list is strings or numbers, not objects with named fields. |
| `@index` | Position of this item, starting at 0. |
| `@first` | `true` only on the first item. |
| `@last` | `true` only on the last item. Use this to add commas between items and skip the trailing one. |
| `@key` | Property name when you loop over an object instead of an array. |

`{{else}}` renders when the array is missing or empty.

### with

Shifts context to a nested object so you can write `{{city}}` instead of `{{address.city}}`.

**Syntax**

```handlebars theme={"system"}
{{#with object}}
{{property}}
{{else}}
empty_block
{{/with}}
```

**Example**

```handlebars theme={"system"}
{{#with order.address}}
{{city}}, {{country}}
{{else}}
No address on file
{{/with}}
```

**Mock data**

```json theme={"system"}
{
  "order": {
    "address": { "city": "Austin", "country": "US" }
  }
}
```

With this mock data, the example above renders: `Austin, US`

If `order` exists but `order.address` is absent, `null`, or `[]`, the example renders `No address on file` instead. If `order` itself is missing, the whole render fails; if `order.address` is `{}`, the block runs and `{{city}}` fails. Guard the parent with `{{#if order}}` and use `{{default city ""}}` for fields that may be absent.

### lookup

Looks up a value in an object against a key, where the key is the value of another variable.

For example, if `status_key` value is `shipped`, `{{lookup statuses status_key}}` is the same as `{{statuses.shipped}}`.

**Syntax**

```handlebars theme={"system"}
{{lookup object key}}
{{lookup array index}}
```

**Example**

```handlebars theme={"system"}
{{lookup statuses status_key}}
{{lookup email 1}}
```

**Mock data**

```json theme={"system"}
{
  "status_key": "shipped",
  "statuses": {
    "shipped": "On the way",
    "delivered": "Delivered"
  },
  "email": ["joe@abc.com", "steve@abc.com"]
}
```

With this mock data, the example above renders:

| Expression | Output |
| :- | :- |
| `{{lookup statuses status_key}}` | `On the way` |
| `{{lookup email 1}}` | `steve@abc.com` |

## Conditionals

### default

Returns the variable if it has a value; otherwise returns the fallback. Treats `""`, `null`, and `undefined` as empty.

**Syntax**

```handlebars theme={"system"}
{{default variable "fallback"}}
```

| Parameter | Required | Description |
| :- | :- | :- |
| `variable` | yes | Value to print. |
| `fallback` | yes | Used when `variable` is empty, `null`, or `undefined`. |

**Examples**

Each row is the output of the expression with that mock data.

| Expression | Data | Output |
| :- | :- | :- |
| `{{default name "user"}}` | `{"name":"Joe"}` | `Joe` |
| `{{default name "user"}}` | `{"name":""}` | `user` |
| `{{default name "user"}}` | `{"name":null}` | `user` |
| `{{default name "user"}}` | `{"city":"Bangalore"}` | `user` |

### compare

Renders a block when the comparison is truthy. For email, you can also hide a row or block with [display conditions](/docs/email-template#display-conditions) instead of a helper.

**Syntax**

```handlebars theme={"system"}
{{#compare name '==' "Mike"}}
true_block
{{else}}
false_block
{{/compare}}
```

`{{else}}` is optional. If you omit it and the comparison is falsy, the helper renders nothing.

**Examples**

Each row is the output of the expression with that mock data.

| Expression | Data | Output |
| :- | :- | :- |
| `{{#compare candidate_count '==' 1}}is{{else}}are{{/compare}}` | `{"candidate_count":1}` | `is` |
| `{{#compare candidate_count '==' 1}}is{{else}}are{{/compare}}` | `{"candidate_count":3}` | `are` |
| `{{#compare candidate_count '==' 1}}is{{/compare}}` | `{"candidate_count":3}` | *(empty)* |

**Operators**

| Operator | Returns truthy when | Sample |
| :- | :- | :- |
| `==` | LHS equals RHS | `1 == "1"` |
| `===` | LHS value and type match RHS | `1 === 1` |
| `>` | LHS is greater than RHS | `2 > 1` |
| `<` | LHS is less than RHS | `1 < 2` |
| `>=` | LHS is greater than or equal to RHS | `2 >= 2` |
| `<=` | LHS is less than or equal to RHS | `1 <= 2` |
| `!=` | LHS is not equal to RHS | `3 != 1` |
| `!==` | LHS value or type does not equal RHS | `1 !== "1"` |
| `typeof` | `typeof` LHS equals the RHS type string | `typeof` value is `"string"` |

Nested paths need the parent key present — see [Nested paths](#nested-paths). `{{#compare order.status '==' "shipped"}}` makes the whole render fail if `order` is missing. Guard the parent first:

```handlebars theme={"system"}
{{#if order}}
  {{#compare order.status '==' "shipped"}}
  Your order has shipped
  {{/compare}}
{{/if}}
```

### condition

Returns a boolean for use inside `{{#if}}`. Use this when you need a comparison as a **subexpression**, not a block. A missing top-level variable is compared as `undefined`: `'=='` / `'==='` against a value return `false`, but `'!='` / `'!=='` return `true` and `'==' null` returns `true`. A missing *parent* (`order.status` with no `order`) fails the render. With only two arguments (`condition a b`, or `{{#compare a b}}`) the operator defaults to `===`.

**Syntax**

```handlebars theme={"system"}
{{#if (condition name '==' "Mike")}}
true_block
{{else}}
false_block
{{/if}}
```

**Examples**

Each row is the output of the expression with that mock data.

| Expression | Data | Output |
| :- | :- | :- |
| `{{#if (condition candidate_count '==' 1)}}is{{else}}are{{/if}}` | `{"candidate_count":1}` | `is` |
| `{{#if (and (condition plan '==' "pro") has_access)}}Premium{{/if}}` | `{"plan":"pro","has_access":true}` | `Premium` |
| `{{#if (condition plan '==' "pro")}}Pro{{else}}Free{{/if}}` | `{}` | `Free` |

Operators match [`compare`](#compare), except `typeof` is **not** supported.

> **Note:**
  `condition` is not a block helper. Use `{{#if (condition ...)}}`, not `{{#condition ...}}`.


### and

Returns `true` only when every argument is truthy. Use inside `{{#if}}`.

**Syntax**

```handlebars theme={"system"}
{{#if (and condition1 condition2)}}
true_block
{{/if}}
```

**Example**

You can pass truthy variables, or build each check with [`condition`](#condition):

```handlebars theme={"system"}
{{#if (and is_premium has_access)}}
Welcome to premium
{{/if}}

{{#if (and (condition plan '==' "pro") (condition seats '>' 1))}}
Team workspace
{{/if}}
```

**Mock data**

```json theme={"system"}
{
  "is_premium": true,
  "has_access": true,
  "plan": "pro",
  "seats": 5
}
```

With this mock data, the example above renders: `Welcome to premium` and `Team workspace`

### or

Returns `true` when at least one argument is truthy. Use inside `{{#if}}`.

**Syntax**

```handlebars theme={"system"}
{{#if (or condition1 condition2)}}
true_block
{{/if}}
```

**Example**

You can pass truthy variables, or build each check with [`condition`](#condition):

```handlebars theme={"system"}
{{#if (or is_admin is_owner)}}
Admin controls
{{/if}}

{{#if (or (condition plan '==' "pro") (condition plan '==' "enterprise"))}}
Paid features
{{/if}}
```

**Mock data**

```json theme={"system"}
{
  "is_admin": false,
  "is_owner": true,
  "plan": "enterprise"
}
```

With this mock data, the example above renders: `Admin controls` and `Paid features`

## Dates

### datetime-format

Returns a formatted date string. Throws an error if the value is not a valid date.

**Syntax**

```handlebars theme={"system"}
{{datetime-format variable "format string" "timezone"}}
```

| Parameter | Required | Description |
| :- | :- | :- |
| `variable` | yes | An ISO-8601 string with offset (`"2023-09-26T10:00:00Z"`) or epoch **milliseconds**. Epoch **seconds** are read as milliseconds (`1695686400` → 1970-01-20) and numeric strings (`"1695686400"`) misparse. Use `"now"` for the time the template renders. Throws an error if the date is invalid. |
| `format string` | yes | Moment.js format. See [format tokens](https://momentjs.com/docs/#/displaying/format/). Example: `"dddd, MMMM Do YYYY, h:mm:ss a"` → `Sunday, February 14th 2010, 3:25:50 pm`. |
| `timezone` | no, but always pass one | IANA timezone to convert into. Without it nothing is converted: an ISO string keeps its own offset, and epoch ms / `"now"` use the server's local zone. See the [tz database list](https://en.wikipedia.org/wiki/List_of_tz_database_time_zones). |

**Example**

```handlebars theme={"system"}
{{datetime-format date "ddd, MMM Do YYYY, h:mm:ss a"}}
{{datetime-format date "[Today is] dddd"}}
{{datetime-format date "Do MMMM, YYYY" "America/Chicago"}}
```

**Mock data**

```json theme={"system"}
{
  "date": "2023-09-26T00:00:00Z"
}
```

With this mock data, the example above renders:

| Expression | Output |
| :- | :- |
| `{{datetime-format date "ddd, MMM Do YYYY, h:mm:ss a"}}` | `Tue, Sep 26th 2023, 12:00:00 am` |
| `{{datetime-format date "[Today is] dddd"}}` | `Today is Tuesday` |
| `{{datetime-format date "Do MMMM, YYYY" "America/Chicago"}}` | `25th September, 2023` |

## JSON

### jsonStringify

Converts a JSON value to a string. Use this to pass a whole object or array into an Inbox template's custom JSON field.

**Syntax**

```handlebars theme={"system"}
{{jsonStringify variable}}
```

`variable` must be valid JSON-serializable input.

**Example**

```handlebars theme={"system"}
{{jsonStringify this}}
{{jsonStringify users}}
```

**Mock data**

```json theme={"system"}
{
  "likes": 3,
  "comments": 4,
  "users": ["Olivia", "Steve"]
}
```

With this mock data, the example above renders:

| Expression | Output |
| :- | :- |
| `{{jsonStringify this}}` | `{"comments":4,"likes":3,"users":["Olivia","Steve"]}` — keys come out sorted, and at send time `this` also contains `$recipient`, `$tenant`, `$brand`, `$workflow`, `$event_name`, and preference URLs. Stringify a specific key instead. |
| `{{jsonStringify users}}` | `["Olivia","Steve"]` |

### jsonParse

Parses a JSON string into an object or array. Throws an error if the string is not valid JSON.

**Syntax**

```handlebars theme={"system"}
{{jsonParse json_string}}
```

| Parameter | Required | Description |
| :- | :- | :- |
| `json_string` | yes | A JSON-encoded string. Throws an error if the string is not valid JSON. |

**Example**

```handlebars theme={"system"}
{{jsonPath (jsonParse payload) "plan"}}
```

**Mock data**

```json theme={"system"}
{
  "payload": "{\"plan\":\"pro\",\"seats\":5}"
}
```

With this mock data, the example above renders: `pro`

### jsonPath

Reads a nested value from an object using a path string. Combine with `jsonParse` when the source is a JSON string.

**Syntax**

```handlebars theme={"system"}
{{jsonPath object "path"}}
```

| Parameter | Required | Description |
| :- | :- | :- |
| `object` | yes | Object or array to read from. |
| `path` | yes | Dot-separated path, for example `profile.city`. |

**Example**

```handlebars theme={"system"}
{{jsonPath user "profile.city"}}
```

**Mock data**

```json theme={"system"}
{
  "user": {
    "profile": {
      "city": "Barcelona"
    }
  }
}
```

With this mock data, the example above renders: `Barcelona`

## Strings

All three helpers return `''` when the value is not a string.

### lowercase

Converts a string to lowercase.

**Syntax**

```handlebars theme={"system"}
{{lowercase value}}
```

| Expression | Output |
| :- | :- |
| `{{lowercase "JOE"}}` | `joe` |

### uppercase

Converts a string to uppercase.

**Syntax**

```handlebars theme={"system"}
{{uppercase value}}
```

| Expression | Output |
| :- | :- |
| `{{uppercase "joe"}}` | `JOE` |

### capitalize

Uppercases the first character of a string.

**Syntax**

```handlebars theme={"system"}
{{capitalize value}}
```

| Expression | Output |
| :- | :- |
| `{{capitalize "joe"}}` | `Joe` |

## Math

All math helpers throw an error if an argument is not a JSON number — numeric strings like `"12"` throw too. Exceptions: `null` is allowed in `add` / `subtract` (counted as `0`) and skipped by `multiply`; `divide` by `0` returns `Infinity`. `add`, `subtract`, and `multiply` accept multiple arguments or an array of numbers.

### add

Returns the sum.

**Syntax**

```handlebars theme={"system"}
{{add number1 number2 ...}}
```

**Examples**

| Expression | Data | Output |
| :- | :- | :- |
| `{{add 9 4}}` | — | `13` |
| `{{add 9 4 2}}` | — | `15` |
| `{{add likes comments}}` | `{"likes":3,"comments":4}` | `7` |
| `{{add scores}}` | `{"scores":[1,2,3]}` | `6` |

### subtract

Returns the difference, left to right.

**Syntax**

```handlebars theme={"system"}
{{subtract number1 number2 ...}}
```

**Examples**

| Expression | Data | Output |
| :- | :- | :- |
| `{{subtract 9 4}}` | — | `5` |
| `{{subtract 9 4 1}}` | — | `4` |
| `{{subtract likes 1}}` | `{"likes":3}` | `2` |

### multiply

Returns the product.

**Syntax**

```handlebars theme={"system"}
{{multiply number1 number2 ...}}
```

**Examples**

| Expression | Data | Output |
| :- | :- | :- |
| `{{multiply 9 4}}` | — | `36` |
| `{{multiply 2 3 4}}` | — | `24` |
| `{{multiply ARR billing_months}}` | `{"ARR":300,"billing_months":12}` | `3600` |

### divide

Returns the left operand divided by the right operand.

**Syntax**

```handlebars theme={"system"}
{{divide dividend divisor}}
```

**Examples**

| Expression | Data | Output |
| :- | :- | :- |
| `{{divide 14 4}}` | — | `3.5` |
| `{{divide total_bill billing_months}}` | `{"total_bill":3600,"billing_months":12}` | `300` |

### round

Rounds to the nearest integer.

**Syntax**

```handlebars theme={"system"}
{{round number}}
```

**Examples**

| Expression | Data | Output |
| :- | :- | :- |
| `{{round 12.5}}` | — | `13` |
| `{{round (divide 15 2)}}` | — | `8` |
| `{{round rating}}` | `{"rating":4.6}` | `5` |

### mod

Returns the remainder of `dividend / divisor`. The result takes the sign of the dividend. Throws an error if an input is not a number. A divisor of `0` returns `NaN` (no error).

**Syntax**

```handlebars theme={"system"}
{{mod dividend divisor}}
```

**Examples**

| Expression | Data | Output |
| :- | :- | :- |
| `{{mod 14 4}}` | — | `2` |
| `{{mod total_bill billing_months}}` | `{"total_bill":3600,"billing_months":12}` | `0` |

## Arrays

`unique` and `list-agg` pull a field out of objects; `join` and `itemAt` then format that list. For example, `{{join (unique cities "city")}}`.

### unique

Returns unique items from an array. Duplicate values are dropped.

**Syntax**

```handlebars theme={"system"}
{{unique variable "key_string"}}
```

| Parameter | Required | Description |
| :- | :- | :- |
| `variable` | yes | Must be an array. Throws an error otherwise. |
| `key_string` | when items are objects | Field to uniquify on. Nested paths use `a.b` or `a['b']`. |

**Examples**

| Expression | Data | Output |
| :- | :- | :- |
| `{{unique email}}` | `{"email":["joe@abc.com","steve@abc.com","joe@abc.com"]}` | `joe@abc.com,steve@abc.com` |
| `{{unique cities "city"}}` | `{"cities":[{"city":"San Francisco"},{"city":"Austin"},{"city":"Austin"}]}` | `San Francisco,Austin` |
| `{{unique personal_details "name.first_name"}}` | `{"personal_details":[{"name":{"first_name":"john"}},{"name":{"first_name":"mike"}}]}` | `john,mike` |

Printed directly, the array is comma-joined with **no space**. Wrap it in `join` for `, `: `{{join (unique email)}}` → `joe@abc.com, steve@abc.com`.

### list-agg

Collects values from an array into a new array. Unlike `unique`, **duplicates are kept**.

**Syntax**

```handlebars theme={"system"}
{{list-agg variable "key_string"}}
```

| Parameter | Required | Description |
| :- | :- | :- |
| `variable` | yes | Must be an array. |
| `key_string` | when items are objects | Field to collect. Nested paths use `a.b`. |

**Examples**

| Expression | Data | Output |
| :- | :- | :- |
| `{{join (list-agg email) ", "}}` | `{"email":["joe@abc.com","steve@abc.com","joe@abc.com"]}` | `joe@abc.com, steve@abc.com, joe@abc.com` |
| `{{join (list-agg cities "city") ", "}}` | `{"cities":[{"city":"San Francisco"},{"city":"Austin"},{"city":"Austin"}]}` | `San Francisco, Austin, Austin` |
| `{{join (unique cities "city") ", "}}` | `{"cities":[{"city":"San Francisco"},{"city":"Austin"},{"city":"Austin"}]}` | `San Francisco, Austin` |

### itemAt

Returns the item at an index. In a [batch](/docs/batch) or [digest](/docs/digest), use this to name the first person and `$batched_events_count` for the rest — *liked by Mike and 3 others*.

**Syntax**

```handlebars theme={"system"}
{{itemAt variable index}}
```

| Parameter | Required | Description |
| :- | :- | :- |
| `variable` | yes | Must be an array. Throws an error otherwise. |
| `index` | yes | A non-negative integer. A non-number throws; a negative or fractional index returns empty. |

**Examples**

| Expression | Data | Output |
| :- | :- | :- |
| `{{itemAt email 1}}` | `{"email":["joe@abc.com","steve@abc.com","joe@abc.com"]}` | `steve@abc.com` |
| `liked by {{itemAt (unique $batched_events "name") 0}} and {{subtract $batched_events_count 1}} others` | `{"$batched_events_count":4,"$batched_events":[{"name":"Mike"},{"name":"Juliana"},{"name":"Nova"},{"name":"Steve"}]}` | `liked by Mike and 3 others` |

> **Note:**
  Works on arrays of primitives (string, boolean, number). For an array of objects, combine with `unique` or `list-agg` first, as in the batch example.


### join

Concatenates array values with a separator between each item.

**Syntax**

```handlebars theme={"system"}
{{join variable "separator"}}
```

| Parameter | Required | Description |
| :- | :- | :- |
| `variable` | yes | Array of primitives (string, number, boolean). Throws an error otherwise. |
| `separator` | no | String inserted between items. Defaults to `", "` (comma + space). Falsy items (`0`, `""`, `false`, `null`) are silently dropped; a plain string input is returned unchanged. |

**Examples**

| Expression | Data | Output |
| :- | :- | :- |
| `{{join email}}` | `{"email":["joe@abc.com","steve@abc.com","joe@abc.com"]}` | `joe@abc.com, steve@abc.com, joe@abc.com` |
| `{{join email ' - '}}` | `{"email":["joe@abc.com","steve@abc.com","joe@abc.com"]}` | `joe@abc.com - steve@abc.com - joe@abc.com` |

> **Note:**
  For an array of objects, combine with `unique` or `list-agg` first. `{{join (unique cities "city")}}` returns `San Francisco, Austin`; `{{join (list-agg cities "city")}}` keeps duplicates.


### length

Returns the number of truthy items in an array (`null`, `0`, `""`, `false` are not counted: `[1,null,0,"",2]` → `2`), or the character length of a string. Returns `0` for any other type.

**Syntax**

```handlebars theme={"system"}
{{length variable}}
```

**Examples**

| Expression | Data | Output |
| :- | :- | :- |
| `{{length cities}}` | `{"cities":[{"city":"San Francisco"},{"city":"Austin"},{"city":"Austin"}]}` | `3` |
| `{{length name}}` | `{"name":"Justin"}` | `6` |
| `{{length active}}` | `{"active":true}` | `0` |

## Localization

### t

Resolves a translated string from the template's translation files. Only works when translations are enabled for your account, a translation version is published, and the key exists — otherwise the render fails. Translation strings see **only** the hash arguments you pass (`name=first_name`), not the template's variables. Interpolated values are HTML-escaped twice (`A&B` → `A&amp;amp;B`; `{{{t ...}}}` still escapes them once), and a literal `&` in a translation renders as `&amp;` under `{{t ...}}`. Prefer `{{{t ...}}}` and keep `&`, `<`, `'` out of interpolated values.

Use this helper to keep one template and swap copy per locale. For file setup, pluralization examples, and CLI/API management, see [Translations](/docs/translations).

**Syntax**

```handlebars theme={"system"}
{{t "translation_key"}}
{{t "namespace:key"}}
{{t "items.count" count=n}}
```

**Examples**

**Translation files** (mock)

```json en.json theme={"system"}
{
  "welcome": "Hello",
  "greeting": "Hi {{name}}",
  "cart": {
    "items": {
      "zero": "Your cart is empty",
      "one": "You have 1 item in your cart",
      "other": "You have {{count}} items in your cart"
    }
  }
}
```

```json email.en.json theme={"system"}
{
  "subject": "Your order shipped"
}
```

**Template data**

```json theme={"system"}
{
  "first_name": "Joe",
  "item_count": 3
}
```

With this mock data, the examples render:

| Type | Expression | Output |
| :- | :- | :- |
| Key (common namespace) | `{{t "welcome"}}` | `Hello` |
| Namespaced key | `{{t "email:subject"}}` | `Your order shipped` |
| Interpolation | `{{t "greeting" name=first_name}}` | `Hi Joe` |
| Plural | `{{t "cart.items" count=item_count}}` | `You have 3 items in your cart` |

> **Warning:**
  `t` throws an error if translations are disabled, translation data is empty, the key is missing, or required interpolation variables are absent.


## Nested paths

> **Warning:**
  Helpers only resolve a nested path if every parent key exists. `{{default place.city "San Francisco"}}` does **not** fall back when `place` is missing — the whole expression fails.


Guard the parent first:

```handlebars theme={"system"}
{{#if place}}
  {{default place.city "San Francisco"}}
{{else}}
  San Francisco
{{/if}}

{{#if person}}
  {{#if person.address}}
    {{#if person.address.current}}
      {{default person.address.current.city "Los Angeles"}}
    {{/if}}
  {{/if}}
{{/if}}
```

## Troubleshooting


  ### Apostrophes or special characters arrive as `&#x27;` / `&amp;`
    Double braces (`{{ var }}`) turn special characters into safe codes so they display as text. This happens in every channel, not just preview: SMS, push, WhatsApp, and Inbox deliver `O'Brien & Sons` as `O&#x27;Brien &amp; Sons`.

    To print the value exactly as stored — apostrophes, `&`, or URLs — use triple braces: `{{{ variable }}}`.
  

  ### How does SuprSend avoid HTML injection when printing variables?
    By default, `{{ var }}` converts characters that could change the page (`<`, `>`, `"`, `'`, `&`) into safe text codes (HTML entities). That way a variable can't inject HTML or scripts into the message.

    Use `{{{ var }}}` when you need the raw characters: URLs, and any text in SMS, push, WhatsApp, or Inbox. In email HTML, use it only for values you trust.
  

  ### When do I use if vs compare vs condition?
    **`if`** — show a block when something is present or true. Example: is this user on premium?

    **`compare`** — show a block when two values match (or don't). Example: is `plan` equal to `"pro"`?

    **`condition`** — the same kind of comparison as `compare`, but you place it *inside* `if` so you can combine checks with `and` / `or`: `{{#if (and (condition plan '==' "pro") has_access)}}`.

    `condition` does not support `typeof`. Use `compare` for that.
  

  ### Why did the t helper throw an error in the template preview?
    Preview errors when `t` can't find a string to print. That happens if translations are off for this template, the translation files are empty, the key isn't in the default locale file, or the string expects a variable (like `{{name}}`) that you didn't pass.

    Turn translations on, add the key to the default locale file, and pass every variable the string uses. See [Translations](/docs/translations).
  

  ### Why is my nested default not rendering?
    You're asking for a field inside an object that isn't in the data — for example `place.city` when `place` itself is missing. Helpers can't look inside something that isn't there, so the fallback never runs.

    Check the parent first with `{{#if place}}`, then use `default`. See [Nested paths](#nested-paths).
  


## Next steps

<CardGroup cols={2}>
  <Card title="Translations" icon="language" href="/docs/translations">
    File setup, pluralization, and locale fallback for the t helper.
  </Card>

  <Card title="JSONNET templates" icon="code" href="/docs/jsonnet-templates">
    Slack and MS Teams templates, which do not use Handlebars.
  </Card>
</CardGroup>


This documentation is built and hosted on [Mintlify](https://mintlify.com), a developer documentation platform.
