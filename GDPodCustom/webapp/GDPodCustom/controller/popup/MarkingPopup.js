sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "../BaseController",
    "../../utilities/CommonCallManager",
    "../../utilities/GenericDialog"
], function (JSONModel, BaseController, CommonCallManager, Dialog) {
    "use strict";

    return Dialog.extend("kpmg.custom.pod.GDPodCustom.GDPodCustom.controller.popup.MarkingPopup", {

        open: function (oView, oController, markOperation, isMarkingEnabled) {
            var that = this;
            that.MarkingPopupModel = new JSONModel();
            that.MainPODcontroller = oController;
            that.markOperation = markOperation;

            that._initDialog("kpmg.custom.pod.GDPodCustom.GDPodCustom.view.popup.MarkingPopup", oView, that.MarkingPopupModel);
            that.loadHeaderData();
            that.loadMarkingData();
            that.onRetrievePersonnelNumber();
            that.setMarkingEnabled(isMarkingEnabled);
            that.openDialog();
            that.clearData();
            that.searchDefects();
        },

        clearData: function () {
            var that = this;
            that.getView().byId("hhInputId").setValue("");
            that.getView().byId("mmInputId").setValue("");
            that.getView().byId("markingDatePicker").setValue("");
            that.getView().byId("selectedVarianceText").setText("");
            that.getView().byId("selectedUpdateText").setText("");
            that._selectedCause = null;
            that._selectedDescription = null;
        },
        setMarkingEnabled: function(isMarkingEnabled){
            var that=this;
            that.MarkingPopupModel.setProperty("/isMarkingEnabled", isMarkingEnabled);
        },
        loadHeaderData: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();

            const wbe = infoModel.getProperty("/selectedSFC/WBE") || "";
            const sfc = infoModel.getProperty("/selectedSFC/sfc") || "";
            const order = infoModel.getProperty("/selectedSFC/order") || "";
            const operation = that.markOperation.routingOperation.operationActivity.operationActivity || "";
            const operationDescription = that.markOperation.description || "";

            that.MarkingPopupModel.setProperty("/wbe", wbe);
            that.MarkingPopupModel.setProperty("/sfc", sfc);
            that.MarkingPopupModel.setProperty("/order", order);
            that.MarkingPopupModel.setProperty("/operation", operation);
            that.MarkingPopupModel.setProperty("/operationDescription", operationDescription);

        },

        loadMarkingData: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathGetMarkingDataApi = "/db/getMarkingData";
            let url = BaseProxyURL + pathGetMarkingDataApi;

            let wbe_machine = infoModel.getProperty("/selectedSFC/WBE") || "";
            let mes_order = infoModel.getProperty("/selectedSFC/order") || "";
            let operation = that.markOperation.routingOperation.operationActivity.operationActivity;

            let params = {
                wbe_machine: wbe_machine,
                mes_order: mes_order,
                operation: operation
            };

            // Callback di successo
            var successCallback = function (response) {
                if (response.length > 0) {
                    that.MarkingPopupModel.setProperty("/confirmNumber", response[0].confirmation_number || "");
                    const plannedLabor = response[0]?.planned_labor ?? 0;
                    const markedLabor = response[0]?.marked_labor ?? 0;
                    const remainingLabor = response[0]?.remaining_labor ?? 0;
                    const varianceLabor = response[0]?.variance_labor ?? 0;

                    that.MarkingPopupModel.setProperty("/plannedLabor", Math.round(plannedLabor));
                    that.MarkingPopupModel.setProperty("/uom_planned_labor", response[0].uom_planned_labor || "hcn");
                    that.MarkingPopupModel.setProperty("/markedLabor", Math.round(markedLabor));
                    that.MarkingPopupModel.setProperty("/uom_marked_labor", response[0].uom_marked_labor || "hcn");
                    that.MarkingPopupModel.setProperty("/remainingLabor", Math.round(remainingLabor));
                    that.MarkingPopupModel.setProperty("/uom_remaining_labor", response[0].uom_remaining_labor || "hcn");
                    that.MarkingPopupModel.setProperty("/varianceLabor", Math.round(varianceLabor));
                    that.MarkingPopupModel.setProperty("/uom_variance", response[0].uom_variance || "hcn");
                }
            };
            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },

        onRetrievePersonnelNumber: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathPersonnelNumberApi = "/api/getPersonnelNumber";
            let url = BaseProxyURL + pathPersonnelNumberApi;

            let plant = infoModel.getProperty("/plant") || "";
            let userId = infoModel.getProperty("/user_id") || "";

            let params = {
                plant: plant,
                userId: userId
            };

            // Callback di successo
            var successCallback = function (response) {
                that.MarkingPopupModel.setProperty("/personnelNumber", response || "");
            };

            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },

        onGetReasonsForVariance: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathReasonForVarianceApi = "/db/getReasonsForVariance";
            let url = BaseProxyURL + pathReasonForVarianceApi;

            let params = {};

            // Callback di successo
            var successCallback = function (response) {
                var oModel = new JSONModel();
                oModel.setProperty("/rows", response);
                that.getView().setModel(oModel, "varianceModel");;
            };

            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },

        onVarianceButtonPressed: function (oEvent) {
            var that = this;

            if (!that._oVariancePopover) {
                that._oTable = new sap.m.Table("varianceTable", {
                    mode: "SingleSelectMaster",
                    columns: [
                        new sap.m.Column({ header: new sap.m.Label({ text: "Plant" }) }),
                        new sap.m.Column({ header: new sap.m.Label({ text: "Cause" }) }),
                        new sap.m.Column({ header: new sap.m.Label({ text: "Description" }) }),
                        new sap.m.Column({ header: new sap.m.Label({ text: "Notes" }) })
                    ],
                    items: {
                        path: "varianceModel>/rows",
                        template: new sap.m.ColumnListItem({
                            cells: [
                                new sap.m.Text({ text: "{varianceModel>plant}" }),
                                new sap.m.Text({ text: "{varianceModel>cause}" }),
                                new sap.m.Text({ text: "{varianceModel>description}" }),
                                new sap.m.Text({ text: "{varianceModel>notes}" })
                            ]
                        })
                    },
                    selectionChange: function (oEvent) {
                        var oSelectedItem = oEvent.getParameter("listItem");
                        var oContext = oSelectedItem.getBindingContext("varianceModel");
                        that._selectedCause = oContext.getProperty("cause");
                        that._selectedDescription = oContext.getProperty("description");
                        that._oConfirmButton.setEnabled(true);
                    }
                });

                that._oVariancePopover = new sap.m.Popover({
                    showHeader: false,
                    placement: "Right",
                    contentWidth: "600px",
                    contentHeight: "300px",
                    content: [
                        new sap.m.SearchField({
                            placeholder: "Search description...",
                            liveChange: function (oEvent) {
                                var sQuery = oEvent.getParameter("newValue");
                                var oTable = that._oTable;
                                var oBinding = oTable.getBinding("items");
                                var aFilters = [];

                                if (sQuery) {
                                    var oFilter = new sap.ui.model.Filter(
                                        "description",
                                        sap.ui.model.FilterOperator.Contains,
                                        sQuery
                                    );
                                    aFilters.push(oFilter);
                                }

                                oBinding.filter(aFilters);
                            }
                        }),
                        that._oTable

                    ],
                    footer: new sap.m.Toolbar({
                        content: [
                            new sap.m.Button({
                                text: "Confirm",
                                enabled: false,
                                press: function () {
                                    that.onConfirmVarianceSelection();
                                }
                            }),
                            new sap.m.Button({
                                text: "Cancel",
                                press: function () {
                                    that.getView().byId("selectedVarianceText").setText("");
                                }
                            }),
                            new sap.m.Button({
                                text: "Close",
                                press: function () {
                                    that._oVariancePopover.close();
                                }
                            })
                        ]
                    })
                });

                that.getView().addDependent(that._oVariancePopover);
                that._oConfirmButton = that._oVariancePopover.getFooter().getContent()[0];
            }

            that._oConfirmButton.setEnabled(false);
            that._selectedCause = null;
            that._selectedDescription = null;

            that.onGetReasonsForVariance();
            that._oVariancePopover.openBy(oEvent.getSource());
        },

        onConfirmVarianceSelection: function () {
            var that = this;
            var varianceSelection;

            if (that._selectedCause && that._selectedDescription) {
                varianceSelection = that._selectedCause;
                that.getView().byId("selectedVarianceText").setText(that._selectedDescription);

                that._oVariancePopover.close();
            } else {
                varianceSelection = "";
                sap.m.MessageToast.show("No reason selected.");
            }

            return varianceSelection;
        },
        onUpdateButtonPressed: function (oEvent) {
            var that = this;

            if (!that._oUpdatePopover) {
                that._oTable = new sap.m.Table("updateTable", {
                    mode: "SingleSelectMaster",
                    columns: [
                        new sap.m.Column({ header: new sap.m.Label({ text: "Progressive Eco" }) }),
                        new sap.m.Column({ header: new sap.m.Label({ text: "Process Id" }) }),
                        new sap.m.Column({ header: new sap.m.Label({ text: "Flux Type" }) }),
                        new sap.m.Column({ header: new sap.m.Label({ text: "Type Modification" }) })
                    ],
                    items: {
                        path: "updateModel>/rows",
                        template: new sap.m.ColumnListItem({
                            cells: [
                                new sap.m.Text({ text: "{updateModel>prog_eco}" }),
                                new sap.m.Text({ text: "{updateModel>process_id}" }),
                                new sap.m.Text({ text: "{updateModel>flux_type}" }),
                                new sap.m.Text({ text: "{updateModel>type}" })
                            ]
                        })
                    },
                    selectionChange: function (oEvent) {
                        var oSelectedItem = oEvent.getParameter("listItem");
                        var oContext = oSelectedItem.getBindingContext("updateModel");
                        that._selectedProgEco = oContext.getProperty("prog_eco");
                        that._selectedProcessId = oContext.getProperty("process_id");
                        that._selectedFluxType = oContext.getProperty("flux_type");
                        that._selectedTypeModification = oContext.getProperty("type");
                        that._oConfirmUpdateButton.setEnabled(true);
                    }
                });

                that._oUpdatePopover = new sap.m.Popover({
                    showHeader: false,
                    placement: "Right",
                    contentWidth: "600px",
                    contentHeight: "300px",
                    content: [
                        new sap.m.SearchField({
                            placeholder: "Search description...",
                            liveChange: function (oEvent) {
                                var sQuery = oEvent.getParameter("newValue");
                                var oTable = that._oTable;
                                var oBinding = oTable.getBinding("items");
                                var aFilters = [];

                                if (sQuery) {
                                    var oFilter = new sap.ui.model.Filter(
                                        "description",
                                        sap.ui.model.FilterOperator.Contains,
                                        sQuery
                                    );
                                    aFilters.push(oFilter);
                                }

                                oBinding.filter(aFilters);
                            }
                        }),
                        that._oTable

                    ],
                    footer: new sap.m.Toolbar({
                        content: [
                            new sap.m.Button({
                                text: "Confirm",
                                enabled: false,
                                press: function () {
                                    that.onConfirmUpdateSelection();
                                }
                            }),
                            new sap.m.Button({
                                text: "Cancel",
                                press: function () {
                                    that.getView().byId("selectedUpdateText").setText("");
                                }
                            }),
                            new sap.m.Button({
                                text: "Close",
                                press: function () {
                                    that._oUpdatePopover.close();
                                }
                            })
                        ]
                    })
                });

                that.getView().addDependent(that._oUpdatePopover);
                that._oConfirmUpdateButton = that._oUpdatePopover.getFooter().getContent()[0];
            }

            that._oConfirmUpdateButton.setEnabled(false);
            that._selectedProgEco = null;
            that._selectedProcessId = null;
            that._selectedFluxType = null;
            that._selectedTypeModification = null;
            that.onGetUpdateTable();
            that._oUpdatePopover.openBy(oEvent.getSource());

        },
        onConfirmUpdateSelection: function () {
            var that = this;

            if (!!that._selectedProgEco ) {
                that.getView().byId("selectedUpdateText").setText(that._selectedProgEco);
                that._oUpdatePopover.close();
            } else if (!!that._selectedProcessId ){
                that.getView().byId("selectedUpdateText").setText(that._selectedProcessId);
                that._oUpdatePopover.close();
            } else {
                sap.m.MessageToast.show("No Modification selected.");
            }

        },
        onGetUpdateTable: function(){
            var that=this;
            var that = this;

            var infoModel = that.MainPODcontroller.getInfoModel();
            var sfc = infoModel.getProperty("/selectedSFC/sfc");
            var order = infoModel.getProperty("/selectedSFC/order");
            var plant = infoModel.getProperty("/plant");
            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathModificationApi = "/db/getModificationsBySfc";
            let url = BaseProxyURL + pathModificationApi;

            let params = {
                plant:plant,
                order:order,
                sfc:sfc
            };

            // Callback di successo
            var successCallback = function (response) {
                var oModel = new JSONModel();
                oModel.setProperty("/rows", response);
                that.getView().setModel(oModel, "updateModel");;
            };

            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        onHHInputChange: function(oEvent){
            var that=this;
            let value = oEvent.getParameters().value;
            let hhInput = that.getView().byId("hhInputId");
            if(value.length>2) hhInput.setValue(value.substring(0,2));
        },
        onMMInputChange: function(oEvent){
            var that=this;
            var that=this;
            let value = oEvent.getParameters().value;
            let mmInput = that.getView().byId("mmInputId");
            if(value.length>2) mmInput.setValue(value.substring(0,2));
        },
        sendToSapAndInsertIntoZTable: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();
            var sfc = infoModel.getProperty("/selectedSFC/sfc");
            var workCenter = infoModel.getProperty("/selectedSFC/WORKCENTER");
            var plant = infoModel.getProperty("/plant");
            var project = infoModel.getProperty("/selectedSFC/COMMESSA");
            var personnelNumber = that.MarkingPopupModel.getProperty("/personnelNumber") || "";
            var wbe_machine = that.MarkingPopupModel.getProperty("/wbe") || "";
            var operation = that.MarkingPopupModel.getProperty("/operation") || "";
            var operationDescription = that.MarkingPopupModel.getProperty("/operationDescription") || "";
            var mes_order = that.MarkingPopupModel.getProperty("/order") || "";
            var confirmation_number = that.MarkingPopupModel.getProperty("/confirmNumber") || "";
            var marking_date = that.getView().byId("markingDatePicker").getValue();
            var marked_labor;
            var uom_marked_labor = that.MarkingPopupModel.getProperty("/uom_marked_labor");
            var variance_labor;
            var uom_variance_labor = that.MarkingPopupModel.getProperty("/uom_variance");
            var reason_for_variance = that._selectedCause || "";
            var user_id = infoModel.getProperty("/user_id") || "";
            var modification = that.getView().byId("selectedUpdateText").getText() || "";
            var hh = parseInt(that.getView().byId("hhInputId").getValue(),10);
            var mm = parseInt(that.getView().byId("mmInputId").getValue(),10);
            var defectId = that.MarkingPopupModel.getProperty("/defectSelected")
            if(!hh) hh=0;
            if(!mm) mm=0;

            if (reason_for_variance == "") {
                marked_labor = Math.round( (hh + (mm/60)) * 100);
                variance_labor = 0;
            } else {
                variance_labor = Math.round( (hh + (mm/60)) * 100);
                marked_labor = 0;
            }

            let params = {
                plant: plant,
                sfc: sfc,
                workCenter: workCenter,
                project: project,
                personalNumber: personnelNumber,
                wbe_machine : wbe_machine,
                operation : operation,
                operationDescription: operationDescription,
                mes_order : mes_order,
                confirmation_number : confirmation_number,
                marking_date : marking_date,
                marked_labor : marked_labor,
                uom_marked_labor : uom_marked_labor,
                variance_labor : variance_labor,
                uom_variance_labor : uom_variance_labor,
                reason_for_variance : reason_for_variance,
                user_id : user_id,
                confirmation: "X",
                cancellation: "",
                modification: modification,
                cancellationFlag: false,
                cancelled_confirmation: null,
                defectId: defectId != "" ? defectId : null
            }

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathSendMarkingApi = "/api/sendMarkingToSapAndUpdateZTable";
            let url = BaseProxyURL + pathSendMarkingApi;

            // Callback di successo
            var successCallback = function (response) {
                that.MainPODcontroller.showToast(that.MainPODcontroller.getI18n("marking.success.message"));
                that.onClosePopup();
            };

            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
                that.MainPODcontroller.showErrorMessageBox(that.MainPODcontroller.getI18n("marking.saveData.error.message"));
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that,true,true);
        },

        validate: function () {
            var that = this;
            var sMarkingDate = that.getView().byId("markingDatePicker").getValue();
            var hhInputValue = that.getView().byId("hhInputId").getValue();
            var mmInputValue = that.getView().byId("mmInputId").getValue();

            if (!sMarkingDate) {
                return false;
            }

            if( (hhInputValue == "" && mmInputValue=="") || (parseInt(hhInputValue,10)==0 && parseInt(mmInputValue,10)==0) ){
                return false;
            } else if( (parseInt(hhInputValue,10)==0 && mmInputValue=="") || (hhInputValue=="" && parseInt(mmInputValue,10)==0) ){
                return false;
            }else if(hhInputValue==""){
                hhInputValue="00";
            } else if (mmInputValue==""){
                mmInputValue="00";
            }
            if(parseInt(mmInputValue,10)<0 || parseInt(mmInputValue,10)>59) return false;


            // function convertToDate(dateStr) {
            //     let parts = dateStr.split("/");
            //     return new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
            // }
            // let markingDate = convertToDate(sMarkingDate);
            // let today = new Date();
            // if (markingDate > today) {
            //     return false;
            // }
            // let dayMarking = sMarkingDate.split("/")[0];
            // let monthsMarking = sMarkingDate.split("/")[1];
            // let yearMarking = sMarkingDate.split("/")[2];
            // let comparingDate = new Date();
            // //Data attuale con il primo giorno del mese
            // comparingDate.setDate(1);
            // if(today.getDate()<=2){
            //     comparingDate.setMonth(monthsMarking-1);
            // }
            // comparingDate.setHours(0,0,0,0);
            // if(markingDate<comparingDate) return false;

            let confirmation_number = that.MarkingPopupModel.getProperty("/confirmNumber");
            let personnelNumber = that.MarkingPopupModel.getProperty("/personnelNumber");
            if(!confirmation_number || !personnelNumber) return false;

            let reason_for_variance = that._selectedCause || "";
            let modification = that.getView().byId("selectedUpdateText").getText() || "";
            if(!reason_for_variance && !!modification) return false;

            
            return true;
        },
        
        searchDefects: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathGetMarkingDataApi = "/api/nonconformance/v2/nonconformances";
            let url = BaseProxyURL + pathGetMarkingDataApi;

            var routing = infoModel.getProperty("/selectedSFC/routing/routing");
            var sfc = infoModel.getProperty("/selectedSFC/sfc");
            var plant = infoModel.getProperty("/plant");
            var routingStepId = that.markOperation.stepId;

            url += "?routing=" + routing;
            url += "&sfc=" + sfc;
            url += "&plant=" + plant;
            url += "&routingStepId=" + routingStepId;

            let params = {
            };

            // Callback di successo
            var successCallback = function (response) {
                if (response.defectResponse && response.defectResponse.content) {
                    that.getZDefects(response.defectResponse.content);
                }
            };
            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata GET fallita: ", error);
            };
            CommonCallManager.callProxy("GET", url, params, true, successCallback, errorCallback, that);
        },
        getZDefects: function (defects) {
            var that=this;
            var infoModel = that.MainPODcontroller.getInfoModel();
            var plant = infoModel.getProperty("/plant");

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathOrderBomApi = "/db/selectZDefect";
            let url = BaseProxyURL+pathOrderBomApi; 

            var listDefect = [];
            defects.forEach(element => {
                listDefect.push(element.id)
            });

            let params={
                listDefect: listDefect,
                plant: plant
            };

            // Callback di successo
            var successCallback = function(response) {
                that.MarkingPopupModel.setProperty("/defects", response);
            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata POST fallita:", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        onChangeDefect: function (oEvent) {
            var that = this;
            var variance = this.MarkingPopupModel.getProperty("/defects").filter(item => item.id = this.MarkingPopupModel.getProperty("/defectSelected"))[0].variance
            that.MarkingPopupModel.setProperty("/variance", variance);
        },
        onConfirm: function () {
            var that = this;

            if (that.validate()) {
                that.sendToSapAndInsertIntoZTable();
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