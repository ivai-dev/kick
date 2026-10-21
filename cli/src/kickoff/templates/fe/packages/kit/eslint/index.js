/**
 * @kickoff/kit/eslint — kickoff design-system rules as a flat-config array.
 *
 *   import kickoff from "@kickoff/kit/eslint";
 *   export default [...otherConfigs, ...kickoff];
 *
 * Rules:
 *   kickoff/no-raw-hex       no raw hex colours in className / Tailwind arbitrary values ([#…])
 *   kickoff/no-inline-font   no inline style fontSize / fontWeight (use type role classes)
 *   kickoff/no-heavy-font    no font-extrabold / font-black classes
 *   no-restricted-imports    apps must not import radix-ui / @radix-ui/* (use @app/ui)
 */

const ARBITRARY_HEX = /\[#[0-9a-fA-F]{3,8}\]|\[(?:color|background|fill|stroke):#[0-9a-fA-F]{3,8}\]/;
const ANY_HEX = /(^|[\s"'`:(,])#[0-9a-fA-F]{3,8}\b/;
const HEAVY_FONT = /(^|[\s:"'`])font-(extrabold|black)(?=$|[\s"'`])/;

/** All string fragments of a literal / template / expression. */
function stringsOf(node) {
  if (!node) return [];
  switch (node.type) {
    case "Literal":
      return typeof node.value === "string" ? [{ node, text: node.value }] : [];
    case "TemplateLiteral":
      return node.quasis.map((q) => ({ node: q, text: q.value.cooked ?? q.value.raw }));
    case "JSXExpressionContainer":
      return stringsOf(node.expression);
    case "ConditionalExpression":
      return [...stringsOf(node.consequent), ...stringsOf(node.alternate)];
    case "LogicalExpression":
    case "BinaryExpression":
      return [...stringsOf(node.left), ...stringsOf(node.right)];
    case "CallExpression":
      return node.arguments.flatMap(stringsOf);
    case "ArrayExpression":
      return node.elements.flatMap(stringsOf);
    case "ObjectExpression":
      return node.properties.flatMap((p) => (p.type === "Property" ? [...stringsOf(p.key), ...stringsOf(p.value)] : []));
    default:
      return [];
  }
}

const isClassAttr = (name) => name === "className" || name === "class";

const noRawHex = {
  meta: {
    type: "problem",
    docs: { description: "Disallow raw hex colours in class names; use design tokens (bg-primary, text-muted-foreground)." },
    messages: {
      arbitrary: "Raw hex colour in a Tailwind arbitrary value ({{value}}). Use a token class or a CSS variable.",
      className: "Raw hex colour in className ({{value}}). Use a token class.",
    },
    schema: [],
  },
  create(context) {
    const report = (node, messageId, text) =>
      context.report({ node, messageId, data: { value: (text.match(/#[0-9a-fA-F]{3,8}/) ?? [text])[0] } });
    return {
      // Arbitrary values anywhere (cn(), cva(), variables…)
      Literal(node) {
        if (typeof node.value === "string" && ARBITRARY_HEX.test(node.value)) report(node, "arbitrary", node.value);
      },
      TemplateElement(node) {
        const text = node.value.cooked ?? node.value.raw;
        if (ARBITRARY_HEX.test(text)) report(node, "arbitrary", text);
      },
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier" || !isClassAttr(node.name.name)) return;
        for (const part of stringsOf(node.value)) {
          if (!ARBITRARY_HEX.test(part.text) && ANY_HEX.test(part.text)) report(part.node, "className", part.text);
        }
      },
    };
  },
};

const noInlineFont = {
  meta: {
    type: "problem",
    docs: { description: "Disallow inline style fontSize / fontWeight; use the type role classes (text-title, text-body …)." },
    messages: { inline: "Inline style {{prop}}: use a type role class (text-display/title/body/label/meta/caption)." },
    schema: [],
  },
  create(context) {
    return {
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier" || node.name.name !== "style") return;
        const expression = node.value?.type === "JSXExpressionContainer" ? node.value.expression : null;
        if (!expression || expression.type !== "ObjectExpression") return;
        for (const prop of expression.properties) {
          if (prop.type !== "Property") continue;
          const key = prop.key.type === "Identifier" ? prop.key.name : prop.key.type === "Literal" ? String(prop.key.value) : "";
          if (key === "fontSize" || key === "fontWeight" || key === "font-size" || key === "font-weight") {
            context.report({ node: prop, messageId: "inline", data: { prop: key } });
          }
        }
      },
    };
  },
};

const noHeavyFont = {
  meta: {
    type: "suggestion",
    docs: { description: "Disallow the two heaviest font-weight classes (too heavy for Vietnamese diacritics and dense UIs)." },
    messages: { heavy: "Avoid font-{{weight}}; use font-semibold or font-bold at most." },
    schema: [],
  },
  create(context) {
    const check = (node, text) => {
      const match = HEAVY_FONT.exec(text);
      if (match) context.report({ node, messageId: "heavy", data: { weight: match[2] } });
    };
    return {
      Literal(node) {
        if (typeof node.value === "string") check(node, node.value);
      },
      TemplateElement(node) {
        check(node, node.value.cooked ?? node.value.raw);
      },
    };
  },
};

export const plugin = {
  meta: { name: "kickoff", version: "0.5.0" },
  rules: {
    "no-raw-hex": noRawHex,
    "no-inline-font": noInlineFont,
    "no-heavy-font": noHeavyFont,
  },
};

const kickoff = [
  {
    name: "kickoff/design-rules",
    files: ["**/*.{js,jsx,ts,tsx}"],
    plugins: { kickoff: plugin },
    rules: {
      "kickoff/no-raw-hex": "error",
      "kickoff/no-inline-font": "error",
      "kickoff/no-heavy-font": "error",
    },
  },
  {
    name: "kickoff/apps-use-app-ui",
    files: ["apps/**/*.{js,jsx,ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [{ name: "radix-ui", message: "Import components from @app/ui instead of radix-ui." }],
          patterns: [{ group: ["@radix-ui/*"], message: "Import components from @app/ui instead of @radix-ui/*." }],
        },
      ],
    },
  },
];

export default kickoff;
