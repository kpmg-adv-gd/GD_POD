sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "../BaseController",
    "../../utilities/CommonCallManager",
    "../../utilities/GenericDialog"
], function (JSONModel, BaseController, CommonCallManager, Dialog) {
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
            that.onGetShift();
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
                    that.MarkingPopupModel.setProperty("/plannedLabor", response[0].planned_labor || "0");
                    that.MarkingPopupModel.setProperty("/uom_planned_labor", response[0].uom_planned_labor || "hcn");
                    that.MarkingPopupModel.setProperty("/markedLabor", response[0].marked_labor || "0");
                    that.MarkingPopupModel.setProperty("/uom_marked_labor", response[0].uom_marked_labor || "hcn");
                    that.MarkingPopupModel.setProperty("/remainingLabor", response[0].remaining_labor || "0");
                    that.MarkingPopupModel.setProperty("/uom_remaining_labor", response[0].uom_remaining_labor || "hcn");
                    that.MarkingPopupModel.setProperty("/varianceLabor", response[0].variance_labor || "0");
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

        onGetShift: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathShiftApi = "/api/shift/getShiftDetails";
            let url = BaseProxyURL + pathShiftApi;

            let plant = infoModel.getProperty("/plant") || "";
            let resource = that.markOperation.RESOURCE || "";

            let params = {
                plant: plant,
                resource: resource
            };

            // Callback di successo
            var successCallback = function (response) {
                that.MarkingPopupModel.setProperty("/shift", response);
            };

            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },

        insertOpConfirmation: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();

            var wbe_machine = that.MarkingPopupModel.getProperty("/wbe") || "";
            var operation = that.MarkingPopupModel.getProperty("/operation") || "";
            var mes_order = that.MarkingPopupModel.getProperty("/order") || "";
            var confirmation_number = that.MarkingPopupModel.getProperty("/confirmNumber") || "";
            var marking_date = that.getView().byId("markingDatePicker").getValue();
            var start_time = that.getView().byId("startTimePicker").getValue();
            var finish_time = that.getView().byId("finishTimePicker").getValue();
            var marked_labor;
            var uom_marked_labor = that.MarkingPopupModel.getProperty("/uom_marked_labor");
            var variance_labor;
            var uom_variance_labor = that.MarkingPopupModel.getProperty("/uom_variance");
            var reason_for_variance = that._selectedCause || "";
            var user_id = infoModel.getProperty("/user_id") || "";
            var shiftData = that.MarkingPopupModel.getProperty("/shift");

            if (!shiftData) {
                console.error("Errore: Nessun shift data trovato");
                return;
            }

            if (reason_for_variance == "") {
                marked_labor = that.calculateLabor(marking_date, start_time, finish_time, shiftData);
                variance_labor = "0";
            } else {
                variance_labor = that.calculateLabor(marking_date, start_time, finish_time, shiftData); 
                marked_labor = "0";
            }

            let params = {
                wbe_machine : wbe_machine,
                operation : operation,
                mes_order : mes_order,
                confirmation_number : confirmation_number,
                marking_date : marking_date,
                start_time : start_time,
                finish_time : finish_time,
                marked_labor : marked_labor,
                uom_marked_labor : uom_marked_labor,
                variance_labor : variance_labor,
                uom_variance_labor : uom_variance_labor,
                reason_for_variance : reason_for_variance,
                user_id : user_id
            }

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathInsertConfirmationApi = "/db/insertOpConfirmation";
            let url = BaseProxyURL + pathInsertConfirmationApi;

            // Callback di successo
            var successCallback = function (response) {
                that.MainPODcontroller.showToast(that.MainPODcontroller.getI18n("marking.success.message"));
                that.updateMarkingRecap();
                that.onClosePopup();
            };

            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
                that.MainPODcontroller.showErrorMessageBox(that.MainPODcontroller.getI18n("marking.saveData.error.message"));
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },

        updateMarkingRecap: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathUpdateMarkingApi = "/db/updateMarkingRecap";
            let url = BaseProxyURL + pathUpdateMarkingApi;

            let confirmation_number = that.MarkingPopupModel.getProperty("/confirmNumber");

            let params = {
                confirmation_number: confirmation_number
            };

            // Callback di successo
            var successCallback = function (response) {
            };

            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },

        validate: function () {
            var that = this;
            var sMarkingDate = that.getView().byId("markingDatePicker").getValue();
            var sStartTime = that.getView().byId("startTimePicker").getValue();
            var sFinishTime = that.getView().byId("finishTimePicker").getValue();

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

        calculateLabor: function (markingDate, startTime, finishTime, shiftData) {
            var that = this;

            if (!markingDate || !startTime || !finishTime || !shiftData) {
                console.error("Dati insufficienti per il calcolo del marked labor.");
                return 0;
            }

            let dateParts = markingDate.split("/");
            let formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`; // yyyy-mm-dd
            let dateObject = new Date(formattedDate);

            let dayOfWeek = dateObject.toLocaleDateString("en-US", { weekday: "long" }).toLowerCase();

            let dayOverrideKey = dayOfWeek + "Override";
            let shiftBreaks = shiftData.intervals[0][dayOverrideKey]?.shiftDefinitionBreaks || [];

            console.log("Giorno rilevato:", dayOfWeek);
            console.log("Pausa per", dayOfWeek, ":", shiftBreaks);

            function timeToSeconds(time) {
                let parts = time.split(":").map(Number);
                return parts[0] * 3600 + parts[1] * 60;
            }

            let startSeconds = timeToSeconds(startTime);
            let finishSeconds = timeToSeconds(finishTime);
            let totalWorkedSeconds = finishSeconds - startSeconds;

            shiftBreaks.forEach((breakPeriod) => {
                let breakStart = timeToSeconds(breakPeriod.beginTime);
                let breakEnd = timeToSeconds(breakPeriod.endTime);

                if (startSeconds < breakEnd && finishSeconds > breakStart) {
                    let breakDuration = Math.min(finishSeconds, breakEnd) - Math.max(startSeconds, breakStart);
                    totalWorkedSeconds -= breakDuration;
                    console.log("Break sottratto:", breakDuration / 3600, "ore");
                }
            });

            let markedLabor = (totalWorkedSeconds / 3600) * 100;
            console.log("Marked Labor:", markedLabor, "HCN");

            return markedLabor;
        },

        onConfirm: function () {
            var that = this;

            if (that.validate()) {
                that.insertOpConfirmation();
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