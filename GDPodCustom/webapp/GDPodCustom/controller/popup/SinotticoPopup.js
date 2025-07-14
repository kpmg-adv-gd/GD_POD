sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "../BaseController",
    "../../utilities/CommonCallManager",
    "../../utilities/GenericDialog",
    "./OrderProgressPopup",
], function (JSONModel, BaseController, CommonCallManager, Dialog, OrderProgressPopup) {
    "use strict";

    return Dialog.extend("kpmg.custom.pod.GDPodCustom.GDPodCustom.controller.popup.SinotticoPopup", {
        OrderProgressPopup: new OrderProgressPopup(),
        open: function (oView, oController, runTimeOrder) {
            var that = this;
            that.SinotticoBomModel = new JSONModel();
            that.MainPODview = oView;
            that.MainPODcontroller = oController;
            that._initDialog("kpmg.custom.pod.GDPodCustom.GDPodCustom.view.popup.SinotticoPopup", oView, that.SinotticoBomModel);
            that.SinotticoBomModel.setProperty("/RUN_TIME_ORDER",runTimeOrder);
            that.loadSinottico();
            that.openDialog();
        },
        loadSinottico: function(){
			var that=this;
            var treeTable = that.getView().byId("SinotticoTreeTable");
			let BaseProxyURL = that.MainPODcontroller.getInfoModel().getProperty("/BaseProxyURL");
            let pathApi = "/api/getSinotticoBomMultilivelloReport";
            let url = BaseProxyURL+pathApi;
            let MainPODModel = that.MainPODcontroller.getView().getModel("PODSfcModel");
            let plant = that.MainPODcontroller.getInfoModel().getProperty("/plant");
            let project = MainPODModel.getProperty("/COMMESSA");
			let order = that.SinotticoBomModel.getProperty("/RUN_TIME_ORDER");
            
            treeTable.setBusy(true);
            
			
            let params = {
                "plant": plant,
				"project":project,
                "callFrom":"POD",
				"orderComponent":order
            }
            // Callback di successo
            var successCallback = function(response) {
                that.SinotticoBomModel.setProperty("/MaterialList",[response]);
                that.goToRuntimeOrder([response]);
                that.getView().byId("SinotticoTreeTable").setBusy(false);
                
            };

            // Callback di errore
            var errorCallback = function(error) {
                that.getView().byId("SinotticoTreeTable").setBusy(false);
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that,false,true);
		},
        goToRuntimeOrder: function(aNodes){
            var that=this;
            var oTreeTable = that.getView().byId("SinotticoTreeTable");
            let runTimeOrder = that.SinotticoBomModel.getProperty("/RUN_TIME_ORDER");

            const oState = this._flattenTreeData(aNodes,runTimeOrder);

            if (oState.foundIndex !== -1) {
                oTreeTable.expandToLevel(oState.maxDepth);
                // Scrolla fino all'ordine di runTime
                oTreeTable.setFirstVisibleRow(oState.foundIndex);
            }
        },
        //Ritorno l'oggetto oState che contiene i livelli espansi per trovare l'ordine e l'indice della riga trovata se trovata altrimenti -1
        _flattenTreeData: function (aNodes, runTimeOrder, aFlatList = [], iLevel = 0, oState = { maxDepth: 0, foundIndex: -1 }) {
            for (let i = 0; i < aNodes.length; i++) {
                const oNode = aNodes[i];
                oNode._flatIndex = aFlatList.length;
                oNode._treeLevel = iLevel;
                aFlatList.push(oNode);
        
                if (iLevel > oState.maxDepth) {
                    oState.maxDepth = iLevel;
                }
        
                if (oNode.Order === runTimeOrder) {
                    oState.foundIndex = oNode._flatIndex;
                    return oState;  // nodo trovato, ritorna subito stato
                }
        
                if (oNode.Children && oNode.Children.length > 0) {
                    let result = this._flattenTreeData(oNode.Children, runTimeOrder, aFlatList, iLevel + 1, oState);
                    if (result.foundIndex !== -1) {
                        return result; // nodo trovato nei figli, ritorna risultato
                    }
                }
            }
            return oState; // nodo non trovato in questo ramo, ritorna stato aggiornato
        },
        // rowSelectionChange: function(oEvent){
        //     var that=this;
        //     var oTable = oEvent.getSource();
        //     var selectedIndex = oTable.getSelectedIndex();
        //     var selectedObj = oTable.getContextByIndex(selectedIndex).getObject();
        //     Se è un componente non aprire nulla
        //     if(selectedObj.OrderType =="COMP") {
        //         oTable.setSelectedIndex(-1);
        //         return;
        //     }
        //     if(selectedIndex!==-1){
        //         that.OrderProgressPopup.open(that.getView(), that,selectedObj);
        //         oTable.setSelectedIndex(-1);
        //     }
        // },
        onExpandAll: function() {
            var that=this;
			var oTreeTable = that.getView().byId("SinotticoTreeTable");
			oTreeTable.expandToLevel(4);
		},
        onCollapseAll: function() {
            var that=this;
			var oTreeTable = that.getView().byId("SinotticoTreeTable");
			oTreeTable.collapseAll();
		},
        onClosePopup: function () {
            var that = this;
            that.closeDialog();
        }
    })
})
//# sourceURL=https://g-d--s-p-a--sap-dmc-test-96ypknc8-ext-dev-space-gdpodcustom.cfapps.eu20-001.hana.ondemand.com/GDPodCustom/GDPodCustom/controller/popup/SinotticoPopup.js?eval