/*
 * Welcome.js - View 
 *
 * Welcome screen to help users get wallet setup
 */

Ext.define('FW.view.Welcome', {
    extend: 'Ext.Container',

    config: {
        id: 'welcomeView',
        layout: 'vbox',
        cls: 'fw-welcomepanel',
        items:[{
            xtype: 'container',
            margin: '100 5 0 5',
            items:[{
                xtype: 'image',
                docked: 'top',
                src: 'resources/images/logo.png',
                height: '160px',
            },{
                xtype: 'container',
                layout: { 
                    type: 'hbox',
                    pack: 'center'
                },
                defaults: {
                    xtype: 'button',
                    height: 50,
                    style: 'border: 1px solid white',
                },
                items:[{
                    margin: '150 50 50 400',
                    text: 'Create New Wallet',
                    ui: 'confirm',
                    handler: function(btn){
                        Ext.getCmp('welcomeView').createWallet();
                    }
                },{
                    margin: '150 400 50 50',
                    text: 'Use Existing Wallet',
                    ui: 'action',
                    handler: function(btn){
                        Ext.getCmp('welcomeView').existingWallet();
                    }
                }]
            },{
                xtype: 'container',
                margin: '10 0 10 0',
                itemId: 'spinner',
                hidden: true,
                html:'<center><i class="fa fa-5x fa-spin fa-spinner"></i><div style="font-weight: bold;margin-top: 10px;">Generating Wallet...</div></center>'
            }]
        }]
    },


    initialize: function(){
        var me = this;
        me.main = FW.app.getController('Main');
        me.spinner = me.down('[itemId=spinner]')
        me.callParent();
    },


    // Handle creating a wallet, and displaying it to the user
    createWallet: function(phrase){
        var me = this;
        if(me.loadingWallet)
            return;
        me.loadingWallet = true;
        me.spinner.show();
        // Define callback to process response from generateWallet()
        var cb = function(p){
            // If a passphrase was specified, then just load the wallet
            if(phrase){
                me.loadingWallet = false;
                me.main.showMainView();
            } else {
                me.main.showPassphraseView({ phrase:p });
            }
            me.spinner.hide();
        }
        // Defer by 1/2 a second to allow screen to update and show spinner
        Ext.defer(function(){
            me.main.generateWallet(phrase, cb);
            me.main.generateETHWallet(phrase, cb); //might need different phrase, cb
            me.main.generateLTCWallet(phrase, cb);
        },500)
    },


    // Handle setting up existing wallet using passphrase
    existingWallet: function(){
        var me = this;
        // Define callback to process response from promptWalletPassphrase()
        var cb = function(phrase){
            me.createWallet(phrase);
        }
        me.main.promptWalletPassphrase(cb);

    }

});


