import { doc, updateDoc, increment, getDoc, setDoc } from 'firebase/firestore'
import { db } from './firebase'

// Track profile view
export const trackProfileView = async (username) => {
  try {
    const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD

    // Get traffic source
    const referrer = document.referrer
    let source = 'Direct'
    if (referrer) {
      if (referrer.includes('instagram.com')) source = 'Instagram'
      else if (referrer.includes('tiktok.com')) source = 'TikTok'
      else if (referrer.includes('whatsapp.com')) source = 'WhatsApp'
      else if (referrer.includes('facebook.com')) source = 'Facebook'
      else if (referrer.includes('t.co') || referrer.includes('twitter.com')) source = 'Twitter/X'
      else source = new URL(referrer).hostname
    }

    // Get device type
    const ua = navigator.userAgent
    let device = 'Desktop'
    if (/tablet|ipad|playbook|silk/i.test(ua)) device = 'Tablet'
    else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Opera Mini/i.test(ua)) device = 'Mobile'

    // Fetch country (optional/silent)
    let country = 'Unknown'
    try {
      const response = await fetch('https://ipapi.co/json/').then(res => res.json())
      if (response && response.country_name) country = response.country_name
    } catch {
      console.warn('Could not fetch location')
    }

    // Get user ID from username
    const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()))
    if (!usernameDoc.exists()) return

    const uid = usernameDoc.data().uid
    const dailyRef = doc(db, 'users', uid, 'analytics', today)
    const dailyDoc = await getDoc(dailyRef)

    if (dailyDoc.exists()) {
      await updateDoc(dailyRef, {
        views: increment(1),
        [`sources.${source.replace(/\./g, '_')}`]: increment(1),
        [`devices.${device}`]: increment(1),
        [`countries.${country.replace(/\./g, '_')}`]: increment(1)
      })
    } else {
      await setDoc(dailyRef, {
        date: today,
        views: 1,
        clicks: 0,
        totalTime: 0,
        bounces: 0,
        sessions: 0,
        sources: { [source.replace(/\./g, '_')]: 1 },
        devices: { [device]: 1 },
        countries: { [country.replace(/\./g, '_')]: 1 }
      })
    }

    // Update totals in user doc
    await updateDoc(doc(db, 'users', uid), {
      'analytics.totalViews': increment(1),
      [`analytics.sources.${source.replace(/\./g, '_')}`]: increment(1),
      [`analytics.devices.${device}`]: increment(1)
    })
  } catch (error) {
    console.error('Error tracking profile view:', error)
  }
}

// Track link click
export const trackLinkClick = async (username, linkId) => {
  try {
    const today = new Date().toISOString().split('T')[0]

    // Get user ID from username
    const usernameDoc = await getDoc(doc(db, 'usernames', username.toLowerCase()))
    if (!usernameDoc.exists()) return

    const uid = usernameDoc.data().uid

    // Update total clicks
    await updateDoc(doc(db, 'users', uid), {
      'analytics.totalClicks': increment(1)
    })

    // Update daily clicks
    const dailyRef = doc(db, 'users', uid, 'analytics', today)
    const dailyDoc = await getDoc(dailyRef)

    if (dailyDoc.exists()) {
      await updateDoc(dailyRef, {
        clicks: increment(1),
        [`linkClicks.${linkId}`]: increment(1)
      })
    } else {
      await setDoc(dailyRef, {
        date: today,
        views: 0,
        clicks: 1,
        linkClicks: { [linkId]: 1 }
      })
    }

    // Update link-specific clicks in user document
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists()) {
      const userData = userDoc.data()
      const links = userData.links || []
      const updatedLinks = links.map(link => {
        if (link.id === linkId) {
          return { ...link, clicks: (link.clicks || 0) + 1 }
        }
        return link
      })
      await updateDoc(doc(db, 'users', uid), { links: updatedLinks })
    }
  } catch (error) {
    console.error('Error tracking link click:', error)
  }
}

// Track session end (time spent + bounce)
export const trackSessionEnd = async (uid, duration, hasClicked) => {
  if (!uid || duration <= 0) return

  try {
    const today = new Date().toISOString().split('T')[0]
    const dailyRef = doc(db, 'users', uid, 'analytics', today)

    const updates = {
      totalTime: increment(duration),
      sessions: increment(1)
    }

    if (!hasClicked) {
      updates.bounces = increment(1)
    }

    // Use non-awaited updates for better exit handling (though Firestore handles this internally)
    updateDoc(dailyRef, updates).catch(err => console.error('Error updating daily stats:', err))

    // Also update totals in user document
    updateDoc(doc(db, 'users', uid), {
      'analytics.totalTime': increment(duration),
      'analytics.totalSessions': increment(1),
      ...(hasClicked ? {} : { 'analytics.totalBounces': increment(1) })
    }).catch(err => console.error('Error updating total stats:', err))

  } catch (error) {
    console.error('Error tracking session end:', error)
  }
}

// Process pending sessions from localStorage
export const processSessionQueue = async () => {
  try {
    const queue = JSON.parse(localStorage.getItem('pending_sessions') || '[]')
    if (queue.length === 0) return

    localStorage.removeItem('pending_sessions')

    for (const session of queue) {
      const { uid, duration, hasClicked, date } = session
      const dailyRef = doc(db, 'users', uid, 'analytics', date)

      const updates = {
        totalTime: increment(duration),
        sessions: increment(1)
      }

      if (!hasClicked) {
        updates.bounces = increment(1)
      }

      // We use awaited calls here because we are already in a safe "on-load" context
      await updateDoc(dailyRef, updates)
      await updateDoc(doc(db, 'users', uid), {
        'analytics.totalTime': increment(duration),
        'analytics.totalSessions': increment(1),
        ...(hasClicked ? {} : { 'analytics.totalBounces': increment(1) })
      })
    }
  } catch (error) {
    console.error('Error processing session queue:', error)
  }
}

// Get analytics data for last N days
export const getAnalyticsData = async (uid, days = 7) => {
  try {
    const analyticsData = []
    const today = new Date()

    for (let i = days - 1; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      const dailyRef = doc(db, 'users', uid, 'analytics', dateStr)
      const dailyDoc = await getDoc(dailyRef)

      if (dailyDoc.exists()) {
        analyticsData.push({
          date: dateStr,
          ...dailyDoc.data()
        })
      } else {
        analyticsData.push({
          date: dateStr,
          views: 0,
          clicks: 0,
          totalTime: 0,
          bounces: 0,
          sessions: 0
        })
      }
    }

    return analyticsData
  } catch (error) {
    console.error('Error getting analytics data:', error)
    return []
  }
}

// Get total analytics
export const getTotalAnalytics = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid))
    if (userDoc.exists()) {
      const data = userDoc.data()
      return {
        totalViews: data.analytics?.totalViews || 0,
        totalClicks: data.analytics?.totalClicks || 0,
        totalTime: data.analytics?.totalTime || 0,
        totalSessions: data.analytics?.totalSessions || 0,
        totalBounces: data.analytics?.totalBounces || 0
      }
    }
    return { totalViews: 0, totalClicks: 0, totalTime: 0, totalSessions: 0, totalBounces: 0 }
  } catch (error) {
    console.error('Error getting total analytics:', error)
    return { totalViews: 0, totalClicks: 0, totalTime: 0, totalSessions: 0, totalBounces: 0 }
  }
}

