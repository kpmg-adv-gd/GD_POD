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
            
            that.loadHeaderData();
            that.clearData();
            //that.getOrder(); - chiedi a Vale
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
                title: "",
                numDefect: 0,
                description: "",
                codeGroup: "",
                defectType: "",
                priority: "",
                variance: "",
                time: 0,
                blocking: false,
                createQN: false,
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
            that.OpenDefectModel.setProperty("/material", material);

        },

        getOrder: function () {
            var that = this;
            var infoModel = that.MainPODcontroller.getInfoModel();

            var routing = infoModel.getProperty("/selectedSFC/routing/routing");
            var type = infoModel.getProperty("/selectedSFC/routing/type");
            var plant = infoModel.getProperty("/plant");
            
            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathGetMarkingDataApi = "/api/routing/v1/routings/routingSteps";
            let url = BaseProxyURL + pathGetMarkingDataApi;

            let params = {
                plant: plant,
                routing: routing,
                type: type
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
            CommonCallManager.callProxy("POST", url, params, true, successCallback, errorCallback, that);

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
                    this.OpenDefectModel.setProperty("/codeGroups", response.groupResponse);
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
                    this.OpenDefectModel.setProperty("/defectTypes", filter);
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
                that.OpenDefectModel.setProperty("/priorities", response);
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
                that.OpenDefectModel.setProperty("/variances", response.filter(item => item.plant == plant));
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
                that.OpenDefectModel.setProperty("/codings", response);
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
                that.OpenDefectModel.setProperty("/responsibles", response);
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
                that.OpenDefectModel.setProperty("/notificationTypies", response);
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
                that.MainPODcontroller.showErrorMessageBox(that.MainPODcontroller.getI18n("openDefect.error.message"));
            }
        },

        uploadDocument: function (oEvent, response) {
            var that = this;
            var sResponse = oEvent.getParameter("response");
            var fileInfo = oEvent.oSource.oFileUpload.files[0];
            that.OpenDefectModel.setProperty("/defect/attachment", {
                "BASE_64": sResponse,
                "FILE_NAME": fileInfo.name,
                "FILE_TYPE": fileInfo.type
            });
        },

        validate: function () {
            var that = this;
            var defect = that.OpenDefectModel.getProperty("/defect");

            // Check sui campo obbligatori
            if (defect.numDefect == "" || defect.title == "" || defect.codeGroup == "" || defect.defectType == "" || defect.priority == "" 
                || defect.variance == "" || defect.notificationType == "") {
                    return false;
                }
            if (defect.createQN && (defect.coding == "" || defect.replaceInAssembly == "" || defect.responsible == "")) {
                return false;
            }

            // Check su Costraint della Priority
            try {
                var priority = JSON.parse(defect.priority);
                for (let chiave in priority) {
                    if (defect[chiave] != priority[chiave]) return false;
                }
            } catch (e) {
                console.log("errore nel parsing json Priority");
            }
            // Check su Costraint della Notification Type
            try {
                var notificationType = JSON.parse(defect.notificationType);
                for (let chiave in notificationType) {
                    if (defect[chiave] != notificationType[chiave]) return false;
                }
            } catch (e) {
                console.log("errore nel parsing json Notification Type");
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
            var stepId = infoModel.getProperty("/selectedSFC/steps/0/stepId")

            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathModificationApi = "/api/nonconformance/v1/log";
            let url = BaseProxyURL + pathModificationApi;

            let params = {
                code: defect.defectType,
                plant: plant,
                sfc: sfc,
                workcenter: wc,
                quantity: defect.quantity,
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
            
        },

        onClosePopup: function () {
            var that = this;
            that.closeDialog();
        }
    })
}
)