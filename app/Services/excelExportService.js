const xlsx = require('xlsx');
const path = require('path');
const Helpers = use("Helpers");

const exportExcel = async (data, workSheetColumnNames, workSheetName, filePath) => {
    const workBook = xlsx.utils.book_new();
    let workSheetData
    let workSheet
    
    workSheetName.map((aba, i) => {
        workSheetData = [
            workSheetColumnNames,
            // ... data[i]
            ... data
        ]
        workSheet = xlsx.utils.aoa_to_sheet(workSheetData);
        xlsx.utils.book_append_sheet(workBook, workSheet, aba);
    })
    await xlsx.writeFileAsync(path.resolve(filePath), workBook, (e)=>{});
}

// const exportUsersToExcel = async (configs, workSheetColumnNames, workSheetName, filePath) => {
//     const data = configs.map(config => {
//         return [config.Selecao, config.Bebida, config.Medida_Def, config.Qtd_Def, config.PrecoMaq, config.TProd ];
//     });
//     await exportExcel(data, workSheetColumnNames, workSheetName, filePath);
// }

module.exports = exportExcel;

const dataTeste = [
[
    ['123456', 'Rua', 'Logradouro'],
    ['12345', 'Rua', 'Logradouro'],
    ['1234', 'Rua', 'Logradouro'],
    ['123', 'Rua', 'Logradouro'],
],
[
    ['abc', 'Rua', 'Logradouro'],
    ['abcd', 'Rua', 'Logradouro'],
    ['abcde', 'Rua', 'Logradouro'],
    ['abcdef', 'Rua', 'Logradouro'],
]
]

const workSheetColumnNamesTeste = ['Ativo', 'Desativado', 'Mais ou menos']

const workSheetNameTeste = ['Aba 1', 'Aba 2']

const caminho = Helpers.publicPath(`/excel-Teste.xlsx`)