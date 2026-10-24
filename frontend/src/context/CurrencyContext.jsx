import React, { createContext, useContext, useState, useEffect } from 'react';

const CURRENCIES = {
    MAD: {
        code: 'MAD',
        symbol: 'DH',
        name: 'Dirham Marocain',
        rate: 10.0, // Base conversion display factor against USD if needed
        format: (val) => `${Number(val || 0).toLocaleString('fr-MA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} DH`
    },
    EUR: {
        code: 'EUR',
        symbol: '€',
        name: 'Euro',
        rate: 0.92,
        format: (val) => `${Number(val || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`
    },
    USD: {
        code: 'USD',
        symbol: '$',
        name: 'US Dollar',
        rate: 1.0,
        format: (val) => `$${Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
};

const CurrencyContext = createContext({
    currency: 'MAD',
    setCurrency: () => {},
    formatCurrency: (val) => `${val}`,
    availableCurrencies: Object.values(CURRENCIES)
});

export const CurrencyProvider = ({ children }) => {
    const [currency, setCurrencyState] = useState(() => {
        return localStorage.getItem('app_currency') || 'MAD';
    });

    useEffect(() => {
        localStorage.setItem('app_currency', currency);
    }, [currency]);

    const setCurrency = (code) => {
        if (CURRENCIES[code]) {
            setCurrencyState(code);
        }
    };

    const formatCurrency = (amount) => {
        const curr = CURRENCIES[currency] || CURRENCIES.MAD;
        return curr.format(amount);
    };

    return (
        <CurrencyContext.Provider value={{
            currency,
            setCurrency,
            formatCurrency,
            currentConfig: CURRENCIES[currency] || CURRENCIES.MAD,
            availableCurrencies: Object.values(CURRENCIES)
        }}>
            {children}
        </CurrencyContext.Provider>
    );
};

export const useCurrency = () => useContext(CurrencyContext);
export default CurrencyContext;
