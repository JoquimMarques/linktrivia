import { useEffect, useRef } from 'react'
import QRCodeStyled from 'qr-code-styling'
import './QRCodeCustom.css'

const QRCodeCustom = ({
    id,
    value,
    size = 256,
    userPhoto = null,
    primaryColor = '#0ea5e9',
    qrType = 'custom'
}) => {
    const qrRef = useRef(null)
    const qrCodeRef = useRef(null)

    useEffect(() => {
        const isStandard = qrType === 'standard'

        // Create new instance
        qrCodeRef.current = new QRCodeStyled({
            width: size,
            height: size,
            type: 'svg',
            data: value,
            image: isStandard ? null : userPhoto,
            margin: 0,
            qrOptions: {
                typeNumber: 0,
                mode: 'Byte',
                errorCorrectionLevel: 'H'
            },
            imageOptions: {
                hideBackgroundDots: true,
                imageSize: 0.3,
                margin: 2
            },
            dotsOptions: {
                color: isStandard ? '#000000' : primaryColor,
                type: isStandard ? 'square' : 'dots'
            },
            backgroundOptions: {
                color: '#ffffff',
            },
            cornersSquareOptions: {
                color: isStandard ? '#000000' : primaryColor,
                type: isStandard ? 'square' : 'extra-rounded'
            },
            cornersDotOptions: {
                color: isStandard ? '#000000' : primaryColor,
                type: isStandard ? 'square' : 'dot'
            }
        })

        if (qrRef.current) {
            qrRef.current.innerHTML = ''
            qrCodeRef.current.append(qrRef.current)

            // Apply the ID to the generated SVG so download logic keeps working
            const svg = qrRef.current.querySelector('svg')
            if (svg && id) {
                svg.id = id
            }
        }
    }, [value, size, userPhoto, primaryColor, id])

    return (
        <div className="qrcode-custom-wrapper">
            <div className="qrcode-custom-frame" ref={qrRef}>
                {/* The QR code will be appended here */}
            </div>
        </div>
    )
}

export default QRCodeCustom
