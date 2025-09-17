
"use client";

import { useTheme } from '@/contexts/ThemeContext';
import React, { useEffect, useRef, memo } from 'react';

const _TradingViewWidget: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const scriptRef = useRef<HTMLScriptElement | null>(null);
    const { theme } = useTheme();

    // Effect for creating the widget script, runs only once on mount
    useEffect(() => {
        if (!containerRef.current || containerRef.current.hasChildNodes()) {
            return;
        }

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
        script.async = true;
        script.type = 'text/javascript';
        scriptRef.current = script; // Store the script element in a ref

        // The widget configuration is appended inside the script's innerHTML
        script.innerHTML = JSON.stringify({
            "colorTheme": theme,
            "dateRange": "12M",
            "locale": "br",
            "largeChartUrl": "",
            "isTransparent": true,
            "showFloatingTooltip": true,
            "plotLineColorGrowing": "rgba(0, 166, 126, 1)",
            "plotLineColorFalling": "rgba(221, 51, 51, 1)",
            "gridLineColor": "rgba(240, 243, 250, 0)",
            "scaleFontColor": theme === 'dark' ? "rgba(209, 213, 219, 1)" : "#0F0F0F",
            "belowLineFillColorGrowing": "rgba(0, 166, 126, 0.12)",
            "belowLineFillColorFalling": "rgba(221, 51, 51, 0.12)",
            "belowLineFillColorGrowingBottom": "rgba(41, 98, 255, 0)",
            "belowLineFillColorFallingBottom": "rgba(41, 98, 255, 0)",
            "symbolActiveColor": "rgba(0, 166, 126, 0.12)",
            "tabs": [
                {
                    "title": "Índices",
                    "symbols": [
                        { "s": "BMFBOVESPA:IBOV", "d": "Ibovespa" },
                        { "s": "SP:SPX", "d": "S&P 500 Index" },
                        { "s": "TVC:DJI", "d": "Dow Jones" },
                        { "s": "BMFBOVESPA:IFIX", "d": "IFIX" }
                    ],
                    "originalTitle": "Indices"
                },
                {
                    "title": "Futuros",
                    "symbols": [
                        { "s": "BMFBOVESPA:T101!", "d": "Treasure 10 anos" },
                        { "s": "BMFBOVESPA:IND1!", "d": "Ibovespa Futuro" },
                        { "s": "BMFBOVESPA:ISP1!", "d": "S&P 500 Futuro" },
                        { "s": "BMFBOVESPA:DI11!", "d": "DI Futuro" }
                    ]
                },
                {
                    "title": "Moedas",
                    "symbols": [
                        { "s": "FX_IDC:USDBRL", "d": "USD/BRL" },
                        { "s": "FX_IDC:EURBRL", "d": "EUR/BRL" },
                        { "s": "FX:EURUSD", "d": "EUR/USD" },
                        { "s": "CMCMARKETS:GBPUSD", "d": "GBP/USD" }
                    ],
                    "originalTitle": "Forex"
                }
            ],
            "support_host": "https://www.tradingview.com",
            "width": "100%",
            "height": "100%"
        });

        containerRef.current.appendChild(script);

        // No cleanup function here to avoid destroying the widget
    }, []); // Empty dependency array ensures this runs only once

    // Effect for updating the theme, runs when theme changes
    useEffect(() => {
        const iframe = containerRef.current?.querySelector('iframe');
        if (iframe && iframe.contentWindow) {
            iframe.contentWindow.postMessage({
                name: 'set-theme',
                data: {
                    theme: theme,
                }
            }, '*');
        }
    }, [theme]); // Only re-run when the theme changes

    return (
        <div ref={containerRef} className="tradingview-widget-container h-full">
            <div className="tradingview-widget-container__widget h-full"></div>
        </div>
    );
};

const TradingViewWidget = memo(_TradingViewWidget);
TradingViewWidget.displayName = 'TradingViewWidget';

export default TradingViewWidget;
