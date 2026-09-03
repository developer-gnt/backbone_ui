"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import axiosInstance from "@/lib/axiosInstance";

const STEPS = [
  { id: "general", label: "Property", short: "• Property" },
  { id: "arrive", label: "Arrive", short: "1 Arrive" },
  { id: "curb", label: "Stand", short: "2 Stand" },
  { id: "exterior", label: "Walk", short: "3 Walk" },
  { id: "yard", label: "Yard", short: "4 Yard" },
  { id: "outbuildings", label: "Outbuildings", short: "5 Outbuildings" },
  { id: "mainlevel", label: "Enter", short: "6 Enter" },
  { id: "upperlevel", label: "Upper", short: "7 Upper" },
  { id: "belowgrade", label: "Below", short: "8 Below" },
  { id: "adu", label: "ADU", short: "9 &#9733;" },
  { id: "final", label: "Final", short: "10 Final" }
];

const FIELD_MAP: Record<string, string[]> = {
  arrive: ["access", "streettype", "streetsurface", "pvtmaint", "typaccess", "p_Street_Scene"],
  curb: ["primview", "viewrange", "viewimpact", "otherview", "influences", "frontdoor", "p_Front_of_Property"],
  exterior: ["extwalls", "fndtype", "fndmat", "roofmat", "cond_walls", "cond_fnd", "cond_roof", "cond_win", "fndaccess", "roofage", "roofobs", "converted", "convfinish", "noncontig", "attic", "atticdet", "mitigation", "renewable", "renewtype", "renewown", "extdefects", "extdef1", "extdef2", "p_Rear", "p_Left_Side", "p_Right_Side", "p_Foundation", "p_Roof", "p_Solar_Energy", "p_Mitigation", "p_Ext_Defects"],
  yard: ["topo", "drainage", "util_elec", "util_gas", "util_water", "util_sewer", "broadband", "primres", "respct", "nonres", "nonresmod", "restrict", "easement", "encroach", "amen_out", "amen_living", "amen_water", "amen1_name", "amen1_ct", "amen1_sf", "amen1_mat", "amen2_name", "amen2_ct", "amen2_sf", "amen2_mat", "sitedefects", "sitedef1", "p_Yard", "p_Pool_Spa", "p_Deck_Patio", "p_Waterfront", "p_Non_Res_Use", "p_Site_Defects"],
  outbuildings: ["veh_type", "veh_attach", "veh_spaces", "veh_sf", "veh_surface", "ob1_type", "ob1_gba", "ob1_fin", "ob1_unfin", "ob1_rooms", "ob1_utils", "ob1_heat", "ob2_type", "ob2_gba", "ob2_fin", "ob2_heat", "p_Garage_Carport", "p_Outbuilding_Ext", "p_Outbuilding_Int", "p_Defects"],
  mainlevel: ["occupancy", "levels", "br", "fullba", "halfba", "intqual", "intcond", "k1_level", "k1_update", "k1_time", "k1_cond", "k2_level", "k2_update", "floor_types", "floor_update", "floor_cond", "ceil_ht", "ceil_style", "wallceil_cond", "wholehome", "accessibility", "p_Kitchen_s_", "p_Living_Family", "p_Dining", "p_Main_Level_Rooms"],
  upperlevel: ["bath1_loc", "bath1_type", "bath1_update", "bath1_cond", "bath2_loc", "bath2_type", "bath2_update", "bath2_cond", "bath3_loc", "bath3_type", "bath3_update", "bath3_cond", "bath4_loc", "bath4_type", "bath4_update", "bath4_cond", "br1_level", "br2_level", "br3_level", "br4_level", "br5_level", "br6_level", "up1_ceilht", "up1_floor", "up1_finsf", "up1_unfinsf", "up1_rooms", "p_All_Bedrooms", "p_All_Baths", "p_Upper_Rooms", "p_Updates_Renovations"],
  belowgrade: ["bg_finsf", "bg_finnonstd", "bg_unfinsf", "bg_finish", "bg_grade", "bg_access", "bg_extaccess", "bg_ceilht", "bg_rooms", "heat_sys", "heat_fuel", "cooling", "furnace_bg", "other_mech", "bg_defects", "bgdef1", "p_BG_Finished", "p_BG_Unfinished", "p_Mechanicals", "p_BG_Defects"],
  adu: ["adu_present", "adu_loc", "adu_access", "adu_rentable", "adu_typical", "adu_address", "adu_br", "adu_fullba", "adu_halfba", "adu_finsf", "adu_unfinsf", "adu_kitchen", "adu_bath", "p_ADU_Exterior", "p_ADU_Interior", "p_ADU_Kitchen", "p_ADU_Bath"],
  final: [
    "ext_qual", "ext_cond", "ovr_qual", "ovr_cond", "fin_ag_std", "fin_ag_nonstd", "unfin_ag", "gba_total", "measstd", "func_issues", "sketch_notes", "team_notes",
    "c___Front_door_height_above_grade", "c___Roof_age_estimate", "c___Converted_areas", "c___Kitchen_update_timeframe_condition__EACH_", "c___Each_bathroom__type___update___condition", "c___Each_bedroom__level___ceiling_ht___flooring", "c___Flooring_types___update", "c___Ceiling_height_per_level", "c___Per_component_condition", "c___View___range___impact", "c___Non_residential_use", "c___Amenity_counts___areas", "c___Disaster_mitigation", "c___Renewable_energy", "c___Broadband_internet", "c___ADU_details__if_present_", "c___Outbuilding_GBA___utilities", "c___Furnace_location__BG__", "c_All_levels_measured", "c_All_photos_taken", "c_All_defects_documented", "c_BR_BA_counts_confirmed"
  ],
};

