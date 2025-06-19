sap.ui.define([
    'jquery.sap.global',
	"sap/ui/model/json/JSONModel",
    "./BaseController",
    "../utilities/CommonCallManager",
    "./popup/ViewDefectPopup"
], function (jQuery, JSONModel, BaseController, CommonCallManager, ViewDefectPopup) {
    "use strict";

    return BaseController.extend("kpmg.custom.pod.GDPodCustom.GDPodCustom.controller.Defect", {
        Defect: new JSONModel(),
        ViewDefectPopup: new ViewDefectPopup(),
        oGroupModel: new JSONModel(),
        oVarianceModel: new JSONModel(),
        onInit: function () {
            this.getView().setModel(this.Defect, "DefectModel");
            this.getView().setModel(this.oGroupModel, "GroupModel");
            this.getView().setModel(this.oVarianceModel, "VarianceModel");
            
            this.treeTable = this.getView().byId("treeTableDefect");

            // subscribe aggiorna difetti
            sap.ui.getCore().getEventBus().subscribe("defect", "receiveDefect", this.onAfterRendering, this);
        },

        onAfterRendering: function(){
            var that=this;
            that.getView().getModel("DefectModel").setProperty("/Defect", []);
            that.getVariance();
        },

        // Recupero CodeGroups 
        getCodeGroups: function () {
            var that = this;
            let plant = that.getInfoModel().getProperty("/plant");
            
            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathGetMarkingDataApi = "/api/nonconformancegroup/v1/nonconformancegroups?plant=" + plant;
            let url = BaseProxyURL + pathGetMarkingDataApi;

            let params = {};

            // Callback di successo
            var successCallback = function (response) {
                if (response.groupResponse) {
                    response.groupResponse.forEach(item => item.associateCodes = []);
                    this.oGroupModel.setProperty("/", response.groupResponse);
                    that.getCodes();
                }
            };
            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata GET fallita: ", error);
            };
            CommonCallManager.callProxy("GET", url, params, true, successCallback, errorCallback, that);
        },
        // Recupero codes
        getCodes: function (oEvent) {
            var that = this;
            let plant = that.getInfoModel().getProperty("/plant");
            
            let BaseProxyURL =  that.getInfoModel().getProperty("/BaseProxyURL");
            let pathGetMarkingDataApi = "/api/nonconformancecode/v1/nonconformancecodes?plant=" + plant;
            let url = BaseProxyURL + pathGetMarkingDataApi;

            let params = {
            };

            // Callback di successo
            var successCallback = function (response) {
                if (response.codeResponse) {
                    response.codeResponse.forEach(code => {
                        code.groups.forEach(group => {
                            that.oGroupModel.getProperty("/").filter(item => item.group == group.group).forEach(item => item.associateCodes.push(code));
                        })
                    });
                    that.oGroupModel.refresh();
                    that.receiveGroupDefect(0);
                }
            };
            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata GET fallita: ", error);
            };
            CommonCallManager.callProxy("GET", url, params, true, successCallback, errorCallback, that);
        },
        // Recupero variances
        getVariance: function () {
            var that = this;
            var plant = that.getInfoModel().getProperty("/plant");

            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathReasonForVarianceApi = "/db/getReasonsForVariance";
            let url = BaseProxyURL + pathReasonForVarianceApi;

            let params = {};

            // Callback di successo
            var successCallback = function (response) {
                that.oVarianceModel.setProperty("/", response.filter(item => item.plant == plant));
                that.getCodeGroups();
            };

            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },

        onNavigateTo: function(){
            var that=this;
            var defects = that.getInfoModel().getProperty("/defectOperation");
			if (defects.length > 0)
	            that.getCodeGroups();
			else
				that.getView().getModel("DefectModel").setProperty("/Defect", []);
        },
        onOperationChange: function(){
            var that=this;
        },
        receiveGroupDefect: function (elem) {
            var that=this;

            var defects = that.getInfoModel().getProperty("/defectOperation");
            var plant = that.getInfoModel().getProperty("/plant");

            if (elem == "defect") {
				if (defects.length == 0) return;
				elem = 0;
			}

            if (defects.filter(item => item.code == defects[elem].code && item.group != undefined).length > 0) {
                var group = defects.filter(item => item.code == defects[elem].code && item.group != undefined)[0].group;
                defects[elem].group = group;
                elem = elem + 1
                if (elem < defects.length) {
                    that.receiveGroupDefect(elem);
                }else{
                    that.loadDefectModel();
                }
                return;
            }

            let params = { };
            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathOrderBomApi = "/api/nonconformancecode/v1/nonconformancecodes?plant=" + plant + "&code=" + defects[elem].code;
            let url = BaseProxyURL+pathOrderBomApi; 

            // Callback di successo
            var successCallback = function(response) {
                // Qui devo inserire il group dentro il modello di quel difetto
                defects[elem].group = response.codeResponse[0].groups[0].group;

                elem = elem + 1
                if (elem < defects.length) {
                    that.receiveGroupDefect(elem);
                }else{
                    that.loadDefectModel();
                }
            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata GET fallita:", error);
            };
            CommonCallManager.callProxy("GET", url, params, true, successCallback, errorCallback, that);
        },
        loadDefectModel: function(){
            var that=this;

            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathOrderBomApi = "/db/selectZDefect";
            let url = BaseProxyURL+pathOrderBomApi; 
            var plant = that.getInfoModel().getProperty("/plant");

            var listDefect = [];
            that.getInfoModel().getProperty("/defectOperation").forEach(element => {
                listDefect.push(element.id)
            });

            let params={
                listDefect: listDefect,
                plant: plant
            };

            // Callback di successo
            var successCallback = function(response) {
                var defectList = [];
                response.forEach(item => {
                    var defStd = that.getInfoModel().getProperty("/defectOperation").filter(def => def.id == item.id)[0];
                    item.group = defStd.group;
                    item.code = defStd.code;
                    item.codeDesc = that.oGroupModel.getProperty("/").filter(group => group.group == item.group)[0].associateCodes.filter(code => code.code ==defStd.code)[0].description;
                    item.groupOrCode = item.codeDesc;
                    item.numDefect = defStd.quantity;
                    item.status = defStd.state;
                    item.varianceDesc = that.oVarianceModel.getProperty("/").filter(variance => variance.cause == item.variance)[0].description;
                    item.groupDesc = that.oGroupModel.getProperty("/").filter(group => group.codes.filter(code => code.code == item.code).length > 0)[0].description
                    item.okClose = (!item.create_qn || (item.system_status != null && item.system_status.includes("ATCO"))) && item.status == "OPEN";
                    if (defectList.filter(def => def.groupOrCode == item.groupDesc).length > 0) {
                        defectList.filter(def => def.groupOrCode == item.groupDesc)[0].Children.push(item);
                    }else{
                        defectList.push({
                            groupOrCode: item.groupDesc,
                            Children: [item]
                        })
                    }
                });
                that.getView().getModel("DefectModel").setProperty("/Defect", defectList);
                sap.ui.getCore().getEventBus().publish("defect", "loadDefectToPOD", {defects: response});

            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        onDetailPress: function (oEvent) {
            var that = this;
            let defect = oEvent.getSource().getParent().getBindingContext("DefectModel").getObject();
            that.ViewDefectPopup.open(that.getView(), that, 
                defect, this.getInfoModel().getProperty("/defectOperation").filter(def => def.id == defect.id)[0]);
        },
        onClosePress: function (oEvent) {
            var that = this;
            let idDefect = oEvent.getSource().getParent().getBindingContext("DefectModel").getObject().id;
            var plant = that.getInfoModel().getProperty("/plant");
            let sfc = that.getInfoModel().getProperty("/selectedSFC/sfc");
            let order = that.getInfoModel().getProperty("/selectedSFC/order");

            let params = {
                id: idDefect,
                plant: plant,
                comments: "",
                sfc: sfc,
                order: order
            };

            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathOrderBomApi = "/api/nonconformance/v1/close";
            let url = BaseProxyURL+pathOrderBomApi; 

            // Callback di successo
            var successCallback = function(response) {
                // publish difetti
                //that.sendCloseToSap(plant, idDefect, qnCode);
                sap.ui.getCore().getEventBus().publish("defect", "loadDefect", null);
                that.showToast(that.getI18n("defect.close.success.message"));
                sap.ui.core.BusyIndicator.hide();
            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata POST fallita:", error);
                sap.ui.core.BusyIndicator.hide();
            };
            
            sap.ui.core.BusyIndicator.show(0);
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },

        sendCloseToSap: function (plant, idDefect, qnCode) {
            var that = this;

            let params = {
                plant: plant,
                defectId: idDefect,
                qnCode: qnCode
            };

            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathOrderBomApi = "/api/nonconformance/v1/sap/close";
            let url = BaseProxyURL+pathOrderBomApi; 

            // Callback di successo
            var successCallback = function(response) {

            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata POST fallita:", error);
            };
            
            sap.ui.core.BusyIndicator.show(0);
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },

        onExpandAll: function() {
            var that=this;
			var oTreeTable = this.byId("treeTableDefect");
			oTreeTable.expandToLevel(1);
			oTreeTable.expandToLevel(2);
		},
        onCollapseAll: function() {
            var that=this;
			var oTreeTable = this.byId("treeTableDefect");
			oTreeTable.collapseAll();
		},
        toggleBusyIndicator: function () {
            var that = this;
            var busyState = that.treeTable.getBusy();
            that.treeTable.setBusy(!busyState);
        }
        
    });
});
