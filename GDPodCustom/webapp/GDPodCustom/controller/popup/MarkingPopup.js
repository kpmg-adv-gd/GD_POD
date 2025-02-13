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
        })
    }
)