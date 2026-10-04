export interface NavItem {
  label: string;
  href: string;
  /** Emoji glyph keeps V1 dependency-free; swap for an icon set later. */
  icon: string;
  /** Systems marked planned render a "Phase N" badge instead of a full module. */
  planned?: string;
  children?: Array<{ label: string; href: string }>;
}

export const NAV: Array<NavItem> = [
  {
    label: "Command Center", href: "/", icon: "◎",
    children: [
      { label: "Executive Dashboard", href: "/" },
      { label: "Operations Status", href: "/operations" },
      { label: "Research Activity", href: "/research" },
      { label: "Audit Log", href: "/admin/audit" },
    ],
  },
  {
    label: "Game Library", href: "/games", icon: "🎲",
    children: [
      { label: "All Games", href: "/games" },
      { label: "Categories", href: "/games/categories" },
      { label: "Mechanics", href: "/games/mechanics" },
    ],
  },
  {
    label: "Research Engine", href: "/research", icon: "🔬",
    children: [
      { label: "Studies", href: "/research/studies" },
      { label: "Participants", href: "/research/participants" },
      { label: "Sessions", href: "/research/sessions" },
      { label: "Surveys", href: "/research/surveys" },
      { label: "Mechanic Insights", href: "/research/mechanics" },
      { label: "Data Quality", href: "/research/quality" },
      { label: "Findings & Reports", href: "/research/findings" },
      { label: "Integrity & Insights", href: "/research/integrity" },
    ],
  },
  {
    label: "Field Operations", href: "/field", icon: "🚐",
    children: [
      { label: "Fleet", href: "/field?tab=fleet" },
      { label: "Routes", href: "/field?tab=routes" },
      { label: "Events", href: "/field?tab=events" },
      { label: "Teams", href: "/field?tab=teams" },
      { label: "Equipment", href: "/field?tab=equipment" },
    ],
  },
  { label: "Storefront", href: "/storefront", icon: "🏠", planned: "Phase 7" },
  {
    label: "Sponsors", href: "/sponsors", icon: "🤝",
    children: [
      { label: "Overview", href: "/sponsors" },
      { label: "Printable Report", href: "/sponsors/report" },
    ],
  },
  {
    label: "Community", href: "/community", icon: "🌐",
    children: [
      { label: "Overview", href: "/community" },
    ],
  },
  {
    label: "Institutional", href: "/institutional", icon: "🏛️",
    children: [
      { label: "Overview", href: "/institutional" },
    ],
  },
  {
    label: "Content", href: "/content", icon: "📚",
    children: [
      { label: "Media Library", href: "/content" },
    ],
  },
  {
    label: "People", href: "/people", icon: "👥",
    children: [
      { label: "Directory", href: "/people" },
    ],
  },
  {
    label: "Admin", href: "/admin", icon: "⚙️",
    children: [
      { label: "System Settings", href: "/admin" },
      { label: "Payouts Ledger", href: "/admin/payouts" },
      { label: "Corporate Packages", href: "/admin/packages" },
      { label: "Audit Log", href: "/admin/audit" },
    ],
  },
];
