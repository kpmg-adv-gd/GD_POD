sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "../BaseController",
    "../../utilities/CommonCallManager",
    "../../utilities/GenericDialog"
], function (JSONModel, BaseController, CommonCallManager, Dialog) {
    "use strict";

    return Dialog.extend("kpmg.custom.pod.GDPodCustom.GDPodCustom.controller.popup.OpenDefectPopup", {
        ID: 0,
        open: function (oView, oController, selectedOp) {
            var that = this;
            that.OpenDefectModel = new JSONModel();
            that.MainPODcontroller = oController;
            that.selectedOp = selectedOp;

            that._initDialog("kpmg.custom.pod.GDPodCustom.GDPodCustom.view.popup.OpenDefectPopup", oView, that.OpenDefectModel);
            
            that.clearData();
            that.loadHeaderData();
            that.getCodeGroups();
            that.getPriority();
            that.getCoding();
            that.getNotificationType();
            that.getResponsible();
            that.getVariance();
            
            that.openDialog();
        },

        clearData: function () {
            var that = this;
            var selectedSFC = that.MainPODcontroller.getInfoModel().getProperty("/selectedSFC/");
            var user = that.MainPODcontroller.getInfoModel().getProperty("/user_id");

            that.OpenDefectModel.setProperty("/defect", {
                material: "",
                assembly: "",
                numDefect: 1,
                title: "",
                description: user,
                codeGroup: "",
                defectType: "",
                priority: "",
                variance: "",
                blocking: false,
                createQN: false,
                notificationType: "",
                coding: "",
                replaceInAssembly: 0,
                defectNote: "",
                responsible: "",
                attachments: [],
            });
         //   that.getView().byId("attachID").clear();

        },
        loadHeaderData: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();
            var selectedSFC = that.MainPODcontroller.getInfoModel().getProperty("/selectedSFC/");

            const wbe = infoModel.getProperty("/selectedSFC/WBE") || "";
            const sfc = infoModel.getProperty("/selectedSFC/sfc") || "";
            const wc = infoModel.getProperty("/selectedSFC/WORKCENTER") || "";
            const material = infoModel.getProperty("/selectedSFC/material/material");

            that.OpenDefectModel.setProperty("/wbe", wbe);
            that.OpenDefectModel.setProperty("/sfc", sfc);
            that.OpenDefectModel.setProperty("/wc", wc);
            that.OpenDefectModel.setProperty("/defect/material", material);

            try {
                var order = this.selectedOp.routingOperation.customValues.filter(custom => custom.attribute == "ORDER")[0].value;
                var splitMaterial = that.selectedOp.routingOperation.operationActivity.operationActivity.split("_");
                that.OpenDefectModel.setProperty("/defect/material", splitMaterial[1]);
                that.getOrder(order);
            } catch (e) {
                console.log("Materiale o Ordine non trovato");
            }

        },

        getOrder: function (order) {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();

            var plant = infoModel.getProperty("/plant");
            
            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathGetMarkingDataApi = "/api/order/v1/orders";
            let url = BaseProxyURL + pathGetMarkingDataApi;
            url += "?plant=" + plant;
            url += "&order=" + order;

            let params = {
            };

            // Callback di successo
            var successCallback = function (response) {
                if (response.orderResponse && response.orderResponse.bom) {
                    if (response.orderResponse.customValues.filter(custom => custom.attribute == "ORDER_TYPE").length > 0 
                        && response.orderResponse.customValues.filter(custom => custom.attribute == "ORDER_TYPE")[0].value == "GRPF") {
                            that.OpenDefectModel.setProperty("/defect/typeOrder", "Purchase Doc.");
                            that.OpenDefectModel.setProperty("/defect/prodOrder", response.orderResponse.customValues.filter(custom => custom.attribute == "PURCHASE_ORDER")[0].value);
                        }else{
                            that.OpenDefectModel.setProperty("/defect/typeOrder", "Prod. Order");
                            that.OpenDefectModel.setProperty("/defect/prodOrder", order);
                        }
                }
                that.getAssemblies(response.orderResponse.bom.bom, response.orderResponse.bom.type);
            };
            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata GET fallita: ", error);
            };
            CommonCallManager.callProxy("GET", url, params, true, successCallback, errorCallback, that);

        },
        getCodeGroups: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();
            var plant = infoModel.getProperty("/plant");
            
            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathGetMarkingDataApi = "/api/nonconformancegroup/v1/nonconformancegroups?plant=" + plant;
            let url = BaseProxyURL + pathGetMarkingDataApi;

            let params = {
                
            };

            // Callback di successo
            var successCallback = function (response) {
                if (response.groupResponse) {
                    this.OpenDefectModel.setProperty("/codeGroups", [...[{group: "", description: ""}], ...response.groupResponse]);
                }
            };
            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata GET fallita: ", error);
            };
            CommonCallManager.callProxy("GET", url, params, true, successCallback, errorCallback, that);
        },
        onChangeCodeGroup: function (oEvent) {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();
            var plant = infoModel.getProperty("/plant");
            var group = that.OpenDefectModel.getProperty("/defect/codeGroup");
            
            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathGetMarkingDataApi = "/api/nonconformancecode/v1/nonconformancecodes?plant=" + plant;
            let url = BaseProxyURL + pathGetMarkingDataApi;

            let params = {
            };

            // Callback di successo
            var successCallback = function (response) {
                if (response.codeResponse) {
                    var filter = response.codeResponse.filter(item => item.status == "ENABLED" && item.groups.filter(mc => mc.group == group).length > 0);
                    this.OpenDefectModel.setProperty("/defectTypes", [...[{code: "", description: ""}], ...filter]);

                }
            };
            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata GET fallita: ", error);
            };
            CommonCallManager.callProxy("GET", url, params, true, successCallback, errorCallback, that);
        },
        getAssemblies: function (bom, type) {
            var that = this;

            var infoModel = that.MainPODcontroller.getInfoModel();
            
            var plant = infoModel.getProperty("/plant");

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathGetMarkingDataApi = "/api/bom/v1/boms";
            let url = BaseProxyURL + pathGetMarkingDataApi;
            url += "?plant=" + plant;
            url += "&bom=" + bom;
            url += "&type=" + type;

            // Callback di successo
            var successCallback = function (response) {
                this.OpenDefectModel.setProperty("/assemblies", [...[{material: {material: ""}}], ...response.bomResponse[0].components]);
            };
            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata GET fallita: ", error);
            };
            CommonCallManager.callProxy("GET", url, {}, true, successCallback, errorCallback, that);
        },
        getPriority: function () {
            var that = this;

            var infoModel = that.MainPODcontroller.getInfoModel();
            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathGetMarkingDataApi = "/db/getZPriorityData";
            let url = BaseProxyURL + pathGetMarkingDataApi;

            let params = { };

            // Callback di successo
            var successCallback = function (response) {
                this.OpenDefectModel.setProperty("/priorities", [...[{priority: "", description: ""}], ...response]);
            };
            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        getVariance: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();
            var plant = infoModel.getProperty("/plant");

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathReasonForVarianceApi = "/db/getReasonsForVariance";
            let url = BaseProxyURL + pathReasonForVarianceApi;

            let params = {};

            // Callback di successo
            var successCallback = function (response) {
                this.OpenDefectModel.setProperty("/variances", [...[{cause: "", description: ""}], ...response.filter(item => item.plant == plant)]);
            };

            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        getCoding: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathReasonForVarianceApi = "/db/getZCodingData";
            let url = BaseProxyURL + pathReasonForVarianceApi;

            let params = {};

            // Callback di successo
            var successCallback = function (response) {
                this.OpenDefectModel.setProperty("/codings", [...[{coding: "", coding_description: ""}], ...response]);
            };

            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        getResponsible: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathReasonForVarianceApi = "/db/getZResponsibleData";
            let url = BaseProxyURL + pathReasonForVarianceApi;

            let params = {};

            // Callback di successo
            var successCallback = function (response) {
                this.OpenDefectModel.setProperty("/responsibles", [...[{id: ""}], ...response]);
            };

            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        getNotificationType: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathReasonForVarianceApi = "/db/getZNotificationTypeData";
            let url = BaseProxyURL + pathReasonForVarianceApi;

            let params = {};

            // Callback di successo
            var successCallback = function (response) {
                this.OpenDefectModel.setProperty("/notificationTypies", [...[{notification_type: "", description: ""}], ...response]);
            };

            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },



        onConfirm: function () {
            var that = this;

            if (that.validate()) {
                that.openDefect();
            }
        },

        popAllegaPress: function (oEvent) {
            var that = this;
            var oDialog = that.getView().byId("uploadDialog");
            oDialog.open();
        },

        deleteAttachment: function (oEvent) {
            var that = this;
            var idDeleted = oEvent.getSource().getBindingContext().getObject().ID;
            that.OpenDefectModel.setProperty("/defect/attachments", that.OpenDefectModel.getProperty("/defect/attachments").filter(item => item.ID != idDeleted))
        },
        handleUploadPress: function (oEvent) {
            var that = this;
            var oFileUploader = that.getView().byId("attachID");
            oFileUploader.upload();
            oFileUploader.clear();
            var oDialog = that.getView().byId("uploadDialog");
            oDialog.close();
        },

        uploadDocument: function(oEvent) {
            var that = this;
            const aFiles = oEvent.getParameter("files");
        
            if (aFiles && aFiles.length > 0) {
                const oFile = aFiles[0]; // Prendiamo solo il primo file
                const reader = new FileReader();
        
                reader.onload = function(e) {
                    const base64String = e.target.result.split(",")[1]; // Rimuove il prefix "data:*/*;base64,"
    
                    that.OpenDefectModel.getProperty("/defect/attachments").push({
                        "ID": that.ID,
                        "BASE_64": base64String,
                        "FILE_NAME": oFile.name,
                        "FILE_TYPE": oFile.type
                    });
                    that.OpenDefectModel.refresh();
                    that.ID++;
                    var oFileUploader = that.getView().byId("attachID");
                    oFileUploader.clear();
                };
        
                reader.onerror = function(err) {
                    console.error("Errore nella lettura del file:", err);
                };
        
                reader.readAsDataURL(oFile); 
            }
        },

        validate: function () {
            var that = this;
            var defect = that.OpenDefectModel.getProperty("/defect");

            // Check sui campo obbligatori
            if (defect.numDefect == "" || defect.title == "" || defect.codeGroup == "" || defect.defectType == "" || defect.priority == "" 
                || defect.variance == "") {
                    that.MainPODcontroller.showErrorMessageBox(that.MainPODcontroller.getI18n("defect.error.message"));
                    return false;
                }
            if (defect.createQN && (defect.coding == "" || (defect.replaceInAssembly != 0 && defect.replaceInAssembly != 1) || defect.responsible == "")) {
                that.MainPODcontroller.showErrorMessageBox(that.MainPODcontroller.getI18n("defect.error.message"));
                return false;
            }

            // Check su Costraint della Priority
            try {
                var priorityScript = JSON.parse(that.OpenDefectModel.getProperty("/priorities").filter(item => item.priority == defect.priority)[0].costraints);
                for (let chiave in priorityScript) {
                    for (let key in priorityScript[chiave]) {
                        if (priorityScript[chiave][key] && defect[key] == "") {
                            that.MainPODcontroller.showErrorMessageBox("Error Priority to field " + key);
                            return false;
                        }
                    }
                }
            } catch (e) {
                console.log("errore nel parsing json Priority");
            }
            // Check su Costraint della Notification Type
            if (defect.createQN) {
                try {
                    var notificationTypeScript = JSON.parse(that.OpenDefectModel.getProperty("/notificationTypies").filter(item => item.notification_type == defect.notificationType)[0].costraints);
                    for (let chiave in notificationTypeScript) {
                        for (let key in notificationTypeScript[chiave]) {
                            if (notificationTypeScript[chiave][key] && defect[key] == "") {
                                that.MainPODcontroller.showErrorMessageBox("Error Notification Type to field " + key);
                                return false;
                            }
                        }
                    }
                } catch (e) {
                    console.log("errore nel parsing json Notification Type");
                }
            }

            return true;

        },

        openDefect: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();
            var defect = that.OpenDefectModel.getProperty("/defect");

            var plant = infoModel.getProperty("/plant");
            var sfc = infoModel.getProperty("/selectedSFC/sfc") || "";
            var wc = infoModel.getProperty("/selectedSFC/WORKCENTER") || "";
            var stepId = that.selectedOp.stepId;

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathModificationApi = "/api/nonconformance/v1/log";
            let url = BaseProxyURL + pathModificationApi;

            let params = {
                code: defect.defectType,
                plant: plant,
                sfc: sfc,
                workcenter: wc,
                quantity: defect.numDefect,
                routingStepId: stepId,
                startSfcRequired: false,
                allowNotAssembledComponents: false
            };
            if (defect.attachments.length > 0) {
                params.files = [];
                defect.attachments.forEach(element => {
                    params.files.push({
                        fileContent: element.BASE_64,
                        fileMediaType: element.FILE_TYPE,
                        fileName: element.FILE_NAME
                    });
                });
            }

            // Callback di successo
            var successCallback = function (response) {
                // Se il salvataggio da API standard è andato a buon fine, procedo salvando nella z_defects
                that.saveZDefects(response.ids[0].ids[0]);
            };

            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
                that.MainPODcontroller.showErrorMessageBox(error);
                sap.ui.core.BusyIndicator.hide();
            };

            sap.ui.core.BusyIndicator.show(0);
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        saveZDefects: function (idDefect) {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();
            var defect = that.OpenDefectModel.getProperty("/defect");
            var sfc = infoModel.getProperty("/selectedSFC/sfc") || "";
            var user = infoModel.getProperty("/user_id");
            var plant = infoModel.getProperty("/plant");

            try {
                var operation = that.selectedOp.routingOperation.operationActivity.operationActivity;
            } catch (e) {
                var operation = "";
            }

            let params = {
                idDefect: idDefect,
                material: defect.material,
                mesOrder: defect.prodOrder,
                assembly: defect.assembly,
                title: defect.title,
                description : defect.description,
                priority : defect.priority,
                variance: defect.variance,
                blocking : defect.blocking,
                createQN : defect.createQN,
                sfc: sfc,
                user: user,
                operation: operation,
                plant: plant,
            }
            if (defect.createQN) {
                params.notificationType = defect.notificationType;
                params.coding = defect.coding;
                params.replaceInAssembly = defect.replaceInAssembly == 0;
                params.defectNote = defect.defectNote;
                params.responsible = defect.responsible;
            }

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathSendMarkingApi = "/db/insertDefect";
            let url = BaseProxyURL + pathSendMarkingApi;

            // Callback di successo
            var successCallback = function (response) {
                // publish difetti
                sap.ui.getCore().getEventBus().publish("defect", "loadDefect", null);
                that.MainPODcontroller.showToast(that.MainPODcontroller.getI18n("defect.success.message"));
                that.onClosePopup();
                sap.ui.core.BusyIndicator.hide();
            };

            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
                that.MainPODcontroller.showErrorMessageBox(that.MainPODcontroller.getI18n("defect.saveData.error.message"));
                sap.ui.core.BusyIndicator.hide();
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that,true,true);
        },

        onClosePopup: function () {
            var that = this;
            that.closeDialog();
        },

        
        toggleBusyIndicator: function () {
            var that = this;
            var busyState = that.treeTable.getBusy();
            that.treeTable.setBusy(!busyState);
        }
    })
}
)