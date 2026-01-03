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
          {
            title: "States",
            icon: Icons.State,
            url: "/master/states",
            items: [],
          },
          {
            title: "Reference",
            icon: Icons.Reference,
            url: "/master/reference",
            items: [],
          },
          {
            title: "Package",
            icon: Icons.Package,
            url: "/master/package",
            items: [],
          },
          {
            title: "Credit",
            icon: Icons.Credit,
            url: "/master/credit",

            items: [],
          },
          {
            title: "Transaction",
            icon: Icons.Transaction,
            url: "/master/transaction",
            items: [],
          },
          {
            title: "Points",
            icon: Icons.Points,
            url: "/master/points",
            items: [],
          },
          {
            title: "Order Type",
            icon: Icons.Order,
            url: "/master/orders",
            items: [],
          },
          {
            title: "Forms",
            icon: Icons.Alphabet,
            url: "/master/forms",
            items: [],
          },
          {
            title: "Alert Availablity",
            icon: Icons.Alert,
            url: "/master/availablity",
            items: [],
          },
        ],
      },
      {
        title: "New Order",
        icon: Icons.OrderReport,
        items: [
          {
            title: "New Orders",
            url: "/orders/new-order",
          },
          {
            title: "Accepted Orders",
            url: "/orders/accept-orders",
          },
        ],
      },
      {
        title: "Reports",
        icon: Icons.PieChart,
        items: [
          {
            title: "Orders Report",
            url: "/reports/order-reports",
          },
          {
            title: "Transactions Report",
            url: "/reports/transaction-reports",
          },
          {
            title: "Employees Report",
            url: "/reports/employee-reports",
          },
          {
            title: "Clients Report",
            url: "/reports/client-reports",
          },
          {
            title: "Website Access Report",
            url: "/reports/website-access-reports",
          },
        ],
      },
      {
        title: "User",
        icon: Icons.User2,
        items: [
          {
            title: "BackBone Data Solutions Employees",
            url: "/users/employee-management",
          },
          {
            title: "BackBone Data Solutions Clients",
            url: "/users/client-management",
          },
        ],
      },
      {
        title: "Chat System",
        icon: Icons.ChatSystem,
        url: "/client-management",
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
