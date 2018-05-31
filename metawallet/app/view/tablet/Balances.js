/*
 * Balances.js - View
 * 
 * Display balances list and token info on tablet
 */

Ext.define('FW.view.tablet.Balances', {
    extend: 'Ext.Container',

    config: {
        layout: 'hbox',
        items: [{
            flex: 1,
            xtype: 'container',
            layout: 'card',
            itemId: 'balances',
            cls: 'fw-panel fw-panel-separator',
            items: [{
                xtype: 'container',
                itemId: 'placeholder',
                scrollable: 'vertical',
                layout: {
                    type: 'vbox',
                    align: 'center',
                    pack: 'top'
                },
                items: [{
                    xtype: 'fw-toptoolbar',
                    menu: true
                }, {
                    margin: '10 0 0 0',
                    html: '<center><img src="resources/images/logo.png" width="90%" style="max-width:350px;"></center>'
                }]
            }, {
                xtype: 'fw-tokeninfo',
                flex: 1
            }]
        },
        {
            xtype: 'fw-balanceslist',
            flex: 1
        },
        {
            xtype: 'fw-ethbalanceslist',
            flex: 1
        },
        {
            xtype: 'fw-erc20tokenslist',
            flex: 1
        },
        {
            xtype: 'fw-ltcbalanceslist',
            flex: 1
        }]
    }

});
