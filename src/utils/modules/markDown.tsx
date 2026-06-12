import React from "react";
import type { JSX } from "react";

type InlineToken =
  | { type: "text"; value: string }
  | { type: "code"; value: string }
  | { type: "bold"; value: string }
  | { type: "italic"; value: string }
  | { type: "link"; label: string; href: string };

function tokenizeInline(content: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  const pattern =
    /`([^`]+)`|\[([^\]]+)\]\(([^)]+)\)|\*\*([^*]+)\*\*|\*([^*]+)\*|_([^_]+)_/g;

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  // eslint-disable-next-line no-cond-assign
  while ((match = pattern.exec(content)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: content.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      tokens.push({ type: "code", value: match[1] });
    } else if (match[2] !== undefined && match[3] !== undefined) {
      tokens.push({ type: "link", label: match[2], href: match[3] });
    } else if (match[4] !== undefined) {
      tokens.push({ type: "bold", value: match[4] });
    } else if (match[5] !== undefined) {
      tokens.push({ type: "italic", value: match[5] });
    } else if (match[6] !== undefined) {
      tokens.push({ type: "italic", value: match[6] });
    }

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    tokens.push({ type: "text", value: content.slice(lastIndex) });
  }

  return tokens;
}

function renderInlineTokens(
  tokens: InlineToken[],
  keyPrefix: string
): React.ReactNode[] {
  return tokens.map((token, index) => {
    const key = `${keyPrefix}-${index}`;

    switch (token.type) {
      case "code":
        return (
          <code
            key={key}
            style={{
              fontFamily: "monospace",
              fontSize: "0.9em",
              backgroundColor: "rgba(0,0,0,0.06)",
              padding: "0.1em 0.35em",
              borderRadius: "4px",
            }}
          >
            {token.value}
          </code>
        );
      case "bold":
        return <strong key={key}>{token.value}</strong>;
      case "italic":
        return <em key={key}>{token.value}</em>;
      case "link":
        return (
          <a
            key={key}
            href={token.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: "#0066cc" }}
          >
            {token.label}
          </a>
        );
      default:
        return <span key={key}>{token.value}</span>;
    }
  });
}

function renderInline(content: string, keyPrefix: string): React.ReactNode[] {
  return renderInlineTokens(tokenizeInline(content), keyPrefix);
}

function parseHeading(line: string): { level: number; text: string } | null {
  const match = line.match(/^(#{1,6})\s+(.+)$/);
  if (!match) {
    return null;
  }

  return { level: match[1].length, text: match[2] };
}

function isTableRow(line: string): boolean {
  const trimmed = line.trim();
  return trimmed.includes("|");
}

function parseTableRow(line: string): string[] {
  const trimmed = line.trim();
  const withoutLeading = trimmed.startsWith("|") ? trimmed.slice(1) : trimmed;
  const withoutTrailing = withoutLeading.endsWith("|")
    ? withoutLeading.slice(0, -1)
    : withoutLeading;

  return withoutTrailing.split("|").map((cell) => cell.trim());
}

function isTableSeparatorLine(line: string): boolean {
  if (!isTableRow(line)) {
    return false;
  }

  const cells = parseTableRow(line);
  return (
    cells.length > 0 &&
    cells.every((cell) => /^:?-{3,}:?$/.test(cell.trim()))
  );
}

function renderTable(
  headerCells: string[],
  bodyRows: string[][],
  lineKey: string
): JSX.Element {
  const columnCount = Math.max(
    headerCells.length,
    ...bodyRows.map((row) => row.length)
  );

  const padRow = (row: string[]) => {
    const padded = [...row];
    while (padded.length < columnCount) {
      padded.push("");
    }
    return padded;
  };

  const cellStyle: React.CSSProperties = {
    border: "1px solid rgb(255, 255, 255)",
    padding: "0.5rem 0.75rem",
    verticalAlign: "top",
    lineHeight: 1.45,
  };

  return (
    <div
      key={lineKey}
      style={{
        overflowX: "auto",
        margin: "0.75rem 0",
        WebkitOverflowScrolling: "touch",
      }}
    >
      <table
        style={{
          width: "100%",
          minWidth: "max-content",
          borderCollapse: "collapse",
          fontSize: "13px",
        }}
      >
        <thead>
          <tr>
            {padRow(headerCells).map((cell, columnIndex) => (
              <th
                key={`${lineKey}-h-${columnIndex}`}
                style={{
                  ...cellStyle,
                  textAlign: "left",
                  backgroundColor: "rgba(255, 255, 255, 0.33)",
                  fontWeight: 600,
                }}
              >
                {renderInline(cell, `${lineKey}-h-${columnIndex}`)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {bodyRows.map((row, rowIndex) => (
            <tr key={`${lineKey}-r-${rowIndex}`}>
              {padRow(row).map((cell, columnIndex) => (
                <td key={`${lineKey}-r-${rowIndex}-c-${columnIndex}`} style={cellStyle}>
                  {renderInline(cell, `${lineKey}-r-${rowIndex}-c-${columnIndex}`)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function isHorizontalRule(line: string): boolean {
  return /^(-{3,}|\*{3,}|_{3,})\s*$/.test(line.trim());
}

function headingStyle(level: number): React.CSSProperties {
  const sizes: Record<number, string> = {
    1: "21px",
    2: "18px",
    3: "16px",
    4: "15px",
    5: "14px",
    6: "13px",
  };

  return {
    marginTop: "1rem",
    marginBottom: "0.35rem",
    fontWeight: 700,
    fontSize: sizes[level] ?? "14px",
    lineHeight: 1.35,
  };
}

/**
 * Renders a full markdown document (final answers, chat messages).
 */
export function parseSimpleMarkdown(text: string): JSX.Element[] {
  if (!text?.trim()) {
    return [];
  }

  const elements: JSX.Element[] = [];
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  let index = 0;
  let elementIndex = 0;

  const pushElement = (element: JSX.Element) => {
    elements.push(element);
    elementIndex += 1;
  };

  while (index < lines.length) {
    const line = lines[index];
    const lineKey = `markdown-block-${elementIndex}`;

    if (line.trim().startsWith("```")) {
      const language = line.trim().slice(3).trim();
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !lines[index].trim().startsWith("```")) {
        codeLines.push(lines[index]);
        index += 1;
      }

      pushElement(
        <pre
          key={lineKey}
          style={{
            margin: "0.75rem 0",
            padding: "0.75rem 1rem",
            borderRadius: "8px",
            backgroundColor: "rgba(0,0,0,0.05)",
            overflowX: "auto",
            fontSize: "12px",
            lineHeight: 1.45,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {language ? (
            <div
              style={{
                fontSize: "11px",
                opacity: 0.6,
                marginBottom: "0.35rem",
                textTransform: "uppercase",
              }}
            >
              {language}
            </div>
          ) : null}
          <code>{codeLines.join("\n")}</code>
        </pre>
      );

      index += 1;
      continue;
    }

    if (
      isTableRow(line) &&
      index + 1 < lines.length &&
      isTableSeparatorLine(lines[index + 1])
    ) {
      const headerCells = parseTableRow(line);
      const bodyRows: string[][] = [];
      index += 2;

      while (index < lines.length && isTableRow(lines[index])) {
        if (isTableSeparatorLine(lines[index])) {
          index += 1;
          continue;
        }
        bodyRows.push(parseTableRow(lines[index]));
        index += 1;
      }

      pushElement(renderTable(headerCells, bodyRows, lineKey));
      continue;
    }

    if (isHorizontalRule(line)) {
      pushElement(
        <hr
          key={lineKey}
          style={{
            border: "none",
            borderTop: "1px solid rgba(0, 0, 0, 0.15)",
            margin: "1rem 0",
          }}
        />
      );
      index += 1;
      continue;
    }

    const heading = parseHeading(line);
    if (heading) {
      pushElement(
        <div key={lineKey} style={headingStyle(heading.level)}>
          {renderInline(heading.text, lineKey)}
        </div>
      );
      index += 1;
      continue;
    }

    const numberedBold = line.match(/^(\d+)\.\s\*\*(.*?)\*\*\s*$/);
    if (numberedBold) {
      pushElement(
        <div key={lineKey} style={{ marginTop: "1rem", fontWeight: 700 }}>
          {`${numberedBold[1]}. ${numberedBold[2]}`}
        </div>
      );
      index += 1;
      continue;
    }

    const bullet = line.match(/^\s*(?:•|-)\s+(.*)$/);
    if (bullet) {
      pushElement(
        <div
          key={lineKey}
          style={{
            display: "flex",
            gap: "0.5rem",
            paddingLeft: "0.5rem",
            marginTop: "0.25rem",
          }}
        >
          <span aria-hidden>•</span>
          <span>{renderInline(bullet[1], lineKey)}</span>
        </div>
      );
      index += 1;
      continue;
    }

    if (line.startsWith(">")) {
      pushElement(
        <blockquote
          key={lineKey}
          style={{
            borderLeft: "3px solid #ccc",
            paddingLeft: "1rem",
            margin: "0.5rem 0",
            color: "rgba(0,0,0,0.75)",
          }}
        >
          {renderInline(line.replace(/^>\s?/, ""), lineKey)}
        </blockquote>
      );
      index += 1;
      continue;
    }

    if (line.trim()) {
      pushElement(
        <div
          key={lineKey}
          style={{ marginTop: "0.25rem", lineHeight: 1.5, whiteSpace: "pre-wrap" }}
        >
          {renderInline(line, lineKey)}
        </div>
      );
    } else {
      pushElement(<div key={lineKey} style={{ height: "0.5rem" }} />);
    }

    index += 1;
  }

  return elements;
}

