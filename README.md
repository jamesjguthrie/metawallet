# MetaWallet

MetaWallet is built with Sencha Touch 2.4.2 which uses PhoneGap for easy HTML5 and Javascript cross-compilation on Android, iOS, web, etc.
MetaWallet communicates with AWS-based nodes. At this time, 2nd April '18, there are currently Bitcoin and Ethereum nodes running.

### Bitcoin node

52.87.221.111:8544
Authenticated by --rpcuser and --rpcpass

### Ethereum node

52.87.221.111:8545
Currently no auth as geth does not support --rpcuser

##	Build Instructions

1)	Install Sencha Cmd https://www.sencha.com/products/extjs/cmd-download/ with compass extension

2)	Create new Sencha workspace:
	sencha generate app FW metawallet

3)	Build:
	sencha app build production

4)	Launch local server:
	sencha web start - or use Visual Studio shortcut under 'Project' menu

##	To do

Implement Node interaction authentication layer
