/*
 * Exchange.js - View 
 *
 * Display decentralized exchange view 
 */

Ext.define('FW.view.Exchange', {
    extend: 'Ext.Container',
    
    config: {
        id: 'exchangeView',
        layout: 'vbox',
        scrollable: 'vertical',
        cls: 'fw-panel',
        items:[{
            xtype: 'fw-toptoolbar',
            title: 'Exchange',
            menu: true
        },{
            xtype: 'container',
            layout: 'vbox',
            margin: '5 0 0 0',
            items:[{
                margin: '5 0 0 0',
                html:'<center><img src="resources/images/logo.png" width="90%" style="max-width:350px;"></center>'
            },{
                margin: '5 0 0 0',
                cls: 'fw-placeholder-instructions',
                html:'<center>Press the button to test exchange transaction</center>'
            },
            {
                margin: '5 0 0 0',
                xtype: 'button',
                text: 'BTC -> ETH',
                iconCls: 'fa fa-send',
                ui: 'confirm',
                handler: function(btn){
                    Ext.getCmp('exchangeView').BTCETHSend();
                }
            },{
                margin: '5 0 0 0',
                xtype: 'button',
                text: 'BTC -> LTC',
                iconCls: 'fa fa-send',
                ui: 'confirm',
                handler: function(btn){
                    Ext.getCmp('exchangeView').BTCLTCSend();
                }
            },{
                margin: '5 0 0 0',
                xtype: 'button',
                text: 'BTC -> MON',
                iconCls: 'fa fa-send',
                ui: 'confirm',
                handler: function(btn){
                    Ext.getCmp('exchangeView').BTCMONSend();
                }
            },{
                margin: '5 0 0 0',
                xtype: 'button',
                text: 'ETH -> BTC',
                iconCls: 'fa fa-send',
                ui: 'confirm',
                handler: function(btn){
                    Ext.getCmp('exchangeView').ETHBTCSend();
                }
            },{
                margin: '5 0 0 0',
                xtype: 'button',
                text: 'ETH -> LTC',
                iconCls: 'fa fa-send',
                ui: 'confirm',
                handler: function(btn){
                    Ext.getCmp('exchangeView').ETHLTCSend();
                }
            },{
                margin: '5 0 0 0',
                xtype: 'button',
                text: 'ETH -> MON',
                iconCls: 'fa fa-send',
                ui: 'confirm',
                handler: function(btn){
                    Ext.getCmp('exchangeView').ETHMONSend();
                }
            },{
                margin: '5 0 0 0',
                xtype: 'button',
                text: 'LTC -> BTC',
                iconCls: 'fa fa-send',
                ui: 'confirm',
                handler: function(btn){
                    Ext.getCmp('exchangeView').LTCBTCSend();
                }
            },{
                margin: '5 0 0 0',
                xtype: 'button',
                text: 'LTC -> ETH',
                iconCls: 'fa fa-send',
                ui: 'confirm',
                handler: function(btn){
                    Ext.getCmp('exchangeView').LTCETHSend();
                }
            },{
                margin: '5 0 0 0',
                xtype: 'button',
                text: 'LTC -> MON',
                iconCls: 'fa fa-send',
                ui: 'confirm',
                handler: function(btn){
                    Ext.getCmp('exchangeView').LTCMONSend();
                }
            },{
                margin: '5 0 0 0',
                xtype: 'button',
                text: 'MON -> BTC',
                iconCls: 'fa fa-send',
                ui: 'confirm',
                handler: function(btn){
                    Ext.getCmp('exchangeView').MONBTCSend();
                }
            },{
                margin: '5 0 0 0',
                xtype: 'button',
                text: 'MON -> ETH',
                iconCls: 'fa fa-send',
                ui: 'confirm',
                handler: function(btn){
                    Ext.getCmp('exchangeView').MONETHSend();
                }
            },{
                margin: '5 0 0 0',
                xtype: 'button',
                text: 'MON -> LTC',
                iconCls: 'fa fa-send',
                ui: 'confirm',
                handler: function(btn){
                    Ext.getCmp('exchangeView').MONLTCSend();
                }
            }]
        }]
    },
    
    // Handle initializing the screen
    initialize: function(){
        var me  = this,
            cfg = me.config;
        // Setup alias to main controller
        me.main = FW.app.getController('Main');
        me.tb   = me.down('fw-toptoolbar');
        // Setup aliases to the various fields
        // me.currency    = me.down('[name=currency]');
        // me.source      = me.down('[name=source]');
        // me.destination = me.down('[name=destination]');
        // me.amount      = me.down('[name=amount]');
        // me.available   = me.down('[name=available]');
        // Call parent
        me.callParent();
    },

    BTCETHSend: function(){
        var me = this;
        me.main.exchangeSend("btc","eth","1");
    },

    BTCLTCSend: function(){
        var me = this;
        me.main.exchangeSend("btc","ltc","1");
    },

    BTCMONSend: function(){
        var me = this;
        me.main.exchangeSend("btc","mon","1");
    },

    ETHBTCSend: function(){
        var me = this;
        me.main.exchangeSend("eth","btc","1");
    },

    ETHLTCSend: function(){
        var me = this;
        me.main.exchangeSend("eth","ltc","1");
    },

    ETHMONSend: function(){
        var me = this;
        me.main.exchangeSend("eth","mon","1");
    },

    LTCBTCSend: function(){
        var me = this;
        me.main.exchangeSend("ltc","btc","1");
    },

    LTCETHSend: function(){
        var me = this;
        me.main.exchangeSend("ltc","eth","1");
    },

    LTCMONSend: function(){
        var me = this;
        me.main.exchangeSend("ltc","mon","1");
    },

    MONBTCSend: function(){
        var me = this;
        me.main.exchangeSend("mon","btc","1");
    },

    MONETHSend: function(){
        var me = this;
        me.main.exchangeSend("mon","eth","1");
    },

    MONLTCSend: function(){
        var me = this;
        me.main.exchangeSend("mon","ltc","1");
    },

    // Handle updating the view with passed config info
    updateView: function(cfg){
        var me = this;
        // Back button
        if(cfg.back){
            me.tb.backBtn.show();
            if(typeof cfg.back === 'function')
                me.tb.onBack = cfg.back;
        } else {
            me.tb.backBtn.hide();
        }
    }

});