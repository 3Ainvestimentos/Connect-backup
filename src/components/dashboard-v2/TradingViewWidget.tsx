"use client";

import { useTheme } from '@/contexts/ThemeContext';
import React, { useEffect, useRef } from 'react';

const TradingViewWidget: React.FC = () => {
    const containerRef = useRef<HTMLDivElement>(null);
    const { theme } = useTheme();

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Limpa o conteúdo anterior para evitar widgets duplicados
        container.innerHTML = '';

        const script = document.createElement('script');
        script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-market-overview.js';
        script.async = true;
        script.type = 'text/javascript';
        
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

        container.appendChild(script);

        // Função de limpeza para remover o script quando o componente for desmontado
        return () => {
            if (container) {
                container.innerHTML = '';
            }
        };

    }, [theme]); // Recria o widget quando o tema muda

    return (
        <div ref={containerRef} className="tradingview-widget-container h-full">
            <div className="tradingview-widget-container__widget h-full"></div>
        </div>
    );
};

export default TradingViewWidget;
