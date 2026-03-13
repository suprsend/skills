/** agentskills.io-compliant skill metadata */
export interface SkillMeta {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
  allowed_tools?: string;
}

/**
 * Declares a file to be written into an output subdirectory
 * (references/, scripts/, or assets/).
 *
 * Two modes:
 * - **Templated**: set `template` to a .hbs path relative to the skill source dir.
 *   The template is rendered with the full TemplateContext.
 * - **Static copy**: omit `template`. The file is copied from the matching
 *   subdirectory in skills-src/<skill>/<dir>/<filename>.
 */
export interface OutputFileDeclaration {
  filename: string;
  template?: string;
}

/** Static source — read a local .md file */
export interface StaticSource {
  type: "static";
  key: string;
  path: string;
}

/** Docs source — fetch markdown from Mintlify */
export interface DocsSource {
  type: "docs";
  key: string;
  urls: string[];
  selector?: string;
}

/** Schema source — fetch JSON Schema */
export interface SchemaSource {
  type: "schema";
  key: string;
  url: string;
  follow_refs?: boolean;
}

/** Claude source — AI-generated content with caching */
export interface ClaudeSource {
  type: "claude";
  key: string;
  prompt: string;
  model?: string;
  max_tokens?: number;
}

export type SourceDeclaration =
  | StaticSource
  | DocsSource
  | SchemaSource
  | ClaudeSource;

/** Full sources.yaml structure */
export interface SourcesConfig {
  name: string;
  description: string;
  license?: string;
  compatibility?: string;
  metadata?: Record<string, string>;
  allowed_tools?: string;
  sources: SourceDeclaration[];
  references?: OutputFileDeclaration[];
  scripts?: OutputFileDeclaration[];
  assets?: OutputFileDeclaration[];
}

/** Resolved template context */
export type TemplateContext = Record<string, unknown> & {
  meta: SkillMeta;
};
