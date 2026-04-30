import { useState, useEffect } from 'react'
import { AlertForm } from './components/AlertForm'
import { LocationPopover } from './components/LocationPopover'
import { Alert, SearchFilters, DeliveryMethod, AREA_OPTIONS, AMENITIES_OPTIONS } from './types'
import { supabase, updateSupabaseConfig, getSavedConfig } from './lib/supabase'
import './App.css'

function App() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)
  
  // Dynamic config state
  const savedConfig = getSavedConfig()
  const [sbUrl, setSbUrl] = useState(savedConfig.url)
  const [sbKey, setSbKey] = useState(savedConfig.key)

  useEffect(() => {
    // Only try to get session if we have a valid config
    if (savedConfig.isValid) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchAlerts(session.user.id)
        }
      })

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchAlerts(session.user.id)
        } else {
          setAlerts([])
        }
      })

      return () => subscription.unsubscribe()
    }
  }, [])

  const fetchAlerts = async (userId: string) => {
    const { data, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching alerts:', error)
    } else {
      const parsedAlerts = (data || []).map(alert => ({
        ...alert,
        filters: typeof alert.filters === 'string' ? JSON.parse(alert.filters) : alert.filters
      }))
      setAlerts(parsedAlerts)
    }
  }

  const handleCreateAlert = async (data: { filters: SearchFilters; deliveryMethod: DeliveryMethod; email?: string; discordWebhookUrl?: string }) => {
    if (!user) {
      alert('Please sign in to create alerts.')
      return
    }

    setIsLoading(true)
    const { error } = await supabase.from('alerts').insert([
      {
        user_id: user.id,
        email: data.email,
        filters: data.filters,
        delivery_method: data.deliveryMethod,
        discord_webhook_url: data.discordWebhookUrl,
      },
    ])

    if (error) {
      alert('Error creating alert: ' + error.message)
    } else {
      fetchAlerts(user.id)
    }
    setIsLoading(false)
  }

  const toggleAlertStatus = async (alertId: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('alerts')
      .update({ is_active: !currentStatus })
      .eq('id', alertId)

    if (error) {
      alert('Error updating alert')
    } else {
      setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, is_active: !currentStatus } : a))
    }
  }

  const deleteAlert = async (alertId: string) => {
    const { error } = await supabase
      .from('alerts')
      .delete()
      .eq('id', alertId)

    if (error) {
      alert('Error deleting alert')
    } else {
      setAlerts(prev => prev.filter(a => a.id !== alertId))
    }
  }

  const handleSignIn = async () => {
    if (!sbUrl || !sbKey) {
      alert('Please provide your Supabase URL and Anon Key first.')
      return
    }

    const email = prompt('Enter your email address to receive a secure login link (no password required):')
    if (email) {
      try {
        // Update client with latest inputs before signing in
        updateSupabaseConfig(sbUrl, sbKey)
        
        const { error } = await supabase.auth.signInWithOtp({ 
          email,
          options: {
            emailRedirectTo: window.location.href,
          }
        })
        if (error) alert(error.message)
        else alert('Check your email for the secure login link!')
      } catch (e: any) {
        alert('Configuration error: ' + e.message)
      }
    }
  }

  const testNotification = async (alertId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be signed in to test notifications.');
        return;
      }

      const config = getSavedConfig();
      const response = await fetch(`${config.url}/functions/v1/check-alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': config.key
        },
        body: JSON.stringify({ action: 'test', alertId }),
      });

      if (response.ok) {
        alert('Test notification sent!');
      } else {
        const err = await response.json().catch(() => ({ message: 'Check if function is deployed' }));
        alert(`Deployment Error: ${err.error || err.message || 'Unknown error'}`);
      }
    } catch (e: any) {
      alert('Network error: ' + e.message);
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Alert ID copied to clipboard!');
  }

  return (
    <div className="container">
      <header>
        <div className="logo">
          <h1>StreetEasy Alert Helper</h1>
        </div>
        {user && (
          <div className="user-info">
            <span>{user.email}</span>
            <button 
              onClick={() => {
                const id = prompt('Enter Alert ID to test (copy from list below):');
                if (id) testNotification(id);
              }} 
              className="secondary-btn"
            >
              Test Notification
            </button>
            <button onClick={() => supabase.auth.signOut()} className="secondary-btn">Sign Out</button>
          </div>
        )}
      </header>

      {!user ? (
        <main className="landing">
          <div className="hero">
            <h2>Never miss a rental listing again.</h2>
            <p>Set custom filters and get instant Discord or Email alerts as soon as a match hits StreetEasy.</p>
            
            <div className="config-form">
              <div className="form-group">
                <label>Supabase Project URL</label>
                <input 
                  type="text" 
                  placeholder="https://xyz.supabase.co" 
                  value={sbUrl}
                  onChange={(e) => setSbUrl(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label>Anon Public Key</label>
                <input 
                  type="password" 
                  placeholder="your-anon-key" 
                  value={sbKey}
                  onChange={(e) => setSbKey(e.target.value)}
                />
              </div>
              <button onClick={handleSignIn} className="primary-btn lg">Sign In via Magic Link</button>
            </div>
            
            <p className="helper-text">
              Don't have these? You'll need to set up a Supabase project first. 
              <a href="https://supabase.com" target="_blank" rel="noreferrer"> Learn more</a>
            </p>
          </div>
        </main>
      ) : (
        <main className="dashboard">
          <section className="form-container">
            <AlertForm onSubmit={handleCreateAlert} isLoading={isLoading} />
          </section>

          <section className="list-container">
            <div className="section-header">
              <h3>Your Active Alerts</h3>
              <span className="count-badge">{alerts.length}</span>
            </div>
            
            {alerts.length === 0 ? (
              <div className="empty-state">
                <p>You haven't created any alerts yet. Use the form on the left to get started.</p>
              </div>
            ) : (
              <div className="alert-list">
                {alerts.map(alert => (
                  <div key={alert.id} className={`alert-card ${!alert.is_active ? 'inactive' : ''}`}>
                    <div className="alert-info">
                      <strong>
                        <LocationPopover areaIds={alert.filters?.areas} />
                      </strong>
                      <span className="price-tag">
                        {alert.filters?.price?.lowerBound ? `$${alert.filters.price.lowerBound.toLocaleString()}+` : 'Any price'} 
                        {alert.filters?.price?.upperBound ? ` up to $${alert.filters.price.upperBound.toLocaleString()}` : ''}
                      </span>
                      <div className="meta">
                        <span className="channel-tag">{alert.delivery_method}</span>
                        {alert.email && <span className="email-tag">{alert.email}</span>}
                        {alert.filters?.bedrooms?.lowerBound != null && (
                          <span>{alert.filters.bedrooms.lowerBound}+ Beds</span>
                        )}
                        {alert.filters?.amenities && alert.filters.amenities.length > 0 && (
                          <div className="amenities-list">
                            {alert.filters.amenities.map((val: string) => (
                              <span key={val} className="amenity-tag">
                                {AMENITIES_OPTIONS.find(o => o.value === val)?.label || val}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="alert-actions">
                      <div className="alert-id-container">
                        <small className="alert-id">ID: {alert.id.substring(0, 8)}...</small>
                        <button 
                          onClick={() => copyToClipboard(alert.id)}
                          className="copy-btn"
                          title="Copy full Alert ID"
                        >
                          📋
                        </button>
                      </div>
                      <div className="action-buttons-group">
                        <button 
                          onClick={() => toggleAlertStatus(alert.id, alert.is_active)}
                          className="action-btn"
                        >
                          {alert.is_active ? 'Pause' : 'Resume'}
                        </button>
                        <button onClick={() => deleteAlert(alert.id)} className="delete-btn icon">✕</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </main>
      )}
    </div>
  )
}

export default App
