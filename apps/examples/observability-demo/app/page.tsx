/**
 * Demo Page for Observability Testing
 * 
 * This page demonstrates various observability features.
 */

'use client'

import { useEffect, useState } from 'react'

export default function ObservabilityDemo() {
  const [logs, setLogs] = useState<string[]>([])
  const [traces, setTraces] = useState<string[]>([])

  useEffect(() => {
    // Add client-side logs to demonstrate logging
    const addLog = (message: string) => {
      setLogs(prev => [...prev, `${new Date().toISOString()}: ${message}`])
    }

    addLog('Observability demo page loaded')
    
    // Test various observability features (these will work once server-side is initialized)
    const testObservability = async () => {
      try {
        // This would normally make API calls that generate traces
        addLog('Testing API calls...')
        
        // Simulate API call
        const response = await fetch('/api/test-observability')
        if (response.ok) {
          addLog('API call successful')
          const data = await response.json()
          setTraces(data.traces || [])
        } else {
          addLog('API call failed')
        }
      } catch (error) {
        addLog(`Error: ${error}`)
      }
    }

    // Test after a short delay
    setTimeout(testObservability, 1000)
  }, [])

  return (
    <div style={{ padding: '2rem', fontFamily: 'monospace' }}>
      <h1>Observability Demo</h1>
      
      <div style={{ marginBottom: '2rem' }}>
        <h2>Environment Status</h2>
        <p><strong>Node Environment:</strong> {process.env.NODE_ENV}</p>
        <p><strong>Observability Enabled:</strong> {process.env.OBSERVABILITY_ENABLED || 'false'}</p>
        <p><strong>Service Name:</strong> {process.env.OTEL_SERVICE_NAME || 'Not set'}</p>
        <p><strong>Sentry DSN:</strong> {process.env.SENTRY_DSN ? 'Set' : 'Not set'}</p>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Client Logs</h2>
        <div style={{ 
          background: '#f5f5f5', 
          padding: '1rem', 
          borderRadius: '4px',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          {logs.length === 0 ? (
            <p>No logs yet...</p>
          ) : (
            logs.map((log, index) => (
              <div key={index}>{log}</div>
            ))
          )}
        </div>
      </div>

      <div style={{ marginBottom: '2rem' }}>
        <h2>Server-Side Traces</h2>
        <div style={{ 
          background: '#f5f5f5', 
          padding: '1rem', 
          borderRadius: '4px',
          maxHeight: '200px',
          overflow: 'auto'
        }}>
          {traces.length === 0 ? (
            <p>No traces received from server...</p>
          ) : (
            traces.map((trace, index) => (
              <div key={index}>{trace}</div>
            ))
          )}
        </div>
      </div>

      <div>
        <h2>Test Actions</h2>
        <button 
          onClick={() => {
            fetch('/api/test-error').catch(err => {
              setLogs(prev => [...prev, `Test error: ${err}`])
            })
          }}
          style={{ 
            marginRight: '1rem', 
            padding: '0.5rem 1rem',
            background: '#ff4444',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Error Tracking
        </button>
        
        <button 
          onClick={() => {
            fetch('/api/test-metrics').catch(err => {
              setLogs(prev => [...prev, `Test metrics: ${err}`])
            })
          }}
          style={{ 
            padding: '0.5rem 1rem',
            background: '#4444ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Test Metrics
        </button>
      </div>
    </div>
  )
}
