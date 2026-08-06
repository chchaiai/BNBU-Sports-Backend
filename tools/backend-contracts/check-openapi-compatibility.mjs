import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import YAML from "yaml";

const HTTP_METHODS = new Set([
  "delete",
  "get",
  "head",
  "options",
  "patch",
  "post",
  "put",
  "trace",
]);

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const repositoryRoot = path.resolve(scriptDirectory, "..", "..");
const historyDirectory =
  "docs/client-handoff/contract-history/" +
  "1.1.0-contract-fb040b671e3f25c48279ad6b173ced5f633de1b1a1a9db0cc0f23a11e3fde4d1";

const defaults = {
  baseline: path.join(
    repositoryRoot,
    historyDirectory,
    "openapi.snapshot.yaml",
  ),
  current: path.join(repositoryRoot, "docs/backend-contracts/openapi.yaml"),
  json: path.join(
    repositoryRoot,
    "docs/client-handoff/openapi-1.1.0-to-1.2.0-compatibility.json",
  ),
  markdown: path.join(
    repositoryRoot,
    "docs/client-handoff/openapi-1.1.0-to-1.2.0-compatibility.md",
  ),
};

function parseArguments(argv) {
  const options = { ...defaults, check: false };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];

    if (argument === "--check") {
      options.check = true;
      continue;
    }

    const optionNames = new Map([
      ["--baseline", "baseline"],
      ["--current", "current"],
      ["--json", "json"],
      ["--markdown", "markdown"],
    ]);
    const optionName = optionNames.get(argument);

    if (!optionName) {
      throw new Error(`Unknown argument: ${argument}`);
    }

    const value = argv[index + 1];
    if (!value) {
      throw new Error(`Missing value for ${argument}`);
    }

    options[optionName] = path.resolve(repositoryRoot, value);
    index += 1;
  }

  return options;
}

function sha256(contents) {
  return createHash("sha256").update(contents).digest("hex");
}

function sorted(values) {
  return [...values].sort((left, right) => left.localeCompare(right, "en"));
}

function canonicalJson(value) {
  if (Array.isArray(value)) {
    return `[${value.map(canonicalJson).join(",")}]`;
  }

  if (value !== null && typeof value === "object") {
    return `{${Object.keys(value)
      .sort((left, right) => left.localeCompare(right, "en"))
      .map((key) => `${JSON.stringify(key)}:${canonicalJson(value[key])}`)
      .join(",")}}`;
  }

  return JSON.stringify(value);
}

function pointerToken(value) {
  return String(value).replaceAll("~", "~0").replaceAll("/", "~1");
}

function collectOperations(document) {
  const operations = new Set();

  for (const [apiPath, pathItem] of Object.entries(document.paths ?? {})) {
    if (!pathItem || typeof pathItem !== "object") {
      continue;
    }

    for (const method of Object.keys(pathItem)) {
      const normalizedMethod = method.toLowerCase();
      if (HTTP_METHODS.has(normalizedMethod)) {
        operations.add(`${normalizedMethod.toUpperCase()} ${apiPath}`);
      }
    }
  }

  return operations;
}

