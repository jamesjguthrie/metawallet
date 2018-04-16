/*
 * Balances.js - Store
 */
Ext.define('FW.store.ERC20Tokens', {
    extend: 'Ext.data.Store',
    requires:['Ext.data.proxy.LocalStorage'],

    config: {
        model: 'FW.model.ERC20Tokens',
        autoLoad: true,
        autoSync: true,
        // Set this proxy to store data in localStorage
        proxy: {
            type: 'localstorage',
            id: 'ERC20Tokens'
        }
    }
});
