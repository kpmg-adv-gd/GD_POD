sap.ui.define([
    'jquery.sap.global',
	"sap/ui/model/json/JSONModel",
    "./BaseController",
    "../utilities/CommonCallManager",
], function (jQuery, JSONModel, BaseController, CommonCallManager) {
    "use strict";

    return BaseController.extend("kpmg.custom.pod.GDPodCustom.GDPodCustom.controller.ElectricalBox", {
        oElectricalBoxModel: new JSONModel(),

        onInit: function () {
            var that=this;
            that.getView().setModel(that.oElectricalBoxModel, "ElectricalBoxModel");
        },
        onAfterRendering: function(){
            var that=this;
            that.loadElectricalBoxModel();
        },
        loadElectricalBoxModel: function(){
            var that=this;

            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathElectricalBoxDb = "/db/getZElectricalBoxData";
            let url = BaseProxyURL+pathElectricalBoxDb; 

            let plant = that.getInfoModel().getProperty("/plant") || "";
            let project = that.getInfoModel().getProperty("/selectedSFC/COMMESSA") || "";;
            let order = that.getInfoModel().getProperty("/selectedSFC/order") || "";

            let params={
                plant: plant,
                project: project,
                order: order
            };

            // Callback di successo
            var successCallback = function(response) {
                that.getView().getModel("ElectricalBoxModel").setProperty("/ElectricalBoxList",response);
            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        onStatusChanged: function(oEvent){
            var that=this;
            var checkBoxId = oEvent.getParameter("id");
            var pathElectricalBoxModel = sap.ui.getCore().byId(checkBoxId).getParent().getBindingContext("ElectricalBoxModel").getPath();
            var electricalBoxObject = that.getView().getModel("ElectricalBoxModel").getProperty(pathElectricalBoxModel);

            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathElectricalBoxDb = "/db/updateStatusZElectricalBoxData";
            let url = BaseProxyURL+pathElectricalBoxDb; 

            let plant = that.getInfoModel().getProperty("/plant") || "";
            let project = that.getInfoModel().getProperty("/selectedSFC/COMMESSA") || "";;
            let order = that.getInfoModel().getProperty("/selectedSFC/order") || "";
            let newStatus = oEvent.getParameter("selected");

            let params={
                plant: plant,
                project: project,
                order: order,
                eb_material: electricalBoxObject.eb_material,
                status: newStatus
            };

            // Callback di successo
            var successCallback = function(response) {
                
            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
    });
});
