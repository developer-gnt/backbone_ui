
export const dashboardStats = {
  total_orders: 120,
  active_clients: 45,
  total_employees: 18,
  pending_orders: 9,
};


export const statesData = [
  { id: "ST001", name: "Maharashtra" },
  { id: "ST002", name: "Gujarat" },
];

export const referenceData = [
  { id: "REF001", source: "Google" },
  { id: "REF002", source: "Referral" },
];

/* PACKAGE */
export const packageData = [
  { id: "PK001", title: "Basic Plan", duration: 30, price: 99 },
  { id: "PK002", title: "Premium Plan", duration: 90, price: 249 },
];

/* CREDIT */
export const creditData = [
  { id: "CR001", name: "Starter Credit", credit: 10 },
];

/* TRANSACTION */
export const transactionData = [
  {
    id: "TX001",
    status: "Completed",
    amount: 150,
    credits: 10,
    transaction_id: "TXN-001",
    refill_date: "2025-02-01",
    user_name: "Amaan",
    client_name: "John Doe",
  },
];

export const pointsData = [
  { id: "PT001", user_name: "Amaan", point: 120 },
];

/* ORDER TYPE */
export const orderTypeData = [
  { id: "OT001", order_type: "Standard", sequence_number: 1 },
];

 export const formsData = [
  { id: "FM001", form: "Property Details", sequence_number: 1 },
];

 export const alertAvailabilityData = [
  {
    id: "AA001",
    eta: "2025-02-15 10:30",
    availability_status: "Available",
  },
];
 export const newOrdersData = [
  {
    id: "NO001",
    file_no: "FILE-101",
    tat: "48 hrs",
    order_date: "2025-02-10",
    status: "New",
    user_name: "Amaan",
    client_name: "John Doe",
    property_address: "Palm Street, CA",
  },
];

 export const acceptedOrdersData = [
  {
    id: "AO001",
    file_no: "FILE-102",
    tat: "72 hrs",
    order_date: "2025-02-08",
    status: "Accepted",
    user_name: "John",
    client_name: "Michael",
    work_status: "In Progress",
  },
];
 export const ordersReportData = [
  {
    id: "OR001",
    file_no: "FILE-123",
    tat: "48 hrs",
    order_date: "2025-02-10",
    status: "Completed",
    user_name: "amaan",
    client_name: "John Doe",
    email: "john@example.com",
    property_address: "Palm Street, CA",
    remark: "All verified",
    remaining_tat: "0 hrs",
    client_rating: 4,
    completed_date: "2025-02-12",
    client_feedback: "Great service",
  },
];

 export const transactionsReportData = transactionData;

 export const employeesReportData = [
  {
    id: "ER001",
    emp_id: "EMP-101",
    first_name: "Amaan",
    last_name: "Shaikh",
    registration_date: "2024-12-05",
    orders_assigned: 24,
    orders_completed: 18,
    orders_cancelled: 3,
  },
];

 export const clientsReportData = [
  {
    id: "CR001",
    orders: 12,
    email: "client@example.com",
    username: "client_one",
    wallet_balance: 250,
    status: "Active",
    company_name: "Backbone Data Solutions",
    first_name: "John",
    last_name: "Doe",
    mobile: "9988776655",
    reference_source: "Google",
    address: "MG Road",
    city: "Mumbai",
    state: "Maharashtra",
    zipcode: "400001",
    registration_date: "2025-02-01",
  },
];

export const websiteAccessReportData = [
  {
    id: "WA001",
    user_name: "Amaan",
    ip_address: "192.168.1.20",
    last_login_date: "2025-02-12 10:30 AM",
    address: "Mumbai, Maharashtra",
  },
];

export const employeesData = [
  {
    id: "EMP001",
    first_name: "Amaan",
    last_name: "Shaikh",
    email: "amaan@gmail.com",
    mobile: "9876543210",
    address: "Mumbai",
    role: "Supervisor",
    status: "Active",
    registration_date: "2025-01-10",
    system_id: "SYS-1001",
    file_no: "FILE-123",
  },
];

export const clientsData = [
  {
    id: "CL001",
    status: "Active",
    type: "Regular Appraiser",
    email: "client@example.com",
    username: "client_one",
    company_name: "Backbone Data Solutions",
    first_name: "John",
    last_name: "Doe",
    mobile: "9988776655",
    reference_source: "Google",
    address: "MG Road",
    city: "Mumbai",
    state: "Maharashtra",
    zipcode: "400001",
    registration_date: "2025-02-01",
  },
];

export const bulkEmailUsers = [
  { id: "U001", name: "Amaan Shaikh", email: "amaan@gmail.com" },
  { id: "U002", name: "John Doe", email: "john@example.com" },
];

export const attendanceData = [
  {
    id: "AT001",
    user_name: "Amaan Shaikh",
    date: "2025-02-12",
    login_time: "09:30",
    logout_time: "18:00",
  },
];

export const chatUsersData = [
  { id: "CH001", name: "Amaan", last_message: "Hello!" },
  { id: "CH002", name: "John", last_message: "Order update?" },
];
