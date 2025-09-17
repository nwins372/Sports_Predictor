import React, { useState } from "react";

function SportsSelection() {
  const [selectedSport, setSelectedSport] = useState(null);

  const sports = [
    { name: "Basketball", img: "https://upload.wikimedia.org/wikipedia/commons/7/7a/Basketball.png" },
    { name: "Football", img: "https://upload.wikimedia.org/wikipedia/commons/a/a3/American_football_icon.png" },
    { name: "Tennis", img: "https://upload.wikimedia.org/wikipedia/commons/8/81/Tennis_ball_icon.svg" },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center p-6 font-sans">
      {/* ESPN Style Header */}
      <header className="w-full bg-red-700 text-white text-center py-4 shadow-md border-b-4 border-gray-800">
        <h1 className="text-3xl font-extrabold tracking-wide italic">
          ESPN Sports Hub
        </h1>
        <p className="text-sm uppercase text-gray-200">
          Select Your Favorite Sport
        </p>
      </header>

      {/* Selection Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-12 w-full max-w-4xl">
        {sports.map((sport) => (
          <div
            key={sport.name}
            onClick={() => setSelectedSport(sport.name)}
            className={`cursor-pointer bg-gray-900 border-4 ${
              selectedSport === sport.name ? "border-red-600" : "border-gray-700"
            } rounded-2xl shadow-lg hover:scale-105 transition transform duration-200 flex flex-col items-center p-6`}
          >
            <img src={sport.img} alt={sport.name} className="h-28 mb-4" />
            <h2 className="text-2xl font-bold uppercase">{sport.name}</h2>
          </div>
        ))}
      </div>

      {/* Selection Feedback */}
      {selectedSport && (
        <div className="mt-10 bg-red-800 text-white py-4 px-8 rounded-xl shadow-lg">
          <h3 className="text-xl font-bold italic">
            You selected: {selectedSport} 🏆
          </h3>
        </div>
      )}
    </div>
  );
}

export default SportsSelection;
