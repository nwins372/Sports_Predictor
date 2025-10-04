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
  showActualResult = true 
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

  // Calculate prediction confidence
  const getPredictionConfidence = () => {
    const maxProb = Math.max(homeWinProb, awayWinProb);
    const minProb = Math.min(homeWinProb, awayWinProb);
    const confidence = maxProb - minProb;
    
    if (confidence >= 30) return { level: 'High', color: '#22c55e' };
    if (confidence >= 15) return { level: 'Medium', color: '#f59e0b' };
    return { level: 'Low', color: '#ef4444' };
  };

  const confidence = getPredictionConfidence();

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
          <div className="confidence-indicator" style={{ color: confidence.color }}>
            {confidence.level} Confidence
          </div>
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
