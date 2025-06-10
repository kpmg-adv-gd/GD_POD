sap.ui.define([
    "sap/ui/model/json/JSONModel",
    "../BaseController",
    "../../utilities/CommonCallManager",
    "../../utilities/GenericDialog"
], function (JSONModel, BaseController, CommonCallManager, Dialog) {
    "use strict";

    return Dialog.extend("kpmg.custom.pod.GDPodCustom.GDPodCustom.controller.popup.ViewDefectPopup", {

        open: function (oView, oController, defect, defectStandard) {
            var that = this;
            that.ViewDefectModel = new JSONModel();
            that.MainPODcontroller = oController;
            that.defectSelected = defect;
            that.defectSelected.modifiedDateTime = defectStandard.modifiedDateTime;
            that.defectSelected.state = defectStandard.state;
            that.defectSelected.hasAttachment = defectStandard.fileIds && defectStandard.fileIds.length > 0

            if (that.defectSelected.hasAttachment) {
                that.defectSelected.files = defectStandard.fileIds;
            }

            that._initDialog("kpmg.custom.pod.GDPodCustom.GDPodCustom.view.popup.ViewDefectPopup", oView, that.ViewDefectModel);
            
            var infoModel = that.MainPODcontroller.getInfoModel();
            const wbe = infoModel.getProperty("/selectedSFC/WBE") || "";
            const sfc = infoModel.getProperty("/selectedSFC/sfc") || "";
            const wc = infoModel.getProperty("/selectedSFC/WORKCENTER") || "";
            const material = infoModel.getProperty("/selectedSFC/material/material");

            that.ViewDefectModel.setProperty("/defect", that.defectSelected);
            that.ViewDefectModel.setProperty("/wbe", wbe);
            that.ViewDefectModel.setProperty("/sfc", sfc);
            that.ViewDefectModel.setProperty("/wc", wc);
            that.ViewDefectModel.setProperty("/defect/material", material);
            that.openDialog();
            
        },

        onAttachmentPress: function () {
            var that = this;
            var files = that.ViewDefectModel.getProperty("/defect/files");

            files.forEach(element => {
                that.downloadFile(element);
            });
        },

        downloadFile: function (idFile) {
            var that = this;

            let params = {
            };

            var infoModel = that.MainPODcontroller.getInfoModel();
            let BaseProxyURL = infoModel.getProperty("/BaseProxyURL");
            let pathOrderBomApi = "/api/nonconformance/v1/file/download?fileId=" + idFile;
            let url = BaseProxyURL+pathOrderBomApi; 

            // Callback di successo
            var successCallback = function(response) {
                console.log(response)
            };
            // Callback di errore
            var errorCallback = function(error) {
                console.log("Chiamata GET fallita:", error);
            };
            CommonCallManager.callProxy("GET", url, params, true, successCallback, errorCallback, that);
        },
        
        onClosePopup: function () {
            var that = this;   
            that.closeDialog();
        },

        formatDateTime: function(date) {
            var localeDate = new Date(date);
            var hh = localeDate.getHours();
            if (hh < 10) hh = '0' + hh;
            var mm = localeDate.getMinutes();
            if (mm < 10) mm = '0' + mm;
            var ss = localeDate.getSeconds();
            if (ss < 10) ss = '0' + ss;
            var day = localeDate.getDate();
            if (day < 10) day = '0' + day;
            var month = localeDate.getMonth() + 1;
            if (month < 10) month = '0' + month;
            var year = localeDate.getFullYear();
            if (year < 10) year = '0' + year;
            // Formato ISO 8601: dd/mm/yyyy HH:mm:ss
            return `${day}/${month}/${year} ${hh}:${mm}:${ss}`;
        },
    })
}
)