"use client";

import React, { useCallback, useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";

type EmployeeRecord = {
  id: number | string;
  system_id?: number | string;
  file_no?: number | string;
  firstname: string;
  lastname: string;
  email: string;
  mobileno: string;
  address: string;
  role: string;
  status: string;
  registration_date?: string;
  password_preview?: string;
  emp_supervisor?: string;
};

type SupervisorOption = {
  id: number | string;
  firstname: string;
  lastname: string;
  email: string;
};

type EmployeeFormState = {
  firstName: string;
  lastName: string;
  address: string;
  email: string;
  mobile: string;
  role: "Supervisor" | "Team Member";
  status: string;
  supervisorId: string;
};

const initialForm: EmployeeFormState = {
  firstName: "",
  lastName: "",
  address: "",
  email: "",
  mobile: "",
  role: "Supervisor",
  status: "",
  supervisorId: "",
};

const formatDate = (value?: string) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB");
};

function CheckIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <path d="M5 12l5 5l10 -10" />
    </svg>
  );
}

function TrashSvg() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
      <path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12" />
      <path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3" />
    </svg>
  );
}

function DocumentSvg() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      className="h-5 w-5"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path stroke="none" d="M0 0h24v24H0z" fill="none" />
      <polyline points="14 3 14 8 19 8" />
      <path d="M17 21h-10a2 2 0 0 1 -2 -2v-14a2 2 0 0 1 2 -2h7l5 5v11a2 2 0 0 1 -2 2z" />
      <line x1="12" y1="11" x2="12" y2="17" />
      <polyline points="9 14 12 17 15 14" />
    </svg>
  );
}

