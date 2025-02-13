sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/dm/dme/podfoundation/controller/PluginViewController",
    "sap/ui/core/mvc/XMLView",
    "sap/m/MessageBox"
], function(Controller, JSONModel, PluginViewController,XMLView,MessageBox) {
    "use strict";

    return PluginViewController.extend("kpmg.custom.pod.GDPodCustom.GDPodCustom.controller.BaseController", {
        onInit: function(){
            PluginViewController.prototype.onInit.apply(this, arguments);
            this.setInfoModel();
            this.setBasicProperties();
        },
        setNavContainer: function(oNavContainer){
            this.getInfoModel().setProperty("/oNavContainer",oNavContainer);
        },
        navToPODSelectionView: function(){
            let oNavContainer = this.getInfoModel().getProperty("/oNavContainer");
            // Controlla se la MainPODView è già presente nel NavContainer
            let oPODSelectionView = oNavContainer.getPages().find(function (oPage) {
                return oPage.getViewName() === "kpmg.custom.pod.GDPodCustom.GDPodCustom.view.PODSelection";
            });
            if (oPODSelectionView) {
                // Se la vista è già caricata, naviga verso di essa
                this.onNavigate(oNavContainer,oPODSelectionView);
            } else {
                // Carica e naviga verso la SelectionView
                XMLView.create({
                    viewName: "kpmg.custom.pod.GDPodCustom.GDPodCustom.view.PODSelection"
                }).then(function(oPODSelectionView) {
                    // Aggiungi la SelectionView al NavContainer
                    oNavContainer.addPage(oPODSelectionView);
                    // Naviga verso la SelectionView
                    this.onNavigate(oNavContainer,oPODSelectionView);
                }.bind(this));
            }

        },
        navToMainPODView: function () {
            let oNavContainer = this.getInfoModel().getProperty("/oNavContainer");
        
            // Controlla se la MainPODView è già presente nel NavContainer
            let oMainPODView = oNavContainer.getPages().find(function (oPage) {
                return oPage.getViewName() === "kpmg.custom.pod.GDPodCustom.GDPodCustom.view.MainPOD";
            });
        
            if (oMainPODView) {
                // Se la vista è già caricata, naviga verso di essa
                this.onNavigate(oNavContainer,oMainPODView);
            } else {
                // Se non è caricata, creala e aggiungila
                XMLView.create({
                    viewName: "kpmg.custom.pod.GDPodCustom.GDPodCustom.view.MainPOD"
                }).then(function (oMainPODView) {
                    // Aggiungi la MainPODView al NavContainer
                    oNavContainer.addPage(oMainPODView);
                    // Naviga verso la MainPODView
                    this.onNavigate(oNavContainer,oMainPODView);
                }.bind(this));
            }
            //chiama la callBack 
        },
        onNavigate: function (oNavContainer,oTargetView) {
            oNavContainer.to(oTargetView);
            const oController = oTargetView.getController();
            if (oController && oController.onNavigateTo) {
                oController.onNavigateTo(); //Chiamo la callback onNavigateTo sul controller della vista chiamta
            }
        },
        setInfoModel: function() {
            var oModel = new JSONModel();
            //Imposto il mio modello globale -> Sarà accessibile da tutti i controller che ereditano il mio BaseController
            sap.ui.getCore().setModel(oModel, "InfoModel");
        },
        getInfoModel: function(){
            return sap.ui.getCore().getModel("InfoModel");
        },
        setBasicProperties: function(){
            this.getInfoModel().setProperty("/BaseProxyURL",this.getConfiguration().BaseProxyURL);
            this.getInfoModel().setProperty("/plant",this.getConfiguration().Plant);
            this.getInfoModel().setProperty("/user_id",this.getUserId());
        },
        // Funzione per mostrare un messaggio di toast
        showToast: function(sMessage) {
            sap.m.MessageToast.show(sMessage);
        },
        showErrorMessageBox: function(oMessage) {
            MessageBox.error(oMessage, {
                title: "Error", // Titolo della finestra
                actions: [sap.m.MessageBox.Action.CLOSE], // Azione per chiudere il messaggio
                onClose: function (oAction) {
                }
            });
        },
        showWarningMessageBox: function(oMessage, callbackFunction, oContext ) {
            sap.m.MessageBox.show(
                oMessage, // Messaggio da visualizzare
                {
                    icon: sap.m.MessageBox.Icon.WARNING, // Tipo di icona
                    title: title || "Warning",         // Titolo della MessageBox
                    actions: [sap.m.MessageBox.Action.OK, sap.m.MessageBox.Action.CANCEL], 
                    onClose: function(oAction) {          // Callback all'interazione
                        if (typeof callback === "function") {
                            callbackFunction.call(oContext); // Chiama il callback con il contesto corretto
                        }
                    }
                }
            );
        },
        getI18n: function(token) {
            return this.getView().getModel("i18n").getProperty(token);
        },
        showDialogString: function(textContent,fileName){
            // Crea un controllo sap.m.Text per visualizzare la stringa
            var oText = new sap.m.Text({
                text: textContent
            });

            // Crea un dialog di SAPUI5
            var oDialog = new sap.m.Dialog({
                title: fileName,
                content: [oText], // Passa il controllo oText al content del dialog
                contentWidth: "50%",  // Larghezza minima
                contentHeight: "50%", // Altezza minima
                resizable: true, // Permette di ridimensionarlo
                draggable: true, // Permette di trascinarlo
                beginButton: new sap.m.Button({
                    text: "Close",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            // Apre il dialog
            oDialog.open();
        },
        showDialogHTML: function(htmlContent,fileName){
            // Crea un controllo HTML di SAPUI5 con il contenuto HTML
            var oHtml = new sap.ui.core.HTML({
                content: htmlContent
            });

            // Crea un dialog di SAPUI5
            var oDialog = new sap.m.Dialog({
                title: fileName,
                content: [oHtml],
                contentWidth: "50%",  // Larghezza minima
                contentHeight: "50%", // Altezza minima
                resizable: true, // Permette di ridimensionarlo
                draggable: true, // Permette di trascinarlo
                beginButton: new sap.m.Button({
                    text: "Close",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });

            // Apre il dialog
            oDialog.open();
        },
        showDialogImage: function(fileUrl,fileName){
            // Crea l'immagine
            var img = new Image();
            img.src = fileUrl;
            img.style.maxWidth = "100%";
            img.style.maxHeight = "100%";

            // Popup su cui mostrarla
            var oDialog = new sap.m.Dialog({
                title: fileName,
                content: [
                    new sap.m.Image({
                        src: fileUrl,
                        width: "100%",
                        height: "100%"
                    })
                ],
                resizable: true, // Permette di ridimensionarlo
                draggable: true, // Permette di trascinarlo
                beginButton: new sap.m.Button({
                    text: "Close",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });
            // Apre il dialog
            oDialog.open();
        },
        showDialogVideo: function(fileUrl,fileName,contentType){
            // Crea un video
            var oVideo = new sap.ui.core.HTML({
                content: "<video controls style='width: 100%; height: 100%;'><source src='" + fileUrl + "' type='" + contentType + "'></video>"
            });

            // Crea un dialog di SAPUI5 per il video
            var oDialog = new sap.m.Dialog({
                title: fileName,
                content: [oVideo],
                beginButton: new sap.m.Button({
                    text: "Close",
                    press: function () {
                        oDialog.close();
                    }
                }),
                afterClose: function () {
                    oDialog.destroy();
                }
            });
            // Apre il dialog
            oDialog.open();
        },
        onExit: function () {
			PluginViewController.prototype.onExit.apply(this, arguments);
		}
    });
});

//# sourceURL=https://g-d--s-p-a--sap-dmc-test-96ypknc8-ext-dev-space-gdpodcustom.cfapps.eu20-001.hana.ondemand.com/GDPodCustom/GDPodCustom/controller/BaseController.js?eval