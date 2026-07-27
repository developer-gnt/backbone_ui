import { Metadata } from "next";
import Inspection26Form from "./InspectionForm";

export const metadata: Metadata = {
  title: "Inspection UAD 2.6 | BackBone",
  description: "Fill out the Inspection UAD 2.6 Form.",
};

import { Suspense } from "react";

const Inspection26Page = () => {
  return (
    <Suspense fallback={<div className="p-8 text-center text-dark-5">Loading form...</div>}>
      <Inspection26Form />
    </Suspense>
  );
};

export default Inspection26Page;
