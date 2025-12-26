import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import {
    COIN_PACKAGES,
    STORE_ITEMS,
    purchaseItem,
    getCoinBalance,
    hasItemPurchased,
    redirectToCoinPurchase,
    addCoins
} from '../services/coins'
import './Store.css'

const Store = () => {
    const { user, userData, refreshUserData } = useAuth()
    const [searchParams, setSearchParams] = useSearchParams()
    const [purchasing, setPurchasing] = useState(null)
    const [showSuccess, setShowSuccess] = useState(false)
    const [successMessage, setSuccessMessage] = useState('')

    const coinBalance = getCoinBalance(userData)
    const isAuthenticated = !!user

    // Handle coin purchase redirect from Stripe
    useEffect(() => {
        const coinsParam = searchParams.get('coins')

        const processCoinPurchase = async () => {
            if (coinsParam && user?.uid) {
                const coinsAmount = parseInt(coinsParam, 10)
                if (coinsAmount > 0) {
                    const result = await addCoins(user.uid, coinsAmount)
                    if (result.success) {
                        setSuccessMessage(`🪙 ${coinsAmount} moedas adicionadas à sua conta!`)
                        setShowSuccess(true)
                        await refreshUserData()
                        setTimeout(() => setShowSuccess(false), 5000)
                    }
                    // Remove query params
                    setSearchParams({})
                }
            }
        }

        processCoinPurchase()
    }, [searchParams, setSearchParams, user, refreshUserData])

    const handleBuyCoins = (packageId) => {
        if (!isAuthenticated) return
        redirectToCoinPurchase(packageId, user.email, user.uid)
    }

    const handlePurchaseItem = async (itemId) => {
        if (!isAuthenticated || purchasing) return

        const item = STORE_ITEMS[itemId]
        if (coinBalance < item.price) {
            alert('Moedas insuficientes! Compre mais moedas para continuar.')
            return
        }

        if (hasItemPurchased(userData, itemId)) {
            alert('Você já comprou este item!')
            return
        }

        const confirmPurchase = window.confirm(
            `Deseja comprar "${item.name}" por ${item.price} moedas?`
        )

        if (!confirmPurchase) return

        setPurchasing(itemId)

        const result = await purchaseItem(user.uid, itemId, coinBalance)

        if (result.success) {
            setSuccessMessage(`${item.icon} ${item.name} desbloqueado!`)
            setShowSuccess(true)
            await refreshUserData()
            setTimeout(() => setShowSuccess(false), 3000)
        } else {
            alert(`Erro: ${result.error}`)
        }

        setPurchasing(null)
    }

    // Group store items by type
    const themes = Object.values(STORE_ITEMS).filter(item => item.type === 'theme')
    const features = Object.values(STORE_ITEMS).filter(item => item.type === 'feature' || item.type === 'links')

    return (
        <div className="store-page">
            <div className="store-container">
                {/* Header */}
                <div className="store-header">
                    <div>
                        <h1>🏪 Loja</h1>
                        <p>Compre moedas e desbloqueie itens exclusivos</p>
                    </div>
                    <div className="coin-balance-display">
                        <span className="coin-icon">🪙</span>
                        <span className="coin-amount">{coinBalance.toLocaleString()}</span>
                        <span className="coin-label">moedas</span>
                    </div>
                </div>

                {/* Success Notification */}
                {showSuccess && (
                    <div className="purchase-success">
                        <span>✅ {successMessage}</span>
                    </div>
                )}

                {/* Coin Packages Section */}
                <section className="store-section">
                    <h2>💰 Pacotes de Moedas</h2>
                    <p className="section-subtitle">Compre moedas para desbloquear itens na loja</p>

                    <div className="coin-packages-grid">
                        {Object.values(COIN_PACKAGES).map((pkg) => (
                            <div
                                key={pkg.id}
                                className={`coin-package-card ${pkg.badge || ''}`}
                            >
                                {pkg.badge && (
                                    <span className={`package-badge ${pkg.badge}`}>
                                        {pkg.badge === 'popular' ? '🏆 Mais Vendido' : '💎 Melhor Valor'}
                                    </span>
                                )}
                                <div className="package-coins">
                                    <span className="coin-icon-large">🪙</span>
                                    <span className="coins-amount">{pkg.coins.toLocaleString()}</span>
                                </div>
                                <div className="package-name">{pkg.name}</div>
                                {pkg.discount && (
                                    <span className="package-discount">{pkg.discount}</span>
                                )}
                                <div className="package-price">
                                    <span className="currency">{pkg.currency}</span>
                                    <span className="amount">{pkg.price.toFixed(2).replace('.', ',')}</span>
                                </div>
                                <p className="package-highlight">{pkg.highlight}</p>

                                {isAuthenticated ? (
                                    <button
                                        className="btn btn-primary buy-btn"
                                        onClick={() => handleBuyCoins(pkg.id)}
                                    >
                                        Comprar
                                    </button>
                                ) : (
                                    <Link to="/register" className="btn btn-primary buy-btn">
                                        Criar Conta
                                    </Link>
                                )}
                            </div>
                        ))}
                    </div>
                </section>

                {/* Themes Section */}
                <section className="store-section">
                    <h2>🎨 Temas Premium</h2>
                    <p className="section-subtitle">Personalize seu perfil com temas exclusivos</p>

                    <div className="store-items-grid">
                        {themes.map((item) => {
                            const isPurchased = hasItemPurchased(userData, item.id)
                            const canAfford = coinBalance >= item.price

                            return (
                                <div key={item.id} className={`store-item-card ${isPurchased ? 'purchased' : ''}`}>
                                    <div className="item-icon">{item.icon}</div>
                                    <div className="item-info">
                                        <h3>{item.name}</h3>
                                        <p>{item.description}</p>
                                    </div>
                                    <div className="item-price">
                                        <span className="coin-icon-small">🪙</span>
                                        <span>{item.price}</span>
                                    </div>

                                    {isPurchased ? (
                                        <button className="btn btn-success item-btn" disabled>
                                            ✓ Desbloqueado
                                        </button>
                                    ) : (
                                        <button
                                            className={`btn item-btn ${canAfford ? 'btn-primary' : 'btn-disabled'}`}
                                            onClick={() => handlePurchaseItem(item.id)}
                                            disabled={!canAfford || purchasing === item.id}
                                        >
                                            {purchasing === item.id ? 'Comprando...' : canAfford ? 'Comprar' : 'Moedas Insuficientes'}
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* Features Section */}
                <section className="store-section">
                    <h2>⚡ Funcionalidades</h2>
                    <p className="section-subtitle">Desbloqueie recursos avançados para seu perfil</p>

                    <div className="store-items-grid">
                        {features.map((item) => {
                            const isPurchased = hasItemPurchased(userData, item.id)
                            const canAfford = coinBalance >= item.price

                            return (
                                <div key={item.id} className={`store-item-card feature-card ${isPurchased ? 'purchased' : ''}`}>
                                    <div className="item-icon">{item.icon}</div>
                                    <div className="item-info">
                                        <h3>{item.name}</h3>
                                        <p>{item.description}</p>
                                    </div>
                                    <div className="item-price">
                                        <span className="coin-icon-small">🪙</span>
                                        <span>{item.price}</span>
                                    </div>

                                    {isPurchased ? (
                                        <button className="btn btn-success item-btn" disabled>
                                            ✓ Desbloqueado
                                        </button>
                                    ) : (
                                        <button
                                            className={`btn item-btn ${canAfford ? 'btn-primary' : 'btn-disabled'}`}
                                            onClick={() => handlePurchaseItem(item.id)}
                                            disabled={!canAfford || purchasing === item.id}
                                        >
                                            {purchasing === item.id ? 'Comprando...' : canAfford ? 'Comprar' : 'Moedas Insuficientes'}
                                        </button>
                                    )}
                                </div>
                            )
                        })}
                    </div>
                </section>

                {/* Info */}
                <div className="store-info">
                    <p>💡 As moedas e itens comprados são permanentes e ficam na sua conta.</p>
                    <p>🔒 Pagamentos seguros via Stripe.</p>
                </div>
            </div>
        </div>
    )
}

export default Store
