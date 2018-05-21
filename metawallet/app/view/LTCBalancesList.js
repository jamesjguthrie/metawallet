/*
 * LTCBalancesList.js - View
 * 
 * Display list of balances
 */

Ext.define('FW.view.LTCBalancesList', {
    extend: 'Ext.dataview.List',
    xtype: 'fw-ltcbalanceslist',

    config: {
        id: 'LTCbalancesList',
        cls: 'fw-panel fw-balanceslist x-list-nopadding',
        bgCls: 'fw-background',
        infinite: true,
        striped: true,
        disableSelection: false,
        store: 'LTCBalances',
        emptyText: '',
        itemHeight: 60,
        itemTpl: new Ext.XTemplate(
            '<div class="fw-balanceslist-item">' +
                '<div class="fw-balanceslist-icon">' +
                    '<img src="https://xchain.io/icon/{[this.toUpper(values.asset)]}.png">' + 
                '</div>' +
                '<div class="fw-balanceslist-info">' +
                    '<div class="fw-balanceslist-currency">{display_name}</div>' +
                    '<div>' +
                        '<div class="fw-balanceslist-amount">{[this.numberFormat(values)]}</div>' +
                        '<div class="fw-balanceslist-price">{[this.priceFormat(values)]}</div>' +
                    '</div>' +
                '</div>' +
            '</div>',
            {
                toUpper: function(val){
                    return String(val).toUpperCase();
                },
                numberFormat: function(values){
                    var fmt = '0,0',
                        qty = values.quantity;
                    if(/\./.test(qty) || values.asset=='LTC')
                        fmt += '.00000000';
                    return numeral(qty).format(fmt);
                },
                priceFormat: function(values){
                    var txt = '';
                    if(values.estimated_value && values.estimated_value.usd!='0.00')
                        var txt = '$' + numeral(values.estimated_value.usd).format('0,0.00');
                    return txt;
                }
            }
        ),
        listeners: {
            itemtap: function(cmp, index, target, record, e, eOpts){
                Ext.getCmp('balancesView').showTokenInfo(record.data);
            }
        },
        items:[{
            xtype: 'fw-toptoolbar',
            title: 'LTC Balances',
            refresh: true,
            onRefresh: function(){
                var me = Ext.getCmp('LTCbalancesList');
                if(me.refreshing)
                    return;
                me.refreshing = true;
                me.getStore().removeAll();
                me.setMasked({
                    xtype: 'loadmask',
                    message: 'Refreshing Balances',
                    showAnimation: 'fadeIn',
                    indicator: true
                });
                // Define callback to run after we are done refreshing balances
                var cb = function(){
                    me.setMasked(false);
                    me.refreshing = false;
                };
                me.main.getLTCAddressBalances(FW.LTCWALLET_ADDRESS.address, cb);
            }
        }]
    },

    initialize: function(){
        var me  = this;
        // Setup alias to toolbar
        me.main = FW.app.getController('Main');
        me.tb   = me.down('fw-toptoolbar');
        // Display the menu button if we are on a phone
        if(me.main.deviceType=='phone')
            me.tb.menuBtn.show();
        // Display address label in titlebar, wrap at 220 pixels, display address on tap
        me.tb.tb.setTitle("Litecoin");
        var title = me.tb.tb.element.down('.x-title');
        title.setMaxWidth(220);
        title.on('tap',function(){ me.main.showQRCodeView({ text: FW.LTCWALLET_ADDRESS.address }); });
        // Call parent function
        me.callParent();
        // Handle sorting currencies by type and name
        // We do this so we show currencies (BTC,XCP) before assets
        console.log('about to getstore');
        me.getStore().sort([{
            property : 'type',
            direction: 'ASC'
        },{
            property : 'asset',
            direction: 'ASC'
        },{
            property : 'asset_longname',
            direction: 'ASC'
        }]);
    }

});