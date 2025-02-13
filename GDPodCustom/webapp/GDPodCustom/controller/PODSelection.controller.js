sap.ui.define([
    'jquery.sap.global',
	"sap/ui/model/json/JSONModel",
    "./BaseController",
    "../utilities/CommonCallManager"
], function (jQuery, JSONModel, BaseController, CommonCallManager) {
	"use strict";

	return BaseController.extend("kpmg.custom.pod.GDPodCustom.GDPodCustom.controller.PODSelection", {
        oPODSelectionModel: new JSONModel(),

		onInit: function () {
            this.getView().setModel(this.oPODSelectionModel, "PODSelectionModel");
		},
        onAfterRendering: function(){
            var that=this;
            that.firstTimeEnterPodSelection=true;
        },
        onNavigateTo: function() {
            var that=this;
            that.populateSuggestionFilters();
            that.onGoPress();
        },
        populateSuggestionFilters: function(){
            var that=this;
            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathAPIFilter = "/api/getFilterPOD";
            let url = BaseProxyURL+pathAPIFilter;
            let plant = that.getInfoModel().getProperty("/plant");
            let params = {
                "plant": plant
            }
            // Callback di successo
            var successCallback = function(response) {
                var oFilterModel = new JSONModel(response);
                this.getView().setModel(oFilterModel,"FilterModel");
            };

            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);

        },
        onGoPress: function(){
            var that=this;
            //Controllo solo che se ho appena caricato il POD non devo restiuire dati -> non controllo il wc
            if(!that.firstTimeEnterPodSelection){
                let workcenter = that.getView().byId("workcenterComboBoxId").getSelectedKey();
                if(!workcenter){
                    that.showErrorMessageBox(that.getI18n("podSelection.errorMessage.noWorkcenter"));
                    that.getView().getModel("PODSelectionModel").setProperty("/SFCs",undefined);
                    return
                }

                that.getIfUserCertificatedForWorkcenter(workcenter);
            } else{
                that.firstTimeEnterPodSelection=false;
                that.getView().getModel("PODSelectionModel").setProperty("/SFCs",undefined);
            }
        },
        getIfUserCertificatedForWorkcenter: function(workcenter){
            var that=this;
            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathAPIUserCertificatedWorkcenter = "/api/checkUserWorkCenterCertification";
            let url = BaseProxyURL+pathAPIUserCertificatedWorkcenter
            
            let params={
                plant: that.getInfoModel().getProperty("/plant"),
                userId: that.getInfoModel().getProperty("/user_id"),
                workCenter: workcenter
            };

            // Callback di successo
            var successCallback = function(response) {
                if(response){
                    that.getPodSelectionTableData();
                } else {
                    that.showErrorMessageBox(that.getI18n("podSelection.errorMessage.noCertificationWorkcenter"));
                }
            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);

        },
        getPodSelectionTableData: function(){
            var that=this;
            let BaseProxyURL = that.getInfoModel().getProperty("/BaseProxyURL");
            let pathAPISelectionPodTable = "/api/sfc/v1/worklist/sfcs";
            let url = BaseProxyURL+pathAPISelectionPodTable;

            let params={
                "plant": that.getInfoModel().getProperty("/plant"),
                "workcenter": that.getView().byId("workcenterComboBoxId").getSelectedKey(),
                "sfc": that.getView().byId("sfcInputId").getValue(),
                "project": that.getView().byId("projectInputId").getValue(),
                "wbs": that.getView().byId("wbsInputId").getValue(),
                "machineSection": that.getView().byId("machineSectionInputId").getValue(),
                "parentMaterial": that.getView().byId("parentMaterialInputId").getValue(),
                "material": that.getView().byId("materialInputId").getValue()
            }

            // Callback di successo
            var successCallback = function(response) {
                that.getView().getModel("PODSelectionModel").setProperty("/SFCs",response.result);
            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);

        },
        onClearPress: function(oEvent){
            var that = this;
            var oTable = that.getView().byId("resultTable");
            that.getView().byId("sfcInputId").setValue("");
            that.getView().byId("projectInputId").setValue("");
            that.getView().byId("wbsInputId").setValue("");
            that.getView().byId("machineSectionInputId").setValue("");
            that.getView().byId("parentMaterialInputId").setValue("");
            that.getView().byId("materialInputId").setValue("");
            that.getView().byId("workcenterComboBoxId").setSelectedKey("");
            //Rimuovo filtri delle colonne della tabella
            const aColumns = oTable.getColumns();
			for (let i = 0; i < aColumns.length; i++) {
				oTable.filter(aColumns[i], null);
			}
        },
        rowSelectionChange: function(oEvent){
            var that=this;
            var oTable = oEvent.getSource();
            var selectedIndex = oTable.getSelectedIndex();
            //Tutte le volte in cui ho selezionato (e non deselezionato)
            if( selectedIndex !== -1 ){
                var selectedObject = oTable.getContextByIndex(selectedIndex).getObject();
                that.getInfoModel().setProperty("/selectedSFC",selectedObject);
                that.navToMainPODView();
            }
        },
        //formatter per collonna status (ICONA) front-end
        getStatusIcon: function (code) {
            switch (code) {
                case "401":
                    return "sap-icon://rhombus-milestone-2";
                case "402":
                    return "sap-icon://color-fill";
                case "403":
                    return "sap-icon://circle-task-2";
                default:
                    return "";
            }
        },
        getStatusColor: function (code) {
            switch (code) {
                case "401":
                    return "grey";
                case "402":
                    return "blue"; // Blu
                case "403":
                    return "green"; // Verde
                default:
                    return "Default"; // Colore di default
            }
        }
        

	});
});