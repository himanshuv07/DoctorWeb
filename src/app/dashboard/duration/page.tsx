"use client";

import { useEffect, useState } from "react";
import axios from "@/lib/axios";

export default function DurationPage() {
  const [durations, setDurations] = useState<any[]>([]);
  const [value, setValue] = useState("");

  const fetchDurations = async () => {
    const res = await axios.get("/api/duration");
    setDurations(res.data);
  };

  useEffect(() => {
    fetchDurations();
  }, []);

  const addDuration = async () => {
    if (!value) return;

    await axios.post("/api/duration", { value });
    setValue("");
    fetchDurations();
  };

  const deleteDuration = async (id: number) => {
    await axios.delete(`/api/duration?id=${id}`);
    fetchDurations();
  };

  return (
    <div>
      <h2>Duration List</h2>

      <input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Enter duration"
      />

      <button onClick={addDuration}>Add</button>

      <table>
        <thead>
          <tr>
            <th>Value</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {durations.map((d) => (
            <tr key={d.id}>
              <td>{d.value} min</td>
              <td>
                <button onClick={() => deleteDuration(d.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}