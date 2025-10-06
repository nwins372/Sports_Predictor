import React from 'react';
import './WinPercentageDisplay.css';

const WinPercentageDisplay = ({ 
  homeTeam, 
  awayTeam, 
  homeScore, 
  awayScore, 
  homeWinProb, 
  awayWinProb, 
  gameStatus,
  showActualResult = true,
  confidence = null,
  algorithm = null,
  confidenceLevel = null
}) => {
  // Determine if the prediction was correct
  const getPredictionAccuracy = () => {
    if (!showActualResult || gameStatus !== 'Final' || homeScore === null || awayScore === null) {
      return null;
    }

    const predictedWinner = homeWinProb > awayWinProb ? 'home' : 'away';
    const actualWinner = homeScore > awayScore ? 'home' : 'away';
    
    return predictedWinner === actualWinner;
  };

  const predictionCorrect = getPredictionAccuracy();

  // Calculate prediction confidence (use provided or calculate)
  const getPredictionConfidence = () => {
    if (confidenceLevel) {
      return confidenceLevel;
    }
    
    if (confidence !== null) {
      if (confidence >= 0.3) return { level: 'High', color: '#22c55e', description: 'Very confident prediction' };
      if (confidence >= 0.15) return { level: 'Medium', color: '#f59e0b', description: 'Moderately confident' };
      return { level: 'Low', color: '#ef4444', description: 'Uncertain prediction' };
    }
    
    // Fallback to old calculation method
    const maxProb = Math.max(homeWinProb, awayWinProb);
    const minProb = Math.min(homeWinProb, awayWinProb);
    const calculatedConfidence = maxProb - minProb;
    
    if (calculatedConfidence >= 30) return { level: 'High', color: '#22c55e', description: 'Very confident prediction' };
    if (calculatedConfidence >= 15) return { level: 'Medium', color: '#f59e0b', description: 'Moderately confident' };
    return { level: 'Low', color: '#ef4444', description: 'Uncertain prediction' };
  };

  const predictionConfidence = getPredictionConfidence();

  // Get the winning team name
  const getWinningTeam = () => {
    if (gameStatus === 'Final' && homeScore !== null && awayScore !== null) {
      return homeScore > awayScore ? homeTeam : awayTeam;
    }
    return null;
  };

  const winningTeam = getWinningTeam();

  return (
    <div className="win-percentage-display">
      <div className="prediction-header">
        <h4>Win Probability Prediction</h4>
        <div className="prediction-meta">
          <div className="confidence-indicator" style={{ color: predictionConfidence.color }}>
            {predictionConfidence.level} Confidence
          </div>
          {algorithm && (
            <div className="algorithm-indicator">
              {algorithm.toUpperCase()} Algorithm
            </div>
          )}
          {gameStatus === 'Final' && showActualResult && (
            <div className={`prediction-accuracy ${predictionCorrect ? 'correct' : 'incorrect'}`}>
              {predictionCorrect ? '✓ Correct' : '✗ Incorrect'}
            </div>
          )}
        </div>
      </div>
      
      <div className="team-predictions">
        <div className="team-prediction home">
          <div className="team-name">{homeTeam}</div>
          <div className="win-percentage">
            <div className="percentage-bar">
              <div 
                className="percentage-fill home-fill" 
                style={{ width: `${homeWinProb}%` }}
              />
            </div>
            <span className="percentage-text">{homeWinProb}%</span>
          </div>
        </div>
        
        <div className="team-prediction away">
          <div className="team-name">{awayTeam}</div>
          <div className="win-percentage">
            <div className="percentage-bar">
              <div 
                className="percentage-fill away-fill" 
                style={{ width: `${awayWinProb}%` }}
              />
            </div>
            <span className="percentage-text">{awayWinProb}%</span>
          </div>
        </div>
      </div>

      {gameStatus === 'Final' && showActualResult && winningTeam && (
        <div className="actual-result">
          <div className="result-label">Actual Winner:</div>
          <div className="winner-name">{winningTeam}</div>
          <div className="final-score">
            {awayTeam}: {awayScore} - {homeTeam}: {homeScore}
          </div>
        </div>
      )}

      {gameStatus === 'Live' && (
        <div className="live-indicator">
          <span className="live-dot"></span>
          Live Game - Predictions may change
        </div>
      )}
    </div>
  );
};

export default WinPercentageDisplay;
