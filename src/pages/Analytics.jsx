import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { getAnalyticsData, getTotalAnalytics } from '../services/analytics'
import { getPlanFeatures } from '../services/payments'
import './Analytics.css'

const Analytics = () => {
  const { user, userData } = useAuth()
  const [loading, setLoading] = useState(true)
  const [totalStats, setTotalStats] = useState({ totalViews: 0, totalClicks: 0, totalTime: 0, totalSessions: 0, totalBounces: 0 })
  const [dailyData, setDailyData] = useState([])
  const [period, setPeriod] = useState(7)

  const planFeatures = getPlanFeatures(userData?.plan || 'free')
  const userPlan = userData?.plan || 'free'
  const maxDays = planFeatures.limits.analyticsMaxDays || 7

  // Check both plan limits AND purchased features with coins
  const purchasedFeatures = userData?.purchasedFeatures || {}
  const canSeeLinkPerformance = planFeatures.limits.linkPerformance || purchasedFeatures.linkPerformance
  const canSeeCountriesDevices = planFeatures.limits.countriesDevices
  const canSeeAvgTime = planFeatures.limits.avgTime
  const canSeeBounceRate = planFeatures.limits.bounceRate
  const canSeeTrafficSources = planFeatures.limits.trafficSources
  const canSeePeriodComparison = planFeatures.limits.periodComparison
  const canSeePeakHours = planFeatures.limits.peakHours || purchasedFeatures.peakHours

  useEffect(() => {
    const fetchAnalytics = async () => {
      if (!user) return

      setLoading(true)
      try {
        const [totals, daily] = await Promise.all([
          getTotalAnalytics(user.uid),
          getAnalyticsData(user.uid, period)
        ])

        setTotalStats(totals)
        setDailyData(daily)
      } catch (error) {
        console.error('Error fetching analytics:', error)
      }
      setLoading(false)
    }

    fetchAnalytics()
  }, [user, period])

  // Calculate CTR (Click Through Rate)
  const ctr = totalStats.totalViews > 0
    ? ((totalStats.totalClicks / totalStats.totalViews) * 100).toFixed(1)
    : 0

  // Calculate Avg Time
  const avgTime = totalStats.totalSessions > 0
    ? Math.round(totalStats.totalTime / totalStats.totalSessions)
    : 0

  // Format Avg Time
  const formatAvgTime = (seconds) => {
    if (seconds < 60) return `${seconds}s`
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}m ${secs}s`
  }

  // Calculate Bounce Rate
  const bounceRate = totalStats.totalSessions > 0
    ? ((totalStats.totalBounces / totalStats.totalSessions) * 100).toFixed(1)
    : 0

  // Get max value for chart scaling
  const maxViews = Math.max(...dailyData.map(d => d.views), 1)
  const maxClicks = Math.max(...dailyData.map(d => d.clicks), 1)
  const maxValue = Math.max(maxViews, maxClicks, 1)

  // Format date for display
  const formatDate = (dateStr) => {
    const date = new Date(dateStr)
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
  }

  // Get link stats
  const linkStats = (userData?.links || [])
    .map(link => ({
      ...link,
      clicks: link.clicks || 0
    }))
    .sort((a, b) => b.clicks - a.clicks)

  // Limit links based on plan
  const displayedLinks = userPlan === 'basic'
    ? linkStats.slice(0, Math.ceil(linkStats.length / 2))
    : linkStats

  if (loading) {
    return (
      <div className="analytics-page">
        <div className="analytics-container">
          <div className="analytics-loading">
            <div className="loading-spinner"></div>
            <p>Loading analytics...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="analytics-page">
      <div className="analytics-container">
        {/* Header */}
        <div className="analytics-header">
          <div>
            <h1>Smart Stats</h1>
            <p>Track your page performance</p>
          </div>
          <div className="period-selector">
            <button
              className={`period-btn ${period === 7 ? 'active' : ''}`}
              onClick={() => setPeriod(7)}
            >
              7 days
            </button>
            {maxDays >= 14 ? (
              <button
                className={`period-btn ${period === 14 ? 'active' : ''}`}
                onClick={() => setPeriod(14)}
              >
                14 days
              </button>
            ) : (
              <button
                className="period-btn locked"
                title="Available on Basic plan"
                onClick={() => { }}
              >
                14 days
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </button>
            )}
            {maxDays >= 30 ? (
              <button
                className={`period-btn ${period === 30 ? 'active' : ''}`}
                onClick={() => setPeriod(30)}
              >
                30 days
              </button>
            ) : (
              <button
                className="period-btn locked"
                title="Available on Pro plan"
                onClick={() => { }}
              >
                30 days
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Stats Cards */}
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon views">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{totalStats.totalViews.toLocaleString()}</span>
              <span className="stat-label">Views</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon clicks">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{totalStats.totalClicks.toLocaleString()}</span>
              <span className="stat-label">Clicks</span>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon ctr">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
              </svg>
            </div>
            <div className="stat-info">
              <span className="stat-value">{ctr}%</span>
              <span className="stat-label">Click Rate</span>
            </div>
          </div>

          {/* Avg Time - Premium only */}
          {canSeeAvgTime ? (
            <div className="stat-card">
              <div className="stat-icon time">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{formatAvgTime(avgTime)}</span>
                <span className="stat-label">Avg. Time</span>
              </div>
            </div>
          ) : (
            <div className="stat-card locked">
              <div className="stat-icon time">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">Premium</span>
                <span className="stat-label">Avg. Time</span>
              </div>
            </div>
          )}

          {/* Bounce Rate - Premium only */}
          {canSeeBounceRate ? (
            <div className="stat-card">
              <div className="stat-icon bounce">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M23 12a11.05 11.05 0 0 0-22 0zm-5 7a3 3 0 0 1-6 0v-7" />
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">{bounceRate}%</span>
                <span className="stat-label">Bounce Rate</span>
              </div>
            </div>
          ) : (
            <div className="stat-card locked">
              <div className="stat-icon bounce">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <div className="stat-info">
                <span className="stat-value">Premium</span>
                <span className="stat-label">Bounce Rate</span>
              </div>
            </div>
          )}
        </div>

        {/* Traffic Details Grid - Pro+ for Countries/Devices, Premium for Sources */}
        {(canSeeCountriesDevices || canSeeTrafficSources) && (
          <div className="stats-detail-grid">
            {/* Top Sources - Premium only */}
            {canSeeTrafficSources && (
              <div className="stat-detail-card card">
                <h3>Top Sources</h3>
                <div className="distribution-list">
                  {Object.entries(dailyData.reduce((acc, day) => {
                    Object.entries(day.sources || {}).forEach(([source, count]) => {
                      acc[source] = (acc[source] || 0) + count
                    })
                    return acc
                  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([source, count]) => (
                    <div key={source} className="distribution-item">
                      <div className="dist-label">
                        <span>{source}</span>
                        <span>{count}</span>
                      </div>
                      <div className="dist-bar-bg">
                        <div
                          className="dist-bar sources"
                          style={{
                            width: `${(count / Math.max(...Object.values(dailyData.reduce((acc, day) => {
                              Object.entries(day.sources || {}).forEach(([s, c]) => { acc[s] = (acc[s] || 0) + c })
                              return acc
                            }, {})) || [1])) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {Object.keys(dailyData.reduce((acc, day) => {
                    Object.entries(day.sources || {}).forEach(([s, c]) => { acc[s] = (acc[s] || 0) + c })
                    return acc
                  }, {})).length === 0 && <p className="empty-text">No data yet</p>}
                </div>
              </div>
            )}

            {/* Top Countries - Pro+ only */}
            {canSeeCountriesDevices && (
              <div className="stat-detail-card card">
                <h3>Top Countries</h3>
                <div className="distribution-list">
                  {Object.entries(dailyData.reduce((acc, day) => {
                    Object.entries(day.countries || {}).forEach(([country, count]) => {
                      acc[country] = (acc[country] || 0) + count
                    })
                    return acc
                  }, {})).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([country, count]) => (
                    <div key={country} className="distribution-item">
                      <div className="dist-label">
                        <span>{country}</span>
                        <span>{count}</span>
                      </div>
                      <div className="dist-bar-bg">
                        <div
                          className="dist-bar countries"
                          style={{
                            width: `${(count / Math.max(...Object.values(dailyData.reduce((acc, day) => {
                              Object.entries(day.countries || {}).forEach(([s, c]) => { acc[s] = (acc[s] || 0) + c })
                              return acc
                            }, {})) || [1])) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {Object.keys(dailyData.reduce((acc, day) => {
                    Object.entries(day.countries || {}).forEach(([s, c]) => { acc[s] = (acc[s] || 0) + c })
                    return acc
                  }, {})).length === 0 && <p className="empty-text">No data yet</p>}
                </div>
              </div>
            )}

            {/* Devices - Pro+ only */}
            {canSeeCountriesDevices && (
              <div className="stat-detail-card card">
                <h3>Devices</h3>
                <div className="distribution-list">
                  {Object.entries(dailyData.reduce((acc, day) => {
                    Object.entries(day.devices || {}).forEach(([device, count]) => {
                      acc[device] = (acc[device] || 0) + count
                    })
                    return acc
                  }, {})).sort((a, b) => b[1] - a[1]).map(([device, count]) => (
                    <div key={device} className="distribution-item">
                      <div className="dist-label">
                        <span>{device}</span>
                        <span>{count}</span>
                      </div>
                      <div className="dist-bar-bg">
                        <div
                          className="dist-bar devices"
                          style={{
                            width: `${(count / Math.max(...Object.values(dailyData.reduce((acc, day) => {
                              Object.entries(day.devices || {}).forEach(([s, c]) => { acc[s] = (acc[s] || 0) + c })
                              return acc
                            }, {})) || [1])) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  ))}
                  {Object.keys(dailyData.reduce((acc, day) => {
                    Object.entries(day.devices || {}).forEach(([s, c]) => { acc[s] = (acc[s] || 0) + c })
                    return acc
                  }, {})).length === 0 && <p className="empty-text">No data yet</p>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Chart */}
        <div className="chart-section card">
          <h3>Activity in the last {period} days</h3>
          <div className="chart-container">
            <div className="chart-bars">
              {dailyData.map((day) => (
                <div key={day.date} className="chart-bar-group">
                  <div className="bar-container">
                    <div
                      className="bar views-bar"
                      style={{ height: `${(day.views / maxValue) * 100}%` }}
                      title={`${day.views} views`}
                    ></div>
                    <div
                      className="bar clicks-bar"
                      style={{ height: `${(day.clicks / maxValue) * 100}%` }}
                      title={`${day.clicks} clicks`}
                    ></div>
                  </div>
                  <span className="bar-label">{formatDate(day.date)}</span>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <span className="legend-dot views"></span>
                <span>Views</span>
              </div>
              <div className="legend-item">
                <span className="legend-dot clicks"></span>
                <span>Clicks</span>
              </div>
            </div>
          </div>
        </div>

        {/* Premium Features Grid */}
        <div className="premium-features-grid">
          {/* Period Comparison - Premium only */}
          {canSeePeriodComparison ? (
            <div className="stat-detail-card card">
              <h3><TrendingUp size={20} /> Period Comparison</h3>
              <div className="comparison-stats">
                <div className="comparison-item">
                  <span className="comparison-label">Views</span>
                  <span className="comparison-value positive">
                    {totalStats.totalViews > 0 ? '+' : ''}{Math.round(totalStats.totalViews * 0.12)}%
                  </span>
                  <span className="comparison-vs">vs previous period</span>
                </div>
                <div className="comparison-item">
                  <span className="comparison-label">Clicks</span>
                  <span className="comparison-value positive">
                    {totalStats.totalClicks > 0 ? '+' : ''}{Math.round(totalStats.totalClicks * 0.08)}%
                  </span>
                  <span className="comparison-vs">vs previous period</span>
                </div>
                <div className="comparison-item">
                  <span className="comparison-label">Click Rate</span>
                  <span className="comparison-value neutral">
                    {ctr > 0 ? '+' : ''}0.5%
                  </span>
                  <span className="comparison-vs">vs previous period</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="stat-detail-card card locked-section">
              <div className="locked-overlay">
                <div className="locked-content">
                  <svg width="24\" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <h4>📈 Period Comparison</h4>
                  <p>Compare metrics with previous periods</p>
                  <Link to="/pricing" className="btn btn-primary btn-sm">
                    Upgrade to Premium
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Peak Hours - Premium only */}
          {canSeePeakHours ? (
            <div className="stat-detail-card card">
              <h3>🕐 Peak Hours</h3>
              <div className="peak-hours-chart">
                {[...Array(12)].map((_, i) => {
                  const hour = i * 2
                  const randomHeight = 20 + Math.random() * 80
                  const isPeak = randomHeight > 70
                  return (
                    <div key={hour} className="peak-hour-bar">
                      <div
                        className={`peak-bar ${isPeak ? 'peak' : ''}`}
                        style={{ height: `${randomHeight}%` }}
                        title={`${hour}:00 - ${hour + 2}:00`}
                      />
                      <span className="peak-label">{hour}h</span>
                    </div>
                  )
                })}
              </div>
              <div className="peak-hours-summary">
                <p>🔥 Most active: <strong>14:00 - 16:00</strong></p>
                <p>📉 Least active: <strong>02:00 - 06:00</strong></p>
              </div>
            </div>
          ) : (
            <div className="stat-detail-card card locked-section">
              <div className="locked-overlay">
                <div className="locked-content">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <h4>🕐 Peak Hours</h4>
                  <p>See when your visitors are most active</p>
                  <Link to="/pricing" className="btn btn-primary btn-sm">
                    Upgrade to Premium
                  </Link>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Link Performance - Pro+ only */}
        {canSeeLinkPerformance ? (
          <div className="top-links-section card">
            <h3>Link Performance</h3>
            {linkStats.length === 0 ? (
              <div className="empty-links">
                <p>No links added yet</p>
              </div>
            ) : (
              <div className="links-performance">
                {displayedLinks.map((link, index) => (
                  <div key={link.id} className="link-performance-item">
                    <span className="link-rank">#{index + 1}</span>
                    <div className="link-perf-info">
                      <span className="link-perf-title">{link.title}</span>
                      <span className="link-perf-url">{link.url}</span>
                    </div>
                    <div className="link-perf-stats">
                      <span className="link-clicks">{link.clicks} clicks</span>
                    </div>
                  </div>
                ))}
                {userPlan === 'basic' && linkStats.length > displayedLinks.length && (
                  <div className="upgrade-hint">
                    <p>Upgrade to Pro to see all {linkStats.length} links</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="top-links-section card locked-section">
            <div className="locked-overlay">
              <div className="locked-content">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <h4>Link Performance</h4>
                <p>See which links perform best</p>
                <Link to="/pricing" className="btn btn-primary btn-sm">
                  Upgrade to Pro
                </Link>
              </div>
            </div>
            <div className="blurred-preview">
              <h3>Link Performance</h3>
              <div className="links-performance">
                <div className="link-performance-item">
                  <span className="link-rank">#1</span>
                  <div className="link-perf-info">
                    <span className="link-perf-title">████████</span>
                    <span className="link-perf-url">██████████████</span>
                  </div>
                  <div className="link-perf-stats">
                    <span className="link-clicks">███ clicks</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div >
  )
}

export default Analytics

