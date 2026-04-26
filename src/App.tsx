import { useState, useEffect } from 'react'
import { AlertForm } from './components/AlertForm'
import { Alert, SearchFilters, DeliveryMethod } from './types'
import { supabase } from './lib/supabase'
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
      setAlerts(data || [])
    }
  }

  const handleCreateAlert = async (data: { filters: SearchFilters; deliveryMethod: DeliveryMethod; discordWebhookUrl?: string }) => {
    if (!user) {
      alert('Please sign in to create alerts.')
      return
    }

    setIsLoading(true)
    const { error } = await supabase.from('alerts').insert([
      {
        user_id: user.id,
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
    const email = prompt('Enter your email for magic link:')
    if (email) {
      const { error } = await supabase.auth.signInWithOtp({ email })
      if (error) alert(error.message)
      else alert('Check your email for the login link!')
    }
  }

  return (
    <div className="container">
      <header>
        <h1>StreetEasy Alert Helper</h1>
        {!user ? (
          <button onClick={handleSignIn}>Sign In</button>
        ) : (
          <div className="user-info">
            <span>{user.email}</span>
            <button onClick={() => supabase.auth.signOut()}>Sign Out</button>
          </div>
        )}
      </header>

      <main className="main-content">
        <div className="sidebar">
          <AlertForm onSubmit={handleCreateAlert} isLoading={isLoading} />
        </div>

        <div className="content">
          <h3>Your Alerts</h3>
          {alerts.length === 0 ? (
            <p>No alerts created yet.</p>
          ) : (
            <div className="alert-list">
              {alerts.map(alert => (
                <div key={alert.id} className={`alert-card ${!alert.is_active ? 'inactive' : ''}`}>
                  <div className="alert-info">
                    <strong>
                      {alert.filters.areas.length > 0 ? alert.filters.areas.length + ' Areas' : 'All Areas'}
                    </strong>
                    <span>
                      {alert.filters.price.lowerBound ? `$${alert.filters.price.lowerBound}+` : 'Any price'} 
                      {alert.filters.price.upperBound ? ` up to $${alert.filters.price.upperBound}` : ''}
                    </span>
                    <small>Channel: {alert.delivery_method}</small>
                  </div>
                  <div className="alert-actions">
                    <button onClick={() => toggleAlertStatus(alert.id, alert.is_active)}>
                      {alert.is_active ? 'Pause' : 'Resume'}
                    </button>
                    <button onClick={() => deleteAlert(alert.id)} className="delete-btn">Delete</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default App
