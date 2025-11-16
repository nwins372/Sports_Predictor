import React, { useState, useEffect } from 'react';
import schedulerService from '../services/schedulerService';
import './ScoreUpdateStatus.css';
import { TranslatedText } from './TranslatedText';

const ScoreUpdateStatus = ({ sport, onForceUpdate }) => {
  const [status, setStatus] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const updateStatus = () => {
      setStatus(schedulerService.getStatus());
    };

    // Initial status
    updateStatus();

    // Update status every 30 seconds
    const interval = setInterval(updateStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!status) return null;

  const formatTime = (date) => {
    if (!date) return 'Never';
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  const getStatusColor = () => {
    if (!status.isActive) return '#6b7280';
    if (status.registeredSports.includes(sport)) return '#10b981';
    return '#f59e0b';
  };

  const getStatusText = () => {
    if (!status.isActive) return 'Inactive';
    if (status.registeredSports.includes(sport)) return 'Active';
    return 'Standby';
  };

  return (
    <div className="score-update-status">
      <div 
        className="status-header"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="status-indicator">
          <div 
            className="status-dot" 
            style={{ backgroundColor: getStatusColor() }}
          />
          <span className="status-text">
            <TranslatedText>Auto Updates: {getStatusText()}</TranslatedText>
          </span>
        </div>
        
        <div className="status-actions">
          <button 
            className="force-update-btn"
            onClick={(e) => {
              e.stopPropagation();
              onForceUpdate();
            }}
            title="Force immediate update"
          >
            🔄
          </button>
          <span className="expand-icon">
            {isExpanded ? '▼' : '▶'}
          </span>
        </div>
      </div>

      {isExpanded && (
        <div className="status-details">
          <div className="status-row">
            <span className="label"><TranslatedText>Last Update:</TranslatedText></span>
            <span className="value">{formatTime(status.lastUpdate)}</span>
          </div>
          
          <div className="status-row">
            <span className="label"><TranslatedText>Next Update:</TranslatedText></span>
            <span className="value">
              {schedulerService.getFormattedTimeUntilNextUpdate()}
            </span>
          </div>
          
          <div className="status-row">
            <span className="label"><TranslatedText>Update Hours:</TranslatedText></span>
            <span className="value">
              {status.updateHours.map(hour => 
                hour === 12 ? '12 PM' : 
                hour > 12 ? `${hour - 12} PM` : 
                `${hour} AM`
              ).join(', ')}
            </span>
          </div>
          
          <div className="status-row">
            <span className="label"><TranslatedText>Registered Sports:</TranslatedText></span>
            <span className="value">
              {status.registeredSports.length > 0 
                ? status.registeredSports.join(', ').toUpperCase()
                : 'None'
              }
            </span>
          </div>
          
          <div className="status-row">
            <span className="label"><TranslatedText>Active Intervals:</TranslatedText></span>
            <span className="value">{status.activeIntervals}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScoreUpdateStatus;
