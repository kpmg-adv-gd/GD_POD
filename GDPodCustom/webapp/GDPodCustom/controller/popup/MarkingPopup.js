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
                that.openDialog();
            },

            loadHeaderData: function () {
                var that = this;
                var infoModel = that.getInfoModel();
    
                const wbe = infoModel.getProperty("/selectedSFC/WBE") || "";
                const sfc = infoModel.getProperty("/selectedSFC/sfc") || "";
                const order = infoModel.getProperty("/selectedSFC/order") || "";
                const operation = that.markOperation.routingOperation.operationActivity.operationActivity || "";
    
                that.MarkingPopupModel.setProperty("/wbe", wbe);
                that.MarkingPopupModel.setProperty("/sfc", sfc);
                that.MarkingPopupModel.setProperty("/order", order);
                that.MarkingPopupModel.setProperty("/operation", operation);
            }
        })
    }
)