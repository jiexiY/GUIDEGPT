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

function labelFor(element) {
  return (
    element.getAttribute("aria-label") ||
    element.getAttribute("title") ||
    element.getAttribute("placeholder") ||
    element.textContent ||
    element.getAttribute("name") ||
    ""
  ).replace(/\s+/g, " ").trim().slice(0, 160);
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
    if (parent.closest("input,textarea,[contenteditable='true']")) continue;

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
    if (!isVisible(element) || element.closest("[data-guidegpt-ui]")) continue;
    const label = labelFor(element);
    if (!label) continue;
    const key = roleFor(element) + ":" + label.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    interactiveElements.push({ role: roleFor(element), label });
    if (interactiveElements.length >= 80) break;
  }

  return {
    pageUrl: window.location.href,
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
    if (!isVisible(element) || element.closest("[data-guidegpt-ui]")) continue;
    const label = labelFor(element).toLowerCase();
    if (label === needle || label.includes(needle) || needle.includes(label)) {
      return element;
    }
  }
  return null;
}
