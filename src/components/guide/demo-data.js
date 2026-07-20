export const suggestedGoals = [
  "Update the Pro monthly price to $29 and publish it safely",
  "Turn on extra storage and confirm the new monthly total",
  "Review this pricing page for anything I should verify before publishing",
];

export const plans = [
  {
    id: "free",
    name: "Free",
    description: "For individuals getting started.",
    monthly: 0,
    annual: 0,
    features: ["1 project", "Up to 3 collaborators", "Basic reports"],
  },
  {
    id: "pro",
    name: "Pro",
    description: "For growing teams and professional use.",
    monthly: 19,
    annual: 190,
    features: ["Unlimited projects", "Up to 15 collaborators", "Advanced reports", "Priority support"],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    description: "For organizations with advanced needs.",
    monthly: 49,
    annual: 490,
    features: ["Everything in Pro", "SSO and SCIM", "Custom roles", "Dedicated support"],
  },
];
