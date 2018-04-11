/*
 * Main.js - Controller 
 * 
 * Defines most of the common functions used throughout the app
 */
Ext.define('FW.controller.Main', {
    extend: 'Ext.app.Controller',
    requires: [
        'Ext.MessageBox',
        'Ext.device.Device',
        'Ext.device.Connection'
    ],
    
    launch: function(){
        var me   = this,
            sm   = localStorage, // Alias for state manager
            vp   = Ext.Viewport,
            wall = sm.getItem('wallet'),
            pass = sm.getItem('passcode');
        var ETHme = this,
            ETHsm = localStorage,
            ETHvp = Ext.ETHViewport,
            ETHwall = sm.getItem('ETHwallet'),
            ETHpass = sm.getItem('ETHpasscode');

        // Setup alias to counterparty controller
        me.counterparty   = FW.app.getController('Counterparty');
        // Setup flag to indicate if we are running as a native app.
        me.isNative = (typeof cordova === 'undefined') ? false : true;
        // Setup alias to device type 
        me.deviceType = me.getDeviceType();
        // Initalize some runtime values 
        FW.PASSCODE       = 0000;                           // Default passcode used to encrypt wallet
        FW.WALLET_HEX     = null;                           // HD wallet Hex key
        FW.WALLET_KEYS    = {};                             // Object containing of address/private keys
        FW.WALLET_NETWORK = sm.getItem('network') || 1;     // (1=Mainnet, 2=Testnet)
        FW.WALLET_PREFIX  = sm.getItem('prefix')  || null;  // 4-char wallet hex prefix (used to quickly find addresses associated with this wallet in datastore)
        FW.WALLET_ADDRESS = sm.getItem('address') || null;  // Current wallet address info
        FW.TOUCHID        = sm.getItem('touchid') || false; // TouchID Authentication enabled (iOS 8+)
        FW.NETWORK_INFO   = {};                             // latest network information (price, fees, unconfirmed tx, etc)
        FW.API_KEYS       = {
            BLOCKTRAIL: 'efb0aae5420f167113cc81a9edf7b276d40c2565'
        }
        FW.ETHWALLET_HEX = null;                           // HD wallet Hex key
        FW.ETHWALLET_KEYS = {};                             // Object containing of address/private keys
        FW.ETHWALLET_NETWORK = sm.getItem('ETHnetwork') || 1;     // (1=Mainnet, 2=Testnet)
        FW.ETHWALLET_PREFIX = sm.getItem('ETHprefix') || null;  // 4-char wallet hex prefix (used to quickly find addresses associated with this wallet in datastore)
        FW.ETHWALLET_ADDRESS = sm.getItem('ETHaddress') || null;  // Current wallet address info
        FW.ETHNETWORK_INFO = {};                             // latest network information (price, fees, unconfirmed tx, etc)
        FW.ETHAPI_KEYS = {
            BLOCKTRAIL: 'efb0aae5420f167113cc81a9edf7b276d40c2565' 
        }

        // Define default server/host settings
        FW.SERVER_INFO    = {
            mainnet: {
                cpHost: '52.87.221.111',          // BTC Host
                cpPort: 8544,                           // BTC Port
                cpUser: 'metawallet',                   // BTC Username
                cpPass: 'pass',                         // BTC Password
                cpSSL: true                             // BTC SSL Enabled (true=https, false=http)
            },
            testnet: {
                cpHost: '52.87.221.111',          // BTC Host
                cpPort: 8544,                          // BTC Port
                cpUser: 'rpc',                          // BTC Username
                cpPass: '1234',                         // BTC Password
                cpSSL: true                             // BTC SSL Enabled (true=https, false=http)
            }                           
        };

        FW.ETHSERVER_INFO = {
            ETHmainnet: {
                cpHost: '52.87.221.111',                // ETH Host
                cpPort: 8545,                           // ETH port
                cpUser: 'rpc',                          // Username - not currently used Geth doesnt support
                cpPass: '1234',                         // Password - as above
                cpSSL: true                             // ETH node SSL Enabled (true=https, false=http)
            },
            ETHtestnet: {
                cpHost: '52.87.221.111',                // ETH Host
                cpPort: 8545,                           // ETH port
                cpUser: 'rpc',                          // Username - not currently used Geth doesnt support
                cpPass: '1234',                         // Password - as above
                cpSSL: true                             // ETH node SSL Enabled (true=https, false=http)
            }
        };

        // Define default miners fees (pull dynamic fee data from blocktrail.com API)
        var std = 0.0001
        FW.MINER_FEES = {
            standard: std,
            medium: std * 2,
            fast: std * 5
        };

        var ETHstd = 0.0001 //dunno yet
        FW.ETHMINER_FEES = {
            standard: std,
            medium: std * 2,
            fast: std * 5
        };

        // Load any custom server information
        var serverInfo = sm.getItem('serverInfo');
        if(serverInfo){
            var o = Ext.decode(serverInfo);
            if(o)
                FW.SERVER_INFO = o;
        }
        var ETHserverInfo = sm.getItem('ETHserverInfo');
        if (ETHserverInfo) {
            var o = Ext.decode(ETHserverInfo);
            if (o)
                FW.ETHSERVER_INFO = o;
        }
        // Detect if we have a wallet
        if(wall){
            // Define function to run once we have successfully authenticated
            var successFn = function(pass){
                if(pass)
                    FW.WALLET_PASSCODE = pass;
                me.decryptWallet();
                me.setWalletNetwork(FW.WALLET_NETWORK);
                me.setWalletAddress(FW.WALLET_ADDRESS, true);
                me.showMainView();
                // Load network info every 10 minutes
                var network  = sm.getItem('networkInfo'),
                    tstamp   = sm.getItem('networkInfoUpdated'),
                    interval = 600000; // 10 minutes 
                if(network)
                    FW.NETWORK_INFO = Ext.decode(network);
                // Parse in last known network fees
                if(FW.NETWORK_INFO.fee_info){
                    var o = FW.NETWORK_INFO.fee_info;
                    FW.MINER_FEES.medium = o.low_priority;
                    FW.MINER_FEES.fast   = o.optimal;
                }
                // Refresh if we have no network data, or it is older than interval
                if(!tstamp || (tstamp && (parseInt(tstamp)+interval) < Date.now()))
                    me.updateNetworkInfo(true);
                // Update prices every 10 minutes
                setInterval(function(){ me.updateNetworkInfo(true); }, interval);
                // Handle processing any scanned data after 1 second
                Ext.defer(function(){ me.processLaunchData(); }, 1000);

                me.setETHWalletNetwork(FW.ETHWALLET_NETWORK);
                me.setETHWalletAddress(FW.ETHWALLET_ADDRESS, true);

                // Load network info every 10 minutes
                var ETHnetwork  = sm.getItem('ETHnetworkInfo'),
                    tstamp   = sm.getItem('ETHnetworkInfoUpdated'),
                    interval = 600000; // 10 minutes 
                if(network)
                    FW.ETHNETWORK_INFO = Ext.decode(ETHnetwork);
                // Parse in last known network fees
                if(FW.ETHNETWORK_INFO.fee_info){
                    var o = FW.ETHNETWORK_INFO.fee_info;
                    FW.ETHMINER_FEES.medium = o.low_priority;
                    FW.ETHMINER_FEES.fast   = o.optimal;
                }
                // Refresh if we have no network data, or it is older than interval
                if(!tstamp || (tstamp && (parseInt(tstamp)+interval) < Date.now()))
                    me.updateNetworkInfo(true);
                // Update prices every 10 minutes
                setInterval(function(){ me.updateNetworkInfo(true); }, interval);
                // Handle processing any scanned data after 1 second
                Ext.defer(function(){ me.processLaunchData(); }, 1000);


            }
            if(FW.TOUCHID && me.isNative){
                // Handle Touch ID authentication
                me.authenticateTouchID(successFn, null, 'Please scan your fingerprint', true);
            } else if(pass){
                // Handle passcode authentication
                me.authenticatePasscode(successFn, null, 'Please enter your passcode', true);
            } else {
                successFn();
            }
        } else {
            // Show the welcome/setup view
            me.showWelcomeView();
        }

        if(ETHwall){
            // Define function to run once we have successfully authenticated
            var successFn = function(pass){
            }
            /*if(FW.TOUCHID && me.isNative){
                // Handle Touch ID authentication
                me.authenticateTouchID(successFn, null, 'Please scan your fingerprint', true);
            } else if(pass){
                // Handle passcode authentication
                me.authenticatePasscode(successFn, null, 'Please enter your passcode', true);
            } else {
                successFn();
            }
        } else {
            // Show the welcome/setup view
            me.showWelcomeView();*/
        }
    },


    // Handle processing any data that was passed at launch
    processLaunchData: function(){
        var me   = this,
            data = FW.LAUNCH_DATA;
        // Only proceed if we have a decrypted wallet
        if(FW.WALLET_HEX && data){
            var o = me.getScannedData(String(data));
            me.processQRCodeScan(o); // Treat input as a scanned QR Code
            FW.LAUNCH_DATA = false;  // Reset data so it is gone on next check
        }
    },


    // Handle for ajax requests
    // All requests should have a success: function defined
    ajaxRequest: function(request,force){
        var me = this;
        // Stash the original success function for use later
        var successFn = request.success;
        // Define the success/callback/failure functions
        var fn = {
            // Handle processing successfull responses
            success: function(res){
                var o = res;
                // Handle trying to decode the response text 
                if(res.responseText){
                    try {
                        var o = Ext.decode(res.responseText);
                    } catch(e){
                        o = false
                    }
                }
                // If we detect a successfull response, hand to the success function for further processing
                if(o||force)
                    successFn(o);
            },
            failure: request.failure,
            callback: request.callback
        };
        // Send request to server
        Ext.Ajax.request(Ext.merge(request, {
            timeout: 60000,             // timeout after 60 seconds of waiting
            useDefaultXhrHeader: false, // Set to false to make CORS requests (cross-domain)
            success: fn.success,        // Success function called when we receive a success response
            callback: fn.callback,      // Callback function called on any response
            failure: fn.failure         // Failure function called when the request fails
        }));
    },



    // Handle getting the device type based off screen dimensions
    // Force device to either phone or tablet
    getDeviceType: function(){
        var me = this;
        if(!me.deviceType){
            var w  = Math.max(window.innerWidth,window.innerHeight);
            me.deviceType = (w>=1000) ? 'tablet' : 'phone';
        }
        return me.deviceType;   
    },


    // Handle finding/creating a view and displaying it
    showView: function(id, xclass, cfg){
        var view = false,
            vp   = Ext.Viewport;
        // console.log('showView xclass,cfg=',xclass,cfg);
        if(id)
            view = Ext.getCmp(id);
        // If we found existing view, update data and use it
        if(view){
            if(cfg)
                view.updateView(cfg);
        } else {
            view = vp.add(Ext.apply({ xclass: xclass }, cfg));
        }
        // Show view using correct method
        if(view.isInnerItem()){
            vp.setActiveItem(view);
        } else {
            view.show();
        }
    },


    // Setup some alias functions for the various views we want to display
    showWelcomeView:      function(){ this.showView('welcomeView','FW.view.Welcome');  },
    showMainView:         function(){ this.showView('mainView','FW.view.Main'); },
    showAddressListView:  function(){ this.showView('addressList','FW.view.AddressList'); },
    showQRCodeView:       function(cfg){ this.showView('qrcodeView','FW.view.QRCode', cfg); },
    showScanQRCodeView:   function(cfg){ this.showView(null,'FW.view.Scan',cfg); },
    showPasscodeView:     function(cfg){ this.showView('passcodeView','FW.view.Passcode', cfg); },
    showPassphraseView:   function(cfg){ this.showView('passphraseView','FW.view.Passphrase', cfg); },
    showCallbackView:     function(cfg){ this.showView('callbackView','FW.view.Callback', cfg); },

    // Handle showing a specifc tool
    showTool: function(tool,cfg){
        var me   = this;
        // console.log('showTool tool,cfg=',tool,cfg);
        // Show main view (probably already visible)
        me.showMainView();
        // Switch main view to the 'Tools' tab
        var main  = Ext.getCmp('mainView'),
            tools = Ext.getCmp('toolsView');
        main.setActiveItem(tools);
        // Display the correct tool
        if(tool=='bet')
            tools.showBetTool(cfg);
        if(tool=='broadcast')
            tools.showBroadcastTool(cfg);
        if(tool=='dividend')
            tools.showDividendTool(cfg);
        if(tool=='exchange')
            tools.showExchangeTool(cfg);
        if(tool=='issue')
            tools.showIssueTool(cfg);
        if(tool=='notarize')
            tools.showNotarizeTool(cfg);
        if(tool=='otcmarket')
            tools.showOTCMarketTool(cfg);
        if(tool=='receive')
            tools.showReceiveTool(cfg);
        if(tool=='send')
            tools.showSendTool(cfg);
        if(tool=='ETHsend')
            tools.showETHSendTool(cfg);
        if(tool=='sign')
            tools.showSignTool(cfg);

    },

    // Handle generating 128-bit mnemonic wallet, or using an existing wallet
    generateWallet: function(phrase, callback){
        var me = this,
            sm = localStorage,
            m  = new Mnemonic(128);
        // If passphrase was specified, use it
        if(phrase)
            m = Mnemonic.fromWords(phrase.trim().split(" "));
        // Generate wallet passphrase and hex
        var p  = m.toWords().toString().replace(/,/gi, " "),
            h  = m.toHex();
        console.log("BTC key ",h);
        // Save the wallet hex so we can use when adding the wallet addresses
        FW.WALLET_HEX = h.toString();
        // Generate ARC4-based PRNG that is autoseeded using the
        // current time, dom state, and other accumulated local entropy.
        // var seed = Math.seedrandom();
        //     list = CryptoJS.enc.Utf8.parse(seed),
        //     str  = CryptoJS.enc.Base64.stringify(list);
        // Encrypt the wallet and save it to disk so we can load on next run
        me.encryptWallet();
        // Set the wallet prefix to the first 5 chars of the hex
        FW.WALLET_PREFIX  = String(h.substr(0,5));
        sm.setItem('prefix', FW.WALLET_PREFIX);
        // Generate some wallet addresses for use
        me.addWalletAddress(10, 1, false); // Mainnet
        me.addWalletAddress(10, 2, false); // Testnet
        // Set wallet address to the first new address
        var addr = me.getFirstWalletAddress(FW.WALLET_NETWORK);
        if(addr)
            me.setWalletAddress(addr, true);
        // Handle processing the callback
        if(typeof callback === 'function')
            callback(p);
    },

    generateETHWallet: function (phrase, callback) {
        
        var me = this,
            sm = localStorage,
            store = Ext.getStore('ETHAddresses');

        web3 = new Web3("http://52.87.221.111:8545");

        var ETH = web3.eth.accounts.create();
        ETHprivkey = ETH.privateKey; //basically global variable, probably very insecure, will our security implementations make it ok?
        console.log("ETHprivkey ",ETHprivkey);
        var ETHaddr = ETH.address;
        FW.ETHWALLET_PREFIX  = String(ETHprivkey.substr(0,5));
        sm.setItem('ETHprefix', FW.ETHWALLET_PREFIX);
        /*if (ETHaddr)
            console.log(ETHaddr);
            me.setETHWalletAddress(ETHaddr, true);*/

        console.log("About to store eth address");
        var rec = store.add({
                    id: FW.ETHWALLET_PREFIX + '-' + FW.ETHWALLET_NETWORK,
                    index: 0,
                    prefix: FW.ETHWALLET_PREFIX,
                    network: FW.ETHWALLET_NETWORK,
                    address: ETHaddr,
                    label: 'ETHAddress #0'
                });
                // Mark record as dirty so we save to disk on next sync
                rec[0].setDirty();
                addr = ETHaddr;
        console.log("line 412");
        me.saveStore('ETHAddresses');
        if (ETHaddr)
            console.log(ETHaddr);
            me.setETHWalletAddress(ETHaddr, true);
        if(alert)
            Ext.Msg.alert('New ETHAddress', addr);
        return addr;

        // Handle processing the callback
        //if (typeof callback === 'function')
          //  callback(p);
    },


    // Handle displaying the current wallet passphrase
    showWalletPassphrase: function(){
        var me = this,
            m  = Mnemonic.fromHex(FW.WALLET_HEX),
            p  = m.toWords().toString().replace(/,/gi, " ");
        me.showPassphraseView({ phrase: p });
    },

    showETHWalletPassphrase: function () {
        var me = this,
            m = Mnemonic.fromHex(FW.ETHWALLET_HEX),
            p = m.toWords().toString().replace(/,/gi, " ");
        me.showETHPassphraseView({ phrase: p });
    },


    // Handle encrypting wallet information using passcode and saving
    encryptWallet: function(){
        var me  = this,
            sm  = localStorage;
        // Encrypt the wallet seed
        var enc = CryptoJS.AES.encrypt(FW.WALLET_HEX, String(FW.PASSCODE)).toString();
        sm.setItem('wallet', enc);
        // Encrypt any imported private keys
        var enc = CryptoJS.AES.encrypt(Ext.encode(FW.WALLET_KEYS), String(FW.PASSCODE)).toString();
        sm.setItem('privkey', enc);
    },

    // Handle decrypting stored wallet seed using passcode
    decryptWallet: function(){
        var me = this,
            sm = localStorage,
            w  = sm.getItem('wallet'),
            p  = sm.getItem('privkey');
        // Decrypt wallet
        if(w){
            var dec = CryptoJS.AES.decrypt(w, String(FW.PASSCODE)).toString(CryptoJS.enc.Utf8);
            FW.WALLET_HEX = dec;
        }
        // Decrypt any saved/imported private keys
        if(p){
            var dec = CryptoJS.AES.decrypt(p, String(FW.PASSCODE)).toString(CryptoJS.enc.Utf8);
            FW.WALLET_KEYS = Ext.decode(dec);
        }
    },


    // Handle encrypting wallet information using passcode and saving
    encryptETHWallet: function () {
        var me = this,
            sm = localStorage;
        // Encrypt the wallet seed
        var enc = CryptoJS.AES.encrypt(FW.ETHWALLET_HEX, String(FW.PASSCODE)).toString();
        sm.setItem('wallet', enc);
        // Encrypt any imported private keys
        var enc = CryptoJS.AES.encrypt(Ext.encode(FW.ETHWALLET_KEYS), String(FW.PASSCODE)).toString();
        sm.setItem('privkey', enc);
    },



    // Handle decrypting stored wallet seed using passcode
    decryptETHWallet: function () {
        var me = this,
            sm = localStorage,
            w = sm.getItem('ETHwallet'),
            p = sm.getItem('ETHprivkey');
        // Decrypt wallet
        if (w) {
            var dec = CryptoJS.AES.decrypt(w, String(FW.ETHPASSCODE)).toString(CryptoJS.enc.Utf8);
            FW.ETHWALLET_HEX = dec;
        }
        // Decrypt any saved/imported private keys
        if (p) {
            var dec = CryptoJS.AES.decrypt(p, String(FW.ETHPASSCODE)).toString(CryptoJS.enc.Utf8);
            FW.ETHWALLET_KEYS = Ext.decode(dec);
        }
    },


    // Handle adding private key to wallet
    addWalletPrivkey: function(key, alert){
        // Verify that the private key is added
        var me      = this,
            sm      = localStorage,
            address = false,
            bc      = bitcore,
            store   = Ext.getStore('Addresses'),
            n       = (FW.WALLET_NETWORK==2) ? 'testnet' : 'mainnet',
            force   = (force) ? true : false,
            net     = bc.Networks[n];
        try {
            privkey = new bc.PrivateKey.fromWIF(key);
            pubkey  = privkey.toPublicKey();
            address = pubkey.toAddress(net).toString();
        } catch (e){
            console.log('error : ',e);
        }
        // Add wallet to address
        if(address){
            var rec = store.add({
                id: FW.WALLET_PREFIX + '-' + FW.WALLET_NETWORK + '-' + String(address).substring(0,4),
                index: 9999,
                prefix: FW.WALLET_PREFIX,
                network: FW.WALLET_NETWORK,
                address: address,
                label: 'Imported Address'
            });
            // // Mark record as dirty so we save to disk on next sync
            rec[0].setDirty();
            me.saveStore('Addresses');
        }
        // Save data in localStorage
        if(FW.WALLET_KEYS){
            console.log('FW.WALLET_KEYS=',FW.WALLET_KEYS);
            FW.WALLET_KEYS[address] = key;
            me.encryptWallet();
        }
        // Notify user that address was added
        if(alert && address){
            Ext.defer(function(){
                Ext.Msg.alert('New Address', address);                
            },10);
        }
    },

    addETHWalletPrivkey: function (key, alert) {
        console.log("line 550");
        var me = this,
            sm = localStorage,
            address = false,
            store = Ext.getStore('ETHAddresses'),
            n = (FW.ETHWALLET_NETWORK == 2) ? 'testnet' : 'mainnet',
            force = (force) ? true : false;
        // Add wallet to address
        if (address) {
            var rec = store.add({
                id: FW.ETHWALLET_PREFIX + '-' + FW.ETHWALLET_NETWORK + '-' + String(ETHaddress).substring(0, 4),
                index: 9999,
                prefix: FW.ETHWALLET_PREFIX,
                network: FW.ETHWALLET_NETWORK,
                address: ETHaddress,
                label: 'Imported Address'
            });
            // // Mark record as dirty so we save to disk on next sync
            rec[0].setDirty();
            me.saveStore('ETHAddresses');
        }
        // Save data in localStorage
        if (FW.ETHWALLET_KEYS) {
            console.log('FW.ETHWALLET_KEYS=', FW.ETHWALLET_KEYS);
            FW.ETHWALLET_KEYS[ETHaddress] = key;
            me.encryptETHWallet();
        }
        // Notify user that address was added
        if (alert && address) {
            Ext.defer(function () {
                Ext.Msg.alert('New Address', ETHaddress);
            }, 10);
        }
    },


    // Handle adding wallet addresses
    // @count   = number of addresses to generate
    // @network = 1=livenet / 2=testnet
    // @force   = force generation of address count
    // @alert   = show alert for first address added
    addWalletAddress: function(count, network, force, alert){
        var me       = this,
            addr     = null,
            network  = (network) ? network : FW.WALLET_NETWORK,
            bc       = bitcore,
            n        = (network==2) ? 'testnet' : 'mainnet',
            force    = (force) ? true : false,
            net      = bc.Networks[n],
            key      = bc.HDPrivateKey.fromSeed(FW.WALLET_HEX, net);   // HD Private key object
            count    = (typeof count === 'number') ? count : 1,
            store    = Ext.getStore('Addresses'),
            total    = 0;
        // Remove any filters on the store so we are dealing with all the data
        // store.clearFilter();
        // Handle generating wallet addresses and adding them to the Addresses data store
        for( var i = 0; total<count; i++){
            var derived = key.derive("m/0'/0/" + i),
                address = bc.Address(derived.publicKey, net).toString();
                found   = false;
            // Check if this record already exists
            Ext.each(store.data.all,function(rec){
                if(rec.data.address==address){
                    found = true;
                    return false;
                }
            });
            // Increase total count unless we are forcing address generation
            if(!force)
                total++;
            // Add address to datastore
            if(!found){
                if(force)
                    total++;
                var rec = store.add({
                    id: FW.WALLET_PREFIX + '-' + network + '-' + (i+1),
                    index: i,
                    prefix: FW.WALLET_PREFIX,
                    network: network,
                    address: address,
                    label: 'Address #' + (i+1)
                });
                // Mark record as dirty so we save to disk on next sync
                rec[0].setDirty();
                addr = address;
            }
        }
        me.saveStore('Addresses');
        if(alert)
            Ext.Msg.alert('New Address', addr);
        return addr;
    },

    addETHWalletAddress: function (count, network, force, alert) {
        console.log("line 653");
        var me = this,
            addr = null,
            network = (network) ? network : FW.ETHWALLET_NETWORK,
            bc = bitcore,
            n = (network == 2) ? 'testnet' : 'mainnet',
            force = (force) ? true : false,
            net = bc.Networks[n],
            key = bc.HDPrivateKey.fromSeed(FW.ETHWALLET_HEX, net);   // HD Private key object
        count = (typeof count === 'number') ? count : 1,
            store = Ext.getStore('ETHAddresses'),
            total = 0;
        // Remove any filters on the store so we are dealing with all the data
        // store.clearFilter();
        // Handle generating wallet addresses and adding them to the Addresses data store
        for (var i = 0; total < count; i++) {
            var derived = key.derive("m/0'/0/" + i),
                address = bc.Address(derived.publicKey, net).toString();
            found = false;
            // Check if this record already exists
            Ext.each(store.data.all, function (rec) {
                if (rec.data.address == address) {
                    found = true;
                    return false;
                }
            });
            // Increase total count unless we are forcing address generation
            if (!force)
                total++;
            // Add address to datastore
            if (!found) {
                if (force)
                    total++;
                var rec = store.add({
                    id: FW.ETHETHWALLET_PREFIX + '-' + network + '-' + (i + 1),
                    index: i,
                    prefix: FW.ETHWALLET_PREFIX,
                    network: network,
                    address: address,
                    label: 'Address #' + (i + 1)
                });
                // Mark record as dirty so we save to disk on next sync
                rec[0].setDirty();
                addr = address;
            }
        }
        me.saveStore('ETHAddresses');
        console.log("line 699");
        if (alert)
            Ext.Msg.alert('New Address', addr);
        return addr;
    },


    // Handle setting the wallet network (1=mainnet/2=testnet)
    setWalletNetwork: function(network, load){
        // console.log('setWalletNetwork network, load=',network,load);
        var me = this,
            sm = localStorage,
            net = (network==2) ? 'testnet' : 'mainnet';
        // Update wallet network san d
        FW.WALLET_NETWORK = network;
        sm.setItem('network',  network);
        // Change change window.NETWORK so thinks work nicely in util.bitcore.js
        window.NETWORK = bitcore.Networks[net];
        // Handle loading the first address for this network
        if(load){
            var addr = me.getFirstWalletAddress(network);
            if(addr)
                me.setWalletAddress(addr, true);
        }
    },

    setETHWalletNetwork: function (network, load) {
        console.log('setETHWalletNetwork network, load=',network,load);
        var me = this,
            sm = localStorage,
            net = (network == 2) ? 'testnet' : 'mainnet';
        // Update wallet network san d
        FW.ETHWALLET_NETWORK = network;
        sm.setItem('ETHnetwork', network);
        // Change change window.NETWORK so thinks work nicely in util.bitcore.js
        //window.NETWORK = bitcore.Networks[net];
        // Handle loading the first address for this network
        if (load) {
            var addr = me.getFirstETHWalletAddress(network);
            if (addr)
                me.setETHWalletAddress(addr, true);
        }
    },


    // Handle setting the wallet address
    setWalletAddress: function(address, load){
        // console.log('setWalletAddress address, load=',address,load);
        var me        = this,
            sm        = localStorage,
            info      = false,
            prefix    = String(address).substr(0,5),
            addresses = Ext.getStore('Addresses'),
            balances  = Ext.getStore('Balances'),
            history   = Ext.getStore('Transactions');
        // Remove any filters on the store so we are dealing with all the data
        addresses.clearFilter();
        balances.clearFilter();
        // Try to find wallet address information in the datastore
        addresses.each(function(rec){
            if(rec.data.address==address)
                info = rec.data;
        });
        // Only proceed if we have valid wallet information
        if(info){
            // Save current address info to statemanager
            sm.setItem('address',info.address)
            // Save the full wallet info
            FW.WALLET_ADDRESS = info;
            // Try to lookup settings panel and set/update address and label
            var cmp = Ext.getCmp('settingsPanel');
            if(cmp){
                cmp.address.setValue(info.address);
                cmp.label.setValue(info.label);
            }
            // Handle loading address balances and history
            if(load){
                history.removeAll();
                me.getAddressBalances(address);
                me.getAddressHistory(address);
            }
            // Filter stores to only display info for this address
            balances.filter('prefix', prefix);
            history.filter('prefix', prefix);
            // Handle updating any views which display the current address
            var view = Ext.getCmp('receiveView');
            if(view)
                view.address.setValue(address);

        }
    },

    setETHWalletAddress: function (address, load) {
        console.log('setETHWalletAddress address, load=',address,load);
        var me = this,
            sm = localStorage,
            info = false,
            prefix = String(address).substr(0, 5),
            addresses = Ext.getStore('ETHAddresses'),
            balances = Ext.getStore('ETHBalances'),
            history = Ext.getStore('ETHTransactions');
        // Remove any filters on the store so we are dealing with all the data
        addresses.clearFilter();
        balances.clearFilter();
        // Try to find wallet address information in the datastore
        addresses.each(function (rec) {
            if (rec.data.address == address)
                info = rec.data;
        });
        // Only proceed if we have valid wallet information
        if (info) {
            console.log("Valid wallet information exists");
            // Save current address info to statemanager
            sm.setItem('address', info.address)
            // Save the full wallet info
            FW.ETHWALLET_ADDRESS = info;
            // Try to lookup settings panel and set/update address and label
            var cmp = Ext.getCmp('settingsPanel');
            if (cmp) {
                cmp.address.setValue(info.address);
                cmp.label.setValue(info.label);
            }
            // Handle loading address balances and history
            if (load) {
                history.removeAll();
                me.getETHAddressBalances(address);
                me.getETHAddressHistory(address);
            }
            // Filter stores to only display info for this address
            balances.filter('prefix', prefix);
            history.filter('prefix', prefix);
            // Handle updating any views which display the current address
            var view = Ext.getCmp('receiveView');
            if (view)
                view.address.setValue(address);

        }
    },
    // Handle setting the wallet address label
    setWalletAddressLabel: function(val, addr){
        var me    = this,
            sm    = localStorage,
            store = Ext.getStore('Addresses'),
            addr  = (addr) ? addr : FW.WALLET_ADDRESS.address;
        // Remove any filters on the store so we are dealing with all the data
        store.clearFilter();
        // Locate address and update stored label value
        store.each(function(rec){
            var o = rec.data;
            if(o.network==FW.WALLET_NETWORK && o.prefix==FW.WALLET_PREFIX && o.address==addr){
                FW.WALLET_ADDRESS.label = val;
                o.label = val;
                rec.setDirty(true);
                return false;
            }
        });
        // Save any changes to disk
        store.sync();
        // Update the label above the address balances list
        var cmp = Ext.getCmp('balancesView');
        if(cmp)
            //cmp.list.tb.tb.setTitle(val);
        var cmp = Ext.getCmp('transactionsList');
        if(cmp)
            cmp.tb.tb.setTitle(val);
    },

    setETHWalletAddressLabel: function (val, addr) {
        var me = this,
            sm = localStorage,
            store = Ext.getStore('ETHAddresses'),
            addr = (addr) ? addr : FW.ETHWALLET_ADDRESS.address;
        // Remove any filters on the store so we are dealing with all the data
        store.clearFilter();
        // Locate address and update stored label value
        store.each(function (rec) {
            var o = rec.data;
            if (o.network == FW.ETHWALLET_NETWORK && o.prefix == FW.ETHWALLET_PREFIX && o.address == addr) {
                FW.ETHWALLET_ADDRESS.label = val;
                o.label = val;
                rec.setDirty(true);
                return false;
            }
        });
        // Save any changes to disk
        store.sync();
        // Update the label above the address balances list
        var cmp = Ext.getCmp('balancesView');
        if (cmp)
            cmp.list.tb.tb.setTitle(val);
        var cmp = Ext.getCmp('transactionsList');
        if (cmp)
            cmp.tb.tb.setTitle(val);
    },


    // Handle getting first address for a given network
    getFirstWalletAddress: function(network){
        var me    = this,
            store = Ext.getStore('Addresses'),
            addr  = false;
        // Remove any filters on the store so we are dealing with all the data
        store.clearFilter();
        // Locate the first address
        store.each(function(rec){
            var o = rec.data;
            if(o.network==network && o.prefix==FW.WALLET_PREFIX && o.index==0){
                addr = o.address;
                return false;
            }
        });
        return addr;
    },

    getFirstETHWalletAddress: function (network) {
        var me = this,
            store = Ext.getStore('ETHAddresses'),
            addr = false;
        // Remove any filters on the store so we are dealing with all the data
        store.clearFilter();
        // Locate the first address
        store.each(function (rec) {
            var o = rec.data;
            if (o.network == network && o.prefix == FW.ETHWALLET_PREFIX && o.index == 0) {
                addr = o.address;
                return false;
            }
        });
        return addr;
    },


    // Handle getting a price for a given currency/type
    getCurrencyPrice: function(currency, type){
        var value = false;
        Ext.each(FW.NETWORK_INFO.currency_info, function(item){
            if(item.id==currency){
                if(type=='usd')
                    value = item.price_usd;
                if(type=='btc')                
                    value = item.price_btc;
            }
        });
        return value;
    },

    getETHCurrencyPrice: function (currency, type) {
        var value = false;
        Ext.each(FW.ETHNETWORK_INFO.currency_info, function (item) {
            if (item.id == currency) {
                if (type == 'usd')
                    value = item.price_usd;
                if (type == 'btc')
                    value = item.price_btc;
                if (type == 'eth')
                    value = item.price_eth;
            }
        });
        return value;
    },


    // Handle getting address balance information
    getAddressBalances: function(address, callback){
        var me     = this,
            addr   = (address) ? address : FW.WALLET_ADDRESS.address,
            prefix = addr.substr(0,5),
            store  = Ext.getStore('Balances'),
            net    = (FW.WALLET_NETWORK==2) ? 'tbtc' : 'btc',
            hostA  = (FW.WALLET_NETWORK==2) ? 'tbtc.blockr.io' : 'btc.blockr.io',
            hostB  = (FW.WALLET_NETWORK==2) ? 'testnet.xchain.io' : 'xchain.io';
        // Get Address balance from blocktrail
        me.ajaxRequest({
            url: 'https://api.blocktrail.com/v1/' + net + '/address/' + address + '?api_key=' + FW.API_KEYS.BLOCKTRAIL,
            success: function(o){
                if(o.address){
                    var quantity  = (o.balance) ? numeral(o.balance * 0.00000001).format('0.00000000') : '0.00000000',
                        price_usd = me.getCurrencyPrice('bitcoin','usd'),
                        price_btc = me.getCurrencyPrice('counterparty','btc'),
                        values    = { 
                            usd: numeral(parseFloat(price_usd * quantity)).format('0.00000000'),
                            btc: '1.00000000',
                            xcp: (price_btc) ? numeral(1 / price_btc).format('0.00000000') : '0.00000000'
                        };
                    me.updateAddressBalance(address, 1, 'BTC','', quantity, values);
                    me.saveStore('Balances');
                    // App store is rejecting app with donate button, so hide it if BTC balance is 0.00000000... shhh :)
                    if(Ext.os.name=='iOS'){
                        var cmp = Ext.getCmp('aboutView');
                        if(cmp){
                            if(quantity=='0.00000000'){
                                cmp.donate.hide();
                            } else {
                                cmp.donate.show();
                            }
                        }
                    }
                }
                // Handle processing callback now
                if(callback)
                    callback();
            },
            failure: function(o){
                // If the request to blocktrail API failed, fallback to slower blockr.io API
                me.ajaxRequest({
                    url: 'https://' + hostA + '/api/v1/address/info/' + address,
                    success: function(o){
                        if(o.data){
                            var quantity  = (o.data.balance) ? numeral(o.data.balance).format('0.00000000') : '0.00000000',
                                price_usd = me.getCurrencyPrice('bitcoin','usd'),
                                price_btc = me.getCurrencyPrice('counterparty','btc'),
                                values    = { 
                                    usd: numeral(price_usd * quantity).format('0.00000000'),
                                    btc: '1.00000000',
                                    xcp: (price_btc) ? numeral(1 / price_btc).format('0.00000000') : '0.00000000'
                                };
                            me.updateAddressBalance(address, 1, 'BTC','', quantity, values);
                            me.saveStore('Balances');
                        }
                    },
                    callback: function(){
                        // Handle processing callback now
                        if(callback)
                            callback();
                    }
                });
            }
        });
        // Get Asset balances
        me.ajaxRequest({
            url: 'https://' + hostB + '/api/balances/' + address,
            success: function(o){
                if(o.data){
                    Ext.each(o.data, function(item){
                        var type = (item.asset=='XCP') ? 1 : 2;
                        me.updateAddressBalance(address, type, item.asset, item.asset_longname, item.quantity, item.estimated_value);
                    });
                } else {
                    // Show 0.00000000 for XCP balance if we have none (prevent display on iOS)
                    if(!(me.isNative && Ext.os.name=='iOS'))
                        me.updateAddressBalance(address, 1, 'XCP', '', '0.00000000');
                }
                me.saveStore('Balances');
            }
        }, true);            
    },
   
    callWeb3GetBalance: async function(address) {
        //var web3 = new Web3("http://52.87.221.111:8545");
        var balance = await(web3.eth.getBalance(address));
        return web3.utils.fromWei(balance,'ether');
    },

    getETHAddressBalances: async function (address, callback) {
    //implement web3 get balance
        var me = this,
            addr = (address) ? address : FW.ETHWALLET_ADDRESS.address,
            prefix = addr.substr(0, 5),
            store = Ext.getStore('Balances'),
            net = (FW.ETHWALLET_NETWORK == 2) ? 'tbtc' : 'btc',
            hostA = (FW.ETHWALLET_NETWORK == 2) ? 'tbtc.blockr.io' : 'btc.blockr.io',
            hostB = (FW.ETHWALLET_NETWORK == 2) ? 'testnet.xchain.io' : 'xchain.io';
        console.log("address is: ", addr);
        ETHbalance = await(me.callWeb3GetBalance(addr));
        console.log("Balance is: ",ETHbalance);
        await(fetch('https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=USD', {
        //modes go here
        }).then(function(response) {
            //console.log(response);
            return response.json();
        }).then(function(data){
            //console.log(data);
            price_usd = data.USD;
            console.log(price_usd);
        }).catch(function() {
            console.log("Check price does not work");
        }));
        //price_usd = me.getCurrencyPrice('ethereum', 'usd'),
        //price_eth = me.getCurrencyPrice('counterparty', 'eth'),
        values = {
            usd: numeral(parseFloat(price_usd * ETHbalance)).format('0.00')  
        };
        me.updateETHAddressBalance(address, 1, 'ETH', '', ETHbalance, values);
        me.saveStore('ETHBalances');
        // App store is rejecting app with donate button, so hide it if ETH balance is 0.00000000... shhh :)
        if (Ext.os.name == 'iOS') {
            var cmp = Ext.getCmp('aboutView');
            if (cmp) {
                if (balance == '0.00000000') {
                    cmp.donate.hide();
                } else {
                    cmp.donate.show();
                }
            }
        }
        // Handle processing callback now
        if(callback)
            callback();
    },

    // Handle saving a datastore to disk
    saveStore: function(id){
        var store = Ext.getStore(id);
        if(store)
            store.sync();
    },


    // Handle creating/updating address balance records in datastore
    updateAddressBalance: function(address, type, asset, asset_longname, quantity, estimated_value){
        // console.log('updateAddressBalance address, type, asset, asset_longname, quantity, estimated_value=',address, type, asset, asset_longname, quantity, estimated_value);
        var me     = this,
            addr   = (address) ? address : FW.WALLET_ADDRESS,
            prefix = addr.substr(0,5),
            store  = Ext.getStore('Balances');
            record = store.add({
                id: prefix + '-' + asset,
                type: type,
                prefix: prefix,
                asset: asset,
                asset_longname: asset_longname,
                display_name: (asset_longname!='') ? asset_longname : asset,
                quantity: quantity,
                estimated_value: estimated_value
            });
        // Mark record as dirty, so we save it to disk on the next sync
        record[0].setDirty();
    },

    updateETHAddressBalance: function (address, type, asset, asset_longname, quantity, estimated_value) {
        // console.log('updateAddressBalance address, type, asset, asset_longname, quantity, estimated_value=',address, type, asset, asset_longname, quantity, estimated_value);
        var me = this,
            addr = (address) ? address : FW.ETHWALLET_ADDRESS,
            prefix = addr.substr(0, 5),
            store = Ext.getStore('ETHBalances');
        record = store.add({
            id: prefix + '-' + asset,
            type: type,
            prefix: prefix,
            asset: asset,
            asset_longname: asset_longname,
            display_name: (asset_longname != '') ? asset_longname : asset,
            quantity: quantity,
            estimated_value: estimated_value
        });
        // Mark record as dirty, so we save it to disk on the next sync
        record[0].setDirty();
    },


    // Handle prompting user to enter a wallet passphrase
    promptWalletPassphrase: function(callback){
        var me = this;
        Ext.Msg.show({
            message:'Please enter your<br/>12-word passphrase',
            multiLine: true,
            buttons: Ext.MessageBox.OKCANCEL,
            prompt: {
                cls: 'fw-panel',
                xtype: 'textareafield',
                placeholder: 'Enter Wallet Passphrase'
            },
            fn: function(btn, val){
                // Handle validating that the entered value is a valid passphrase
                if(btn=='ok'){
                    var valid = false,
                        arr   = val.trim().split(" ");
                    // Validate that the passphrase is 12 words in length and all words are on the wordlist
                    if(arr.length==12){
                        valid = true;
                        Ext.each(arr, function(item){
                            if(Mnemonic.words.indexOf(item)==-1){
                                valid = false;
                                return false;
                            }
                        });
                    }
                    // Handle creating wallet using given passphrase
                    if(valid){
                        if(typeof callback === 'function')
                            callback(val);
                    } else {
                        // Defer message a bit to prevent knkown issue in sencha touch library (https://www.sencha.com/forum/showthread.php?279721)
                        Ext.defer(function(){
                            Ext.Msg.alert(null, 'Invalid Passphrase', function(){ 
                                Ext.defer(function(){
                                    me.promptWalletPassphrase(callback) 
                                },10);
                            });
                        },10);
                    }

                }
            }
        });
    },

    // Handle confirming with user that they really want to logou
    promptLogout: function(){
        // Confirm with user that they want to generate new wallet
        Ext.Msg.confirm('Logout / Clear Data', 'Are you sure?', function(btn){
            if(btn=='yes'){
                localStorage.clear();
                location.reload();
            }
        });
    },


    // Handle prompting user to enter a private key
    promptAddressPrivkey: function(callback){
        var me  = this,
            bc  = bitcore,
            net = (FW.WALLET_NETWORK==2) ? 'testnet' : 'mainnet';
        Ext.Msg.show({
            message:'Please enter your<br/>unencrypted private key',
            multiLine: true,
            buttons: Ext.MessageBox.OKCANCEL,
            prompt: {
                cls: 'fw-panel',
                xtype: 'textareafield',
                placeholder: 'Unencrypted private key'
            },
            fn: function(btn, val){
                // Handle validating that the entered value is a valid passphrase
                if(btn=='ok'){
                    var address = false;
                    try {
                        privkey = new bc.PrivateKey.fromWIF(val);
                        pubkey  = privkey.toPublicKey();
                        address = pubkey.toAddress(net).toString();
                    } catch (e){
                        console.log('error : ',e);
                    }
                    // Handle creating wallet using given passphrase
                    if(address){
                        if(typeof callback === 'function')
                            callback(address, val);
                    } else {
                        // Defer message a bit to prevent knkown issue in sencha touch library (https://www.sencha.com/forum/showthread.php?279721)
                        Ext.defer(function(){
                            Ext.Msg.alert(null, 'Invalid Private key', function(){ 
                                Ext.defer(function(){
                                    me.promptAddressPrivkey(callback) 
                                },10);
                            });
                        },10);
                    }
                }
            }
        });
    },

        // Handle clearing sencha app-cache to force reload of files
    // fixes issue with app not updating localStorage properly at times
    clearAppCache: function(reload){
        var ls   = localStorage,
            keys = [],
            patt = [
                'app.js',
                'app.json',
                'resources/'
            ];
        // Loop through all keys and find any that match our patterns
        for(var i = 0, ln = ls.length; i < ln; i += 1){
            var key = ls.key(i);
            if(key){
                patt.forEach(function(pattern){
                    if(key.indexOf(pattern)!== -1)
                        keys.push(key);
                });
            }
        }
        keys.forEach(function(key){
            console.log('removing appCache item ' + key);
            ls.removeItem(key);
        });
        // Handle reloading window after 1 second
        if(reload)
            Ext.defer(function(){
                window.location.reload();
            },1000);
    },

    // Handle setting the user passcode and saving it to disk so we can validate it later
    setPasscode: function(code){
        var me = this,
            sm = localStorage;
        if(code){
            FW.WALLET_PASSCODE = code;
            var enc = CryptoJS.AES.encrypt(String(FW.WALLET_PASSCODE), String(FW.WALLET_PASSCODE)).toString();
            sm.setItem('passcode', enc);
        }
    },


    // Handle verifying if a given passcode is correct
    isValidPasscode: function(code){
        var me = this,
            sm = localStorage,
            p  = sm.getItem('passcode');
        if(code){
            var dec = '';
            // Try to decrypt the encryptd passcode using the given passcode... catch any errors and treat as failures
            try {
                dec = CryptoJS.AES.decrypt(p, String(code)).toString(CryptoJS.enc.Utf8);
            } catch(e){
            }
            if(dec==code)
                return true
        }
        return false;
    },


    // Handle getting address history information
    getAddressHistory: function(address, callback){
        var me = this;
        // Define callback function to call after getting BTC transaction history
        // var cb = function(){ me.getCounterpartyTransactionHistory(address, callback); }
        // Handle getting Bitcoin transaction data
        me.getTransactionHistory(address, callback);
    },

    // Handle getting Bitcoin transaction history
    getTransactionHistory: function(address, callback){
        var me    = this,
            net   = (FW.WALLET_NETWORK==2) ? 'tbtc' : 'btc',
            hostA = (FW.WALLET_NETWORK==2) ? 'tbtc.blockr.io' : 'btc.blockr.io',
            hostB = (FW.WALLET_NETWORK==2) ? 'testnet.xchain.io' : 'xchain.io',
            types = ['bets','broadcasts','burns','dividends','issuances','orders','sends','mempool'];
        // Get BTC transaction history from blocktrail
        me.ajaxRequest({
            url: 'https://api.blocktrail.com/v1/' + net + '/address/' + address + '/transactions?limit=100&sort_dir=desc&api_key=' + FW.API_KEYS.BLOCKTRAIL,
            success: function(o){
                Ext.each(o.data, function(item,idx){
                    var time  = (item.block_height) ? moment(item.time,["YYYY-MM-DDTH:m:s"]).unix() : null,
                        value = numeral((item.estimated_value) * 0.00000001).format('0.00000000')
                    if(item.inputs[0].address==address)
                        value = '-' + value;
                    me.updateTransactionHistory(address, item.hash, 'send', 'BTC', null, value , time);
                });
                me.saveStore('Transactions');
                // Handle processing callback now
                if(callback)
                    callback();
            },
            failure: function(o){
                // If the request to blocktrail API failed, fallback to slower blockr.io API
                me.ajaxRequest({
                    url: 'https://' + hostA + '/api/v1/address/txs/' + address,
                    success: function(o){
                        if(o.data && o.data.txs){
                            Ext.each(o.data.txs, function(item,idx){
                                // Only pay attention to the last 100 transactions
                                if(idx<99){
                                    var time = moment(item.time_utc,["YYYY-MM-DDTH:m:s"]).unix();
                                    me.updateTransactionHistory(address, item.tx, 'send', 'BTC', null, item.amount, time);
                                }
                            });
                            me.saveStore('Transactions');
                        }
                        // Handle processing callback now
                        if(callback)
                            callback();
                    },
                    failure: function(o){
                        // Handle processing callback now
                        if(callback)
                            callback();

                    }
                });

            }
        });        
        // Loop through transaction types and get latest transactions
        Ext.each(types, function(type){
            me.ajaxRequest({
                url: 'https://' + hostB + '/api/' + type + '/' + address,
                success: function(o){
                    if(o.data){
                        // Strip trailing s off type to make it singular
                        if(String(type).substring(type.length-1)=='s')
                            type = String(type).substring(0,type.length-1);
                        // Loop through data and add to transaction list
                        Ext.each(o.data, function(item){
                            var asset    = item.asset,
                                quantity = item.quantity,
                                tstamp   = item.timestamp,
                                tx_type  = type;
                            // Set type from mempool data, and reset timestamp, so things show as pending
                            if(tx_type=='mempool'){
                                tx_type = String(item.tx_type).toLowerCase();
                                tstamp  = null;
                            }
                            if(tx_type=='bet'){
                                asset    = 'XCP';
                                quantity = item.wager_quantity;
                            } else if(tx_type=='burn'){
                                asset    = 'BTC';
                                quantity = item.burned;
                            } else if(tx_type=='order'){
                                asset    = item.get_asset,
                                quantity = item.get_quantity;
                            } else if(tx_type=='send'){
                                if(item.source==address)
                                    quantity = '-' + quantity;
                            }
                            me.updateTransactionHistory(address, item.tx_hash, tx_type, asset, item.asset_longname, quantity, tstamp);
                        });
                        me.saveStore('Transactions');
                    }
                }
            });
        });        
    },

    getETHAddressHistory: function(address, callback){
        var me = this;
        // Define callback function to call after getting BTC transaction history
        // var cb = function(){ me.getCounterpartyTransactionHistory(address, callback); }
        // Handle getting Bitcoin transaction data
        me.getTransactionHistory(address, callback);
    },

    // Handle getting Bitcoin transaction history
    getTransactionHistory: function(address, callback){
        var me    = this,
            net   = (FW.WALLET_NETWORK==2) ? 'tbtc' : 'btc',
            hostA = (FW.WALLET_NETWORK==2) ? 'tbtc.blockr.io' : 'btc.blockr.io',
            hostB = (FW.WALLET_NETWORK==2) ? 'testnet.xchain.io' : 'xchain.io',
            types = ['bets','broadcasts','burns','dividends','issuances','orders','sends','mempool'];
        // Get BTC transaction history from blocktrail
        me.ajaxRequest({
            url: 'https://api.blocktrail.com/v1/' + net + '/address/' + address + '/transactions?limit=100&sort_dir=desc&api_key=' + FW.API_KEYS.BLOCKTRAIL,
            success: function(o){
                Ext.each(o.data, function(item,idx){
                    var time  = (item.block_height) ? moment(item.time,["YYYY-MM-DDTH:m:s"]).unix() : null,
                        value = numeral((item.estimated_value) * 0.00000001).format('0.00000000')
                    if(item.inputs[0].address==address)
                        value = '-' + value;
                    me.updateTransactionHistory(address, item.hash, 'send', 'BTC', null, value , time);
                });
                me.saveStore('Transactions');
                // Handle processing callback now
                if(callback)
                    callback();
            },
            failure: function(o){
                // If the request to blocktrail API failed, fallback to slower blockr.io API
                me.ajaxRequest({
                    url: 'https://' + hostA + '/api/v1/address/txs/' + address,
                    success: function(o){
                        if(o.data && o.data.txs){
                            Ext.each(o.data.txs, function(item,idx){
                                // Only pay attention to the last 100 transactions
                                if(idx<99){
                                    var time = moment(item.time_utc,["YYYY-MM-DDTH:m:s"]).unix();
                                    me.updateTransactionHistory(address, item.tx, 'send', 'BTC', null, item.amount, time);
                                }
                            });
                            me.saveStore('Transactions');
                        }
                        // Handle processing callback now
                        if(callback)
                            callback();
                    },
                    failure: function(o){
                        // Handle processing callback now
                        if(callback)
                            callback();

                    }
                });

            }
        });        
        // Loop through transaction types and get latest transactions
        Ext.each(types, function(type){
            me.ajaxRequest({
                url: 'https://' + hostB + '/api/' + type + '/' + address,
                success: function(o){
                    if(o.data){
                        // Strip trailing s off type to make it singular
                        if(String(type).substring(type.length-1)=='s')
                            type = String(type).substring(0,type.length-1);
                        // Loop through data and add to transaction list
                        Ext.each(o.data, function(item){
                            var asset    = item.asset,
                                quantity = item.quantity,
                                tstamp   = item.timestamp,
                                tx_type  = type;
                            // Set type from mempool data, and reset timestamp, so things show as pending
                            if(tx_type=='mempool'){
                                tx_type = String(item.tx_type).toLowerCase();
                                tstamp  = null;
                            }
                            if(tx_type=='bet'){
                                asset    = 'XCP';
                                quantity = item.wager_quantity;
                            } else if(tx_type=='burn'){
                                asset    = 'BTC';
                                quantity = item.burned;
                            } else if(tx_type=='order'){
                                asset    = item.get_asset,
                                quantity = item.get_quantity;
                            } else if(tx_type=='send'){
                                if(item.source==address)
                                    quantity = '-' + quantity;
                            }
                            me.updateTransactionHistory(address, item.tx_hash, tx_type, asset, item.asset_longname, quantity, tstamp);
                        });
                        me.saveStore('Transactions');
                    }
                }
            });
        });        
    },


    // Handle creating/updating address transaction history
    updateTransactionHistory: function(address, tx, type, asset, asset_longname, quantity, timestamp){
        // console.log('updateTransactionHistory address, tx, type, asset, asset_longname, amount, timestamp=', address, tx, type, asset, asset_longname, quantity, timestamp);
        var me     = this,
            addr   = (address) ? address : FW.WALLET_ADDRESS.address,
            store  = Ext.getStore('Transactions'),
            time   = (timestamp) ? timestamp : 0,
            record = {};
        // Get currenct record info (if any)
        store.each(function(rec){
            if(rec.raw.hash==tx){
                record = rec.raw;
                return false;                
            }
        });
        // Bail out if this is already a known transaction
        if(asset=='BTC' && typeof record.hash !== 'undefined')
            return;
        var rec = {
            id: addr.substr(0,5) + '-' + tx.substr(0,5),
            prefix: addr.substr(0,5),
            type: type,
            hash: tx,
            asset: (asset_longname) ? asset_longname : asset
        };
        // Only set amount if we have one
        if(quantity)
            rec.quantity = String(quantity).replace('+','')
        // Only set timestamp if we have one
        if(time)
            rec.time = time;
        var records = store.add(Ext.applyIf(rec, record));
        // Mark record as dirty so that we save to disk on next sync
        records[0].setDirty();
    },


    // Handle toggling hiding/showing the sidemenu
    showMainMenu: function(side){
        var me   = this,
            vp   = Ext.Viewport,
            main = Ext.getCmp('mainView'),
            side = (side) ? side : 'right';
        // Handle creating the menuTree if we don't already have one
        if(!me.menu)
            me.menu = Ext.create('FW.view.MainMenu');
        // Set the sidemenu to this menu, and show the menu
        vp.setMenu(me.menu, { side:side, cover: true });
        vp.showMenu(side);
    },


    // Detect if a string is a valid URL
    isUrl: function(str){
        var me = this,
            re = /^(http|https):\/\/(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/i;
        return re.test(str)
    },


    // Handle opening urls 
    openUrl: function(url){
        var me = this,
            re = /^(http|https):\/\//i;
        if(url){
            // Handle adding http:// to any invalid URLs
            if(!re.test(url))
                url = 'http://' + url;
            if(me.isUrl(url)){
                var loc = (me.isNative) ? '_system' : '_blank';
                window.open(url,loc);
            }
        }
    },


    // Handle converting an amount to satoshis
    getSatoshis: function(amount){
        var num = numeral(amount);
        if(/\./.test(amount))
            num.multiply(100000000);
        return parseInt(num.format('0'));
    },


    // Handle getting a private key for a given network and address
    getPrivateKey: function(network, address){
        var me    = this,
            bc    = bitcore,
            n     = (network==2) ? 'testnet' : 'mainnet',
            net   = bc.Networks[n],
            key   = bc.HDPrivateKey.fromSeed(FW.WALLET_HEX, net),   // HD Private key object
            store = Ext.getStore('Addresses'),
            priv  = false,
            index = false;
        // Check any imported/saved private keys
        var priv = FW.WALLET_KEYS[address];
        // Loop through HD addresses trying to find private key
        if(!priv){
            // Try to lookup the address index in store
            Ext.each(store.data.all, function(rec){
                if(rec.data.address==address)
                    index = rec.data.index;
            });
            // If we have an index, use it
            if(index!==false){
                var derived = key.derive("m/0'/0/" + index);
                priv = derived.privateKey.toWIF();
            } else {
                // Loop through first 50 addresses trying to find
                for(var i=0; i<50; i++){
                    var derived = key.derive("m/0'/0/" + index),
                        addr    = bc.Address(derived.publicKey, net).toString();
                    if(address==addr)
                        priv = derived.privateKey.toWIF();
                }
            }
        }
        return priv;
    }, 


    // Handle Translating a scanned qrcode into a data object
    getScannedData: function(data){
        // console.log('getScannedData data=',data);
        var addr = data,
            btc  = /^(bitcoin|counterparty):/i,
            url  = /^(http|https):/i,
            o    = { valid: false };
        // Handle parsing in bitcoin ands counterparty URI data
        if(btc.test(data)){
            // Extract data into object
            var x    = data.replace(btc,'').split('?'),
                y    = (x[1]) ? x[1].split('&') : [],
                addr = x[0];
            for (var i = 0; i < y.length; i++){
                var z = y[i].split('=');
                o[decodeURIComponent(z[0])] = decodeURIComponent(z[1]).replace(/\+/g,' ').trim();
            }
        }
        // Handle validating that the provided address is valid
        if(addr.length>25 && CWBitcore.isValidAddress(addr)){
            o.valid   = true;
            o.address = addr;
        } else {
            // If action is specified, assume valid
            if(o.action)
                o.valid = true;
            if(url.test(data)){
                o.valid = true;
                o.url   = data;
            }
        }
        return o;
    },

    // Handle extracting hostname from a url
    getUrlHostname: function(url){
        var arr  = url.split('/');
        // Remove protocol (http/https)
        var host = (url.indexOf("://") > -1) ? arr[2] : arr[0];
        // Remove Port
        host = host.split(':')[0];
        return host;
    },


    // Handle making a callback request to a server given a URL and some params
    serverCallback: function(url, params, method, callback){
        var me = this;
        // console.log('serverCallback', url, params, method, callback);
        // Convert querystring name/value pairs to params
        if(method=='POST'){
            var x = url.split('?');
            if(x[1])
                var y = x[1].split('&');
            url = x[0];
            Ext.each(y, function(val){
                var z = val.split('=');
                params[z[0]] = z[1];
            });
        }
        me.ajaxRequest({
            url: url,
            method: method || 'GET',
            params: params,
            failure: function(o){
                if(callback)
                    callback();
            },
            success: function(o){
                if(callback)
                    callback(o);
            }
        },true);
    },


    // Handle processing scanned QR Codes and performing the correct action based on scan
    processQRCodeScan: function(o){
        var me = this;
        // console.log('processQRCodeScan o=',o);
        if(o.action){
            // Handle signing messages
            if(o.action=='sign'){
                if(o.callback){
                    // Use given address or default to current address
                    var addr = (o.address) ? o.address : FW.WALLET_ADDRESS.address,
                        host = me.getUrlHostname(o.callback),
                        key  = me.getPrivateKey(FW.WALLET_NETWORK, addr);
                    // Only proceed if we were able to get the key for the address
                    if(key){
                        var sig = me.signMessage(FW.WALLET_NETWORK, addr, o.message);
                        if(sig){
                            o.address   = addr;
                            o.signature = sig;
                            // Confirm with user that they want to perform callback to remote server
                            me.showCallbackView(o);
                        } else {
                            Ext.Msg.alert(null,'Error while trying to sign message!');
                        }
                    } else {
                        Ext.Msg.alert(null,'Unable to sign message with given address!');
                    }
                } else {
                    // Show 'Sign' tool and pass message to sign
                    me.showTool('sign',{ message: o.message });
                }
            }
            // Show 'Broadcast' tool and pass message to broadcast
            if(o.action=='broadcast')
                me.showTool('broadcast',{ message: o.message });
            // Handle Betting
            if(o.action=='bet')
                Ext.Msg.alert(null,'Coming soon!');
        } else if(o.address){
            // Show 'Send' tool and pass forward scanned 
            me.showTool('send', { 
                reset: true,
                address: o.address,
                currency: o.asset || 'BTC',
                amount: o.amount || ''
            });
        } else if(o.url && /^(http|https):/i.test(o.url)){
            Ext.Msg.confirm(null,'Open url to ' + me.getUrlHostname(o.url) + '?',function(btn){
                if(btn=='yes')
                    me.openUrl(o.url);
            })
        } else {
            // Throw generic failure message if we were not able to 
            Ext.Msg.alert(null,'Unable to perform action based on scanned QR code data!');
        }        
    },


    // Handle general/generic QRCode scanning and processing of results
    generalQRCodeScan: function(data){
        var me = this;
        me.scanQRCode(null, Ext.bind(me.processQRCodeScan,me));
    },


    // Handle scanning a QR code both natively, and using HTML5
    scanQRCode: function(view, callback){
        var me = this,
            vp = Ext.Viewport;
        // Mask the viewport with 'Processing...' while scanning/processing the scan
        vp.setMasked({
            xtype: 'loadmask',
            message: 'Processing...'
        });
        // console.log('scanQRCode view=',view, callback);
        // Callback function run when scan has completed 
        var cb = function(data){
            // console.log('cb data=',data);
            if(data.valid && view && typeof view.updateForm === 'function')
                view.updateForm(data);
            if(typeof callback === 'function')
                callback(data);
            vp.setMasked(false);
        }
        // Handle native scanning via ZBar barcode scanner (https://github.com/tjwoon/csZBar)
        if(me.isNative){
            var onSuccess = function(data){
                cb(me.getScannedData(String(data)));
            };
            var onError = function(error){
                vp.setMasked(false);
                console.log('error=',error);
                // error('cancelled') If user cancelled the scan (with back button etc)
                // error('misc error message') Misc failure
            };
            // Initiate a scan
            cloudSky.zBar.scan({
                text_title: "Scan QR Code", // Android only
                text_instructions: "Please point your camera at the QR code.", // Android only
                camera: "back", // defaults to "back" (front/back)
                flash: "auto", // defaults to "auto". (on/off/auto)
                drawSight: false //defaults to true, create a red sight/line in the center of the scanner view.
            }, onSuccess, onError);
        } else {
            // Handle non-native scanning via HTML5 (https://github.com/LazarSoft/jsqrcode)
            me.showScanQRCodeView({ callback: cb });
        }
    },


    // Handle copying a string to the clipboard 
    copyToClipboard: function(str){
        var me = this;
        if(me.isNative)
            cordova.plugins.clipboard.copy(str);
    },


    // Handle enabling the passcode service by requiring a passcode and confirming it
    enablePasscode: function(){
        var me  = this;
        me.showPasscodeView({ 
            title: 'Please enter desired passcode',
            cb: function(val){
                var cmp = Ext.getCmp('settingsPanel');
                if(val){
                    // Confirm desired passcode
                    // Defer msg slightly to fix known issue in sencha touch library 
                    Ext.defer(function(){
                        me.showPasscodeView({
                            title: 'Please confirm desired passcode',
                            cb: function(val2){
                                if(val2 && val==val2){
                                    cmp.toggleField(cmp.passcode, 1,'Passcode enabled');
                                    me.setPasscode(val);
                                    me.encryptWallet();
                                    me.resetTouchId();
                                } else {
                                    cmp.toggleField(cmp.passcode, 0,'Passcode do not match');
                                }
                            }
                        });
                    },10);
                } else {
                    cmp.toggleField(cmp.passcode, 0,'No passcode entered');
                }
            }
        });
    },


    // Handle disabling the passcode service by requiring/validating passcode
    disablePasscode: function(){
        var me  = this,
            sm = localStorage;
        // Request passcode
        me.showPasscodeView({ 
            title: 'Please enter your passcode',
            cb: function(val){
                var cmp = Ext.getCmp('settingsPanel');
                if(val){
                    if(me.isValidPasscode(val)){
                        cmp.toggleField(cmp.passcode, 0,'Passcode disabled')
                        me.resetPasscode();
                    } else {
                        cmp.toggleField(cmp.passcode, 1,'Invalid passcode');
                    }
                } else {
                    cmp.toggleField(cmp.passcode, 1,'No passcode entered');
                }
            }
        });
    },


    // Handle resetting the wallet to use default passcode, and re-encrypt wallet 
    resetPasscode: function(){
        var me  = this,
            sm  = localStorage,
            cmp = Ext.getCmp('settingsPanel');
        cmp.toggleField(cmp.passcode, 0);
        sm.removeItem('passcode');
        FW.WALLET_PASSCODE = 0000;
        me.encryptWallet();
    },


    // Handle resetting the wallet to use default passcode, and re-encrypt wallet 
    resetTouchId: function(){
        var me  = this,
            sm  = localStorage,
            cmp = Ext.getCmp('settingsPanel');
        cmp.toggleField(cmp.touchid, 0);
        sm.removeItem('touchid');
        FW.TOUCHID = false;
    },


    // Handle prompting user for passcode and validating it before allowing them to main app
    authenticatePasscode: function(successFn, errorFn, text, force){
        var me   = this,
            text = (text) ? text: 'Please enter your passcode';
        me.showPasscodeView({
            title: text,
            cb: function(val){
                if(me.isValidPasscode(val)){
                    if(typeof successFn === 'function')
                        successFn(val);
                } else {
                    // Handle alerting user to invalid passcode, then re-authenticate
                    // Defer showing the message a bit to prevent a known issue in sencha-touch with showing messageboxes too fast
                    if(force){
                        Ext.defer(function(){
                            Ext.Msg.alert(null,'Invalid passcode', function(){
                                me.authenticatePasscode(successFn, errorFn, text, force);
                            });
                        },10);
                    } else if(typeof errorFn === 'function'){
                        errorFn();
                    }
                }
            }
        });
    },


    // Handle enabling Touch ID authentication
    enableTouchID: function(){
        var me  = this,
            sm  = localStorage,
            cmp = Ext.getCmp('settingsPanel');
        // Define function that enables touchID and disables passcode  toggle fields
        var successFn = function(){
            cmp.toggleField(cmp.touchid, 1, 'Touch ID enabled');
            sm.setItem('touchid', true);
            FW.TOUCHID = true;
            me.resetPasscode();
        };
        // Define function that disables touchID toggle field
        var errorFn = function(){
            cmp.toggleField(cmp.touchid, 0);
        }
        me.authenticateTouchID(successFn, errorFn, 'Enable Touch ID Authentication');
    },


    // Handle disabling Touch ID
    disableTouchID: function(){
        var me  = this,
            sm  = localStorage;
            cmp = Ext.getCmp('settingsPanel');
        // Define success function that disables touchId  
        var successFn = function(){
            cmp.toggleField(cmp.touchid, 0,'Touch ID disabled');
            me.resetTouchId();
        };
        var errorFn = function(){
            cmp.toggleField(cmp.touchid, 1);
        }
        me.authenticateTouchID(successFn, errorFn, 'Disable Touch ID Authentication');
    },



    // Handle Touch ID Authentication (iOS 8+)
    authenticateTouchID: function(successFn, errorFn, text, force){
        var me = this;
        // Define error callback function
        var errorCb = function(){
            if(force){
                Ext.defer(function(){
                    Ext.Msg.alert(null,'Invalid Authentication', function(){
                        me.authenticateTouchID(successFn, errorFn, text, force);
                    });
                },10);
            } else if(typeof errorFn === 'function'){
                errorFn();
            }
        };
        // Handle requesting Touch ID authentication via plugin
        if(me.isNative){
            touchid.authenticate(successFn, errorCb, text);        
        } else {
            // Fake success for non-native
            successFn();
        }
    },


    // Handle signing a message and returning the signature
    signMessage: function(network, address, message){
        var me  = this,
            bc  = bitcore,
            key = bc.PrivateKey.fromWIF(me.getPrivateKey(network, address)),
            sig = bc.Message(message).sign(key);
        return sig;
    },


    // Handle getting a balance for a given asset
    getBalance: function(asset){
        var balances = Ext.getStore('Balances'),
            balance  = 0,
            prefix   = FW.WALLET_ADDRESS.address.substr(0,5);
        balances.each(function(item){
            var rec = item.data;
            if(rec.prefix==prefix && rec.asset==asset){
                balance = rec.quantity;
                return false;
            }
        });
        return balance;
    },

    getETHBalance: function(asset){
        var balances = Ext.getStore('ETHBalances'),
            balance  = 0,
            prefix   = FW.ETHWALLET_ADDRESS.address.substr(0,5);
        balances.each(function(item){
            var rec = item.data;
            if(rec.prefix==prefix && rec.asset==asset){
                balance = rec.quantity;
                return false;
            }
        });
        return balance;
    },


    // Handle signing a transaction
    signTransaction: function(network, source, unsignedTx, callback){
        var me       = this,
            bc       = bitcore,
            callback = (typeof callback === 'function') ? callback : false;
            net      = (network==2) ? 'testnet' : 'mainnet',
            privKey  = me.getPrivateKey(network, source)
            cwKey    = new CWPrivateKey(privKey);
        // update network (used in CWBitcore)
        NETWORK  = bc.Networks[net];
        // Callback to processes response from signRawTransaction()
        var cb = function(x, signedTx){
            if(callback)
                callback(signedTx);
        }
        CWBitcore.signRawTransaction(unsignedTx, cwKey, cb);
    },


    // Handle broadcasting a given transaction
    broadcastTransaction: function(network, tx, callback){
        var me  = this,
            net  = (network==2) ? 'BTCTEST' : 'BTC';
            host = (FW.WALLET_NETWORK==2) ? 'testnet.xchain.io' : 'xchain.io',
        // First try to broadcast using the XChain API
        me.ajaxRequest({
            url: 'https://' + host + '/api/send_tx',
            method: 'POST',
            params: {
                'tx_hex': tx
            },
            success: function(o){
                var txid = (o && o.tx_hash) ? o.tx_hash : false;
                if(callback)
                    callback(txid);
            },
            failure: function(){
                // If the request to XChain API failed, fallback to chain.so API
                me.ajaxRequest({
                    url: 'https://chain.so/api/v2/send_tx/' + net,
                    method: 'POST',
                    jsonData: {
                        tx_hex: tx
                    },
                    failure: function(){
                        if(callback)
                            callback();
                    },
                    success: function(o){
                        var txid = (o && o.data && o.data.txid) ? o.data.txid : false;
                        if(callback)
                            callback(txid);
                    }
                },true);
            }
        },true);


    },

    broadcastETHTransaction: function(network, tx, callback){
        var me  = this;
        //var web3 = new Web3("http://52.87.221.111:8545");
        web3.eth.sendTransaction({data: tx}, function(err, transactionHash) {
            if (!err)
                console.log(transactionHash);
                callback(transactionHash);
        });
    },

    // Handle updating misc network info (currency, fee, network info)
    updateNetworkInfo: function(refresh){
        var me = this,
            sm = localStorage;
        me.ajaxRequest({
            url: 'https://xchain.io/api/network',
            method: 'GET',
            success: function(o){
                if(o && o.currency_info){
                    FW.NETWORK_INFO = o;
                    // Save info to localStorage so we can preload last known prices on reload
                    sm.setItem('networkInfo',Ext.encode(o));
                    sm.setItem('networkInfoUpdated', Date.now());
                    // Update the miners fee info so we can use it in the transaction
                    FW.MINER_FEES = Ext.apply(FW.MINER_FEES,{       
                        medium: o.fee_info.low_priority,
                        fast: o.fee_info.optimal
                    });
                    // Update Balances list now that we have updated price info
                    if(refresh)
                        Ext.getCmp('balancesList').refresh();
                }
            }
        },true);
    },


    // Handle requesting information on a given token
    getTokenInfo: function(asset, callback){
        var me   = this,
            host = (FW.WALLET_NETWORK==2) ? 'testnet.xchain.io' : 'xchain.io';
        me.ajaxRequest({
            url: 'https://' + host + '/api/asset/' + asset,
            // Success function called when we receive a success response
            success: function(o){
                if(typeof callback === 'function')
                    callback(o);
            }
        });
    },


    /* 
     *
     * Code to handle performing counterparty actions
     *
     */

    // Handle displaying an error message and making a callback request
    cbError: function(msg, callback){
        Ext.Msg.alert('Error',msg);
        if(typeof callback === 'function')
            callback();
    },


    // Handle generating a send transaction
    cpSend: function(network, source, destination, currency, amount, fee, callback){
        // console.log('cpSend network, source, destination, currency, amount, fee=', network, source, destination, currency, amount, fee);
        var me = this,
            cb = (typeof callback === 'function') ? callback : false; 
        // Handle creating the transaction
        me.counterparty.create_send(source, destination, currency, amount, fee, function(o){
            if(o && o.result){
                // Handle signing the transaction
                me.signTransaction(network, source, o.result, function(signedTx){
                    if(signedTx){
                        // Handle broadcasting the transaction
                        me.broadcastTransaction(network, signedTx, function(txid){
                            if(txid){
                                if(cb)
                                    cb(txid);
                            } else {
                                me.cbError('Error while trying to broadcast send transaction', cb);
                            }
                        });
                    } else {
                        me.cbError('Error while trying to sign send transaction',cb);
                    }
                });
            } else {
                var msg = (o.error && o.error.message) ? o.error.message : 'Error while trying to create send transaction';
                me.cbError(msg, cb);
            }
        });
    },

    callGetGasLimit: async function() {
        return await(web3.eth.getBlock("pending").gasLimit);
    },

    callGetGasPrice: async function() {
        return await(web3.eth.getGasPrice());
    },

    ETHSend: async function(destination, amount, gas, callback){
        var gasEstimateTransactionObject = {from: FW.ETHWALLET_ADDRESS.address,
                                to: destination,
                                value: amount
                                }

        //var gasPrice = this.callEstimateGas(gasEstimateTransactionObject);
        
        //gasPrice = web3.utils.toWei(gasPrice);
        //gasPrice = web3.utils.toHex(gasPrice);
        //var gasLimit = await(this.callGetGasLimit());
        var gasLimit = web3.utils.toHex(250000);
        var gasPrice = await(this.callGetGasPrice());
        gasPrice = web3.utils.toHex(gasPrice);
        amount = web3.utils.toHex(web3.utils.toWei(amount));
        var transactionObject = {from: FW.ETHWALLET_ADDRESS.address,
                                to: destination,
                                value: amount,
                                gasPrice: gasPrice,
                                gasLimit: gasLimit
        }
        console.log(transactionObject);

        /*gasPrice: gasPrice, //not enough gas, transaction taking too long
                                gasLimit: gasLimit,         
                                nonce:  '0x00',
                                chainId: 1*/

        var tx = new ethereumjs.Tx(transactionObject);
        tx.sign(new ethereumjs.Buffer.Buffer(ETHprivkey.substr(2),'hex'));
        var serializedTx = tx.serialize();
        var txid = web3.eth.sendSignedTransaction('0x' + serializedTx.toString('hex')).on('receipt', console.log);
 
        var cb = (typeof callback === 'function') ? callback : false; 
        if (cb)
            cb(txid);
    },

    // Handle generating a broadcast transaction
    cpBroadcast: function(network, source, text, value, feed_fee, fee, callback){
        // console.log('cpBroadcast network, source, text, value, feed_fee, fee=', network, source, text, value, feed_fee, fee);
        var me = this,
            cb = (typeof callback === 'function') ? callback : false; 
        // Handle creating the transaction
        me.counterparty.create_broadcast(source, feed_fee, text, null, value, fee, function(o){
            if(o && o.result){
                // Handle signing the transaction
                me.signTransaction(network, source, o.result, function(signedTx){
                    if(signedTx){
                        // Handle broadcasting the transaction
                        me.broadcastTransaction(network, signedTx, function(txid){
                            if(txid){
                                if(cb)
                                    cb(txid);
                            } else {
                                me.cbError('Error while trying to broadcast transaction', cb);
                            }
                        });
                    } else {
                        me.cbError('Error while trying to sign broadcast transaction',cb);
                    }
                });
            } else {
                var msg = (o.error && o.error.message) ? o.error.message : 'Error while trying to create broadcast transaction';
                me.cbError(msg, cb);
            }
        });
    },

    // Handle generating a issuance transaction
    cpIssuance: function(network, source, asset, description, divisible, quantity, destination, fee, callback){
        // console.log('cpIssuance network, source, asset, description, divisible, quantity, destination, fee=', network, source, asset, description, divisible, quantity, destination, fee);
        var me = this,
            cb = (typeof callback === 'function') ? callback : false; 
        // Handle creating the transaction
        me.counterparty.create_issuance(source, asset, quantity, divisible, description, destination, fee, function(o){
            if(o && o.result){
                // Handle signing the transaction
                me.signTransaction(network, source, o.result, function(signedTx){
                    if(signedTx){
                        // Handle broadcasting the transaction
                        me.broadcastTransaction(network, signedTx, function(txid){
                            if(txid){
                                if(cb)
                                    cb(txid);
                            } else {
                                me.cbError('Error while trying to broadcast issuance transaction', cb);
                            }
                        });
                    } else {
                        me.cbError('Error while trying to sign send transaction',cb);
                    }
                });
            } else {
                var msg = (o.error && o.error.message) ? o.error.message : 'Error while trying to create issuance transaction';
                me.cbError(msg, cb);
            }
        });
    }

});