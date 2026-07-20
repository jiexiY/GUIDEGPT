const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "i",
  "in", "is", "it", "me", "my", "of", "on", "or", "safely", "the", "this",
  "to", "with",
]);

const SENSITIVE_LABEL =
  /\b(password|passcode|one[- ]?time code|verification code|private key|secret|seed phrase|card number|credit card|cvv|security code)\b/i;
const COMMIT_LABEL =
  /\b(save|apply|confirm|continue|submit|publish|update|create|add|invite|send|enable|checkout|pay|delete|remove|revoke)\b/i;
const SAFE_COMMIT_LABEL =
  /\b(save|apply|confirm|continue|submit|update)\b/i;
const HIGH_RISK_LABEL =
  /\b(publish|send|invite|checkout|pay|purchase|delete|remove|revoke|transfer|close account)\b/i;

function bounded(value, max) {
  return String(value || "").replace(/\s+/g, " ").trim().slice(0, max);
}

function tokens(value) {
  return new Set(
    (bounded(value, 500).toLowerCase().match(/[a-z0-9]+/g) || [])
      .filter((token) => token.length > 1 && !STOP_WORDS.has(token)),
  );
}

function relevance(element, goalTokens, goal) {
  const label = bounded(element.label, 160);
  const labelTokens = tokens(label);
  let score = 0;

  for (const token of labelTokens) {
    if (goalTokens.has(token)) score += token.length > 4 ? 5 : 3;
  }
  if (label.length >= 3 && goal.includes(label.toLowerCase())) score += 8;
  if (score > 0 && ["input", "select", "tab"].includes(element.role)) score += 1;
  return score;
}

function targetStep(element) {
  const label = bounded(element.label, 160);
  const quoted = `"${label}"`;
  const common = {
    targetText: label,
    targetRole: element.role,
    caution: "",
  };

  if (element.role === "input") {
    return {
      ...common,
      title: bounded(`Update ${label}`, 90),
      instruction: bounded(
        `Find the ${quoted} field and enter the value required by your goal. Do not enter passwords, security codes, or other secrets.`,
        360,
      ),
      verification: bounded(
        `Confirm the ${quoted} field shows the intended value.`,
        240,
      ),
    };
  }

  if (element.role === "select") {
    return {
      ...common,
      title: bounded(`Choose ${label}`, 90),
      instruction: bounded(
        `Open ${quoted} and choose the option that matches your goal.`,
        360,
      ),
      verification: bounded(
        `Confirm ${quoted} shows the option you intended.`,
        240,
      ),
    };
  }

  if (["link", "tab", "menuitem"].includes(element.role)) {
    return {
      ...common,
      title: bounded(`Open ${label}`, 90),
      instruction: bounded(
        `Select ${quoted} to open the relevant area, then review what appears before continuing.`,
        360,
      ),
      verification: bounded(
        `Confirm the page now shows the section associated with ${quoted}.`,
        240,
      ),
    };
  }

  return {
    ...common,
    title: bounded(`Use ${label}`, 90),
    instruction: bounded(
      `Select ${quoted}, then review the resulting page state before moving on.`,
      360,
    ),
    verification: bounded(
      `Confirm selecting ${quoted} produced the expected visible result.`,
      240,
    ),
  };
}

function reviewStep() {
  return {
    title: "Review the current page",
    instruction:
      "Confirm you are on the correct page and compare the visible settings with your goal before changing anything.",
    targetText: "",
    targetRole: "other",
    verification: "The page and account context match the task you intend to complete.",
    caution: "Stop if the page, account, or requested outcome is not what you expected.",
  };
}

function commitStep(element) {
  const label = bounded(element.label, 160);
  const risky = HIGH_RISK_LABEL.test(label);
  return {
    title: risky ? "Review before confirming" : bounded(`Confirm with ${label}`, 90),
    instruction: bounded(
      risky
        ? `Review every value and consequence, then select "${label}" only when you are certain.`
        : `Review your changes, then select "${label}" when you are ready to finish.`,
      360,
    ),
    targetText: label,
    targetRole: element.role,
    verification: bounded(
      "Confirm the page shows the expected result and no error message.",
      240,
    ),
    caution: risky
      ? "This action may affect other people, money, access, or published data. Review it carefully."
      : "Review the final values before continuing.",
  };
}

function verifyStep() {
  return {
    title: "Verify the result",
    instruction:
      "Check the page for the updated value, a confirmation message, or another visible sign that your goal was completed.",
    targetText: "",
    targetRole: "other",
    verification: "The intended result is visible and the page shows no unresolved error.",
    caution: "Do not assume the change succeeded without visible confirmation.",
  };
}

export function createFallbackMissionPlan(input) {
  const goal = bounded(input.goal, 400);
  const goalLower = goal.toLowerCase();
  const goalTokens = tokens(goal);
  const elements = (input.interactiveElements || [])
    .map((element) => ({
      role: element.role,
      label: bounded(element.label, 160),
    }))
    .filter((element) => element.label && !SENSITIVE_LABEL.test(element.label));

  const ranked = elements
    .map((element, index) => ({
      element,
      index,
      score: relevance(element, goalTokens, goalLower),
    }))
    .sort((left, right) => right.score - left.score || left.index - right.index);

  const targets = ranked
    .filter(({ element }) => !COMMIT_LABEL.test(element.label))
    .filter(({ score }) => score > 0)
    .slice(0, 2)
    .map(({ element }) => element);

  const commitCandidate = ranked
    .filter(({ element }) => COMMIT_LABEL.test(element.label))
    .sort((left, right) => right.score - left.score || right.index - left.index)[0];
  const commit = commitCandidate && (
    commitCandidate.score > 0 ||
    (targets.length > 0 && SAFE_COMMIT_LABEL.test(commitCandidate.element.label))
  )
    ? commitCandidate.element
    : null;

  const steps = [];
  if (targets.length) {
    steps.push(...targets.map(targetStep));
  } else {
    steps.push(reviewStep());
  }

  if (commit) {
    steps.push(commitStep(commit));
  } else {
    steps.push(verifyStep());
  }

  return {
    summary: bounded(`Basic guide created for: ${goal}`, 280),
    steps: steps.slice(0, 4),
  };
}

export function shouldUseFallback(error) {
  return Boolean(error);
}
