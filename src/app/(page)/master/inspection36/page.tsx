import { Metadata } from "next";
import Inspection36Form from "./InspectionForm";
import { Suspense } from "react";

export const metadata: Metadata = {
  title: "Inspection UAD 3.6 | BackBone",
  description: "Fill out the Inspection UAD 3.6 Form.",
};

const Inspection36Page = () => {
  return (
    <Suspense fallback={<div className="p-8 text-center text-dark-5">Loading form...</div>}>
      <Inspection36Form />
    </Suspense>
  );
};

export default Inspection36Page;
