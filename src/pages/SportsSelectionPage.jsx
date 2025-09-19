import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

function SportsSelectionPage() {
  const navigate = useNavigate();
  const [selectedSports, setSelectedSports] = useState([]);

  const handleToggle = (sport) => {
    setSelectedSports((prev) =>
      prev.includes(sport) ? prev.filter((s) => s !== sport) : [...prev, sport]
    );
  };

  const handleSave = () => {
    // Save choice locally (simulate saving to DB)
    localStorage.setItem("userSports", JSON.stringify(selectedSports));

    // Mark onboarding complete
    localStorage.removeItem("isNewUser");

    navigate("/profile");
  };

  return (
    <div className="container mt-5">
      <h2>Select Your Favorite Sports</h2>
      <div className="list-group mt-3">
        {["Basketball", "Football", "Tennis"].map((sport) => (
          <button
            key={sport}
            className={`list-group-item list-group-item-action ${
              selectedSports.includes(sport) ? "active" : ""
            }`}
            onClick={() => handleToggle(sport)}
          >
            {sport}
          </button>
        ))}
      </div>

      <div className="mt-4 d-flex justify-content-end">
        <button className="btn btn-success" onClick={handleSave} disabled={!selectedSports.length}>
          Save & Continue
        </button>
      </div>
    </div>
  );
}

export default SportsSelectionPage;
