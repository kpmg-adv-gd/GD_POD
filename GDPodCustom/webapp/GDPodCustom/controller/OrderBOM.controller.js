sap.ui.define([
    'jquery.sap.global',
	"sap/ui/model/json/JSONModel",
    "./BaseController",
    "../utilities/CommonCallManager"
], function (jQuery, JSONModel, BaseController, CommonCallManager) {
    "use strict";

    return BaseController.extend("kpmg.custom.pod.GDPodCustom.GDPodCustom.controller.OrderBOM", {
        oBomModel: new JSONModel(),
        onInit: function () {
            this.getView().setModel(this.oBomModel, "BomModel");
            this.treeTable = this.getView().byId("treeTable");
        },

        onAfterRendering: function(){
            var that=this;
            that.loadBomModel();
        },
        //chiamata quando entriamo nel MainPOD
        onNavigateTo: function(){
            var that=this;
            that.loadBomModel();
        },
        onOperationChange: function(){
            var that=this;
        },
        loadBomModel: function(){
            var that=this;
            that.toggleBusyIndicator();

            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathOrderBomApi = "/api/bom/getBomMultilivelloTreeTableData";
            let url = BaseProxyURL+pathOrderBomApi; 

            let order = that.getInfoModel().getProperty("/selectedSFC/order") || "";
            let plant = that.getInfoModel().getProperty("/plant") || "";

            let params={
                order: order,
                plant: plant
            };

            // Callback di successo
            var successCallback = function(response) {
                that.getView().getModel("BomModel").setProperty("/MaterialList",[response]);
                that.toggleBusyIndicator();
            };
            // Callback di errore
            var errorCallback = function(error) {
                that.toggleBusyIndicator();
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        onExpandAll: function() {
            var that=this;
			var oTreeTable = this.byId("treeTable");
			oTreeTable.expandToLevel(1);
			oTreeTable.expandToLevel(2);
		},
        onCollapseAll: function() {
            var that=this;
			var oTreeTable = this.byId("treeTable");
			oTreeTable.collapseAll();
		},
        toggleBusyIndicator: function () {
            var that = this;
            var busyState = that.treeTable.getBusy();
            that.treeTable.setBusy(!busyState);
        }
        
    });
});
