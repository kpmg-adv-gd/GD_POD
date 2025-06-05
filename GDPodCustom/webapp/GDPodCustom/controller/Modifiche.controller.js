sap.ui.define([
    'jquery.sap.global',
	"sap/ui/model/json/JSONModel",
    "./BaseController",
    "../utilities/CommonCallManager",
    "./popup/MarkingPopup"
], function (jQuery, JSONModel, BaseController, CommonCallManager, MarkingPopup) {
    "use strict";

    return BaseController.extend("kpmg.custom.pod.GDPodCustom.GDPodCustom.controller.Modifiche", {
        oModificheModel: new JSONModel(),
        oStatusCollectionModel: new JSONModel(),
        MarkingPopup: new MarkingPopup(),
        onInit: function () {
            var that=this;
            that.getView().setModel(that.oModificheModel, "ModificheModel");
        },
        onAfterRendering: function(){
            var that=this;
            that.getView().setBusy(true);
            that.loadStatusCollection();
            that.loadOperationModifiche();
        },
        loadStatusCollection: function(){
            var that=this;

            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathZSharedMemory = "/db/getZSharedMemory";
            let url = BaseProxyURL+pathZSharedMemory; 

            let plant = that.getInfoModel().getProperty("/plant") || "";
            let keySharedMemory = "STATUS_MODIFICHE";

            let params={
                plant: plant,
                key: keySharedMemory
            };

            // Callback di successo
            var successCallback = function(response) {
                if(response && response.length > 0){
                    let value = JSON.parse(response[0].value);
                    let mappedJson = Object.entries(value).map(([key, value]) => ({
                        key,
                        text: value
                    }));
                    that.getView().getModel().setProperty("/StatusCollection",mappedJson);
                }
                that.loadModificheModel();
            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);

        },
        loadModificheModel: function(){
            var that=this;

            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathModificheDb = "/db/getModificheBySfc";
            let url = BaseProxyURL+pathModificheDb; 

            let plant = that.getInfoModel().getProperty("/plant") || "";
            let wbe = that.getInfoModel().getProperty("/selectedSFC/WBE") || "";;
            let sfc = that.getInfoModel().getProperty("/selectedSFC/sfc") || "";;
            let order = that.getInfoModel().getProperty("/selectedSFC/order") || "";

            let params={
                plant: plant,
                wbe: wbe,
                sfc: sfc,
                order: order
            };

            // Callback di successo
            var successCallback = function(response) {
                that.getView().getModel("ModificheModel").setProperty("/ModificheMTMKList",response.modificheMT_MK);
                that.getView().getModel("ModificheModel").setProperty("/ModificheMAList",response.modificheMA);
                if(that.getView().getBusy()) that.getView().setBusy(false);
            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata POST fallita:", error);
                if(that.getView().getBusy()) that.getView().setBusy(false);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        onStatusChange: function(oEvent){
            var that=this;
            var pathModificheList = oEvent.getSource().getParent().getRowBindingContext().getPath();
            var objStatusModified = that.getView().getModel("ModificheModel").getProperty(pathModificheList);
            that.updateStatusModification(objStatusModified);

        },
        updateStatusModification: function(objStatusModified){
            var that=this;
            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathUpdateStatusModifica = "/db/updateStatusModifica";
            let url = BaseProxyURL+pathUpdateStatusModifica; 

            let plant = objStatusModified.plant;
            let process_id = objStatusModified.process_id;
            let prog_eco = objStatusModified.prog_eco;
            let newStatus = objStatusModified.status;

            let params={
                plant: plant,
                prog_eco: prog_eco,
                newStatus: newStatus
            };

            // Callback di successo
            var successCallback = function(response) {
                that.loadStatusCollection();
                that.showToast("Stato Modificato!")
            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        loadOperationModifiche: function(){
            var that=this;
            var that=this;
            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathGetOperationsModifiche = "/db/getOperationModificheBySfc";
            let url = BaseProxyURL+pathGetOperationsModifiche; 

            let plant = that.getInfoModel().getProperty("/plant") || "";
            let project =  that.getInfoModel().getProperty("/selectedSFC/COMMESSA") || "";
            let order = that.getInfoModel().getProperty("/selectedSFC/order") || "";

            let params={
                plant: plant,
                project: project,
                order: order
            };

            // Callback di successo
            var successCallback = function(response) {
                that.getView().getModel("ModificheModel").setProperty("/ModificheOperations",response);
            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);

        },
        onMarkPress: function(oEvent){
            var that=this;
            let idMarkButton = oEvent.getParameter("id") || "";
            let pathMarkOperation = sap.ui.getCore().byId(idMarkButton).getParent().getBindingContext("ModificheModel").getPath();
            let markOperation = that.getView().getModel("ModificheModel").getProperty(pathMarkOperation);
            //Mi ricreo la stessa struttura su cui si trova l'operationActivity nel MainPOD dato che chiamo la popup alla stessa maniera, quindi accederà all'oeprazione allo stesso modo
            markOperation.routingOperation = {
                operationActivity: {
                    operationActivity: markOperation.operation
                }
            };
            that.getView().getModel("ModificheModel").setProperty("/selectedOpMark",markOperation);
            that.checkCertificationMarkerModificheOp(markOperation);
        },
        checkCertificationMarkerModificheOp: function(markOperation){
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
                let markOperation=that.getView().getModel("ModificheModel").getProperty("/selectedOpMark");
                if (response?.isCertificationForbidden !== undefined && response?.isCertificationForbidden) {
                    that.MarkingPopup.open(that.getView(), that, markOperation, false);
                    that.showToast(response?.errorMessage || "Certification Error");
                } else {
                    that.MarkingPopup.open(that.getView(), that, markOperation, true);
                }
                that.getView().getModel("ModificheModel").setProperty("/selectedOpMark",undefined);
            };
            // Callback di errore
            var errorCallback = function(error) {
                that.getView().getModel("ModificheModel").setProperty("/selectedOpMark",undefined);
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        onModifcaDoneMA: function(oEvent){
            var that=this;
            var pathModificheList = oEvent.getSource().getParent().getParent().getRowBindingContext().getPath();
            var objStatusModified = that.getView().getModel("ModificheModel").getProperty(pathModificheList);
            that.updateResolutionModificaMA(objStatusModified);
        },
        updateResolutionModificaMA: function(objStatusModified){
            var that=this;
            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathUpdateStatusModifica = "/db/updateResolutionModificaMA";
            let url = BaseProxyURL+pathUpdateStatusModifica; 

            let plant = objStatusModified.plant;
            let process_id = objStatusModified.process_id;
            let userId = that.getInfoModel().getProperty("/user_id");

            let params={
                plant: plant,
                process_id: process_id,
                userId: userId
            };

            // Callback di successo
            var successCallback = function(response) {
                that.loadModificheModel();
                that.showToast("Added Resolution!")
            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);

        }

    });
});
