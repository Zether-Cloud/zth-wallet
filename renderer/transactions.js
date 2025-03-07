const {ipcRenderer} = require("electron");

class Transactions {
  constructor() {
    this.filter = "";
    this.isSyncing = false;
    this.isLoading = false;
  }

  setIsSyncing(value) {
    this.isSyncing = value;
  }

  getIsSyncing() {
    return this.isSyncing;
  }

  setIsLoading(value) {
    this.isLoading = value;
  }

  getIsLoading() {
    return this.isLoading;
  }

  setFilter(text) {
    this.filter = text;
  }

  getFilter() {
    return this.filter;
  }

  clearFilter() {
    this.filter = "";
  }

  syncTransactionsForSingleAddress(addressList, counters, lastBlock, counter) {
    if (counter < addressList.length) {
      SyncProgress.setText(vsprintf("Syncing address transactions %d/%d, please wait...", [counter, addressList.length]));

      var startBlock = parseInt(counters.transactions) || 0;
      var params = vsprintf("?address=%s&fromBlock=%d&toBlock=%d", [
        addressList[counter].toLowerCase(),
        startBlock,
        lastBlock
      ]);

      $.getJSON("http://richlist.outsidethebox.top/transactions_list.php" + params, function (result) {
        result.data.forEach(element => {
          if (element.fromaddr && element.toaddr) {
            ipcRenderer.send("storeTransaction", {
              block: element.block.toString(),
              txhash: element.txhash.toLowerCase(),
              fromaddr: element.fromaddr.toLowerCase(),
              timestamp: element.timestamp,
              toaddr: element.toaddr.toLowerCase(),
              value: element.value
            });
          }
        });

        // call the transaction sync for the next address
        ZthTransactions.syncTransactionsForSingleAddress(addressList, counters, lastBlock, counter + 1);
      });
    } else {
      // update the counter and store it back to file system
      counters.transactions = lastBlock;
      ZthDatatabse.setCounters(counters);

      SyncProgress.setText("Syncing transactions is complete.");
      ZthTransactions.setIsSyncing(false);
    }
  }

  syncTransactionsForAllAddresses(lastBlock) {
    var counters = ZthDatatabse.getCounters();
    var counter = 0;

    ZthBlockchain.getAccounts(function (error) {
      ZthMainGUI.showGeneralError(error);
    }, function (data) {
      ZthTransactions.setIsSyncing(true);
      ZthTransactions.syncTransactionsForSingleAddress(data, counters, lastBlock, counter);
    });
  }

  renderTransactions() {
    if (!ZthTransactions.getIsLoading()) {
      ZthMainGUI.renderTemplate("transactions.html", {});
      $(document).trigger("render_transactions");
      ZthTransactions.setIsLoading(true);

      // show the loading overlay for transactions
      $("#loadingTransactionsOverlay").css("display", "block");

      setTimeout(() => {
        var dataTransactions = ipcRenderer.sendSync("getTransactions");
        var addressList = ZthWallets.getAddressList();

        dataTransactions.forEach(function (element) {
          var isFromValid = addressList.indexOf(element[2].toLowerCase()) > -1;
          var isToValid = addressList.indexOf(element[3].toLowerCase()) > -1;

          if (isToValid && !isFromValid) {
            element.unshift(0);
          } else if (!isToValid && isFromValid) {
            element.unshift(1);
          } else {
            element.unshift(2);
          }
        });

        ZthTableTransactions.initialize("#tableTransactionsForAll", dataTransactions);
        ZthTransactions.setIsLoading(false);
      }, 200);
    }
  }

  enableKeepInSync() {
    ZthBlockchain.subsribeNewBlockHeaders(function (error) {
      ZthMainGUI.showGeneralError(error);
    }, function (data) {
      ZthBlockchain.getBlock(data.number, true, function (error) {
        ZthMainGUI.showGeneralError(error);
      }, function (data) {
        if (data.transactions) {
          data.transactions.forEach(element => {
            if (element.from && element.to) {
              if (ZthWallets.getAddressExists(element.from) || ZthWallets.getAddressExists(element.to)) {
                var Transaction = {
                  block: element.blockNumber.toString(),
                  txhash: element.hash.toLowerCase(),
                  fromaddr: element.from.toLowerCase(),
                  timestamp: moment.unix(data.timestamp).format("YYYY-MM-DD HH:mm:ss"),
                  toaddr: element.to.toLowerCase(),
                  value: Number(element.value).toExponential(5).toString().replace("+", "")
                };

                // store transaction and notify about new transactions
                ipcRenderer.send("storeTransaction", Transaction);
                $(document).trigger("onNewAccountTransaction");

                iziToast.info({
                  title: "New Transaction",
                  message: vsprintf("Transaction from address %s to address %s was just processed", [Transaction.fromaddr, Transaction.toaddr]),
                  position: "topRight",
                  timeout: 10000
                });

                if (ZthMainGUI.getAppState() == "transactions") {
                  setTimeout(function () {
                    ZthTransactions.renderTransactions();
                  }, 500);
                }
              }
            }
          });
        }
      });
    });
  }

  disableKeepInSync() {
    ZthBlockchain.unsubsribeNewBlockHeaders(function (error) {
      ZthMainGUI.showGeneralError(error);
    }, function (data) {
      // success
    });
  }
}

// create new transactions variable
ZthTransactions = new Transactions();
