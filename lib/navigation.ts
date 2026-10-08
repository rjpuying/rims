import {
  ArrowRightLeft,
  BarChart3,
  HandCoins,
  LayoutDashboard,
  Package,
  Recycle,
  Settings,
  ShoppingCart,
  Truck,
  Users,
  Wheat,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  permission: string;
  icon: LucideIcon;
};

export type NavGroup = {
  label: string;
  items: NavItem[];
};

export const NAV_GROUPS: NavGroup[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", permission: "dashboard.view", icon: LayoutDashboard },
    ],
  },
  {
    label: "Sales",
    items: [
      { href: "/sales", label: "Sales / POS", permission: "sales.view", icon: ShoppingCart },
      { href: "/credits", label: "Customer Credits", permission: "credits.view", icon: HandCoins },
    ],
  },
  {
    label: "Receiving",
    items: [
      { href: "/deliveries", label: "Delivery Received", permission: "delivery.view", icon: Truck },
      { href: "/palay", label: "Palay Received", permission: "palay.view", icon: Wheat },
    ],
  },
  {
    label: "Stock",
    items: [
      { href: "/inventory", label: "Inventory", permission: "inventory.view", icon: Package },
      { href: "/rebagging", label: "Rebagging", permission: "rebagging.view", icon: Recycle },
      { href: "/transfers", label: "Transfer to Reseller", permission: "transfer.view", icon: ArrowRightLeft },
    ],
  },
  {
    label: "Insights",
    items: [
      { href: "/reports", label: "Reports", permission: "reports.view", icon: BarChart3 },
    ],
  },
  {
    label: "Administration",
    items: [
      { href: "/users", label: "Users & Roles", permission: "users.view", icon: Users },
      { href: "/settings", label: "Settings", permission: "settings.view", icon: Settings },
    ],
  },
];

export const NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap((group) => group.items);

export const BOTTOM_NAV_HREFS = ["/dashboard", "/sales", "/inventory"];

export function visibleNavGroups(permissions: string[]): NavGroup[] {
  return NAV_GROUPS.map((group) => ({
    label: group.label,
    items: group.items.filter((item) =>
      permissions.includes(item.permission),
    ),
  })).filter((group) => group.items.length > 0);
}

export function visibleNavItems(permissions: string[]): NavItem[] {
  return NAV_ITEMS.filter((item) => permissions.includes(item.permission));
}