export default function Inspection36Form() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const mode = searchParams.get('mode');
  const inspectionId = searchParams?.get("id");

  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [originalData, setOriginalData] = useState<any>({});
  const [saveStatus, setSaveStatus] = useState("");
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [hasTemplate, setHasTemplate] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [isEmailing, setIsEmailing] = useState(false);

  const handleEmailJson = async () => {
    try {
      setIsEmailing(true);
      setToast({ message: "Sending form data to BackBone Data Solution...", type: 'success' });

      await axiosInstance.post('/inspection36/email-form-as-pdf', formData);

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

  const [isViewMode, setIsViewMode] = useState(inspectionId ? mode !== 'edit' : false);
  const [confirmModal, setConfirmModal] = useState<any>(null);

  useEffect(() => {
    if (inspectionId) {
      fetchInspection();
    } else {
      const savedData = localStorage.getItem("ieimpact_uad36_inspect");
      const savedStep = localStorage.getItem("ieimpact_uad36_step");
      if (savedData) {
        try {
          setFormData(JSON.parse(savedData));
        } catch (e) { }
      }
      if (savedStep) setCurrentStep(parseInt(savedStep) || 0);
    }
    if (localStorage.getItem("ieimpact_uad36_template")) {
      setHasTemplate(true);
    }
  }, [inspectionId]);

  useEffect(() => {
    if (Object.keys(formData).length === 0 && currentStep === 0) return;

    setSaveStatus("Saving...");
    const timeout = setTimeout(() => {
      localStorage.setItem("ieimpact_uad36_inspect", JSON.stringify(formData));
      localStorage.setItem("ieimpact_uad36_step", currentStep.toString());
      setSaveStatus("Saved to drafts &#x2713;");
      setTimeout(() => setSaveStatus(""), 2000);
    }, 500);

    return () => clearTimeout(timeout);
  }, [formData, currentStep]);

  const fetchInspection = async () => {
    try {
      setLoading(true);
      const { data } = await axiosInstance.get(`/inspection36/${inspectionId}`);
      // Flatten the data for the form state
      let flatData: any = { ...data };

      Object.keys(FIELD_MAP).forEach((section) => {
        if (data[section]) {
          Object.keys(data[section]).forEach((key) => {
            flatData[key] = data[section][key];
          });
        }
      });
      if (data.other_data) {
        Object.keys(data.other_data).forEach((key) => {
          flatData[key] = data.other_data[key];
        });
      }
      setFormData(flatData);
      setOriginalData(flatData);
    } catch (error) {
      console.error("Failed to load inspection", error);
      alert("Failed to load inspection record.");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target as HTMLInputElement;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value,
    }));
  };

  const handleDropdownChange = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  const restructureDataForSave = () => {
    const payload: any = { ...formData };

    // Group fields into their respective nested objects
    Object.keys(FIELD_MAP).forEach((section) => {
      payload[section] = payload[section] || {};
      FIELD_MAP[section].forEach((field) => {
        if (payload[field] !== undefined) {
          payload[section][field] = payload[field];
          delete payload[field]; // Remove from root level
        }
      });
    });

    // Sweep any remaining checklist checkboxes (c_...) into final
    Object.keys(payload).forEach((key) => {
      if (key.startsWith('c_')) {
        payload.final = payload.final || {};
        payload.final[key] = payload[key];
        delete payload[key];
      } else if (key.endsWith('_other')) {
        payload.other_data = payload.other_data || {};
        payload.other_data[key] = payload[key];
        delete payload[key];
      }
    });

    // Clean up IDs of nested objects which might mess up typeorm
    Object.keys(FIELD_MAP).forEach((section) => {
      if (payload[section] && payload[section].id) {
        delete payload[section].id;
      }
      if (payload[section] && payload[section].inspection_id) {
        delete payload[section].inspection_id;
      }
    });

    return payload;
  };

  const sendPdfEmail = async (endpoint: string) => {
    let overlay: HTMLElement | null = null;
    let clone: HTMLElement | null = null;
    const currentScrollY = window.scrollY;

    try {
      overlay = document.createElement('div');
      overlay.style.position = 'fixed';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100vw';
      overlay.style.height = '100vh';
      overlay.style.backgroundColor = '#ffffff';
      overlay.style.zIndex = '999999';
      overlay.style.display = 'flex';
      overlay.style.flexDirection = 'column';
      overlay.style.alignItems = 'center';
      overlay.style.justifyContent = 'center';
      overlay.style.fontFamily = 'sans-serif';
      overlay.innerHTML = `
        <div style="border: 4px solid #f3f3f3; border-top: 4px solid #3b82f6; border-radius: 50%; width: 50px; height: 50px; animation: spin 1s linear infinite;"></div>
        <h2 style="margin-top: 20px; font-size: 20px; font-weight: bold; color: #111827;">Compiling & Sending PDF Email...</h2>
        <p style="margin-top: 8px; color: #6b7280; font-size: 14px;">Please wait while the PDF report is emailed.</p>
        <style>@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }</style>
      `;
      document.body.appendChild(overlay);

      const originalElement = document.getElementById('inspection-form-pdf');
      if (!originalElement) return;

      clone = originalElement.cloneNode(true) as HTMLElement;
      clone.id = 'pdf-clone-temp';

      const origSelects = originalElement.querySelectorAll('select');
      const cloneSelects = clone.querySelectorAll('select');
      origSelects.forEach((sel, i) => {
        if (cloneSelects[i]) {
          cloneSelects[i].value = sel.value;
          Array.from(cloneSelects[i].options).forEach((opt: any) => {
            if (opt.value === sel.value) opt.setAttribute('selected', 'selected');
            else opt.removeAttribute('selected');
          });
        }
      });

      const origInputs = originalElement.querySelectorAll('input, textarea');
      const cloneInputs = clone.querySelectorAll('input, textarea');
      origInputs.forEach((inp: any, i) => {
        if (!cloneInputs[i]) return;
        if (inp.type === 'checkbox' || inp.type === 'radio') {
          (cloneInputs[i] as any).checked = inp.checked;
          if (inp.checked) cloneInputs[i].setAttribute('checked', 'checked');
          else cloneInputs[i].removeAttribute('checked');
        } else {
          (cloneInputs[i] as any).value = inp.value;
          cloneInputs[i].setAttribute('value', inp.value);
        }
      });

      clone.classList.remove('hidden');
      clone.style.display = 'block';
      clone.style.position = 'absolute';
      clone.style.top = '0';
      clone.style.left = '0';
      clone.style.width = '1000px';
      clone.style.opacity = '1';
      clone.style.backgroundColor = '#ffffff';
      clone.style.zIndex = '999998';

      const hiddenChildren = clone.querySelectorAll('.hidden');
      hiddenChildren.forEach((child: any) => child.classList.remove('hidden'));

      document.body.appendChild(clone);
      window.scrollTo(0, 0);

      const html2pdf = (await import('html2pdf.js')).default;
      const opt: any = {
        margin:       0.4,
        filename:     'inspection.pdf',
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, scrollY: 0, windowWidth: 1050 },
        jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
      };

      const pdfBlob = await html2pdf().from(clone).set(opt).output('blob');

      const formDataUpload = new FormData();
      formDataUpload.append('pdf', pdfBlob, 'inspection.pdf');

      await axiosInstance.post(endpoint, formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
    } catch (err) {
      console.error("Failed to send PDF email:", err);
    } finally {
      if (clone && document.body.contains(clone)) document.body.removeChild(clone);
      if (overlay && document.body.contains(overlay)) document.body.removeChild(overlay);
      window.scrollTo(0, currentScrollY);
    }
  };

  const handleSave = async (isFinal = false) => {
    try {
      setLoading(true);
      const payload = restructureDataForSave();

      if (isFinal) {
        payload.status = "Completed";
      }

      if (inspectionId) {
        await axiosInstance.patch(`/inspection36/${inspectionId}`, payload);
        setToast({ message: "Inspection updated successfully", type: 'success' });
      } else {
        const { data } = await axiosInstance.post(`/inspection36`, payload);
        setToast({ message: "Inspection created successfully", type: 'success' });
        router.push(`/master/inspection36?id=${data.id}`);
      }

      if (isFinal) {
        // Generate PDF server-side from formData and email it
        await axiosInstance.post('/inspection36/email-form-as-pdf', formData);
        setToast({ message: "Inspection submitted & PDF report emailed successfully!", type: 'success' });
      }

      setTimeout(() => setToast(null), 4000);
      setFormData({});
      setCurrentStep(0);
      localStorage.removeItem("ieimpact_uad36_inspect");
      localStorage.removeItem("ieimpact_uad36_step");

      if (isFinal || inspectionId) {
        router.push("/master/inspections/records");
      }
    } catch (error) {
      console.error(error);
      setToast({ message: "Failed to save inspection.", type: 'error' });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (name: string, label: string, type = "text", className = "sm:w-1/2 md:w-1/3 lg:w-1/4", required = false) => (
    <div className={`mb-4.5 px-2 ${className}`}>
      <label className="mb-2.5 block text-sm font-bold text-dark dark:text-white">
        {required && <span className="text-orange-500 mr-1">&#9733;</span>}
        {label}
      </label>
      {type === "textarea" ? (
        <textarea
          name={name}
          value={formData[name] || ""}
          onChange={handleChange}
          className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark focus:border-primary focus-visible:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
          rows={4}
        />
      ) : type === "checkbox" ? (
        <button
          type="button"
          disabled={isViewMode}
          onClick={() => handleDropdownChange(name, !formData[name])}
          className={`flex cursor-pointer w-fit items-center gap-2 rounded-lg border-[1.5px] px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${formData[name]
            ? "border-green bg-green/10 text-green"
            : "border-stroke bg-white text-dark hover:border-green dark:border-dark-3 dark:bg-dark-2 dark:text-white"
            }`}
        >
          <div className={`flex h-4 w-4 items-center justify-center rounded-sm border ${formData[name] ? "border-green bg-green text-white" : "border-stroke dark:border-dark-3"}`}>
            {formData[name] && <>&#x2713;</>}
          </div>
          {label.replace(/Photo$/, "").trim()}
        </button>
      ) : (
        <input
          type={type}
          name={name}
          value={formData[name] || ""}
          onChange={handleChange}
          className="w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark focus:border-primary focus-visible:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        />
      )}
    </div>
  );

  const renderDropdown = (name: string, label: string, options: string[], className = "sm:w-1/2 md:w-1/3 lg:w-1/4", required = false) => {
    const isYesNo = options.length === 2 && options.includes("Yes") && options.includes("No");
    return (
    <div className={`mb-4.5 px-2 w-full`}>
      <label className="mb-2 flex items-center gap-2 text-sm font-bold text-dark dark:text-white">
        {required && <span className="text-orange-500">&#9733;</span>} {label}
      </label>
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => {
          let selectedArray = formData[name];
          if (!Array.isArray(selectedArray)) selectedArray = selectedArray ? [selectedArray] : [];
          
          const isSelected = isYesNo ? formData[name] === opt : selectedArray.includes(opt);
          const isYes = opt === "Yes";
          const isNo = opt === "No";

          let selectedClasses = "border-primary bg-primary text-white"; // default selected
          if (isYes) selectedClasses = "border-green bg-green text-white";
          if (isNo) selectedClasses = "border-red bg-red text-white";

          return (
            <button
              type="button"
              disabled={isViewMode}
              key={opt}
              onClick={() => {
                if (isYesNo) {
                  handleDropdownChange(name, isSelected ? "" : opt);
                } else {
                  let newArr = [...selectedArray];
                  if (isSelected) newArr = newArr.filter((i: string) => i !== opt);
                  else newArr.push(opt);
                  setFormData((prev: any) => ({ ...prev, [name]: newArr }));
                }
              }}
              className={`rounded-full border-[1.5px] px-6 py-2 text-sm font-medium transition cursor-pointer hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 ${isSelected
                ? selectedClasses
                : "border-stroke bg-white text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {options.includes("Other") && Array.isArray(formData[name]) && formData[name].includes("Other") && (
        <input
          type="text"
          value={formData[`${name}_other`] || ""}
          disabled={isViewMode}
          onChange={(e) => handleDropdownChange(`${name}_other`, e.target.value)}
          placeholder="Please specify"
          className="mt-3 w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark focus:border-primary focus-visible:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        />
      )}
    </div>
  )};

  const renderGeneralInfo = () => (
    <div className="flex flex-wrap -mx-2">
      {renderInput("address", "Property Address")}
      {renderInput("city", "City")}
      {renderInput("stzip", "State/Zip")}
      {renderInput("date", "Date of Inspection", "date")}
      {renderInput("fileno", "File No")}
      {renderInput("appraiser", "Appraiser")}
      {renderInput("borrower", "Borrower")}
      {renderInput("timein", "Time In", "time")}
      {renderInput("timeout", "Time Out", "time")}
      {renderDropdown("proptype", "Property Type", ["SFD", "Townhouse", "Condo", "Co-op", "2-4 Unit", "Manufactured", "Has ADU"])}
      {renderDropdown("dwelling_style", "Dwelling Style", ["Ranch", "Split Level", "Traditional", "Contemporary", "Colonial", "Cape Cod", "Bungalow", "Victorian", "Craftsman", "Other"])}
      {renderDropdown("attachment_type", "Attachment Type", ["Detached", "Attached", "Semi-Detached"])}
    </div>
  );


  const renderMultiSelect = (name: string, label: string, options: string[], required = false) => (
    <div className="mb-4.5 px-2 w-full">
      <label className="mb-2 flex items-center gap-2 text-sm font-bold text-dark dark:text-white">
        {required && <span className="text-orange-500">&#9733;</span>} {label}
      </label>
      <div className="flex flex-wrap gap-3">
        {options.map((opt) => {
          const selectedArray = formData[name] || [];
          const isSelected = selectedArray.includes(opt);
          return (
            <button
              type="button"
              disabled={isViewMode}
              key={opt}
              onClick={() => {
                let newArr = [...selectedArray];
                if (isSelected) {
                  newArr = newArr.filter((i: string) => i !== opt);
                } else {
                  newArr.push(opt);
                }
                setFormData((prev: any) => ({ ...prev, [name]: newArr }));
              }}
              className={`rounded-full border-[1.5px] px-6 py-2 text-sm font-medium transition cursor-pointer hover:border-primary disabled:cursor-not-allowed disabled:opacity-60 ${isSelected ? "border-primary bg-primary text-white" : "border-stroke bg-white text-dark dark:border-dark-3 dark:bg-dark-2 dark:text-white"
                }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {options.includes("Other") && (formData[name] || []).includes("Other") && (
        <input
          type="text"
          value={formData[`${name}_other`] || ""}
          disabled={isViewMode}
          onChange={(e) => handleDropdownChange(`${name}_other`, e.target.value)}
          placeholder="Please specify"
          className="mt-3 w-full rounded-[7px] border-[1.5px] border-stroke bg-transparent px-5 py-3 text-dark focus:border-primary focus-visible:outline-none dark:border-dark-3 dark:bg-dark-2 dark:text-white"
        />
      )}
    </div>
  );

  const renderPhotoCheckboxes = (options: string[]) => (
    <div className="w-full px-2 mt-4">
      <div className="flex items-center gap-2 mb-3">
        <Camera className="w-4 h-4 text-green-700" />
        <h3 className="font-bold text-green-700 text-sm">Photos</h3>
      </div>
      <div className="flex flex-wrap gap-3">
        {options.map(opt => {
          const fieldName = "p_" + opt.replace(/[^a-zA-Z0-9]/g, '_');
          const isChecked = !!formData[fieldName];
          return (
            <label key={opt} className={`flex items-center gap-2 rounded-lg border border-stroke px-4 py-2 dark:border-dark-3 dark:bg-dark-2 ${isViewMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-3'}`}>
              <input type="checkbox" disabled={isViewMode} className="sr-only" checked={isChecked} onChange={() => { if (!isViewMode) setFormData((prev: any) => ({ ...prev, [fieldName]: !isChecked })) }} />
              <div className={`flex h-4 w-4 items-center justify-center rounded border ${isChecked ? "border-primary bg-primary" : "border-stroke bg-white dark:border-dark-3 dark:bg-dark-2"}`}>
                {isChecked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span className="text-sm text-dark dark:text-white">{opt}</span>
            </label>
          )
        })}
      </div>
    </div>
  );

  const renderSectionHeader = (title: string, subtitle?: string) => (
    <div className="w-full px-2 mt-6 mb-4 border-b border-stroke pb-2 dark:border-dark-3">
      <h3 className="font-bold text-dark dark:text-white text-base flex items-center gap-2" dangerouslySetInnerHTML={{ __html: title }}></h3>
      {subtitle && <p className="text-xs text-dark-5 mt-1 italic">{subtitle}</p>}
    </div>
  );

  const renderArrive = () => (
    <div className="flex flex-wrap -mx-2">
      <div className="w-full px-2 mb-4"><span className="text-dark-5 italic text-sm">from your car</span></div>
      {renderDropdown("access", "Primary Access", ["Public Street", "Private Street", "Pedestrian Only", "Waterway", "Other"], "w-full", true)}
      {renderDropdown("streettype", "Street Type", ["Local", "Cul-de-sac", "Alley", "Collector", "Rural", "Other"], "w-full")}
      {renderDropdown("streetsurface", "Street Surface", ["Asphalt", "Concrete", "Gravel", "Dirt", "Other"], "w-full")}
      {renderDropdown("pvtmaint", "Private street maintenance agreement?", ["Yes", "No"], "w-full", true)}
      {renderDropdown("typaccess", "Typical access for this market?", ["Yes", "No"], "w-full", true)}
      {renderPhotoCheckboxes(["Street Scene"])}
    </div>
  );

  const renderCurb = () => (
    <div className="flex flex-wrap -mx-2">
      <div className="w-full px-2 mb-4"><span className="text-dark-5 italic text-sm">looking at the property</span></div>
      {renderSectionHeader("&#9733; View")}
      {renderDropdown("primview", "Primary View", ["Residential", "Mountain", "Water", "Park", "Golf", "City Street", "Commercial", "Industrial", "Other"], "w-full", true)}
      {renderDropdown("viewrange", "View Range", ["Full", "Partial", "Seasonal"], "w-full", true)}
      {renderDropdown("viewimpact", "View Impact on Value", ["Adverse", "Neutral", "Beneficial"], "w-full", true)}
      {renderInput("otherview", "Other Views", "text", "w-full", true)}
      {renderMultiSelect("influences", "Site Influences (circle all)", ["Body of Water", "Busy Road", "Airport", "Commercial", "Golf Course", "Green Space", "Industrial", "Power Lines", "Railroad", "Hillside", "None", "Other"])}
      {renderDropdown("frontdoor", "Front Door Height Above Grade", ["At Grade", "< 1 ft", "1-2 ft", "2-3 ft", "3-4 ft", "4-5 ft", "5-6 ft", "6+ ft"], "w-full", true)}
      {renderPhotoCheckboxes(["Front of Property"])}
    </div>
  );

  const renderExterior = () => (
    <div className="flex flex-wrap -mx-2">
      <div className="w-full px-2 mb-4"><span className="text-dark-5 italic text-sm">clockwise around dwelling</span></div>

      {renderSectionHeader("Materials")}
      {renderMultiSelect("extwalls", "Exterior Walls", ["Brick", "Vinyl", "Wood", "Aluminum", "Stucco", "Cement Board", "Stone", "Log", "Other"])}
      {renderMultiSelect("fndtype", "Foundation Type", ["Slab", "Crawl Space", "Basement", "Post & Pier", "Other"])}
      {renderMultiSelect("fndmat", "Foundation Material", ["Poured Concrete", "Block", "Stone", "Brick", "Wood", "Other"], true)}
      {renderMultiSelect("roofmat", "Roof Material", ["Asphalt", "Metal", "Tile", "Slate", "Wood", "Other"])}

      {renderSectionHeader("&#9733; Condition Status per Feature", "Note: end of branch feature pulls its own condition rating.")}
      {renderDropdown("cond_walls", "Exterior Walls", ["New/Like New", "Typical Wear", "Damaged-Functional", "Damaged-Nonfunctional"], "w-full")}
      {renderDropdown("cond_fnd", "Foundation", ["New/Like New", "Typical Wear", "Damaged-Functional", "Damaged-Nonfunctional"], "w-full")}
      {renderDropdown("cond_roof", "Roof", ["New/Like New", "Typical Wear", "Damaged-Functional", "Damaged-Nonfunctional"], "w-full")}
      {renderDropdown("cond_win", "Windows", ["New/Like New", "Typical Wear", "Damaged-Functional", "Damaged-Nonfunctional"], "w-full")}

      {renderDropdown("fndaccess", "Foundation accessible to observe?", ["Yes", "No"], "w-full", true)}
      {renderDropdown("roofage", "Estimated Roof Age", ["< 1 yr", "1-10 yr", "10-20 yr", ">20 yr"], "w-full", true)}
      {renderDropdown("roofobs", "Roof observable?", ["Yes", "No"], "w-full", true)}

      {renderSectionHeader("&#9733; Look for these while walking")}
      {renderDropdown("converted", "Any converted areas? (garage/patio/porch -> living area)", ["Yes", "No"], "w-full", true)}
      {renderDropdown("convfinish", "Converted finish vs rest of home", ["Inferior", "Similar", "Superior", "N/A"], "w-full", true)}
      {renderInput("noncontig", "Non-continuous finished area SF", "text", "w-full", true)}

      {renderDropdown("attic", "Attic access?", ["Yes", "No"], "w-full", true)}
      {renderDropdown("atticdet", "Attic", ["Accessible", "Not Accessible", "Observed", "Not Observed"], "w-full")}

      {renderSectionHeader("&#9733; Disaster mitigation")}
      {renderMultiSelect("mitigation", "Features", ["Flood vents", "Impact glass", "Fortified roof", "Fire storm walls", "Fire storm deck", "Enclosed soffits", "Storm shutters", "None", "Other"], true)}

      {renderSectionHeader("&#9733; Renewable Energy")}
      {renderDropdown("renewable", "Renewable energy visible?", ["Yes", "No"], "w-full", true)}
      {renderDropdown("renewtype", "Type", ["Solar Panels", "Wind Turbine", "Geothermal", "Other"], "w-full", true)}
      {renderDropdown("renewown", "Ownership", ["Owned", "Leased", "PPA", "Other"], "w-full", true)}

      {renderDropdown("extdefects", "Any exterior defects?", ["Yes", "No"], "w-full")}

      <div className="w-full px-2 mb-4">
        <div className="border border-orange-200 bg-orange-50/30 rounded-xl p-4">
          {renderDropdown("extdef1_feat", "Defect Feature", ["Foundation", "Roof", "Walls", "Windows", "Mech", "Floor", "Other"], "w-full")}
          <div className="flex gap-4 w-full">
            {renderInput("extdef1_loc", "Location", "text", "w-1/2")}
            {renderInput("extdef1_desc", "Description", "text", "w-1/2")}
          </div>
          <div className="flex gap-4 w-full">
            {renderInput("extdef1_struct", "Structural? (Y/N)", "text", "w-1/3")}
            {renderInput("extdef1_action", "Action (Repair/Inspect/None)", "text", "w-1/3")}
            {renderInput("extdef1_cost", "Cost $", "text", "w-1/3")}
          </div>
        </div>
      </div>

      <div className="w-full px-2 mb-4">
        <div className="border border-orange-200 bg-orange-50/30 rounded-xl p-4">
          {renderDropdown("extdef2_feat", "Defect Feature", ["Foundation", "Roof", "Walls", "Windows", "Mech", "Floor", "Other"], "w-full")}
          <div className="flex gap-4 w-full">
            {renderInput("extdef2_loc", "Location", "text", "w-1/2")}
            {renderInput("extdef2_desc", "Description", "text", "w-1/2")}
          </div>
          <div className="flex gap-4 w-full">
            {renderInput("extdef2_struct", "Structural? (Y/N)", "text", "w-1/3")}
            {renderInput("extdef2_action", "Action (Repair/Inspect/None)", "text", "w-1/3")}
            {renderInput("extdef2_cost", "Cost $", "text", "w-1/3")}
          </div>
        </div>
      </div>

      {renderPhotoCheckboxes(["N/S/E", "W/S/W", "Right Side", "Foundation", "Roof", "Renew.Energy", "Mitigation", "Ext Defects"])}
    </div>
  );

  const renderYard = () => (
    <div className="flex flex-wrap -mx-2">
      <div className="w-full px-2 mb-4"><span className="text-dark-5 italic text-sm">walk the property grounds</span></div>

      {renderDropdown("topo", "Topography", ["Flat", "Sloping", "Rolling", "Rocky", "Other"], "w-full")}
      {renderDropdown("drainage", "Drainage Issues?", ["None", "Standing Water", "Erosion", "Improper Grading", "Other"], "w-full")}

      {renderSectionHeader("Utilities")}
      {renderDropdown("util_elec", "Electric", ["Public", "Private"], "w-full")}
      {renderDropdown("util_gas", "Gas", ["Public", "Private", "None"], "w-full")}
      {renderDropdown("util_water", "Water", ["Public", "Private: Well", "Private: Cistern", "Private: Other"], "w-full")}
      {renderDropdown("util_sewer", "Sewer", ["Public", "Private: Septic", "Private: Cesspool", "Private: Other"], "w-full")}
      {renderDropdown("broadband", "Broadband internet available at property?", ["Yes", "No"], "w-full", true)}

      {renderSectionHeader("&#9733; Non-Residential Use")}
      {renderDropdown("primres", "Primarily residential?", ["Yes", "No"], "w-full", true)}
      {renderInput("respct", "Residential %", "text", "w-full", true)}
      {renderDropdown("nonres", "Non-residential use", ["None", "Agricultural", "Commercial", "Industrial", "Other"], "w-full", true)}
      {renderDropdown("nonresmod", "Non-residential modifications?", ["Yes", "No"], "w-full", true)}

      {renderSectionHeader("Encumbrances")}
      {renderMultiSelect("restrict", "Restrictions", ["None", "Age", "Historic", "Income", "Land Use", "Rental", "Sale Price", "Other"])}
      {renderMultiSelect("easement", "Easements", ["None", "Conservation", "Drainage", "Ingress/egress", "Utility", "Other"])}
      {renderMultiSelect("encroach", "Encroachments", ["None", "Building", "Fence", "Driveway", "Overhang", "Other"])}

      {renderSectionHeader("&#9733; Amenities — count AND measure!", "Note: in UAD report COUNT and MEASURED AREA (SF) for each amenity.")}
      {renderMultiSelect("amen_out", "Outdoor", ["Fence", "Irrigation", "Outdoor Fireplace", "Outdoor Kitchen", "Sports Court", "None"])}
      {renderMultiSelect("amen_living", "Outdoor Living", ["Deck", "Patio", "Porch", "Portico", "Balcony", "Gazebo", "None"])}
      {renderMultiSelect("amen_water", "Water Features", ["Inground Pool", "Inground Spa", "Outdoor Shower", "Sauna", "None"])}

      <div className="w-full flex gap-2 px-2">
        {renderInput("amen1_name", "Amenity", "text", "w-1/4")}
        {renderInput("amen1_ct", "Count", "text", "w-1/4")}
        {renderInput("amen1_sf", "Area SF", "text", "w-1/4", true)}
        {renderInput("amen1_mat", "Material", "text", "w-1/4")}
      </div>
      <div className="w-full flex gap-2 px-2">
        {renderInput("amen2_name", "Amenity", "text", "w-1/4")}
        {renderInput("amen2_ct", "Count", "text", "w-1/4")}
        {renderInput("amen2_sf", "Area SF", "text", "w-1/4", true)}
        {renderInput("amen2_mat", "Material", "text", "w-1/4")}
      </div>

      {renderDropdown("sitedefects", "Any site defects?", ["Yes", "No"], "w-full")}

      <div className="w-full px-2 mb-4">
        <div className="border border-orange-200 bg-orange-50/30 rounded-xl p-4">
          {renderDropdown("sitedef1_feat", "Defect Feature", ["Foundation", "Roof", "Walls", "Windows", "Mech", "Floor", "Other"], "w-full")}
          <div className="flex gap-4 w-full">
            {renderInput("sitedef1_loc", "Location", "text", "w-1/2")}
            {renderInput("sitedef1_desc", "Description", "text", "w-1/2")}
          </div>
          <div className="flex gap-4 w-full">
            {renderInput("sitedef1_struct", "Structural? (Y/N)", "text", "w-1/3")}
            {renderInput("sitedef1_action", "Action (Repair/Inspect/None)", "text", "w-1/3")}
            {renderInput("sitedef1_cost", "Cost $", "text", "w-1/3")}
          </div>
        </div>
      </div>

      {renderPhotoCheckboxes(["Yard", "Pool/Spa", "Deck/Patio", "Waterfront", "Non-Res Use", "Site Defects"])}
    </div>
  );


  const renderOutbuildings = () => (
    <div className="flex flex-wrap -mx-2">
      <div className="w-full px-2 mb-4"><span className="text-dark-5 italic text-sm">walk to each structure</span></div>

      {renderSectionHeader("Vehicle Storage")}
      {renderMultiSelect("veh_type", "Type", ["Garage", "Carport", "Driveway", "Open Lot", "Parking Garage", "None", "Other"])}
      {renderDropdown("veh_attach", "Attachment", ["Attached", "Built-In", "Detached"], "w-full")}

      <div className="w-full flex gap-2 px-2">
        {renderInput("veh_spaces", "# Spaces", "text", "w-1/3")}
        {renderInput("veh_sf", "Area SF", "text", "w-1/3")}
        {renderInput("veh_surface", "Surface", "text", "w-1/3")}
      </div>

      {renderSectionHeader("&#9733; Outbuildings", "Measure GBA from exterior walls. Include all floors.")}
      <div className="w-full flex gap-2 px-2">
        {renderInput("ob1_type", "#1 Type", "text", "w-1/3")}
        {renderInput("ob1_gba", "GBA SF", "text", "w-1/3", true)}
        {renderInput("ob1_fin", "Finished SF", "text", "w-1/3", true)}
      </div>
      <div className="w-full flex gap-2 px-2">
        {renderInput("ob1_unfin", "Unfinished SF", "text", "w-1/3", true)}
        {renderInput("ob1_rooms", "Rooms", "text", "w-1/3", true)}
        {renderInput("ob1_utils", "Utilities", "text", "w-1/3", true)}
      </div>
      {renderDropdown("ob1_heat", "#1 Heating?", ["Yes", "No"], "w-full")}

      <div className="w-full flex gap-2 px-2 mt-4">
        {renderInput("ob2_type", "#2 Type", "text", "w-1/3")}
        {renderInput("ob2_gba", "GBA SF", "text", "w-1/3", true)}
        {renderInput("ob2_fin", "Finished SF", "text", "w-1/3", true)}
      </div>
      {renderDropdown("ob2_heat", "#2 Heating?", ["Yes", "No"], "w-full")}

      {renderPhotoCheckboxes(["8_Garage_Carport", "8_Outbuilding_Ext", "8_Outbuilding_Int", "8_Defects"])}
    </div>
  );

  const renderMainLevel = () => (
    <div className="flex flex-wrap -mx-2">
      <div className="w-full px-2 mb-4"><span className="text-dark-5 italic text-sm">front door &#8212; living area</span></div>

      {renderDropdown("occupancy", "Occupancy", ["Owner", "Tenant", "Vacant"], "w-full")}

      {/* Header with Title and Global Actions */}
      <div className="w-full flex gap-2 px-2">
        {renderInput("levels", "Levels in Unit", "text", "w-1/4")}
        {renderInput("br", "Bedrooms", "text", "w-1/4")}
        {renderInput("fullba", "Full Baths", "text", "w-1/4")}
        {renderInput("halfba", "Half Baths", "text", "w-1/4")}
      </div>

      {renderDropdown("intqual", "Interior Quality", ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"], "w-full")}
      {renderDropdown("intcond", "Interior Condition", ["C1", "C2", "C3", "C4", "C5", "C6"], "w-full")}

      {renderSectionHeader("&#9733; Kitchen &#8212; record for EACH kitchen!", "#1 most-missed new field. Record update + time frame + condition for every kitchen.")}
      {renderInput("k1_level", "Kitchen 1 &#8212; Level", "text", "w-full")}
      {renderDropdown("k1_update", "K1 Update", ["Fully Updated", "Partially Updated", "Not Updated"], "w-full")}
      {renderDropdown("k1_time", "K1 Time Frame", ["< 1 yr", "1-5 yr", "5-10 yr", "10+ yr"], "w-full")}
      {renderDropdown("k1_cond", "K1 Condition", ["New/Like New", "Typical Wear", "Damaged-Functional", "Damaged-Nonfunctional"], "w-full")}

      {renderInput("k2_level", "Kitchen 2 &#8212; Level (if applicable)", "text", "w-full")}
      {renderDropdown("k2_update", "K2 Update", ["Fully Updated", "Partially Updated", "Not Updated"], "w-full")}

      {renderSectionHeader("&#9733; Flooring (this level)")}
      {renderMultiSelect("floor_types", "Flooring Types (select all)", ["Hardwood", "Carpet", "Ceramic", "Laminate", "Vinyl", "LVP", "Eng Wood", "Marble", "Concrete", "Other"], true)}
      {renderDropdown("floor_update", "Flooring Update", ["Fully", "Significantly", "Moderately", "Not Updated"], "w-full", true)}
      {renderDropdown("floor_cond", "Flooring Condition", ["New/Like New", "Typical Wear", "Damaged-Functional", "No Finish"], "w-full", true)}

      {renderSectionHeader("&#9733; Ceiling (this level)")}
      {renderDropdown("ceil_ht", "Ceiling Height", ["< 7 ft", "7 ft", "8 ft", "9 ft", "10+ ft", "2+ Stories"], "w-full", true)}
      {renderDropdown("ceil_style", "Ceiling Style", ["Flat", "Cathedral", "Vaulted", "Tray", "Coffered", "Beams", "Other"], "w-full", true)}
      {renderDropdown("wallceil_cond", "Walls/Ceiling Condition", ["New/Like New", "Typical Wear", "Damaged-Functional", "Damaged-Nonfunctional"], "w-full", true)}

      {renderMultiSelect("wholehome", "Whole Home Features", ["Fireplace", "Elevator", "Fire Suppression", "EV Charging", "Multi-Zone HVAC", "Security", "Generator", "Smart Home", "None"])}

      {renderSectionHeader("&#9733; Accessibility Features")}
      {renderMultiSelect("accessibility", "Features", ["Grab Bars", "Ramps", "Wide Doorways", "Low Counters", "Lever Handles", "Roll-In Shower", "Elevator", "Other", "None"])}

      {renderPhotoCheckboxes(["8_Kitchen_s_", "8_Living_Family", "8_Dining", "8_Main_Level_Rooms"])}
    </div>
  );

  const renderUpperLevel = () => (
    <div className="flex flex-wrap -mx-2">
      <div className="w-full px-2 mb-4"><span className="text-dark-5 italic text-sm">go upstairs</span></div>

      {renderSectionHeader("&#9733; Bathrooms &#8212; record EACH bathroom", "Most homes have 2-4 bathrooms. Record detail for each.")}

      {renderInput("bath1_loc", "Bath 1 &#8212; Location/Level", "text", "w-full")}
      {renderDropdown("bath1_type", "Bath 1 Type", ["Full", "3/4", "Half"], "w-full")}
      {renderDropdown("bath1_update", "Bath 1 Update", ["Fully", "Significantly", "Moderately", "Not Updated"], "w-full")}
      {renderDropdown("bath1_cond", "Bath 1 Condition", ["New/Like New", "Typical Wear", "Damaged-Functional", "Damaged-Nonfunctional"], "w-full")}

      {renderInput("bath2_loc", "Bath 2 &#8212; Location/Level", "text", "w-full")}
      {renderDropdown("bath2_type", "Bath 2 Type", ["Full", "3/4", "Half"], "w-full")}
      {renderDropdown("bath2_update", "Bath 2 Update", ["Fully", "Significantly", "Moderately", "Not Updated"], "w-full")}
      {renderDropdown("bath2_cond", "Bath 2 Condition", ["New/Like New", "Typical Wear", "Damaged-Functional", "Damaged-Nonfunctional"], "w-full")}

      {renderInput("bath3_loc", "Bath 3 &#8212; Location/Level", "text", "w-full")}
      {renderDropdown("bath3_type", "Bath 3 Type", ["Full", "3/4", "Half"], "w-full")}
      {renderDropdown("bath3_update", "Bath 3 Update", ["Fully", "Significantly", "Moderately", "Not Updated"], "w-full")}
      {renderDropdown("bath3_cond", "Bath 3 Condition", ["New/Like New", "Typical Wear", "Damaged-Functional", "Damaged-Nonfunctional"], "w-full")}

      {renderInput("bath4_loc", "Bath 4 &#8212; Location/Level", "text", "w-full")}
      {renderDropdown("bath4_type", "Bath 4 Type", ["Full", "3/4", "Half"], "w-full")}
      {renderDropdown("bath4_update", "Bath 4 Update", ["Fully", "Significantly", "Moderately", "Not Updated"], "w-full")}
      {renderDropdown("bath4_cond", "Bath 4 Condition", ["New/Like New", "Typical Wear", "Damaged-Functional", "Damaged-Nonfunctional"], "w-full")}

      {renderSectionHeader("&#9733; Bedrooms &#8212; record EACH bedroom", "Most homes have 2-6 bedrooms. Note level, ceiling height, flooring for each.")}

      <div className="w-full flex gap-2 px-2">
        {renderInput("br1_level", "BR 1 Level", "text", "w-1/4")}
        {renderInput("br1_ceil", "Ceiling Ht", "text", "w-1/4", true)}
        {renderInput("br1_floor", "Flooring", "text", "w-1/4", true)}
        {renderInput("br1_notes", "Notes", "text", "w-1/4")}
      </div>
      <div className="w-full flex gap-2 px-2">
        {renderInput("br2_level", "BR 2 Level", "text", "w-1/4")}
        {renderInput("br2_ceil", "Ceiling Ht", "text", "w-1/4", true)}
        {renderInput("br2_floor", "Flooring", "text", "w-1/4", true)}
        {renderInput("br2_notes", "Notes", "text", "w-1/4")}
      </div>
      <div className="w-full flex gap-2 px-2">
        {renderInput("br3_level", "BR 3 Level", "text", "w-1/4")}
        {renderInput("br3_ceil", "Ceiling Ht", "text", "w-1/4", true)}
        {renderInput("br3_floor", "Flooring", "text", "w-1/4", true)}
        {renderInput("br3_notes", "Notes", "text", "w-1/4")}
      </div>
      <div className="w-full flex gap-2 px-2">
        {renderInput("br4_level", "BR 4 Level", "text", "w-1/4")}
        {renderInput("br4_ceil", "Ceiling Ht", "text", "w-1/4", true)}
        {renderInput("br4_floor", "Flooring", "text", "w-1/4", true)}
        {renderInput("br4_notes", "Notes", "text", "w-1/4")}
      </div>
      <div className="w-full flex gap-2 px-2">
        {renderInput("br5_level", "BR 5 Level", "text", "w-1/4")}
        {renderInput("br5_ceil", "Ceiling Ht", "text", "w-1/4", true)}
        {renderInput("br5_floor", "Flooring", "text", "w-1/4", true)}
        {renderInput("br5_notes", "Notes", "text", "w-1/4")}
      </div>
      <div className="w-full flex gap-2 px-2">
        {renderInput("br6_level", "BR 6 Level", "text", "w-1/4")}
        {renderInput("br6_ceil", "Ceiling Ht", "text", "w-1/4", true)}
        {renderInput("br6_floor", "Flooring", "text", "w-1/4", true)}
        {renderInput("br6_notes", "Notes", "text", "w-1/4")}
      </div>

      {renderSectionHeader("Upper Level Detail")}
      <div className="w-full flex gap-2 px-2">
        {renderInput("up1_ceilht", "Ceiling Height", "text", "w-1/3", true)}
        {renderInput("up1_floor", "Flooring", "text", "w-1/3", true)}
        {renderInput("up1_finsf", "Finished SF", "text", "w-1/3")}
      </div>
      <div className="w-full flex gap-2 px-2">
        {renderInput("up1_unfinsf", "Unfinished SF", "text", "w-1/2")}
        {renderInput("up1_rooms", "Rooms on this level", "text", "w-1/2")}
      </div>

      {renderPhotoCheckboxes(["8_All_Bedrooms", "8_All_Baths", "8_Upper_Rooms", "8_Updates_Renovations"])}
    </div>
  );

  const renderBelowGrade = () => (
    <div className="flex flex-wrap -mx-2">
      {renderInput("bg_finsf", "Finished SF", "number")}
      {renderInput("bg_finnonstd", "Non-Standard Finished SF", "number")}
      {renderInput("bg_unfinsf", "Unfinished SF", "number")}
      {renderInput("bg_finish", "Finish Quality")}
      {renderDropdown("bg_grade", "Grade", ["Walk-out", "Look-out", "Daylight", "Interior Only"])}
      {renderDropdown("bg_access", "Access", ["Interior Stair", "Exterior Stair", "Walk-out", "Hatch"])}
      {renderDropdown("bg_extaccess", "Exterior Access", ["Yes", "No"])}
      {renderInput("bg_ceilht", "Ceiling Height", "number")}
      {renderInput("bg_rooms", "Total Rooms", "number")}

      <div className="w-full mt-4 mb-2">
        <h3 className="font-semibold text-dark dark:text-white">Mechanicals</h3>
      </div>
      {renderDropdown("heat_sys", "Heating System", ["Forced Air", "Radiant", "Baseboard", "Heat Pump", "None"])}
      {renderDropdown("heat_fuel", "Heating Fuel", ["Gas", "Electric", "Oil", "Propane", "Wood"])}
      {renderDropdown("cooling", "Cooling System", ["Central", "Window Units", "Mini-Split", "Evaporative", "None"])}
      {renderDropdown("furnace_bg", "Furnace in Below Grade", ["Yes", "No"])}
      {renderInput("bg_defects", "Below Grade Defects")}

      {renderPhotoCheckboxes(["8_BG_Finished", "8_BG_Unfinished", "8_Mechanicals", "8_BG_Defects"])}
    </div>
  );

  const renderAdu = () => (
    <div className="flex flex-wrap -mx-2">
      <div className="w-full px-2 mb-4"><span className="text-dark-5 italic text-sm">skip if no ADU</span></div>

      {renderDropdown("adu_present", "ADU on the property?", ["Yes", "No"], "w-full", true)}
      {renderDropdown("adu_loc", "Location", ["In Dwelling", "In Outbuilding"], "w-full", true)}
      {renderDropdown("adu_access", "Access", ["Interior Only", "Exterior Only", "Both"], "w-full", true)}
      {renderDropdown("adu_rentable", "Legally rentable?", ["Yes", "No"], "w-full", true)}
      {renderDropdown("adu_typical", "Typical for market?", ["Yes", "No"], "w-full", true)}
      {renderDropdown("adu_address", "Separate postal address?", ["Yes", "No"], "w-full", true)}

      <div className="w-full flex gap-2 px-2">
        {renderInput("adu_br", "Bedrooms", "text", "w-1/3")}
        {renderInput("adu_fullba", "Full Baths", "text", "w-1/3")}
        {renderInput("adu_halfba", "Half Baths", "text", "w-1/3")}
      </div>
      <div className="w-full flex gap-2 px-2">
        {renderInput("adu_finsf", "Finished SF", "text", "w-1/2")}
        {renderInput("adu_unfinsf", "Unfinished SF", "text", "w-1/2")}
      </div>

      {renderDropdown("adu_kitchen", "ADU Kitchen Update", ["Fully", "Partially", "Not Updated"], "w-full", true)}
      {renderDropdown("adu_bath", "ADU Bath Update", ["Fully", "Significantly", "Moderately", "Not Updated"], "w-full", true)}

      {renderPhotoCheckboxes(["8_ADU_Exterior", "8_ADU_Interior", "8_ADU_Kitchen", "8_ADU_Bath"])}
    </div>
  );


  const renderChecklistCheckboxes = (options: string[]) => (
    <div className="w-full px-2 mt-2">
      <div className="flex flex-wrap gap-3">
        {options.map(opt => {
          const fieldName = "c_" + opt.replace(/[^a-zA-Z0-9]/g, '_');
          const isChecked = !!formData[fieldName];
          return (
            <label key={opt} className={`flex items-center gap-2 rounded-lg border border-stroke px-4 py-2 dark:border-dark-3 dark:bg-dark-2 ${isViewMode ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-dark-3'}`}>
              <input type="checkbox" disabled={isViewMode} className="sr-only" checked={isChecked} onChange={() => { if (!isViewMode) setFormData((prev: any) => ({ ...prev, [fieldName]: !isChecked })) }} />
              <div className={`flex h-4 w-4 items-center justify-center rounded border ${isChecked ? "border-primary bg-primary" : "border-stroke bg-white dark:border-dark-3 dark:bg-dark-2"}`}>
                {isChecked && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </div>
              <span className="text-sm text-dark dark:text-white">{opt}</span>
            </label>
          )
        })}
      </div>
    </div>
  );

  const renderFinal = () => (
    <div className="flex flex-wrap -mx-2">
      <div className="w-full px-2 mb-4"><span className="text-dark-5 italic text-sm">you have seen everything</span></div>

      {renderSectionHeader("Overall Ratings")}
      {renderDropdown("ext_qual", "Exterior Quality", ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"], "w-full")}
      {renderDropdown("ext_cond", "Exterior Condition", ["C1", "C2", "C3", "C4", "C5", "C6"], "w-full")}
      {renderDropdown("ovr_qual", "Overall Quality", ["Q1", "Q2", "Q3", "Q4", "Q5", "Q6"], "w-full")}
      {renderDropdown("ovr_cond", "Overall Condition", ["C1", "C2", "C3", "C4", "C5", "C6"], "w-full")}

      {renderSectionHeader("Area Summary")}
      <div className="w-full flex gap-2 px-2">
        {renderInput("fin_ag_std", "Fin AG (std) SF", "text", "w-1/3")}
        {renderInput("fin_ag_nonstd", "Fin AG (non-std) SF", "text", "w-1/3")}
        {renderInput("unfin_ag", "Unfin AG SF", "text", "w-1/3")}
      </div>
      {renderInput("gba_total", "★ ★ GBA Finished All Units incl ADU (SF)", "text", "w-full")}

      {renderSectionHeader("Measurement Standard")}
      {renderDropdown("measstd", "Measurement Standard", ["ANSI", "American Measurement Standard", "Other"], "w-full")}

      {renderSectionHeader("Functional Issues")}
      {renderMultiSelect("func_issues", "Issues", ["None", "Floor Plan", "Ceiling Height", "Overimprovement", "Underimprovement", "Non-Conformity", "Other"])}
      {renderInput("sketch_notes", "Sketch / measurement notes", "textarea", "w-full")}

      {renderSectionHeader("Before You Leave — check each item")}
      {renderChecklistCheckboxes([
        "★ Front door height above grade",
        "★ Roof age estimate",
        "★ Converted areas",
        "★ Kitchen update/timeframe/condition (EACH)",
        "★ Each bathroom: type + update + condition",
        "★ Each bedroom: level + ceiling ht + flooring",
        "★ Flooring types + update",
        "★ Ceiling height per level",
        "★ Per-component condition",
        "★ View + range + impact",
        "★ Non-residential use",
        "★ Amenity counts + areas",
        "★ Disaster mitigation",
        "★ Renewable energy",
        "★ Broadband internet",
        "★ ADU details (if present)",
        "★ Outbuilding GBA + utilities",
        "★ Furnace location (BG?)",
        "All levels measured",
        "All photos taken",
        "All defects documented",
        "BR/BA counts confirmed"
      ])}

      <div className="w-full px-2 mt-4">
        {renderInput("team_notes", "Notes for Backbone desktop team", "textarea", "w-full")}
      </div>
    </div>
  );

  const renderStepContent = () => {
    const stepId = STEPS[currentStep].id;
    switch (stepId) {
      case "general": return renderGeneralInfo();
      case "arrive": return renderArrive();
      case "curb": return renderCurb();
      case "exterior": return renderExterior();
      case "yard": return renderYard();
      case "outbuildings": return renderOutbuildings();
      case "mainlevel": return renderMainLevel();
      case "upperlevel": return renderUpperLevel();
      case "belowgrade": return renderBelowGrade();
      case "adu": return renderAdu();
      case "final": return renderFinal();
      default: return null;
    }
  };


  const renderAllStepsForPrint = () => {
    return STEPS.map((step, index) => {
      const isActive = currentStep === index;
      let content = null;
      switch (step.id) {
        case "general": content = renderGeneralInfo(); break;
        case "arrive": content = renderArrive(); break;
        case "curb": content = renderCurb(); break;
        case "exterior": content = renderExterior(); break;
        case "yard": content = renderYard(); break;
        case "outbuildings": content = renderOutbuildings(); break;
        case "mainlevel": content = renderMainLevel(); break;
        case "upperlevel": content = renderUpperLevel(); break;
        case "belowgrade": content = renderBelowGrade(); break;
        case "adu": content = renderAdu(); break;
        case "final": content = renderFinal(); break;
        default: content = null;
      }
      return (
        <div key={step.id} className={`${isActive ? "block" : "hidden print:block"} mb-8 print:break-inside-avoid`}>
          <h2 className="hidden print:block text-2xl font-bold mb-4 border-b pb-2">{step.label}</h2>
          {content}
        </div>
      );
    });
  };

  return (
    <>
      <div className="relative rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5 print:border-none print:p-0 print:shadow-none">

        {/* Nice Toast Notification */}
        {toast && (
          <div className={`fixed top-4 right-4 z-[999] flex items-center gap-3 rounded-lg px-6 py-4 shadow-xl transition-all animate-in slide-in-from-top-5 ${toast.type === 'success' ? 'bg-green text-white shadow-green/20' : 'bg-red text-white shadow-red/20'}`}>
            <CheckCircle2 className="w-5 h-5" />
            <p className="font-semibold">{toast.message}</p>
          </div>
        )}

        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between print:hidden">
          <div>
            <p className="text-sm text-dark-5">Overview</p>
            <h2 className="text-xl font-semibold text-dark dark:text-white">
              {inspectionId ? "Edit" : "Master"} <span className="font-normal">Inspection UAD 3.6</span>
              {inspectionId && <span className="text-primary text-lg ml-3">#{inspectionId.slice(0, 8)}</span>}
            </h2>
          </div>
          <div className="flex items-center gap-3 print:hidden">
            {saveStatus && (
              <span className="flex items-center gap-1.5 text-sm font-medium text-green bg-green/10 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-4 h-4" />
                <span dangerouslySetInnerHTML={{ __html: saveStatus }} />
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
                {inspectionId && (
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
                            router.push(`/master/inspection36?id=${inspectionId}&mode=view`);
                          }
                        });
                      } else {
                        setIsViewMode(true);
                        router.push(`/master/inspection36?id=${inspectionId}&mode=view`);
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
                        localStorage.removeItem("ieimpact_uad36_inspect");
                        localStorage.removeItem("ieimpact_uad36_step");
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
            {STEPS.map((step, index) => {
              const active = currentStep === index;

              let btnClass = "border-stroke bg-white text-dark hover:shadow-md dark:border-dark-3 dark:bg-dark-2 dark:text-white transition-all duration-200 ease-in-out";
              if (active) {
                btnClass = "border-primary bg-primary text-white shadow-lg shadow-primary/30 transform scale-105";
              }

              return (
                <button
                  key={step.id}
                  onClick={() => {
                    setCurrentStep(index);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium ${btnClass}`}
                >
                  <span dangerouslySetInnerHTML={{ __html: step.short }} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Form Content */}
        <div className="w-full">
          <div className="h-full min-h-[600px] flex flex-col rounded-[10px] bg-transparent">
            <div className="border-b border-stroke px-6 py-4 dark:border-dark-3">
              <h3 className="text-lg font-semibold text-dark dark:text-white">
                Step {currentStep + 1}: {STEPS[currentStep].label}
              </h3>
            </div>

            <div className="p-6 flex-grow">
              <fieldset disabled={isViewMode} className="group-disabled:opacity-70">
                {renderAllStepsForPrint()}
              </fieldset>
            </div>
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
                  <button
                    type="button"
                    onClick={() => handleSave(true)}
                    disabled={loading}
                    className="flex items-center gap-2 rounded-lg bg-green px-8 py-2.5 text-sm font-semibold text-white shadow-md shadow-green/20 transition-all hover:bg-green/90 hover:-translate-y-0.5 disabled:transform-none disabled:opacity-60"
                  >
                    <Save className="w-4 h-4" />
                    {loading ? (inspectionId ? "Updating..." : "Submitting...") : (inspectionId ? "Update Inspection" : "Submit")}
                  </button>
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
        </div>
      </div>


      {/* PRINT VIEW (All Steps Linearly) */}
      <div id="inspection-form-pdf" className="hidden print:block text-black bg-white">
        <div className="mb-6 text-center text-2xl font-bold">UAD 3.6 Field Inspection</div>
        {STEPS.map((step, sIdx) => {
          let content = null;
          switch (step.id) {
            case "general": content = renderGeneralInfo(); break;
            case "arrive": content = renderArrive(); break;
            case "curb": content = renderCurb(); break;
            case "exterior": content = renderExterior(); break;
            case "yard": content = renderYard(); break;
            case "outbuildings": content = renderOutbuildings(); break;
            case "mainlevel": content = renderMainLevel(); break;
            case "upperlevel": content = renderUpperLevel(); break;
            case "belowgrade": content = renderBelowGrade(); break;
            case "adu": content = renderAdu(); break;
            case "final": content = renderFinal(); break;
            default: content = null;
          }
          return (
            <div key={sIdx} className="mb-10 block">
              {step.label && (
                <h2 className="mb-4 text-xl font-bold border-b-2 border-black pb-2 text-black">
                  {step.label}
                </h2>
              )}
              <form>
                {content}
              </form>
            </div>
          );
        })}
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
                  localStorage.setItem("ieimpact_uad36_template", JSON.stringify(formData));
                  setHasTemplate(true);
                  setShowTemplateModal(false);
                  setToast({ message: "Template saved successfully", type: 'success' });
                  setTimeout(() => setToast(null), 3000);
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
                          const tpl = localStorage.getItem("ieimpact_uad36_template");
                          if (tpl) {
                            try {
                              setFormData(JSON.parse(tpl));
                              setToast({ message: "Template loaded successfully", type: 'success' });
                              setTimeout(() => setToast(null), 3000);
                            } catch (e) { }
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
                          localStorage.removeItem("ieimpact_uad36_template");
                          setHasTemplate(false);
                          setToast({ message: "Template deleted", type: 'success' });
                          setTimeout(() => setToast(null), 3000);
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
                    const res = await axiosInstance.post('/inspection36/generate-pdf', {}, { responseType: 'blob' });
                    const url = window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'blank_inspection_36.pdf';
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
    </>
  );
}
