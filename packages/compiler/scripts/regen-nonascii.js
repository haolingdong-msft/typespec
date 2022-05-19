// Regenerate the table used to scan non-ASCII identifiers.

import { assert } from "console";
import { writeFileSync } from "fs";
import { resolve } from "path";
import { fileURLToPath } from "url";

const disallowedProperties = [
  "General_Category=Control",
  "General_Category=Private_Use",
  "General_Category=Surrogate",
  "Noncharacter_Code_Point",
  "Pattern_White_Space",
  "Unassigned",
];

const disallowedCodePoints = [
  0xfffd, // REPLACEMENT CHARACTER
];

const MIN_NONASCII_CODEPOINT = 0x80;
const MAX_UNICODE_CODEPOINT = 0x10ffff;

const disallowedRegex = new RegExp(
  `[${disallowedProperties.map((p) => `\\p{${p}}`).join("")}]`,
  "u"
);

const map = computeMap();

function isDisallowed(codePoint) {
  return (
    disallowedCodePoints.includes(codePoint) ||
    disallowedRegex.test(String.fromCodePoint(codePoint))
  );
}

function formatPairs(array) {
  let s = "";
  for (let i = 0; i < array.length; i += 2) {
    s += `  0x${array[i].toString(16)}, 0x${array[i + 1].toString(16)},\n`;
  }
  return s.slice(0, -1);
}

function computeMap() {
  const map = [];
  let active = false;
  for (let i = MIN_NONASCII_CODEPOINT; i <= MAX_UNICODE_CODEPOINT; i++) {
    const allowed = !isDisallowed(i);
    if (allowed !== active) {
      map.push(active ? i - 1 : i);
      active = !active;
    }
  }
  assert(!active, "MAX_UNICODE_CODEPOINT should not be allowed.");
  return map;
}

const src = `//
// Generated by scripts/regen-nonascii-map.js
// on node ${process.version} with unicode ${process.versions.unicode}.
//

/**
 * @internal
 *
 * Map of non-ascii characters that are valid in an identifier. Each pair of
 * numbers represents an inclusive range of code points.
 */
//prettier-ignore
export const nonAsciiIdentifierMap: readonly number[] = [
${formatPairs(map)}
];
`;

const file = resolve(fileURLToPath(import.meta.url), "../../core/nonascii.ts");
writeFileSync(file, src);