function collectSchemaSurface(document) {
  const schemas = document.components?.schemas ?? {};
  const schemaNames = new Set(Object.keys(schemas));
  const properties = new Map();
  const requiredMembers = new Map();
  const enumValues = new Map();

  function visitSchemaNode(schemaName, node, schemaPath) {
    if (!node || typeof node !== "object" || Array.isArray(node)) {
      return;
    }

    if (Array.isArray(node.required)) {
      for (const member of node.required) {
        const descriptor = {
          schema: schemaName,
          objectPath: schemaPath,
          member: String(member),
        };
        requiredMembers.set(
          `${schemaName}|${schemaPath}|${String(member)}`,
          descriptor,
        );
      }
    }

    if (Array.isArray(node.enum)) {
      for (const value of node.enum) {
        const encodedValue = canonicalJson(value);
        const descriptor = {
          schema: schemaName,
          schemaPath,
          location: `components.schemas.${schemaName}${schemaPath}`,
          value,
        };
        enumValues.set(
          `${schemaName}|${schemaPath}|${encodedValue}`,
          descriptor,
        );
      }
    }

    if (node.properties && typeof node.properties === "object") {
      for (const propertyName of sorted(Object.keys(node.properties))) {
        const propertyPath = `${schemaPath}/properties/${pointerToken(propertyName)}`;
        properties.set(`${schemaName}|${propertyPath}`, {
          schema: schemaName,
          propertyPath,
        });
        visitSchemaNode(
          schemaName,
          node.properties[propertyName],
          propertyPath,
        );
      }
    }

    for (const keyword of ["allOf", "anyOf", "oneOf", "prefixItems"]) {
      if (!Array.isArray(node[keyword])) {
        continue;
      }

      node[keyword].forEach((child, index) => {
        visitSchemaNode(schemaName, child, `${schemaPath}/${keyword}/${index}`);
      });
    }

    for (const keyword of [
      "additionalProperties",
      "contains",
      "else",
      "if",
      "items",
      "not",
      "then",
      "unevaluatedItems",
      "unevaluatedProperties",
    ]) {
      if (node[keyword] && typeof node[keyword] === "object") {
        visitSchemaNode(schemaName, node[keyword], `${schemaPath}/${keyword}`);
      }
    }

    for (const keyword of ["dependentSchemas", "patternProperties"]) {
      if (!node[keyword] || typeof node[keyword] !== "object") {
        continue;
      }

      for (const childName of sorted(Object.keys(node[keyword]))) {
        visitSchemaNode(
          schemaName,
          node[keyword][childName],
          `${schemaPath}/${keyword}/${pointerToken(childName)}`,
        );
      }
    }
  }

  for (const schemaName of sorted(schemaNames)) {
    visitSchemaNode(schemaName, schemas[schemaName], "#");
  }

  function visitParameterSchema(parameter, operationLabel, schemaPath = "#") {
    const node = parameter?.schema;
    if (!node || typeof node !== "object") {
      return;
    }

    function visit(nodeToVisit, nodePath) {
      if (!nodeToVisit || typeof nodeToVisit !== "object") {
        return;
      }

      if (Array.isArray(nodeToVisit.enum)) {
        for (const value of nodeToVisit.enum) {
          const encodedValue = canonicalJson(value);
          const location =
            `${operationLabel} parameter ${parameter.in}:${parameter.name}` +
            (nodePath === "#" ? "" : nodePath);
          enumValues.set(`parameter|${location}|${encodedValue}`, {
            operation: operationLabel,
            parameterIn: parameter.in,
            parameterName: parameter.name,
            schemaPath: nodePath,
            location,
            value,
          });
        }
      }

      for (const keyword of ["allOf", "anyOf", "oneOf", "prefixItems"]) {
        if (!Array.isArray(nodeToVisit[keyword])) {
          continue;
        }

        nodeToVisit[keyword].forEach((child, index) => {
          visit(child, `${nodePath}/${keyword}/${index}`);
        });
      }

      for (const keyword of ["items", "not"]) {
        if (nodeToVisit[keyword] && typeof nodeToVisit[keyword] === "object") {
          visit(nodeToVisit[keyword], `${nodePath}/${keyword}`);
        }
      }
    }

    visit(node, schemaPath);
  }

  for (const [apiPath, pathItem] of Object.entries(document.paths ?? {})) {
    if (!pathItem || typeof pathItem !== "object") {
      continue;
    }

    for (const parameter of pathItem.parameters ?? []) {
      visitParameterSchema(parameter, `PATH ${apiPath}`);
    }

    for (const [method, operation] of Object.entries(pathItem)) {
      const normalizedMethod = method.toLowerCase();
      if (!HTTP_METHODS.has(normalizedMethod) || !operation) {
        continue;
      }

      for (const parameter of operation.parameters ?? []) {
        visitParameterSchema(
          parameter,
          `${normalizedMethod.toUpperCase()} ${apiPath}`,
        );
      }
    }
  }

  for (const [parameterName, parameter] of Object.entries(
    document.components?.parameters ?? {},
  )) {
    visitParameterSchema(parameter, `components.parameters.${parameterName}`);
  }

  return { schemaNames, properties, requiredMembers, enumValues };
}

function compareSets(baseline, current) {
  return {
    removed: sorted([...baseline].filter((value) => !current.has(value))),
    added: sorted([...current].filter((value) => !baseline.has(value))),
  };
}

function compareMaps(baseline, current) {
  const keys = compareSets(new Set(baseline.keys()), new Set(current.keys()));
  return {
    removed: keys.removed.map((key) => baseline.get(key)),
    added: keys.added.map((key) => current.get(key)),
  };
}

function sourceMetadata(filePath, contents, document) {
  return {
    file: path.relative(repositoryRoot, filePath).replaceAll("\\", "/"),
    version: document.info?.version ?? null,
    sha256: sha256(contents),
    pathCount: Object.keys(document.paths ?? {}).length,
    operationCount: collectOperations(document).size,
    schemaCount: Object.keys(document.components?.schemas ?? {}).length,
  };
}

function summarizeChanges(changes) {
  const summary = {};
  for (const [name, change] of Object.entries(changes)) {
    summary[name] = {
      removed: change.removed.length,
      added: change.added.length,
    };
  }
  return summary;
}

function markdownValue(value) {
  return `\`${canonicalJson(value).replaceAll("`", "\\`")}\``;
}

