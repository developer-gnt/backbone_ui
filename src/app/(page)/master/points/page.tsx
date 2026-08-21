"use client";

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import axiosInstance from "@/lib/axiosInstance";
import InputGroup from "@/components/FormElements/InputGroup";

interface PointsModel {
  id: number;
  username: string | null;
  points: number | string | null;
  feedback_points?: number | string | null;
}

const PointsPage = () => {
  const [pointsData, setPointsData] = useState<PointsModel[]>([]);
  const [bonusUsername, setBonusUsername] = useState("");
  const [points, setPoints] = useState("");
  const [reviewUsername, setReviewUsername] = useState("");
  const [reviewPoints, setReviewPoints] = useState("");
  const [creditUsername, setCreditUsername] = useState("");
  const [submittingBonus, setSubmittingBonus] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [submittingCredit, setSubmittingCredit] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = pointsData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(pointsData.length / itemsPerPage);

  const fetchPoints = async () => {
    try {
      const response = await axiosInstance.get("/masters/points");
      const items = Array.isArray(response.data) ? response.data : [];
      setPointsData(items.filter((item) => item?.username));
      setCurrentPage(1);
    } catch (error) {
      console.log("Failed to fetch points", error);
      setPointsData([]);
    }
  };

  useEffect(() => {
    fetchPoints();
  }, []);

  const handleAddPoints = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!bonusUsername.trim()) {
      alert("Please enter user name.");
      return;
    }

    const pointValue = Number(points);
    if (!Number.isFinite(pointValue) || pointValue < 0) {
      alert("Please enter valid bonus points.");
      return;
    }

    try {
      setSubmittingBonus(true);
      const response = await axiosInstance.post("/masters/points/add", {
        username: bonusUsername.trim(),
        points: pointValue,
      });

      alert(response?.data?.message || "Points Add Successfully");
      setBonusUsername("");
      setPoints("");
      await fetchPoints();
    } catch (error) {
      console.log("Error saving points", error);
      alert("Unable to add points.");
    } finally {
      setSubmittingBonus(false);
    }
  };

  const handleAddReviewPoints = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!reviewUsername.trim()) {
      alert("Please enter user name or email.");
      return;
    }

    const pointValue = Number(reviewPoints);
    if (!Number.isFinite(pointValue) || pointValue < 0) {
      alert("Please enter valid review points.");
      return;
    }

    try {
      setSubmittingReview(true);
      const response = await axiosInstance.post("/masters/points/review", {
        username: reviewUsername.trim(),
        points: pointValue,
      });

      alert(response?.data?.message || "Review Points Added Successfully");
      setReviewUsername("");
      setReviewPoints("");
      await fetchPoints();
    } catch (error) {
      console.log("Error saving review points", error);
      alert("Unable to add review points.");
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleAddCredit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!creditUsername.trim()) {
      alert("Please enter user name.");
      return;
    }

    try {
      setSubmittingCredit(true);
      const response = await axiosInstance.post("/masters/points/credit", {
        username: creditUsername.trim(),
      });

      alert(response?.data?.message || "Credit Add Successfully");
      setCreditUsername("");
      await fetchPoints();
    } catch (error) {
      console.log("Error adding credit", error);
      alert("Unable to add credits against bonus points.");
    } finally {
      setSubmittingCredit(false);
    }
  };

  return (
    <div className="space-y-8 min-h-screen bg-gray-50/30 p-4 sm:p-6 dark:bg-gray-900/10">
      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:border-gray-800/60 dark:bg-gray-900/80 sm:p-8">
        <div className="mb-6">
          <p className="text-sm font-medium tracking-wider text-gray-500 uppercase">Overview</p>
          <h2 className="mt-1 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-2xl font-bold text-transparent dark:from-blue-400 dark:to-indigo-400">
            Add Bonus Points
          </h2>
        </div>

        <form onSubmit={handleAddPoints} className="grid gap-6 md:grid-cols-3 md:items-end">
          <InputGroup
            label="User Name"
            type="text"
            placeholder="Enter user name"
            value={bonusUsername}
            handleChange={(e) => setBonusUsername(e.target.value)}
          />

          <InputGroup
            label="Add Points"
            type="number"
            placeholder="Enter points"
            value={points}
            handleChange={(e) => setPoints(e.target.value)}
          />

          <div>
            <button
              type="submit"
              disabled={submittingBonus}
              className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70 sm:w-auto"
            >
              {submittingBonus ? "Adding..." : "Add Points"}
            </button>
          </div>
        </form>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:border-gray-800/60 dark:bg-gray-900/80 sm:p-8">
        <div className="mb-6">
          <h2 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-2xl font-bold text-transparent dark:from-blue-400 dark:to-indigo-400">
            Add Review Points
          </h2>
          <hr className="mt-4 border-gray-100 dark:border-gray-800" />
        </div>

        <form onSubmit={handleAddReviewPoints} className="grid gap-6 md:grid-cols-3 md:items-end">
          <InputGroup
            label="User Name / Email"
            type="text"
            placeholder="Enter user name or email"
            value={reviewUsername}
            handleChange={(e) => setReviewUsername(e.target.value)}
          />

          <InputGroup
            label="Add Points"
            type="number"
            placeholder="Enter points"
            value={reviewPoints}
            handleChange={(e) => setReviewPoints(e.target.value)}
          />

          <div>
            <button
              type="submit"
              disabled={submittingReview}
              className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70 sm:w-auto"
            >
              {submittingReview ? "Adding..." : "Add Points"}
            </button>
          </div>
        </form>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:border-gray-800/60 dark:bg-gray-900/80 sm:p-8">
        <div className="mb-6">
          <h2 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-2xl font-bold text-transparent dark:from-blue-400 dark:to-indigo-400">
            Add Credit Against Bonus Points
          </h2>
          <hr className="mt-4 border-gray-100 dark:border-gray-800" />
        </div>

        <form onSubmit={handleAddCredit} className="grid gap-6 md:grid-cols-3 md:items-end">
          <InputGroup
            label="User Name"
            type="text"
            placeholder="Enter user name"
            value={creditUsername}
            handleChange={(e) => setCreditUsername(e.target.value)}
          />

          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={submittingCredit}
              className="relative w-full overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 font-semibold text-white shadow-md transition-all duration-300 hover:scale-[1.02] hover:shadow-lg active:scale-[0.98] disabled:pointer-events-none disabled:opacity-70 sm:w-auto"
            >
              {submittingCredit ? "Adding..." : "Add Credits"}
            </button>
          </div>
        </form>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-white p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] dark:border-gray-800/60 dark:bg-gray-900/80 sm:p-8">
        <div className="mb-6">
          <h2 className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-2xl font-bold text-transparent dark:from-blue-400 dark:to-indigo-400">
            Clients Points
          </h2>
          <hr className="mt-4 border-gray-100 dark:border-gray-800" />
        </div>

        <div className="overflow-hidden rounded-xl border border-gray-100 dark:border-gray-800">
          <Table>
            <TableHeader>
              <TableRow className="border-none bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm [&>th]:py-4 [&>th]:text-base [&>th]:text-gray-700 [&>th]:dark:text-gray-300">
                <TableHead>Sr. No.</TableHead>
                <TableHead>User Name</TableHead>
                <TableHead>Bonus Points</TableHead>
                <TableHead>Feedback Points</TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {currentItems.map((item, index) => (
                <TableRow key={item.id} className="border-gray-100 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-900/50">
                  <TableCell className="font-medium">{indexOfFirstItem + index + 1}</TableCell>
                  <TableCell>{item.username || "-"}</TableCell>
                  <TableCell>{item.points ?? 0}</TableCell>
                  <TableCell>{item.feedback_points ?? 0}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {pointsData.length === 0 && (
          <div className="mt-8 flex flex-col items-center justify-center space-y-3 pb-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800">
              <svg className="h-8 w-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-gray-500 dark:text-gray-400">No Data Found</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-6 flex flex-col items-center justify-between gap-4 sm:flex-row">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Showing <span className="font-medium text-gray-900 dark:text-white">{indexOfFirstItem + 1}</span> to <span className="font-medium text-gray-900 dark:text-white">{Math.min(indexOfLastItem, pointsData.length)}</span> of <span className="font-medium text-gray-900 dark:text-white">{pointsData.length}</span> entries
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 hover:text-blue-600 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-blue-400"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                disabled={currentPage === totalPages}
                className="flex items-center rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50 hover:text-blue-600 disabled:pointer-events-none disabled:opacity-50 dark:border-gray-700 dark:hover:bg-gray-800 dark:hover:text-blue-400"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PointsPage;
