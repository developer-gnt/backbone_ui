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
}

const PointsPage = () => {
  const [pointsData, setPointsData] = useState<PointsModel[]>([]);
  const [bonusUsername, setBonusUsername] = useState("");
  const [points, setPoints] = useState("");
  const [creditUsername, setCreditUsername] = useState("");
  const [submittingBonus, setSubmittingBonus] = useState(false);
  const [submittingCredit, setSubmittingCredit] = useState(false);

  const fetchPoints = async () => {
    try {
      const response = await axiosInstance.get("/masters/points");
      const items = Array.isArray(response.data) ? response.data : [];
      setPointsData(items.filter((item) => item?.username));
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
    <div className="space-y-6">
      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
        <div className="mb-6">
          <p className="text-sm text-dark-5">Overview</p>
          <h2 className="text-xl font-semibold text-dark dark:text-white">
            Master <span className="font-normal">Add bonus points</span>
          </h2>
        </div>

        <form onSubmit={handleAddPoints} className="grid gap-5 md:grid-cols-3 md:items-end">
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
              className="rounded-md bg-primary px-5 py-2 text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {submittingBonus ? "Adding..." : "Add Points"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-dark dark:text-white">
            Add Credit Against bonus points
          </h2>
          <hr className="mt-3 border-stroke dark:border-dark-3" />
        </div>

        <form onSubmit={handleAddCredit} className="grid gap-5 md:grid-cols-3 md:items-end">
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
              className="rounded-md bg-primary px-5 py-2 text-white hover:bg-primary/90 disabled:opacity-60"
            >
              {submittingCredit ? "Adding..." : "Add Credits"}
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-[10px] border border-stroke bg-white p-6 shadow-1 dark:border-dark-3 dark:bg-gray-dark dark:shadow-card sm:p-7.5">
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-dark dark:text-white">
            Clients Points
          </h2>
          <hr className="mt-3 border-stroke dark:border-dark-3" />
        </div>

        <Table>
          <TableHeader>
            <TableRow className="border-none bg-[#F7F9FC] dark:bg-dark-2 [&>th]:py-4 [&>th]:text-base [&>th]:text-dark [&>th]:dark:text-white">
              <TableHead>Sr. No.</TableHead>
              <TableHead>User Name</TableHead>
              <TableHead>Bonus Points</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {pointsData.map((item, index) => (
              <TableRow key={item.id} className="border-[#eee] dark:border-dark-3">
                <TableCell>{index + 1}</TableCell>
                <TableCell>{item.username || "-"}</TableCell>
                <TableCell>{item.points ?? 0}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>

        {pointsData.length === 0 && (
          <p className="mt-4 text-center text-gray-500 dark:text-gray-300">
            No Data Found !
          </p>
        )}
      </div>
    </div>
  );
};

export default PointsPage;
