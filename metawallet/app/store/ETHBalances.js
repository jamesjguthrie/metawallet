/*
 * Balances.js - Store
 */
Ext.define('FW.store.ETHBalances', {
    extend: 'Ext.data.Store',
    requires:['Ext.data.proxy.LocalStorage'],

    config: {
        model: 'FW.model.ETHBalances',
        autoLoad: true,
        autoSync: true,
        // Set this proxy to store data in localStorage
        proxy: {
            type: 'localstorage',
            id: 'ETHBalances'
        }
    }
});
