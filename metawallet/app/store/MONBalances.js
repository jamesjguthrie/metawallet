/*
 * Balances.js - Store
 */
Ext.define('FW.store.MONBalances', {
    extend: 'Ext.data.Store',
    requires:['Ext.data.proxy.LocalStorage'],

    config: {
        model: 'FW.model.MONBalances',
        autoLoad: true,
        autoSync: true,
        // Set this proxy to store data in localStorage
        proxy: {
            type: 'localstorage',
            id: 'MONBalances'
        }
    }
});
