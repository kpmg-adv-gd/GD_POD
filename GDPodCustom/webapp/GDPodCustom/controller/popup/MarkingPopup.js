sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "./BaseController",
    "../utilities/CommonCallManager",
    "../utilities/GenericDialog"
],  function (JSONModel, BaseController, CommonCallManager, Dialog) {
        "use strict";
        
        var popupDialog = Dialog.extend("controller.popup.MarkingPopup", {

            open: function (oView, oController, markOperation) {
                var that = this;
                that.MarkingPopupModel = new JSONModel();
                that.MainPODcontroller = oController;
                that.markOperation = markOperation;
    
                that._initDialog("view.popup.MarkingPopup", oView, that.MarkingPopupModel);        
                that.openDialog();
            },
        })
    }
)