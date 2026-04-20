"use client";

import {
  CallIcon,
  EmailIcon,
  PencilSquareIcon,
  UserIcon,
} from "@/assets/icons";
import { useAuth } from "@/components/Auth/AuthProvider";
import {
  changeCurrentPassword,
  updateCurrentUserProfile,
} from "@/components/Auth/authService";
import InputGroup from "@/components/FormElements/InputGroup";
import { TextAreaGroup } from "@/components/FormElements/InputGroup/text-area";
import { Select } from "@/components/FormElements/select";
import { ShowcaseSection } from "@/components/Layouts/showcase-section";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";
import { useEffect, useMemo, useState } from "react";

type ProfileFormState = {
  username: string;
  email: string;
  firstname: string;
  lastname: string;
  mobileno: string;
  companyname: string;
  officeno: string;
  address: string;
  city: string;
  zipcode: string;
  state: string;
  std_instr: string;
};

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const emptyProfile: ProfileFormState = {
  username: "",
  email: "",
  firstname: "",
  lastname: "",
  mobileno: "",
  companyname: "",
  officeno: "",
  address: "",
  city: "",
  zipcode: "",
  state: "",
  std_instr: "",
};

const emptyPassword: PasswordFormState = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

export function PersonalInfoForm() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState<ProfileFormState>(emptyProfile);
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>(emptyPassword);
  const [states, setStates] = useState<Array<{ label: string; value: string }>>([]);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    setForm({
      username: user.username ?? "",
      email: user.email ?? "",
      firstname: user.firstname ?? "",
      lastname: user.lastname ?? "",
      mobileno: user.mobileno ?? "",
      companyname: user.companyname ?? "",
      officeno: user.officeno ?? "",
      address: user.address ?? "",
      city: user.city ?? "",
      zipcode: user.zipcode ?? "",
      state: user.state ?? "",
      std_instr: user.std_instr ?? "",
    });
  }, [user]);

  useEffect(() => {
    const loadStates = async () => {
      try {
        const response = await axiosInstance.get("/masters/state");
        const items = Array.isArray(response.data) ? response.data : [];
        const mapped = items
          .map((item: any) => ({
            label: item.city || item.state || item.title || item.name || "",
            value: item.city || item.state || item.title || item.name || "",
          }))
          .filter((item: { label: string; value: string }) => item.value);

        setStates(mapped);
      } catch {
        setStates([]);
      }
    };

    void loadStates();
  }, []);

  const stateOptions = useMemo(() => {
    const options = [...states];

    if (form.state && !options.some((item) => item.value === form.state)) {
      options.unshift({ label: form.state, value: form.state });
    }

    return options;
  }, [form.state, states]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleProfileCancel = () => {
    if (!user) {
      setForm(emptyProfile);
      return;
    }

    setForm({
      username: user.username ?? "",
      email: user.email ?? "",
      firstname: user.firstname ?? "",
      lastname: user.lastname ?? "",
      mobileno: user.mobileno ?? "",
      companyname: user.companyname ?? "",
      officeno: user.officeno ?? "",
      address: user.address ?? "",
      city: user.city ?? "",
      zipcode: user.zipcode ?? "",
      state: user.state ?? "",
      std_instr: user.std_instr ?? "",
    });
    setMessage(null);
  };

  const handleProfileSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!user?.id) {
      setMessage({ type: "error", text: "User session not found." });
      return;
    }

    setSavingProfile(true);

    try {
      await updateCurrentUserProfile(user.id, {
        username: form.username.trim(),
        email: form.email.trim(),
        firstname: form.firstname.trim(),
        lastname: form.lastname.trim(),
        mobileno: form.mobileno.trim(),
        companyname: form.companyname.trim(),
        officeno: form.officeno.trim(),
        address: form.address.trim(),
        city: form.city.trim(),
        zipcode: form.zipcode.trim(),
        state: form.state.trim(),
        std_instr: form.std_instr.trim(),
      });

      await refreshUser();
      setMessage({
        type: "success",
        text: "Your profile has been updated successfully.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to update profile."),
      });
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      setMessage({
        type: "error",
        text: "Please fill all password fields.",
      });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setMessage({
        type: "error",
        text: "New Password and Confirm Password must match.",
      });
      return;
    }

    setSavingPassword(true);

    try {
      await changeCurrentPassword(
        passwordForm.currentPassword,
        passwordForm.newPassword,
      );
      setPasswordForm(emptyPassword);
      setMessage({
        type: "success",
        text: "Your password has been updated successfully.",
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: getApiErrorMessage(error, "Unable to change password."),
      });
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-8">
      {message && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm ${
            message.type === "success"
              ? "border-green-200 bg-green-50 text-green-700 dark:border-green-dark dark:bg-green-dark/20 dark:text-green-light-4"
              : "border-red-200 bg-red-50 text-red-700 dark:border-red-dark dark:bg-red-dark/20 dark:text-red-light-4"
          }`}
        >
          {message.text}
        </div>
      )}

      <ShowcaseSection title="Personal Information" className="!p-7">
        <form onSubmit={handleProfileSubmit}>
          <div className="mb-5.5 grid grid-cols-1 gap-5.5 sm:grid-cols-2">
            <InputGroup
              className="w-full"
              type="text"
              name="firstname"
              label="First Name"
              placeholder="Enter first name"
              value={form.firstname}
              handleChange={handleInputChange}
              icon={<UserIcon />}
              iconPosition="left"
              height="sm"
            />

            <InputGroup
              className="w-full"
              type="text"
              name="lastname"
              label="Last Name"
              placeholder="Enter last name"
              value={form.lastname}
              handleChange={handleInputChange}
              icon={<UserIcon />}
              iconPosition="left"
              height="sm"
            />
          </div>

          <div className="mb-5.5 grid grid-cols-1 gap-5.5 sm:grid-cols-2">
            <InputGroup
              className="w-full"
              type="text"
              name="username"
              label="User Name"
              placeholder="Enter user name"
              value={form.username}
              handleChange={handleInputChange}
              icon={<UserIcon />}
              iconPosition="left"
              height="sm"
            />

            <InputGroup
              className="w-full"
              type="email"
              name="email"
              label="Email Address"
              placeholder="Enter email address"
              value={form.email}
              handleChange={handleInputChange}
              icon={<EmailIcon />}
              iconPosition="left"
              height="sm"
            />
          </div>

          <div className="mb-5.5 grid grid-cols-1 gap-5.5 sm:grid-cols-2">
            <InputGroup
              className="w-full"
              type="text"
              name="mobileno"
              label="Mobile Number"
              placeholder="Enter mobile number"
              value={form.mobileno}
              handleChange={handleInputChange}
              icon={<CallIcon />}
              iconPosition="left"
              height="sm"
            />

            <InputGroup
              className="w-full"
              type="text"
              name="officeno"
              label="Telephone"
              placeholder="Enter office number"
              value={form.officeno}
              handleChange={handleInputChange}
              icon={<CallIcon />}
              iconPosition="left"
              height="sm"
            />
          </div>

          <div className="mb-5.5 grid grid-cols-1 gap-5.5 sm:grid-cols-2">
            <InputGroup
              className="w-full"
              type="text"
              name="companyname"
              label="Company Name"
              placeholder="Enter company name"
              value={form.companyname}
              handleChange={handleInputChange}
              icon={<PencilSquareIcon />}
              iconPosition="left"
              height="sm"
            />

            <InputGroup
              className="w-full"
              type="text"
              name="city"
              label="City"
              placeholder="Enter city"
              value={form.city}
              handleChange={handleInputChange}
              height="sm"
            />
          </div>

          <div className="mb-5.5 grid grid-cols-1 gap-5.5 sm:grid-cols-2">
            <InputGroup
              className="w-full"
              type="text"
              name="zipcode"
              label="Zip Code"
              placeholder="Enter zip code"
              value={form.zipcode}
              handleChange={handleInputChange}
              height="sm"
            />

            <div className="w-full">
              <Select
                label="State"
                items={stateOptions}
                value={form.state}
                onChange={(value) => setForm((prev) => ({ ...prev, state: value }))}
                placeholder="Select state"
              />
            </div>
          </div>

          <TextAreaGroup
            className="mb-5.5"
            label="Address"
            placeholder="Enter address"
            value={form.address}
            onChange={handleInputChange}
          />

          <TextAreaGroup
            className="mb-5.5"
            label="Standard Instruction"
            placeholder="Write standard instructions here"
            value={form.std_instr}
            onChange={handleInputChange}
          />

          <div className="flex justify-end gap-3">
            <button
              className="rounded-lg border border-stroke px-6 py-[7px] font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
              type="button"
              onClick={handleProfileCancel}
            >
              Cancel
            </button>

            <button
              className="rounded-lg bg-primary px-6 py-[7px] font-medium text-gray-2 hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={savingProfile}
            >
              {savingProfile ? "Saving..." : "Update"}
            </button>
          </div>
        </form>
      </ShowcaseSection>

      <ShowcaseSection title="Change Password" className="!p-7">
        <form onSubmit={handlePasswordSubmit}>
          <div className="mb-5.5 space-y-5.5">
            <InputGroup
              type="password"
              name="currentPassword"
              label="Existing Password"
              placeholder="Enter existing password"
              value={passwordForm.currentPassword}
              handleChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  currentPassword: e.target.value,
                }))
              }
              height="sm"
            />

            <InputGroup
              type="password"
              name="newPassword"
              label="New Password"
              placeholder="Enter new password"
              value={passwordForm.newPassword}
              handleChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  newPassword: e.target.value,
                }))
              }
              height="sm"
            />

            <InputGroup
              type="password"
              name="confirmPassword"
              label="Repeat Password"
              placeholder="Repeat new password"
              value={passwordForm.confirmPassword}
              handleChange={(e) =>
                setPasswordForm((prev) => ({
                  ...prev,
                  confirmPassword: e.target.value,
                }))
              }
              height="sm"
            />
          </div>

          <div className="flex justify-end gap-3">
            <button
              className="rounded-lg border border-stroke px-6 py-[7px] font-medium text-dark hover:shadow-1 dark:border-dark-3 dark:text-white"
              type="button"
              onClick={() => setPasswordForm(emptyPassword)}
            >
              Cancel
            </button>

            <button
              className="rounded-lg bg-primary px-6 py-[7px] font-medium text-gray-2 hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-70"
              type="submit"
              disabled={savingPassword}
            >
              {savingPassword ? "Updating..." : "Update"}
            </button>
          </div>
        </form>
      </ShowcaseSection>
    </div>
  );
}
