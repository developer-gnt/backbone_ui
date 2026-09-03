"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axiosInstance from "@/lib/axiosInstance";
import {
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Save,
  Download,
  Printer,
  Mail,
  FileText,
  FileDown,
  LayoutTemplate,
  Eraser,
  Camera,
  Trash2
} from "lucide-react";

// ═══════════════════════════════════════
// FORM DATA DEFINITION
// ═══════════════════════════════════════
const STEPS = [
  // STEP 0: PROPERTY INFO
  {
    id: "id", num: "", title: "Property Info", where: "",
    fields: [
      { type: "text-row", cols: 2, fields: [{ id: "address", label: "Address" }, { id: "city", label: "City" }] },
      { type: "text-row", cols: 3, fields: [{ id: "stzip", label: "State/ZIP" }, { id: "date", label: "Inspection Date", inputType: "date" }, { id: "fileno", label: "File #" }] },
      { type: "text-row", cols: 2, fields: [{ id: "appraiser", label: "Appraiser" }, { id: "borrower", label: "Borrower" }] },
      { type: "text-row", cols: 2, fields: [{ id: "timein", label: "Time In", inputType: "time" }, { id: "timeout", label: "Time Out", inputType: "time" }] },
      { type: "radio", id: "reporttype", label: "Report Type", options: ["URAR", "Condo", "Multifamily", "Manufactured", "Exterior Only"] },
      { type: "radio", id: "occupant", label: "Occupant", options: ["Owner", "Tenant", "Vacant"] },
      { type: "radio", id: "dwelling_style", label: "Design / Style", options: ["Ranch", "Colonial", "Split Level", "Split Foyer", "Cape Cod", "Contemporary", "Bi-Level", "Tri-Level", "Townhouse", "Condo", "Other"] },
      { type: "radio", id: "structure", label: "Structure", options: ["Detached", "Attached", "Semi-Detached"] },
      { type: "text-row", cols: 3, fields: [{ id: "units", label: "Units" }, { id: "stories", label: "Stories" }, { id: "yearbuilt", label: "Year Built" }] },
      { type: "text-row", cols: 3, fields: [{ id: "age", label: "Age" }, { id: "effage", label: "Effective Age" }, { id: "rel", label: "Rem Econ Life" }] },
      { type: "yn", id: "pud", label: "PUD?" },
      { type: "text-row", cols: 3, fields: [{ id: "hoa", label: "HOA $" }, { id: "hoafreq", label: "HOA Frequency" }, { id: "condoproj", label: "Condo Project" }] },
    ]
  },
  // STEP 1: SITE & LOT
  {
    id: "s1", num: "1", title: "Site & Lot", where: "drive up + walk grounds",
    fields: [
      { type: "sub", label: "Street & Access" },
      { type: "radio", id: "streetsurface", label: "Street Surface", options: ["Asphalt", "Concrete", "Gravel", "Chip Seal", "Other"] },
      { type: "radio", id: "streetpub", label: "Street", options: ["Public", "Private"] },
      { type: "radio", id: "streetlights", label: "Street Lights", options: ["Wood Pole", "Aluminum Pole", "Electric", "None"] },
      { type: "yn", id: "alley", label: "Alley?" },
      { type: "radio", id: "driveway", label: "Driveway Surface", multi: true, options: ["Concrete", "Asphalt", "Gravel", "Dirt", "Other"] },
      { type: "sub", label: "Utilities" },
      { type: "radio", id: "electric", label: "Electric", options: ["Yes", "No"] },
      { type: "radio", id: "gas", label: "Gas", options: ["Natural", "Propane", "None"] },
      { type: "radio", id: "water", label: "Water", options: ["Public", "Private Well", "Rural Well", "Other"] },
      { type: "radio", id: "sewer", label: "Sewer", options: ["Public", "Septic", "Other"] },
      { type: "sub", label: "Lot" },
      { type: "radio", id: "lotsize", label: "Lot Size", options: ["Typical", "Smaller", "Larger"] },
      { type: "radio", id: "lotshape", label: "Lot Shape", options: ["Rectangular", "Irregular", "Corner", "Flag", "Other"] },
      { type: "radio", id: "drainage", label: "Drainage", options: ["Adequate", "Insufficient"] },
      { type: "sub", label: "Location" },
      { type: "radio", id: "locimpact", label: "Location Impact", options: ["Neutral", "Beneficial", "Adverse"] },
      { type: "radio", id: "loctype", label: "Location (circle all)", multi: true, options: ["Residential", "Busy Street", "Interior", "Cul-de-sac", "Corner", "Golf Course", "Park", "Lake", "Dead End", "Other"] },
      { type: "sub", label: "View" },
      { type: "radio", id: "viewimpact", label: "View Impact", options: ["Neutral", "Beneficial", "Adverse"] },
      { type: "radio", id: "viewtype", label: "View (circle all)", multi: true, options: ["Residential", "Busy Street", "Treed", "Golf Course", "Park", "Woods", "School", "Lake", "Commercial", "Power Lines", "Other"] },
      { type: "text", id: "viewnotes", label: "View notes" },
      { type: "yn", id: "sitedefects", label: "Any site defects?" },
      { type: "text", id: "sitedefect_desc", label: "Defect description" },
      { type: "photos", id: "p1", items: ["Street Scene", "Front of Property"] },
    ]
  },
  // STEP 2: EXTERIOR
  {
    id: "s2", num: "2", title: "Exterior", where: "walk all four sides",
    fields: [
      { type: "sub", label: "Materials" },
      { type: "radio", id: "extfront", label: "Ext Walls (front)", multi: true, options: ["Wood", "Vinyl", "Brick", "Stucco", "Stone", "Cement Board", "Composite", "Other"] },
      { type: "radio", id: "extside", label: "Ext Walls (sides)", multi: true, options: ["Same as Front", "Wood", "Vinyl", "Brick", "Stucco", "Stone", "Cement Board", "Other"] },
      { type: "radio", id: "roof", label: "Roof Material", multi: true, options: ["Asphalt Shingles", "Wood Shake", "Metal", "Tile", "Tar/Gravel", "Comp", "Other"] },
      { type: "radio", id: "gutters", label: "Gutters", multi: true, options: ["Aluminum", "Vinyl", "Galvanized", "Copper", "None"] },
      { type: "radio", id: "windows", label: "Windows", multi: true, options: ["Aluminum", "Vinyl", "Wood", "Other"] },
      { type: "yn", id: "stormwindows", label: "Storm windows?" },
      { type: "yn", id: "screens", label: "Window screens?" },
      { type: "radio", id: "fence", label: "Fence", multi: true, options: ["Metal", "Wood", "Wrought Iron", "Chain Link", "None", "Other"] },
      { type: "sub", label: "Outdoor Features" },
      { type: "radio", id: "patio", label: "Patio Material", multi: true, options: ["Concrete", "Brick", "Stone", "Pavers", "None", "Other"] },
      { type: "radio", id: "decksize", label: "Deck", options: ["Large", "Average", "Small", "None"] },
      { type: "radio", id: "deckmat", label: "Deck Material", multi: true, options: ["Wood", "Trex/Composite", "Vinyl", "None", "Other"] },
      { type: "yn", id: "coverporch", label: "Covered porch?" },
      { type: "radio", id: "porchloc", label: "  Porch Location", options: ["Front", "Rear", "Side", "Wrap"] },
      { type: "yn", id: "screenporch", label: "Screened porch?" },
      { type: "yn", id: "sunroom", label: "Sunroom?" },
      { type: "yn", id: "gazebo", label: "Gazebo?" },
      { type: "yn", id: "balcony", label: "Balcony?" },
      { type: "yn", id: "sprinklers", label: "Sprinkler system?" },
      { type: "radio", id: "pool", label: "Pool", multi: true, options: ["None", "In-Ground", "Above-Ground", "Hot Tub"] },
      { type: "sub", label: "Outbuildings + Garage" },
      { type: "yn", id: "shed", label: "Shed / outbuilding?" },
      { type: "text", id: "sheddesc", label: "  Size / description" },
      { type: "text-row", cols: 2, fields: [{ id: "garagecars", label: "Garage # cars" }, { id: "garagesize", label: "Garage size" }] },
      { type: "radio", id: "garagetype", label: "Garage Type", multi: true, options: ["Attached", "Detached", "Built-In", "Carport", "None"] },
      { type: "radio", id: "garageloc", label: "Garage Location", options: ["Front", "Side", "Rear", "Alley"] },
      { type: "radio", id: "parking", label: "Other Parking", multi: true, options: ["Driveway", "Open Lot", "Assigned", "None"] },
      { type: "sub", label: "Exterior Quality" },
      { type: "radio", id: "extquality", label: "Quality of Construction", options: ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"] },
      { type: "radio", id: "extcond", label: "Condition", options: ["C1", "C2", "C3", "C4", "C5", "C6"] },
      { type: "yn", id: "extdefects", label: "Any exterior defects?" },
      { type: "text", id: "extdefect_desc", label: "Defect description" },
      { type: "photos", id: "p2", items: ["Front", "Rear", "Left Side", "Right Side", "Garage", "Defects"] },
    ]
  },
  // STEP 3: INTERIOR
  {
    id: "s3", num: "3", title: "Interior", where: "walk every room",
    fields: [
      { type: "sub", label: "Room Count" },
      { type: "text-row", cols: 3, fields: [{ id: "totalrooms", label: "Total Rooms" }, { id: "bedrooms", label: "Bedrooms" }, { id: "fullbaths", label: "Full Baths" }] },
      { type: "text-row", cols: 2, fields: [{ id: "halfbaths", label: "Half Baths" }, { id: "laundry", label: "Laundry Location" }] },
      { type: "sub", label: "Finishes" },
      { type: "radio", id: "flooring", label: "Flooring (circle all)", multi: true, options: ["Hardwood", "Laminate", "Carpet", "Vinyl", "Tile", "LVP", "Engineered Wood", "Other"] },
      { type: "radio", id: "walls", label: "Walls", multi: true, options: ["Drywall", "Plaster", "Paneling", "Other"] },
      { type: "radio", id: "trim", label: "Trim", multi: true, options: ["Wood", "MDF", "Other"] },
      { type: "radio", id: "doors", label: "Doors", multi: true, options: ["Wood", "Paneled", "Hollow Core", "Other"] },
      { type: "sub", label: "Bath Detail" },
      { type: "radio", id: "bathfloor", label: "Bath Floor", multi: true, options: ["Vinyl", "Tile", "Carpet", "Hardwood", "LVP", "Other"] },
      { type: "radio", id: "bathwainscot", label: "Bath Wainscot", multi: true, options: ["Tile", "Fiberglass", "Cultured Marble", "Other"] },
      { type: "text", id: "bathnotes", label: "Bath notes (updates, condition)" },
      { type: "sub", label: "Kitchen" },
      { type: "radio", id: "appliances", label: "Appliances (circle all)", multi: true, options: ["Range/Oven", "Disposal", "Dishwasher", "Fan/Hood", "Microwave", "Washer/Dryer", "Refrigerator"] },
      { type: "radio", id: "counters", label: "Countertops", multi: true, options: ["Laminate", "Tile", "Granite", "Quartz", "Corian", "Butcher Block", "Other"] },
      { type: "radio", id: "backsplash", label: "Backsplash", multi: true, options: ["Tile", "Laminate", "Stone", "None", "Other"] },
      { type: "text", id: "kitchennotes", label: "Kitchen update notes" },
      { type: "sub", label: "Other Features" },
      { type: "yn", id: "fireplace", label: "Fireplace?" },
      { type: "text-row", cols: 2, fields: [{ id: "fpcount", label: "# Fireplaces" }, { id: "fptype", label: "Type" }] },
      { type: "yn", id: "woodstove", label: "Wood stove?" },
      { type: "yn", id: "alarm", label: "Alarm / security?" },
      { type: "yn", id: "intercom", label: "Intercom?" },
      { type: "yn", id: "centralvac", label: "Central vacuum?" },
      { type: "sub", label: "Heating + Cooling" },
      { type: "radio", id: "heating", label: "Heating", multi: true, options: ["Forced Warm Air", "Heat Pump", "Radiant", "Baseboard", "Wall", "Other"] },
      { type: "radio", id: "fuel", label: "Fuel", multi: true, options: ["Gas", "Electric", "Oil", "Propane", "Wood", "Solar", "Other"] },
      { type: "radio", id: "cooling", label: "Cooling", multi: true, options: ["Central AC", "Window AC", "Mini Split", "None"] },
      { type: "sub", label: "Attic" },
      { type: "yn", id: "attic", label: "Attic?" },
      { type: "radio", id: "atticfeat", label: "Attic Features (circle all)", multi: true, options: ["Fan", "Scuttle", "Floor", "Drop Stairs", "Finished", "Insulated"] },
      { type: "sub", label: "Interior Quality" },
      { type: "radio", id: "intquality", label: "Interior Quality", options: ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"] },
      { type: "radio", id: "intcond", label: "Interior Condition", options: ["C1", "C2", "C3", "C4", "C5", "C6"] },
      { type: "yn", id: "intdefects", label: "Any interior defects?" },
      { type: "text", id: "intdefect_desc", label: "Defect description" },
      { type: "photos", id: "p3", items: ["Kitchen", "All Baths", "All Bedrooms", "Living Room", "Dining", "Updates/Defects"] },
    ]
  },
  // STEP 4: BASEMENT
  {
    id: "s4", num: "4", title: "Basement / Below Grade", where: "go downstairs",
    fields: [
      { type: "radio", id: "basetype", label: "Type", multi: true, options: ["Full Basement", "Partial Basement", "Crawl Space", "Slab", "Other"] },
      { type: "radio", id: "baseentrance", label: "Outside Entrance", options: ["Walkout", "Daylight", "Bilco Door", "None"] },
      { type: "radio", id: "foundation", label: "Foundation Material", multi: true, options: ["Concrete", "Block", "Stone", "Brick", "Other"] },
      { type: "yn", id: "sumppump", label: "Sump pump?" },
      { type: "yn", id: "basefinished", label: "Basement finished?" },
      { type: "text-row", cols: 3, fields: [{ id: "basepct", label: "% Finished" }, { id: "basefinsf", label: "Finished SF" }, { id: "baseunfinsf", label: "Unfinished SF" }] },
      { type: "text", id: "baseceilht", label: "Ceiling height" },
      { type: "text", id: "baserooms", label: "Basement rooms / description" },
      { type: "text", id: "basecond", label: "Basement condition notes" },
      { type: "yn", id: "basedefects", label: "Any basement defects?" },
      { type: "text", id: "basedefect_desc", label: "Defect description" },
      { type: "photos", id: "p4", items: ["Basement Finished", "Basement Unfinished", "Mechanicals", "Defects"] },
    ]
  },
  // STEP 5: MEASUREMENTS + WRAP-UP
  {
    id: "s5", num: "5", title: "Measurements + Wrap-up", where: "verify your sketch",
    fields: [
      { type: "sub", label: "Area" },
      { type: "text-row", cols: 3, fields: [{ id: "gla", label: "GLA Above Grade SF" }, { id: "bgfinsf", label: "Below Grade Fin SF" }, { id: "totalrooms2", label: "Total Rooms" }] },
      { type: "textarea", id: "sketchnotes", label: "Sketch dimensions / measurement notes" },
      { type: "textarea", id: "comments", label: "General comments" },
      { type: "sub", label: "Before you leave — check each item" },
      {
        type: "checklist", id: "departure", items: [
          "All rooms counted (total, BR, BA)",
          "Kitchen appliances noted",
          "Heating + cooling type + fuel",
          "Foundation type noted",
          "Exterior wall material (front + sides)",
          "Roof material + condition",
          "Quality rating (Q1-Q6)",
          "Condition rating (C1-C6)",
          "Garage type + # cars",
          "All defects documented",
          "Flooring types noted",
          "Bath floor + wainscot",
          "Attic access + features",
          "Basement type + % finished",
          "Sump pump noted",
          "Pool / deck / patio / porch",
          "Fence type",
          "Lot size + shape + drainage",
          "All levels measured + SF matches sketch",
          "All required photos taken"
        ]
      },
      { type: "textarea", id: "team_notes", label: "Notes for Backbone desktop team" },
    ]
  },
];

const FIELD_MAP: Record<string, number> = {};
STEPS.forEach((step, index) => {
  const extractIds = (arr: any[]) => {
    arr.forEach(f => {
      if (f.id) FIELD_MAP[f.id] = index;
      if (f.fields) extractIds(f.fields);
      if (f.type === 'photos' || f.type === 'checklist') {
        f.items.forEach((item: string) => {
          const suffix = f.type === 'photos' ? item.replace(/\s+/g, '_') : item.replace(/[^\w]/g, '_');
          FIELD_MAP[`${f.id}_${suffix}`] = index;
        });
      }
    });
  };
  extractIds(step.fields);
});

const Inspection26Form = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [originalData, setOriginalData] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [saveStatus, setSaveStatus] = useState("");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [confirmModal, setConfirmModal] = useState<any>(null);

  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isEmailing, setIsEmailing] = useState(false);

  const handleEmailJson = async () => {
    try {
      setIsEmailing(true);
      setToast({ message: "Sending form data to BackBone Data Solution...", type: 'success' });

      await axiosInstance.post('/inspection26/email-form-as-pdf', formData);

      setToast({ message: "Form data sent to BackBone Data Solution successfully!", type: 'success' });
      setTimeout(() => setToast(null), 4000);
      setShowExportModal(false);
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to send form data.", type: 'error' });
      setTimeout(() => setToast(null), 3000);
    } finally {
      setIsEmailing(false);
    }
  };

  const searchParams = useSearchParams();
  const router = useRouter();
  const mode = searchParams.get('mode');
  const editId = searchParams.get('id');

  const fetchInspection = () => {
    axiosInstance.get(`/inspection26/${editId}`).then(res => {
      const flatData = { ...res.data };
      ["site", "exterior", "interior", "basement", "measurements", "other_data"].forEach(key => {
        if (flatData[key]) {
          Object.assign(flatData, flatData[key]);
          delete flatData[key];
        }
      });
      if (res.data.measurements?.departure) {
        if (typeof res.data.measurements.departure === 'object') {
          Object.assign(flatData, res.data.measurements.departure);
        }
      }
      setFormData(flatData);
      setOriginalData(flatData);
    }).catch(err => console.error("Error fetching record", err));
  };

  useEffect(() => {
    if (editId) {
      setIsViewMode(mode !== 'edit');
      fetchInspection();
    } else {
      const savedData = localStorage.getItem("ieimpact_uad26_inspect");
      const savedStep = localStorage.getItem("ieimpact_uad26_step");
      if (savedData) {
        try {
          setFormData(JSON.parse(savedData));
        } catch (e) { }
      }
      if (savedStep) setCurrentStep(parseInt(savedStep) || 0);
    }

    if (localStorage.getItem("ieimpact_uad26_template")) {
      setHasTemplate(true);
    }
  }, [editId]);

  useEffect(() => {
    if (Object.keys(formData).length === 0 && currentStep === 0) return;

    setSaveStatus("Saving...");
    const timeout = setTimeout(() => {
      localStorage.setItem("ieimpact_uad26_inspect", JSON.stringify(formData));
      localStorage.setItem("ieimpact_uad26_step", currentStep.toString());
      setSaveStatus("Saved to drafts ✓");
      setTimeout(() => setSaveStatus(""), 2000);
    }, 500);

    return () => clearTimeout(timeout);
  }, [formData, currentStep]);

  const isStepStarted = (index: number) => {
    return Object.keys(formData).some((key) => {
      if (FIELD_MAP[key] !== index) return false;
      const val = formData[key];
      if (Array.isArray(val)) return val.length > 0;
      return val !== "" && val !== false && val !== null && val !== undefined;
    });
  };

  const handleChange = (id: string, value: any) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleToggleMulti = (id: string, option: string) => {
    setFormData((prev) => {
      let current = prev[id];
      if (!Array.isArray(current)) {
        current = current ? [current] : [];
      }
      if (current.includes(option)) {
        return { ...prev, [id]: current.filter((x: string) => x !== option) };
      }
      return { ...prev, [id]: [...current, option] };
    });
  };


  const submitToBackend = async () => {
    const payload: Record<string, any> = { site: {}, exterior: {}, interior: {}, basement: {}, measurements: {}, other_data: {} };

    const departureObj: Record<string, boolean> = {};

    Object.keys(formData).forEach(key => {
      if (key.startsWith('departure_')) {
        if (formData[key]) departureObj[key] = true;
      } else if (key.endsWith('_other')) {
        payload.other_data[key] = formData[key];
      } else {
        const stepIndex = FIELD_MAP[key];
        if (stepIndex === 0) payload[key] = formData[key];
        else if (stepIndex === 1) payload.site[key] = formData[key];
        else if (stepIndex === 2) payload.exterior[key] = formData[key];
        else if (stepIndex === 3) payload.interior[key] = formData[key];
        else if (stepIndex === 4) payload.basement[key] = formData[key];
        else if (stepIndex === 5) payload.measurements[key] = formData[key];
        else payload[key] = formData[key];
      }
    });

    payload.measurements.departure = departureObj;

    try {
      setSubmitting(true);
      if (editId) {
        await axiosInstance.patch(`/inspection26/${editId}`, payload);
      } else {
        await axiosInstance.post("/inspection26", payload);
      }

      // Generate PDF server-side from formData and email it
      await axiosInstance.post('/inspection26/email-form-as-pdf', formData);

      setToast({ message: "Inspection submitted & PDF report emailed successfully!", type: 'success' });
      setTimeout(() => setToast(null), 4000);

      setFormData({});
      setCurrentStep(0);
      localStorage.removeItem("ieimpact_uad26_inspect");
      localStorage.removeItem("ieimpact_uad26_step");

      router.push('/master/inspections/records');
    } catch (error) {
      console.log("Error saving inspection form", error);
      setToast({ message: "Unable to save form. Please try again.", type: 'error' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setSubmitting(false);
    }
  };

  const renderField = (f: any, i: number) => {
    switch (f.type) {
      case "radio":
        return (
          <div key={i} className="mb-4">
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">{f.label}</label>
            <div className="flex flex-wrap gap-2">
              {f.options.map((opt: string) => {
                const isSelected = Array.isArray(formData[f.id]) ? formData[f.id].includes(opt) : formData[f.id] === opt;
                return (
                  <div
                    key={opt}
                    onClick={() => {
                      if (!isViewMode) {
                        handleToggleMulti(f.id, opt);
                      }
                    }}
                    className={`rounded-full border-[1.5px] px-4 py-2 text-sm font-medium transition ${isViewMode ? "cursor-default opacity-70" : "cursor-pointer hover:border-primary hover:bg-gray-2"
                      } ${isSelected
                        ? "border-primary bg-primary text-white"
                        : "border-stroke bg-white text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      }`}
                  >
                    {opt}
                  </div>
                );
              })}
            </div>
            {f.options.includes("Other") && Array.isArray(formData[f.id]) && formData[f.id].includes("Other") && (
              <input
                type="text"
                value={formData[`${f.id}_other`] || ""}
                disabled={isViewMode}
                onChange={(e) => handleChange(`${f.id}_other`, e.target.value)}
                placeholder="Please specify"
                className={`mt-3 w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-4 py-2 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary ${isViewMode ? "opacity-70 cursor-not-allowed bg-gray-50" : ""}`}
              />
            )}
          </div>
        );
      case "yn":
        return (
          <div key={i} className="mb-4">
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">{f.label}</label>
            <div className="flex gap-2">
              {["Yes", "No"].map((opt) => {
                const isSelected = formData[f.id] === opt;
                const isYes = opt === "Yes";
                return (
                  <div
                    key={opt}
                    onClick={() => {
                      if (!isViewMode) handleChange(f.id, isSelected ? "" : opt);
                    }}
                    className={`rounded-full border-[1.5px] px-6 py-2 text-sm font-bold transition ${isViewMode ? "cursor-default opacity-70" : "cursor-pointer hover:border-primary"
                      } ${isSelected
                        ? (isYes ? "border-green bg-green text-white" : "border-red bg-red text-white")
                        : "border-stroke bg-white text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      }`}
                  >
                    {opt}
                  </div>
                );
              })}
            </div>
          </div>
        );
      case "text":
        return (
          <div key={i} className="mb-4">
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">{f.label}</label>
            <input
              type={f.inputType || "text"}
              value={formData[f.id] || ""}
              disabled={isViewMode}
              onChange={(e) => handleChange(f.id, e.target.value)}
              placeholder={f.label}
              className={`w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-4 py-2 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary ${isViewMode ? "opacity-70 cursor-not-allowed bg-gray-50" : ""}`}
            />
          </div>
        );
      case "textarea":
        return (
          <div key={i} className="mb-4">
            <label className="mb-2 block text-sm font-medium text-dark dark:text-white">{f.label}</label>
            <textarea
              value={formData[f.id] || ""}
              disabled={isViewMode}
              onChange={(e) => handleChange(f.id, e.target.value)}
              placeholder={f.label}
              rows={3}
              className={`w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-4 py-2 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary ${isViewMode ? "opacity-70 cursor-not-allowed bg-gray-50" : ""}`}
            />
          </div>
        );
      case "text-row":
        return (
          <div key={i} className={`mb-4 grid gap-4 grid-cols-1 md:grid-cols-${f.cols}`}>
            {f.fields.map((tf: any) => (
              <div key={tf.id}>
                <label className="mb-2 block text-sm font-medium text-dark dark:text-white">{tf.label}</label>
                <input
                  type={tf.inputType || "text"}
                  value={formData[tf.id] || ""}
                  disabled={isViewMode}
                  onChange={(e) => handleChange(tf.id, e.target.value)}
                  placeholder={tf.label}
                  className={`w-full rounded-lg border-[1.5px] border-stroke bg-transparent px-4 py-2 text-dark outline-none transition focus:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:focus:border-primary ${isViewMode ? "opacity-70 cursor-not-allowed bg-gray-50" : ""}`}
                />
              </div>
            ))}
          </div>
        );
      case "sub":
        return (
          <div key={i} className="col-span-full mb-5 mt-10">
            <h3 className="flex items-center gap-3 pb-3 text-lg font-semibold text-primary border-b border-primary/20">
              <div className="w-1.5 h-6 bg-primary rounded-full"></div>
              {f.label}
            </h3>
          </div>
        );
      case "photos":
        return (
          <div key={i} className="mb-4">
            <label className="mb-2 flex items-center gap-2 text-sm font-medium text-primary"><Camera className="w-4 h-4" /> Photos</label>
            <div className="flex flex-wrap gap-2">
              {f.items.map((item: string) => {
                const key = `${f.id}_${item.replace(/\s+/g, '_')}`;
                const isSelected = !!formData[key];
                return (
                  <div
                    key={item}
                    onClick={() => handleChange(key, !isSelected)}
                    className={`flex cursor-pointer items-center gap-2 rounded-lg border-[1.5px] px-3 py-2 text-xs font-medium transition ${isSelected
                        ? "border-green bg-green/10 text-green"
                        : "border-stroke bg-white text-dark hover:border-green dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      }`}
                  >
                    <div className={`flex h-4 w-4 items-center justify-center rounded-sm border ${isSelected ? "border-green bg-green text-white" : "border-stroke dark:border-dark-3"}`}>
                      {isSelected && "✓"}
                    </div>
                    {item}
                  </div>
                );
              })}
            </div>
          </div>
        );
      case "checklist":
        return (
          <div key={i} className="mb-4">
            <div className="flex flex-wrap gap-2">
              {f.items.map((item: string) => {
                const key = `${f.id}_${item.replace(/[^\w]/g, '_')}`;
                const isSelected = !!formData[key];
                return (
                  <div
                    key={item}
                    onClick={() => handleChange(key, !isSelected)}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border-[1.5px] px-4 py-2 text-sm transition ${isSelected
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-stroke bg-white text-dark hover:border-primary dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                      }`}
                  >
                    <div className={`flex h-4 w-4 items-center justify-center rounded-sm border ${isSelected ? "border-primary bg-primary text-white" : "border-stroke dark:border-dark-3"}`}>
                      {isSelected && "✓"}
                    </div>
                    {item}
                  </div>
                );
              })}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="relative rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5 print:border-none print:p-0 print:shadow-none">

      {/* Nice Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[999] flex items-center gap-3 rounded-lg px-6 py-4 shadow-xl transition-all animate-in slide-in-from-top-5 ${toast.type === 'success' ? 'bg-green text-white shadow-green/20' : 'bg-red text-white shadow-red/20'}`}>
          <CheckCircle2 className="w-5 h-5" />
          <p className="font-semibold">{toast.message}</p>
        </div>
      )}

      <div className="mb-6 flex justify-between items-center print:hidden">
        <div>
          <p className="text-sm text-dark-5">Overview</p>
          <h2 className="text-xl font-semibold text-dark dark:text-white">
            {editId ? "Edit" : "Master"} <span className="font-normal">Inspection UAD 2.6</span>
          </h2>
        </div>
        <div className="flex items-center gap-3 print:hidden">
          {saveStatus && (
            <span className="flex items-center gap-1.5 text-sm font-medium text-green bg-green/10 px-3 py-1.5 rounded-full">
              <CheckCircle2 className="w-4 h-4" />
              {saveStatus}
            </span>
          )}

          {isViewMode ? (
            <>
              <button
                onClick={() => router.push("/master/inspections/records")}
                className="flex items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark hover:bg-gray-50 transition-all dark:border-dark-3 dark:bg-dark-2 dark:text-white"
              >
                Back
              </button>
              <button
                onClick={() => setIsViewMode(false)}
                className="flex items-center gap-2 rounded-lg border border-transparent bg-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-primary/90 hover:shadow-md transition-all dark:border-dark-3"
              >
                Edit Inspection
              </button>
            </>
          ) : (
            <>
              {editId && (
                <button
                  onClick={() => {
                    const hasChanges = JSON.stringify(formData) !== JSON.stringify(originalData);
                    if (hasChanges) {
                      setConfirmModal({
                        title: "Discard Changes?",
                        message: "You have unsaved changes. Are you sure you want to discard them?",
                        onConfirm: () => {
                          setIsViewMode(true);
                          fetchInspection();
                          router.push(`/master/inspection26?id=${editId}&mode=view`);
                        }
                      });
                    } else {
                      setIsViewMode(true);
                      router.push(`/master/inspection26?id=${editId}&mode=view`);
                    }
                  }}
                  className="flex items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark hover:bg-gray-50 transition-all dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={() => setShowTemplateModal(true)}
                className="flex items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-dark hover:bg-gray-50 hover:shadow-sm dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3 transition-all"
              >
                <LayoutTemplate className="w-4 h-4 text-primary" />
                Templates
              </button>
              <button
                onClick={() => {
                  setConfirmModal({
                    title: 'Clear Data',
                    message: 'Clear all data? This cannot be undone.',
                    onConfirm: () => {
                      setFormData({});
                      setCurrentStep(0);
                      localStorage.removeItem("ieimpact_uad26_inspect");
                      localStorage.removeItem("ieimpact_uad26_step");
                    }
                  });
                }}
                className="flex items-center gap-2 rounded-lg border border-stroke bg-white px-4 py-2 text-sm font-medium text-red hover:bg-red/5 hover:border-red/20 transition-all dark:border-dark-3 dark:bg-dark-2"
              >
                <Eraser className="w-4 h-4" />
                Clear
              </button>
            </>
          )}

          <button
            onClick={() => setShowExportModal(true)}
            className="flex items-center gap-2 rounded-lg border border-transparent bg-[#e67e22] px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#e67e22]/90 hover:shadow-md transition-all dark:border-dark-3"
          >
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
      </div>

      <div className="mb-8 overflow-x-auto print:hidden">
        <div className="flex gap-2 min-w-max pb-2">
          {STEPS.map((s, index) => {
            const started = isStepStarted(index);
            const active = currentStep === index;

            let btnClass = "border-stroke bg-white text-dark hover:shadow-md dark:border-dark-3 dark:bg-dark-2 dark:text-white transition-all duration-200 ease-in-out";
            if (active) {
              btnClass = "border-primary bg-primary text-white shadow-lg shadow-primary/30 transform scale-105";
            } else if (started) {
              btnClass = "border-green bg-green text-white shadow-md shadow-green/20";
            }

            return (
              <button
                key={index}
                onClick={() => {
                  setCurrentStep(index);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${btnClass}`}
              >
                {started && !active ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <span className={`flex h-5 w-5 items-center justify-center rounded-full text-xs ${active ? 'bg-white text-primary' : 'bg-gray-100 text-dark-4 dark:bg-dark-3 dark:text-white'}`}>
                    {s.num || "•"}
                  </span>
                )}
                {s.title || "Property"}
              </button>
            );
          })}
        </div>
      </div>

      {/* SCREEN VIEW (Single Step) */}
      <div className="min-h-[500px] print:hidden">
        <h2 className="mb-6 text-2xl font-bold text-dark dark:text-white">
          {STEPS[currentStep].num ? `Step ${STEPS[currentStep].num}: ` : ""}
          {STEPS[currentStep].title}
        </h2>
        {STEPS[currentStep].fields.map((f, i) => renderField(f, i))}

        <div className="mt-10 flex justify-between border-t border-stroke pt-6 dark:border-dark-3 print:hidden">
          <button
            type="button"
            disabled={currentStep === 0}
            onClick={() => {
              setCurrentStep((p) => p - 1);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="flex items-center gap-2 rounded-lg border border-stroke bg-white px-6 py-2.5 text-sm font-semibold text-dark shadow-sm transition-all hover:bg-gray-50 disabled:opacity-40 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
          >
            <ChevronLeft className="w-4 h-4" />
            Previous Step
          </button>

          {currentStep === STEPS.length - 1 ? (
            <div className="print:hidden">
              {!isViewMode && (
                <button
                  type="button"
                  onClick={submitToBackend}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-lg bg-green px-8 py-2.5 text-sm font-semibold text-white shadow-md shadow-green/20 transition-all hover:bg-green/90 hover:-translate-y-0.5 disabled:transform-none disabled:opacity-60"
                >
                  <Save className="w-4 h-4" />
                  {submitting ? (editId ? "Updating..." : "Submitting...") : (editId ? "Update Inspection" : "Submit")}
                </button>
              )}
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setCurrentStep((p) => p + 1);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="flex items-center gap-2 rounded-lg bg-primary px-8 py-2.5 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:bg-primary/90 hover:-translate-y-0.5"
            >
              Next Step
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* PRINT VIEW (All Steps Linearly) */}
      <div id="inspection-form-pdf" className="hidden print:block text-black bg-white">
        <div className="mb-6 text-center text-2xl font-bold">UAD 2.6 Field Inspection</div>
        {STEPS.map((step, sIdx) => (
          <div key={sIdx} className="mb-10">
            {step.title && (
              <h2 className="mb-4 text-xl font-bold border-b-2 border-black pb-2 text-black">
                {step.num ? `Step ${step.num}: ` : ""}{step.title}
              </h2>
            )}
            <form>
              {step.fields.map((field, index) => renderField(field, index))}
            </form>
          </div>
        ))}
      </div>

      {/* Template Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2 dark:bg-gray-dark sm:p-8">
            <h3 className="mb-2 text-xl font-bold text-[#091b35] dark:text-white">Templates</h3>
            <p className="mb-4 text-sm text-dark-5">
              Save your common selections as a template. Load it on your next inspection to pre-fill fields.
            </p>
            <p className="mb-6 text-center text-xs text-dark-5">
              Templates are saved on this device only.
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  localStorage.setItem("ieimpact_uad26_template", JSON.stringify(formData));
                  setHasTemplate(true);
                  setShowTemplateModal(false);
                }}
                className="flex items-center justify-center gap-3 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 dark:bg-primary"
              >
                <Save className="w-5 h-5" />
                Save Current as Template
              </button>

              {hasTemplate && (
                <>
                  <button
                    onClick={() => {
                      setConfirmModal({
                        title: 'Load Template',
                        message: 'This will overwrite your current form data. Proceed?',
                        onConfirm: () => {
                          const tpl = localStorage.getItem("ieimpact_uad26_template");
                          if (tpl) {
                            try {
                              setFormData(JSON.parse(tpl));
                            }
                            catch (e) { }
                          }
                          setShowTemplateModal(false);
                        }
                      });
                    }}
                    className="flex items-center justify-center gap-3 rounded-xl border border-stroke bg-white px-4 py-3.5 text-sm font-semibold text-dark shadow-sm transition hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
                  >
                    <Download className="w-5 h-5 text-primary" />
                    Load Template
                  </button>
                  <button
                    onClick={() => {
                      setConfirmModal({
                        title: 'Delete Template',
                        message: 'Delete saved template?',
                        onConfirm: () => {
                          localStorage.removeItem("ieimpact_uad26_template");
                          setHasTemplate(false);
                        }
                      });
                    }}
                    className="flex items-center justify-center gap-3 rounded-xl border border-stroke bg-white px-4 py-3.5 text-sm font-semibold text-red shadow-sm transition hover:bg-red/5 hover:border-red/20 dark:border-dark-3 dark:bg-gray-dark dark:hover:bg-dark-3"
                  >
                    <Trash2 className="w-5 h-5" />
                    Delete Saved Template
                  </button>
                </>
              )}
            </div>

            <p className="my-4 text-center text-sm text-dark-5">
              {hasTemplate ? "You have a saved template." : "No template saved yet."}
            </p>

            <button
              onClick={() => setShowTemplateModal(false)}
              className="mt-2 block w-full text-center text-sm font-medium text-dark-5 hover:text-dark dark:hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2 dark:bg-gray-dark sm:p-8">
            <h3 className="mb-2 text-xl font-bold text-[#091b35] dark:text-white">Export Inspection</h3>
            <p className="mb-6 text-sm text-dark-5">
              Your data is saved locally on this device. Choose how to export:
            </p>

            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  setShowExportModal(false);
                  setTimeout(() => window.print(), 100);
                }}
                className="flex items-center justify-center gap-3 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-sm transition hover:bg-primary/90 dark:bg-primary"
              >
                <Printer className="w-5 h-5" />
                Print / Save as PDF
              </button>

              <button
                onClick={handleEmailJson}
                disabled={isEmailing}
                className="flex items-center justify-center gap-3 rounded-xl border border-stroke bg-white px-4 py-3.5 text-sm font-semibold text-dark shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
              >
                <Mail className="w-5 h-5 text-blue-500" />
                {isEmailing ? "Sending Data..." : "Email to Backbone Team"}
              </button>

              <button
                onClick={async () => {
                  try {
                    const res = await axiosInstance.post('/inspection26/generate-pdf', {}, { responseType: 'blob' });
                    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'blank_inspection_26.pdf';
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(url);
                    setShowExportModal(false);
                  } catch (err) {
                    console.error("Failed to download blank PDF", err);
                  }
                }}
                className="flex items-center justify-center gap-3 rounded-xl border border-stroke bg-white px-4 py-3.5 text-sm font-semibold text-dark shadow-sm transition hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
              >
                <FileText className="w-5 h-5 text-gray-500" />
                Download Blank PDF
              </button>

              <button
                onClick={() => {
                  const blob = new Blob([JSON.stringify(formData, null, 2)], { type: "application/json" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "inspection_data.json";
                  document.body.appendChild(a);
                  a.click();
                  document.body.removeChild(a);
                  URL.revokeObjectURL(url);
                  setShowExportModal(false);
                }}
                className="flex items-center justify-center gap-3 rounded-xl border border-stroke bg-white px-4 py-3.5 text-sm font-semibold text-dark shadow-sm transition hover:bg-gray-50 dark:border-dark-3 dark:bg-dark-2 dark:text-white dark:hover:bg-dark-3"
              >
                <FileDown className="w-5 h-5 text-green-600" />
                Download Data (JSON)
              </button>
            </div>

            <button
              onClick={() => setShowExportModal(false)}
              className="mt-4 block w-full text-center text-sm font-medium text-dark-5 hover:text-dark dark:hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {confirmModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl dark:bg-gray-dark">
            <h3 className="mb-2 text-xl font-bold text-dark dark:text-white">{confirmModal.title}</h3>
            <p className="mb-6 text-dark-5">{confirmModal.message}</p>
            <div className="flex justify-end gap-3">
              <button onClick={() => setConfirmModal(null)} className="rounded-lg border border-stroke px-4 py-2 font-medium hover:bg-gray-50 dark:border-dark-3 dark:hover:bg-dark-3">Cancel</button>
              <button onClick={() => { confirmModal.onConfirm(); setConfirmModal(null); }} className="rounded-lg bg-primary px-4 py-2 font-medium text-white hover:bg-primary/90">OK</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inspection26Form;