function renderMarkdown(report) {
  const lines = [
    `# OpenAPI compatibility report: ${report.baseline.version} to ${report.current.version}`,
    "",
    `Result: **${report.compatible ? "COMPATIBLE" : "BREAKING CHANGES DETECTED"}** for the structural checks listed below.`,
    "",
    "| Source | Version | SHA-256 | Paths | Operations | Schemas |",
    "| --- | --- | --- | ---: | ---: | ---: |",
    `| Baseline | \`${report.baseline.version}\` | \`${report.baseline.sha256}\` | ${report.baseline.pathCount} | ${report.baseline.operationCount} | ${report.baseline.schemaCount} |`,
    `| Current | \`${report.current.version}\` | \`${report.current.sha256}\` | ${report.current.pathCount} | ${report.current.operationCount} | ${report.current.schemaCount} |`,
    "",
    "## Surface comparison",
    "",
    "| Surface | Removed | Added |",
    "| --- | ---: | ---: |",
    ...Object.entries(report.summary).map(
      ([name, counts]) => `| ${name} | ${counts.removed} | ${counts.added} |`,
    ),
    "",
    "## Removed contract surface",
    "",
  ];

  const removedEntries = [];
  for (const [name, change] of Object.entries(report.changes)) {
    for (const value of change.removed) {
      removedEntries.push(`- ${name}: \`${canonicalJson(value)}\``);
    }
  }
  lines.push(
    ...(removedEntries.length === 0 ? ["None."] : removedEntries),
    "",
    "## Added enum values",
    "",
  );

  const addedEnumValues = report.changes.enumValues.added;
  lines.push(
    ...(addedEnumValues.length === 0
      ? ["None."]
      : addedEnumValues.map(
          (entry) => `- \`${entry.location}\`: ${markdownValue(entry.value)}`,
        )),
    "",
    "## Scope and limits",
    "",
    "This deterministic check detects removed paths, HTTP methods, component schemas, recursively nested schema properties, required members, and enum values. It also records additions to those surfaces. It does not prove runtime behavior, authorization behavior, persistence behavior, semantic compatibility beyond those structural checks, deployment, live Staging availability, or iOS binary compatibility.",
    "",
  );

  return `${lines.join("\n")}\n`;
}

async function writeOrCheck(filePath, expectedContents, check) {
  if (!check) {
    await mkdir(path.dirname(filePath), { recursive: true });
    await writeFile(filePath, expectedContents, "utf8");
    return;
  }

  let actualContents;
  try {
    actualContents = await readFile(filePath, "utf8");
  } catch {
    throw new Error(`Generated artifact is missing: ${filePath}`);
  }

  if (actualContents !== expectedContents) {
    throw new Error(`Generated artifact is stale: ${filePath}`);
  }
}

async function main() {
  const options = parseArguments(process.argv.slice(2));
  const [baselineContents, currentContents] = await Promise.all([
    readFile(options.baseline, "utf8"),
    readFile(options.current, "utf8"),
  ]);
  const baselineDocument = YAML.parse(baselineContents);
  const currentDocument = YAML.parse(currentContents);
  const baselineSurface = collectSchemaSurface(baselineDocument);
  const currentSurface = collectSchemaSurface(currentDocument);

  const changes = {
    paths: compareSets(
      new Set(Object.keys(baselineDocument.paths ?? {})),
      new Set(Object.keys(currentDocument.paths ?? {})),
    ),
    operations: compareSets(
      collectOperations(baselineDocument),
      collectOperations(currentDocument),
    ),
    schemas: compareSets(
      baselineSurface.schemaNames,
      currentSurface.schemaNames,
    ),
    properties: compareMaps(
      baselineSurface.properties,
      currentSurface.properties,
    ),
    requiredMembers: compareMaps(
      baselineSurface.requiredMembers,
      currentSurface.requiredMembers,
    ),
    enumValues: compareMaps(
      baselineSurface.enumValues,
      currentSurface.enumValues,
    ),
  };
  const compatible = Object.values(changes).every(
    (change) => change.removed.length === 0,
  );
  const report = {
    formatVersion: 1,
    baseline: sourceMetadata(
      options.baseline,
      baselineContents,
      baselineDocument,
    ),
    current: sourceMetadata(options.current, currentContents, currentDocument),
    compatible,
    summary: summarizeChanges(changes),
    changes,
  };
  const json = `${JSON.stringify(report, null, 2)}\n`;
  const markdown = renderMarkdown(report);

  await Promise.all([
    writeOrCheck(options.json, json, options.check),
    writeOrCheck(options.markdown, markdown, options.check),
  ]);

  const mode = options.check ? "verified" : "generated";
  process.stdout.write(
    `OpenAPI compatibility artifacts ${mode}: ${compatible ? "COMPATIBLE" : "BREAKING"}\n`,
  );
  process.stdout.write(
    `baseline=${report.baseline.version} current=${report.current.version} operations=${report.baseline.operationCount}->${report.current.operationCount} schemas=${report.baseline.schemaCount}->${report.current.schemaCount}\n`,
  );

  if (!compatible) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
