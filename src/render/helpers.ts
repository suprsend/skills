import Handlebars from "handlebars";

type SchemaObj = {
  properties?: Record<
    string,
    {
      type?: string;
      description?: string;
      enum?: string[];
      [key: string]: unknown;
    }
  >;
  required?: string[];
};

export function registerHelpers(hbs: typeof Handlebars): void {
  // {{json obj}} — Render as formatted JSON
  hbs.registerHelper("json", (context: unknown) => {
    return new hbs.SafeString(JSON.stringify(context, null, 2));
  });

  // {{schema-table schemaObj}} — JSON Schema properties → markdown table
  hbs.registerHelper("schema-table", (schema: SchemaObj) => {
    if (!schema?.properties) return "";
    const required = new Set(schema.required ?? []);
    const rows = Object.entries(schema.properties).map(([name, prop]) => {
      const type = prop.type ?? "any";
      const req = required.has(name) ? "Yes" : "No";
      const desc = (prop.description ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ");
      return `| ${name} | ${type} | ${req} | ${desc} |`;
    });
    const header = "| Property | Type | Required | Description |\n| --- | --- | --- | --- |";
    return new hbs.SafeString(`${header}\n${rows.join("\n")}`);
  });

  // {{schema-enum enumArray}} — Enum values → markdown list
  hbs.registerHelper("schema-enum", (enumArr: string[]) => {
    if (!Array.isArray(enumArr)) return "";
    return new hbs.SafeString(enumArr.map((v) => `- \`${v}\``).join("\n"));
  });

  // {{section markdown "## Heading"}} — Extract section by heading
  hbs.registerHelper("section", (markdown: string, heading: string) => {
    if (typeof markdown !== "string") return "";
    const headingMatch = heading.match(/^(#{1,6})\s+(.+)$/);
    if (!headingMatch) return "";

    const level = headingMatch[1].length;
    const title = headingMatch[2].trim();
    const lines = markdown.split("\n");
    let startIdx = -1;
    let endIdx = lines.length;

    for (let i = 0; i < lines.length; i++) {
      const lineMatch = lines[i].match(/^(#{1,6})\s+(.+)$/);
      if (!lineMatch) continue;
      if (startIdx === -1) {
        if (lineMatch[2].trim() === title && lineMatch[1].length === level) {
          startIdx = i;
        }
      } else if (lineMatch[1].length <= level) {
        endIdx = i;
        break;
      }
    }

    if (startIdx === -1) return "";
    return new hbs.SafeString(lines.slice(startIdx, endIdx).join("\n").trim());
  });

  // {{trim text}} — Strip whitespace
  hbs.registerHelper("trim", (text: string) => {
    return typeof text === "string" ? text.trim() : "";
  });

  // {{codeblock content "json"}} — Wrap in fenced code block
  hbs.registerHelper("codeblock", (content: unknown, lang: unknown) => {
    const language = typeof lang === "string" ? lang : "";
    const text = typeof content === "string" ? content : JSON.stringify(content, null, 2);
    return new hbs.SafeString(`\`\`\`${language}\n${text}\n\`\`\``);
  });

  // {{#ifEqual a b}}...{{/ifEqual}}
  hbs.registerHelper("ifEqual", function (
    this: unknown,
    a: unknown,
    b: unknown,
    options: Handlebars.HelperOptions,
  ) {
    return a === b ? options.fn(this) : options.inverse(this);
  });

  // {{#each-sorted obj}}...{{/each-sorted}}
  hbs.registerHelper("each-sorted", function (
    this: unknown,
    obj: Record<string, unknown>,
    options: Handlebars.HelperOptions,
  ) {
    if (typeof obj !== "object" || obj === null) return "";
    const keys = Object.keys(obj).sort();
    return keys
      .map((key) => options.fn({ key, value: obj[key] }))
      .join("");
  });

  // {{ref-link "file.md" "Label"}} — Link to references/ file
  hbs.registerHelper("ref-link", (filename: string, label: unknown) => {
    const displayLabel = typeof label === "string" ? label : filename;
    return new hbs.SafeString(`[${displayLabel}](references/${filename})`);
  });

  // {{truncate text 500}} — Truncate text to N chars
  hbs.registerHelper("truncate", (text: string, length: unknown) => {
    if (typeof text !== "string") return "";
    const max = typeof length === "number" ? length : 500;
    if (text.length <= max) return text;
    return text.slice(0, max) + "...";
  });
}
