"use client";

import { useState } from "react";

const FAQ_ITEMS = [
  {
    question: "What is your turn around time?",
    answer:
      "We have 2 teams: 1 based in the U.S. and 1 based in Mumbai, India. These teams help us provide superior service to our clients 24 hours a day, 7 days a week.",
  },
  {
    question: "Can I cut my operational time & cost by using Backbone Data Solutions?",
    answer:
      "Yes, we estimate we can save an appraiser around 1.5 hours per report, leaving more time for inspections and your family.",
  },
  {
    question: "Do you offer a free trial?",
    answer: "Yes, your first 3 orders (30 credits) are absolutely FREE.",
  },
  {
    question: "What types of appraisal forms do you input?",
    answer:
      "We can type Single Family, Condo, Multi Family, and drive-by appraisal reports.",
  },
  {
    question: "What types of appraisal software do you work with?",
    answer:
      "We currently offer appraisal reports for ACI Report (ACI), WinTotal (a la mode), and ClickFORMS / Bradford.",
  },
  {
    question: "What percentage of the report do you fill in?",
    answer:
      "We fill in any data you send us. Generally 95% of the report will be completed. We do not fill in valuation information.",
  },
  {
    question: "What data do I need to provide you?",
    answer:
      "You should provide all subject data, comps, public records, MLS data, inspection details, sketches, contract details, and any template file needed for the report.",
  },
  {
    question: "How will I send you the data?",
    answer:
      "You can upload files while placing a new order, send PDF exports, provide MLS links, or supply access details that help us pull the information.",
  },
  {
    question: "Should I send a template for each order?",
    answer:
      "Yes. Please make sure the report template contains the forms you want completed for that specific order.",
  },
  {
    question: "Which sketching software do you use?",
    answer:
      "We use ACI Sketch, Area Sketch, TOTAL Sketch, and Apex V5.0. Please include your software version in standard instructions.",
  },
];

export default function ClientFaqPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark">
      <div className="mb-6">
        <p className="text-sm font-medium text-primary">Overview</p>
        <h1 className="text-2xl font-semibold text-dark dark:text-white">
          Frequently Asked Questions
        </h1>
      </div>

      <div className="space-y-3">
        {FAQ_ITEMS.map((item, index) => {
          const open = openIndex === index;

          return (
            <div key={item.question} className="rounded-lg border border-stroke dark:border-dark-3">
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : index)}
                className="flex w-full items-center justify-between gap-4 rounded-lg px-4 py-3 text-left text-sm font-semibold text-dark dark:text-white"
              >
                <span>★ {item.question}</span>
                <span className="text-primary">{open ? "−" : "+"}</span>
              </button>
              {open && (
                <div className="border-t border-stroke px-4 py-4 text-sm text-dark-5 dark:border-dark-3">
                  {item.answer}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
