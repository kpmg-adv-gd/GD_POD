sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "../BaseController",
    "../../utilities/CommonCallManager",
    "../../utilities/GenericDialog"
], function (JSONModel, BaseController, CommonCallManager, Dialog) {
    "use strict";

    return Dialog.extend("kpmg.custom.pod.GDPodCustom.GDPodCustom.controller.popup.OpenDefectPopup", {

        open: function (oView, oController, selectedOp) {
            var that = this;
            that.OpenDefectModel = new JSONModel();
            that.MainPODcontroller = oController;
            that.selectedOp = selectedOp;

            that._initDialog("kpmg.custom.pod.GDPodCustom.GDPodCustom.view.popup.OpenDefectPopup", oView, that.OpenDefectModel);
            
            that.clearData();
            that.loadHeaderData();
            //that.getOrder(); 
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
            that.OpenDefectModel.setProperty("/defect", {
                material: "",
                prodOrder: "",
                assembly: "",
                numDefect: 1,
                title: "",
                description: "",
                codeGroup: "",
                defectType: "",
                priority: "",
                variance: "",
                time: 0,
                blocking: false,
                createQN: false,
                notificationType: "",
                coding: "",
                replaceInAssembly: 0,
                defectNote: "",
                responsible: "",
                time: "",
            });
        },
        loadHeaderData: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();

            const wbe = infoModel.getProperty("/selectedSFC/WBE") || "";
            const sfc = infoModel.getProperty("/selectedSFC/sfc") || "";
            const wc = infoModel.getProperty("/selectedSFC/WORKCENTER") || "";
            const material = infoModel.getProperty("/selectedSFC/material/material");

            that.OpenDefectModel.setProperty("/wbe", wbe);
            that.OpenDefectModel.setProperty("/sfc", sfc);
            that.OpenDefectModel.setProperty("/wc", wc);
            that.OpenDefectModel.setProperty("/defect/material", material);

        },

        getOrder: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();

            var routing = infoModel.getProperty("/selectedSFC/routing/routing");
            var type = infoModel.getProperty("/selectedSFC/routing/type");
            var plant = infoModel.getProperty("/plant");
            var stepId = that.selectedOp.stepId;
            
            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathGetMarkingDataApi = "/api/routing/v1/routings/routingSteps";
            let url = BaseProxyURL + pathGetMarkingDataApi;

            let params = {
                plant: plant,
                routing: routing,
                type: type,
                stepId: stepId
            };

            // Callback di successo
            var successCallback = function (response) {
                if (response.length > 0) {
                    that.getCustomOrder();
                }
            };
            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("GET", url, params, true, successCallback, errorCallback, that);

        },
        getCustomOrder: function (order) {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();

            var plant = infoModel.getProperty("/plant");
            
            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathGetMarkingDataApi = "/api/order/v1/orders";
            let url = BaseProxyURL + pathGetMarkingDataApi;

            let params = {
                plant: plant,
                order: order
            };

            // Callback di successo
            var successCallback = function (response) {
                if (response.length > 0) {
                    
                }
            };
            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
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
            } else {
                that.MainPODcontroller.showErrorMessageBox(that.MainPODcontroller.getI18n("defect.error.message"));
            }
        },

        uploadDocument: function(oEvent) {
            var that = this;
            const aFiles = oEvent.getParameter("files");
        
            if (aFiles && aFiles.length > 0) {
                const oFile = aFiles[0]; // Prendiamo solo il primo file
                const reader = new FileReader();
        
                reader.onload = function(e) {
                    const base64String = e.target.result.split(",")[1]; // Rimuove il prefix "data:*/*;base64,"
    
                    that.OpenDefectModel.setProperty("/defect/attachment", {
                        "BASE_64": base64String,
                        "FILE_NAME": oFile.name,
                        "FILE_TYPE": oFile.type
                    });
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
                    return false;
                }
            if (defect.createQN && (defect.coding == "" || (defect.replaceInAssembly != 0 && defect.replaceInAssembly != 1) || defect.responsible == "")) {
                return false;
            }

            // Check su Costraint della Priority
            try {
                var priorityScript = JSON.parse(that.OpenDefectModel.getProperty("/priorities").filter(item => item.priority == defect.priority)[0].costraints);
                for (let chiave in priorityScript) {
                    if (defect[chiave] != priorityScript[chiave]) return false;
                }
            } catch (e) {
                console.log("errore nel parsing json Priority");
            }
            // Check su Costraint della Notification Type
            if (defect.createQN) {
                try {
                    var notificationTypeScript = JSON.parse(that.OpenDefectModel.getProperty("/notificationTypies").filter(item => item.notification_type == defect.notificationType)[0].costraints);
                    for (let chiave in notificationTypeScript) {
                        if (defect[chiave] != notificationTypeScript[chiave]) return false;
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
            if (defect.attachment != undefined) {
                params.files = {
                    fileContent: defect.attachment.BASE_64,
                    fileMediaType: defect.attachment.FILE_TYPE,
                    fileName: defect.attachment.FILE_NAME,
                }
            }

            // Callback di successo
            var successCallback = function (response) {
                // Se il salvataggio da API standard è andato a buon fine, procedo salvando nella z_defects
                that.saveZDefects(response.ids[0].ids[0]);
            };

            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);
        },
        saveZDefects: function (idDefect) {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();
            var defect = that.OpenDefectModel.getProperty("/defect");
            var sfc = infoModel.getProperty("/selectedSFC/sfc") || "";

            let params = {
                idDefect: idDefect,
                material: defect.material,
                mesOrder: "todo domani",
                assembly: defect.assembly,
                title: defect.title,
                description : defect.description,
                priority : defect.priority,
                variance: defect.variance,
                blocking : defect.blocking,
                createQN : defect.createQN,
                sfc: sfc,
            }
            if (defect.createQN) {
                params.notificationType = defect.notificationType;
                params.coding = defect.coding;
                params.replaceInAssembly = defect.replaceInAssembly == 0;
                params.defectNote = defect.defectNote;
                params.responsible = defect.responsible;
                params.time = defect.time != "" ? defect.time : null;
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
            };

            // Callback di errore
            var errorCallback = function (error) {
                console.log("Chiamata POST fallita: ", error);
                that.MainPODcontroller.showErrorMessageBox(that.MainPODcontroller.getI18n("defect.saveData.error.message"));
            };
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that,true,true);
        },

        onClosePopup: function () {
            var that = this;
            that.closeDialog();
        }
    })
}
)