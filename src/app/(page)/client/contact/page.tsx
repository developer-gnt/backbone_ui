"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/components/Auth/AuthProvider";
import axiosInstance, { getApiErrorMessage } from "@/lib/axiosInstance";

type ContactFormState = {
  name: string;
  email: string;
  subject: string;
  message: string;
};

export default function ClientContactPage() {
  const { user } = useAuth();
  const [form, setForm] = useState<ContactFormState>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  const defaultName = useMemo(() => {
    const fullName = `${user?.firstname ?? ""} ${user?.lastname ?? ""}`.trim();
    return fullName || user?.username || "";
  }, [user?.firstname, user?.lastname, user?.username]);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      name: prev.name || defaultName,
      email: prev.email || user?.email || "",
    }));
  }, [defaultName, user?.email]);

  const updateField = (key: keyof ContactFormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setFeedback(null);

    try {
      const response = await axiosInstance.post("/notification/contact", {
        name: form.name.trim(),
        email: form.email.trim(),
        subject: form.subject.trim(),
        message: form.message.trim(),
      });

      setForm((prev) => ({ ...prev, subject: "", message: "" }));
      setFeedback({
        type: "success",
        text: response.data?.message || "Your message is sent",
      });
    } catch (error) {
      setFeedback({
        type: "error",
        text: getApiErrorMessage(error, "Unable to send your message."),
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <div className="mb-6">
        <p className="text-sm font-medium text-primary">Overview</p>
        <h1 className="text-2xl font-semibold text-dark dark:text-white">Contact Us</h1>
      </div>

      <div className="grid gap-6 xl:grid-cols-[320px_320px_1fr]">
        <div>
          <h4 className="mb-4 text-lg font-semibold text-dark dark:text-white">
            Feel free to Contact Us
          </h4>

          {feedback && (
            <div
              className={`mb-4 rounded-lg border px-4 py-3 text-sm ${
                feedback.type === "success"
                  ? "border-green-200 bg-green-50 text-green-700 dark:border-green-dark/40 dark:bg-green-dark/10 dark:text-green-light-4"
                  : "border-red-200 bg-red-50 text-red-700 dark:border-red-dark/40 dark:bg-red-dark/10 dark:text-red-light-4"
              }`}
            >
              {feedback.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3">
            <input
              value={form.name}
              onChange={(event) => updateField("name", event.target.value)}
              placeholder="Enter Your Name"
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              required
            />
            <input
              value={form.email}
              onChange={(event) => updateField("email", event.target.value)}
              placeholder="Enter Your Email"
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              required
            />
            <input
              value={form.subject}
              onChange={(event) => updateField("subject", event.target.value)}
              placeholder="Enter Subject"
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              required
            />
            <textarea
              value={form.message}
              onChange={(event) => updateField("message", event.target.value)}
              placeholder="Enter Message"
              rows={8}
              className="w-full rounded-lg border border-stroke bg-transparent px-4 py-3 outline-none focus:border-primary dark:border-dark-3 dark:text-white"
              required
            />
            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

        <div>
          <h4 className="mb-4 text-lg font-semibold text-dark dark:text-white">Our Address</h4>
          <div className="space-y-4 text-sm text-dark-5">
            <div>
              <div className="font-medium text-dark dark:text-white">Backbone Data Solutions</div>
              <p>
                2033 San Elijo Ave
                <br />#138 Cardiff by the Sea,
                <br />CA 92007
              </p>
            </div>
            <div>
              <div className="font-medium text-dark dark:text-white">Email</div>
              <p>backboneappraisal2021@gmail.com</p>
            </div>
            <div>
              <div className="font-medium text-dark dark:text-white">Phone</div>
              <p>+1 (561) 600-4443 (Office)</p>
            </div>
          </div>
        </div>

        <div>
          <h4 className="mb-4 text-lg font-semibold text-dark dark:text-white">Find Us On Map</h4>
          <iframe
            title="Backbone Data Solutions map"
            className="min-h-[320px] w-full rounded-lg border-0"
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3345.3015995759183!2d-117.28440248481171!3d33.0221837808987!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x80dc0c1d07c2717b%3A0x3659fc406ad31a4!2sBack%20Bone%20Appraisal!5e0!3m2!1sen!2s!4v1500631242312"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </div>
  );
}
