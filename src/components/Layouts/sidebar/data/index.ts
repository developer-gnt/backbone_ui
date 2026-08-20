import * as Icons from "../icons";

export const NAV_DATA = [
  {
    label: "MAIN MENU",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "Master",
        icon: Icons.Authentication,
        items: [
          { title: "States", icon: Icons.State, url: "/master/states", items: [] },
          { title: "Reference", icon: Icons.Reference, url: "/master/reference", items: [] },
          { title: "Package", icon: Icons.Package, url: "/master/package", items: [] },
          { title: "Client Pricing", icon: Icons.Package, url: "/master/client-pricing", items: [] },
          { title: "Credit", icon: Icons.Credit, url: "/master/credit", items: [] },
          { title: "Transaction", icon: Icons.Transaction, url: "/master/transaction", items: [] },
          { title: "Points", icon: Icons.Points, url: "/master/points", items: [] },
          { title: "Order Type", icon: Icons.Order, url: "/master/orders", items: [] },
          { title: "Forms", icon: Icons.Alphabet, url: "/master/forms", items: [] },
          { title: "Alert Availablity", icon: Icons.Alert, url: "/master/availablity", items: [] },
        ],
      },
      {
        title: "Inspections",
        icon: Icons.Alphabet,
        items: [
          { title: "UAD 3.6", url: "/master/inspection36" },
          { title: "UAD 2.6", url: "/master/inspection26" },
          { title: "Records", url: "/master/inspections/records" }
        ],
      },
      {
        title: "New Order",
        icon: Icons.OrderReport,
        items: [
          { title: "New Orders", url: "/orders/new-order" },
          { title: "Accepted Orders", url: "/orders/accept-orders" },
        ],
      },
      {
        title: "Reports",
        icon: Icons.PieChart,
        items: [
          { title: "Orders Report", url: "/reports/order-reports" },
          { title: "Transactions Report", url: "/reports/transaction-reports" },
          { title: "Employees Report", url: "/reports/employee-reports" },
          { title: "Clients Report", url: "/reports/client-reports" },
          { title: "Website Access Report", url: "/reports/website-access-reports" },
        ],
      },
      {
        title: "User",
        icon: Icons.User2,
        items: [
          { title: "BackBone Data Solutions Employees", url: "/users/employee-management" },
          { title: "BackBone Data Solutions Clients", url: "/users/client-management" },
        ],
      },
      {
        title: "Chat System",
        icon: Icons.ChatSystem,
        url: "/chat-system",
        items: [],
      },
      {
        title: "Bulk Email Send",
        icon: Icons.BulkEmail,
        url: "/bulk-emails",
        items: [],
      },
      {
        title: "Attendance",
        icon: Icons.Attendance,
        url: "/attendance",
        items: [],
      },
    ],
  },
];

export const CLIENT_NAV_DATA = [
  {
    label: "CLIENT MENU",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "Special Instruction",
        icon: Icons.Authentication,
        url: "/client/special-instructions",
        items: [],
      },
      {
        title: "Chat With Us",
        icon: Icons.ChatSystem,
        url: "/chat-system",
        items: [],
      },
      {
        title: "Refer Us",
        icon: Icons.User2,
        url: "/client/refer-us",
        items: [],
      },
      {
        title: "History",
        icon: Icons.PieChart,
        items: [
          { title: "Order Report", url: "/reports/order-reports" },
          { title: "Accounting Report", url: "/reports/account-report" },
          { title: "Point History", url: "/reports/points-history" },
        ],
      },
      {
        title: "Inspections",
        icon: Icons.Alphabet,
        items: [
          { title: "UAD 3.6", url: "/master/inspection36" },
          { title: "UAD 2.6", url: "/master/inspection26" },
          { title: "Records", url: "/master/inspections/records" }
        ],
      },
      {
        title: "New Order",
        icon: Icons.OrderReport,
        url: "/client/new-order",
        items: [],
      },
    ],
  },
];

export const SUPERVISOR_NAV_DATA = [
  {
    label: "SUPERVISOR MENU",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "Team Member",
        icon: Icons.User2,
        url: "/users/team-members",
        items: [],
      },
      {
        title: "New Assignment Order",
        icon: Icons.OrderReport,
        url: "/orders/assigned-orders",
        items: [],
      },
      {
        title: "Order Report",
        icon: Icons.PieChart,
        url: "/reports/order-reports",
        items: [],
      },
      {
        title: "New Order",
        icon: Icons.OrderReport,
        items: [
          { title: "New Order", url: "/orders/new-order" },
          { title: "Accept Order", url: "/orders/accept-orders" },
        ],
      },
      {
        title: "Inspections",
        icon: Icons.Alphabet,
        items: [
          { title: "UAD 3.6", url: "/master/inspection36" },
          { title: "UAD 2.6", url: "/master/inspection26" },
          { title: "Records", url: "/master/inspections/records" }
        ],
      },
      {
        title: "Place New Order",
        icon: Icons.OrderReport,
        url: "/orders/place-new-order",
        items: [],
      },
    ],
  },
];

export const TEAM_MEMBER_NAV_DATA = [
  {
    label: "TEAM MEMBER MENU",
    items: [
      {
        title: "Dashboard",
        url: "/",
        icon: Icons.HomeIcon,
        items: [],
      },
      {
        title: "New Orders",
        icon: Icons.OrderReport,
        url: "/orders/new-order",
        items: [],
      },
      // {
      //   title: "Inspections",
      //   icon: Icons.Alphabet,
      //   items: [
      //     { title: "Inspection 2.6", url: "/master/inspection26" },
      //     { title: "Inspection 3.6", url: "/master/inspection36" },
      //     { title: "Records", url: "/master/inspections/records" }
      //   ],
      // },
      {
        title: "Orders Assigned",
        icon: Icons.OrderReport,
        url: "/orders/assigned-orders",
        items: [],
      },
      {
        title: "Place New Order",
        icon: Icons.OrderReport,
        url: "/orders/place-new-order",
        items: [],
      },
      {
        title: "Order Report",
        icon: Icons.PieChart,
        url: "/reports/order-reports",
        items: [],
      },
      {
        title: "Chat System",
        icon: Icons.ChatSystem,
        url: "/chat-system",
        items: [],
      },
    ],
  },
];
