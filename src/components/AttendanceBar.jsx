import React from 'react'

export default function AttendanceBar({ pct, settings }) {
  const color = pct < (settings?.thresholdCritical || 75) ? '#dc2626'
               : pct < (settings?.thresholdWarning  || 85) ? '#d97706'
               : '#16a34a'
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: 13 }}>
        <span style={{ color }}>{pct}%</span>
        <span style={{ color: '#9ca3af', fontSize: 11 }}>
          {pct < (settings?.thresholdCritical || 75) ? '⚠ Critical'
          : pct < (settings?.thresholdWarning  || 85) ? '△ Warning'
          : '✓ Good'}
        </span>
      </div>
      <div className="attendance-bar">
        <div className="attendance-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  )
}
