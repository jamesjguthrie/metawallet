/*
 * ToolsList.js - View
 * 
 * Handle displaying list of tools
 */

Ext.define('FW.view.ToolsList', {
    extend: 'Ext.Container',
    xtype: 'fw-toolslist',

    config: {
        layout: 'vbox',
        cls: 'fw-panel',
        items: [{
            xtype: 'fw-toptoolbar',
            title: 'Tools'
        }, {
            xtype: 'container',
            margin: '5 5 5 5',
            defaults: {
                layout: 'vbox',
                defaults: {
                    xtype: 'button',
                    cls: 'fw-tools-button',
                    iconAlign: 'top',
                    margin: '5 5 5 5',
                    height: 100,
                }
            },
            items: [{
                items: [{
                    text: 'Send',
                    iconCls: 'fa fa-paper-plane fa-2x',
                    handler: function () {
                        FW.app.getController('Main').showTool('send', { reset: true });
                    }
                }, {
                    text: 'Receive',
                    iconCls: 'fa fa-smile-o fa-2x',
                    handler: function () {
                        FW.app.getController('Main').showTool('receive', { reset: true });
                    }
                }, {
                    text: 'Decentralized<br>Exchange',
                    iconCls: 'fa fa-exchange fa-2x',
                    handler: function () {
                        FW.app.getController('Main').showTool('exchange', { reset: true });
                    }
                }]
            }, {
            }]
        }]
    },


    initialize: function () {
        var me = this;
        // Setup alias to toolbar
        me.main = FW.app.getController('Main');
        me.tb = me.down('fw-toptoolbar');
        // Display the menu button if we are on a phone
        if (me.main.deviceType == 'phone')
            me.tb.menuBtn.show();
        // Call parent function
        me.callParent();
    }
});
