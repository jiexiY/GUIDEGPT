import { describe, expect, it } from "vitest";
import {
  accessibleLabelFor,
  isEditableTextRegion,
  sanitizePageUrl,
} from "./page-context.js";

function text(value) {
  return { nodeType: 3, nodeValue: value, childNodes: [] };
}

function element(tagName, { attributes = {}, children = [], labels, ownerDocument } = {}) {
  const node = {
    nodeType: 1,
    tagName: tagName.toUpperCase(),
    childNodes: children,
    ownerDocument,
    labels,
    getAttribute(name) {
      return attributes[name] ?? null;
    },
  };
  Object.defineProperty(node, "id", { get: () => attributes.id || "" });
  return node;
}

describe("safe page URLs", () => {
  it("keeps only the HTTP origin and pathname", () => {
    expect(sanitizePageUrl("https://example.com/account/profile?token=secret#billing"))
      .toBe("https://example.com/account/profile");
    expect(sanitizePageUrl("http://localhost:3000/guide?q=private"))
      .toBe("http://localhost:3000/guide");
  });

  it("rejects malformed and non-web URLs", () => {
    expect(sanitizePageUrl("not a URL")).toBe("");
    expect(sanitizePageUrl("file:///Users/example/private.html?token=secret")).toBe("");
  });
});

describe("editable draft boundaries", () => {
  it.each(["", "true", "plaintext-only"])(
    "treats contenteditable=%j as an unsent text region",
    (contenteditable) => {
      const editor = element("div", { attributes: { contenteditable } });
      const child = element("span");
      child.parentElement = editor;
      expect(isEditableTextRegion(child)).toBe(true);
    },
  );

  it("respects a contenteditable=false island inside an editor", () => {
    const editor = element("div", { attributes: { contenteditable: "plaintext-only" } });
    const nonEditable = element("span", { attributes: { contenteditable: "false" } });
    const child = element("strong");
    nonEditable.parentElement = editor;
    child.parentElement = nonEditable;
    expect(isEditableTextRegion(child)).toBe(false);
  });
});

describe("accessible control labels", () => {
  it("resolves ordered aria-labelledby text without losing Unicode", () => {
    const references = new Map();
    const ownerDocument = { getElementById: (id) => references.get(id) || null };
    references.set("field-name", element("span", { children: [text("姓名")] }));
    references.set("field-help", element("span", { children: [text("（必須）")] }));
    const control = element("input", {
      attributes: { "aria-labelledby": "field-name field-help", "aria-label": "Ignored fallback" },
      ownerDocument,
    });

    expect(accessibleLabelFor(control)).toBe("姓名 （必須）");
  });

  it("uses native associated labels and never reads nested form values", () => {
    const sensitiveTextarea = element("textarea", { children: [text("secret form value")] });
    Object.defineProperty(sensitiveTextarea, "value", {
      get() {
        throw new Error("Form values must never be read");
      },
    });
    const label = element("label", {
      children: [text("Correo electrónico"), sensitiveTextarea],
    });
    const control = element("input", { labels: [label] });
    Object.defineProperty(control, "value", {
      get() {
        throw new Error("Form values must never be read");
      },
    });

    expect(accessibleLabelFor(control)).toBe("Correo electrónico");
  });

  it("falls back to an explicit label[for] association", () => {
    const label = element("label", {
      attributes: { for: "phone-number" },
      children: [text("전화번호")],
    });
    label.htmlFor = "phone-number";
    const ownerDocument = {
      getElementById: () => null,
      querySelectorAll: () => [label],
    };
    const control = element("input", {
      attributes: { id: "phone-number", name: "phone" },
      ownerDocument,
    });

    expect(accessibleLabelFor(control)).toBe("전화번호");
  });

  it("truncates by Unicode code point without splitting emoji", () => {
    const control = element("button", {
      attributes: { "aria-label": "😀".repeat(161) },
    });
    const label = accessibleLabelFor(control);

    expect(Array.from(label)).toHaveLength(160);
    expect(label.endsWith("😀")).toBe(true);
  });
});
