sap.ui.define([
    'jquery.sap.global',
	"sap/ui/model/json/JSONModel",
    "./BaseController",
    "../utilities/CommonCallManager",
    "./popup/MarkingPopup",
    "./popup/OpenDefectPopup"
], function (jQuery, JSONModel, BaseController, CommonCallManager, MarkingPopup, OpenDefectPopup) {
    "use strict";

    return BaseController.extend("kpmg.custom.pod.GDPodCustom.GDPodCustom.controller.MainPOD", {
        oPODSfcModel: new JSONModel(),
        oPODOperationModel: new JSONModel(),
        MarkingPopup: new MarkingPopup(),
        OpenDefectPopup: new OpenDefectPopup(),
        onInit: function () {
            this.getView().setModel(this.oPODSfcModel, "PODSfcModel");
            this.getView().setModel(this.oPODOperationModel, "PODOperationModel");

            // Subscribe difetti
            sap.ui.getCore().getEventBus().subscribe("defect", "loadDefect", this.loadPODOperationsModel, this);
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
            let orderType = that.getView().getModel("PODSfcModel").getProperty("/ORDER_TYPE")
            that.getView().getModel("PODOperationModel").setProperty("/BusyLoadingOpTable",true);

            let params = {
                plant: plant,
                sfc: sfc,
                workcenter: workcenter,
                routing: selectedSfcRouting.routing,
                type: selectedSfcRouting.type,
                version: selectedSfcRouting.version,
                orderType: orderType
            }

            // Callback di successo
            var successCallback = function(response) {
                that.getView().getModel("PODOperationModel").setProperty("/operations",response.result);
                that.getView().getModel("PODOperationModel").setProperty("/BusyLoadingOpTable",false);
                that.getDefects();
            };
            // Callback di errore
            var errorCallback = function(error) {
                that.getView().getModel("PODOperationModel").setProperty("/BusyLoadingOpTable",false);
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);

        },
        getDefects: function () {
            var that=this;
            
            let sfc = that.getView().getModel("PODSfcModel").getProperty("/sfc");
            let plant = that.getInfoModel().getProperty("/plant");

            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathAPIPodOperationTable = "/api/nonconformance/v2/nonconformances?plant=" + plant + "&sfc=" + sfc;
            let url = BaseProxyURL+pathAPIPodOperationTable;

            let params = {
            }

            // Callback di successo
            var successCallback = function(response) {
                var operations = this.getView().getModel("PODOperationModel").getProperty("/operations");
                var defects = response.defectResponse.content;
                that.getInfoModel().setProperty("/defectOperation",defects);
                operations.forEach(item => {
                    var stepId = item.stepId;
                    if (defects.filter(item => item.routingStepId == stepId && item.state == "OPEN").length > 0) {
                        item.hasDefectOpen = true;
                    }else{
                        item.hasDefectOpen = false;
                    }
                });
                this.getView().getModel("PODOperationModel").refresh();
                sap.ui.getCore().getEventBus().publish("defect", "receiveDefect", null);
            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata GET fallita:", error);
            };
            CommonCallManager.callProxy("GET", url, params, true, successCallback, errorCallback, that);
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
        onNonConformancesPress: function (oEvent) {
            var that=this;
            let selectedOp = that.getInfoModel().getProperty("/selectedOperation");
            if( !selectedOp ){
                that.showErrorMessageBox(that.getI18n("mainPOD.errorMessage.noSelectedRowDefect"));
                return;
            }
            that.OpenDefectPopup.open(that.getView(), that, selectedOp);
            
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
                    //Mostro messaggi di warning diverso se il mio workcenter è interno o esterno
                    var actualWC = that.getInfoModel().getProperty("/selectedSFC/WORKCENTER");
                    var activeWCsString = that.getInfoModel().getProperty("/MarkingWorkCentersListEnabled");
                    var activeWCsArray = activeWCsString.split(";");
                    var warningMessage = that.getI18n("mainPOD.warningMessage.completeOperationInternal");
                    if(!activeWCsArray.includes(actualWC)){
                        warningMessage = that.getI18n("mainPOD.warningMessage.completeOperationExternal");
                    }

                    sap.m.MessageBox.show(
                        warningMessage,  // Messaggio da visualizzare
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
                    that.MarkingPopup.open(that.getView(), that, markOperation, false);
                    that.showToast(response?.errorMessage || "Certification Error");
                } else {
                    let markOperation=that.getView().getModel("PODOperationModel").getProperty("/selectedOpMark");
                    if(markOperation.QUANTITY.quantityDone == 1 || markOperation.QUANTITY.quantityInWork == 1 ){
                        that.MarkingPopup.open(that.getView(), that, markOperation, true);
                    } else {
                        that.MarkingPopup.open(that.getView(), that, markOperation, false);
                        that.showToast(that.getI18n("mainPOD.errorMessage.operationNoMarking"));
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
            let project = that.getInfoModel().getProperty("/selectedSFC/COMMESSA");
            let selectedOperation = that.getInfoModel().getProperty("/selectedOperation");
            let operation = selectedOperation.routingOperation.operationActivity.operationActivity;
            let resource = selectedOperation.RESOURCE;
            let order = that.getInfoModel().getProperty("/selectedSFC/order");
            let orderMaterial = that.getInfoModel().getProperty("/selectedSFC/material/material");
            let sfc = that.getView().getModel("PODSfcModel").getProperty("/sfc");
            let workCenter = that.getInfoModel().getProperty("/selectedSFC/WORKCENTER");

            let checkModificheLastOperation = false;
            let checkMancantiLastOperation = false;
            let valueModifica = that.getInfoModel().getProperty("/selectedSFC/ECO_TYPE");
            //Controllo se l'operazione che sto completando è l'ultima operazione dell'sfc da completare
            let operations = that.getView().getModel("PODOperationModel").getProperty("/operations");
            if(!operations.some(obj => obj?.routingOperation?.operationActivity?.operationActivity !== operation && obj?.QUANTITY?.quantityDone !== 1 )){
                checkMancantiLastOperation=true;
                if(!!valueModifica) checkModificheLastOperation = true;
            }
            
            let params = {
                plant: plant,
                project: project,
                order: order,
                orderMaterial: orderMaterial,
                operation: operation,
                resource: resource,
                sfc: sfc,
                checkModificheLastOperation: checkModificheLastOperation,
                valueModifica: valueModifica,
                checkMancantiLastOperation: checkMancantiLastOperation
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
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that, false,true);
        },
        rowSelectionChange: function(oEvent){
            var that=this;
            var oTable = oEvent.getSource();
            var selectedIndexOperation = oTable.getSelectedIndex();
            //Tutte le volte in cui ho selezionato (e non deselezionato)
            if( selectedIndexOperation !== -1 ){
                var workcenter=that.getView().getModel("PODSfcModel").getProperty("/WORKCENTER");
                var selectedObject = oTable.getContextByIndex(selectedIndexOperation).getObject();
                if(selectedObject.workCenter.workCenter!==workcenter){
                    oTable.setSelectedIndex(-1);
                    that.getInfoModel().setProperty("/selectedOperation",undefined);
                    return;
                }
                that.getInfoModel().setProperty("/selectedOperation",selectedObject);
                // Salvo i relativi difetti
                var defects = that.getInfoModel().getProperty("/defects");
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
            let idMarkButton = oEvent.getParameter("id") || "";
            let pathMarkOperation = sap.ui.getCore().byId(idMarkButton).getParent().getBindingContext("PODOperationModel").getPath();
            let markOperation = that.getView().getModel("PODOperationModel").getProperty(pathMarkOperation);
            that.getView().getModel("PODOperationModel").setProperty("/selectedOpMark",markOperation);
            that.getMarkingEnabled(markOperation);
            

        },
        getMarkingEnabled: function(markOperation){
            var that=this;
            var actualWC = that.getInfoModel().getProperty("/selectedSFC/WORKCENTER");
            var activeWCsString = that.getInfoModel().getProperty("/MarkingWorkCentersListEnabled");
            var activeWCsArray = activeWCsString.split(";");
            if(!activeWCsArray.includes(actualWC)){
                that.MarkingPopup.open(that.getView(), that, markOperation, false);
            } else{
                if(actualWC !== markOperation.workCenter.workCenter){
                    that.MarkingPopup.open(that.getView(), that, markOperation, false);
                    that.showToast(that.getI18n("mainPOD.errorMessage.noWorkCenter.markingPopup"));
                } else{
                    that.checkCertificationMarker(markOperation);
                }
            }
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
