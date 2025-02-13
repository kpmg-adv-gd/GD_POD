sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "../BaseController",
    "../../utilities/CommonCallManager",
    "../../utilities/GenericDialog"
],  function (JSONModel, BaseController, CommonCallManager, Dialog) {
        "use strict";
        
        return Dialog.extend("kpmg.custom.pod.GDPodCustom.GDPodCustom.controller.popup.MarkingPopup", {

            open: function (oView, oController, markOperation) {
                var that = this;
                that.MarkingPopupModel = new JSONModel();
                that.MainPODcontroller = oController;
                that.markOperation = markOperation;
                
                that._initDialog("kpmg.custom.pod.GDPodCustom.GDPodCustom.view.popup.MarkingPopup", oView, that.MarkingPopupModel);
                that.loadHeaderData(); 
                that.loadMarkingData();       
                that.openDialog();
            },

            loadHeaderData: function () {
                var that = this;
                var infoModel = that.MainPODcontroller.getInfoModel();
    
                const wbe = infoModel.getProperty("/selectedSFC/WBE") || "";
                const sfc = infoModel.getProperty("/selectedSFC/sfc") || "";
                const order = infoModel.getProperty("/selectedSFC/order") || "";
                const operation = that.markOperation.routingOperation.operationActivity.operationActivity || "";
    
                that.MarkingPopupModel.setProperty("/wbe", wbe);
                that.MarkingPopupModel.setProperty("/sfc", sfc);
                that.MarkingPopupModel.setProperty("/order", order);
                that.MarkingPopupModel.setProperty("/operation", operation);
            },

            loadMarkingData: function(){
                var that = this;
                var infoModel = that.MainPODcontroller.getInfoModel();
    
                let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
                let pathGetMarkingDataApi = "/db/getMarkingData";
                let url = BaseProxyURL+pathGetMarkingDataApi; 
    
                let wbe_machine = infoModel.getProperty("/selectedSFC/WBE") || "";
                let mes_order = infoModel.getProperty("/selectedSFC/order") || "";
                let operation = that.markOperation.routingOperation.operationActivity.operationActivity;
    
                let params = {
                    wbe_machine: wbe_machine,
                    mes_order: mes_order,
                    operation: operation
                };
    
                // Callback di successo
                var successCallback = function(response) {
                    if (response.length > 0){
                        that.MarkingPopupModel.setProperty("/personnelNumber", response[0].confirmation_number || "");
                        that.MarkingPopupModel.setProperty("/confirmNumber", response[0].confirmation_number || "");
                        that.MarkingPopupModel.setProperty("/plannedLabor", response[0].planned_labor || "0");
                        that.MarkingPopupModel.setProperty("/markedLabor", response[0].marked_labor || "0");
                        that.MarkingPopupModel.setProperty("/remainingLabor", response[0].remaining_labor || "0");
                        that.MarkingPopupModel.setProperty("/varianceLabor", response[0].variance_labor || "0");
                    }
                };
                // Callback di errore
                var errorCallback = function(error) {
                    console.log("Chiamata POST fallita: ", error);
                };
                CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
            },

            onRetrievePersonnelNumber: function(){
                var that = this;
                var infoModel = that.MainPODcontroller.getInfoModel();
    
                let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
                let pathPersonnelNumberApi = "/api/getPersonnelNumber";
                let url = BaseProxyURL+pathPersonnelNumberApi; 
    
                let plant = infoModel.getProperty("/plant") || "";
                let userId = infoModel.getProperty("/user_id") || "";
    
                let params = {
                    plant: plant,
                    userId: userId
                };
    
                // Callback di successo
                var successCallback = function(response) {
                    that.MarkingPopupModel.setProperty("/personnelNumber", response || "");
                };

                // Callback di errore
                var errorCallback = function(error) {
                    console.log("Chiamata POST fallita: ", error);
                };
                CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
            },

            validate: function () {
                var that = this;
                var oMarkingDate = that.byId("markingDatePicker");
                var oStartTime = that.byId("startTimePicker");
                var oFinishTime = that.byId("finishTimePicker");
    
                var sMarkingDate = oMarkingDate.getValue();
                var sStartTime = oStartTime.getValue();
                var sFinishTime = oFinishTime.getValue();
    
                if (!sMarkingDate || !sStartTime || !sFinishTime) {
                    return false; 
                }
    
                function convertToDate(dateStr) {
                    let parts = dateStr.split("/");
                    return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
                }
            
                let markingDate = convertToDate(sMarkingDate);
                let today = new Date(); 
            
                if (markingDate > today) {
                    console.error("Errore: Non può essere selezionata una data futura.");
                    return false;
                }
            
                if (sFinishTime < sStartTime) {
                    console.error("Errore: L'orario di fine non può essere minore dell'orario di inizio.");
                    return false;
                }
            
                return true;
            },

            onConfirm: function() {
                var that = this;
            
                if (that.validate()) {
                    that.MainPODcontroller.showToast(that.MainPODcontroller.getI18n("marking.success.message"))
                } else {
                    that.MainPODcontroller.showErrorMessageBox(that.MainPODcontroller.getI18n("marking.error.message"));
                }
            },

            onClosePopup: function () {
                var that = this;
                that.closeDialog();
            }
        })
    }
)