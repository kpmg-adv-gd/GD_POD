sap.ui.define([
    'jquery.sap.global',
	"sap/ui/model/json/JSONModel",
    "./BaseController",
    "../utilities/CommonCallManager",
    "./popup/MarkingPopup"
], function (jQuery, JSONModel, BaseController, CommonCallManager, MarkingPopup) {
    "use strict";

    return BaseController.extend("kpmg.custom.pod.GDPodCustom.GDPodCustom.controller.MainPOD", {
        oPODSfcModel: new JSONModel(),
        oPODOperationModel: new JSONModel(),
        MarkingPopup: new MarkingPopup(),
        onInit: function () {
            this.getView().setModel(this.oPODSfcModel, "PODSfcModel");
            this.getView().setModel(this.oPODOperationModel, "PODOperationModel");
        },

        onAfterRendering: function(){
            var that=this;
        },
        onNavigateTo: function() {
            var that=this;
            that.loadSFCModel();
            that.loadPODOperationsModel();
            that.loadOrderBom(); 
        },
        loadSFCModel: function(){
            var that=this;
            var selectedSFC = that.getInfoModel().getProperty("/selectedSFC");
            that.getView().getModel("PODSfcModel").setProperty("/",selectedSFC);
        },
        loadPODOperationsModel: function(){
            var that=this;
            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathAPIPodOperationTable = "/api/getPodOperations";
            let url = BaseProxyURL+pathAPIPodOperationTable;

            let sfc = that.getView().getModel("PODSfcModel").getProperty("/sfc");
            let workcenter = that.getView().getModel("PODSfcModel").getProperty("/WORKCENTER");
            let selectedSfcRouting = that.getView().getModel("PODSfcModel").getProperty("/routing");
            let plant = that.getInfoModel().getProperty("/plant");

            let params = {
                plant: plant,
                sfc: sfc,
                workcenter: workcenter,
                routing: selectedSfcRouting.routing,
                type: selectedSfcRouting.type,
                version: selectedSfcRouting.version,
            }

            // Callback di successo
            var successCallback = function(response) {
                that.getView().getModel("PODOperationModel").setProperty("/operations",response.result);
            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);

        },
        onStartOperationPress: function(oEvent){
            var that=this;
            let selectedOp = that.getInfoModel().getProperty("/selectedOperation");
            if( !selectedOp ){
                that.showErrorMessageBox(that.getI18n("mainPOD.errorMessage.noSelectedRow"));
            } else{
                that.checkCertificationStart(selectedOp);
            }
        },
        onCompleteOperationPress: function(oEvent){
            var that=this;
            let selectedOp = that.getInfoModel().getProperty("/selectedOperation");
            if( !selectedOp ){
                that.showErrorMessageBox(that.getI18n("mainPOD.errorMessage.noSelectedRow"));
            } else{
                that.checkCertificationComplete(selectedOp);
            }
        },
        checkCertificationStart: function(selectedOp){
            var that=this;

            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathAPICheckCertification = "/api/certification/v1/certifications/check";
            let url = BaseProxyURL+pathAPICheckCertification;

            
            let plant = that.getInfoModel().getProperty("/plant");
            let operation = selectedOp?.routingOperation?.operationActivity?.operationActivity ?? "";
            let userId = that.getInfoModel().getProperty("/user_id");

            let params = {
                plant: plant,
                operation: operation,
                userId: userId
            }

            // Callback di successo
            var successCallback = function(response) {
                if (response?.isCertificationForbidden !== undefined && response?.isCertificationForbidden) {
                    that.showErrorMessageBox(response?.errorMessage);
                } else {
                    that.StartOperation();
                }
            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        checkCertificationComplete: function(selectedOp){
            var that=this;

            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathAPICheckCertification = "/api/certification/v1/certifications/check";
            let url = BaseProxyURL+pathAPICheckCertification;

            
            let plant = that.getInfoModel().getProperty("/plant");
            let operation = selectedOp?.routingOperation?.operationActivity?.operationActivity ?? "";
            let userId = that.getInfoModel().getProperty("/user_id");

            let params = {
                plant: plant,
                operation: operation,
                userId: userId
            }

            // Callback di successo
            var successCallback = function(response) {
                if (response?.isCertificationForbidden !== undefined && response?.isCertificationForbidden) {
                    that.showErrorMessageBox(response?.errorMessage);
                } else {
                    sap.m.MessageBox.show(
                        that.getI18n("mainPOD.warningMessage.completeOperation"),  // Messaggio da visualizzare
                        sap.m.MessageBox.Icon.WARNING,      // Tipo di icona: warning
                        "Warning",                       // Titolo della MessageBox
                        [sap.m.MessageBox.Action.OK,sap.m.MessageBox.Action.CANCEL],
                        function(oAction) { // Funzione di callback
                            if (oAction === sap.m.MessageBox.Action.OK) {
                                // Se l'utente preme OK
                                that.CompleteOperation();
                            } else if (oAction === sap.m.MessageBox.Action.CANCEL) {
                                //Se preme cancel
                            }
                        }
                    );     
                }
            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        checkCertificationMarker: function(markOperation){
            var that=this;

            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathAPICheckCertification = "/api/certification/v1/certifications/check";
            let url = BaseProxyURL+pathAPICheckCertification;

            
            let plant = that.getInfoModel().getProperty("/plant");
            let operation = markOperation?.routingOperation?.operationActivity?.operationActivity ?? "";
            let userId = that.getInfoModel().getProperty("/user_id");

            let params = {
                plant: plant,
                operation: operation,
                userId: userId
            }

            // Callback di successo
            var successCallback = function(response) {
                if (response?.isCertificationForbidden !== undefined && response?.isCertificationForbidden) {
                    that.showErrorMessageBox(response?.errorMessage);
                } else {
                    let markOperation=that.getView().getModel("PODOperationModel").getProperty("/selectedOpMark");
                    if(markOperation.QUANTITY.quantityDone == 1 || markOperation.QUANTITY.quantityInWork == 1 ){
                        that.MarkingPopup.open(that.getView(), that, markOperation);
                    } else {
                        that.showErrorMessageBox(that.getI18n("mainPOD.errorMessage.operationNoMarking"));
                    }
                }
                that.getView().getModel("PODOperationModel").setProperty("/selectedOpMark",undefined);
            };
            // Callback di errore
            var errorCallback = function(error) {
                that.getView().getModel("PODOperationModel").setProperty("/selectedOpMark",undefined);
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        StartOperation: function(){
            var that=this;
            
            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathAPIStartOperation = "/api/sfc/v1/sfcs/start";
            let url = BaseProxyURL+pathAPIStartOperation;

            let plant = that.getInfoModel().getProperty("/plant");
            let selectedOperation = that.getInfoModel().getProperty("/selectedOperation");
            let operation = selectedOperation.routingOperation.operationActivity.operationActivity;
            let resource = selectedOperation.RESOURCE;
            let sfc = that.getView().getModel("PODSfcModel").getProperty("/sfc");
            

            let params = {
                plant: plant,
                operation: operation,
                resource: resource,
                sfc: sfc
            }

            // Callback di successo
            var successCallback = function(response) {
                if (response?.error !== undefined && response?.error?.message !== undefined) {
                    that.showErrorMessageBox(response?.error?.message);
                } else {
                    that.loadPODOperationsModel();
                    that.showToast(that.getI18n("mainPOD.podMessage.startOk"));
                }
            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        CompleteOperation: function(){
            var that=this;
            
            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathAPICompleteOperation = "/api/sfc/v1/sfcs/complete";
            let url = BaseProxyURL+pathAPICompleteOperation;

            let plant = that.getInfoModel().getProperty("/plant");
            let selectedOperation = that.getInfoModel().getProperty("/selectedOperation");
            let operation = selectedOperation.routingOperation.operationActivity.operationActivity;
            let resource = selectedOperation.RESOURCE;
            let sfc = that.getView().getModel("PODSfcModel").getProperty("/sfc");
            

            let params = {
                plant: plant,
                operation: operation,
                resource: resource,
                sfc: sfc
            }

            // Callback di successo
            var successCallback = function(response) {
                if (response?.error !== undefined && response?.error?.message !== undefined) {
                    that.showErrorMessageBox(response?.error?.message);
                } 
                if (response.success){
                    that.loadPODOperationsModel();
                    that.showToast(that.getI18n("mainPOD.podMessage.completeOk"));
                }
            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        rowSelectionChange: function(oEvent){
            var that=this;
            var oTable = oEvent.getSource();
            var selectedIndexOperation = oTable.getSelectedIndex();
            //Tutte le volte in cui ho selezionato (e non deselezionato)
            if( selectedIndexOperation !== -1 ){
                var selectedObject = oTable.getContextByIndex(selectedIndexOperation).getObject();
                that.getInfoModel().setProperty("/selectedOperation",selectedObject);
            } else {
                that.getInfoModel().setProperty("/selectedOperation",undefined);
            }
            //CHIAMO LA onOperationChange SUL TAB SELEZIONATO!
            let iconTabBar = that.getView().byId("mainIconTabBar");
            let tabSelectedKey = iconTabBar.getSelectedKey();
            var oViewSelectedTab = iconTabBar.getItems().find(obj => obj.getKey() === tabSelectedKey).getContent()[0];
            var oControllerSelectedTab = oViewSelectedTab.getController();
            if(oControllerSelectedTab.onOperationChange){
                oControllerSelectedTab.onOperationChange();
            }
        },
        loadOrderBom: function(){
            var that=this;
            let iconTabBar = that.getView().byId("mainIconTabBar");
            //sempre selezionata order_bom all'ingresso del pod
            iconTabBar.setSelectedKey("ORDER_BOM");
            var oViewOrderBomTab = iconTabBar.getItems().find(obj => obj.getKey() === "ORDER_BOM").getContent()[0];
            var oControllerOrderBomTab = oViewOrderBomTab.getController();
            oControllerOrderBomTab.onNavigateTo();
        },
        getStatusIcon: function(sfcObj){
            var that=this;
            var sfcStatusCode=sfcObj?.sfcStatus || "";
            var quantity = sfcObj?.QUANTITY || null;
            if(!!quantity){
                if(quantity.quantityInQueue===1){
                    if(sfcStatusCode==="401"){
                        return "sap-icon://rhombus-milestone-2";
                    } else {
                        return "sap-icon://color-fill";
                    }
                } else if (quantity.quantityInWork===1){
                    return "sap-icon://circle-task-2";
                } else if (quantity.quantityDone===1){
                    return "sap-icon://complete";
                } else {
                    return "";
                }
            }
            return "";
        },
        getStatusColor: function(sfcObj){
            var that=this;
            var sfcStatusCode=sfcObj?.sfcStatus || "";
            var quantity = sfcObj?.QUANTITY || null;
            if(!!quantity){
                if(quantity.quantityInQueue===1){
                    if(sfcStatusCode==="401"){
                        return "grey";
                    } else {
                        return "blue";
                    }
                } else if (quantity.quantityInWork===1){
                    return "green";
                } else if (quantity.quantityDone===1){
                    return "green";
                } else {
                    return "Deafult";
                }
            } 
            return "";
        },
        onMarkPress: function(oEvent){
            var that=this;
            let idMarkButton = oEvent.getParameter("id");
            let pathMarkOperation = sap.ui.getCore().byId(idMarkButton).getParent().getBindingContext("PODOperationModel").getPath();
            let markOperation = that.getView().getModel("PODOperationModel").getProperty(pathMarkOperation);
            that.getView().getModel("PODOperationModel").setProperty("/selectedOpMark",markOperation);
            that.checkCertificationMarker(markOperation);

        },
        onCollapse: function(){
            var that=this;
            let secondarySplitter = that.getView().byId("secondaryContainerSplitter");
            let secondarySplitterSize = secondarySplitter.getLayoutData().getSize();
            if(secondarySplitterSize !== "0%"){
                secondarySplitter.getLayoutData().setSize("0%");
            }
            that.getView().byId("collapseButtonId").setVisible(false);
            that.getView().byId("expandButtonId").setVisible(true);
        },
        onExpand: function(){
            var that=this;
            let secondarySplitter = that.getView().byId("secondaryContainerSplitter");
            let secondarySplitterSize = secondarySplitter.getLayoutData().getSize();
            if(secondarySplitterSize !== "40%"){
                secondarySplitter.getLayoutData().setSize("40%");
            }
            that.getView().byId("collapseButtonId").setVisible(true);
            that.getView().byId("expandButtonId").setVisible(false);
        },
        onNavBack: function () {
            var that=this;
            that.getView().getModel("PODSfcModel").setProperty("/",{});
            that.getView().getModel("PODOperationModel").setProperty("/operations",[]);
            that.navToPODSelectionView();
        }
    });
});
