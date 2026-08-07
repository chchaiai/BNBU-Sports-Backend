import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const contractPath = path.resolve(
  scriptDirectory,
  "..",
  "..",
  "docs",
  "backend-contracts",
  "openapi.yaml",
);
const write = process.argv.includes("--write");
const unknown = process.argv
  .slice(2)
  .filter((argument) => argument !== "--write");
if (unknown.length > 0)
  throw new Error(`Unknown argument: ${unknown.join(" ")}`);

const contents = await readFile(contractPath, "utf8");
const newline = contents.includes("\r\n") ? "\r\n" : "\n";
const lines = contents.split(/\r?\n/u);
const insertions = [];
const missing = [];
let apiPath = null;

for (let index = 0; index < lines.length; index += 1) {
  const pathMatch = lines[index].match(/^  (\/[^:]+):\s*$/u);
  if (pathMatch !== null) apiPath = pathMatch[1];
  const methodMatch = lines[index].match(/^    (post|put|patch|delete):\s*$/u);
  if (methodMatch === null) continue;
  const method = methodMatch[1].toUpperCase();
  let operationEnd = index + 1;
  while (
    operationEnd < lines.length &&
    !/^    (?:get|post|put|patch|delete|head|options|trace):\s*$/u.test(
      lines[operationEnd],
    ) &&
    !/^  \//u.test(lines[operationEnd]) &&
    !/^components:\s*$/u.test(lines[operationEnd])
  ) {
    operationEnd += 1;
  }
  const responseStart = lines.findIndex(
    (line, candidate) =>
      candidate > index &&
      candidate < operationEnd &&
      /^      responses:\s*$/u.test(line),
  );
  if (responseStart < 0)
    throw new Error(`Operation has no responses block: ${method} ${apiPath}`);
  let responseEnd = responseStart + 1;
  while (
    responseEnd < operationEnd &&
    (lines[responseEnd].trim().length === 0 ||
      /^ {8,}/u.test(lines[responseEnd]))
  ) {
    responseEnd += 1;
  }
  const hasServiceUnavailable = lines
    .slice(responseStart + 1, responseEnd)
    .some((line) => /^        '503':/u.test(line));
  if (!hasServiceUnavailable) {
    missing.push(`${method} ${apiPath}`);
    insertions.push(responseEnd);
  }
  index = operationEnd - 1;
}

if (write && insertions.length > 0) {
  for (const index of [...insertions].sort((left, right) => right - left)) {
    lines.splice(
      index,
      0,
      "        '503':",
      "          $ref: '#/components/responses/ServiceUnavailable'",
    );
  }
  await writeFile(contractPath, lines.join(newline), "utf8");
  process.stdout.write(
    `Added documented SystemMode 503 responses to ${insertions.length} mutations.\n`,
  );
} else if (missing.length > 0) {
  throw new Error(
    `Mutations missing SystemMode 503 responses:\n${missing.join("\n")}`,
  );
} else {
  process.stdout.write(
    "SystemMode response coverage verified for every mutation.\n",
  );
}