const EmployeeManagement = () => {
  const [employees, setEmployees] = useState<EmployeeRecord[]>([]);
  const [supervisors, setSupervisors] = useState<SupervisorOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<"add" | "manage">("add");
  const [editingEmployeeId, setEditingEmployeeId] = useState<
    number | string | null
  >(null);
  const [actionEmployeeId, setActionEmployeeId] = useState<number | string | null>(
    null,
  );
  const [docsEmployee, setDocsEmployee] = useState<EmployeeRecord | null>(null);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [form, setForm] = useState<EmployeeFormState>(initialForm);

  const loadEmployees = useCallback(async () => {
    setLoading(true);

    try {
      const response = await axiosInstance.get("/user/employees");
      const items = Array.isArray(response.data) ? response.data : [];

      setEmployees(
        items.filter(
          (employee) =>
            employee.role === "Supervisor" || employee.role === "Team Member",
        ),
      );
      setFeedback((prev) => (prev?.type === "error" ? null : prev));
    } catch (error) {
      setEmployees([]);
      setFeedback({
        type: "error",
        message: getApiErrorMessage(
          error,
          "Unable to load employees right now.",
        ),
      });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSupervisors = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/user/employees", {
        params: { role: "Supervisor" },
      });

      setSupervisors(Array.isArray(response.data) ? response.data : []);
    } catch {
      setSupervisors([]);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
    loadSupervisors();
  }, [loadEmployees, loadSupervisors]);

  const resetForm = () => {
    setForm(initialForm);
    setEditingEmployeeId(null);
  };

  const handleInputChange = (
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>,
  ) => {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
      ...(name === "role" && value === "Supervisor" ? { supervisorId: "" } : {}),
    }));
  };

  const validateForm = () => {
    if (
      !form.firstName.trim() ||
      !form.lastName.trim() ||
      !form.address.trim() ||
      !form.email.trim() ||
      !form.mobile.trim() ||
      !form.status
    ) {
      window.alert("Empty Data Provided");
      return false;
    }

    if (form.role === "Team Member" && !form.supervisorId) {
      window.alert("Please select a supervisor for Team Member.");
      return false;
    }

    return true;
  };

  const submitEmployee = async () => {
    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        firstname: form.firstName.trim(),
        lastname: form.lastName.trim(),
        address: form.address.trim(),
        email: form.email.trim(),
        username: form.email.trim(),
        mobileno: form.mobile.trim(),
        role: form.role,
        status: form.status,
        emp_supervisor:
          form.role === "Team Member" ? form.supervisorId || undefined : undefined,
      };

      const response = await axiosInstance.post("/user/employees", payload);

      if (response.data?.id) {
        try {
          await axiosInstance.post(`/user/${response.data.id}/send-login-details`);
        } catch {
          // Keep create flow working even when SMTP is not configured.
        }
      }

      window.alert("Employee Details Save Succesfully!");
      setFeedback({
        type: "success",
        message: `Employee Details Saved Successfully. Login password: ${response.data?.password_preview || "Auto-generated"}`,
      });
      resetForm();
      await Promise.all([loadEmployees(), loadSupervisors()]);
    } catch (error) {
      setFeedback({
        type: "error",
        message: getApiErrorMessage(error, "FAILED to save Employee Details"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const updateEmployee = async () => {
    if (!editingEmployeeId || !validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      await axiosInstance.patch(`/user/${editingEmployeeId}`, {
        firstname: form.firstName.trim(),
        lastname: form.lastName.trim(),
        address: form.address.trim(),
        email: form.email.trim(),
        username: form.email.trim(),
        mobileno: form.mobile.trim(),
        role: form.role,
        status: form.status,
        emp_supervisor:
          form.role === "Team Member" ? form.supervisorId || undefined : undefined,
      });

      try {
        await axiosInstance.post(`/user/${editingEmployeeId}/send-login-details`);
      } catch {
        // SMTP can stay optional.
      }

      window.alert("Employee Details Update Succesfully!");
      setFeedback({
        type: "success",
        message: "Employee Details UPDATED Successfully....!",
      });
      resetForm();
      setActiveTab("manage");
      await Promise.all([loadEmployees(), loadSupervisors()]);
    } catch (error) {
      setFeedback({
        type: "error",
        message: getApiErrorMessage(error, "FAILED to save Employee Details"),
      });
    } finally {
      setSubmitting(false);
    }
  };

  const startEdit = (employee: EmployeeRecord) => {
    setForm({
      firstName: employee.firstname || "",
      lastName: employee.lastname || "",
      address: employee.address || "",
      email: employee.email || "",
      mobile: employee.mobileno || "",
      role: employee.role === "Supervisor" ? "Supervisor" : "Team Member",
      status: employee.status || "",
      supervisorId: employee.emp_supervisor ? String(employee.emp_supervisor) : "",
    });
    setEditingEmployeeId(employee.id);
    setActiveTab("add");
    setFeedback(null);
  };

  const handleActivate = async (employee: EmployeeRecord) => {
    setActionEmployeeId(employee.id);

    try {
      await axiosInstance.patch(`/user/${employee.id}/status`, {
        status: "Active",
      });

      try {
        await axiosInstance.post(`/user/${employee.id}/send-login-details`);
      } catch {
        // Email preview/live SMTP can remain optional.
      }

      window.alert("Employee activated succesfully");
      setFeedback({
        type: "success",
        message: `${employee.firstname} ${employee.lastname} is now active.`,
      });
      await loadEmployees();
    } catch (error) {
      setFeedback({
        type: "error",
        message: getApiErrorMessage(error, "Unable to activate employee."),
      });
    } finally {
      setActionEmployeeId(null);
    }
  };

  const handleDelete = async (employee: EmployeeRecord) => {
    const confirmed = window.confirm("Are You Sure To REMOVE this Employee ?");

    if (!confirmed) {
      return;
    }

    setActionEmployeeId(employee.id);

    try {
      await axiosInstance.delete(`/user/${employee.id}`);
      window.alert("Employee Removed Successfully ");
      setFeedback({
        type: "success",
        message: `${employee.firstname} ${employee.lastname} was deleted successfully.`,
      });
      await loadEmployees();
    } catch (error) {
      setFeedback({
        type: "error",
        message: getApiErrorMessage(error, "Failed To Remove Employee"),
      });
    } finally {
      setActionEmployeeId(null);
    }
  };

  return (
    <>
      <div className="rounded-[10px] border border-stroke bg-white p-5 shadow-1 dark:border-dark-3 dark:bg-gray-dark sm:p-7.5">
        <div className="mb-5">
          <div className="text-sm text-dark-5">Overview</div>
          <h2 className="text-2xl font-semibold text-dark dark:text-white">
            Back Bone employees{" "}
            <small className="text-base font-normal text-dark-5">
              Add,edit,update,delete-employees
            </small>
          </h2>
          <p className="mt-2 text-sm text-dark-5">
            This activity allow subAdmin to manage employees.
          </p>
        </div>

        {feedback && (
          <div
            className={`mb-5 rounded-md border px-4 py-3 text-sm ${
              feedback.type === "success"
                ? "border-[#dff0d8] bg-[#dff0d8] text-black"
                : "border-red-200 bg-red-50 text-red-700"
            }`}
          >
            {feedback.message}
          </div>
        )}

        <div className="overflow-hidden rounded-lg border border-stroke dark:border-dark-3">
          <div className="flex flex-wrap border-b border-stroke bg-gray-1 dark:border-dark-3 dark:bg-dark-2">
            <button
              type="button"
              onClick={() => setActiveTab("add")}
              className={`border-r border-stroke px-5 py-3 text-sm font-medium dark:border-dark-3 ${
                activeTab === "add"
                  ? "bg-white text-primary dark:bg-gray-dark"
                  : "text-dark-5"
              }`}
            >
              Add New Employees
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("manage")}
              className={`px-5 py-3 text-sm font-medium ${
                activeTab === "manage"
                  ? "bg-white text-primary dark:bg-gray-dark"
                  : "text-dark-5"
              }`}
            >
              Manage Employees
            </button>
          </div>

          <div className="p-5">
            {activeTab === "add" ? (
              <div>
                <h3 className="mb-4 text-lg font-semibold text-dark dark:text-white">
                  Employee Details [Supervisor/Team Member]
                </h3>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstName"
                        value={form.firstName}
                        onChange={handleInputChange}
                        placeholder="Enter First Name"
                        className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastName"
                        value={form.lastName}
                        onChange={handleInputChange}
                        placeholder="Enter Last Name"
                        className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        Address
                      </label>
                      <textarea
                        name="address"
                        value={form.address}
                        onChange={handleInputChange}
                        placeholder="Enter Address"
                        rows={4}
                        className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      />
                    </div>

                    {form.role === "Team Member" && (
                      <div>
                        <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                          Select Supervisor
                        </label>
                        <select
                          name="supervisorId"
                          value={form.supervisorId}
                          onChange={handleInputChange}
                          className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                        >
                          <option value="">Select Supervisor</option>
                          {supervisors.map((supervisor) => (
                            <option key={supervisor.id} value={String(supervisor.id)}>
                              {supervisor.firstname} {supervisor.lastname}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={form.email}
                        onChange={handleInputChange}
                        placeholder="Enter Email"
                        className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        Mobile
                      </label>
                      <input
                        type="text"
                        name="mobile"
                        value={form.mobile}
                        onChange={handleInputChange}
                        placeholder="Enter Mobile No"
                        className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        Role
                      </label>
                      <select
                        name="role"
                        value={form.role}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      >
                        <option value="Supervisor">Supervisor</option>
                        <option value="Team Member">Team Member</option>
                      </select>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium text-dark dark:text-white">
                        Status
                      </label>
                      <select
                        name="status"
                        value={form.status}
                        onChange={handleInputChange}
                        className="w-full rounded-md border border-stroke bg-transparent px-4 py-2.5 outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      >
                        <option value=""></option>
                        <option value="Active">Active</option>
                        <option value="New">New</option>
                        <option value="Terminated">Terminated</option>
                        <option value="Pending">Pending</option>
                        <option value="Ex Employee">Ex Employee</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  {!editingEmployeeId ? (
                    <button
                      type="button"
                      onClick={submitEmployee}
                      disabled={submitting}
                      className="rounded-md bg-primary px-5 py-2.5 text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {submitting ? "Submitting..." : "Submit"}
                    </button>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={updateEmployee}
                        disabled={submitting}
                        className="rounded-md bg-primary px-5 py-2.5 text-white hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70"
                      >
                        {submitting ? "Updating..." : "Update"}
                      </button>
                      <button
                        type="button"
                        onClick={resetForm}
                        disabled={submitting}
                        className="rounded-md border border-stroke px-5 py-2.5 text-dark hover:bg-gray-2 disabled:cursor-not-allowed disabled:opacity-70 dark:border-dark-3 dark:text-white dark:hover:bg-dark-2"
                      >
                        Cancel
                      </button>
                    </>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table className="min-w-[1500px]">
                  <TableHeader>
                    <TableRow className="bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-3 [&>th]:text-sm">
                      <TableHead>Sr. No.</TableHead>
                      <TableHead>Make Active</TableHead>
                      <TableHead>Delete</TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Designation</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>File#</TableHead>
                      <TableHead>System Id</TableHead>
                      <TableHead>First Name</TableHead>
                      <TableHead>Last Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Mobile</TableHead>
                      <TableHead>Address</TableHead>
                      <TableHead>Registration Date</TableHead>
                      <TableHead>Password</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {loading ? (
                      <TableRow>
                        <TableCell colSpan={15} className="py-8 text-center text-dark-5">
                          Loading employees...
                        </TableCell>
                      </TableRow>
                    ) : employees.length ? (
                      employees.map((employee, index) => {
                        const isBusy = actionEmployeeId === employee.id;

                        return (
                          <TableRow
                            key={employee.id}
                            className="border-[#eee] dark:border-dark-3"
                          >
                            <TableCell>{index + 1}</TableCell>
                            <TableCell>
                              <button
                                type="button"
                                onClick={() => handleActivate(employee)}
                                disabled={isBusy || employee.status === "Active"}
                                className="text-green-600 disabled:cursor-not-allowed disabled:text-dark-5"
                                aria-label={`Activate ${employee.firstname} ${employee.lastname}`}
                              >
                                <CheckIcon />
                              </button>
                            </TableCell>
                            <TableCell>
                              <button
                                type="button"
                                onClick={() => handleDelete(employee)}
                                disabled={isBusy}
                                className="text-dark hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white"
                                aria-label={`Delete ${employee.firstname} ${employee.lastname}`}
                              >
                                <TrashSvg />
                              </button>
                            </TableCell>
                            <TableCell>
                              <button
                                type="button"
                                onClick={() => setDocsEmployee(employee)}
                                className="text-dark hover:text-primary dark:text-white"
                                aria-label={`Open documents for ${employee.firstname} ${employee.lastname}`}
                              >
                                <DocumentSvg />
                              </button>
                            </TableCell>
                            <TableCell>{employee.role || "—"}</TableCell>
                            <TableCell>{employee.status || "—"}</TableCell>
                            <TableCell>
                              <button
                                type="button"
                                onClick={() => startEdit(employee)}
                                className="underline hover:text-primary"
                              >
                                {employee.file_no ?? employee.id}
                              </button>
                            </TableCell>
                            <TableCell>{employee.system_id ?? employee.id}</TableCell>
                            <TableCell>{employee.firstname || "—"}</TableCell>
                            <TableCell>{employee.lastname || "—"}</TableCell>
                            <TableCell>{employee.email || "—"}</TableCell>
                            <TableCell>{employee.mobileno || "—"}</TableCell>
                            <TableCell className="max-w-[240px] whitespace-normal">
                              {employee.address || "—"}
                            </TableCell>
                            <TableCell>
                              {formatDate(employee.registration_date)}
                            </TableCell>
                            <TableCell>{employee.password_preview || "—"}</TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={15} className="py-8 text-center text-dark-5">
                          There are no employees,We recomended you to add employees.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </div>

      {docsEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 py-6">
          <div className="w-full max-w-2xl rounded-lg border border-stroke bg-white shadow-xl dark:border-dark-3 dark:bg-dark-2">
            <div className="flex items-center justify-between border-b border-stroke px-5 py-4 dark:border-dark-3">
              <h4 className="text-lg font-semibold text-dark dark:text-white">
                WORKING DOCS DOWNLOADS
              </h4>
              <button
                type="button"
                onClick={() => setDocsEmployee(null)}
                className="rounded-md border border-stroke px-3 py-1.5 text-sm hover:bg-gray-2 dark:border-dark-3 dark:hover:bg-dark-2"
              >
                Close
              </button>
            </div>

            <div className="px-5 py-4">
              <p className="mb-4 text-sm text-dark-5">
                Please Find out your WORKING DOCS DOWNLOADS [ File # :{" "}
                {docsEmployee.email || docsEmployee.id} ]
              </p>

              <div className="overflow-x-auto">
                <table className="w-full border border-stroke text-sm dark:border-dark-3">
                  <thead>
                    <tr className="bg-gray-1 text-left dark:bg-dark-2">
                      <th className="border-b border-stroke px-3 py-2 dark:border-dark-3">
                        Type
                      </th>
                      <th className="border-b border-stroke px-3 py-2 dark:border-dark-3">
                        FileName
                      </th>
                      <th className="border-b border-stroke px-3 py-2 dark:border-dark-3">
                        Download
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-4 text-center text-dark-5"
                      >
                        No downloads found here !!
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EmployeeManagement;
