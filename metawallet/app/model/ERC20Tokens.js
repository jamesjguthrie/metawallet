/*
 * Balances.js - Model
 */
Ext.define('FW.model.ERC20Tokens', {
    extend: 'Ext.data.Model',
    config: {
        fields: [
            {name: 'id',              type: 'string'},  // Unique id Address-PREFIX-CURRENCY
            {name: 'prefix',          type: 'string'},  // address prefix
            {name: 'token_symbol',    type: 'string'},  // Token name as symbol
            {name: 'token_name',      type: 'string'},  // Display name for token (fix so we can use as displayField in select fields)
            {name: 'quantity',        type: 'string'},  // Quantity (1,234.12345678)
            {name: 'decimal',         type: 'string'}   // quantity again maybe, verify this
        ],
        idProperty: 'id',
        proxy: {
            type: 'localstorage',
            id: 'ERC20Tokens'
        }        
    }
});
