export type OrchestrationResult = {
  final_answer: unknown;
  agent_data: Record<string, unknown>;
  trace: Array<Record<string, unknown>>;
  results_markdown: string;
};

const META_KEYS = new Set([
  "reasoning",
  "confidence",
  "next_action",
  "is_final",
]);

const NAME_KEYS = ["nom", "name", "title"] as const;

export function toMarkdown(finalAnswer: unknown): string {
  if (finalAnswer == null) {
    return "";
  }

  const payload =
    typeof finalAnswer === "object" &&
    finalAnswer !== null &&
    "answer" in (finalAnswer as Record<string, unknown>)
      ? (finalAnswer as { answer: unknown }).answer
      : finalAnswer;

  return valueToMarkdown(payload);
}

export function getResultsMarkdown(result: OrchestrationResult | null): string {
  if (!result) {
    return "";
  }

  if (result.results_markdown?.trim()) {
    return result.results_markdown.trim();
  }

  return toMarkdown(result.final_answer);
}

function valueToMarkdown(value: unknown): string {
  if (value == null) {
    return "";
  }

  if (typeof value === "string") {
    const stripped = value.trim();
    if (!stripped) {
      return "";
    }

    if (stripped.startsWith("{") || stripped.startsWith("[")) {
      try {
        return valueToMarkdown(JSON.parse(stripped));
      } catch {
        return stripped;
      }
    }

    return stripped;
  }

  if (Array.isArray(value)) {
    return value
      .map((item) => valueToMarkdown(item))
      .filter(Boolean)
      .join("\n\n");
  }

  if (typeof value === "object") {
    const record = value as Record<string, unknown>;

    if ("result" in record) {
      const body = valueToMarkdown(record.result);
      const confidence = record.confidence;
      if (confidence != null) {
        return `${body}\n\n_Confiance : ${confidence}_`.trim();
      }
      return body;
    }

    if (Object.keys(record).length === 1 && "answer" in record) {
      return valueToMarkdown(record.answer);
    }

    const userPayload = Object.fromEntries(
      Object.entries(record).filter(([key]) => !META_KEYS.has(key))
    );

    if (Object.keys(userPayload).length === 0) {
      return "";
    }

    return formatDictAsMarkdown(userPayload);
  }

  return String(value).trim();
}

function humanizeKey(key: string): string {
  return key.replace(/_/g, " ").trim().replace(/^\w/, (c) => c.toUpperCase());
}

function formatDictAsMarkdown(data: Record<string, unknown>): string {
  const displayName = NAME_KEYS.map((key) => data[key]).find(
    (value) => typeof value === "string" && value
  ) as string | undefined;

  if (displayName && Object.keys(data).length > 1) {
    const lines = [`### ${displayName}`];
    for (const [key, value] of Object.entries(data)) {
      if ((NAME_KEYS as readonly string[]).includes(key)) {
        continue;
      }
      lines.push(formatFieldLine(key, value));
    }
    return lines.join("\n");
  }

  const lines: string[] = [];

  for (const [key, value] of Object.entries(data)) {
    const label = humanizeKey(key);

    if (
      Array.isArray(value) &&
      value.length > 0 &&
      value.every((item) => typeof item === "object" && item !== null)
    ) {
      lines.push(`**${label}**`);
      lines.push(
        value
          .map((item) => formatDictAsMarkdown(item as Record<string, unknown>))
          .filter(Boolean)
          .join("\n\n")
      );
      continue;
    }

    if (typeof value === "object" && value !== null && !Array.isArray(value)) {
      lines.push(`**${label}**`);
      lines.push(formatDictAsMarkdown(value as Record<string, unknown>));
      continue;
    }

    if (Array.isArray(value)) {
      lines.push(`**${label}**`);
      lines.push(
        ...value
          .filter((item) => item != null)
          .map((item) => `- ${valueToMarkdown(item)}`)
      );
      continue;
    }

    lines.push(`**${label}** : ${value}`);
  }

  return lines.filter(Boolean).join("\n\n").trim();
}

function formatFieldLine(key: string, value: unknown): string {
  const label = humanizeKey(key);

  if (typeof value === "object" && value !== null) {
    const nested = valueToMarkdown(value);
    if (nested.includes("\n")) {
      return `- **${label}** :\n${indent(nested)}`;
    }
    return `- **${label}** : ${nested}`;
  }

  return `- **${label}** : ${value}`;
}

function indent(text: string): string {
  return text
    .split("\n")
    .map((line) => `  ${line}`)
    .join("\n");
}
