const INTERACTIVE_SELECTOR = [
  "button",
  "a[href]",
  "input:not([type='password']):not([type='hidden'])",
  "select",
  "textarea",
  "[role='button']",
  "[role='tab']",
  "[role='menuitem']",
].join(",");

function isVisible(element) {
  if (!(element instanceof Element)) return false;
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return (
    style.display !== "none" &&
    style.visibility !== "hidden" &&
    Number(style.opacity) > 0 &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function roleFor(element) {
  const explicit = element.getAttribute("role");
  if (["button", "link", "tab", "menuitem"].includes(explicit)) return explicit;
  if (element.matches("button,[role='button']")) return "button";
  if (element.matches("a[href]")) return "link";
  if (element.matches("select")) return "select";
  if (element.matches("input,textarea")) return "input";
  return "other";
}

function normalizedLabel(value) {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  return Array.from(normalized).slice(0, 160).join("");
}

export function isEditableTextRegion(element) {
  for (let current = element; current; current = current.parentElement) {
    const attribute = current.getAttribute?.("contenteditable");
    if (attribute !== null && attribute !== undefined) {
      return String(attribute).trim().toLowerCase() !== "false";
    }
    if (current.isContentEditable === true) return true;
  }
  return false;
}

function isSensitiveTextContainer(node) {
  const tagName = String(node?.tagName || node?.nodeName || "").toLowerCase();
  if (["input", "textarea", "select", "option", "script", "style", "template"].includes(tagName)) {
    return true;
  }
  return isEditableTextRegion(node);
}

function safeTextContent(node) {
  const chunks = [];

  function visit(current) {
    if (!current) return;
    if (current.nodeType === 3) {
      chunks.push(current.nodeValue || "");
      return;
    }
    if (current.nodeType === 1 && isSensitiveTextContainer(current)) return;
    for (const child of current.childNodes || []) visit(child);
  }

  visit(node);
  return normalizedLabel(chunks.join(" "));
}

function labelledByText(element) {
  const ids = String(element.getAttribute("aria-labelledby") || "").trim().split(/\s+/).filter(Boolean);
  if (!ids.length) return "";
  const ownerDocument = element.ownerDocument;
  if (!ownerDocument?.getElementById) return "";
  return normalizedLabel(ids.map((id) => safeTextContent(ownerDocument.getElementById(id))).filter(Boolean).join(" "));
}

function associatedLabelText(element) {
  let labels = [];
  if (element.labels) labels = Array.from(element.labels);

  const ownerDocument = element.ownerDocument;
  const elementId = element.id || element.getAttribute("id");
  if (!labels.length && elementId && ownerDocument?.querySelectorAll) {
    labels = Array.from(ownerDocument.querySelectorAll("label[for]"))
      .filter((label) => label.htmlFor === elementId || label.getAttribute("for") === elementId);
  }

  return normalizedLabel(labels.map(safeTextContent).filter(Boolean).join(" "));
}

export function accessibleLabelFor(element) {
  return (
    labelledByText(element) ||
    normalizedLabel(element.getAttribute("aria-label")) ||
    associatedLabelText(element) ||
    normalizedLabel(element.getAttribute("alt")) ||
    normalizedLabel(element.getAttribute("title")) ||
    normalizedLabel(element.getAttribute("placeholder")) ||
    safeTextContent(element) ||
    normalizedLabel(element.getAttribute("name"))
  );
}

export function sanitizePageUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    if (!["http:", "https:"].includes(url.protocol)) return "";
    return `${url.origin}${url.pathname}`.slice(0, 2_000);
  } catch {
    return "";
  }
}

function visibleText(root, limit) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const chunks = [];
  let length = 0;
  let node;

  while ((node = walker.nextNode()) && length < limit) {
    const parent = node.parentElement;
    if (!parent || !isVisible(parent)) continue;
    if (parent.closest("[data-guidegpt-ui],script,style,noscript,template")) continue;
    if (parent.closest("input,textarea") || isEditableTextRegion(parent)) continue;

    const value = node.nodeValue.replace(/\s+/g, " ").trim();
    if (!value) continue;
    chunks.push(value);
    length += value.length + 1;
  }

  return chunks.join(" ").slice(0, limit);
}

export function capturePageContext(root = document.body) {
  const seen = new Set();
  const interactiveElements = [];

  for (const element of root.querySelectorAll(INTERACTIVE_SELECTOR)) {
    if (
      !isVisible(element)
      || element.closest("[data-guidegpt-ui]")
      || isEditableTextRegion(element)
    ) continue;
    const label = accessibleLabelFor(element);
    if (!label) continue;
    const key = roleFor(element) + ":" + label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    interactiveElements.push({ role: roleFor(element), label });
    if (interactiveElements.length >= 80) break;
  }

  return {
    pageUrl: sanitizePageUrl(window.location.href),
    pageTitle: document.title,
    pageContext: visibleText(root, 12_000),
    interactiveElements,
  };
}

export function findVisibleTarget(targetText, root = document.body) {
  const needle = String(targetText || "").trim().toLowerCase();
  if (!needle) return null;

  const candidates = root.querySelectorAll(INTERACTIVE_SELECTOR);
  for (const element of candidates) {
    if (
      !isVisible(element)
      || element.closest("[data-guidegpt-ui]")
      || isEditableTextRegion(element)
    ) continue;
    const label = accessibleLabelFor(element).toLowerCase();
    if (label === needle || label.includes(needle) || needle.includes(label)) {
      return element;
    }
  }
  return null;
}
