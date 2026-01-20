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
            let sfc = that.getInfoModel().getProperty("/selectedSFC/sfc") || "";;
            let order = that.getInfoModel().getProperty("/selectedSFC/order") || "";

            let params={
                plant: plant,
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
            var status = objStatusModified.status;
            if(objStatusModified.type=="MT"){
                let warningMessage = that.getI18n("modifiche.warningMessage.allModificheTecniche");
                sap.m.MessageBox.show(
                    warningMessage,  // Messaggio da visualizzare
                    sap.m.MessageBox.Icon.WARNING,      // Tipo di icona: warning
                    "Warning",                       // Titolo della MessageBox
                    [sap.m.MessageBox.Action.OK,sap.m.MessageBox.Action.CANCEL],
                    function(oAction) { // Funzione di callback
                        if (oAction === sap.m.MessageBox.Action.OK) {
                            // Se l'utente preme OK
                            that.onOpenNoteDialog(objStatusModified,status);
                        } else if (oAction === sap.m.MessageBox.Action.CANCEL) {
                            that.loadStatusCollection();
                            //Se preme cancel
                        }
                    }
                );   
            } else{
                that.updateStatusModification(objStatusModified,status);
            }
            

        },
        onStatusChangeMA: function(oEvent){
            var that=this;
            var pathModificheList = oEvent.getSource().getParent().getRowBindingContext().getPath();
            var objStatusModified = that.getView().getModel("ModificheModel").getProperty(pathModificheList);
            let userId = that.getInfoModel().getProperty("/user_id");
            let status = objStatusModified.status;
            objStatusModified.resolution = "Modifica assieme applicata da " + userId;
            that.onOpenNoteDialog(objStatusModified,status);
        },
        updateStatusModification: function(objStatusModified,status){
            
            var that=this;
            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathUpdateStatusModifica = "/api/sendAndUpdateModifiche";
            let url = BaseProxyURL+pathUpdateStatusModifica; 

            let plant = objStatusModified.plant;
            var wbe = objStatusModified.wbe;
            let process_id = objStatusModified.process_id;
            let prog_eco = objStatusModified.prog_eco;
            var material = objStatusModified.material;
            var child_material = objStatusModified.child_material;
            var type = objStatusModified.type;
            var resolution = objStatusModified.resolution;
            var note = objStatusModified.note || "";
            

            let params={
                plant: plant,
                wbe: wbe,
                process_id: process_id,
                prog_eco: prog_eco,
                newStatus: status,
                material: material,
                child_material: child_material,
                type: type,
                order: objStatusModified.order,
                resolution: resolution,
                note: note
            };

            // Callback di successo
            var successCallback = function(response) {
                that.loadStatusCollection();
                that.showToast("Stato Modificato!")
            };
            // Callback di errore
            var errorCallback = function(error) {
                that.loadModificheModel();
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that,false,true);
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

            //Eliminata il check sulla certificazione - Se rsi reinserisce eliminare apertura popup da qua e /selectedOpMark uguale ad udnefined
            //that.checkCertificationMarkerModificheOp(markOperation);
            var actualWC = that.getInfoModel().getProperty("/selectedSFC/WORKCENTER");
            var activeWCsString = that.getInfoModel().getProperty("/MarkingWorkCentersListEnabled");
            var activeWCsArray = activeWCsString.split(";");
            if(!activeWCsArray.includes(actualWC)){
                that.MarkingPopup.open(that.getView(), that, markOperation, false);
            } else{
                that.MarkingPopup.open(that.getView(), that, markOperation, true);
            }
            that.getView().getModel("ModificheModel").setProperty("/selectedOpMark",undefined);
        },
        checkCertificationMarkerModificheOp: function(markOperation){
            var that=this;

            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathAPICheckCertification = "/api/certification/v1/certifications/check";
            var url = BaseProxyURL+pathAPICheckCertification;

            
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
        onOpenNoteDialog: function (objStatusModified, status) {
            var that = this;
        
            var oNoteDialog = new sap.m.Dialog({
                title: "Inserisci una Nota",
                type: "Message",
                contentWidth: "500px",
                content: [
                    new sap.m.TextArea({
                        id: "noteTextArea_" + Date.now(), // ID unico se vuoi evitare conflitti
                        width: "100%",
                        placeholder: "Scrivi una nota (facoltativa)...",
                        rows: 5
                    })
                ],
                beginButton: new sap.m.Button({
                    text: "Conferma",
                    type: "Accept",
                    press: function () {
                        var note = oNoteDialog.getContent()[0].getValue(); // Accesso diretto al TextArea
                        objStatusModified.note = note;
                        that.updateStatusModification(objStatusModified, status);
                        oNoteDialog.close();
                    }
                }),
                endButton: new sap.m.Button({
                    text: "Annulla",
                    type: "Reject",
                    press: function () {
                        oNoteDialog.close();
                    }
                }),
                afterClose: function () {
                    oNoteDialog.destroy();
                }
            });
        
            this.getView().addDependent(oNoteDialog);
            oNoteDialog.open();
        },
        stripLeadingZeros: function(value) {
            if (!value) return value;
            return value.replace(/^0+/, '');
        }
        
    });
});
