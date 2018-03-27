Ext.define('FW.store.ETHAddresses', {
    extend: 'Ext.data.Store',
    requires:['Ext.data.proxy.LocalStorage'],

    config: {
        model: 'FW.model.ETHAddresses',
        // storeId: 'ETHAddresses',
        autoLoad: true,
        autoSync: true,
        // Set this proxy to store data in localStorage
        proxy: {
            type: 'localstorage',
            id: 'ETHAddresses'
        },
        proxy: {
            type: 'localstorage',
            id: 'ETHAddresses'
        }
    }
});