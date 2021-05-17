const xlsx = require('xlsx');
const path = require('path');

const exportExcel = async (data, workSheetColumnNames, workSheetName, filePath) => {
    const workBook = xlsx.utils.book_new();
    const workSheetData = [
        workSheetColumnNames,
        ... data
    ];
    const workSheet = xlsx.utils.aoa_to_sheet(workSheetData);
    xlsx.utils.book_append_sheet(workBook, workSheet, workSheetName);
    await xlsx.writeFileAsync(path.resolve(filePath), workBook, ()=>{});
}

const exportUsersToExcel = async (configs, workSheetColumnNames, workSheetName, filePath) => {
    const data = configs.map(config => {
        return [config.Selecao, config.Bebida, config.Medida_Def, config.Qtd_Def, config.PrecoMaq, config.TProd ];
    });
    await exportExcel(data, workSheetColumnNames, workSheetName, filePath);
}

module.exports = exportUsersToExcel;