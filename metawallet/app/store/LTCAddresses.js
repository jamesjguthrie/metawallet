Ext.define('FW.store.LTCAddresses', {
    extend: 'Ext.data.Store',
    requires:['Ext.data.proxy.LocalStorage'],

    config: {
        model: 'FW.model.LTCAddresses',
        // storeId: 'LTCAddresses',
        autoLoad: true,
        autoSync: true,
        // Set this proxy to store data in localStorage
        proxy: {
            type: 'localstorage',
            id: 'LTCAddresses'
        },
        proxy: {
            type: 'localstorage',
            id: 'LTCAddresses'
        }
    }
});