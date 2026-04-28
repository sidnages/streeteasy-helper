import { useState, useEffect } from 'react'
import { AlertForm } from './components/AlertForm'
import { Alert, SearchFilters, DeliveryMethod, AREA_OPTIONS, AMENITIES_OPTIONS } from './types'
import { supabase, SUPABASE_CONFIG } from './lib/supabase'
import './App.css'

function App() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
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
    const email = prompt('Enter your email address to receive a secure login link (no password required):')
    if (email) {
      const { error } = await supabase.auth.signInWithOtp({ 
        email,
        options: {
          emailRedirectTo: window.location.href,
        }
      })
      if (error) alert(error.message)
      else alert('Check your email for the secure login link!')
    }
  }

  const testNotification = async (alertId: string) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be signed in to test notifications.');
        return;
      }

      const response = await fetch(`${SUPABASE_CONFIG.url}/functions/v1/check-alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
          'apikey': SUPABASE_CONFIG.key
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
            <button onClick={handleSignIn} className="primary-btn lg">Sign In via Magic Link</button>
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
                        {(() => {
                          if (!alert.filters?.areas || !Array.isArray(alert.filters.areas) || alert.filters.areas.length === 0) {
                            return 'All Areas';
                          }
                          
                          const allPossibleNeighborhoods = AREA_OPTIONS.flatMap(b => b.neighborhoods || []);
                          const selectedLabels = alert.filters.areas.map((id: number) => {
                            const found = allPossibleNeighborhoods.find(n => n.value === id) || AREA_OPTIONS.find(b => b.value === id);
                            return found?.label || `Area ${id}`;
                          });

                          if (selectedLabels.length <= 5) {
                            return selectedLabels.join(', ');
                          }
                          return `${selectedLabels.slice(0, 5).join(', ')} +${selectedLabels.length - 5} more`;
                        })()}
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