function humanizeOrchestrationStep(step: string): string {
  return step
    .replace(/^_(.+)_$/s, "$1")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

function orchestrationStepIcon(step: string): string {
  if (/planification/i.test(step)) {
    return "🧠";
  }
  if (/exécution/i.test(step)) {
    return "⚙️";
  }
  return "•";
}

type OrchestrationProgressVariant = "default" | "thinking";

/**
 * Renders orchestration progress as a readable step list (non-streaming text block).
 * The API sends cumulative progress; we split on blank lines and show each step once.
 */
export function parseOrchestrationProgress(
  text: string,
  variant: OrchestrationProgressVariant = "default"
): JSX.Element[] {
  if (!text?.trim()) {
    if (variant === "thinking") {
      return [
        <div
          key="progress-empty"
          style={{
            fontSize: "0.6875rem",
            lineHeight: 1.45,
            color: "rgba(255,255,255,0.42)",
            fontStyle: "italic",
          }}
        >
          Planification…
        </div>,
      ];
    }

    return [
      <div key="progress-empty" style={{ opacity: 0.7, fontStyle: "italic" }}>
        Planification…
      </div>,
    ];
  }

  const steps = text
    .split(/\n\n+/)
    .map((step) => step.trim())
    .filter(Boolean);

  return steps.map((step, index) => {
    const readable = humanizeOrchestrationStep(step);
    const isLatest = index === steps.length - 1;

    if (variant === "thinking") {
      return (
        <div
          key={`progress-step-${index}`}
          style={{
            fontSize: "0.6875rem",
            lineHeight: 1.45,
            color: isLatest ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.42)",
            fontStyle: isLatest ? "italic" : "normal",
            marginBottom: "0.2rem",
          }}
        >
          {readable}
        </div>
      );
    }

    return (
      <div
        key={`progress-step-${index}`}
        style={{
          display: "flex",
          alignItems: "flex-start",
          gap: "0.65rem",
          marginBottom: "0.65rem",
          opacity: isLatest ? 1 : 0.72,
          fontWeight: isLatest ? 600 : 400,
        }}
      >
        <span aria-hidden style={{ lineHeight: 1.5 }}>
          {orchestrationStepIcon(readable)}
        </span>
        <span style={{ lineHeight: 1.5 }}>{readable}</span>
      </div>
    );
  });
}
