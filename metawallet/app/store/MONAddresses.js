Ext.define('FW.store.MONAddresses', {
    extend: 'Ext.data.Store',
    requires:['Ext.data.proxy.LocalStorage'],

    config: {
        model: 'FW.model.MONAddresses',
        // storeId: 'MONAddresses',
        autoLoad: true,
        autoSync: true,
        // Set this proxy to store data in localStorage
        proxy: {
            type: 'localstorage',
            id: 'MONAddresses'
        },
        proxy: {
            type: 'localstorage',
            id: 'MONAddresses'
        }
    }
});