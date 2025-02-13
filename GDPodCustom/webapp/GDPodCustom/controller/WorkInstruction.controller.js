sap.ui.define([
    'jquery.sap.global',
	"sap/ui/model/json/JSONModel",
    "./BaseController",
    "../utilities/CommonCallManager",
], function (jQuery, JSONModel, BaseController, CommonCallManager) {
    "use strict";

    return BaseController.extend("kpmg.custom.pod.GDPodCustom.GDPodCustom.controller.WorkInstruction", {
        oWorkInstructionModel: new JSONModel(),

        onInit: function () {
            this.getView().setModel(this.oWorkInstructionModel, "WorkInstructionModel");
        },

        onAfterRendering: function(){
            var that=this;
            that.loadWorkInstruction();
        },
        rowSelectionChange: function(oEvent){
            var that=this;
            var oTable = oEvent.getSource();
            var selectedIndexWorkInstruction = oTable.getSelectedIndex();
            if( selectedIndexWorkInstruction !== -1 ){
                var selectedWorkInstruction = oTable.getContextByIndex(selectedIndexWorkInstruction).getObject();
                oTable.setSelectedIndex(-1);
                that.loadWorkInstructionContent(selectedWorkInstruction);
            }
        },
        //FUNZIONE COMUNE A TUTTI I TAB!! CHIAMATA OGNI VOLTA CHE SELEZIONO/DESELEZIONO UNA OPERAZIONE (QUINDI NELLA TABELLA DEL CONTAINER DI SX) 
        onOperationChange: function(){
            var that=this;
            that.loadWorkInstruction();
        },
        loadWorkInstruction: function(){
            var that=this;
            var selectedOperation = that.getInfoModel().getProperty("/selectedOperation");
            //se l'operazione non è selezionata allora tabella vuota
            if(!selectedOperation){
                that.getView().getModel("WorkInstructionModel").setProperty("/workInstructions",undefined);
                return;
            }
            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathAPIWorkInstructionFile = "/api/workinstruction/v1/attachedworkinstructions";

            let url = BaseProxyURL+pathAPIWorkInstructionFile;
            let plant = that.getInfoModel().getProperty("/plant");
            let sfc = that.getInfoModel().getProperty("/selectedSFC/sfc");
            let operation = selectedOperation.routingOperation.operationActivity.operationActivity;

            let params = {
                plant: plant, 
                sfc: sfc,
                operation: operation 
            }

            // Callback di successo
            var successCallback = function(response) {
                that.getView().getModel("WorkInstructionModel").setProperty("/workInstructions",response.result);
            };
            // Callback di errore
            var errorCallback = function(error) {
                that.getView().getModel("WorkInstructionModel").setProperty("/workInstructions",undefined);
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);

        },
        loadWorkInstructionContent: function(selectedWorkInstruction){
            var that=this;    
            //se la work instruction non ha file/documenti allegati
            if(!selectedWorkInstruction.workInstructionElements || selectedWorkInstruction.workInstructionElements.length == 0){
                let errorMessage = that.getI18n("workInstruction.errorMessage.noAttachedFile")
                return that.showErrorMessageBox(errorMessage);
            }
            let workInstructionObj = selectedWorkInstruction.workInstructionElements[0];

            if(workInstructionObj.type==="URL"){
                window.open(workInstructionObj.url, "_blank");
            } else if(workInstructionObj.type==="TEXT"){
                that.showDialogHTML(workInstructionObj.text, workInstructionObj.description);
            } else if(workInstructionObj.type==="HEADER_TEXT"){
                that.showDialogString(workInstructionObj.text, workInstructionObj.description);
            } else if(workInstructionObj.type==="FILE"){
                sap.ui.core.BusyIndicator.show(0);
                that.loadWorkInstructionFile(workInstructionObj);
            }
        },
        loadWorkInstructionFile: function(workInstructionObj){
            var that=this;
            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathAPIWorkInstructionFile = "/api/workinstruction/v1/workinstructions/file";
            let url = BaseProxyURL+pathAPIWorkInstructionFile;

            let fileName = workInstructionObj.fileName;
            let externalFileUrl = workInstructionObj.fileExternalUrl;

            let params = {
                fileName: fileName,
                externalFileUrl: externalFileUrl
            }

            // Callback di successo
            var successCallback = function(response) {
                if (response.fileContent && response.contentType) {
                    // Converte i dati in un Blob
                    var uintArray = new Uint8Array(response.fileContent.data);
                    var blob = new Blob([uintArray], { type: response.contentType });
                    // Crea un URL per il file
                    var fileUrl = URL.createObjectURL(blob);
                    var fileName = response.fileName || "";
    
                    // Determina come visualizzare il file
                    if (response.contentType.includes("pdf")) {
                        // Apri il PDF in una nuova finestra
                        window.open(fileUrl, "_blank");
                    } else if (response.contentType.includes("image")) {
                        // Mostra un'immagine in una nuova finestra o elemento img
                        that.showDialogImage(fileUrl,fileName);
                    } else if (response.contentType.includes("video")) {
                        // Mostra un video su dialog
                        that.showDialogVideo(fileUrl, fileName, response.contentType);
                    } else {
                        //Provo il Download
                        var a = document.createElement("a");
                        a.href = fileUrl;
                        a.download = response.fileName; // Puoi settare il nome del file da scaricare
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                    }
                } else {
                    that.showErrorMessageBox("No Content File");
                }
                sap.ui.core.BusyIndicator.hide();
            };
            // Callback di errore
            var errorCallback = function(error) {
                sap.ui.core.BusyIndicator.hide();
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },

    });
});
