/*
 * Balances.js - Store
 */
Ext.define('FW.store.LTCBalances', {
    extend: 'Ext.data.Store',
    requires:['Ext.data.proxy.LocalStorage'],

    config: {
        model: 'FW.model.LTCBalances',
        autoLoad: true,
        autoSync: true,
        // Set this proxy to store data in localStorage
        proxy: {
            type: 'localstorage',
            id: 'LTCBalances'
        }
    }
});
