import { doc, updateDoc, increment, arrayUnion, serverTimestamp } from 'firebase/firestore'
import { db } from './firebase'

// Coin packages available for purchase
export const COIN_PACKAGES = {
    starter: {
        id: 'starter',
        name: 'Starter',
        coins: 100,
        price: 0.99,
        currency: '€',
        discount: null,
        highlight: 'Para testar o sistema',
        paymentLink: 'https://buy.stripe.com/test_8x29AU70T46K60y8bmaR203'
    },
    popular: {
        id: 'popular',
        name: 'Popular',
        coins: 500,
        price: 3.99,
        currency: '€',
        discount: '20% off',
        highlight: '🏆 Mais Vendido',
        badge: 'popular',
        paymentLink: 'https://buy.stripe.com/test_14A6oIdph1YC60ydvGaR204'
    },
    bestValue: {
        id: 'bestValue',
        name: 'Best Value',
        coins: 1200,
        price: 6.99,
        currency: '€',
        discount: '30% off',
        highlight: '💎 Melhor Custo-Benefício',
        badge: 'best',
        paymentLink: 'https://buy.stripe.com/test_4gM7sMbh9gTw4WuajuaR205'
    },
    mega: {
        id: 'mega',
        name: 'Mega',
        coins: 2500,
        price: 12.99,
        currency: '€',
        discount: '35% off',
        highlight: 'Para usuários avançados',
        paymentLink: 'https://buy.stripe.com/test_4gM00kcld7iW1KicrCaR206'
    }
}

// Store items that can be purchased with coins
export const STORE_ITEMS = {
    theme_neon: {
        id: 'theme_neon',
        type: 'theme',
        name: 'Tema Neon',
        description: 'Tema com cores vibrantes neon',
        price: 50,
        icon: '🎨',
        themeId: 'neon'
    },
    theme_sunset: {
        id: 'theme_sunset',
        type: 'theme',
        name: 'Tema Sunset',
        description: 'Gradiente quente de pôr do sol',
        price: 50,
        icon: '🌅',
        themeId: 'sunset'
    },
    theme_ocean: {
        id: 'theme_ocean',
        type: 'theme',
        name: 'Tema Ocean',
        description: 'Tons calmos de azul oceano',
        price: 50,
        icon: '🌊',
        themeId: 'ocean'
    },
    theme_galaxy: {
        id: 'theme_galaxy',
        type: 'theme',
        name: 'Tema Galaxy',
        description: 'Tema espacial com estrelas',
        price: 50,
        icon: '🌌',
        themeId: 'galaxy'
    },
    extra_links: {
        id: 'extra_links',
        type: 'links',
        name: '+5 Links',
        description: 'Adiciona 5 links ao limite do seu perfil',
        price: 100,
        icon: '🔗',
        linksToAdd: 5
    },
    link_performance: {
        id: 'link_performance',
        type: 'feature',
        name: 'Link Performance',
        description: 'Veja quais links performam melhor',
        price: 200,
        icon: '📊',
        feature: 'linkPerformance'
    },
    peak_hours: {
        id: 'peak_hours',
        type: 'feature',
        name: 'Peak Hours',
        description: 'Veja quando seus visitantes estão mais ativos',
        price: 600,
        icon: '🕐',
        feature: 'peakHours'
    }
}

// Add coins to user account
export const addCoins = async (userId, amount) => {
    try {
        await updateDoc(doc(db, 'users', userId), {
            coins: increment(amount),
            updatedAt: serverTimestamp()
        })
        return { success: true }
    } catch (error) {
        console.error('Error adding coins:', error)
        return { success: false, error: error.message }
    }
}

// Spend coins on an item
export const purchaseItem = async (userId, itemId, currentCoins) => {
    const item = STORE_ITEMS[itemId]
    if (!item) {
        return { success: false, error: 'Item not found' }
    }

    if (currentCoins < item.price) {
        return { success: false, error: 'Not enough coins' }
    }

    try {
        const userRef = doc(db, 'users', userId)

        // Deduct coins and record purchase
        const updateData = {
            coins: increment(-item.price),
            purchasedItems: arrayUnion(itemId),
            updatedAt: serverTimestamp()
        }

        // Handle item type-specific updates
        if (item.type === 'links') {
            updateData.extraLinks = increment(item.linksToAdd)
        } else if (item.type === 'feature') {
            updateData[`purchasedFeatures.${item.feature}`] = true
        } else if (item.type === 'theme') {
            updateData.purchasedThemes = arrayUnion(item.themeId)
        }

        await updateDoc(userRef, updateData)

        return { success: true, item }
    } catch (error) {
        console.error('Error purchasing item:', error)
        return { success: false, error: error.message }
    }
}

// Check if user has purchased an item
export const hasItemPurchased = (userData, itemId) => {
    return userData?.purchasedItems?.includes(itemId) || false
}

// Check if user has purchased a feature
export const hasFeaturePurchased = (userData, feature) => {
    return userData?.purchasedFeatures?.[feature] || false
}

// Get user's coin balance
export const getCoinBalance = (userData) => {
    return userData?.coins || 0
}

// Get user's extra link slots
export const getExtraLinks = (userData) => {
    return userData?.extraLinks || 0
}

// Redirect to coin purchase
export const redirectToCoinPurchase = (packageId, userEmail, userId) => {
    const pkg = COIN_PACKAGES[packageId]
    if (!pkg || !pkg.paymentLink) {
        console.error('Package not found or no payment link:', packageId)
        return
    }

    const paymentUrl = new URL(pkg.paymentLink)

    if (userEmail) {
        paymentUrl.searchParams.set('prefilled_email', userEmail)
    }

    if (userId) {
        paymentUrl.searchParams.set('client_reference_id', `${userId}_coins_${packageId}`)
    }

    window.location.href = paymentUrl.toString()
}
